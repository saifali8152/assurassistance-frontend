import React, { useState, useEffect, useRef } from "react";
import { Check, Clock, User as UserIcon, Mail, Lock, Unlock, Key, Shield, ShieldCheck, ChevronDown, Filter } from "lucide-react";
import InputField from "../components/InputFields";
import { createAgentApi, listAgentsApi, updateUserStatusApi, sendPasswordResetLinkApi } from "../api/agentApi";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { formatDateTime, formatFullDateTime, getPasswordChangeStatus } from "../utils/dateUtils";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: "active" | "inactive";
  forcePasswordChange?: boolean | number;
  lastLogin?: string | null;
};

const StatusBadge = ({ status }: { status: User["status"] }) => {
  const { t } = useTranslation();
  const statusConfig = {
    active: { icon: Check, text: t("user.statusActive", "Active"), bgClass: "bg-green-500/20", textClass: "text-green-600", iconClass: "text-green-600" },
    inactive: { icon: Clock, text: t("user.statusInactive", "Inactive"), bgClass: "bg-red-500/20", textClass: "text-red-600", iconClass: "text-red-600" },
  };
  const config = statusConfig[status];
  const IconComponent = config.icon;
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.bgClass}`}>
      <IconComponent className={`w-4 h-4 ${config.iconClass}`} />
      <span className={`text-sm font-normal ${config.textClass}`}>{config.text}</span>
    </div>
  );
};

const PasswordChangeBadge = ({ forcePasswordChange }: { forcePasswordChange?: boolean | number }) => {
  const passwordStatus = getPasswordChangeStatus(forcePasswordChange);
  const IconComponent = passwordStatus.status === 'changed' ? ShieldCheck : Shield;
  
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${passwordStatus.bgColor}`}>
      <IconComponent className={`w-4 h-4 ${passwordStatus.color}`} />
      <span className={`text-sm font-normal ${passwordStatus.color}`}>{passwordStatus.text}</span>
    </div>
  );
};

