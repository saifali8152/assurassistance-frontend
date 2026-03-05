import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; 
import { Lock, Eye, EyeOff } from "lucide-react";
import InputField from "../components/InputFields";
import { changePasswordApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";
import { ErrorHandler } from "../utils/errorHandler";
import { useFormValidation } from "../hooks/useFormValidation";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";

const ChangePassword: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { t } = useTranslation();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const toggleCurrentPasswordVisibility = () => setShowCurrentPassword(!showCurrentPassword);
  const toggleNewPasswordVisibility = () => setShowNewPassword(!showNewPassword);
  const toggleConfirmPasswordVisibility = () => setShowConfirmPassword(!showConfirmPassword);

  // Form validation
  const { fields, updateField, validateForm, getFormData } = useFormValidation({
    currentPassword: { required: true, message: 'Current password is required' },
    newPassword: { 
      required: true, 
      message: 'New password is required',
      custom: (value) => {
        if (value && !isStrongPassword(value)) {
          return 'Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.';
        }
        return null;
      }
    },
    confirmPassword: { 
      required: true, 
      message: 'Please confirm your password',
      custom: (value, currentFields) => {
        // Get the current newPassword value from the form state
        const currentNewPassword = currentFields?.newPassword?.value || '';
        if (!value) {
          return null; // Let required validation handle empty values
        }
        if (!currentNewPassword || currentNewPassword.trim() === '') {
          return 'Please enter new password first';
        }
        if (value !== currentNewPassword) {
          return 'Passwords do not match';
        }
        return null;
      }
    }
  });

  // Password Strength Checker
  const isStrongPassword = (password: string) => {
    // At least 8 chars, one uppercase, one lowercase, one number, one special char
    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPasswordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      ErrorHandler.showError("Please fix the form errors");
      return;
    }

    try {
      setIsLoading(true);
      const formData = getFormData();
      const response = await changePasswordApi({ 
        oldPassword: formData.currentPassword, 
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword 
      });
      
      // Update user context with new data (including updated force_password_change status)
      if (response.user) {
        updateUser(response.user);
      }
      
      ErrorHandler.showSuccess("Password changed successfully!");
      
      // Redirect to appropriate dashboard based on user role
      const userRole = response.user?.role || 'user';
      if (userRole === 'admin') {
        navigate("/admin-dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleApiError(err);
      ErrorHandler.showError(errorMessage);
      ErrorHandler.logError(err, 'ChangePassword');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="w-full h-screen fixed inset-0 overflow-hidden bg-white">
      {/* Subtle background pattern */}
      <div
        className="absolute inset-0 opacity-[0.02] bg-repeat w-full h-full"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h60v60H20z' stroke='%232B2B2B' stroke-width='0.5' fill='none'/%3E%3Cpath d='M30 30c10-5 20-5 30 0M25 50c15-10 25-10 40 0M35 70c10-3 15-3 25 0' stroke='%232B2B2B' stroke-width='0.3' fill='none'/%3E%3C/svg%3E")`,
        }}
      ></div>

      {/* Brand Logo - Centered at top */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 sm:top-6">
        <div className="flex items-center justify-center">
          <img src='/full-logo.png' alt="AssureAssistance" className="h-12 sm:h-16 md:h-20 object-contain" />
        </div>
      </div>

      {/* Language Selector - Top right */}
      <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">
        <LanguageSelector />
      </div>

      {/* Main Card - Full responsive container */}
      <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8 lg:p-10 shadow-2xl w-full">
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E4590F] mb-2">
                {t('adminDashboard.auth.changePassword.title')}
              </h2>
              <p className="text-[#2B2B2B]/70 text-sm sm:text-base font-normal">
                {t('adminDashboard.auth.changePassword.subtitle')}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <InputField
                label={t('adminDashboard.auth.changePassword.currentPassword')}
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder={t('adminDashboard.auth.changePassword.currentPasswordPlaceholder')}
                icon={<Lock />}
                value={fields.currentPassword.value}
                onChange={(value) => updateField('currentPassword', value)}
                externalError={fields.currentPassword.error}
                required
                rightIcon={showCurrentPassword ? <EyeOff /> : <Eye />}
                onRightIconClick={toggleCurrentPasswordVisibility}
              />

              <InputField
                label={t('adminDashboard.auth.changePassword.newPassword')}
                type={showNewPassword ? 'text' : 'password'}
                placeholder={t('adminDashboard.auth.changePassword.newPasswordPlaceholder')}
                icon={<Lock />}
                value={fields.newPassword.value}
                onChange={(value) => updateField('newPassword', value)}
                externalError={fields.newPassword.error}
                required
                rightIcon={showNewPassword ? <EyeOff /> : <Eye />}
                onRightIconClick={toggleNewPasswordVisibility}
              />

              <InputField
                label={t('adminDashboard.auth.changePassword.confirmPassword')}
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder={t('adminDashboard.auth.changePassword.confirmPasswordPlaceholder')}
                icon={<Lock />}
                value={fields.confirmPassword.value}
                onChange={(value) => updateField('confirmPassword', value)}
                externalError={fields.confirmPassword.error}
                required
                rightIcon={showConfirmPassword ? <EyeOff /> : <Eye />}
                onRightIconClick={toggleConfirmPasswordVisibility}
              />

              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer py-3 sm:py-4 bg-[#E4590F] hover:bg-[#C94A0D] text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden text-sm sm:text-base"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>{t('adminDashboard.auth.changePassword.changing')}</span>
                  </div>
                ) : (
                  t('adminDashboard.auth.changePassword.changeButton')
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;