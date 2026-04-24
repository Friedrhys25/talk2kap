// Sidebarui.jsx - Updated with Emergency Hotlines + User List
import React, { useState, useEffect, useRef } from "react";
import {
  FiAlertCircle, FiMail, FiArrowLeftCircle, FiChevronsRight,
  FiBell, FiHome, FiBarChart, FiUsers, FiX, FiUser, FiPhone, FiList,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  getFirestore,
  collection,
  onSnapshot,
} from "firebase/firestore";
import app from "../firebaseConfig";

import Dashpage       from "../Pages/Sidebarpages/Dashpage";
import Salepage       from "../Pages/Sidebarpages/Notifpage";
import Messagepage    from "../Pages/Sidebarpages/Messagepage";
import Uservalid      from "../Pages/Sidebarpages/Uservalid";
import Userpage       from "../Pages/Sidebarpages/Userpage";
import Reportspage    from "../Pages/Sidebarpages/Reportspage";
import Officialpage   from "../Pages/Sidebarpages/Officialpage";
import Employeepage   from "../Pages/Sidebarpages/Employeepage";
import Emergencypage  from "../Pages/Sidebarpages/emergencypage";


const firestore = getFirestore(app);

/* ── Motion variants ─────────────────────────────────────────────────────────*/
const sidebarVariants = {
  open:   { width: 280, transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.9 } },
  closed: { width: 76,  transition: { type: "spring", stiffness: 420, damping: 32, mass: 0.9 } },
};

const contentVariants = {
  hidden:  { opacity: 0, x: -10, scale: 0.98 },
  visible: { opacity: 1, x: 0,   scale: 1,   transition: { type: "spring", stiffness: 520, damping: 34, mass: 0.7, delay: 0.08 } },
  exit:    { opacity: 0, x: -10, scale: 0.98, transition: { duration: 0.16, ease: "easeInOut" } },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.92, y: -22 },
  visible: { opacity: 1, scale: 1,    y: 0,   transition: { type: "spring", stiffness: 520, damping: 34 } },
  exit:    { opacity: 0, scale: 0.92, y: -22, transition: { duration: 0.2, ease: "easeInOut" } },
};

const optionVariants = {
  idle:  { scale: 1,    x: 0 },
  hover: { scale: 1.01, x: 3 },
  tap:   { scale: 0.985 },
};

