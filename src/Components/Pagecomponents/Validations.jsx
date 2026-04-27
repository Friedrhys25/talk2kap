// Validations.jsx - sorted by createdAt (newest first) for both residents & tanods
// Verified residents → Usertable | Verified tanods → EmployeeTable
import React, { useState, useEffect, useMemo } from "react";
import barangayLogo from "../../assets/sanroquelogo.png";

import {
  FiUser, FiPhone, FiMapPin, FiHome,
  FiX, FiSearch, FiCheck, FiSlash, FiTrash2, FiShield, FiSun, FiMoon,
  FiChevronLeft, FiChevronRight, FiClock, FiAlertCircle, FiUserX,
} from "react-icons/fi";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import app from "../../firebaseConfig";

const firestore = getFirestore(app);

const RESIDENT_PAGE_SIZE = 10;
const TANOD_PAGE_SIZE = 5;

const normalizeStatus = (s) => {
  const v = (s || "pending").toLowerCase();
  if (v === "approved" || v === "verified") return "verified";
  if (v === "declined") return "declined";
  return "pending";
};

const statusChip = (status) => {
  const s = normalizeStatus(status);
  if (s === "verified") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "declined") return "bg-rose-100 text-rose-800 border-rose-200";
  return "bg-amber-100 text-amber-800 border-amber-200";
};

const statusLabel = (status) => {
  const s = normalizeStatus(status);
  if (s === "verified") return "Verified";
  if (s === "declined") return "Declined";
  return "Pending";
};

const toDate = (value) => {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === "object" && typeof value.seconds === "number")
    return new Date(value.seconds * 1000);
  if (typeof value === "number") return new Date(value * 1000);
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

