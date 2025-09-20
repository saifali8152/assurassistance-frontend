import React, { useState } from "react";
import { Mail, Lock, ShieldCheck } from "lucide-react";
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

      <div className="w-full h-full flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm  lg:max-w-lg xl:max-w-xl">
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
                  label="Email"
                  type="Your Email"
                  placeholder="Email"
                  icon={<Mail />}
                  value={email}
                  onChange={setEmail}
                  required
                />
                <button className="w-full py-3 bg-blue-600 text-white rounded-xl cursor-pointer" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send Code"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <InputField
                  type="text"
                  placeholder="Enter 6-digit code"
                  icon={<ShieldCheck />}
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

export default ForgotPassword;
