import React, { useState } from "react";
import {
  FiArrowLeftCircle,
  FiChevronsRight,
  FiBell,
  FiHome,
  FiMessageCircle,
  FiBarChart ,
  FiUsers,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Dashpage from "../Pages/Sidebarpages/Dashpage";
import Salepage from "../Pages/Sidebarpages/Notifpage";
import Messagepage from "../Pages/Sidebarpages/Messagepage";
import Uservalid from "../Pages/Sidebarpages/Uservalid";
import Reportspage from "../Pages/Sidebarpages/Reportspage";
import Officialpage from "../Pages/Sidebarpages/Officialpage";

// Smooth animation variants
const sidebarVariants = {
  open: {
    width: 250,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
      duration: 0.5
    }
  },
  closed: {
    width: 70,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 35,
      mass: 0.8,
      duration: 0.5
    }
  }
};

const contentVariants = {
  hidden: { 
    opacity: 0, 
    x: -10,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      mass: 0.5,
      delay: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: -10,
    scale: 0.9,
    transition: {
      duration: 0.15,
      ease: "easeInOut"
    }
  }
};

const modalVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: -50
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 500,
      damping: 30,
      duration: 0.4
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: -50,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

const optionVariants = {
  idle: {
    scale: 1,
    x: 0,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  hover: {
    scale: 1.02,
    x: 4,
    transition: {
      type: "spring",
      stiffness: 400,
      damping: 25
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

export const Example = () => {
  const [selected, setSelected] = useState("Dashboard");
  return (
    <div className="flex bg-indigo-50 w-full h-screen overflow-hidden">
      <Sidebar selected={selected} setSelected={setSelected} />
      <ExampleContent selected={selected} />
    </div>
  );
};

// 🔴 Logout Modal
const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0  bg-opacity-40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="relative bg-white rounded-xl shadow-xl p-8 w-full max-w-md mx-4"
          >
            {/* Close button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FiX size={26} />
            </motion.button>

            {/* Content */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 20,
                  delay: 0.2
                }}
                className="mx-auto flex items-center justify-center w-14 h-14 rounded-full bg-red-100 mb-4"
              >
                <FiAlertTriangle className="text-red-600" size={28} />
              </motion.div>

              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.4 }}
                className="text-xl font-bold text-gray-900 mb-3"
              >
                Confirm Logout
              </motion.h3>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
                className="text-gray-500 text-base mb-6"
              >
                Are you sure you want to logout? You will need to login again to
                access the dashboard.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.4 }}
                className="flex gap-4 justify-center"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="px-5 py-2.5 text-base font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onConfirm}
                  className="px-5 py-2.5 text-base font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Yes, Logout
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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
        variants={sidebarVariants}
        animate={open ? "open" : "closed"}
        className="sticky top-0 h-screen shrink-0 border-r border-slate-300 bg-white shadow-lg flex flex-col"
      >
        {/* Sidebar Header */}
        <motion.div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg mx-3 mt-3 mb-4 overflow-hidden"
          whileHover={{ scale: 1.01 }}
          layout
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            layout: { duration: 0.5 }
          }}
        >
          <motion.div 
            className="p-4"
            animate={{ 
              paddingLeft: open ? 16 : 12,
              paddingRight: open ? 16 : 12
            }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30,
              duration: 0.4
            }}
          >
            <AnimatePresence mode="wait">
              <motion.h1
                key={open ? "full" : "short"}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ 
                  duration: 0.25,
                  ease: "easeInOut"
                }}
                className="text-md font-bold text-center"
              >
                {open ? "Talk2Kap Admin" : "TK"}
              </motion.h1>
            </AnimatePresence>
            <AnimatePresence>
              {open && (
                <motion.p
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ 
                    opacity: 1, 
                    height: "auto", 
                    marginTop: 4,
                    transition: {
                      opacity: { delay: 0.15, duration: 0.3 },
                      height: { duration: 0.3, ease: "easeOut" },
                      marginTop: { duration: 0.3, ease: "easeOut" }
                    }
                  }}
                  exit={{ 
                    opacity: 0, 
                    height: 0, 
                    marginTop: 0,
                    transition: {
                      opacity: { duration: 0.15 },
                      height: { duration: 0.2, ease: "easeIn" },
                      marginTop: { duration: 0.2, ease: "easeIn" }
                    }
                  }}
                  className="text-sm text-indigo-100 text-center"
                >
                  Manage complaints easily
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>


        {/* Menu Items */}
        <motion.div
          layout
          className="space-y-2 flex-1 px-1"
          transition={{ staggerChildren: 0.1 }}
        >
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
            Icon={FiMessageCircle}
            title="Messages"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <Option
            Icon={FiUsers}
            title="User validation"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <Option
            Icon={FiBarChart}
            title="Reports"
            selected={selected}
            setSelected={setSelected}
            open={open}
          />
          <Option
            Icon={FiUsers}
            title="Barangay officials"
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
        </motion.div>

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
      variants={optionVariants}
      initial="idle"
      whileHover="hover"
      whileTap="tap"
      onClick={() => (onClick ? onClick() : setSelected(title))}
      className={`relative flex h-12 w-full items-center rounded-lg px-3 transition-all duration-300 ${
        selected === title
          ? "bg-indigo-100 text-indigo-800 border-l-4 border-indigo-500 font-semibold shadow-sm"
          : "text-slate-600 hover:bg-slate-100 hover:shadow-sm"
      }`}
      animate={{
        justifyContent: open ? "flex-start" : "center",
        paddingLeft: open ? 12 : 8,
        paddingRight: open ? 12 : 8
      }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        duration: 0.4
      }}
    >
      <motion.div 
        className="grid h-full place-content-center text-lg flex-shrink-0"
        animate={{ 
          width: open ? 40 : 32,
          marginRight: open ? 8 : 0
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          duration: 0.4
        }}
      >
        <motion.div
          whileHover={{ rotate: selected === title ? 0 : 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Icon />
        </motion.div>
      </motion.div>
      <AnimatePresence>
        {open && (
          <motion.span
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="text-base whitespace-nowrap overflow-hidden"
          >
            {title}
          </motion.span>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {notifs && open && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              transition: {
                type: "spring",
                stiffness: 500,
                damping: 25,
                delay: 0.25
              }
            }}
            exit={{ 
              scale: 0, 
              opacity: 0,
              transition: { duration: 0.15 }
            }}
            whileHover={{ scale: 1.1 }}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs rounded-full bg-red-500 text-white shadow-lg"
          >
            {notifs}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

// 🟢 Title Section (User Icon)
const TitleSection = ({ open, user }) => {
  return (
    <motion.div
      layout
      className="ml-2 mb-4 border-b border-slate-300 pb-3 overflow-hidden"
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        duration: 0.4
      }}
    >
      <motion.div 
        className="flex items-center gap-2 px-3"
        animate={{
          justifyContent: open ? "flex-start" : "center",
          paddingLeft: open ? 12 : 8,
          paddingRight: open ? 12 : 8
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          duration: 0.4
        }}
      >
        <motion.div
          className="grid h-full place-content-center text-lg text-indigo-600 flex-shrink-0"
          animate={{ 
            width: open ? 40 : 32,
            marginRight: open ? 8 : 0
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          <FiUsers />
        </motion.div>
        <AnimatePresence>
          {open && (
            <motion.div
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="whitespace-nowrap overflow-hidden"
            >
              <span className="text-lg font-semibold">{user}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

// 🟡 Toggle Sidebar
const ToggleClose = ({ open, setOpen }) => {
  return (
    <motion.button
      layout
      onClick={() => setOpen((pv) => !pv)}
      whileHover={{ backgroundColor: "rgb(241 245 249)" }}
      whileTap={{ scale: 0.98 }}
      className="border-t border-slate-300 transition-colors overflow-hidden"
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        layout: { duration: 0.4 }
      }}
    >
      <motion.div 
        className="flex items-center p-3"
        animate={{
          justifyContent: open ? "flex-start" : "center",
          paddingLeft: open ? 12 : 8,
          paddingRight: open ? 12 : 8
        }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 30,
          duration: 0.4
        }}
      >
        <motion.div 
          className="grid place-content-center text-lg flex-shrink-0"
          animate={{ 
            width: open ? 40 : 32,
            height: 40,
            marginRight: open ? 8 : 0
          }}
          transition={{ 
            type: "spring", 
            stiffness: 400, 
            damping: 30,
            duration: 0.4
          }}
        >
          <motion.div
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30,
              duration: 0.4 
            }}
          >
            <FiChevronsRight />
          </motion.div>
        </motion.div>
        <AnimatePresence>
          {open && (
            <motion.span
              variants={contentVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="text-sm font-medium whitespace-nowrap overflow-hidden"
            >
              Hide
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.button>
  );
};

// 🟠 Page Content Area - FIXED TO FILL REMAINING SPACE
const ExampleContent = ({ selected }) => {
  return (
    <motion.div
      layout
      className="flex-1 min-w-0 h-screen overflow-hidden bg-indigo-50"
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 30,
        duration: 0.4
      }}
    >
      <AnimatePresence mode="wait">
        {selected === "Dashboard" && (
          <motion.div
            key="dashboard"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full h-full"
          >
            <Dashpage />
          </motion.div>
        )}
        {selected === "Notification" && (
          <motion.div
            key="notification"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full h-full"
          >
            <Salepage />
          </motion.div>
        )}
        {selected === "Messages" && (
          <motion.div
            key="messages"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full h-full"
          >
            <Messagepage />
          </motion.div>
        )}
        {selected === "User validation" && (
          <motion.div
            key="uservalidation"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full h-full"
          >
            <Uservalid  />
          </motion.div>
        )}
        {selected === "Reports" && (
          <motion.div
            key="reports"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full h-full"
          >
            <Reportspage/>
          </motion.div>
        )}
        {selected === "Barangay officials" && (
          <motion.div
            key="barangayofficials"
            variants={contentVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full h-full"
          >
            <Officialpage />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};