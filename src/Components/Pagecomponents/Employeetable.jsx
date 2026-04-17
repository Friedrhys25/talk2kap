import React, { useEffect, useMemo, useState } from "react";
import barangayLogo from "../../assets/sanroquelogo.png";

import {
  FiUser,
  FiStar,
  FiMessageCircle,
  FiXCircle,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiEye,
  FiEyeOff,
  FiChevronLeft,
  FiChevronRight,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";
import {
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { firestore as db } from "../../firebaseConfig";

const emptyForm = {
  firstName: "",
  lastName: "",
  middleInitial: "",
  suffix: "",
  position: "BARANGAY UTILITY",
  email: "",
  password: "",
  number: "",
  purok: "",
  address: "",
};

const API_URL = "https://talk2kap-backend.onrender.com";
const PAGE_SIZE = 10;

const capitalize = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const positionOptions = [
  "All Positions",
  "BARANGAY UTILITY",
  "DAY CARE SERVICES",
  "VAWC",
  "BNS",
  "BHW",
  "CHIEF BANTAY BAYAN",
  "BANTAY BAYAN",
  "BANTAY BAYAN/UTILITY",
  "BANTAY BAYAN/DRIVER",
  "LUPON TAGAPAMAYAPA",
];

// ── Success Toast ─────────────────────────────────────────────────────────────
function SuccessToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 right-6 z-9999 animate-[slideInRight_0.4s_ease-out]">
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(60px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div className="flex items-center gap-3 bg-white border border-emerald-200 rounded-2xl shadow-2xl px-5 py-4 min-w-[280px] max-w-sm">
        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <FiCheckCircle size={20} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-extrabold text-gray-900">Success!</p>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">{message}</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
          <FiXCircle size={18} />
        </button>
      </div>
    </div>
  );
}

// ── Confirm Add Modal ─────────────────────────────────────────────────────────
function ConfirmAddModal({ form, onConfirm, onCancel, loading }) {
  const fullName = [form.firstName, form.middleInitial?.trim() ? `${form.middleInitial.trim().replace(/\.?$/, "")}.` : "", form.lastName, form.suffix]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-60 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative border border-white/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent */}
        <div className="h-1.5 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600" />

        <div className="p-7">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <FiAlertCircle size={20} className="text-indigo-600" />
            </div>
            <h2 className="text-lg font-extrabold text-gray-900">
              Confirm Employee Creation
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-semibold mb-5 pl-[52px]">
            Please review the details before confirming.
          </p>

          {/* Details card */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100 mb-6">
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">
                Full Name
              </p>
              <p className="text-sm font-extrabold text-gray-900">{fullName || "—"}</p>
            </div>

            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">
                Position
              </p>
              <p className="text-sm font-extrabold text-gray-900">{form.position}</p>
            </div>

            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">
                Login Email
              </p>
              <p className="text-sm font-extrabold text-gray-900">{form.email || "—"}</p>
            </div>

            {form.number && (
              <div className="px-5 py-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">
                  Phone Number
                </p>
                <p className="text-sm font-extrabold text-gray-900">{form.number}</p>
              </div>
            )}

            {form.purok && (
              <div className="px-5 py-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">
                  Purok
                </p>
                <p className="text-sm font-extrabold text-gray-900">{form.purok}</p>
              </div>
            )}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-extrabold text-sm hover:bg-slate-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-extrabold text-sm hover:from-indigo-700 hover:to-purple-700 transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <FiCheckCircle size={15} /> Confirm &amp; Create
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
const Pagination = ({ currentPage, totalPages, onPageChange, totalItems, pageSize }) => {
  if (totalPages <= 1) return null;

  const from = (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pages = [];
  const delta = 1;
  const left = currentPage - delta;
  const right = currentPage + delta;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= left && i <= right)) pages.push(i);
    else if (i === left - 1 || i === right + 1) pages.push("...");
  }

  const dedupedPages = pages.filter(
    (p, idx) => !(p === "..." && pages[idx - 1] === "...")
  );

  const btnBase = `inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-extrabold border transition`;
  const activeBtn = "bg-indigo-600 text-white border-indigo-600 shadow";
  const inactiveBtn = "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";
  const disabledBtn = "bg-white text-gray-300 border-gray-100 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 bg-white">
      <p className="text-xs font-semibold text-gray-500">
        Showing <span className="font-extrabold text-gray-700">{from}–{to}</span> of{" "}
        <span className="font-extrabold text-gray-700">{totalItems}</span> employees
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

// ── Main Component ────────────────────────────────────────────────────────────
export default function EmployeeTable() {
  const [employees, setEmployees] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({});
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [creating, setCreating] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("All Positions");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filter, positionFilter]);

  // ── Fetch employees ───────────────────────────────────────────────────────
  useEffect(() => {
    const empCol = collection(db, "employee");
    const empQuery = query(empCol, where("isEmployee", "==", true), where("idstatus", "==", "verified"));
    const unsubscribe = onSnapshot(empQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => {
        const ln = (a.lastName || "").localeCompare(b.lastName || "");
        if (ln !== 0) return ln;
        return (a.firstName || "").localeCompare(b.firstName || "");
      });
      setEmployees(list);
    });
    return () => unsubscribe();
  }, []);

  // ── Fetch feedback ────────────────────────────────────────────────────────
  useEffect(() => {
    const employeeRef = collection(db, "employee");
    const innerUnsubs = [];

    const unsubEmployees = onSnapshot(employeeRef, (employeeSnapshot) => {
      const map = {};
      employeeSnapshot.forEach((empDoc) => {
        const empId = empDoc.id;
        const deploymentHistoryRef = collection(db, "employee", empId, "deploymentHistory");
        const unsubHistory = onSnapshot(deploymentHistoryRef, (historySnap) => {
          const empFeedbacks = [];
          historySnap.forEach((histDoc) => {
            const histData = histDoc.data();
            if (histData.tanodRating || histData.tanodComment) {
              empFeedbacks.push({
                id: histDoc.id,
                rating: histData.tanodRating || 0,
                complaint: histData.description || histData.message || "—",
                comment: histData.tanodComment || "",
              });
            }
          });
          map[empId] = empFeedbacks;
          setFeedbackMap({ ...map });
        });
        innerUnsubs.push(unsubHistory);
      });
    });
    innerUnsubs.push(unsubEmployees);

    return () => {
      unsubEmployees();
      innerUnsubs.forEach((u) => u());
    };
  }, []);

  useEffect(() => {
    if (!editing) setForm((prev) => ({ ...prev, email: "", password: "" }));
  }, [editing]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const employeesWithRating = useMemo(() => {
    return employees.map((e) => {
      const feedbacks = feedbackMap[e.id] || [];
      const ratings = feedbacks
        .map((f) => { const n = Number(f.rating); return !isNaN(n) && n > 0 ? n : null; })
        .filter((r) => r !== null);
      const rating =
        ratings.length > 0
          ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
          : null;
      return { ...e, rating, feedbacks };
    });
  }, [employees, feedbackMap]);

  const stats = useMemo(() => ({
    total: employeesWithRating.length,
    highRated: employeesWithRating.filter((e) => e.rating !== null && e.rating >= 4).length,
    lowRated: employeesWithRating.filter((e) => e.rating !== null && e.rating < 4).length,
    noRating: employeesWithRating.filter((e) => e.rating === null).length,
  }), [employeesWithRating]);

  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employeesWithRating.filter((e) => {
      const fullName = `${e.firstName || ""} ${e.middleInitial || ""} ${e.lastName || ""}`.toLowerCase();
      const matchesSearch = fullName.includes(term) || (e.position || "").toLowerCase().includes(term);
      const matchesFilter =
        filter === "all" ||
        (filter === "highRated" && e.rating !== null && e.rating >= 4) ||
        (filter === "lowRated" && e.rating !== null && e.rating < 4) ||
        (filter === "noRating" && e.rating === null);
      const matchesPosition = positionFilter === "All Positions" || e.position === positionFilter;
      return matchesSearch && matchesFilter && matchesPosition;
    });
  }, [employeesWithRating, searchTerm, filter, positionFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getFullName = (e) => {
    const mi = e.middleInitial?.trim() ? `${e.middleInitial.trim().replace(/\.?$/, "")}.` : "";
    return [e.firstName, mi, e.lastName, e.suffix].filter(Boolean).join(" ");
  };

  const getRatingBadge = (rating) => {
    if (rating === null || rating === undefined) return "bg-slate-100 text-slate-700 border-slate-200";
    if (rating >= 4.5) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (rating >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (rating >= 3) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  const ratingLabel = (rating) => {
    if (rating === null || rating === undefined) return "No rating";
    if (rating >= 4.5) return "Excellent";
    if (rating >= 4) return "Very Good";
    if (rating >= 3) return "Good";
    return "Needs Improvement";
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (!editing) {
      if (!form.email.trim()) errors.email = "Email is required.";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errors.email = "Invalid email format.";
      if (!form.password) errors.password = "Password is required.";
      else if (form.password.length < 6) errors.password = "Must be at least 6 characters.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    if (!validateForm()) return;
    setShowConfirm(true);
  };

  const createEmployee = async () => {
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/api/create-employee`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          firstName: capitalize(form.firstName.trim()),
          lastName: capitalize(form.lastName.trim()),
          middleInitial: form.middleInitial.trim().toUpperCase(),
          suffix: form.suffix.trim(),
          position: form.position,
          number: form.number.trim(),
          purok: form.purok,
          address: form.address.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to create employee."); return; }
      if (data.employeeId || data.uid) {
        const empId = data.employeeId || data.uid;
        await updateDoc(doc(db, "employee", empId), { idstatus: null });
      }
      const createdName = [
        capitalize(form.firstName.trim()),
        form.middleInitial?.trim() ? `${form.middleInitial.trim().toUpperCase().replace(/\.?$/, "")}.` : "",
        capitalize(form.lastName.trim()),
        form.suffix.trim(),
      ].filter(Boolean).join(" ");

      setForm(emptyForm);
      setFormErrors({});
      setShowConfirm(false);
      setShowFormModal(false);
      setSuccessMessage(`${createdName} has been successfully added as ${form.position}.`);
    } catch (err) {
      console.error("Error creating employee:", err);
      alert("Failed to connect to backend. Make sure the server is running.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (e) => {
    setEditing(e.id);
    setForm({
      firstName: e.firstName || "",
      lastName: e.lastName || "",
      middleInitial: e.middleInitial || "",
      suffix: e.suffix || "",
      position: e.position || "BARANGAY UTILITY",
      number: e.number || "",
      purok: e.purok || "",
      address: e.address || "",
      email: "",
      password: "",
    });
    setShowFormModal(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    await updateDoc(doc(db, "employee", editing), {
      position: form.position,
      number: form.number.trim(),
      purok: form.purok.trim(),
      address: form.address.trim(),
    });
    const updatedName = [
      form.firstName,
      form.middleInitial?.trim() ? `${form.middleInitial.trim().replace(/\.?$/, "")}.` : "",
      form.lastName,
      form.suffix,
    ].filter(Boolean).join(" ");
    setEditing(null);
    setForm(emptyForm);
    setShowFormModal(false);
    setSuccessMessage(`${updatedName}'s information has been successfully updated.`);
  };

  const deleteEmployee = async (id) => {
    if (!confirm("Delete this employee?")) return;
    await deleteDoc(doc(db, "employee", id));
    setSuccessMessage("Employee has been successfully deleted.");
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowPassword(false);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">

      {/* Success Toast */}
      {successMessage && (
        <SuccessToast
          message={successMessage}
          onClose={() => setSuccessMessage("")}
        />
      )}

      {/* Watermark */}
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/60 overflow-hidden">
          <div className="px-6 py-5 md:px-7 md:py-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                <FiUser size={20} />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-extrabold text-gray-900">Barangay Employees Directory</h1>
                <p className="text-sm text-gray-600 font-semibold">Manage employees and view citizen feedback ratings.</p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-[340px]">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or position..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              {/* Add Employee Button */}
              <button
                onClick={() => { setEditing(null); setForm(emptyForm); setFormErrors({}); setShowFormModal(true); }}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-extrabold hover:bg-emerald-700 transition shadow-md whitespace-nowrap text-sm"
              >
                <FiPlus size={16} /> Add Employee
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={stats.total} tone="indigo" />
          <StatCard title="High Rated (≥4⭐)" value={stats.highRated} tone="emerald" />
          <StatCard title="Needs Improvement (<4⭐)" value={stats.lowRated} tone="amber" />
          <StatCard title="No Rating" value={stats.noRating} tone="slate" />
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/60 p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="text-xs font-extrabold uppercase tracking-wider text-gray-600">Position</div>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {positionOptions.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div className="flex flex-wrap gap-2">
              <ChipButton active={filter === "all"} onClick={() => setFilter("all")} label={`All (${stats.total})`} />
              <ChipButton active={filter === "highRated"} onClick={() => setFilter("highRated")} label={`High Rated (${stats.highRated})`} />
              <ChipButton active={filter === "lowRated"} onClick={() => setFilter("lowRated")} label={`Needs Improvement (${stats.lowRated})`} />
              <ChipButton active={filter === "noRating"} onClick={() => setFilter("noRating")} label={`No Rating (${stats.noRating})`} />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  {["Name", "Position", "Rating", "Feedback", "Actions"].map((h) => (
                    <th key={h} className="px-6 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.map((e, idx) => (
                  <tr
                    key={e.id}
                    className={`border-b border-gray-100 transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/60`}
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {e.avatar ? (
                          <img src={e.avatar} alt={getFullName(e)} className="w-9 h-9 rounded-xl object-cover shrink-0 ring-2 ring-indigo-200" />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <FiUser />
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 truncate">{getFullName(e)}</p>
                          <p className="text-xs font-semibold text-gray-400 truncate">ID: {e.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-6 py-4">
                      <span className="text-sm font-extrabold text-gray-900">{e.position || "N/A"}</span>
                    </td>

                    {/* Rating */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-extrabold rounded-full border ${getRatingBadge(e.rating)}`}>
                          <FiStar className="text-yellow-500" />
                          {e.rating !== null ? `${e.rating.toFixed(1)}` : "No rating"}
                        </span>
                        {e.rating !== null && (
                          <span className="text-xs font-semibold text-gray-500">{ratingLabel(e.rating)}</span>
                        )}
                      </div>
                    </td>

                    {/* Feedback */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedEmployee(e)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-indigo-700 font-extrabold text-xs shadow-sm transition"
                      >
                        <FiMessageCircle />
                        {e.feedbacks.length} {e.feedbacks.length === 1 ? "feedback" : "feedbacks"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(e)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold text-xs transition shadow-sm"
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          onClick={() => deleteEmployee(e.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-extrabold text-xs transition shadow-sm"
                        >
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-16 text-gray-400 font-semibold">
                      <FiUser size={36} className="mx-auto mb-3 opacity-30" />
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
          />
        </div>
      </div>

      {/* =====================
          ADD / EDIT MODAL
      ===================== */}
      {showFormModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeFormModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative max-h-[92vh] overflow-y-auto border border-white/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 px-7 py-6 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  {editing ? <FiEdit2 size={18} className="text-white" /> : <FiPlus size={18} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">
                    {editing ? "Edit Employee" : "Add New Employee"}
                  </h2>
                  <p className="text-indigo-200 text-xs font-semibold">
                    {editing ? "Update editable fields below. Name is locked after creation." : "Fill in all required fields to register a new employee."}
                  </p>
                </div>
              </div>
              <button onClick={closeFormModal} className="text-white/80 hover:text-white rounded-full p-2 hover:bg-white/10 transition">
                <FiXCircle size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-7 space-y-6">

              {/* Section: Name */}
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <span className="inline-flex w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] items-center justify-center font-extrabold">1</span>
                  Personal Information
                </p>
                <div className="grid grid-cols-12 gap-3">
                  {/* First Name */}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., Maria"
                      value={form.firstName}
                      disabled={!!editing}
                      onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setFormErrors((p) => ({ ...p, firstName: undefined })); }}
                      className={`w-full border rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${editing ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : "bg-white border-gray-200"}
                        ${formErrors.firstName ? "border-red-400" : ""}`}
                    />
                    {formErrors.firstName && <p className="text-xs text-red-500 mt-1">{formErrors.firstName}</p>}
                  </div>

                  {/* Middle Initial */}
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      M.I.
                    </label>
                    <input
                      placeholder="e.g., F"
                      maxLength={2}
                      value={form.middleInitial}
                      disabled={!!editing}
                      onChange={(e) => setForm({ ...form, middleInitial: e.target.value.toUpperCase() })}
                      className={`w-full border rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center tracking-widest
                        ${editing ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : "bg-white border-gray-200"}`}
                    />
                  </div>

                  {/* Last Name */}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., Santos"
                      value={form.lastName}
                      disabled={!!editing}
                      onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setFormErrors((p) => ({ ...p, lastName: undefined })); }}
                      className={`w-full border rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${editing ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : "bg-white border-gray-200"}
                        ${formErrors.lastName ? "border-red-400" : ""}`}
                    />
                    {formErrors.lastName && <p className="text-xs text-red-500 mt-1">{formErrors.lastName}</p>}
                  </div>

                  {/* Suffix */}
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Suffix
                    </label>
                    <input
                      placeholder="Jr."
                      value={form.suffix}
                      disabled={!!editing}
                      onChange={(e) => setForm({ ...form, suffix: e.target.value })}
                      className={`w-full border rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center
                        ${editing ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : "bg-white border-gray-200"}`}
                    />
                  </div>
                </div>

                {/* Full name preview */}
                {!editing && (form.firstName || form.lastName) && (
                  <p className="mt-2 text-xs text-indigo-600 font-extrabold">
                    Preview:{" "}
                    {[
                      form.firstName,
                      form.middleInitial?.trim() ? `${form.middleInitial.trim().replace(/\.?$/, "")}.` : "",
                      form.lastName,
                      form.suffix,
                    ].filter(Boolean).join(" ") || "—"}
                  </p>
                )}

                {editing && (
                  <p className="mt-2 text-xs text-amber-600 font-semibold flex items-center gap-1">
                    ⚠️ Name fields are locked after creation.
                  </p>
                )}
              </div>

              {/* Section: Position & Contact */}
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <span className="inline-flex w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] items-center justify-center font-extrabold">2</span>
                  Position & Contact
                </p>
                <div className="grid grid-cols-12 gap-3">
                  {/* Position */}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">Position</label>
                    <select
                      value={form.position}
                      onChange={(e) => setForm({ ...form, position: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                    >
                      {positionOptions.filter((p) => p !== "All Positions").map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  {/* Phone */}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g., 09123456789"
                      value={form.number}
                      onChange={(e) => setForm({ ...form, number: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* Purok */}
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">Purok</label>
                    <select
                      value={form.purok}
                      onChange={(e) => setForm({ ...form, purok: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    >
                      <option value="">Select</option>
                      {["1", "2", "3", "4", "5", "6"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                  </div>

                  {/* Address */}
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">Address</label>
                    <input
                      placeholder="lot/block/street"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Account Credentials (Add only) */}
              {!editing && (
                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                    <span className="inline-flex w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] items-center justify-center font-extrabold">3</span>
                    Account Credentials
                  </p>
                  <div className="grid grid-cols-12 gap-3">
                    {/* Email */}
                    <div className="col-span-12 sm:col-span-6">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="new-email-field"
                        autoComplete="new-email"
                        placeholder="e.g., maria@example.com"
                        value={form.email}
                        onChange={(e) => { setForm({ ...form, email: e.target.value }); setFormErrors((p) => ({ ...p, email: undefined })); }}
                        className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${formErrors.email ? "border-red-400" : "border-gray-200"}`}
                      />
                      {formErrors.email && <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="col-span-12 sm:col-span-6">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="new-password-field"
                          autoComplete="new-password"
                          placeholder="Min. 6 characters"
                          value={form.password}
                          onChange={(e) => { setForm({ ...form, password: e.target.value }); setFormErrors((p) => ({ ...p, password: undefined })); }}
                          className={`w-full border rounded-xl px-4 py-2.5 pr-10 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${formErrors.password ? "border-red-400" : "border-gray-200"}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                        </button>
                      </div>
                      {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                {editing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-indigo-700 transition shadow-md text-sm"
                    >
                      <FiEdit2 size={15} /> Save Changes
                    </button>
                    <button
                      onClick={closeFormModal}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-extrabold hover:bg-slate-200 transition text-sm"
                    >
                      <FiXCircle size={15} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleAddClick}
                      disabled={creating}
                      className={`flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold transition shadow-md text-sm ${
                        creating ? "bg-gray-400 text-white cursor-not-allowed" : "bg-emerald-600 text-white hover:bg-emerald-700"
                      }`}
                    >
                      <FiPlus size={15} /> Add Employee
                    </button>
                    <button
                      onClick={closeFormModal}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-extrabold hover:bg-slate-200 transition text-sm"
                    >
                      <FiXCircle size={15} /> Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================
          CONFIRM ADD MODAL
      ===================== */}
      {showConfirm && (
        <ConfirmAddModal
          form={form}
          loading={creating}
          onConfirm={createEmployee}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Feedback Modal */}
      {selectedEmployee && (
        <FeedbackModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
      )}
    </div>
  );
}

/* ── UI Sub-components ───────────────────────────────────────────────────── */
function StatCard({ title, value, tone = "indigo" }) {
  const tones = {
    indigo:  { ring: "ring-indigo-200",  icon: "bg-indigo-600",  glow: "bg-indigo-500/15"  },
    emerald: { ring: "ring-emerald-200", icon: "bg-emerald-600", glow: "bg-emerald-500/15" },
    amber:   { ring: "ring-amber-200",   icon: "bg-amber-600",   glow: "bg-amber-500/15"   },
    slate:   { ring: "ring-slate-200",   icon: "bg-slate-600",   glow: "bg-slate-500/15"   },
  };
  const t = tones[tone] || tones.indigo;
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-xl">
      <div className={`absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl ${t.glow}`} />
      <div className="relative p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">{title}</p>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 tracking-tight">{value}</p>
          </div>
          <div className={`rounded-xl ${t.icon} text-white p-3 shadow-lg ring-4 ${t.ring}`}>
            <FiStar />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChipButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition border ${
        active ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

/* ── Feedback Modal ──────────────────────────────────────────────────────── */
function FeedbackModal({ employee, onClose }) {
  const getRatingStars = (rating) => {
    const num = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar key={i} className={i < num ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} size={16} />
    ));
  };

  const getPerformanceBadge = (rating) => {
    const num = Number(rating) || 0;
    if (num >= 4.5) return { text: "Excellent", cls: "bg-emerald-600" };
    if (num >= 4)   return { text: "Very Good", cls: "bg-green-600" };
    if (num >= 3)   return { text: "Good", cls: "bg-amber-600" };
    if (num >= 2)   return { text: "Fair", cls: "bg-orange-600" };
    return { text: "Needs Improvement", cls: "bg-rose-600" };
  };

  const avgRating = employee.rating ?? 0;
  const badge = getPerformanceBadge(avgRating);
  const feedbacks = employee.feedbacks || [];
  const sorted = [...feedbacks].sort((a, b) => {
    const ta = a.timestamp?.seconds ?? a.timestamp ?? 0;
    const tb = b.timestamp?.seconds ?? b.timestamp ?? 0;
    return tb - ta;
  });

  const formatDate = (ts) => {
    if (!ts) return "";
    const ms = ts?.seconds ? ts.seconds * 1000 : Number(ts);
    const d = new Date(ms);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const mi = employee.middleInitial?.trim() ? `${employee.middleInitial.trim().replace(/\.?$/, "")}.` : "";
  const fullName = [employee.firstName, mi, employee.lastName].filter(Boolean).join(" ");

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] overflow-hidden border border-white/60"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 md:p-7">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <button onClick={onClose} className="absolute top-4 right-4 text-white/90 hover:text-white rounded-full p-2 hover:bg-white/10 transition">
            <FiXCircle size={26} />
          </button>
          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="relative bg-white/15 backdrop-blur-sm rounded-2xl border border-white/20 w-24 h-24 flex items-center justify-center overflow-hidden shrink-0">
                {employee.avatar ? (
                  <img src={employee.avatar} alt={fullName} className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <FiUser className="text-white" size={38} />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold text-white truncate">{fullName}</h2>
                <p className="text-indigo-100 text-sm font-semibold mt-1">{employee.position}</p>
                <div className="mt-4 inline-flex items-center gap-3 bg-white/15 border border-white/20 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-white/80 text-[11px] font-extrabold uppercase tracking-wider">Average Rating</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-white">{avgRating > 0 ? avgRating.toFixed(1) : "N/A"}</span>
                      <div className="flex gap-0.5">{getRatingStars(avgRating)}</div>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-white/25" />
                  <div>
                    <p className="text-white/80 text-[11px] font-extrabold uppercase tracking-wider">Total Reviews</p>
                    <p className="text-2xl font-extrabold text-white mt-1">{feedbacks.length}</p>
                  </div>
                </div>
                {avgRating > 0 && (
                  <div className="mt-3">
                    <span className={`${badge.cls} text-white text-xs font-extrabold px-3 py-1.5 rounded-full`}>{badge.text}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] bg-linear-to-b from-white to-slate-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <FiMessageCircle className="text-indigo-600" /> Reviews
            </h3>
            {sorted.length > 0 && <span className="text-xs font-semibold text-gray-500">Sorted: newest first</span>}
          </div>
          <div className="space-y-4">
            {sorted.length > 0 ? sorted.map((f) => (
              <div key={f.id} className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 hover:shadow-xl transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="bg-indigo-100 rounded-2xl p-3 shrink-0">
                      <FiUser className="text-indigo-600" size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-extrabold text-gray-900 text-sm truncate">{f.citizen || "Anonymous Citizen"}</p>
                      <p className="text-xs text-gray-500 font-semibold mt-1">{formatDate(f.timestamp)}</p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 px-3 py-2 rounded-2xl">
                      <div className="flex gap-0.5">{getRatingStars(f.rating)}</div>
                      <span className="text-xs font-extrabold text-gray-800">{Number(f.rating || 0).toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                  <p className="text-sm text-gray-700 leading-relaxed">{f.comment || "No comment provided."}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-14">
                <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FiMessageCircle className="text-slate-400" size={40} />
                </div>
                <p className="text-gray-600 font-extrabold">No feedback yet</p>
                <p className="text-gray-500 text-sm font-semibold mt-1">This employee hasn't received any citizen reviews.</p>
              </div>
            )}
          </div>
          {sorted.length > 0 && (
            <div className="mt-6 text-xs text-gray-500 font-semibold">Tip: Click outside the modal to close.</div>
          )}
        </div>
      </div>
    </div>
  );
}