/* ── Page wrapper ────────────────────────────────────────────────────────────*/
export const Example = () => {
  const [selected, setSelected] = useState("Dashboard");
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);
  const [pendingValidationsCount, setPendingValidationsCount] = useState(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);
  const audioRef = useRef(null);
  const previousValidationCountRef = useRef(0);
  const previousComplaintsCountRef = useRef(0);
  const sirenPlayedRef = useRef(false);

  // ── Firestore listeners ─────────────────────────────────────────────────────
  useEffect(() => {
    const usersRef = collection(firestore, "users");
    const employeeRef = collection(firestore, "employee");
    const innerUnsubs = [];

    const complaintsMap = {};
    const validationMap = {};
    const tanodValidationMap = {};
    const messagesMap   = {};

    const recalc = () => {
      const newComplaintsCount = Object.values(complaintsMap).reduce((a, b) => a + b, 0);
      setPendingComplaintsCount(newComplaintsCount);
      const residentValidations = Object.values(validationMap).filter(Boolean).length;
      const tanodValidations = Object.values(tanodValidationMap).filter(Boolean).length;
      const newValidationCount = residentValidations + tanodValidations;
      setPendingValidationsCount(newValidationCount);
      setUnreadMessagesCount(Object.values(messagesMap).filter(Boolean).length);
      
      // Play siren sound ONLY ONCE when new complaints arrive (complaint count increases)
      if (newComplaintsCount > previousComplaintsCountRef.current && !sirenPlayedRef.current && audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.log("Audio play failed:", err));
        sirenPlayedRef.current = true;
      }
      
      // Reset siren flag when all complaints are resolved
      if (newComplaintsCount === 0) {
        sirenPlayedRef.current = false;
      }
      
      previousComplaintsCountRef.current = newComplaintsCount;
      previousValidationCountRef.current = newValidationCount;
    };

    // ── Tanods (employees) validation listener ───────────────────────────────
    const unsubEmployees = onSnapshot(employeeRef, (employeeSnapshot) => {
      tanodValidationMap;
      employeeSnapshot.forEach((empDoc) => {
        const empId = empDoc.id;
        const empData = empDoc.data();
        const status = (empData.idstatus || "").toLowerCase();
        tanodValidationMap[empId] = status === "" || status === "pending";
      });
      recalc();
    });
    innerUnsubs.push(unsubEmployees);

    const unsubUsers = onSnapshot(usersRef, (usersSnapshot) => {
      usersSnapshot.forEach((userDoc) => {
        const userId   = userDoc.id;
        const userData = userDoc.data();

        // ── validation badge ─────────────────────────────────────────────────
        const status = (userData.idstatus || "pending").toLowerCase();
        validationMap[userId] = status === "pending";

        // ── complaints subcollection ─────────────────────────────────────────
        const complaintsRef = collection(firestore, "users", userId, "userComplaints");
        const unsubComplaints = onSnapshot(complaintsRef, (complaintsSnap) => {
          let pendingCount = 0;

          complaintsSnap.forEach((cDoc) => {
            const c = cDoc.data();
            if ((c.status || "pending") === "pending") pendingCount++;

            // ── chat subcollection for unread messages ──────────────────────
            const chatRef = collection(firestore, "users", userId, "userComplaints", cDoc.id, "chat");
            const mapKey  = `${userId}_${cDoc.id}`;

            const unsubChat = onSnapshot(chatRef, (chatSnap) => {
              let hasUnread = false;
              chatSnap.forEach((msgDoc) => {
                const msg = msgDoc.data();
                if (msg?.senderId !== "admin" && msg?.read === false) hasUnread = true;
              });
              messagesMap[mapKey] = hasUnread;
              recalc();
            });

            innerUnsubs.push(unsubChat);
          });

          complaintsMap[userId] = pendingCount;
          recalc();
        });

        innerUnsubs.push(unsubComplaints);
        recalc();
      });
    });

    return () => {
      unsubUsers();
      innerUnsubs.forEach((u) => u());
    };
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
      {/* Audio alert for new complaints */}
      <audio 
        ref={audioRef} 
        src="/src/assets/The Purge Siren - Sound Effect for editing.mp3"
      />
      {/* Watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.12,
          filter: "brightness(1.35) contrast(1.08)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full h-full">
        <Sidebar
          selected={selected}
          setSelected={setSelected}
          pendingComplaintsCount={pendingComplaintsCount}
          pendingValidationsCount={pendingValidationsCount}
          unreadMessagesCount={unreadMessagesCount}
        />
        <ExampleContent selected={selected} />
      </div>
    </div>
  );
};

/* ── Logout Modal ────────────────────────────────────────────────────────────*/
const LogoutModal = ({ isOpen, onClose, onConfirm }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-9999 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          variants={modalVariants} initial="hidden" animate="visible" exit="exit"
          className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur-xl shadow-2xl"
        >
          <div className="relative p-6 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
            <button onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition">
              <FiX size={20} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
                <FiArrowLeftCircle size={22} />
              </div>
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-white/80">Session</p>
                <h3 className="text-xl font-extrabold">Confirm Logout</h3>
              </div>
            </div>
            <p className="mt-3 text-sm text-white/80 font-semibold">
              Are you sure you want to logout? You will need to login again to access the dashboard.
            </p>
          </div>
          <div className="p-6 flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 transition">
              Cancel
            </button>
            <button onClick={onConfirm}
              className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-extrabold hover:bg-rose-700 transition shadow-md">
              Yes, Logout
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

/* ── Sidebar ─────────────────────────────────────────────────────────────────*/
const Sidebar = ({ selected, setSelected, pendingComplaintsCount, pendingValidationsCount, unreadMessagesCount }) => {
  const [open, setOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();

  const confirmLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setShowLogoutModal(false);
    navigate("/");
  };

  const menu = [
    { title: "Dashboard",          Icon: FiHome },
    { title: "Complaints",         Icon: FiAlertCircle, notifs: pendingComplaintsCount  > 0 ? pendingComplaintsCount  : null },
    { title: "Messages",           Icon: FiMail,        notifs: unreadMessagesCount     > 0 ? unreadMessagesCount     : null },
    { title: "Validations",        Icon: FiUser,        notifs: pendingValidationsCount > 0 ? pendingValidationsCount : null },
    { title: "User List",          Icon: FiList },
    { title: "Reports",            Icon: FiBarChart },
    { title: "Barangay Officials", Icon: FiUsers },
    { title: "Barangay Employees", Icon: FiUsers },
    { title: "Emergency Hotlines", Icon: FiPhone },
  ];

  return (
    <>
      <motion.nav
        variants={sidebarVariants}
        animate={open ? "open" : "closed"}
        className="h-screen shrink-0 border-r border-slate-200 bg-white/75 backdrop-blur-xl shadow-xl flex flex-col"
      >
        {/* Brand */}
        <div className="p-3">
          <motion.div whileHover={{ scale: 1.01 }}
            className="relative overflow-hidden rounded-2xl border border-white/60 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-lg">
            <div className="absolute -top-14 -right-14 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
            <div className="relative px-4 py-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
                  <FiUsers size={22} />
                </div>
                <AnimatePresence mode="wait">
                  {open ? (
                    <motion.div key="brand-open"
                      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }} transition={{ duration: 0.2 }} className="min-w-0">
                      <p className="text-xs font-extrabold uppercase tracking-wider text-white/80">Talk2Kap</p>
                      <h1 className="text-base font-extrabold leading-tight truncate">Admin Panel</h1>
                      <p className="text-xs text-white/80 font-semibold mt-0.5">Manage complaints easily</p>
                    </motion.div>
                  ) : (
                    <motion.div key="brand-closed"
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                      className="text-sm font-extrabold">T2K</motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Menu */}
        <div className="flex-1 px-2 pb-2 space-y-2 overflow-y-auto">
          <p className={`px-3 pt-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 ${open ? "opacity-100" : "opacity-0 h-0 overflow-hidden"}`}>
            Navigation
          </p>

          {menu.map((item) => (
            <Option key={item.title} Icon={item.Icon} title={item.title}
              selected={selected} setSelected={setSelected} open={open} notifs={item.notifs} />
          ))}

          <div className="pt-2">
            <Option Icon={FiArrowLeftCircle} title="Logout"
              selected={selected} setSelected={setSelected} open={open}
              danger onClick={() => setShowLogoutModal(true)} />
          </div>
        </div>

        <ToggleClose open={open} setOpen={setOpen} />
      </motion.nav>

      <LogoutModal isOpen={showLogoutModal} onClose={() => setShowLogoutModal(false)} onConfirm={confirmLogout} />
    </>
  );
};

/* ── Option ──────────────────────────────────────────────────────────────────*/
const Option = ({ Icon, title, selected, setSelected, open, notifs, onClick, danger = false }) => {
  const isActive = selected === title;
  return (
    <motion.button
      layout
      variants={optionVariants} initial="idle" whileHover="hover" whileTap="tap"
      onClick={() => (onClick ? onClick() : setSelected(title))}
      className={[
        "relative w-full h-12 rounded-xl transition flex items-center border",
        open ? "px-3" : "px-2 justify-center",
        isActive
          ? "bg-indigo-50 border-indigo-200 text-indigo-800 shadow-sm"
          : "bg-white/40 border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-sm",
        danger && !isActive ? "hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700" : "",
        danger &&  isActive ? "bg-rose-50 border-rose-200 text-rose-700" : "",
      ].join(" ")}
    >
      {isActive && <span className="absolute inset-0 rounded-xl ring-2 ring-indigo-200/60 pointer-events-none" />}

      <div className={["grid place-items-center shrink-0", open ? "w-11 h-11" : "w-10 h-10"].join(" ")}>
        <Icon size={22} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.span variants={contentVariants} initial="hidden" animate="visible" exit="exit"
            className="ml-2 text-sm font-extrabold whitespace-nowrap overflow-hidden">
            {title}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Notif pill (open) */}
      <AnimatePresence>
        {notifs && open && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 560, damping: 26 } }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.12 } }}
            className="absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-xs font-extrabold shadow-md"
          >
            <FiBell size={12} className="animate-pulse" />
            {notifs > 99 ? "99+" : notifs}
          </motion.span>
        )}
      </AnimatePresence>

      {/* Notif dot (closed) */}
      <AnimatePresence>
        {notifs && !open && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 560, damping: 26 } }}
            exit={{ scale: 0, opacity: 0, transition: { duration: 0.12 } }}
            className="absolute top-2 right-2"
          >
            <span className="relative grid place-items-center">
              <FiBell className="text-rose-600 animate-pulse" size={14} />
              <span className="absolute -top-1 -right-1 min-w-3.5 h-3.5 px-1 rounded-full bg-rose-600 border-2 border-white text-[9px] leading-none text-white grid place-items-center font-extrabold">
                {notifs > 9 ? "9+" : notifs}
              </span>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