const formatDate = (value) => {
  const d = toDate(value);
  if (!d) return "—";
  return d.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

// ── Toast Notification ──────────────────────────────────────────────────────
const Toast = ({ toast, onDismiss }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const isApproved = toast.type === "approved";

  return (
    <div
      className="fixed top-6 left-1/2 z-9999 -translate-x-1/2"
      style={{ animation: "toastSlideIn 0.35s cubic-bezier(0.34,1.56,0.64,1) both" }}
    >
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translate(-50%, -28px) scale(0.92); }
          to   { opacity: 1; transform: translate(-50%, 0)     scale(1);    }
        }
        @keyframes toastPop {
          0%   { transform: scale(1);    }
          40%  { transform: scale(1.13); }
          70%  { transform: scale(0.96); }
          100% { transform: scale(1);    }
        }
      `}</style>

      <div
        className={`flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl border ${
          isApproved
            ? "bg-emerald-600 border-emerald-400 text-white"
            : toast.type === "disabled"
            ? "bg-gray-700 border-gray-500 text-white"
            : "bg-rose-600 border-rose-400 text-white"
        }`}
        style={{ minWidth: 320 }}
      >
        <div
          className="flex items-center justify-center w-11 h-11 rounded-full border-2 shrink-0 bg-white/20 border-white/40"
          style={{ animation: "toastPop 0.5s 0.15s cubic-bezier(0.34,1.56,0.64,1) both" }}
        >
          {isApproved ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : toast.type === "disabled" ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-base font-extrabold leading-tight">
            {isApproved
              ? "Successfully Approved!"
              : toast.type === "disabled"
              ? "Account Disabled!"
              : "Successfully Declined!"}
          </p>
          <p className="text-xs font-semibold opacity-80 mt-0.5 truncate">{toast.name}</p>
        </div>

        <button
          onClick={onDismiss}
          className="ml-2 p-1.5 rounded-full hover:bg-white/20 transition shrink-0"
        >
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
};

// ── Decline Reason Modal ────────────────────────────────────────────────────
const DeclineModal = ({ user, onConfirm, onCancel }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError("Please enter a reason for declining.");
      return;
    }
    onConfirm(reason.trim());
  };

  if (!user) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-60 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-[22px] w-full max-w-md relative shadow-2xl overflow-hidden border border-white/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="relative p-6 text-white bg-linear-to-r from-rose-600 via-rose-500 to-rose-700">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
          <button
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-all"
            onClick={onCancel}
          >
            <FiX size={22} />
          </button>
          <div className="relative flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 border border-white/30">
              <FiAlertCircle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">Decline Account</h2>
              <p className="text-rose-100 text-xs font-semibold mt-0.5 truncate max-w-60">
                {user.complainant || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
              Reason for Declining <span className="text-rose-500">*</span>
            </label>
            <textarea
              className={`w-full px-4 py-3 rounded-xl border ${
                error ? "border-rose-400 focus:ring-rose-400" : "border-gray-200 focus:ring-indigo-400"
              } bg-gray-50 text-sm font-semibold text-gray-800 resize-none focus:outline-none focus:ring-2 focus:border-transparent transition`}
              rows={4}
              placeholder="Enter the reason for declining this account..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
            />
            {error && (
              <p className="mt-1.5 text-xs font-bold text-rose-600 flex items-center gap-1">
                <FiAlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 font-extrabold hover:bg-gray-200 transition"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-extrabold hover:bg-rose-700 transition shadow-md"
              onClick={handleConfirm}
            >
              ✕ Confirm Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Pagination Component ────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) {
      pages.push(i);
    } else if (i === left - 1 || i === right + 1) {
      pages.push("...");
    }
  }

  const dedupedPages = pages.filter(
    (p, idx) => !(p === "..." && pages[idx - 1] === "...")
  );

  const btnBase = `inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-extrabold border transition`;
  const activeBtn = "bg-indigo-600 text-white border-indigo-600 shadow";
  const inactiveBtn = "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";
  const disabledBtn = "bg-white text-gray-300 border-gray-100 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white/60">
      <p className="text-xs font-semibold text-gray-500">
        Showing <span className="font-extrabold text-gray-700">{from}–{to}</span> of{" "}
        <span className="font-extrabold text-gray-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? disabledBtn : inactiveBtn}`}
        >
          <FiChevronLeft size={14} />
        </button>
        {dedupedPages.map((p, idx) =>
          p === "..." ? (
            <span key={`ellipsis-${idx}`} className="w-8 text-center text-xs text-gray-400 font-bold">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`${btnBase} ${currentPage === p ? activeBtn : inactiveBtn}`}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`${btnBase} ${currentPage === totalPages ? disabledBtn : inactiveBtn}`}
        >
          <FiChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

const Validations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [purokFilter, setPurokFilter] = useState("All Purok");
  const [users, setUsers] = useState([]);
  const [tanods, setTanods] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tanodLoading, setTanodLoading] = useState(true);

  // Toast state
  const [toast, setToast] = useState(null);

  // Decline modal state
  const [declineTarget, setDeclineTarget] = useState(null);

  // Pagination state
  const [residentPage, setResidentPage] = useState(1);
  const [tanodPage, setTanodPage] = useState(1);

  // Tanod-specific filters
  const [tanodSearch, setTanodSearch] = useState("");
  const [tanodPurokFilter, setTanodPurokFilter] = useState("All Purok");

  // Reset pages when filters change
  useEffect(() => { setResidentPage(1); }, [searchTerm, filter, purokFilter]);
  useEffect(() => { setTanodPage(1); }, [tanodSearch, tanodPurokFilter]);

  // ── Firestore listener (Residents) ────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        const userArray = [];
        snapshot.forEach((docSnap) => {
          const user = docSnap.data();
          userArray.push({
            id: docSnap.id,
            complainant: [user.firstName, user.middleName, user.lastName]
              .filter(Boolean).join(" ").trim() || "—",
            ...user,
            idstatus: normalizeStatus(user.idstatus),
          });
        });

        userArray.sort((a, b) => {
          const da = toDate(a.createdAt);
          const db = toDate(b.createdAt);
          if (da && db) return db - da;
          if (da) return -1;
          if (db) return 1;
          return (a.complainant || "").localeCompare(b.complainant || "");
        });

        setUsers(userArray);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Firestore listener (Tanods/Employees) ─────────────────────────────────
  useEffect(() => {
    const empCol = collection(firestore, "employee");
    const unsubscribe = onSnapshot(
      empCol,
      (snapshot) => {
        const tanodArray = [];
        snapshot.forEach((docSnap) => {
          const tanod = docSnap.data();
          tanodArray.push({
            id: docSnap.id,
            complainant: [tanod.firstName, tanod.middleName, tanod.lastName]
              .filter(Boolean).join(" ").trim() || "—",
            ...tanod,
            idstatus: normalizeStatus(tanod.idstatus),
            _collection: "employee",
          });
        });

        tanodArray.sort((a, b) => {
          const da = toDate(a.createdAt);
          const db = toDate(b.createdAt);
          if (da && db) return db - da;
          if (da) return -1;
          if (db) return 1;
          return (a.complainant || "").localeCompare(b.complainant || "");
        });

        setTanods(tanodArray);
        setTanodLoading(false);
      },
      (err) => {
        console.error("Firestore error fetching tanods:", err);
        setTanodLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const residents = useMemo(() => users, [users]);

  // ── Purok options ─────────────────────────────────────────────────────────
  const purokOptions = useMemo(() => {
    const base = ["All Purok", "Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"];
    const unique = new Set();
    residents.forEach((u) => {
      const p = u.purok;
      if (p != null && String(p).trim() !== "") unique.add(String(p).trim());
    });
    const baseSet = new Set(base);
    const extras = Array.from(unique)
      .map((p) => `Purok ${p}`)
      .filter((l) => !baseSet.has(l))
      .sort((a, b) => {
        const pa = a.replace(/^Purok\s+/i, "").trim();
        const pb = b.replace(/^Purok\s+/i, "").trim();
        const na = Number(pa), nb = Number(pb);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return pa.localeCompare(pb);
      });
    return [...base, ...extras];
  }, [residents]);

  const tanodPurokOptions = useMemo(() => {
    const base = ["All Purok", "Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"];
    const unique = new Set();
    tanods.forEach((u) => {
      const p = u.purok;
      if (p != null && String(p).trim() !== "") unique.add(String(p).trim());
    });
    const baseSet = new Set(base);
    const extras = Array.from(unique)
      .map((p) => `Purok ${p}`)
      .filter((l) => !baseSet.has(l))
      .sort((a, b) => {
        const pa = a.replace(/^Purok\s+/i, "").trim();
        const pb = b.replace(/^Purok\s+/i, "").trim();
        const na = Number(pa), nb = Number(pb);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return pa.localeCompare(pb);
      });
    return [...base, ...extras];
  }, [tanods]);

  // ── Stats (counted from full arrays so totals remain informative) ─────────
  const stats = useMemo(() => ({
    total:    residents.filter((u) => u.idstatus !== "verified").length,
    pending:  residents.filter((u) => u.idstatus === "pending").length,
    declined: residents.filter((u) => u.idstatus === "declined").length,
    verified: residents.filter((u) => u.idstatus === "verified").length,
  }), [residents]);

  const tanodStats = useMemo(() => ({
    total:    tanods.filter((u) => u.idstatus !== "verified").length,
    pending:  tanods.filter((u) => u.idstatus === "pending").length,
    declined: tanods.filter((u) => u.idstatus === "declined").length,
    verified: tanods.filter((u) => u.idstatus === "verified").length,
  }), [tanods]);

  // ── Filtered residents (verified excluded — they live in Usertable) ───────
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return residents.filter((user) => {
      // Verified residents move to Usertable — exclude from this view
      if (user.idstatus === "verified") return false;

      const matchesFilter = filter === "all" || user.idstatus === filter;
      const matchesSearch =
        (user.complainant || "").toLowerCase().includes(term) ||
        String(user.number || "").toLowerCase().includes(term) ||
        String(user.purok || "").toLowerCase().includes(term) ||
        String(user.address || "").toLowerCase().includes(term);
      const matchesPurok =
        purokFilter === "All Purok"
          ? true
          : `Purok ${String(user.purok ?? "").trim()}` === purokFilter;
      return matchesFilter && matchesSearch && matchesPurok;
    });
  }, [residents, filter, searchTerm, purokFilter]);

  // ── Paginated residents ───────────────────────────────────────────────────
  const residentTotalPages = Math.max(1, Math.ceil(filteredUsers.length / RESIDENT_PAGE_SIZE));
  const paginatedResidents = useMemo(() => {
    const start = (residentPage - 1) * RESIDENT_PAGE_SIZE;
    return filteredUsers.slice(start, start + RESIDENT_PAGE_SIZE);
  }, [filteredUsers, residentPage]);

  // ── Filtered tanods (verified excluded — they live in EmployeeTable) ──────
  const filteredTanods = useMemo(() => {
    const term = tanodSearch.toLowerCase();
    return tanods.filter((user) => {
      // Verified tanods move to EmployeeTable — exclude from this view
      if (user.idstatus === "verified") return false;

      const matchesSearch =
        (user.complainant || "").toLowerCase().includes(term) ||
        String(user.number || "").toLowerCase().includes(term) ||
        String(user.purok || "").toLowerCase().includes(term) ||
        String(user.address || "").toLowerCase().includes(term) ||
        String(user.position || "").toLowerCase().includes(term) ||
        String(user.email || "").toLowerCase().includes(term);
      const matchesPurok =
        tanodPurokFilter === "All Purok"
          ? true
          : `Purok ${String(user.purok ?? "").trim()}` === tanodPurokFilter;
      return matchesSearch && matchesPurok;
    });
  }, [tanods, tanodSearch, tanodPurokFilter]);

  // ── Paginated tanods ──────────────────────────────────────────────────────
  const tanodTotalPages = Math.max(1, Math.ceil(filteredTanods.length / TANOD_PAGE_SIZE));
  const paginatedTanods = useMemo(() => {
    const start = (tanodPage - 1) * TANOD_PAGE_SIZE;
    return filteredTanods.slice(start, start + TANOD_PAGE_SIZE);
  }, [filteredTanods, tanodPage]);

  // ── Shift helpers ─────────────────────────────────────────────────────────
  const shiftChip = (shift) => {
    if (!shift || shift === "none") return "bg-gray-100 text-gray-500 border-gray-200";
    if (shift === "morning") return "bg-amber-100 text-amber-800 border-amber-200";
    if (shift === "evening") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    return "bg-gray-100 text-gray-500 border-gray-200";
  };

  const shiftLabel = (shift) => {
    if (shift === "morning") return "☀️ Morning";
    if (shift === "evening") return "🌙 Evening";
    return "No Shift";
  };

  // ── Decline flow ──────────────────────────────────────────────────────────
  const initiateDecline = (user) => {
    const isResident = residents.some((u) => u.id === user.id);
    setDeclineTarget({
      id: user.id,
      name: user.complainant || "User",
      collection: isResident ? "users" : "employee",
    });
  };

  const confirmDecline = async (reason) => {
    if (!declineTarget) return;
    try {
      await updateDoc(doc(firestore, declineTarget.collection, declineTarget.id), {
        idstatus: "declined",
        declineMessage: reason,
      });

      if (declineTarget.collection === "users") {
        setUsers((prev) =>
          prev.map((u) =>
            u.id === declineTarget.id
              ? { ...u, idstatus: "declined", declineMessage: reason }
              : u
          )
        );
      } else {
        setTanods((prev) =>
          prev.map((t) =>
            t.id === declineTarget.id
              ? { ...t, idstatus: "declined", declineMessage: reason }
              : t
          )
        );
      }

      if (selectedUser?.id === declineTarget.id) {
        setSelectedUser((prev) =>
          prev ? { ...prev, idstatus: "declined", declineMessage: reason } : prev
        );
      }

      setToast({ type: "declined", name: declineTarget.name });
      setDeclineTarget(null);
    } catch (err) {
      console.error("Error declining:", err);
      alert("Failed to decline user.");
    }
  };

  // ── Approve ───────────────────────────────────────────────────────────────
  const approveUser = async (id) => {
    try {
      const isResident = residents.some((u) => u.id === id);
      const isTanod = tanods.some((t) => t.id === id);
      const userName = selectedUser?.complainant || "User";

      if (isResident) {
        await updateDoc(doc(firestore, "users", id), { idstatus: "verified" });
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, idstatus: "verified" } : u))
        );
        if (selectedUser?.id === id)
          setSelectedUser((prev) => (prev ? { ...prev, idstatus: "verified" } : prev));
      } else if (isTanod) {
        await updateDoc(doc(firestore, "employee", id), { idstatus: "verified" });
        setTanods((prev) =>
          prev.map((t) => (t.id === id ? { ...t, idstatus: "verified" } : t))
        );
        if (selectedUser?.id === id)
          setSelectedUser((prev) => (prev ? { ...prev, idstatus: "verified" } : prev));
      }

      setToast({ type: "approved", name: userName });
      // Close the modal — the user is now verified and leaves this table
      setSelectedUser(null);
    } catch (err) {
      console.error("Error approving:", err);
      alert("Failed to approve user.");
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently? This cannot be undone.")) return;
    try {
      const isResident = residents.some((u) => u.id === id);
      const isTanod = tanods.some((t) => t.id === id);

      if (isResident) {
        await deleteDoc(doc(firestore, "users", id));
        setUsers((prev) => prev.filter((u) => u.id !== id));
      } else if (isTanod) {
        await deleteDoc(doc(firestore, "employee", id));
        setTanods((prev) => prev.filter((t) => t.id !== id));
      }

      if (selectedUser?.id === id) setSelectedUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  // ── Disable Account ───────────────────────────────────────────────────────
  const disableAccount = async (id) => {
    if (!window.confirm("Disable this account? The user will no longer be able to log in.")) return;
    try {
      const isResident = residents.some((u) => u.id === id);
      const isTanod = tanods.some((t) => t.id === id);
      const userName = selectedUser?.complainant || "User";

      if (isResident) {
        await updateDoc(doc(firestore, "users", id), { disabled: true });
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, disabled: true } : u))
        );
        if (selectedUser?.id === id)
          setSelectedUser((prev) => (prev ? { ...prev, disabled: true } : prev));
      } else if (isTanod) {
        await updateDoc(doc(firestore, "employee", id), { disabled: true });
        setTanods((prev) =>
          prev.map((t) => (t.id === id ? { ...t, disabled: true } : t))
        );
        if (selectedUser?.id === id)
          setSelectedUser((prev) => (prev ? { ...prev, disabled: true } : prev));
      }

      setToast({ type: "disabled", name: userName });
    } catch (err) {
      console.error("Error disabling account:", err);
      alert("Failed to disable account.");
    }
  };

  // ── Update Shift ──────────────────────────────────────────────────────────
  const updateShift = async (id, newShift) => {
    try {
      const isResident = residents.some((u) => u.id === id);
      const isTanod = tanods.some((t) => t.id === id);

      if (isResident) {
        await updateDoc(doc(firestore, "users", id), { shift: newShift });
        setUsers((prev) =>
          prev.map((u) => (u.id === id ? { ...u, shift: newShift } : u))
        );
        if (selectedUser?.id === id)
          setSelectedUser((prev) => (prev ? { ...prev, shift: newShift } : prev));
      } else if (isTanod) {
        await updateDoc(doc(firestore, "employee", id), { shift: newShift });
        setTanods((prev) =>
          prev.map((t) => (t.id === id ? { ...t, shift: newShift } : t))
        );
        if (selectedUser?.id === id)
          setSelectedUser((prev) => (prev ? { ...prev, shift: newShift } : prev));
      }
    } catch (err) {
      console.error("Error updating shift:", err);
      alert("Failed to update shift.");
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
      {/* Toast Notification */}
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Decline Modal */}
      {declineTarget && (
        <DeclineModal
          user={declineTarget}
          onConfirm={confirmDecline}
          onCancel={() => setDeclineTarget(null)}
        />
      )}

      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${barangayLogo})`,
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.16,
          filter: "brightness(1.35) contrast(1.08)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 1: RESIDENTS
        ══════════════════════════════════════════════════════════════════ */}

        <div className="flex items-center gap-3">
          <FiUser className="text-indigo-600" size={22} />
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Resident Validations</h1>
        
          
        </div>

        {/* Resident search & purok filter */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div />
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-[420px]">
              <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, contact, purok, address..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-56">
              <select
                value={purokFilter}
                onChange={(e) => setPurokFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm font-bold text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {purokOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Resident stats + filter buttons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: "total",    label: "Awaiting Review", value: stats.total,    color: "text-gray-900"    },
              { key: "pending",  label: "Pending",          value: stats.pending,  color: "text-amber-700"   },
              { key: "declined", label: "Declined",         value: stats.declined, color: "text-rose-700"    },
            ].map(({ key, label, value, color }) => (
              <div key={key} className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
                <div className="relative p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">{label}</p>
                  <p className={`mt-1 text-3xl font-extrabold tracking-tight ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-3">Filter</p>
              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {["all", "pending", "declined"].map((f) => {
                  const active = filter === f;
                  const activeStyle =
                    f === "declined" ? "bg-rose-600 text-white border-rose-600" :
                    f === "pending"  ? "bg-amber-500 text-white border-amber-500" :
                    "bg-indigo-600 text-white border-indigo-600";
                  return (
                    <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${
                        active
                          ? `${activeStyle} shadow-md`
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Residents Table */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
              <span className="text-gray-500 font-semibold">Loading users...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead className="bg-white sticky top-0 z-10">
                    <tr className="border-b border-gray-200">
                      {["Name", "Contact", "Purok", "Address", "Registered", "ID Verification", "Status", "Actions"].map((h) => (
                        <th
                          key={h}
                          className={`px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-600 ${h === "Actions" ? "text-right" : ""}`}
                        >
                          {h === "Registered" ? (
                            <span className="inline-flex items-center gap-1">
                              <FiClock size={11} /> {h}
                            </span>
                          ) : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedResidents.map((user, idx) => (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-100 transition ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        } hover:bg-indigo-50/50 cursor-pointer`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="px-6 py-4 font-bold text-gray-900">{user.complainant || "—"}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">{user.number || "—"}</td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">Purok {user.purok || "—"}</td>
                        <td className="px-6 py-4 max-w-sm truncate text-sm text-gray-700" title={user.address || ""}>
                          {user.address || "—"}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500 font-semibold whitespace-nowrap">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          {user.idImage ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <FiCheck /> Sent
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border bg-slate-100 text-slate-700 border-slate-200">
                              <FiSlash /> None
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${statusChip(user.idstatus)}`}>
                            {statusLabel(user.idstatus)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => deleteUser(user.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {filteredUsers.length === 0 && (
                      <tr>
                        <td colSpan={8} className="text-center py-10 text-gray-500 font-semibold">
                          No registrations found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={residentPage}
                totalPages={residentTotalPages}
                onPageChange={setResidentPage}
                totalItems={filteredUsers.length}
                pageSize={RESIDENT_PAGE_SIZE}
              />
            </>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            SECTION 2: TANOD / EMPLOYEES
        ══════════════════════════════════════════════════════════════════ */}

        <div className="border-t-2 border-dashed border-indigo-200 pt-4" />

        <div className="flex items-center gap-3">
          <FiShield className="text-indigo-600" size={22} />
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Tanod / Employee Validations</h1>
       
          
        </div>

        {/* Tanod search & purok filter */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div />
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <div className="relative w-full lg:w-[420px]">
              <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search name, contact, purok, position, email..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={tanodSearch}
                onChange={(e) => setTanodSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-56">
              <select
                value={tanodPurokFilter}
                onChange={(e) => setTanodPurokFilter(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm font-bold text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                {tanodPurokOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Tanod stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: "total",    label: "Awaiting Review", value: tanodStats.total,    color: "text-gray-900"    },
            { key: "pending",  label: "Pending",          value: tanodStats.pending,  color: "text-amber-700"   },
            { key: "declined", label: "Declined",         value: tanodStats.declined, color: "text-rose-700"    },
          ].map(({ key, label, value, color }) => (
            <div key={key} className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
              <div className="relative p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">{label}</p>
                <p className={`mt-1 text-3xl font-extrabold tracking-tight ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tanod Table */}
        <div className="rounded-2xl border border-indigo-100 bg-white/80 backdrop-blur shadow-2xl overflow-hidden">
          {tanodLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
              <span className="text-gray-500 font-semibold">Loading tanods...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1200px] text-left">
                  <thead className="bg-indigo-50 sticky top-0 z-10">
                    <tr className="border-b border-indigo-100">
                      {["Name", "Contact", "Purok", "Address", "Position", "Shift", "Registered", "ID Status", "Verification", "Actions"].map((h) => (
                        <th
                          key={h}
                          className={`px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-indigo-700 ${h === "Actions" ? "text-right" : ""}`}
                        >
                          {h === "Registered" ? (
                            <span className="inline-flex items-center gap-1">
                              <FiClock size={11} /> {h}
                            </span>
                          ) : h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTanods.map((user, idx) => {
                      const isDeclined = user.idstatus === "declined";
                      return (
                        <tr
                          key={user.id}
                          className={`border-b border-indigo-50 transition ${
                            idx % 2 === 0 ? "bg-white" : "bg-indigo-50/30"
                          } hover:bg-indigo-50/70 cursor-pointer`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <td className="px-6 py-4 font-bold text-gray-900">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 text-indigo-600">
                                <FiShield size={13} />
                              </span>
                              {user.complainant || "—"}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800">{user.number || "—"}</td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-800">Purok {user.purok || "—"}</td>
                          <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-700" title={user.address || ""}>
                            {user.address || "—"}
                          </td>
                          <td className="px-6 py-4">
                            {user.position ? (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border bg-indigo-100 text-indigo-700 border-indigo-200 capitalize">
                                {user.position}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">—</span>
                            )}
                          </td>
                          {/* Shift — disabled if declined */}
                          <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                            {isDeclined ? (
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-extrabold border ${shiftChip(user.shift)}`}>
                                {shiftLabel(user.shift)}
                              </span>
                            ) : (
                              <select
                                value={user.shift || "none"}
                                onChange={(e) => updateShift(user.id, e.target.value)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${shiftChip(user.shift)}`}
                              >
                                <option value="none">No Shift</option>
                                <option value="morning">☀️ Morning</option>
                                <option value="evening">🌙 Evening</option>
                              </select>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500 font-semibold whitespace-nowrap">
                            {formatDate(user.createdAt)}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${statusChip(user.idstatus)}`}>
                              {statusLabel(user.idstatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {user.idImage ? (
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
                                <FiCheck /> Sent
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border bg-slate-100 text-slate-700 border-slate-200">
                                <FiSlash /> None
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                            >
                              <FiTrash2 /> Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredTanods.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-10 text-gray-500 font-semibold">
                          No tanods found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <Pagination
                currentPage={tanodPage}
                totalPages={tanodTotalPages}
                onPageChange={setTanodPage}
                totalItems={filteredTanods.length}
                pageSize={TANOD_PAGE_SIZE}
              />
            </>
          )}
        </div>

        {/* ── Detail Modal ──────────────────────────────────────────────── */}
        {selectedUser && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm z-50 p-4"
            onClick={() => setSelectedUser(null)}
          >
            <div
              className="bg-white rounded-[22px] w-full max-w-2xl relative shadow-2xl overflow-hidden border border-white/60 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="relative p-6 text-white bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-700">
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <button
                  className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-all"
                  onClick={() => setSelectedUser(null)}
                >
                  <FiX size={22} />
                </button>
                <div className="relative">
                  <div className="flex items-start gap-4">
                    {selectedUser.isEmployee && (
                      <div className="relative bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 w-20 h-20 flex items-center justify-center overflow-hidden shrink-0">
                        {selectedUser.avatar ? (
                          <img
                            src={selectedUser.avatar}
                            alt={selectedUser.complainant}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        ) : (
                          <FiUser className="text-white" size={32} />
                        )}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl md:text-2xl font-extrabold">
                          {selectedUser._collection === "employee" ? "Tanod Details" : "User Details"}
                        </h2>
                        {selectedUser._collection === "employee" && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 border border-white/30 ml-1">
                            <FiShield size={12} /> Tanod
                          </span>
                        )}
                      </div>
                      <p className="text-indigo-100 text-xs font-semibold mt-1">ID: {selectedUser.id}</p>
                      {selectedUser.createdAt && (
                        <p className="text-indigo-200 text-xs font-semibold mt-0.5 inline-flex items-center gap-1">
                          <FiClock size={11} /> Registered: {formatDate(selectedUser.createdAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Status banner */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${statusChip(selectedUser.idstatus)}`}>
                  <span className="font-extrabold text-sm">
                    Status: {statusLabel(selectedUser.idstatus)}
                  </span>
                  {selectedUser.disabled && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-gray-200 text-gray-700 border border-gray-300">
                      <FiUserX size={12} /> Account Disabled
                    </span>
                  )}
                </div>

                {/* Decline reason display */}
                {selectedUser.idstatus === "declined" && selectedUser.declineMessage && (
                  <div className="p-4 rounded-xl border border-rose-200 bg-rose-50">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-rose-600 mb-1 flex items-center gap-1">
                      <FiAlertCircle size={12} /> Reason for Declining
                    </p>
                    <p className="text-sm font-semibold text-rose-800">{selectedUser.declineMessage}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <InfoRow label="Name"    value={selectedUser.complainant} icon={<FiUser  className="text-indigo-600"  size={18} />} tone="indigo"  />
                    <InfoRow label="Contact" value={selectedUser.number}      icon={<FiPhone className="text-emerald-600" size={18} />} tone="emerald" />
                    <InfoRow label="Purok"   value={selectedUser.purok ? `Purok ${selectedUser.purok}` : "—"} icon={<FiMapPin className="text-amber-600" size={18} />} tone="amber" />
                    <InfoRow label="Address" value={selectedUser.address}     icon={<FiHome  className="text-purple-600"  size={18} />} tone="purple"  />
                    <InfoRow
                      label="Registered"
                      value={formatDate(selectedUser.createdAt)}
                      icon={<FiClock className="text-indigo-400" size={18} />}
                      tone="indigo"
                    />
                    {selectedUser._collection === "employee" && (
                      <InfoRow
                        label="Position"
                        value={selectedUser.position}
                        icon={<FiShield className="text-indigo-600" size={18} />}
                        tone="indigo"
                      />
                    )}
                    {/* Shift — tanod only, disabled if declined */}
                    {selectedUser._collection === "employee" && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          {selectedUser.shift === "evening"
                            ? <FiMoon className="text-indigo-600" size={18} />
                            : <FiSun className="text-amber-600" size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">Shift</p>
                          {selectedUser.idstatus === "declined" ? (
                            <span className={`inline-flex items-center px-3 py-2 rounded-xl text-sm font-extrabold border ${shiftChip(selectedUser.shift)}`}>
                              {shiftLabel(selectedUser.shift)}
                            </span>
                          ) : (
                            <select
                              value={selectedUser.shift || "none"}
                              onChange={(e) => updateShift(selectedUser.id, e.target.value)}
                              className={`w-full px-3 py-2 rounded-xl text-sm font-extrabold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${shiftChip(selectedUser.shift)}`}
                            >
                              <option value="none">No Shift</option>
                              <option value="morning">☀️ Morning Shift</option>
                              <option value="evening">🌙 Evening Shift</option>
                            </select>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">ID Verification</p>
                    {selectedUser.idImage ? (
                      <>
                        <img
                          src={selectedUser.idImage}
                          alt="ID"
                          onClick={() => setPreviewImage(selectedUser.idImage)}
                          className="w-full max-w-sm h-auto object-cover rounded-xl shadow-lg border border-gray-200 cursor-pointer hover:opacity-90 transition"
                        />
                        <p className="text-xs text-gray-500 font-semibold">Click to preview full size.</p>
                      </>
                    ) : (
                      <div className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm text-gray-600 font-semibold">
                        No ID submitted
                      </div>
                    )}
                  </div>
                </div>

                {/* ── Action Buttons ──────────────────────────────────────── */}
                <div className="border-t pt-4 space-y-3">
                  <div className="flex gap-2">
                    <button
                      className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 transition shadow-md"
                      onClick={() => approveUser(selectedUser.id)}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-extrabold hover:bg-rose-700 transition shadow-md"
                      onClick={() => initiateDecline(selectedUser)}
                    >
                      ✕ Decline
                    </button>
                  </div>
                  <button
                    onClick={() => deleteUser(selectedUser.id)}
                    className="w-full py-3 rounded-xl bg-rose-50 text-rose-700 font-extrabold border border-rose-200 hover:bg-rose-100 transition inline-flex items-center justify-center gap-2"
                  >
                    <FiTrash2 /> Delete User
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Fullscreen image preview */}
        {previewImage && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-9999"
            onClick={() => setPreviewImage(null)}
          >
            <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl" />
            <button
              className="absolute top-6 right-6 text-white text-3xl font-bold hover:scale-110 transition-transform"
              onClick={() => setPreviewImage(null)}
            >
              ✕
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Validations;

// ── InfoRow helper ────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, tone = "indigo" }) => {
  const tones = {
    indigo:  "bg-indigo-100",
    emerald: "bg-emerald-100",
    amber:   "bg-amber-100",
    purple:  "bg-purple-100",
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${tones[tone] || tones.indigo}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate" title={value || ""}>{value || "—"}</p>
      </div>
    </div>
  );
};