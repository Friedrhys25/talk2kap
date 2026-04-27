// Notiftable.jsx
// Flow: pending → deploy tanods (min 2) → in-progress → Mark as Resolved
// On deploy:  sets deploymentStatus & deployedTo (with coDeployedTanods) on each tanod,
//             sets deployedTanods array + deployedTanodUid/Name on complaint
// On resolve: clears all tanods' deployment, updates complaint status to "resolved"
// NEW: Auto-deploy night-shift tanods for urgent complaints at night
//      Shift tabs in Deploy Modal (Morning / Evening):
//        - Both tabs are CLICKABLE for viewing
//        - Selection is DISABLED on the off-shift tab (view-only)
import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import sirenAudio from "../../assets/The Purge Siren - Sound Effect for editing.mp3";
import barangayLogo from "../../assets/sanroquelogo.png";
import {
  FiAlertTriangle, FiClock, FiSearch, FiX,
  FiUser, FiMapPin, FiFileText, FiCalendar,
  FiCheckCircle, FiHome, FiShield, FiStar,
  FiChevronLeft, FiChevronRight, FiMoon, FiSun,
  FiZap, FiLock,
} from "react-icons/fi";
import {
  collection, onSnapshot, doc, updateDoc,
  getDoc, setDoc, serverTimestamp,
} from "firebase/firestore";
import { firestore } from "../../firebaseConfig";

// ── Shift helpers ─────────────────────────────────────────────────────────────
// Day shift   :  8:00 AM – 4:59 PM  (hours 8 – 16)
// Night shift :  7:00 PM – 4:59 AM  (hours 19 – 23 and 0 – 4)
// Gap         :  5:00 PM – 6:59 PM  (hours 17 – 18)  → treated as "day" for UI
//
// getCurrentShift returns "day" or "night" based on wall-clock hour.
const getCurrentShift = () => {
  const h = new Date().getHours();
  // Night: 19:00 – 04:59
  if (h >= 19 || h < 5) return "night";
  // Day: 8:00 – 16:59  (and gap 5:00–6:59, 17:00–18:59 → fall back to "day")
  return "day";
};

// True only during actual night-shift hours (7 PM – 4:59 AM)
const isNightTime = () => getCurrentShift() === "night";

// Determine which shift a tanod belongs to via their "shift" field.
// Accepts values like "day", "night", "morning", "evening", etc.
const getTanodShift = (tanod) => {
  const s = (tanod.shift || "").toLowerCase();
  if (s.includes("night") || s.includes("evening")) return "night";
  if (s.includes("day")   || s.includes("morning")) return "day";
  return null; // unassigned
};

// ── Persisted seen-feedback keys ──────────────────────────────────────────────
const SEEN_KEY = "seenFeedbackKeys";
const loadSeenKeys = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveSeenKey = (key) => {
  try {
    const s = loadSeenKeys(); s.add(key);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
  } catch {}
};

// ── Read-only Star display ────────────────────────────────────────────────────
const StarDisplay = ({ value = 0, size = 22 }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <FiStar
        key={n}
        size={size}
        className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
      />
    ))}
  </div>
);

