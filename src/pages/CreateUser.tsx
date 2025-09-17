import React, { useState } from "react";
import { Eye, EyeOff, Edit3, Check, Clock, User as UserIcon, Mail, Lock } from "lucide-react";
import InputField from "../components/InputFields";

type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: 'active' | 'pending' | 'inactive';
  avatar: string;
};

const StatusBadge = ({ status }: { status: User['status'] }) => {
  const statusConfig = {
    active: { icon: Check, text: 'Active', bgClass: 'bg-green-500/20', textClass: 'text-green-400', iconClass: 'text-green-400' },
    pending: { icon: Clock, text: 'Pending', bgClass: 'bg-yellow-500/20', textClass: 'text-yellow-400', iconClass: 'text-yellow-400' },
    inactive: { icon: Clock, text: 'Inactive', bgClass: 'bg-red-500/20', textClass: 'text-red-400', iconClass: 'text-red-400' }
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
  const [users, setUsers] = useState<User[]>([
    { id: '1', firstName: 'Alex', lastName: 'Morgan', email: 'alex@travelsafe.io', status: 'active', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face' },
    { id: '2', firstName: 'Priya', lastName: 'Shah', email: 'priya@travelsafe.io', status: 'pending', avatar: 'https://unsplash.com/photos/a-woman-with-her-arm-up-kb6pDT5ft0s' },
    { id: '3', firstName: 'Diego', lastName: 'Lopez', email: 'diego@travelsafe.io', status: 'active', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' }
  ]);

  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', temporaryPassword: '' });
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = () => {
    if (editingUser) {
      if (formData.firstName && formData.lastName && formData.email) {
        setUsers(prev => prev.map(user => user.id === editingUser.id ? { ...user, ...formData } : user));
      }
    } else { 
       if (formData.firstName && formData.lastName && formData.email && formData.temporaryPassword) {
        const newUser: User = {
          id: Date.now().toString(),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          status: 'pending',
          avatar: `https://ui-avatars.com/api/?name=${formData.firstName}+${formData.lastName}&background=random`
        };
        setUsers(prev => [newUser, ...prev]);
      }
    }
    resetForm();
  };
  
  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setFormData({ firstName: user.firstName, lastName: user.lastName, email: user.email, temporaryPassword: '' });
    setIsFormVisible(true);
  };
  
  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', temporaryPassword: '' });
    setEditingUser(null);
    setIsFormVisible(false);
  };

  const toggleUserStatus = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, status: user.status === 'active' ? 'inactive' : 'active' } : user
    ));
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
              onClick={() => { setEditingUser(null); setFormData({ firstName: '', lastName: '', email: '', temporaryPassword: ''}); setIsFormVisible(true); }}
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
              <InputField
                type={showPassword ? 'text' : 'password'}
                placeholder={editingUser ? 'New Password (optional)' : 'Temporary Password'}
                value={formData.temporaryPassword}
                onChange={(value) => handleInputChange('temporaryPassword', value)}
                icon={<Lock />}
                rightIcon={showPassword ? <EyeOff /> : <Eye />}
                onRightIconClick={() => setShowPassword(prev => !prev)}
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
                      <img src={user.avatar} alt={user.firstName} className="w-10 h-10 rounded-full object-cover border-2 border-white/20" />
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
    </div>
  );
};

export default CreateUser;