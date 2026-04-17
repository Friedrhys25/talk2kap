// Talk2KapAuth.jsx - Admin Auth with Firebase + Forgot Password
import React, { useEffect, useState } from "react";
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
} from "lucide-react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../firebaseConfig"; // 🔧 Adjust path if needed

// ─────────────────────────────────────────────
// Shared UI Atoms
// ─────────────────────────────────────────────

const Spinner = () => (
  <div
    className="animate-spin rounded-full border-2 border-transparent border-t-white"
    style={{ width: 20, height: 20 }}
  />
);

const MessageBox = ({ type, text }) => (
  <div
    className={`border px-4 py-3 rounded-xl text-sm flex items-start gap-2 ${
      type === "success"
        ? "bg-green-50 text-green-800 border-green-200"
        : "bg-red-50 text-red-800 border-red-200"
    }`}
  >
    <AlertCircle size={18} className="mt-0.5 shrink-0" />
    <span>{text}</span>
  </div>
);

// ─────────────────────────────────────────────
// Login View — Firebase signInWithEmailAndPassword
// NOTE: Hardcoded credentials removed.
// Login now uses the admin's actual Firebase email + password.
// When the admin resets their password via Forgot Password,
// their new password becomes the login password automatically.
// ─────────────────────────────────────────────

const LoginView = ({ onForgot }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // Load saved email
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    if (remembered) {
      setRemember(true);
      setEmail(localStorage.getItem("savedEmail") || "");
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!email.trim() || !password) {
      setMessageType("error");
      setMessage("Please enter your email and password.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);

      // Save or clear remembered email (never save password)
      if (remember) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedEmail", email);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedEmail");
      }

      localStorage.setItem("isLoggedIn", "true");
      setMessageType("success");
      setMessage("Login successful! Redirecting...");

      setTimeout(() => {
        window.location.href = "/main";
      }, 800);
    } catch (error) {
      console.warn("Login error:", error.code);

      let msg = "Something went wrong. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          msg = "No account found with this email address.";
          break;
        case "auth/wrong-password":
          msg = "Incorrect password. Please try again or reset your password.";
          break;
        case "auth/invalid-email":
          msg = "The email address is not valid.";
          break;
        case "auth/invalid-credential":
          msg = "Invalid email or password. Please check your credentials.";
          break;
        case "auth/user-disabled":
          msg = "This account has been disabled. Please contact support.";
          break;
        case "auth/too-many-requests":
          msg = "Too many failed attempts. Try again later or reset your password.";
          break;
        case "auth/network-request-failed":
          msg = "Network error. Check your internet connection and try again.";
          break;
        case "auth/operation-not-allowed":
          msg = "Email/password login is currently disabled. Contact support.";
          break;
        default:
          msg = error.message || "An unexpected error occurred.";
      }

      setMessageType("error");
      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-600 to-pink-500 rounded-full mb-4">
          <MessageCircle size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-extrabold text-gray-800">Talk2Kap</h1>
        <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">Email</label>
        <div className="relative">
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="email"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-400 focus:outline-none transition-colors"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
          />
        </div>
      </div>

      {/* Password */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-gray-700 font-medium">Password</label>
          <button
            type="button"
            onClick={onForgot}
            className="text-sm text-indigo-500 hover:text-indigo-700 hover:underline transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Lock
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type={showPassword ? "text" : "password"}
            className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-400 focus:outline-none transition-colors"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin(e)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Remember Me */}
      <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="rounded accent-indigo-500"
        />
        Remember me
      </label>

      {/* Message */}
      {message && <MessageBox type={messageType} text={message} />}

      {/* Login Button */}
      <button
        onClick={handleLogin}
        disabled={isLoading}
        className="w-full py-3 rounded-2xl text-white font-semibold bg-linear-to-r from-indigo-500 to-pink-500 hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner />
            Logging in...
          </div>
        ) : (
          "Login"
        )}
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Forgot Password View
// Sends Firebase password reset email.
// Admin clicks the link → sets NEW password on Firebase's page.
// That new password is now their login password going forward.
// ─────────────────────────────────────────────

