import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; 
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'; 
import InputField from "../components/InputFields";
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

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Password Strength Checker
  const isStrongPassword = (password: string) => {
    // At least 8 chars, one uppercase, one lowercase, one number, one special char
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!isStrongPassword(newPassword)) {
      setError(
        "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character."
      );
      return;
    }

    try {
      setIsLoading(true);
      await changePasswordApi({ oldPassword: currentPassword, newPassword });
      alert("Password changed successfully. Please login again.");
      logout();
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
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 lg:p-10 shadow-2xl w-full">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
                Change Password
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Keep your account protected by choosing a strong password.
              </p>
            </div>

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
              {newPassword && !isStrongPassword(newPassword) && (
                <p className="text-red-400 text-xs mt-1">
                  Password must have 8+ chars, uppercase, lowercase, number & special char.
                </p>
              )}

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

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Changing..." : "Change Password"}
              </button>
            </form>

            <p className="text-center text-gray-400 text-xs sm:text-sm mt-3 sm:mt-4">
              Secure access to your next adventure.
            </p>

            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6">
              <Link
                to="/ForgotPassword"
                className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors"
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