import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getProfileApi, updateProfileApi } from "../api/agentApi";
import { useAuth } from "../context/AuthContext";
import { User, ArrowLeft, Save } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "react-hot-toast";

interface ProfileData {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
  last_login: string;
}

const EditProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfileApi();
      setProfile(data);
      setFormData({ name: data.name });
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }

    try {
      setSaving(true);
      await updateProfileApi(formData.name.trim());
      
      // Update the user context with new name
      if (user) {
        updateUser({ ...user, name: formData.name.trim() });
      }
      
      toast.success("Profile updated successfully");
      // navigate(-1); // Go back to previous page
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-blue-500/20">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-white text-2xl font-bold">
                {t("profile.editProfile", "Edit Profile")}
              </h1>
              <p className="text-white/60 text-sm">
                {t("profile.editProfileDescription", "Update your personal information")}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("profile.name", "Full Name")} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50"
                placeholder={t("profile.namePlaceholder", "Enter your full name")}
              />
            </div>

            {/* Email Field (Read-only) */}
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("profile.email", "Email Address")}
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                readOnly
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-not-allowed"
                placeholder={t("profile.emailPlaceholder", "Email address")}
              />
              <p className="text-white/50 text-xs">
                {t("profile.emailReadonly", "Email cannot be changed")}
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("profile.role", "Role")}
              </label>
              <input
                type="text"
                value={profile?.role || ""}
                readOnly
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-not-allowed capitalize"
              />
            </div>

            <div className="space-y-2">
              <label className="text-white/80 text-sm font-medium">
                {t("profile.memberSince", "Member Since")}
              </label>
              <input
                type="text"
                value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ""}
                readOnly
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/60 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
            >
              {t("common.cancel", "Cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saving ? t("common.saving", "Saving...") : t("common.save", "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
