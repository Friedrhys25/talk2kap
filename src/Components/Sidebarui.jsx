import React, { useState } from "react";

import {
  FiBarChart,
  FiArrowLeftCircle,
  FiChevronsRight,
  FiBell,
  FiHome,
  FiMonitor,
  FiShoppingCart,
  FiTag,
  FiUsers,
  FiX,
  FiAlertTriangle
} from "react-icons/fi";
import { motion } from "framer-motion";
import Dashpage from "../Pages/Sidebarpages/Dashpage";
import Salepage from "../Pages/Sidebarpages/Notifpage";
import Viewpage from "../Pages/Sidebarpages/Viewpage";

export const Example = () => {
  const [selected, setSelected] = useState("Dashboard");

  return (
    <div className="flex bg-indigo-50">
      <Sidebar selected={selected} setSelected={setSelected} />
      <ExampleContent selected={selected} />
    </div>
  );
};

// Logout Modal Component
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-opacity-10 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      
      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FiX size={24} />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
            <FiAlertTriangle className="text-red-600" size={24} />
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Confirm Logout
          </h3>
          
          <p className="text-gray-500 mb-6">
            Are you sure you want to logout? You will need to login again to access the dashboard.
          </p>

          {/* Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const Sidebar = ({ selected, setSelected }) => {  
  const [open, setOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Note: Add your useNavigate hook here in your actual file
  // const navigate = useNavigate();

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setShowLogoutModal(false);
    // Add your navigation logic here: navigate("/");
    console.log("User logged out - redirect to login page");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  return (
    <>
      <motion.nav
        layout
        className="sticky top-0 h-screen shrink-0 border-r border-slate-300 bg-white p-2"
        style={{
          width: open ? "225px" : "fit-content",
        }}
      >
        <TitleSection open={open} user="rhys pogi"/>

        <div className="space-y-1">
          <Option Icon={FiHome} title="Dashboard" selected={selected} setSelected={setSelected} open={open} />
          <Option Icon={FiBell } title="Notification" selected={selected} setSelected={setSelected} open={open} />
          <Option Icon={FiMonitor} title="View Site" selected={selected} setSelected={setSelected} open={open} />
          <Option Icon={FiShoppingCart} title="Products" selected={selected} setSelected={setSelected} open={open} />
          <Option Icon={FiTag} title="Tags" selected={selected} setSelected={setSelected} open={open} />
          <Option Icon={FiArrowLeftCircle} title="Logout" selected={selected} setSelected={setSelected} onClick={handleLogoutClick} open={open} />
        </div>

        <ToggleClose open={open} setOpen={setOpen} />
      </motion.nav>

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />
    </>
  );
};

const Option = ({ Icon, title, selected, setSelected, open, notifs, onClick  }) => {
  return (
    <motion.button
      layout
      onClick={() => {
        if (onClick) {
          onClick();   // ✅ run custom handler (like handleLogoutClick)
        } else {
          setSelected(title); // ✅ fallback for normal menu items
        }
      }}
      className={`relative flex h-10 w-full items-center rounded-md transition-colors ${
        selected === title
          ? "bg-indigo-100 text-indigo-800"
          : "text-slate-500 hover:bg-slate-100"
      }`}
    >
      <motion.div
        layout
        className="grid h-full w-10 place-content-center text-lg"
      >
        <Icon />
      </motion.div>
      {open && (
        <motion.span
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.125 }}
          className="text-xs font-medium"
        >
          {title}
        </motion.span>
      )}

      {notifs && open && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          style={{ y: "-50%" }}
          transition={{ delay: 0.5 }}
          className="absolute right-2 top-1/2 size-4 rounded bg-indigo-500 text-xs text-white"
        >
          {notifs}
        </motion.span>
      )}
    </motion.button>
  );
};

const TitleSection = ({open,user}) => {
  return (
    <div className="mb-3 border-b border-slate-300 pb-3">
      <div className="flex cursor-pointer items-center justify-between rounded-md transition-colors hover:bg-slate-100">
        <div className="flex items-center gap-2">
          <motion.div
            layout
            className="grid h-full w-10 place-content-center text-lg"
          >
            <FiUsers />
          </motion.div>
          {open && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.125 }}
            >
              <span className="text-md font-semibold">{user}</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

const ToggleClose = ({ open, setOpen }) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="absolute bottom-0 left-0 right-0 border-t border-slate-300 transition-colors hover:bg-slate-100"
    >
      <div className="flex items-center p-2">
        <motion.div
          layout
          className="grid size-10 place-content-center text-lg"
        >
          <FiChevronsRight
            className={`transition-transform ${open && "rotate-180"}`}
          />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-xs font-medium"
          >
            Hide
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};

const ExampleContent = ({ selected }) => {
  return (
    <div className="flex flex-1 w-full h-screen overflow-y-auto bg-indigo-50">
      {selected === "Dashboard" && (
        <div className="w-full h-full min-w-0">
          <Dashpage />
        </div>
      )}
      {selected === "Notification" && (
        <div className="w-full h-full min-w-0">
          <Salepage/>
        </div>
      )}
      {selected === "View Site" && (
        <div className="w-full h-full min-w-0">
          <Viewpage />
        </div>
      )}
      {selected === "Products" && (
        <div className="w-full h-full min-w-0 p-6 bg-white">
          <h1 className="text-xl font-bold">Products Page</h1>
        </div>
      )}
      {selected === "Tags" && (
        <div className="w-full h-full min-w-0 p-6 bg-white">
          <h1 className="text-xl font-bold">Tags Page</h1>
        </div>
      )}
    </div>
  );
};