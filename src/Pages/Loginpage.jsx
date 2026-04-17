// Talk2KapAuth.jsx - Admin Auth with Firebase + Forgot Password
// Redesigned UI/UX — refined glass-morphism card, smooth view transitions,
// animated inputs, password strength meter, and polished success screen.

import React, { useEffect, useState, useRef } from "react";
import sanroqueLogo from "../assets/sanroquelogo.png";
import {
  Eye,
  EyeOff,
  MessageCircle,
  Lock,
  Mail,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Shield,
  Sparkles,
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebaseConfig";

// ─────────────────────────────────────────────
// Design Tokens (inline via className)
// Uses Tailwind + custom inline styles for effects
// ─────────────────────────────────────────────

// ── Spinner ──
const Spinner = () => (
  <svg
    className="animate-spin"
    style={{ width: 18, height: 18 }}
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v8z"
    />
  </svg>
);

// ── Alert Banner ──
const AlertBanner = ({ type, text }) => {
  const isSuccess = type === "success";
  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
        isSuccess
          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
          : "bg-red-50 text-red-700 border border-red-200"
      }`}
      style={{ animation: "fadeSlideIn 0.25s ease" }}
    >
      {isSuccess ? (
        <CheckCircle size={16} className="mt-0.5 shrink-0 text-emerald-500" />
      ) : (
        <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-400" />
      )}
      <span className="leading-snug">{text}</span>
    </div>
  );
};

// ── Floating Label Input ──
const FloatingInput = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  onKeyDown,
  autoComplete,
  suffix,
}) => {
  const [focused, setFocused] = useState(false);
  const isUp = focused || value?.length > 0;

  return (
    <div className="relative">
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete}
        className="peer w-full pt-6 pb-2 px-4 rounded-2xl border-2 text-gray-800 text-sm bg-gray-50 outline-none transition-all duration-200"
        style={{
          borderColor: focused ? "#6366f1" : "#e5e7eb",
          paddingRight: suffix ? "48px" : "16px",
          fontSize: "15px",
        }}
      />
      <label
        htmlFor={id}
        className="absolute left-4 pointer-events-none transition-all duration-200 font-medium"
        style={{
          top: isUp ? "8px" : "50%",
          transform: isUp ? "none" : "translateY(-50%)",
          fontSize: isUp ? "11px" : "14px",
          color: focused ? "#6366f1" : "#9ca3af",
          letterSpacing: isUp ? "0.04em" : "0",
          textTransform: isUp ? "uppercase" : "none",
        }}
      >
        {label}
      </label>
      {suffix && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">{suffix}</div>
      )}
    </div>
  );
};

// ── Password Strength Bar ──
const PasswordStrength = ({ password }) => {
  const getStrength = (pw) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const score = getStrength(password);
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5" style={{ animation: "fadeSlideIn 0.2s ease" }}>
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{
              background: i <= score ? colors[score] : "#e5e7eb",
            }}
          />
        ))}
      </div>
      <p className="text-xs font-medium" style={{ color: colors[score] }}>
        {labels[score]}
      </p>
    </div>
  );
};

// ─────────────────────────────────────────────
// Login View
// ─────────────────────────────────────────────

const LoginView = ({ onForgot }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    if (remembered) {
      setRemember(true);
      setEmail(localStorage.getItem("savedEmail") || "");
    }
  }, []);

  const handleLogin = async (e) => {
    e?.preventDefault();
    setMessage("");
    setMessageType("");

    if (!email.trim() || !password) {
      setMessageType("error");
      setMessage("Please enter your email and password.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (remember) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedEmail");
      }
      localStorage.setItem("isLoggedIn", "true");
      setMessageType("success");
      setMessage("Login successful! Redirecting…");
      setTimeout(() => { window.location.href = "/main"; }, 900);
    } catch (error) {
      const msgs = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password. Try again or reset it.",
        "auth/invalid-email": "That email address isn't valid.",
        "auth/invalid-credential": "Invalid email or password.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/operation-not-allowed": "Email/password login is disabled.",
      };
      setMessageType("error");
      setMessage(msgs[error.code] || error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)" }}
        >
          <MessageCircle size={30} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Talk<span style={{ color: "#6366f1" }}>2</span>Kap
        </h1>
        <p className="text-xs text-gray-400 mt-1 tracking-widest uppercase font-medium">
          Admin Portal
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-4 mb-4">
        <FloatingInput
          id="email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
          autoComplete="email"
        />

        <FloatingInput
          id="password"
          label="Password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
          autoComplete="current-password"
          suffix={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
      </div>

      {/* Remember + Forgot */}
      <div className="flex items-center justify-between mb-5">
        <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="rounded accent-indigo-500 w-4 h-4"
          />
          <span>Remember me</span>
        </label>
        <button
          type="button"
          onClick={onForgot}
          className="text-sm font-medium transition-colors"
          style={{ color: "#6366f1" }}
          onMouseOver={(e) => (e.target.style.color = "#4338ca")}
          onMouseOut={(e) => (e.target.style.color = "#6366f1")}
        >
          Forgot password?
        </button>
      </div>

      {/* Alert */}
      {message && (
        <div className="mb-4">
          <AlertBanner type={messageType} text={message} />
        </div>
      )}

      {/* Login Button */}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        style={{
          background: "linear-gradient(90deg, #6366f1 0%, #ec4899 100%)",
          boxShadow: isLoading ? "none" : "0 4px 20px rgba(99,102,241,0.35)",
        }}
        onMouseOver={(e) => !isLoading && (e.currentTarget.style.opacity = "0.92")}
        onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
      >
        {isLoading ? (
          <>
            <Spinner />
            Signing in…
          </>
        ) : (
          <>
            
            Sign in to Portal
          </>
        )}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Forgot Password View
// ─────────────────────────────────────────────

const ForgotPasswordView = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSend = async (e) => {
    e?.preventDefault();
    setMessage("");
    setMessageType("");

    if (!email.trim()) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
    } catch (error) {
      const msgs = {
        "auth/user-not-found": "No account found with this email.",
        "auth/invalid-email": "That email address isn't valid.",
        "auth/too-many-requests": "Too many attempts. Please wait and try again.",
        "auth/network-request-failed": "Network error. Check your connection.",
        "auth/operation-not-allowed": "Password reset is currently disabled.",
      };
      setMessageType("error");
      setMessage(msgs[error.code] || error.message || "Failed to send reset email.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success ──
  if (sent) {
    return (
      <div
        className="text-center"
        style={{ animation: "fadeSlideIn 0.3s ease" }}
      >
        {/* Icon */}
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
        >
          <CheckCircle size={30} className="text-white" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2 tracking-tight">
          Email sent!
        </h2>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          A reset link was sent to{" "}
          <span className="font-semibold text-gray-700">{email}</span>.<br />
          Use it to set a new password.
        </p>

        {/* Steps */}
        <div
          className="rounded-2xl p-4 mb-5 text-left space-y-3"
          style={{ background: "#f5f3ff", border: "1px solid #ede9fe" }}
        >
          <p
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: "#7c3aed" }}
          >
            How it works
          </p>
          {[
            "Open the reset link in your inbox",
            "Enter and confirm your new password",
            "Return here and sign in with your new password",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className="w-5 h-5 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: "linear-gradient(135deg, #6366f1, #ec4899)" }}
              >
                {i + 1}
              </div>
              <p className="text-xs text-indigo-900 leading-relaxed">{step}</p>
            </div>
          ))}
        </div>

        {/* Resend */}
        <p className="text-xs text-gray-400 mb-5">
          Didn't receive it? Check your spam or{" "}
          <button
            onClick={() => { setSent(false); setMessage(""); }}
            className="font-semibold underline"
            style={{ color: "#6366f1", background: "none", border: "none", cursor: "pointer" }}
          >
            try again
          </button>
          .
        </p>

        <button
          onClick={onBack}
          className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={14} />
          Back to sign in
        </button>
      </div>
    );
  }

  // ── Request ──
  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ background: "linear-gradient(135deg, #6366f1 0%, #ec4899 100%)" }}
        >
          <Lock size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
          Reset password
        </h1>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed">
          Enter your admin email and we'll send a secure reset link.
        </p>
      </div>

      <div className="mb-4">
        <FloatingInput
          id="reset-email"
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
          autoComplete="email"
        />
      </div>

      {message && (
        <div className="mb-4">
          <AlertBanner type={messageType} text={message} />
        </div>
      )}

      <button
        onClick={handleSend}
        disabled={isLoading}
        className="w-full py-3.5 rounded-2xl text-white text-sm font-semibold transition-all disabled:opacity-60 flex items-center justify-center gap-2 mb-3"
        style={{
          background: "linear-gradient(90deg, #6366f1 0%, #ec4899 100%)",
          boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
        }}
      >
        {isLoading ? (
          <>
            <Spinner />
            Sending…
          </>
        ) : (
          <>
            
            Send reset link
          </>
        )}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full py-3 rounded-2xl text-sm text-gray-500 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Root — Animated layout + watermark background
// ─────────────────────────────────────────────

const Talk2KapAuth = () => {
  const [view, setView] = useState("login");

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%       { transform: translateY(-12px) rotate(1.5deg); }
          66%       { transform: translateY(6px) rotate(-1deg); }
        }
        .auth-card {
          animation: fadeSlideIn 0.4s ease;
        }
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
          animation: float 8s ease-in-out infinite;
        }
      `}</style>

      <div
        className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #6d1d6d 100%)" }}
      >
        {/* Ambient orbs */}
        <div
          className="orb"
          style={{
            width: 340, height: 340,
            background: "rgba(99,102,241,0.25)",
            top: "-80px", left: "-80px",
            animationDelay: "0s",
          }}
        />
        <div
          className="orb"
          style={{
            width: 280, height: 280,
            background: "rgba(236,72,153,0.2)",
            bottom: "-60px", right: "-60px",
            animationDelay: "3s",
          }}
        />
        <div
          className="orb"
          style={{
            width: 180, height: 180,
            background: "rgba(167,139,250,0.15)",
            top: "40%", right: "15%",
            animationDelay: "5s",
          }}
        />

        {/* Watermark logo */}
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundImage: `url(${sanroqueLogo})`,
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "50%",
            opacity: 0.05,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />

        {/* Card */}
        <div
          className="auth-card relative w-full z-10"
          style={{
            maxWidth: "420px",
            background: "rgba(255,255,255,0.97)",
            borderRadius: "28px",
            padding: "40px 36px 32px",
            boxShadow: "0 32px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.12)",
          }}
        >
          {view === "login" ? (
            <LoginView onForgot={() => setView("forgot")} />
          ) : (
            <ForgotPasswordView onBack={() => setView("login")} />
          )}

          <p className="text-center text-xs text-gray-300 mt-6" style={{ color: "#d1d5db" }}>
            © {new Date().getFullYear()} Talk2Kap · Municipality of Victoria, Brgy. San Roque
          </p>
        </div>
      </div>
    </>
  );
};

export default Talk2KapAuth;