//login page
import React, { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import InputField from "../components/InputFields";
import { useNavigate } from "react-router-dom";
import { loginApi } from "../api/authApi";
import { useAuth } from "../context/AuthContext";
import { Link } from 'react-router-dom';
import LoadingSpinner from "../components/LoadingSpinner";
import { ErrorHandler } from "../utils/errorHandler";
import { useFormValidation, validationRules } from "../hooks/useFormValidation";
import { useTranslation } from "react-i18next";
import LanguageSelector from "../components/LanguageSelector";
const Login: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useTranslation();
  
  // Form validation
  const { fields, updateField, validateForm, getFormData } = useFormValidation({
    email: validationRules.email,
    password: { required: true, message: 'Password is required' }
  });


const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate form
  if (!validateForm()) {
    ErrorHandler.showError("Please fix the form errors");
    return;
  }

  setIsLoading(true);

  try {
    const formData = getFormData();
    const res = await loginApi({ email: formData.email, password: formData.password });
    login(res);

    // Show success message
    ErrorHandler.showSuccess("Login successful!");

    // Force password change check FIRST
    if (res.user.force_password_change) {
      navigate("/change-password");
    } 
    // Then role-based navigation
    else if (res.user.role && res.user.role.toLowerCase() === "admin") {
      navigate("/admin");
    } 
    else {
      navigate("/user");
    }
  } catch (err: any) {
    const errorMessage = ErrorHandler.handleApiError(err);
    ErrorHandler.showError(errorMessage);
    ErrorHandler.logError(err, 'Login');
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

      {/* Main Login Card - Full responsive container */}
      <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl">
          {/* Card - Modern clean design */}
          <div className="bg-white border border-[#D9D9D9] rounded-2xl p-8 sm:p-10 lg:p-12 w-full">
            {/* Brand Logo - Inside card */}
            <div className="flex items-center justify-center mb-6 sm:mb-8">
              <img src='/full-logo.png' alt="AssureAssistance" className="h-14 sm:h-16 md:h-20 object-contain" />
            </div>
            {/* Welcome Header */}
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-[#E4590F] mb-3">{t('adminDashboard.auth.login.title')}</h2>
              <p className="text-[#2B2B2B] text-base sm:text-lg font-normal">{t('adminDashboard.auth.login.subtitle')}</p>
            </div>
            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              {/* Email field */}
              <InputField
                label={t('adminDashboard.auth.login.email')}
                type="email"
                name="email"
                validationType="email"
                placeholder={t('adminDashboard.auth.login.emailPlaceholder')}
                icon={<Mail />}
                value={fields.email.value}
                onChange={(value) => updateField('email', value)}
                required
              />
              {/* {fields.email.error && (
                <p className="text-red-400 text-xs mt-1">{fields.email.error}</p>
              )}
               */}
              {/* Password Field */}
              <InputField
                label={t('adminDashboard.auth.login.password')}
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder={t('adminDashboard.auth.login.passwordPlaceholder')}
                icon={<Lock />}
                rightIcon={showPassword ? <EyeOff /> : <Eye />}
                onRightIconClick={() => setShowPassword(!showPassword)}
                value={fields.password.value}
                onChange={(value) => updateField('password', value)}
                required
              />
              {/* {fields.password.error && (
                <p className="text-red-400 text-xs mt-1">{fields.password.error}</p>
              )} */}

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer py-3.5 sm:py-4 bg-[#E4590F] hover:bg-[#C94A0D] text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <LoadingSpinner size="sm" color="white" />
                    <span>{t('adminDashboard.auth.login.signingIn')}</span>
                  </div>
                ) : (
                  t('adminDashboard.auth.login.loginButton')
                )}
              </button>
            </form>

            {/* Secure Access Message */}
            <p className="text-center text-[#2B2B2B]/60 text-sm mt-6">
              {t('adminDashboard.auth.login.secureMessage')}
            </p>

            {/* Sign up and Forgot Password Links */}
            <div className="flex flex-col sm:flex-row justify-center items-center mt-6 space-y-2 sm:space-y-0">
              <Link
                to="/forgot-password"
                className="text-[#E4590F] hover:text-[#C94A0D] text-sm font-normal transition-colors"
              >
                {t('adminDashboard.auth.login.forgotPassword')}
              </Link>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Login;