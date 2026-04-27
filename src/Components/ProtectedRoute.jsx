import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiArrowLeftCircle } from "react-icons/fi";

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 320, damping: 28 },
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 24,
    transition: { duration: 0.18, ease: "easeIn" },
  },
};

const LogoutModal = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Card */}
        <motion.div
          variants={modalVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl"
        >
          {/* Header */}
          <div className="relative p-6 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition"
            >
              <FiX size={20} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
                <FiArrowLeftCircle size={22} />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-white/80">
                  Session
                </p>
                <h3 className="text-xl font-extrabold">Confirm Logout</h3>
              </div>
            </div>

            <p className="mt-3 text-sm text-white/80 font-semibold">
              Are you sure you want to logout? You will need to login again to
              access the dashboard.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="p-6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-extrabold hover:bg-rose-700 transition shadow-md"
            >
              Yes, Logout
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ProtectedRoute = ({ children }) => {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;

    // Push a dummy state so the back button triggers popstate instead of navigating away
    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      // Push state again to block actual navigation
      window.history.pushState(null, "", window.location.href);
      setShowLogoutModal(true);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isLoggedIn]);

  const handleConfirmLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setShowLogoutModal(false);
    navigate("/", { replace: true });
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  if (!isLoggedIn) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      {children}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
      />
    </>
  );
};

export default ProtectedRoute;