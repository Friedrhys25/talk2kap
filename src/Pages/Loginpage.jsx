// Talk2KapAuth.jsx - Admin Auth (Hardcoded Password)
import React, { useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  MessageCircle,
  Lock,
  User,
  ArrowLeft,
  Sparkles,
  AlertCircle
} from "lucide-react";

const Talk2KapAuth = () => {
  const [view, setView] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  // 🔒 HARDCODED ADMIN CREDENTIALS
  const ADMIN_USERNAME = "admin";
  const ADMIN_PASSWORD = "admin123";

  // Load saved credentials
  useEffect(() => {
    const remembered = localStorage.getItem("rememberMe") === "true";
    if (remembered) {
      setRemember(true);
      setUsername(localStorage.getItem("savedUsername") || "");
      setPassword(localStorage.getItem("savedPassword") || "");
    }
  }, []);

  // ✅ LOGIN HANDLER (NO FIREBASE)
  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage("");
    setMessageType("");

    setTimeout(() => {
      if (
        username.trim().toLowerCase() === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
      ) {
        if (remember) {
          localStorage.setItem("rememberMe", "true");
          localStorage.setItem("savedUsername", username);
          localStorage.setItem("savedPassword", password);
        } else {
          localStorage.clear();
        }

        localStorage.setItem("isLoggedIn", "true");

        setMessageType("success");
        setMessage("Login successful!");

        // ✅ DIRECT REDIRECT
        window.location.href = "/main";
      } else {
        setMessageType("error");
        setMessage("Invalid admin credentials.");
      }

      setIsLoading(false);
    }, 600);
  };

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
      <AlertCircle size={18} />
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-6 bg-linear-to-br from-indigo-700 to-pink-500">
      {/* Background Logo */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "50%",
          opacity: 0.08
        }}
      />

      {/* Card */}
      <div className="relative w-full max-w-md p-8 rounded-3xl bg-white shadow-2xl z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-indigo-600 to-pink-500 rounded-full mb-4">
            <MessageCircle size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold text-gray-800">Talk2Kap</h1>
          <p className="text-sm text-gray-500 mt-1">Admin Portal</p>
        </div>

        {/* LOGIN */}
        <div className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Username
            </label>
            <div className="relative">
              <User
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                className="w-full pl-10 pr-4 py-3 border-2 rounded-2xl"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Password
            </label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type={showPassword ? "text" : "password"}
                className="w-full pl-10 pr-12 py-3 border-2 rounded-2xl"
                placeholder="admin123"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Remember me
          </label>

          {message && <MessageBox type={messageType} text={message} />}

          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl text-white font-semibold bg-linear-to-r from-indigo-500 to-pink-500"
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

        <footer className="mt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} Talk2Kap
        </footer>
      </div>
    </div>
  );
};

export default Talk2KapAuth;