const CreateUser: React.FC = () => {
  const { t } = useTranslation(); // <-- Add this
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", temporaryPassword: "" });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  
  // Pagination state
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    userId: string | null;
    newStatus: "active" | "inactive" | null;
  }>({ open: false, userId: null, newStatus: null });

  // ✅ Load real users from backend
  useEffect(() => {
    fetchUsers();
  }, []);

  // Handle search and filter changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchUsers(1);
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setStatusDropdownOpen(false);
      }
    };

    if (statusDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [statusDropdownOpen]);

  const fetchUsers = async (page = pagination.currentPage) => {
    setIsLoading(true);
    try {
      const res = await listAgentsApi({
        page,
        limit: pagination.itemsPerPage,
        search: searchTerm,
        status: statusFilter
      });
      
      if ((res as any).success && (res as any).data) {
        const mappedUsers = (res as any).data.agents.map((u: any) => {
          const [firstName, ...rest] = u.name.split(" ");
          return {
            id: String(u.id),
            firstName,
            lastName: rest.join(" ") || "",
            email: u.email,
            status: u.status || "pending",
            forcePasswordChange: u.force_password_change,
            lastLogin: u.last_login,
          };
        });
        setUsers(mappedUsers);
        setPagination((res as any).data.pagination);
      }
    } catch (err) {
      toast.error(t("agent.failedFetch", "Failed to fetch agents"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const [passwordModal, setPasswordModal] = useState<{
    open: boolean;
    password: string;
    userEmail: string;
  }>({ open: false, password: "", userEmail: "" });

  const handleFormSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error(t("agent.allFieldsRequired", "All fields are required!"));
      return;
    }

    setIsCreating(true);
    try {
      const name = `${formData.firstName} ${formData.lastName}`;
      const res = await createAgentApi({ name, email: formData.email });

      // Instead of toast, show modal with password
      setPasswordModal({
        open: true,
        password: res.tempPassword,
        userEmail: formData.email
      });

      await fetchUsers(); // reload users after creation
      resetForm();
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("agent.failedCreate", "Failed to create agent"));
    } finally {
      setIsCreating(false);
    }
  };
  const closePasswordModal = () => {
    setPasswordModal({ open: false, password: "", userEmail: "" });
  };
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("user.passwordCopied", "Password copied to clipboard!"));
    } catch (err) {
      toast.error(t("user.failedCopy", "Failed to copy password"));
    }
  };

  const handleSendPasswordReset = async (userId: string) => {
    setIsResettingPassword(true);
    try {
      const response = await sendPasswordResetLinkApi(userId);
      // Show modal with new temporary password
      setPasswordModal({
        open: true,
        password: response.tempPassword,
        userEmail: users.find(u => u.id === userId)?.email || ""
      });
      toast.success(t("agent.newPasswordSent", "New temporary password sent to agent's email"));
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("agent.failedSendReset", "Failed to send reset link"));
    } finally {
      setIsResettingPassword(false);
    }
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

    setIsUpdating(true);
    try {
      await updateUserStatusApi(confirmModal.userId, confirmModal.newStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === confirmModal.userId ? { ...u, status: confirmModal.newStatus! } : u
        )
      );
      toast.success(
        t("agent.statusUpdated", "Agent status updated")
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || t("agent.failedUpdateStatus", "Failed to update status"));
    } finally {
      setIsUpdating(false);
      setConfirmModal({ open: false, userId: null, newStatus: null });
    }
  };


  return (
    <div className="space-y-8">
      {/* --- User Form Section --- */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h1 className="text-[#E4590F] text-xl sm:text-2xl font-semibold">
            {editingUser ? `Editing ${editingUser.firstName}` : t("agent.createNew", "Create a New Agent")}
          </h1>
          {!isFormVisible && (
            <button
              onClick={() => { setEditingUser(null); setFormData({ firstName: '', lastName: '', email: '', temporaryPassword: '' }); setIsFormVisible(true); }}
              className="cursor-pointer px-6 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors"
            >
              {t("agent.addNew", "Add New Agent")}
            </button>
          )}
        </div>
        {isFormVisible && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField
                type="text"
                placeholder={t("agent.firstName", "First Name") + " *"}
                value={formData.firstName}
                onChange={(value) => handleInputChange('firstName', value)}
                icon={<UserIcon />}
              />
              <InputField
                type="text"
                placeholder={t("agent.lastName", "Last Name") + " *"}
                value={formData.lastName}
                onChange={(value) => handleInputChange('lastName', value)}
                icon={<UserIcon />}
              />
              <InputField
                type="email"
                placeholder={t("agent.email", "Email") + " *"}
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                icon={<Mail />}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={resetForm} className="cursor-pointer px-6 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] font-medium transition-colors">
                {t("user.discard", "Discard")}
              </button>
              <button 
                onClick={handleFormSubmit} 
                disabled={isCreating}
                className="cursor-pointer px-6 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] disabled:bg-[#E4590F]/50 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
              >
                {isCreating && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                {editingUser ? t("agent.update", "Update Agent") : t("agent.create", "Create Agent")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Users Table Section --- */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-[#E4590F] text-xl sm:text-2xl font-semibold">{t("agent.currentAgents", "Current Agents")}</h2>
          
          {/* Search and Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder={t("agent.search", "Search agents...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-white border border-[#D9D9D9] rounded-xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent transition-all duration-200"
            />
            {/* Status Filter Dropdown */}
            <div className="relative" ref={statusDropdownRef}>
              <button
                onClick={() => setStatusDropdownOpen(!statusDropdownOpen)}
                className="flex items-center gap-3 bg-white border border-[#D9D9D9] rounded-xl px-4 py-2.5 hover:border-[#E4590F] transition-all duration-200 min-w-[150px] cursor-pointer group"
                type="button"
              >
                <Filter className="w-5 h-5 text-[#E4590F] group-hover:text-[#C94A0D] transition-colors flex-shrink-0" />
                <span className="text-[#2B2B2B] text-sm font-medium flex-1 text-left">
                  {statusFilter === "" 
                    ? t("agent.allStatus", "All Status")
                    : statusFilter === "active"
                    ? t("agent.statusActive", "Active")
                    : t("agent.statusInactive", "Inactive")
                  }
                </span>
                <ChevronDown 
                  className={`w-4 h-4 text-[#2B2B2B]/60 group-hover:text-[#E4590F] transition-all duration-200 flex-shrink-0 ${
                    statusDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Dropdown Menu */}
              {statusDropdownOpen && (
                <div className="absolute top-full mt-2 right-0 w-full bg-white border border-[#D9D9D9] rounded-xl shadow-lg z-50 overflow-hidden animate-fadeIn">
                  <div className="py-1.5">
                    <button
                      onClick={() => {
                        setStatusFilter("");
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                        statusFilter === ""
                          ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                          : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                      }`}
                      type="button"
                    >
                      <span>{t("agent.allStatus", "All Status")}</span>
                      {statusFilter === "" && (
                        <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("active");
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                        statusFilter === "active"
                          ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                          : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                      }`}
                      type="button"
                    >
                      <span>{t("agent.statusActive", "Active")}</span>
                      {statusFilter === "active" && (
                        <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setStatusFilter("inactive");
                        setStatusDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-left text-sm font-normal transition-all duration-150 ${
                        statusFilter === "inactive"
                          ? 'bg-[#E4590F]/10 text-[#E4590F] font-medium'
                          : 'text-[#2B2B2B] hover:bg-[#D9D9D9]/30 hover:text-[#E4590F]'
                      }`}
                      type="button"
                    >
                      <span>{t("agent.statusInactive", "Inactive")}</span>
                      {statusFilter === "inactive" && (
                        <Check className="w-4 h-4 text-[#E4590F] flex-shrink-0" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("");
                fetchUsers(1);
              }}
              className="px-4 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
            >
              {t("agent.search", "Search")}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
              <div className="flex items-center gap-3 text-[#2B2B2B]">
                <div className="w-6 h-6 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin"></div>
                <span>{t("agent.loading", "Loading agents...")}</span>
              </div>
            </div>
          )}
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9D9D9]">
                <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">{t("agent.name", "Name")}</th>
                <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden sm:table-cell">{t("agent.email", "Email")}</th>
                <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden lg:table-cell">{t("agent.passwordStatus", "Password")}</th>
                <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden sm:table-cell">{t("agent.status", "Status")}</th>
                <th className="text-center text-[#2B2B2B]/70 font-normal py-4 px-2 hidden lg:table-cell">{t("agent.lastLogin", "Last Login")}</th>
                <th className="text-left text-[#2B2B2B]/70 font-normal py-4 px-2">{t("agent.actions", "Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-[#D9D9D9] hover:bg-secondary/30 transition-colors">
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[#2B2B2B] font-normal">{user.firstName} {user.lastName}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-[#2B2B2B]/80 hidden sm:table-cell">{user.email}</td>
                  <td className="py-4 px-2 hidden lg:table-cell">
                    <PasswordChangeBadge forcePasswordChange={user.forcePasswordChange} />
                  </td>
                  <td className="py-4 px-2">
                    <button type="button" onClick={() => toggleUserStatus(user.id)}><StatusBadge status={user.status} /></button>
                  </td>
                  
                  <td className="py-4 px-2 text-[#2B2B2B]/80 hidden lg:table-cell">
                    <div className="text-center">
                      <div className="text-sm" title={formatFullDateTime(user.lastLogin)}>
                        {formatDateTime(user.lastLogin)}
                      </div>
                    </div>
                  </td>
                  
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleSendPasswordReset(user.id)} 
                        disabled={isResettingPassword}
                        className="p-2 rounded-lg bg-[#E4590F]/10 hover:bg-[#E4590F]/20 text-[#E4590F] hover:text-[#C94A0D] transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                        title={t("agent.sendResetLink", "Send Password Reset Link")}
                      >
                        {isResettingPassword ? (
                          <div className="w-4 h-4 border-2 border-[#E4590F]/30 border-t-[#E4590F] rounded-full animate-spin"></div>
                        ) : (
                          <Key className="w-4 h-4" />
                        )}
                      </button>
                      <button 
                        onClick={() => toggleUserStatus(user.id)} 
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${
                          user.status === 'active' 
                            ? 'bg-red-500/20 hover:bg-red-500/30 text-red-600 hover:text-red-700' 
                            : 'bg-green-500/20 hover:bg-green-500/30 text-green-600 hover:text-green-700'
                        }`}
                        title={user.status === 'active' ? t("agent.lockAgent", "Lock Agent") : t("agent.unlockAgent", "Unlock Agent")}
                      >
                        {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-6 border-t border-[#D9D9D9]">
          <div className="text-[#2B2B2B]/70 text-sm">
            {t("agent.showing", "Showing")} {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} - {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} {t("agent.of", "of")} {pagination.totalItems} {t("agent.agents", "agents")}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchUsers(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
              className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] disabled:bg-[#D9D9D9]/50 disabled:text-[#2B2B2B]/30 text-[#2B2B2B] rounded-xl transition-colors disabled:cursor-not-allowed font-medium"
            >
              {t("agent.previous", "Previous")}
            </button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pagination.totalPages - 4, pagination.currentPage - 2)) + i;
                if (pageNum > pagination.totalPages) return null;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => fetchUsers(pageNum)}
                    className={`px-3 py-2 rounded-xl transition-colors font-medium ${
                      pageNum === pagination.currentPage
                        ? 'bg-[#E4590F] text-white'
                        : 'bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => fetchUsers(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
              className="px-3 py-2 bg-[#D9D9D9] hover:bg-[#B8B8B8] disabled:bg-[#D9D9D9]/50 disabled:text-[#2B2B2B]/30 text-[#2B2B2B] rounded-xl transition-colors disabled:cursor-not-allowed font-medium"
            >
              {t("agent.next", "Next")}
            </button>
          </div>
        </div>
      </div>
      {confirmModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 w-[90%] max-w-md text-center">
            <h2 className="text-xl font-semibold text-[#E4590F] mb-4">
              {t("user.confirmAction", "Confirm Action")}
            </h2>
            <p className="text-[#2B2B2B]/80 mb-6 font-normal">
              {t("agent.confirmStatus", "Are you sure you want to change this agent's status?")}
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setConfirmModal({ open: false, userId: null, newStatus: null })}
                className="px-6 py-2 rounded-xl bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] transition-colors cursor-pointer font-medium"
              >
                {t("user.cancel", "Cancel")}
              </button>
              <button
                onClick={confirmStatusChange}
                disabled={isUpdating}
                className="px-6 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] disabled:bg-[#E4590F]/50 disabled:cursor-not-allowed text-white font-medium transition-colors cursor-pointer flex items-center gap-2"
              >
                {isUpdating && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                {t("agent.confirm", "Confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Password Display Modal */}
      {passwordModal.open && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 w-[90%] max-w-md">
            <h2 className="text-xl font-semibold text-[#E4590F] mb-4 text-center">
              {passwordModal.userEmail === formData.email ? 
                t("user.createdSuccess", "User Created Successfully!") : 
                t("agent.passwordReset", "Password Reset Successfully!")
              }
            </h2>

            <div className="space-y-4">
              <p className="text-[#2B2B2B] font-medium text-center bg-[#E4590F]/10 rounded-xl p-2">
                {passwordModal.userEmail}
              </p>

              <div className="bg-white border border-[#D9D9D9] rounded-xl p-4">
                <label className="block text-[#2B2B2B]/70 text-sm mb-2 font-normal">
                  {passwordModal.userEmail === formData.email ? 
                    t("user.tempPassword", "Temporary Password:") : 
                    t("agent.newTempPassword", "New Temporary Password:")
                  }
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={passwordModal.password}
                    readOnly
                    className="flex-1 bg-white border border-[#D9D9D9] rounded-xl px-3 py-2 text-[#2B2B2B] font-mono text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(passwordModal.password)}
                    className="px-3 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white text-sm font-medium transition-colors cursor-pointer"
                  >
                    {t("user.copy", "Copy")}
                  </button>
                </div>
              </div>

              <div className="bg-[#E4590F]/10 border border-[#E4590F]/20 rounded-xl p-3">
                <p className="text-[#E4590F] text-sm text-center font-normal">
                  {t("user.savePassword", "⚠️ Please save this password securely. It won't be shown again.")}
                </p>
              </div>
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={closePasswordModal}
                className="px-6 py-2 rounded-xl bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium transition-colors cursor-pointer"
              >
                {t("user.gotIt", "Got it!")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default CreateUser;