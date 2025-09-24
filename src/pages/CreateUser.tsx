import React, { useState, useEffect } from "react";
import { Eye, Edit3, Check, Clock, User as UserIcon, Mail } from "lucide-react";
import InputField from "../components/InputFields";
import { createAgentApi, listAgentsApi, updateUserStatusApi } from "../api/agentApi";
import { toast } from "react-hot-toast";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "active" | "pending" | "inactive";
};

const StatusBadge = ({ status }: { status: User["status"] }) => {
  const statusConfig = {
    active: { icon: Check, text: "Active", bgClass: "bg-green-500/20", textClass: "text-green-400", iconClass: "text-green-400" },
    pending: { icon: Clock, text: "Pending", bgClass: "bg-yellow-500/20", textClass: "text-yellow-400", iconClass: "text-yellow-400" },
    inactive: { icon: Clock, text: "Inactive", bgClass: "bg-red-500/20", textClass: "text-red-400", iconClass: "text-red-400" },
  };
  const config = statusConfig[status];
  const IconComponent = config.icon;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgClass}`}>
      <IconComponent className={`w-4 h-4 ${config.iconClass}`} />
      <span className={`text-sm font-medium ${config.textClass}`}>{config.text}</span>
    </div>
  );
};

const CreateUser: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", temporaryPassword: "" });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    userId: string | null;
    newStatus: "active" | "inactive" | null;
  }>({ open: false, userId: null, newStatus: null });

  // ✅ Load real users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await listAgentsApi();
      const mappedUsers = res.map((u: any) => {
        const [firstName, ...rest] = u.name.split(" ");
        return {
          id: String(u.id),
          firstName,
          lastName: rest.join(" ") || "",
          email: u.email,
          status: u.status || "pending",
        };
      });
      setUsers(mappedUsers);
    } catch (err) {
      toast.error("Failed to fetch users");
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error("All fields are required!");
      return;
    }

    try {
      const name = `${formData.firstName} ${formData.lastName}`;
      const res = await createAgentApi({ name, email: formData.email });

      toast.success(`Agent created! Temp password: ${res.tempPassword}`);
      await fetchUsers(); // reload users after creation
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create agent");
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, temporaryPassword: "" });
    setIsFormVisible(true);
  };

  const resetForm = () => {
    setFormData({ firstName: "", lastName: "", email: "", temporaryPassword: "" });
    setEditingUser(null);
    setIsFormVisible(false);
  };

  const toggleUserStatus = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;

    const newStatus = user.status === "active" ? "inactive" : "active";
    setConfirmModal({ open: true, userId, newStatus });
  };

  const confirmStatusChange = async () => {
    if (!confirmModal.userId || !confirmModal.newStatus) return;

    try {
      await updateUserStatusApi(confirmModal.userId, confirmModal.newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === confirmModal.userId ? { ...u, status: confirmModal.newStatus! } : u
        )
      );
      toast.success(`User status updated to ${confirmModal.newStatus}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update status");
    } finally {
      setConfirmModal({ open: false, userId: null, newStatus: null });
    }
  };


  return (
    <div className="space-y-8">
      {/* --- User Form Section --- */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-white text-2xl font-bold">
            {editingUser ? `Editing ${editingUser.firstName}` : 'Create a New User'}
          </h1>
          {!isFormVisible && (
            <button
              onClick={() => { setEditingUser(null); setFormData({ firstName: '', lastName: '', email: '', temporaryPassword: '' }); setIsFormVisible(true); }}
              className="cursor-pointer px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-lg"
            >
              Add New User
            </button>
          )}
        </div>
        {isFormVisible && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                type="text"
                placeholder="First Name"
                value={formData.firstName}
                onChange={(value) => handleInputChange('firstName', value)}
                icon={<UserIcon />}
              />
              <InputField
                type="text"
                placeholder="Last Name"
                value={formData.lastName}
                onChange={(value) => handleInputChange('lastName', value)}
                icon={<UserIcon />}
              />
              <InputField
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                icon={<Mail />}
              />

            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={resetForm} className="cursor-pointer px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors">Discard</button>
              <button onClick={handleFormSubmit} className="cursor-pointer px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-lg">{editingUser ? 'Update User' : 'Create User'}</button>
            </div>
          </div>
        )}
      </div>

      {/* --- Users Table Section --- */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <h2 className="text-white text-2xl font-bold mb-6">Current Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-white/70 font-medium py-4 px-2">Name</th>
                <th className="text-center text-white/70 font-medium py-4 px-2">Status</th>
                <th className="text-center text-white/70 font-medium py-4 px-2 hidden sm:table-cell">Email</th>
                <th className="text-left text-white/70 font-medium py-4 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <span className="text-white font-medium">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <button onClick={() => toggleUserStatus(user.id)}><StatusBadge status={user.status} /></button>
                  </td>
                  <td className="py-4 px-2 text-white/80 hidden sm:table-cell">{user.email}</td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <button className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleEditClick(user)} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/80"><Edit3 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {confirmModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 w-[90%] max-w-md text-center">
            <h2 className="text-xl font-semibold text-white mb-4">
              Confirm Action
            </h2>
            <p className="text-white/80 mb-6">
              Are you sure you want to {confirmModal.newStatus === "active" ? "activate" : "deactivate"} this user?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmModal({ open: false, userId: null, newStatus: null })}
                className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmStatusChange}
                className="px-6 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-lg"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CreateUser;