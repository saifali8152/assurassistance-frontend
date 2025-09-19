import React, { useState } from "react";
import { Mail, Lock } from "lucide-react";
import InputField from "../components/InputFields";
import { Link, useNavigate } from "react-router-dom";
import { sendResetCodeApi, verifyResetCodeApi, resetPasswordApi } from "../api/authApi";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1 = email, 2 = verify code, 3 = reset password
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isStrongPassword = (password: string) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(password);
  };

  // Step 1: Send Reset Code
  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await sendResetCodeApi({ email });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send code");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify Code
  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await verifyResetCodeApi({ email, code });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || "Invalid verification code");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!isStrongPassword(newPassword)) {
      setError("Password must be at least 8 chars, include uppercase, lowercase, number & special char.");
      return;
    }

    setIsLoading(true);
    try {
      await resetPasswordApi({ email, code, newPassword });
      alert("Password reset successful. Please login.");
      navigate("/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 p-4">
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-4 text-center">
          {step === 1 && "Forgot Password"}
          {step === 2 && "Verify Code"}
          {step === 3 && "Reset Password"}
        </h2>

        {error && <p className="text-red-400 text-sm text-center mb-3">{error}</p>}

        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-4">
            <InputField
              type="email"
              placeholder="Email"
              icon={<Mail />}
              value={email}
              onChange={setEmail}
              required
            />
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <InputField
              type="text"
              placeholder="Enter 6-digit code"
              value={code}
              onChange={setCode}
              required
            />
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl" disabled={isLoading}>
              {isLoading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <InputField
              type="password"
              placeholder="New Password"
              icon={<Lock />}
              value={newPassword}
              onChange={setNewPassword}
              required
            />
            <InputField
              type="password"
              placeholder="Confirm Password"
              icon={<Lock />}
              value={confirmPassword}
              onChange={setConfirmPassword}
              required
            />
            {newPassword && !isStrongPassword(newPassword) && (
              <p className="text-red-400 text-xs mt-1">
                Password must have 8+ chars, uppercase, lowercase, number & special char.
              </p>
            )}
            <button className="w-full py-3 bg-blue-600 text-white rounded-xl" disabled={isLoading}>
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link to="/login" className="text-blue-400 hover:text-blue-300 text-sm">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
