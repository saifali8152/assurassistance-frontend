import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { changePasswordApi } from "../api/agentApi";
import { Lock, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

const EditPassword: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error("New password must be different from current password");
      return;
    }

    try {
      setLoading(true);
      await changePasswordApi(formData.currentPassword, formData.newPassword);
      toast.success("Password changed successfully");
      navigate(-1); // Go back to previous page
    } catch (error: any) {
      console.error("Failed to change password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field],
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white border border-[#D9D9D9] rounded-2xl p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-[#D9D9D9] hover:bg-[#E4590F] text-[#2B2B2B] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-[#E4590F]/10">
              <Lock className="w-6 h-6 text-[#E4590F]" />
            </div>
            <div>
              <h1 className="text-[#E4590F] text-xl sm:text-2xl font-semibold">
                {t("profile.editPassword", "Edit Password")}
              </h1>
              <p className="text-[#2B2B2B] text-sm font-normal">
                {t("profile.editPasswordDescription", "Update your account password")}
              </p>
            </div>
          </div>
        </div>

        {/* Password Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div className="space-y-2">
            <label className="text-[#2B2B2B] text-sm font-normal">
              {t("profile.currentPassword", "Current Password")} *
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 pr-12 bg-white border border-[#D9D9D9] rounded-2xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent transition-all duration-200"
                placeholder={t("profile.currentPasswordPlaceholder", "Enter your current password")}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#2B2B2B]/50 hover:text-[#E4590F] transition-colors"
              >
                {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-[#2B2B2B] text-sm font-normal">
              {t("profile.newPassword", "New Password")} *
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 pr-12 bg-white border border-[#D9D9D9] rounded-2xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent transition-all duration-200"
                placeholder={t("profile.newPasswordPlaceholder", "Enter your new password")}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#2B2B2B]/50 hover:text-[#E4590F] transition-colors"
              >
                {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-[#2B2B2B]/60 text-xs">
              {t("profile.passwordRequirements", "Password must be at least 6 characters long")}
            </p>
          </div>

          {/* Confirm New Password */}
          <div className="space-y-2">
            <label className="text-[#2B2B2B] text-sm font-normal">
              {t("profile.confirmNewPassword", "Confirm New Password")} *
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 pr-12 bg-white border border-[#D9D9D9] rounded-2xl text-[#2B2B2B] placeholder-[#2B2B2B]/40 focus:outline-none focus:ring-2 focus:ring-[#E4590F] focus:border-transparent transition-all duration-200"
                placeholder={t("profile.confirmPasswordPlaceholder", "Confirm your new password")}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#2B2B2B]/50 hover:text-[#E4590F] transition-colors"
              >
                {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Security Notice */}
          <div className="bg-[#E4590F]/10 border border-[#E4590F]/20 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-[#E4590F] mt-0.5" />
              <div>
                <h4 className="text-[#E4590F] font-medium text-sm mb-1">
                  {t("profile.securityNotice", "Security Notice")}
                </h4>
                <p className="text-[#2B2B2B] text-sm font-normal">
                  {t("profile.securityNoticeText", "For your security, please choose a strong password that you haven't used before. After changing your password, you'll need to log in again.")}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#D9D9D9]">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-[#D9D9D9] hover:bg-[#B8B8B8] text-[#2B2B2B] rounded-xl transition-colors font-medium"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-[#E4590F] hover:bg-[#C94A0D] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors font-medium"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Lock className="w-4 h-4" />
              )}
              {loading ? t("common.changing", "Changing...") : t("common.changePassword", "Change Password")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPassword;