const ForgotPasswordView = ({ onBack }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handleSend = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (!email.trim()) {
      setMessageType("error");
      setMessage("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessageType("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      console.log("✅ Password reset email sent to:", email);
      setSent(true);
    } catch (error) {
      console.warn("Reset error:", error.code, error.message);

      let msg = "Failed to send reset email. Please try again.";

      switch (error.code) {
        case "auth/user-not-found":
          msg = "No account found with this email address.";
          break;
        case "auth/invalid-email":
          msg = "The email address is not valid. Please check and try again.";
          break;
        case "auth/too-many-requests":
          msg = "Too many attempts. Please wait a moment and try again.";
          break;
        case "auth/network-request-failed":
          msg = "Network error. Check your connection and try again.";
          break;
        case "auth/operation-not-allowed":
          msg = "Password reset is currently disabled. Please contact support.";
          break;
        default:
          msg = error.message || "An unexpected error occurred.";
      }

      setMessageType("error");
      setMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success Screen ──
  if (sent) {
    return (
      <div className="text-center space-y-5">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-2">
          <CheckCircle size={42} className="text-green-500" />
        </div>

        <h2 className="text-2xl font-extrabold text-gray-800">Check your inbox!</h2>

        <p className="text-sm text-gray-500 leading-relaxed">
          A password reset link was sent to{" "}
          <span className="font-semibold text-gray-700">{email}</span>.
          <br />
          Click the link to set your{" "}
          <span className="font-semibold text-indigo-600">new password</span>.
        </p>

        {/* Steps */}
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-4 text-left space-y-3">
          <p className="text-xs font-semibold text-indigo-700">How it works:</p>
          {[
            "Open the reset link sent to your email",
            "Enter and confirm your new password on the page that opens",
            "Come back here and log in using your new password",
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center shrink-0 mt-0.5 font-bold">
                {i + 1}
              </span>
              <span className="text-xs text-indigo-800 leading-relaxed">{step}</span>
            </div>
          ))}
        </div>

        {/* Resend tip */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500">
          Didn't receive it? Check your spam folder or{" "}
          <button
            onClick={() => {
              setSent(false);
              setMessage("");
            }}
            className="text-indigo-500 underline font-medium hover:text-indigo-700"
          >
            try again
          </button>
          .
        </div>

        {/* Back */}
        <button
          onClick={onBack}
          className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft size={16} />
          Back to Login
        </button>
      </div>
    );
  }

  // ── Request Screen ──
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-600 to-pink-500 rounded-full mb-4">
          <Lock size={36} className="text-white" />
        </div>
        <h1 className="text-3xl font-extrabold text-gray-800">Forgot Password?</h1>
        <p className="text-sm text-gray-500 mt-2 leading-relaxed">
          Enter your admin email. We'll send a link to{" "}
          <span className="font-medium text-gray-700">change your password</span>.
        </p>
      </div>

      {/* Email Input */}
      <div>
        <label className="block text-gray-700 font-medium mb-2">Email address</label>
        <div className="relative">
          <Mail
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="email"
            className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-2xl focus:border-indigo-400 focus:outline-none transition-colors"
            placeholder="admin@sanroque.gov.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(e)}
          />
        </div>
      </div>

      {/* Message */}
      {message && <MessageBox type={messageType} text={message} />}

      {/* Send Button */}
      <button
        onClick={handleSend}
        disabled={isLoading}
        className="w-full py-3 rounded-2xl text-white font-semibold bg-linear-to-r from-indigo-500 to-pink-500 hover:opacity-90 active:opacity-80 transition-opacity disabled:opacity-60"
      >
        {isLoading ? (
          <div className="flex items-center justify-center gap-2">
            <Spinner />
            Sending...
          </div>
        ) : (
          "Send Reset Link"
        )}
      </button>

      {/* Back to Login */}
      <button
        type="button"
        onClick={onBack}
        className="w-full py-3 rounded-2xl text-gray-600 font-medium flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Login
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────
// Root Component
// ─────────────────────────────────────────────

const Talk2KapAuth = () => {
  const [view, setView] = useState("login"); // "login" | "forgot"

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-linear-to-br from-indigo-700 to-pink-500">
      {/* Background Logo */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${sanroqueLogo})`,
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "50%",
          opacity: 0.08,
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl z-10">
        {view === "login" ? (
          <LoginView onForgot={() => setView("forgot")} />
        ) : (
          <ForgotPasswordView onBack={() => setView("login")} />
        )}

        <footer className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Talk2Kap
        </footer>
      </div>
    </div>
  );
};

export default Talk2KapAuth;