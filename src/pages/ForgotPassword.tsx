import React, { useState } from "react";
import { Mail } from "lucide-react";
import InputField from "../components/InputFields";
import { Link } from 'react-router-dom'; // Add this import at the top


const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showVerificationSection, setShowVerificationSection] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate sending verification code
        setTimeout(() => {
            setIsLoading(false);
            setShowVerificationSection(true);
            console.log("Verification code sent to:", { email });
        }, 2000);
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

            {/* World Map Pattern Overlay */}
            <div
                className="absolute inset-0 opacity-5 bg-repeat w-full h-full"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 20h60v60H20z' stroke='%23ffffff' stroke-width='0.5' fill='none'/%3E%3Cpath d='M30 30c10-5 20-5 30 0M25 50c15-10 25-10 40 0M35 70c10-3 15-3 25 0' stroke='%23ffffff' stroke-width='0.3' fill='none'/%3E%3C/svg%3E")`,
                }}
            ></div>

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
                        <div className="text-left mb-6 sm:mb-8">
                            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">Reset your password</h2>
                            <p className="text-gray-300 text-sm sm:text-base">Enter your account email and we'll send a 6-digit code to verify it's you,</p>
                        </div>

                        {/* Login Form */}
                        <div className="space-y-4 sm:space-y-6">
                            {/* // Email field */}
                            <InputField
                                type="email"
                                placeholder="Email"
                                icon={<Mail />}
                                value={email}
                                onChange={setEmail}
                                required
                            />

                            {/* Login Button */}
                            <button
                                type="submit"
                                disabled={isLoading}
                                onClick={handleSubmit}
                                className="w-full cursor-pointer py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden text-sm sm:text-base"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center space-x-2">
                                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Sending...</span>
                                    </div>
                                ) : (
                                    "Send Verification code"
                                )}
                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-500 opacity-0 hover:opacity-20 transition-opacity duration-200 rounded-xl"></div>
                            </button>

                            {/* Secure Access Message */}
                            <p className="text-center text-gray-400 text-sm sm:text-sm ">
                                We'll email you code that expires in 10 minutes.
                            </p>

                            {/* 6-Digit Verification Code Input - Conditionally rendered with animation */}
                            <div 
                                className={`space-y-3 transition-all duration-500 ease-out transform ${
                                    showVerificationSection 
                                        ? 'opacity-100 translate-y-0 max-h-96' 
                                        : 'opacity-0 translate-y-4 max-h-0 overflow-hidden'
                                }`}
                            >
                                <p className="text-center text-white text-sm font-medium">Enter code</p>
                                <div className="flex justify-between">
                                    {[0, 1, 2, 3, 4, 5].map((index) => (
                                        <input
                                            key={index}
                                            type="text"
                                            maxLength={1}
                                            className="w-12 h-12 sm:w-14 sm:h-14 text-center text-lg sm:text-xl font-bold bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all duration-200"
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                if (value && /^\d$/.test(value)) {
                                                    const nextInput = e.target.nextElementSibling as HTMLInputElement;
                                                    if (nextInput) nextInput.focus();
                                                }
                                            }}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Backspace' && !e.currentTarget.value) {
                                                    const prevInput = e.currentTarget.previousElementSibling as HTMLInputElement; if (prevInput) prevInput.focus();
                                                }
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Verification Buttons */}
                                <div className="space-y-3 mt-6">
                                    <button
                                        type="button"
                                        className="w-full py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-xl text-sm sm:text-base"
                                    >
                                        Verify & Continue
                                    </button>

                                    <button
                                        type="button"
                                        className="w-full py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/30 hover:bg-white/20 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] text-sm sm:text-base"
                                    >
                                        Resend code
                                    </button>
                                </div>
                            </div>

                            {/* Sign up and Forgot Password Links */}
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 space-y-2 sm:space-y-0">
                                <Link
                                    to="/Login"
                                    className="text-blue-400 hover:text-blue-300 text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto text-center sm:text-right"
                                >
                                    Back to sign in
                                </Link>
                            </div>
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