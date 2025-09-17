import React, { useState } from "react";
import { Link } from 'react-router-dom'; 
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; 
import InputField from "../components/InputFields";

import { useNavigate } from "react-router-dom";
import { changePasswordApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";

const ChangePassword: React.FC = () => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();


  const toggleCurrentPasswordVisibility = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };
  
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await changePasswordApi({ oldPassword: currentPassword, newPassword });
      alert("Password changed successfully. Please login again.");
      logout();  // force user to re-login
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen fixed inset-0 overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 left-4 sm:top-10 sm:left-10 w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
        <div className="absolute top-8 right-8 sm:top-20 sm:right-20 w-1 h-1 bg-white rounded-full animate-ping"></div>
        <div className="absolute bottom-8 left-8 sm:bottom-20 sm:left-20 w-1.5 h-1.5 bg-blue-300 rounded-full animate-pulse"></div>
        <div className="absolute bottom-4 right-4 sm:bottom-10 sm:right-10 w-2 h-2 bg-white rounded-full animate-ping"></div>

        {/* Additional animated elements for larger screens */}
        <div className="hidden md:block absolute top-1/3 left-1/4 w-1 h-1 bg-blue-200 rounded-full animate-pulse"></div>
        <div className="hidden lg:block absolute bottom-1/3 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping"></div>
      </div>
      <div
        className="absolute inset-0 opacity-5 bg-repeat w-full h-full"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h60v60H20z' stroke='%23ffffff' stroke-width='0.5' fill='none'/%3E%3Cpath d='M30 30c10-5 20-5 30 0M25 50c15-10 25-10 40 0M35 70c10-3 15-3 25 0' stroke='%23ffffff' stroke-width='0.3' fill='none'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Animated Airplane */}
      <div className="absolute top-1/4 left-0 w-full h-1 overflow-hidden">
        <div
          className="absolute left-0 top-0 w-4 h-1 bg-blue-400 opacity-30 animate-pulse"
          style={{
            animation: "fly 20s linear infinite",
            clipPath: "polygon(0 50%, 100% 0, 80% 50%, 100% 100%)"
          }}
        ></div>
      </div>

      {/* Brand Logo - Responsive positioning */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 sm:top-6 lg:top-8">
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-sm opacity-90"></div>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
            AssureAssistance
          </h1>
        </div>
      </div>

      {/* Main Login Card - Full responsive container */}
      <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          {/* Glassmorphism Card - Responsive padding and sizing */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl w-full">
            {/* Welcome Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Change Password</h2>
              <p className="text-gray-300 text-sm sm:text-base">Keep your account protected by choosing a strong password.</p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <InputField
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Current Password"
                icon={<LockClosedIcon />}
                value={currentPassword}
                onChange={setCurrentPassword}
                required
                rightIcon={showCurrentPassword ? <EyeSlashIcon /> : <EyeIcon />}
                onRightIconClick={toggleCurrentPasswordVisibility}
              />

              <InputField
                type={showNewPassword ? 'text' : 'password'}
                placeholder="New Password"
                icon={<LockClosedIcon />}
                value={newPassword}
                onChange={setNewPassword}
                required
                rightIcon={showNewPassword ? <EyeSlashIcon /> : <EyeIcon />}
                onRightIconClick={toggleNewPasswordVisibility}
              />

              <InputField
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirm Password"
                icon={<LockClosedIcon />}
                value={confirmPassword}
                onChange={setConfirmPassword}
                required
                rightIcon={showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                onRightIconClick={toggleConfirmPasswordVisibility}
              />

              {/* Change Password Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden text-sm sm:text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Changing...</span>
                  </div>
                ) : (
                  "Change Password"
                )}
                {/* Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 hover:opacity-20 transition-opacity duration-200 rounded-xl"></div>
              </button>
            </form>

              {/* Secure Access Message */}
              <p className="text-center text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
                Secure access to your next adventure.
              </p>

              {/* Sign up and Forgot Password Links */}
              <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 space-y-2 sm:space-y-0">
                <Link
                  to="/ForgotPassword"
                  className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto text-center sm:text-right"
                >
                  Forgot Password
                </Link>
              </div>
            </div>
          </div>
        </div>

      <style>{`
        @keyframes fly {
          0% {
            transform: translateX(-100px);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateX(calc(100vw + 100px));
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ChangePassword;