// ── Pagination Component ──────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) => {
  if (totalPages <= 1) return null;
  const start = (currentPage - 1) * itemsPerPage + 1;
  const end   = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-4 border-t border-gray-200 bg-white">
      <p className="text-xs font-semibold text-gray-500">
        Showing <span className="font-extrabold text-gray-800">{start}–{end}</span> of{" "}
        <span className="font-extrabold text-gray-800">{totalItems}</span> complaints
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
          <FiChevronLeft size={15} />
        </button>
        {getPageNumbers().map((page, idx) =>
          page === "..." ? (
            <span key={`ellipsis-${idx}`} className="px-2 py-1 text-xs font-semibold text-gray-400">…</span>
          ) : (
            <button key={page} onClick={() => onPageChange(page)}
              className={`w-8 h-8 rounded-lg text-xs font-extrabold transition border ${
                currentPage === page
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-indigo-50"
              }`}>
              {page}
            </button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
          <FiChevronRight size={15} />
        </button>
      </div>
    </div>
  );
};

// ── Confirm Resolve Modal ─────────────────────────────────────────────────────
const ConfirmResolveModal = ({ complaint, onConfirm, onCancel, resolving }) => {
  if (!complaint) return null;
  return (
    <div className="fixed inset-0 z-60 p-4 bg-black/50 backdrop-blur-sm flex items-center justify-center" onClick={onCancel}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="bg-linear-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2.5 rounded-xl"><FiCheckCircle size={20} /></div>
            <div>
              <h3 className="text-lg font-extrabold">Mark as Resolved</h3>
              <p className="text-green-100 text-xs font-semibold mt-0.5">Confirm resolution of this complaint</p>
            </div>
          </div>
          <button className="text-white/80 hover:text-white hover:bg-white/15 rounded-full p-2 transition" onClick={onCancel}>
            <FiX size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-green-100 bg-green-50 px-4 py-3">
            <p className="text-xs font-extrabold text-green-700 uppercase tracking-wider">Complaint</p>
            <p className="text-sm font-bold text-gray-800 mt-1 line-clamp-2">{complaint.message || "—"}</p>
            <p className="text-xs text-gray-500 font-semibold mt-0.5">
              by {complaint.name} · Purok {complaint.incidentPurok}
            </p>
          </div>

          {complaint.deployedTanods && complaint.deployedTanods.length > 0 ? (
            <div className="space-y-2">
              {complaint.deployedTanods.map((t) => (
                <div key={t.uid} className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <div className="bg-indigo-600 text-white p-2 rounded-xl shrink-0"><FiShield size={15} /></div>
                  <div>
                    <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Deployed Tanod</p>
                    <p className="text-sm font-bold text-gray-800 mt-0.5">{t.name}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : complaint.deployedTanodName && (
            <div className="flex items-center gap-3 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
              <div className="bg-indigo-600 text-white p-2 rounded-xl shrink-0"><FiShield size={15} /></div>
              <div>
                <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Deployed Tanod</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{complaint.deployedTanodName}</p>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 font-semibold text-center">
            Are you sure you want to mark this complaint as <span className="text-green-700 font-extrabold">Resolved</span>?
          </p>
        </div>

        <div className="border-t px-6 py-4 bg-slate-50 flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 transition">
            Cancel
          </button>
          <button onClick={onConfirm} disabled={resolving}
            className={`flex-1 py-3 rounded-xl text-white font-extrabold text-sm transition shadow-md ${
              resolving ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}>
            {resolving ? "Resolving…" : "Confirm & Resolve ✓"}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Auto-Deploy Toast Notification ────────────────────────────────────────────
const AutoDeployToast = ({ message, onDismiss }) => {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed top-6 right-6 z-100 max-w-sm w-full animate-bounce-in">
      <div className="bg-linear-to-r from-indigo-900 to-purple-900 text-white rounded-2xl shadow-2xl border border-indigo-500/40 overflow-hidden">
        <div className="flex items-start gap-3 p-4">
          <div className="bg-yellow-400 text-indigo-900 rounded-xl p-2 shrink-0 mt-0.5">
            <FiZap size={18} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-extrabold uppercase tracking-widest text-indigo-300 mb-0.5">Auto-Deploy</p>
            <p className="text-sm font-bold leading-snug">{message}</p>
          </div>
          <button onClick={onDismiss} className="text-white/60 hover:text-white transition shrink-0">
            <FiX size={16} />
          </button>
        </div>
        <div className="h-1 bg-white/10">
          <div className="h-full bg-yellow-400 animate-[shrink_6s_linear_forwards]" style={{ transformOrigin: "left" }} />
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const ITEMS_PER_PAGE = 10;

const Notiftable = () => {
  const [filter, setFilter]               = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [issueFilter, setIssueFilter]     = useState("all");
  const [searchTerm, setSearchTerm]       = useState("");
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [previewImage, setPreviewImage]   = useState(null);
  const [loading, setLoading]             = useState(true);
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");
  const [dateError, setDateError]         = useState("");

  // ── Pagination ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage]     = useState(1);

  // ── Deploy Tanod ─────────────────────────────────────────────────────────
  const [tanods, setTanods]               = useState([]);
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [deployTarget, setDeployTarget]   = useState(null);
  const [selectedTanods, setSelectedTanods] = useState(new Set());
  const [deploying, setDeploying]         = useState(false);
  const [tanodSearch, setTanodSearch]     = useState("");
  const [tanodPage, setTanodPage]         = useState(1);
  const [deployError, setDeployError]     = useState("");
  const [deployShiftTab, setDeployShiftTab] = useState("day"); // "day" | "night"
  const TANODS_PER_PAGE = 5;
  const MIN_TANODS = 2;

  // ── Confirm Resolve ───────────────────────────────────────────────────────
  const [showConfirmResolve, setShowConfirmResolve] = useState(false);
  const [resolvingComplaint, setResolvingComplaint] = useState(null);
  const [resolving, setResolving]                   = useState(false);

  // ── Auto-deploy ───────────────────────────────────────────────────────────
  const autoDeployedKeysRef    = useRef(new Set());
  const [autoDeployToast, setAutoDeployToast] = useState(null);

  // ── Audio alert ────────────────────────────────────────────────────────────
  const audioRef = useRef(null);
  const previousUrgentPendingCountRef = useRef(0);

  // ── Fetch tanods (employees) ──────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "employee"), (snap) => {
      const list = snap.docs.map((d) => ({
        uid: d.id, ...d.data(),
        fullName: [d.data().firstName, d.data().middleName, d.data().lastName, d.data().suffix]
          .filter(Boolean).join(" ").trim() || "Unknown",
      }));
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setTanods(list);
    });
    return () => unsub();
  }, []);

  // ── Complaints listener ───────────────────────────────────────────────────
  useEffect(() => {
    const innerUnsubs = [];
    const unsubUsers = onSnapshot(
      collection(firestore, "users"),
      (usersSnap) => {
        setLoading(false);
        usersSnap.forEach((userDoc) => {
          const userData = userDoc.data();
          const userId   = userDoc.id;
          const fullName = [userData.firstName, userData.middleName, userData.lastName, userData.suffix]
            .filter(Boolean).join(" ").trim() || "Unknown";
          const unsub = onSnapshot(
            collection(firestore, "users", userId, "userComplaints"),
            (cSnap) => {
              setNotifications((prev) => {
                const rest  = prev.filter((c) => c.userId !== userId);
                const fresh = [];
                cSnap.forEach((cDoc) => {
                  const c = cDoc.data();
                  let timestampStr = "—", rawDate = new Date(0);
                  if (c.timestamp?.toDate) {
                    rawDate = c.timestamp.toDate(); timestampStr = rawDate.toLocaleString();
                  } else if (typeof c.timestamp === "string") {
                    timestampStr = c.timestamp; rawDate = new Date(c.timestamp) || new Date(0);
                  }
                  fresh.push({
                    complaintKey:      cDoc.id, userId,
                    name:              fullName,
                    purok:             userData.purok || "—",
                    address:           userData.address || "—",
                    evidencePhoto:     c.evidencePhoto || null,
                    incidentPurok:     c.incidentPurok || "—",
                    incidentLocation:  c.incidentLocation || "—",
                    message:           c.message || "",
                    label:             c.label || "non-urgent",
                    type:              c.type || "—",
                    status:            c.status || "pending",
                    timestamp:         timestampStr,
                    _rawTimestamp:     rawDate,
                    deployedTanods:    c.deployedTanods   || [],
                    deployedTanodUid:  c.deployedTanodUid  || null,
                    deployedTanodName: c.deployedTanodName || null,
                  });
                });
                return [...rest, ...fresh].sort((a, b) => b._rawTimestamp - a._rawTimestamp);
              });
            }
          );
          innerUnsubs.push(unsub);
        });
      },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => { unsubUsers(); innerUnsubs.forEach((u) => u()); };
  }, []);

  // ── Sound alert ───────────────────────────────────────────────────────────
  useEffect(() => {
    const urgentPendingCount = notifications.filter(
      (c) => c.label === "urgent" && (c.status || "pending") === "pending"
    ).length;
    if (urgentPendingCount > previousUrgentPendingCountRef.current && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
    previousUrgentPendingCountRef.current = urgentPendingCount;
  }, [notifications]);

  // ── Auto-deploy night-shift tanods for urgent + pending complaints at night ──
  useEffect(() => {
    if (!isNightTime()) return;
    if (tanods.length === 0) return;

    const urgentPending = notifications.filter(
      (c) => c.label === "urgent" && c.status === "pending"
    );
    if (urgentPending.length === 0) return;

    const nightShiftTanods = tanods.filter((t) => {
      const shift = getTanodShift(t);
      const isVerified  = (t.idstatus || "").toLowerCase() === "verified";
      const isAvailable = (t.deploymentStatus || "available") !== "deployed";
      return isVerified && isAvailable && shift === "night";
    });

    if (nightShiftTanods.length < MIN_TANODS) return;

    urgentPending.forEach(async (complaint) => {
      const key = complaint.complaintKey;
      if (autoDeployedKeysRef.current.has(key)) return;
      autoDeployedKeysRef.current.add(key);

      try {
        const deployedTanods = nightShiftTanods.map((t) => ({ uid: t.uid, name: t.fullName }));
        const deployedTanodNames = deployedTanods.map((t) => t.name).join(", ");
        const deployedAt = new Date().toISOString();

        await updateDoc(
          doc(firestore, "users", complaint.userId, "userComplaints", complaint.complaintKey),
          {
            deployedTanods,
            deployedTanodUid:  deployedTanods[0].uid,
            deployedTanodName: deployedTanodNames,
            status:            "in-progress",
          }
        );

        for (const { uid, name } of deployedTanods) {
          const coDeployedTanods = deployedTanods.filter((t) => t.uid !== uid);
          await updateDoc(doc(firestore, "employee", uid), {
            deploymentStatus: "deployed",
            deployedTo: {
              complaintKey:    complaint.complaintKey,
              userId:          complaint.userId,
              complainantName: complaint.name,
              type:            complaint.type,
              incidentPurok:   complaint.incidentPurok,
              description:     complaint.message,
              deployedAt,
              coDeployedTanods,
            },
          });
        }

        const patch = (c) =>
          c.complaintKey === key
            ? { ...c, deployedTanods, deployedTanodUid: deployedTanods[0].uid, deployedTanodName: deployedTanodNames, status: "in-progress" }
            : c;
        setNotifications((prev) => prev.map(patch));
        setSelectedComplaint((prev) => prev ? patch(prev) : prev);

        setAutoDeployToast({
          message: `${nightShiftTanods.length} night-shift Banta Bayan auto-deployed for urgent complaint by ${complaint.name} (Purok ${complaint.incidentPurok}).`,
        });
      } catch (err) {
        console.error("Auto-deploy failed:", err);
        autoDeployedKeysRef.current.delete(key);
      }
    });
  }, [notifications, tanods]);

  // ── Date validation ───────────────────────────────────────────────────────
  const getDateBounds = () => {
    if (!startDate || !endDate) return null;
    const s = new Date(`${startDate}T00:00:00`), e = new Date(`${endDate}T23:59:59`);
    return isNaN(s) || isNaN(e) ? null : { start: s, end: e };
  };
  useEffect(() => {
    if (!startDate && !endDate) { setDateError(""); return; }
    const b = getDateBounds();
    if (!b && (startDate || endDate)) { setDateError("Please select both From and To dates."); return; }
    if (b && b.start > b.end) { setDateError("From date must be earlier than To date."); return; }
    setDateError("");
  }, [startDate, endDate]);

  // ── Reset page when filters change ───────────────────────────────────────
  useEffect(() => { setCurrentPage(1); }, [filter, statusFilter, issueFilter, searchTerm, startDate, endDate]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const issueTypes = useMemo(() => {
    const set = new Set();
    notifications.forEach((n) => { const t = (n.type || "").trim(); if (t && t !== "—") set.add(t); });
    const arr  = Array.from(set);
    const pref = ["medical", "fire", "noise", "waste", "infrastructure"];
    const lm   = new Map(arr.map((x) => [x.toLowerCase(), x]));
    return [...pref.map((p) => lm.get(p)).filter(Boolean), ...arr.filter((x) => !pref.includes(x.toLowerCase())).sort()];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const bounds = getDateBounds();
    return notifications.filter((n) => {
      if (filter === "urgent"     && n.label !== "urgent") return false;
      if (filter === "non-urgent" && n.label === "urgent") return false;
      if (statusFilter !== "all"  && n.status !== statusFilter) return false;
      if (issueFilter  !== "all"  && (n.type || "").toLowerCase() !== issueFilter.toLowerCase()) return false;
      const term = searchTerm.toLowerCase();
      if (term && !n.name?.toLowerCase().includes(term) && !n.type?.toLowerCase().includes(term) &&
          !n.message?.toLowerCase().includes(term) && !n.incidentPurok?.toLowerCase().includes(term)) return false;
      if (!dateError && bounds) {
        if (n._rawTimestamp < bounds.start || n._rawTimestamp > bounds.end) return false;
      }
      return true;
    });
  }, [notifications, filter, statusFilter, issueFilter, searchTerm, startDate, endDate, dateError]);

  // ── Pagination calculations ───────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE));
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  const stats = useMemo(() => ({
    total:         filteredNotifications.length,
    pending:       filteredNotifications.filter((n) => n.status === "pending").length,
    "in-progress": filteredNotifications.filter((n) => ["in-progress", "in progress"].includes(n.status)).length,
    resolved:      filteredNotifications.filter((n) => n.status === "resolved").length,
  }), [filteredNotifications]);

  // ── Display helpers ───────────────────────────────────────────────────────
  const getUrgencyDisplay = (label) =>
    label === "urgent"
      ? { icon: <FiAlertTriangle className="text-red-600" />,  text: "Urgent",     pill: "bg-red-100 text-red-800 ring-1 ring-red-200"   }
      : { icon: <FiClock         className="text-blue-600" />, text: "Non-Urgent", pill: "bg-blue-100 text-blue-800 ring-1 ring-blue-200" };

  const getIssueColor = (type) => ({
    medical:        "bg-red-100 text-red-800 ring-1 ring-red-200",
    fire:           "bg-orange-100 text-orange-800 ring-1 ring-orange-200",
    noise:          "bg-purple-100 text-purple-800 ring-1 ring-purple-200",
    waste:          "bg-green-100 text-green-800 ring-1 ring-green-200",
    infrastructure: "bg-gray-100 text-gray-800 ring-1 ring-gray-200",
  })[(type || "").toLowerCase()] || "bg-gray-100 text-gray-800 ring-1 ring-gray-200";

  const getStatusDisplay = (status) => ({
    pending:       { pill: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200", text: "Pending"     },
    "in-progress": { pill: "bg-blue-100 text-blue-900 ring-1 ring-blue-200",       text: "In Progress" },
    "in progress": { pill: "bg-blue-100 text-blue-900 ring-1 ring-blue-200",       text: "In Progress" },
    resolved:      { pill: "bg-green-100 text-green-900 ring-1 ring-green-200",    text: "Resolved"    },
  })[(status || "").toLowerCase()] || { pill: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200", text: "Pending" };

  // ── Deploy tanod ──────────────────────────────────────────────────────────
  const openDeployModal = (complaint) => {
    setDeployTarget(complaint);
    setSelectedTanods(new Set());
    setTanodSearch("");
    setTanodPage(1);
    setDeployShiftTab(getCurrentShift()); // default tab = current shift
    setDeployError("");
    setShowDeployModal(true);
  };

  const toggleTanod = (uid) => {
    setSelectedTanods((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  };

  // currentShift for deploy modal logic
  const currentShift = getCurrentShift();

  // Whether the currently viewed tab is the active shift (selection allowed)
  const isViewingActiveShift = deployShiftTab === currentShift;

  // Tanods filtered by shift tab + search + verified
  const filteredTanods = useMemo(() => {
    const term = tanodSearch.toLowerCase();
    return tanods.filter((t) => {
      const isVerified = (t.idstatus || "").toLowerCase() === "verified";
      if (!isVerified) return false;
      // Shift tab filter
      const tanodShift = getTanodShift(t);
      if (deployShiftTab === "day"   && tanodShift === "night") return false;
      if (deployShiftTab === "night" && tanodShift === "day")   return false;
      // Search
      if (term && !t.fullName.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [tanods, tanodSearch, deployShiftTab]);

  const tanodTotalPages = Math.max(1, Math.ceil(filteredTanods.length / TANODS_PER_PAGE));
  const paginatedTanods = filteredTanods.slice(
    (tanodPage - 1) * TANODS_PER_PAGE,
    tanodPage * TANODS_PER_PAGE
  );

  // Tab switch: always allowed for viewing; clears selection when switching away from active shift
  const handleShiftTabChange = (tab) => {
    setDeployShiftTab(tab);
    // Clear any selections made on the active shift tab when switching to view-only tab
    // (or reset when coming back)
    setSelectedTanods(new Set());
    setTanodPage(1);
  };

  const confirmDeploy = async () => {
    if (selectedTanods.size < MIN_TANODS || !deployTarget) return;
    // Guard: only allow deploying from the active shift tab
    if (!isViewingActiveShift) return;

    const unapproved = [];
    for (const uid of selectedTanods) {
      const t = tanods.find((x) => x.uid === uid);
      if (!t || (t.idstatus || "").toLowerCase() !== "verified") unapproved.push(t?.fullName || uid);
    }
    if (unapproved.length > 0) {
      setDeployError(`Cannot deploy tanods with pending ID verification: ${unapproved.join(", ")}.`);
      return;
    }
    setDeploying(true);
    setDeployError("");
    try {
      const selectedArr    = [...selectedTanods];
      const deployedTanods = selectedArr.map((uid) => {
        const t = tanods.find((x) => x.uid === uid);
        return { uid, name: t?.fullName || "" };
      });
      const deployedTanodNames = deployedTanods.map((t) => t.name).join(", ");
      await updateDoc(
        doc(firestore, "users", deployTarget.userId, "userComplaints", deployTarget.complaintKey),
        { deployedTanods, deployedTanodUid: deployedTanods[0].uid, deployedTanodName: deployedTanodNames, status: "in-progress" }
      );
      const deployedAt = new Date().toISOString();
      for (const { uid, name } of deployedTanods) {
        const coDeployedTanods = deployedTanods.filter((t) => t.uid !== uid);
        await updateDoc(doc(firestore, "employee", uid), {
          deploymentStatus: "deployed",
          deployedTo: {
            complaintKey:    deployTarget.complaintKey,
            userId:          deployTarget.userId,
            complainantName: deployTarget.name,
            type:            deployTarget.type,
            incidentPurok:   deployTarget.incidentPurok,
            description:     deployTarget.message,
            deployedAt,
            coDeployedTanods,
          },
        });
      }
      const patch = (c) =>
        c.complaintKey === deployTarget.complaintKey
          ? { ...c, deployedTanods, deployedTanodUid: deployedTanods[0].uid, deployedTanodName: deployedTanodNames, status: "in-progress" }
          : c;
      setNotifications((prev) => prev.map(patch));
      setSelectedComplaint((prev) => prev ? patch(prev) : prev);
      setShowDeployModal(false);
      setDeployTarget(null);
      setSelectedTanods(new Set());
    } catch (err) {
      console.error(err);
      setDeployError("Failed to deploy tanods. Please try again.");
    } finally {
      setDeploying(false);
    }
  };

  // ── Direct resolve ────────────────────────────────────────────────────────
  const openConfirmResolve = (complaint) => {
    setResolvingComplaint(complaint);
    setShowConfirmResolve(true);
  };

  const confirmResolve = async () => {
    if (!resolvingComplaint) return;
    setResolving(true);
    try {
      await updateDoc(
        doc(firestore, "users", resolvingComplaint.userId, "userComplaints", resolvingComplaint.complaintKey),
        { status: "resolved", resolvedAt: serverTimestamp() }
      );
      const tanodsToResolve = [...(resolvingComplaint.deployedTanods || [])];
      if (tanodsToResolve.length === 0 && resolvingComplaint.deployedTanodUid) {
        tanodsToResolve.push({ uid: resolvingComplaint.deployedTanodUid, name: resolvingComplaint.deployedTanodName });
      }
      for (const { uid } of tanodsToResolve) {
        const tanodRef  = doc(firestore, "employee", uid);
        const tanodSnap = await getDoc(tanodRef);
        const deployedTo       = tanodSnap.exists() ? tanodSnap.data().deployedTo : null;
        const coDeployedTanods = tanodsToResolve.filter((t) => t.uid !== uid);
        await setDoc(
          doc(firestore, "employee", uid, "deploymentHistory", resolvingComplaint.complaintKey),
          {
            complaintKey:    resolvingComplaint.complaintKey,
            userId:          resolvingComplaint.userId,
            complainantName: resolvingComplaint.name,
            type:            resolvingComplaint.type,
            incidentPurok:   resolvingComplaint.incidentPurok,
            description:     resolvingComplaint.message,
            deployedAt:      deployedTo?.deployedAt || null,
            resolvedAt:      new Date().toISOString(),
            status:          "resolved",
            tanodRating:     null,
            tanodComment:    null,
            coDeployedTanods,
          }
        );
        await updateDoc(tanodRef, { deploymentStatus: "available", deployedTo: null });
      }
      const patch = (c) =>
        c.complaintKey === resolvingComplaint.complaintKey ? { ...c, status: "resolved" } : c;
      setNotifications((prev) => prev.map(patch));
      setSelectedComplaint((prev) => prev ? patch(prev) : prev);
      setShowConfirmResolve(false);
      setResolvingComplaint(null);
    } catch (err) {
      console.error(err);
      alert("Failed to resolve complaint.");
    } finally {
      setResolving(false);
    }
  };

  // ── Action button logic ───────────────────────────────────────────────────
  const handleActionClick = (complaint) => {
    if (complaint.status === "pending")                              openDeployModal(complaint);
    else if (["in-progress", "in progress"].includes(complaint.status)) openConfirmResolve(complaint);
  };

  const actionLabel = (s) =>
    s === "pending"                               ? "Deploy Tanod →"
    : ["in-progress", "in progress"].includes(s)  ? "Mark as Resolved"
    : "Resolved ✓";

  const actionBg = (s) =>
    s === "pending"                               ? "bg-blue-600 hover:bg-blue-700"
    : ["in-progress", "in progress"].includes(s)  ? "bg-green-600 hover:bg-green-700"
    : "bg-gray-400 cursor-not-allowed";

  // ── Current shift badge ───────────────────────────────────────────────────
  const nightNow = currentShift === "night";

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
      {/* Audio alert */}
      <audio ref={audioRef} src={sirenAudio} />

      {/* Auto-deploy toast */}
      {autoDeployToast && (
        <AutoDeployToast
          message={autoDeployToast.message}
          onDismiss={() => setAutoDeployToast(null)}
        />
      )}

      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${barangayLogo})`,
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.15,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Current shift indicator */}
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold shadow-sm ring-1 ${
            nightNow
              ? "bg-indigo-900 text-indigo-100 ring-indigo-700"
              : "bg-amber-50 text-amber-800 ring-amber-200"
          }`}>
            {nightNow
              ? <><FiMoon size={14} /> Evening Shift Active — Auto-deploy enabled for urgent complaints</>
              : <><FiSun  size={14} /> Morning Shift Active</>}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total"       value={stats.total}          tone="indigo" />
          <StatCard label="Pending"     value={stats.pending}        tone="yellow" />
          <StatCard label="In Progress" value={stats["in-progress"]} tone="blue"   />
          <StatCard label="Resolved"    value={stats.resolved}       tone="green"  />
        </div>

        {/* Filters */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60">
          <div className="p-5 space-y-4">
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-end justify-between">
              <div className="w-full xl:w-[380px]">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 text-gray-400 -translate-y-1/2" size={18} />
                  <input
                    type="text" placeholder="Search complaints..."
                    className="w-full pl-11 pr-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                {[["From", startDate, setStartDate], ["To", endDate, setEndDate]].map(([lbl, val, setter]) => (
                  <div key={lbl} className="flex flex-col w-full sm:w-[200px]">
                    <label className="text-xs font-bold text-gray-700 mb-1.5">
                      {lbl} <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input type="date" value={val} onChange={(e) => setter(e.target.value)}
                      className="px-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
                    />
                  </div>
                ))}
                {(startDate || endDate) && (
                  <div className="flex flex-col justify-end">
                    <button onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="px-4 py-3 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition">
                      Clear dates
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-col w-full sm:w-[220px]">
                <label className="text-xs font-bold text-gray-700 mb-1.5">Issue Type</label>
                <select value={issueFilter} onChange={(e) => setIssueFilter(e.target.value)}
                  className="px-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200">
                  <option value="all">All Types</option>
                  {issueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex gap-2 w-full xl:w-auto">
                {["all", "urgent", "non-urgent"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                      filter === f
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-lg"
                        : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {dateError && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold">{dateError}</div>
            )}

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold text-gray-700">Status:</span>
              {["all", "pending", "in-progress", "resolved"].map((s) => {
                const active = statusFilter === s;
                const style =
                  s === "pending"       ? "bg-yellow-600 text-white"
                  : s === "in-progress" ? "bg-blue-600 text-white"
                  : s === "resolved"    ? "bg-green-600 text-white"
                  : "bg-gray-900 text-white";
                return (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2.5 rounded-xl transition-all text-sm font-bold border ${
                      active ? `${style} border-transparent shadow-lg` : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {s === "all" ? "All Status" : s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
              <span className="text-gray-500 font-semibold">Loading complaints...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1080px] text-left">
                  <thead>
                    <tr className="bg-linear-to-r from-slate-50 via-white to-slate-50 border-b border-gray-200">
                      {["Urgency", "Purok", "Complainant", "Issue Type", "Description", "Deployed Tanod", "Date", "Status"].map((h) => (
                        <th key={h} className="px-5 py-4 text-xs font-extrabold tracking-wider text-gray-600 uppercase">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedNotifications.map((n, idx) => {
                      const urgency = getUrgencyDisplay(n.label);
                      const status  = getStatusDisplay(n.status);
                      return (
                        <tr key={n.complaintKey}
                          className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"} border-b border-gray-100 hover:bg-indigo-50/60 transition cursor-pointer`}
                          onClick={() => setSelectedComplaint(n)}>
                          <td className="px-5 py-4">
                            <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${urgency.pill}`}>
                              {urgency.icon}{urgency.text}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-sm font-bold text-gray-900">Purok {n.incidentPurok}</td>
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">{n.name}</div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${getIssueColor(n.type)}`}>{n.type}</span>
                          </td>
                          <td className="px-5 py-4 max-w-[280px]">
                            <p className="text-sm font-semibold text-gray-700 line-clamp-1">{n.message}</p>
                          </td>
                          <td className="px-5 py-4">
                            {n.deployedTanods && n.deployedTanods.length > 0
                              ? <div className="flex flex-col gap-1">
                                  {n.deployedTanods.map((t) => (
                                    <div key={t.uid} className="flex items-center gap-1.5">
                                      <FiShield className="text-indigo-500 shrink-0" size={14} />
                                      <span className="text-xs font-bold text-indigo-700">{t.name}</span>
                                    </div>
                                  ))}
                                </div>
                              : n.deployedTanodName
                              ? <div className="flex items-center gap-1.5"><FiShield className="text-indigo-500 shrink-0" size={14} /><span className="text-xs font-bold text-indigo-700">{n.deployedTanodName}</span></div>
                              : <span className="text-xs text-gray-400 font-semibold italic">Unassigned</span>}
                          </td>
                          <td className="px-5 py-4 text-sm font-semibold text-gray-800">{n.timestamp}</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${status.pill}`}>{status.text}</span>
                          </td>
                        </tr>
                      );
                    })}
                    {paginatedNotifications.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-gray-500 text-sm font-bold">No complaints found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={currentPage} totalPages={totalPages}
                onPageChange={setCurrentPage} totalItems={filteredNotifications.length}
                itemsPerPage={ITEMS_PER_PAGE}
              />
            </>
          )}
        </div>

        {/* ── Detail Modal ─────────────────────────────────────────────────── */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 p-4 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setSelectedComplaint(null)}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[96vh] shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="relative bg-linear-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
                <button className="absolute top-4 right-4 text-white/90 hover:bg-white/15 rounded-full p-2 transition"
                  onClick={() => setSelectedComplaint(null)}>
                  <FiX size={22} />
                </button>
                <h2 className="text-2xl font-extrabold">Complaint Details</h2>
                <p className="text-white/85 text-sm font-semibold mt-1">Case ID: {selectedComplaint.complaintKey}</p>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                  <div className={`rounded-xl px-4 py-3 ${getStatusDisplay(selectedComplaint.status).pill}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <FiCheckCircle size={18} />Status: {getStatusDisplay(selectedComplaint.status).text}
                    </div>
                  </div>
                  <div className={`rounded-xl px-4 py-3 ${getUrgencyDisplay(selectedComplaint.label).pill}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {getUrgencyDisplay(selectedComplaint.label).icon}
                      {getUrgencyDisplay(selectedComplaint.label).text}
                    </div>
                  </div>
                  {selectedComplaint.deployedTanods && selectedComplaint.deployedTanods.length > 0
                    ? selectedComplaint.deployedTanods.map((t) => (
                        <div key={t.uid} className="rounded-xl px-4 py-3 bg-indigo-50 ring-1 ring-indigo-200">
                          <div className="flex items-center gap-2 text-sm font-bold text-indigo-800">
                            <FiShield size={18} />Deployed: {t.name}
                          </div>
                        </div>
                      ))
                    : selectedComplaint.deployedTanodName && (
                        <div className="rounded-xl px-4 py-3 bg-indigo-50 ring-1 ring-indigo-200">
                          <div className="flex items-center gap-2 text-sm font-bold text-indigo-800">
                            <FiShield size={18} />Deployed: {selectedComplaint.deployedTanodName}
                          </div>
                        </div>
                      )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={<FiUser     size={18} />} title="Complainant"          value={selectedComplaint.name}                     tone="indigo" />
                  <InfoRow icon={<FiHome     size={18} />} title="Complainant Address"   value={selectedComplaint.address}                  tone="blue"   />
                  <InfoRow icon={<FiMapPin   size={18} />} title="Purok"                value={`Purok ${selectedComplaint.incidentPurok}`} tone="green"  />
                  <InfoRow icon={<FiMapPin   size={18} />} title="Incident Location"    value={selectedComplaint.incidentLocation}          tone="amber"  />
                  <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700"><FiFileText size={18} /></div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Issue Type</p>
                        <span className={`inline-flex mt-2 px-3 py-1.5 rounded-full text-sm font-bold ${getIssueColor(selectedComplaint.type)}`}>
                          {selectedComplaint.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <InfoRow icon={<FiCalendar size={18} />} title="Date Reported" value={selectedComplaint.timestamp} tone="orange" />
                  {selectedComplaint.evidencePhoto && (
                    <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                      <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider mb-2">Proof</p>
                      <img src={selectedComplaint.evidencePhoto} alt="Proof"
                        onClick={() => setPreviewImage(selectedComplaint.evidencePhoto)}
                        className="w-full h-auto object-cover rounded-xl shadow-lg border cursor-pointer hover:opacity-90 transition" />
                      <p className="mt-2 text-xs font-semibold text-gray-600">Click image to preview.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider mb-2">Complaint Description</p>
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{selectedComplaint.message}</p>
                </div>
              </div>

              <div className="border-t p-5 bg-white">
                <button disabled={selectedComplaint.status === "resolved"}
                  className={`w-full py-3.5 rounded-xl text-white text-base font-extrabold transition shadow-lg ${actionBg(selectedComplaint.status)}`}
                  onClick={() => handleActionClick(selectedComplaint)}>
                  {actionLabel(selectedComplaint.status)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Deploy Tanod Modal ──────────────────────────────────────────── */}
        {showDeployModal && (
          <div className="fixed inset-0 z-60 p-4 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowDeployModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}>

              {/* Header */}
              <div className="bg-linear-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-white/20 p-2.5 rounded-xl"><FiShield size={20} /></div>
                  <div>
                    <h3 className="text-lg font-extrabold">Deploy Tanods</h3>
                    <p className="text-indigo-100 text-xs font-semibold mt-0.5">
                      Select at least {MIN_TANODS} verified tanods to deploy
                    </p>
                  </div>
                </div>
                <button className="text-white/80 hover:text-white hover:bg-white/15 rounded-full p-2 transition"
                  onClick={() => setShowDeployModal(false)}>
                  <FiX size={20} />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Complaint summary */}
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Complaint</p>
                  <p className="text-sm font-bold text-gray-800 mt-1 line-clamp-2">{deployTarget?.message || "—"}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">
                    by {deployTarget?.name} · Purok {deployTarget?.incidentPurok}
                  </p>
                </div>

                {/* ── Shift Tabs ── Both clickable; off-shift is view-only */}
                <div className="flex rounded-xl overflow-hidden border border-gray-200 bg-gray-100 p-1 gap-1">
                  {[
                    { key: "day",   label: "Day Shift",   icon: <FiSun  size={14} /> },
                    { key: "night", label: "Night Shift", icon: <FiMoon size={14} /> },
                  ].map(({ key, label, icon }) => {
                    const isActive  = deployShiftTab === key;
                    const isOffShift = key !== currentShift; // viewing the non-active shift

                    return (
                      <button
                        key={key}
                        onClick={() => handleShiftTabChange(key)}
                        title={isOffShift ? `Viewing ${label} tanods — selection disabled (not current shift)` : `${label} is active`}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
                          isActive
                            ? key === "day"
                              ? "bg-amber-500 text-white shadow-md"
                              : "bg-indigo-700 text-white shadow-md"
                            : "text-gray-600 hover:bg-white hover:text-gray-900"
                        }`}
                      >
                        {icon}
                        {label}
                        {isOffShift && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 ml-1">
                            
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Shift context hint */}
                {isViewingActiveShift ? (
                  <p className="text-[11px] font-semibold text-gray-500 -mt-1">
                    {currentShift === "day"
                      ? "🌅 Day shift active. You can select and deploy day-shift tanods."
                      : "🌙 Night shift active. You can select and deploy night-shift tanods."}
                  </p>
                ) : (
                  <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 -mt-1">
                    <FiLock size={13} className="text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-[11px] font-bold text-amber-700">
                      You are viewing {deployShiftTab === "day" ? "day" : "night"}-shift tanods for reference only.
                      Deployment is disabled for the off-shift list.
                      Switch back to the{" "}
                      <span className="font-extrabold">{currentShift === "day" ? "Day" : "Night"} Shift</span> tab to deploy.
                    </p>
                  </div>
                )}

                {/* Error */}
                {deployError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                    <p className="text-xs font-extrabold text-red-700 uppercase tracking-wider">⚠ Deployment Error</p>
                    <p className="text-sm text-red-700 font-semibold mt-1">{deployError}</p>
                  </div>
                )}

                {/* Search + Select All row */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" size={16} />
                    <input type="text" placeholder="Search tanod by name..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
                      value={tanodSearch}
                      onChange={(e) => { setTanodSearch(e.target.value); setTanodPage(1); }}
                    />
                  </div>
                  {/* Select All — only shown on the active shift tab */}
                  {isViewingActiveShift && filteredTanods.length > 0 && (() => {
                    const availableUids = filteredTanods
                      .filter((t) => t.deploymentStatus !== "deployed")
                      .map((t) => t.uid);
                    const allSelected = availableUids.length > 0 &&
                      availableUids.every((uid) => selectedTanods.has(uid));
                    return (
                      <button
                        onClick={() => {
                          if (allSelected) {
                            setSelectedTanods((prev) => {
                              const next = new Set(prev);
                              availableUids.forEach((uid) => next.delete(uid));
                              return next;
                            });
                          } else {
                            setSelectedTanods((prev) => {
                              const next = new Set(prev);
                              availableUids.forEach((uid) => next.add(uid));
                              return next;
                            });
                          }
                        }}
                        disabled={availableUids.length === 0}
                        className={`shrink-0 px-4 py-2.5 rounded-xl text-sm font-extrabold border transition whitespace-nowrap ${
                          allSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-md"
                            : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {allSelected ? "✓ Deselect All" : "Select All"}
                      </button>
                    );
                  })()}
                </div>

                {/* Table */}
                {filteredTanods.length === 0 ? (
                  <p className="text-sm text-gray-500 font-semibold text-center py-6">
                    No verified {deployShiftTab} shift tanods available.
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto rounded-xl border border-gray-200">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50 border-b border-gray-200">
                            {/* Checkbox column header — only shown on active shift */}
                            {isViewingActiveShift && <th className="px-4 py-3 w-8"></th>}
                            {!isViewingActiveShift && (
                              <th className="px-4 py-3 w-8">
                                <FiLock size={13} className="text-gray-300" title="View only" />
                              </th>
                            )}
                            <th className="px-4 py-3 text-xs font-extrabold text-gray-600 uppercase tracking-wider">Name</th>
                            <th className="px-4 py-3 text-xs font-extrabold text-gray-600 uppercase tracking-wider">Role</th>
                            <th className="px-4 py-3 text-xs font-extrabold text-gray-600 uppercase tracking-wider">Shift</th>
                            <th className="px-4 py-3 text-xs font-extrabold text-gray-600 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {paginatedTanods.map((t) => {
                            const isDeployed  = t.deploymentStatus === "deployed";
                            const isSelected  = selectedTanods.has(t.uid);
                            const tanodShift  = getTanodShift(t);
                            // Rows are non-interactive when viewing the off-shift tab
                            const canSelect   = isViewingActiveShift && !isDeployed;
                            // A tanod is "off shift" when we're viewing the opposite shift tab
                            const isOffShiftRow = !isViewingActiveShift;

                            return (
                              <tr key={t.uid}
                                onClick={() => { if (canSelect) toggleTanod(t.uid); }}
                                className={`border-b border-gray-100 transition ${
                                  isOffShiftRow
                                    ? "opacity-60 cursor-default bg-gray-50/60"
                                    : isDeployed
                                    ? "opacity-50 cursor-not-allowed bg-gray-50"
                                    : isSelected
                                    ? "bg-indigo-50 ring-1 ring-indigo-300 cursor-pointer"
                                    : "hover:bg-gray-50 cursor-pointer"
                                }`}>
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    disabled={!canSelect}
                                    onChange={() => { if (canSelect) toggleTanod(t.uid); }}
                                    className={`w-4 h-4 ${canSelect ? "accent-indigo-600 cursor-pointer" : "cursor-not-allowed opacity-30"}`}
                                  />
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                      <FiUser size={14} />
                                    </div>
                                    <span className="text-sm font-extrabold text-gray-900 truncate">{t.fullName}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs font-semibold text-gray-500 capitalize">{t.position || "Tanod"}</td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                    tanodShift === "day"
                                      ? "bg-amber-100 text-amber-700 ring-1 ring-amber-200"
                                      : tanodShift === "night"
                                      ? "bg-indigo-100 text-indigo-700 ring-1 ring-indigo-200"
                                      : "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
                                  }`}>
                                    {tanodShift === "day" ? <FiSun size={11} /> : tanodShift === "night" ? <FiMoon size={11} /> : null}
                                    {tanodShift === "day" ? "Day (8AM–5PM)" : tanodShift === "night" ? "Night (7PM–5AM)" : "Unset"}
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                    isOffShiftRow
                                      ? "bg-gray-100 text-gray-500 ring-1 ring-gray-200"
                                      : isDeployed
                                      ? "bg-red-100 text-red-700 ring-1 ring-red-200"
                                      : "bg-green-100 text-green-700 ring-1 ring-green-200"
                                  }`}>
                                    {isOffShiftRow ? "Off Shift" : isDeployed ? "Deployed" : "Available"}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {tanodTotalPages > 1 && (
                      <div className="flex items-center justify-between pt-1">
                        <p className="text-xs font-semibold text-gray-500">
                          Page {tanodPage} of {tanodTotalPages} · {filteredTanods.length} tanod{filteredTanods.length !== 1 ? "s" : ""}
                        </p>
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setTanodPage((p) => Math.max(1, p - 1))} disabled={tanodPage <= 1}
                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            <FiChevronLeft size={16} />
                          </button>
                          <button onClick={() => setTanodPage((p) => Math.min(tanodTotalPages, p + 1))} disabled={tanodPage >= tanodTotalPages}
                            className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition">
                            <FiChevronRight size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Footer */}
              <div className="border-t px-6 py-4 bg-slate-50 space-y-3 shrink-0">
                {/* Selected chips — only shown when on active shift */}
                {isViewingActiveShift && selectedTanods.size > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-gray-600">Selected ({selectedTanods.size}):</span>
                    {[...selectedTanods].map((uid) => {
                      const t = tanods.find((x) => x.uid === uid);
                      return (
                        <span key={uid} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold ring-1 ring-indigo-200">
                          <FiShield size={12} />{t?.fullName || uid}
                          <button onClick={() => toggleTanod(uid)} className="ml-0.5 hover:text-red-600 transition"><FiX size={12} /></button>
                        </span>
                      );
                    })}
                  </div>
                )}
                {isViewingActiveShift && selectedTanods.size > 0 && selectedTanods.size < MIN_TANODS && (
                  <p className="text-xs font-bold text-amber-600">Select at least {MIN_TANODS} tanods to deploy.</p>
                )}

                <div className="flex gap-3">
                  <button onClick={() => { setShowDeployModal(false); setDeployError(""); }}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 transition">
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeploy}
                    disabled={!isViewingActiveShift || selectedTanods.size < MIN_TANODS || deploying}
                    title={!isViewingActiveShift ? `Switch to the ${currentShift} shift tab to deploy` : ""}
                    className={`flex-1 py-3 rounded-xl text-white font-extrabold text-sm transition shadow-md ${
                      !isViewingActiveShift || selectedTanods.size < MIN_TANODS || deploying
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}>
                    {deploying
                      ? "Deploying…"
                      : !isViewingActiveShift
                      ? `🔒 View Only`
                      : `Deploy ${selectedTanods.size} Tanod${selectedTanods.size !== 1 ? "s" : ""} →`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Confirm Resolve Modal ────────────────────────────────────────── */}
        {showConfirmResolve && (
          <ConfirmResolveModal
            complaint={resolvingComplaint}
            onConfirm={confirmResolve}
            onCancel={() => { setShowConfirmResolve(false); setResolvingComplaint(null); }}
            resolving={resolving}
          />
        )}

        {/* ── Image Preview ─────────────────────────────────────────────────── */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-80 p-4"
            onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Preview"
              className="max-w-[92%] max-h-[92%] rounded-2xl shadow-2xl border border-white/20" />
            <button className="absolute top-6 right-6 text-white text-4xl font-extrabold"
              onClick={() => setPreviewImage(null)}>✖</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notiftable;

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, tone }) => {
  const t = {
    indigo: { ring: "ring-indigo-200", bg: "from-indigo-50 to-white", dot: "bg-indigo-600", text: "text-indigo-700" },
    yellow: { ring: "ring-yellow-200", bg: "from-yellow-50 to-white", dot: "bg-yellow-600", text: "text-yellow-700" },
    blue:   { ring: "ring-blue-200",   bg: "from-blue-50 to-white",   dot: "bg-blue-600",   text: "text-blue-700"   },
    green:  { ring: "ring-green-200",  bg: "from-green-50 to-white",  dot: "bg-green-600",  text: "text-green-700"  },
  }[tone] || {};
  return (
    <div className="rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
      <div className={`p-5 bg-linear-to-b ${t.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-extrabold uppercase tracking-wider ${t.text}`}>{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{value}</p>
          </div>
          <div className={`shrink-0 w-3.5 h-3.5 rounded-full ${t.dot} ring-8 ${t.ring}`} />
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, title, value, tone }) => {
  const chip = {
    indigo: "bg-indigo-100 text-indigo-700",
    green:  "bg-green-100 text-green-700",
    amber:  "bg-amber-100 text-amber-700",
    orange: "bg-orange-100 text-orange-700",
    blue:   "bg-blue-100 text-blue-700",
  }[tone] || "bg-indigo-100 text-indigo-700";
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${chip}`}>{icon}</div>
        <div className="flex-1">
          <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-sm font-extrabold text-gray-900">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
};