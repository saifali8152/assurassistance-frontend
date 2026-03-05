import React, { useState } from "react";
import { Mail, Lock, ShieldCheck } from "lucide-react";
import InputField from "../components/InputFields";
import { Link, useNavigate } from "react-router-dom";
import {
  sendResetCodeApi,
  verifyResetCodeApi,
  resetPasswordApi,
} from "../api/authApi";
import LoadingSpinner from "../components/LoadingSpinner";
import { ErrorHandler } from "../utils/errorHandler";
import { useFormValidation, validationRules } from "../hooks/useFormValidation";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState(1); // 1 = email, 2 = verify code, 3 = reset password
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const isStrongPassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );
  };

  // Form validation for each step
  const { fields, updateField, getFormData } = useFormValidation({
    email: validationRules.email,
    code: {
      required: true,
      message: "Verification code is required",
      custom: (value) => {
        if (value && value.length !== 6) {
          return "Verification code must be 6 digits";
        }
        return null;
      },
    },
    newPassword: {
      required: true,
      message: "New password is required",
      custom: (value) => {
        if (value && !isStrongPassword(value)) {
          return "Password must be at least 8 characters long, include uppercase, lowercase, number, and special character.";
        }
        return null;
      },
    },
    confirmPassword: {
      required: true,
      message: "Please confirm your password",
      custom: (value, currentFields) => {
        const newPassword = currentFields?.newPassword?.value || '';
        if (!value) {
          return null; // Let required validation handle empty values
        }
        if (!newPassword || newPassword.trim() === '') {
          return "Please enter new password first";
        }
        if (value !== newPassword) {
          return "Passwords do not match";
        }
        return null;
      },
    },
  });

  // Step 1: Send Reset Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate only email field for step 1
    if (!fields.email.value || fields.email.error) {
      ErrorHandler.showError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const formData = getFormData();
      await sendResetCodeApi({ email: formData.email });
      ErrorHandler.showSuccess("Reset code sent to your email");
      setStep(2);
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleApiError(err);
      ErrorHandler.showError(errorMessage);
      ErrorHandler.logError(err, "ForgotPassword-SendCode");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate only code field for step 2
    if (!fields.code.value || fields.code.error) {
      ErrorHandler.showError("Please enter a valid verification code");
      return;
    }

    setIsLoading(true);
    try {
      const formData = getFormData();
      await verifyResetCodeApi({ email: formData.email, code: formData.code });
      ErrorHandler.showSuccess("Code verified successfully");
      setStep(3);
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleApiError(err);
      ErrorHandler.showError(errorMessage);
      ErrorHandler.logError(err, "ForgotPassword-VerifyCode");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password fields for step 3
    if (!fields.newPassword.value || fields.newPassword.error || 
        !fields.confirmPassword.value || fields.confirmPassword.error) {
      ErrorHandler.showError("Please fix the password fields");
      return;
    }

    setIsLoading(true);
    try {
      const formData = getFormData();
      await resetPasswordApi({
        email: formData.email,
        code: formData.code,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });
      ErrorHandler.showSuccess("Password reset successful. Please login.");
      navigate("/login");
    } catch (err: any) {
      const errorMessage = ErrorHandler.handleApiError(err);
      ErrorHandler.showError(errorMessage);
      ErrorHandler.logError(err, "ForgotPassword-ResetPassword");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen fixed inset-0 overflow-hidden bg-white">
      {/* Language Selector - Top right */}
      <div className="absolute top-6 right-6 z-10 sm:top-8 sm:right-8">
        <LanguageSelector />
      </div>

      <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-8 sm:p-10 lg:p-12 w-full">
            {/* Brand Logo - Inside card */}
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <img src='/full-logo.png' alt="AssureAssistance" className="h-14 sm:h-16 md:h-20 object-contain" />
            </div>
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E4590F] mb-3">
                {step === 1 && t('adminDashboard.auth.forgotPassword.title')}
                {step === 2 && t('adminDashboard.auth.forgotPassword.verifyCode')}
                {step === 3 && t('adminDashboard.auth.forgotPassword.resetPassword')}
              </h2>
              <p className="text-[#2B2B2B] text-base sm:text-lg font-normal">
                {step === 1 && t('adminDashboard.auth.forgotPassword.subtitle')}
                {step === 2 && t('adminDashboard.auth.forgotPassword.verifySubtitle')}
                {step === 3 && t('adminDashboard.auth.forgotPassword.resetSubtitle')}
              </p>
            </div>

            {step === 1 && (
              <form
                onSubmit={handleSendCode}
                className="space-y-4 sm:space-y-6"
              >
                <InputField
                  label={t('adminDashboard.auth.forgotPassword.email')}
                  type="email"
                  name="email"
                  validationType="email"
                  placeholder={t('adminDashboard.auth.forgotPassword.emailPlaceholder')}
                  icon={<Mail />}
                  value={fields.email.value}
                  onChange={(value) => updateField("email", value)}
                  externalError={fields.email.error}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full cursor-pointer py-3.5 sm:py-4 bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>{t('adminDashboard.auth.forgotPassword.sending')}</span>
                    </div>
                  ) : (
                    t('adminDashboard.auth.forgotPassword.sendCode')
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form
                onSubmit={handleVerifyCode}
                className="space-y-4 sm:space-y-6"
              >
                <InputField
                  label={t('adminDashboard.auth.forgotPassword.verificationCode')}
                  type="text"
                  placeholder={t('adminDashboard.auth.forgotPassword.codePlaceholder')}
                  icon={<ShieldCheck />}
                  value={fields.code.value}
                  onChange={(value) => updateField("code", value)}
                  externalError={fields.code.error}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full cursor-pointer py-3.5 sm:py-4 bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>{t('adminDashboard.auth.forgotPassword.verifying')}</span>
                    </div>
                  ) : (
                    t('adminDashboard.auth.forgotPassword.verifyCode')
                  )}
                </button>
              </form>
            )}

            {step === 3 && (
              <form
                onSubmit={handleResetPassword}
                className="space-y-4 sm:space-y-6"
              >
                <InputField
                  label={t('adminDashboard.auth.forgotPassword.newPassword')}
                  type="password"
                  placeholder={t('adminDashboard.auth.forgotPassword.newPasswordPlaceholder')}
                  icon={<Lock />}
                  value={fields.newPassword.value}
                  onChange={(value) => updateField("newPassword", value)}
                  externalError={fields.newPassword.error}
                  required
                />
                <InputField
                  label={t('adminDashboard.auth.forgotPassword.confirmPassword')}
                  type="password"
                  placeholder={t('adminDashboard.auth.forgotPassword.confirmPasswordPlaceholder')}
                  icon={<Lock />}
                  value={fields.confirmPassword.value}
                  onChange={(value) => updateField("confirmPassword", value)}
                  externalError={fields.confirmPassword.error}
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full cursor-pointer py-3.5 sm:py-4 bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <LoadingSpinner size="sm" color="white" />
                      <span>{t('adminDashboard.auth.forgotPassword.resetting')}</span>
                    </div>
                  ) : (
                    t('adminDashboard.auth.forgotPassword.resetPassword')
                  )}
                </button>
              </form>
            )}

            <p className="text-center text-[#2B2B2B]/60 text-sm mt-6">
              {t('adminDashboard.auth.forgotPassword.secureMessage')}
            </p>

            <div className="flex flex-col sm:flex-row justify-center items-center mt-6 space-y-2 sm:space-y-0">
              <Link
                to="/login"
                className="text-[#E4590F] hover:text-[#C94A0D] text-sm font-normal transition-colors"
              >
                {t('adminDashboard.auth.forgotPassword.backToLogin')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
