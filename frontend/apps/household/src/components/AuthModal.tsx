import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.js";
import type { UserRole } from "@scrapsaathi/api-client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { quickLogin, login, register, requestOtp, verifyOtp } = useAuth();
  const [tab, setTab] = useState<"demo" | "phone" | "email">("demo");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<UserRole>("household");
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleDemoClick = async (demoRole: UserRole) => {
    try {
      setLoading(true);
      setError(null);
      await quickLogin(demoRole);
      onClose();
    } catch (e: any) {
      setError(e.message || "Failed to demo login");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    try {
      setLoading(true);
      setError(null);
      const res = await requestOtp(phone);
      setOtpSent(true);
      setOtpMessage(res.message);
      if (res.simulatedOtp) {
        setOtp(res.simulatedOtp);
      }
    } catch (e: any) {
      setError(e.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    try {
      setLoading(true);
      setError(null);
      await verifyOtp(phone, otp);
      onClose();
    } catch (e: any) {
      setError(e.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      if (isRegistering) {
        await register(name, email, role, password);
      } else {
        await login(email, password);
      }
      onClose();
    } catch (e: any) {
      setError(e.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl p-1"
          aria-label="Close"
        >
          ✕
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 text-2xl mb-3">
            ♻
          </div>
          <h2 className="text-xl font-bold text-white">ScrapSaathi Authentication</h2>
          <p className="text-xs text-slate-400 mt-1">
            Access Household, Kabadiwala, or Aggregator features
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex rounded-xl bg-slate-800 p-1 mb-6 text-xs font-semibold">
          <button
            onClick={() => { setTab("demo"); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === "demo" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            🚀 1-Click Demo
          </button>
          <button
            onClick={() => { setTab("phone"); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === "phone" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            📱 Phone OTP
          </button>
          <button
            onClick={() => { setTab("email"); setError(null); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              tab === "email" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
            }`}
          >
            ✉ Email / Pass
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs text-center">
            {error}
          </div>
        )}

        {/* TAB 1: 1-Click Demo */}
        {tab === "demo" && (
          <div className="space-y-3">
            <p className="text-xs text-slate-400 text-center mb-2">
              Select an account to test production features immediately:
            </p>
            <button
              onClick={() => handleDemoClick("household")}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-emerald-500 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏡</span>
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-emerald-400">
                    Household (Citizen)
                  </div>
                  <div className="text-xs text-slate-400">Priya Sharma • Post Scrap & Earn</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-medium">
                Log In →
              </span>
            </button>

            <button
              onClick={() => handleDemoClick("picker")}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-amber-500 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🚲</span>
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-amber-400">
                    Waste Picker (Kabadiwala)
                  </div>
                  <div className="text-xs text-slate-400">Ramu Bhai • Map & Route Optimization</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                Log In →
              </span>
            </button>

            <button
              onClick={() => handleDemoClick("aggregator")}
              disabled={loading}
              className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-blue-500 transition-all text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🏭</span>
                <div>
                  <div className="text-sm font-semibold text-white group-hover:text-blue-400">
                    Recycling Aggregator Hub
                  </div>
                  <div className="text-xs text-slate-400">Delhi Green Recyclers • Set Rates</div>
                </div>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 font-medium">
                Log In →
              </span>
            </button>
          </div>
        )}

        {/* TAB 2: Phone OTP */}
        {tab === "phone" && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mobile Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:border-emerald-500 text-sm"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Designed for kabadiwalas — fast OTP without passwords
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-900/40"
                >
                  {loading ? "Sending..." : "Send Verification OTP →"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs">
                  {otpMessage || "OTP code sent to your phone!"}
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Enter 6-Digit OTP
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-center tracking-widest text-lg font-mono focus:border-emerald-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                  >
                    Change Phone
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
                  >
                    {loading ? "Verifying..." : "Verify & Sign In"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* TAB 3: Email / Password */}
        {tab === "email" && (
          <form onSubmit={handleEmailAuth} className="space-y-3">
            {isRegistering && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Account Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
                  >
                    <option value="household">Household User</option>
                    <option value="picker">Waste Picker (Kabadiwala)</option>
                    <option value="aggregator">Recycling Aggregator</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="you@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs mt-2 transition-all shadow-md"
            >
              {loading
                ? "Processing..."
                : isRegistering
                ? "Create Account & Login"
                : "Sign In"}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => { setIsRegistering(!isRegistering); setError(null); }}
                className="text-xs text-slate-400 hover:text-emerald-400 transition-colors"
              >
                {isRegistering
                  ? "Already have an account? Sign in"
                  : "Need an account? Register here"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
