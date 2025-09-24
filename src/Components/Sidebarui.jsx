import React, { useState } from "react";
import {
  FiArrowLeftCircle,
  FiChevronsRight,
  FiBell,
  FiHome,
  FiMonitor,
  FiShoppingCart,
  FiTag,
  FiUsers,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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

// 🔴 Logout Modal
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-blur bg-opacity-40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-4"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <FiX size={26} />
        </button>

        {/* Content */}
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4">
            <FiAlertTriangle className="text-red-600" size={28} />
          </div>

          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Confirm Logout
          </h3>
          <p className="text-gray-500 text-base mb-6">
            Are you sure you want to logout? You will need to login again to
            access the dashboard.
          </p>

          <div className="flex gap-4 justify-center">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-5 py-2.5 text-base font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Yes, Logout
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// 🟣 Sidebar
const Sidebar = ({ selected, setSelected }) => {
  const [open, setOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const handleLogoutClick = () => setShowLogoutModal(true);
  const confirmLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setShowLogoutModal(false);
    navigate("/");
  };
  const cancelLogout = () => setShowLogoutModal(false);

  return (
    <>
      <motion.nav
        layout
        className="sticky top-0 h-screen shrink-0 border-r border-slate-300 bg-white shadow-lg flex flex-col"
        style={{ width: open ? "250px" : "fit-content" }}
      >
        {/* Sidebar Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg mx-3 mt-3 p-4 mb-4">
          <h1 className="text-xl font-bold">
            {open ? "Talk2Kap Admin" : "T2K"}
          </h1>
          {open && (
            <p className="text-sm text-indigo-100">
              Manage complaints easily
            </p>
          )}
        </div>

        <TitleSection open={open} user="Rhys Pogi" />

        {/* Menu Items */}
        <div className="space-y-2 flex-1 px-1">
          <Option
            Icon={FiHome}
            title="Dashboard"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <Option
            Icon={FiBell}
            title="Notification"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <Option
            Icon={FiMonitor}
            title="View Site"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <Option
            Icon={FiShoppingCart}
            title="Products"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <Option
            Icon={FiTag}
            title="Tags"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <Option
            Icon={FiArrowLeftCircle}
            title="Logout"
            selected={selected}
            setSelected={setSelected}
            onClick={handleLogoutClick}
            open={open}
          />
        </div>

        <ToggleClose open={open} setOpen={setOpen} />
      </motion.nav>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
      />
    </>
  );
};

// 🔵 Option (Menu Item)
const Option = ({ Icon, title, selected, setSelected, open, notifs, onClick }) => {
  return (
    <motion.button
      layout
      onClick={() => (onClick ? onClick() : setSelected(title))}
      className={`relative flex h-12 w-full items-center rounded-lg px-3 transition-all duration-200 ${
        selected === title
          ? "bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500 font-semibold"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      <motion.div layout className="grid h-full w-10 place-content-center text-lg">
        <Icon />
      </motion.div>
      {open && (
        <motion.span
          layout
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.125 }}
          className="text-base"
        >
          {title}
        </motion.span>
      )}
      {notifs && open && (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white shadow"
        >
          {notifs}
        </motion.span>
      )}
    </motion.button>
  );
};

// 🟢 Title Section (User Icon)
const TitleSection = ({ open, user }) => {
  return (
    <div className="mb-4 border-b border-slate-300 pb-3">
      <div className="flex items-center gap-2 px-3">
        <motion.div
          layout
          className="grid h-full w-10 place-content-center text-lg text-indigo-600"
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
            <span className="text-lg font-semibold">{user}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// 🟡 Toggle Sidebar
const ToggleClose = ({ open, setOpen }) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      className="absolute bottom-0 left-0 right-0 border-t border-slate-300 transition-colors hover:bg-slate-100"
    >
      <div className="flex items-center p-3">
        <motion.div layout className="grid size-10 place-content-center text-lg">
          <FiChevronsRight className={`transition-transform ${open && "rotate-180"}`} />
        </motion.div>
        {open && (
          <motion.span
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.125 }}
            className="text-sm font-medium"
          >
            Hide
          </motion.span>
        )}
      </div>
    </motion.button>
  );
};

// 🟠 Page Content Area
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
          <Salepage />
        </div>
      )}
      {selected === "View Site" && (
        <div className="w-full h-full min-w-0">
          <Viewpage />
        </div>
      )}
      {selected === "Products" && (
        <div className="w-full h-full min-w-0 p-8 bg-white shadow-md rounded-lg m-6">
          <h1 className="text-2xl font-bold">Products Page</h1>
        </div>
      )}
      {selected === "Tags" && (
        <div className="w-full h-full min-w-0 p-8 bg-white shadow-md rounded-lg m-6">
          <h1 className="text-2xl font-bold">Tags Page</h1>
        </div>
      )}
    </div>
  );
};