/* ── Toggle ──────────────────────────────────────────────────────────────────*/
const ToggleClose = ({ open, setOpen }) => (
  <motion.button
    layout
    onClick={() => setOpen((pv) => !pv)}
    whileHover={{ backgroundColor: "rgb(248 250 252)" }}
    whileTap={{ scale: 0.99 }}
    className="border-t border-slate-200 bg-white/50 backdrop-blur px-2 py-2"
  >
    <div className={["flex items-center rounded-xl", open ? "px-2 justify-between" : "justify-center"].join(" ")}>
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-xl border border-slate-200 bg-white grid place-items-center shadow-sm">
          <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ type: "spring", stiffness: 560, damping: 30 }}>
            <FiChevronsRight size={22} />
          </motion.div>
        </div>
        <AnimatePresence>
          {open && (
            <motion.span variants={contentVariants} initial="hidden" animate="visible" exit="exit"
              className="text-sm font-extrabold text-slate-700">Hide</motion.span>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {open && (
          <motion.span variants={contentVariants} initial="hidden" animate="visible" exit="exit"
            className="text-[11px] font-extrabold text-slate-500">Collapse</motion.span>
        )}
      </AnimatePresence>
    </div>
  </motion.button>
);

/* ── Content area ────────────────────────────────────────────────────────────*/
const ExampleContent = ({ selected }) => (
  <motion.div layout className="flex-1 min-w-0 h-screen overflow-hidden"
    transition={{ type: "spring", stiffness: 420, damping: 32 }}>
    <div className="h-full w-full overflow-y-auto">
      <AnimatePresence mode="wait">
        {selected === "Dashboard"          && <PageWrap key="dashboard"  ><Dashpage      /></PageWrap>}
        {selected === "Complaints"         && <PageWrap key="complaints" ><Salepage      /></PageWrap>}
        {selected === "Messages"           && <PageWrap key="messages"   ><Messagepage   /></PageWrap>}
        {selected === "Validations"        && <PageWrap key="validation" ><Uservalid     /></PageWrap>}
        {selected === "User List"          && <PageWrap key="userlist"   ><Userpage      /></PageWrap>}
        {selected === "Reports"            && <PageWrap key="reports"    ><Reportspage   /></PageWrap>}
        {selected === "Barangay Officials" && <PageWrap key="officials"  ><Officialpage  /></PageWrap>}
        {selected === "Barangay Employees" && <PageWrap key="employees"  ><Employeepage  /></PageWrap>}
        {selected === "Emergency Hotlines" && <PageWrap key="emergency"  ><Emergencypage /></PageWrap>}
      </AnimatePresence>
    </div>
  </motion.div>
);

const PageWrap = ({ children }) => (
  <motion.div variants={contentVariants} initial="hidden" animate="visible" exit="exit" className="w-full min-h-full">
    {children}
  </motion.div>
);