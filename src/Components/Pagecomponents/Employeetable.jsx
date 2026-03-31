import React, { useEffect, useMemo, useState } from "react";
import {
  FiUser,
  FiStar,
  FiMessageCircle,
  FiXCircle,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
} from "react-icons/fi";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { firestore as db } from "../../firebaseConfig";

const emptyForm = { firstName: "", lastName: "", middleName: "", position: "BARANGAY UTILITY" };

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

export default function EmployeeTable() {
  const [employees, setEmployees] = useState([]);
  const [feedbackMap, setFeedbackMap] = useState({}); // { employeeId: [feedback, ...] }
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null); // doc id being edited

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("All Positions");

  // ─── Fetch employees from Firestore (isEmployee === true) ───────────────────
  useEffect(() => {
    const empCol = collection(db, "employee");
    const empQuery = query(empCol, where("isEmployee", "==", true));

    const unsubscribe = onSnapshot(empQuery, (snapshot) => {
      const list = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      // Sort by lastName then firstName
      list.sort((a, b) => {
        const ln = (a.lastName || "").localeCompare(b.lastName || "");
        if (ln !== 0) return ln;
        return (a.firstName || "").localeCompare(b.firstName || "");
      });

      setEmployees(list);
    });

    return () => unsubscribe();
  }, []);

  // ─── Fetch complaintFeedback collection ─────────────────────────────────────
  // Assumes each feedback doc has: employeeId (matches employee doc id),
  // rating (number), comment (string), citizen (string), timestamp
  useEffect(() => {
    const fbCol = collection(db, "complaintFeedback");

    const unsubscribe = onSnapshot(fbCol, (snapshot) => {
      const map = {};
      snapshot.docs.forEach((d) => {
        const data = { id: d.id, ...d.data() };
        const empId = data.employeeId;
        if (!empId) return;
        if (!map[empId]) map[empId] = [];
        map[empId].push(data);
      });
      setFeedbackMap(map);
    });

    return () => unsubscribe();
  }, []);

  // ─── Compute rating per employee ────────────────────────────────────────────
  const employeesWithRating = useMemo(() => {
    return employees.map((e) => {
      const feedbacks = feedbackMap[e.id] || [];
      const ratings = feedbacks
        .map((f) => {
          const n = Number(f.rating);
          return !isNaN(n) && n > 0 ? n : null;
        })
        .filter((r) => r !== null);

      const rating =
        ratings.length > 0
          ? Number((ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1))
          : null;

      return { ...e, rating, feedbacks };
    });
  }, [employees, feedbackMap]);

  // ─── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total: employeesWithRating.length,
    highRated: employeesWithRating.filter((e) => e.rating !== null && e.rating >= 4).length,
    lowRated: employeesWithRating.filter((e) => e.rating !== null && e.rating < 4).length,
    noRating: employeesWithRating.filter((e) => e.rating === null).length,
  }), [employeesWithRating]);

  // ─── Filtering ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return employeesWithRating.filter((e) => {
      const fullName = `${e.firstName || ""} ${e.middleName || ""} ${e.lastName || ""}`.toLowerCase();
      const matchesSearch =
        fullName.includes(term) || (e.position || "").toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" ||
        (filter === "highRated" && e.rating !== null && e.rating >= 4) ||
        (filter === "lowRated" && e.rating !== null && e.rating < 4) ||
        (filter === "noRating" && e.rating === null);

      const matchesPosition =
        positionFilter === "All Positions" || e.position === positionFilter;

      return matchesSearch && matchesFilter && matchesPosition;
    });
  }, [employeesWithRating, searchTerm, filter, positionFilter]);

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const getFullName = (e) =>
    [e.firstName, e.middleName ? e.middleName + "." : "", e.lastName]
      .filter(Boolean)
      .join(" ");

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

  // ─── CRUD ───────────────────────────────────────────────────────────────────
  const createEmployee = async () => {
    if (!form.firstName.trim() || !form.lastName.trim())
      return alert("Please enter at least first and last name.");

    await addDoc(collection(db, "employee"), {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim(),
      position: form.position,
      isEmployee: true,
      createdAt: serverTimestamp(),
    });

    setForm(emptyForm);
  };

  const startEdit = (e) => {
    setEditing(e.id);
    setForm({
      firstName: e.firstName || "",
      lastName: e.lastName || "",
      middleName: e.middleName || "",
      position: e.position || "BARANGAY UTILITY",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.firstName.trim() || !form.lastName.trim())
      return alert("Please enter at least first and last name.");

    await updateDoc(doc(db, "employee", editing), {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      middleName: form.middleName.trim(),
      position: form.position,
    });

    setEditing(null);
    setForm(emptyForm);
  };

  const deleteEmployee = async (id) => {
    if (!confirm("Delete this employee?")) return;
    await deleteDoc(doc(db, "employee", id));
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      {/* Watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
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
                <h1 className="text-lg md:text-xl font-extrabold text-gray-900">
                  Barangay Employees Directory
                </h1>
                <p className="text-sm text-gray-600 font-semibold">
                  Manage employees and view citizen feedback ratings.
                </p>
              </div>
            </div>

            <div className="relative w-full md:w-[420px]">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
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
              <div className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Position
              </div>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-semibold bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {positionOptions.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
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

        {/* Add / Edit Form */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/60 p-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h3 className="text-base md:text-lg font-extrabold text-gray-900">
                {editing ? "Edit Employee" : "Add Employee"}
              </h3>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Keep names and positions consistent for clean reports.
              </p>
            </div>
            {editing && (
              <span className="text-xs font-extrabold px-3 py-2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Editing mode
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* First Name */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                First Name
              </label>
              <input
                placeholder="e.g., Maria"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Middle Name */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                Middle Name
              </label>
              <input
                placeholder="e.g., F"
                value={form.middleName}
                onChange={(e) => setForm({ ...form, middleName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Last Name */}
            <div className="md:col-span-3">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                Last Name
              </label>
              <input
                placeholder="e.g., Santos"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Position */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                Position
              </label>
              <select
                value={form.position}
                onChange={(e) => setForm({ ...form, position: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {positionOptions
                  .filter((p) => p !== "All Positions")
                  .map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
              </select>
            </div>

            {/* Actions */}
            <div className="md:col-span-2 flex items-end gap-2">
              {editing ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-extrabold hover:bg-indigo-700 transition shadow-md text-sm"
                  >
                    <FiEdit2 /> Save
                  </button>
                  <button
                    onClick={() => { setEditing(null); setForm(emptyForm); }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-800 px-4 py-2.5 rounded-xl font-extrabold hover:bg-slate-300 transition text-sm"
                  >
                    <FiXCircle />
                  </button>
                </>
              ) : (
                <button
                  onClick={createEmployee}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-extrabold hover:bg-emerald-700 transition shadow-md text-sm"
                >
                  <FiPlus /> Add
                </button>
              )}
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
                    <th
                      key={h}
                      className="px-6 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-600"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((e, idx) => (
                  <tr
                    key={e.id}
                    className={`border-b border-gray-100 transition-colors ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } hover:bg-indigo-50/60`}
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <FiUser />
                        </div>
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
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-extrabold rounded-full border ${getRatingBadge(e.rating)}`}
                        >
                          <FiStar className="text-yellow-500" />
                          {e.rating !== null ? `${e.rating.toFixed(1)}` : "No rating"}
                        </span>
                        {e.rating !== null && (
                          <span className="text-xs font-semibold text-gray-500">
                            {ratingLabel(e.rating)}
                          </span>
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
                    <td colSpan={5} className="text-center py-12 text-gray-500 font-semibold">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 text-xs text-gray-500 font-semibold bg-white">
            Showing <span className="text-gray-800 font-extrabold">{filtered.length}</span> of{" "}
            <span className="text-gray-800 font-extrabold">{employeesWithRating.length}</span> employees
          </div>
        </div>

        {selectedEmployee && (
          <FeedbackModal employee={selectedEmployee} onClose={() => setSelectedEmployee(null)} />
        )}
      </div>
    </div>
  );
}

/* =======================
   UI Sub-components
======================= */
function StatCard({ title, value, tone = "indigo" }) {
  const tones = {
    indigo: { ring: "ring-indigo-200", icon: "bg-indigo-600", glow: "bg-indigo-500/15" },
    emerald: { ring: "ring-emerald-200", icon: "bg-emerald-600", glow: "bg-emerald-500/15" },
    amber: { ring: "ring-amber-200", icon: "bg-amber-600", glow: "bg-amber-500/15" },
    slate: { ring: "ring-slate-200", icon: "bg-slate-600", glow: "bg-slate-500/15" },
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
        active
          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
      }`}
    >
      {label}
    </button>
  );
}

/* =======================
   Feedback Modal
======================= */
function FeedbackModal({ employee, onClose }) {
  const getRatingStars = (rating) => {
    const num = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={i < num ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        size={16}
      />
    ));
  };

  const getPerformanceBadge = (rating) => {
    const num = Number(rating) || 0;
    if (num >= 4.5) return { text: "Excellent", cls: "bg-emerald-600" };
    if (num >= 4) return { text: "Very Good", cls: "bg-green-600" };
    if (num >= 3) return { text: "Good", cls: "bg-amber-600" };
    if (num >= 2) return { text: "Fair", cls: "bg-orange-600" };
    return { text: "Needs Improvement", cls: "bg-rose-600" };
  };

  const avgRating = employee.rating ?? 0;
  const badge = getPerformanceBadge(avgRating);
  const feedbacks = employee.feedbacks || [];

  // Sort newest first
  const sorted = [...feedbacks].sort((a, b) => {
    const ta = a.timestamp?.seconds ?? a.timestamp ?? 0;
    const tb = b.timestamp?.seconds ?? b.timestamp ?? 0;
    return tb - ta;
  });

  const formatDate = (ts) => {
    if (!ts) return "No date";
    // Firestore Timestamp object
    const ms = ts?.seconds ? ts.seconds * 1000 : Number(ts);
    const d = new Date(ms);
    if (isNaN(d.getTime())) return "No date";
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  const fullName = [employee.firstName, employee.middleName, employee.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] overflow-hidden border border-white/60"
        onClick={(ev) => ev.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 md:p-7">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white rounded-full p-2 hover:bg-white/10 transition"
          >
            <FiXCircle size={26} />
          </button>

          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <FiUser className="text-white" size={38} />
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold text-white truncate">{fullName}</h2>
                <p className="text-indigo-100 text-sm font-semibold mt-1">{employee.position}</p>

                <div className="mt-4 inline-flex items-center gap-3 bg-white/15 border border-white/20 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-white/80 text-[11px] font-extrabold uppercase tracking-wider">
                      Average Rating
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-white">
                        {avgRating > 0 ? avgRating.toFixed(1) : "N/A"}
                      </span>
                      <div className="flex gap-0.5">{getRatingStars(avgRating)}</div>
                    </div>
                  </div>
                  <div className="h-10 w-px bg-white/25" />
                  <div>
                    <p className="text-white/80 text-[11px] font-extrabold uppercase tracking-wider">
                      Total Reviews
                    </p>
                    <p className="text-2xl font-extrabold text-white mt-1">{feedbacks.length}</p>
                  </div>
                </div>

                {avgRating > 0 && (
                  <div className="mt-3">
                    <span className={`${badge.cls} text-white text-xs font-extrabold px-3 py-1.5 rounded-full`}>
                      {badge.text}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/15 border border-white/20 text-white text-xs font-extrabold self-start">
              <FiMessageCircle />
              Citizen Feedback
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] bg-gradient-to-b from-white to-slate-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <FiMessageCircle className="text-indigo-600" /> Reviews
            </h3>
            {sorted.length > 0 && (
              <span className="text-xs font-semibold text-gray-500">Sorted: newest first</span>
            )}
          </div>

          <div className="space-y-4">
            {sorted.length > 0 ? (
              sorted.map((f) => (
                <div
                  key={f.id}
                  className="bg-white rounded-2xl p-5 shadow-md border border-gray-200 hover:shadow-xl transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="bg-indigo-100 rounded-2xl p-3 shrink-0">
                        <FiUser className="text-indigo-600" size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-gray-900 text-sm truncate">
                          {f.citizen || "Anonymous Citizen"}
                        </p>
                        <p className="text-xs text-gray-500 font-semibold mt-1">
                          {formatDate(f.timestamp)}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-100 px-3 py-2 rounded-2xl">
                        <div className="flex gap-0.5">{getRatingStars(f.rating)}</div>
                        <span className="text-xs font-extrabold text-gray-800">
                          {Number(f.rating || 0).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {f.comment || "No comment provided."}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-14">
                <div className="bg-slate-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <FiMessageCircle className="text-slate-400" size={40} />
                </div>
                <p className="text-gray-600 font-extrabold">No feedback yet</p>
                <p className="text-gray-500 text-sm font-semibold mt-1">
                  This employee hasn't received any citizen reviews.
                </p>
              </div>
            )}
          </div>

          {sorted.length > 0 && (
            <div className="mt-6 text-xs text-gray-500 font-semibold">
              Tip: Click outside the modal to close.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}