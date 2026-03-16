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
import { ref, onValue, push, update, remove } from "firebase/database";
import { db } from "../../firebaseConfig";

const emptyForm = { name: "", position: "Kagawad" };

export default function OfficialTable() {
  const [officials, setOfficials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("All Positions");
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const positionOptions = useMemo(
    () => [
      "All Positions",
      "Kapitan",
      "Kagawad",
      "Secretary",
      "Treasurer",
      "Barangay Record Keeper",
      "Barangay Clerk",
    ],
    []
  );

  // FETCH DATA + calculated rating
  useEffect(() => {
    const officialsRef = ref(db, "officials");
    const unsubscribe = onValue(officialsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const list = Object.entries(data).map(([officialId, officialData]) => {
        let calculatedRating = null;

        if (officialData.feedback) {
          const feedbacks = Object.values(officialData.feedback);

          const ratings = feedbacks
            .map((feedback) => {
              const rating = feedback?.rating;
              if (rating !== null && rating !== undefined && rating !== "") {
                const num = Number(rating);
                return !isNaN(num) && num > 0 ? num : null;
              }
              return null;
            })
            .filter((r) => r !== null);

          if (ratings.length > 0) {
            const sum = ratings.reduce((acc, r) => acc + r, 0);
            calculatedRating = Number((sum / ratings.length).toFixed(1));
          }
        }

        return {
          id: officialId,
          name: officialData.name || "",
          position: officialData.position || "N/A",
          rating: calculatedRating,
          feedback: officialData.feedback || {},
        };
      });

      // Nice default ordering: Kapitan first, then others alphabetically
      const posOrder = {
        Kapitan: 0,
        Kagawad: 1,
        Secretary: 2,
        Treasurer: 3,
        "Barangay Record Keeper": 4,
        "Barangay Clerk": 5,
      };
      list.sort((a, b) => {
        const ao = posOrder[a.position] ?? 99;
        const bo = posOrder[b.position] ?? 99;
        if (ao !== bo) return ao - bo;
        return (a.name || "").localeCompare(b.name || "");
      });

      setOfficials(list);
    });
    return () => unsubscribe();
  }, []);

  // FILTER LOGIC
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return officials.filter((o) => {
      const matchesSearch =
        (o.name || "").toLowerCase().includes(term) ||
        (o.position || "").toLowerCase().includes(term);

      const matchesFilter =
        filter === "all" ||
        (filter === "highRated" && o.rating !== null && Number(o.rating) >= 4) ||
        (filter === "lowRated" && o.rating !== null && Number(o.rating) < 4) ||
        (filter === "noRating" && o.rating === null);

      const matchesPosition =
        positionFilter === "All Positions" || o.position === positionFilter;

      return matchesSearch && matchesFilter && matchesPosition;
    });
  }, [officials, searchTerm, filter, positionFilter]);

  const stats = useMemo(() => {
    return {
      total: officials.length,
      highRated: officials.filter((o) => o.rating !== null && Number(o.rating) >= 4).length,
      lowRated: officials.filter((o) => o.rating !== null && Number(o.rating) < 4).length,
      noRating: officials.filter((o) => o.rating === null).length,
    };
  }, [officials]);

  const getRatingBadge = (rating) => {
    if (rating === null || rating === undefined) return "bg-slate-100 text-slate-700 border-slate-200";
    const num = Number(rating);
    if (num >= 4.5) return "bg-emerald-100 text-emerald-800 border-emerald-200";
    if (num >= 4) return "bg-green-100 text-green-800 border-green-200";
    if (num >= 3) return "bg-amber-100 text-amber-800 border-amber-200";
    return "bg-rose-100 text-rose-800 border-rose-200";
  };

  const ratingLabel = (rating) => {
    if (rating === null || rating === undefined) return "No rating";
    const num = Number(rating);
    if (num >= 4.5) return "Excellent";
    if (num >= 4) return "Very Good";
    if (num >= 3) return "Good";
    return "Needs Improvement";
  };

  // CRUD
  const createOfficial = async () => {
    if (!form.name.trim()) return alert("Please enter a name");

    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan");
      if (existingKapitan) return alert("Only one Kapitan can be added!");
    }

    await push(ref(db, "officials"), { name: form.name, position: form.position });
    setForm(emptyForm);
  };

  const startEdit = (o) => {
    setEditing(o.id);
    setForm({ name: o.name, position: o.position });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.name.trim()) return alert("Please enter a name");

    // prevent multiple Kapitan
    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan" && o.id !== editing);
      if (existingKapitan) return alert("Only one Kapitan can be added!");
    }

    await update(ref(db, `officials/${editing}`), {
      name: form.name,
      position: form.position,
    });

    setEditing(null);
    setForm(emptyForm);
  };

  const deleteOfficial = async (id) => {
    if (!confirm("Delete this official?")) return;
    await remove(ref(db, `officials/${id}`));
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
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
                  Barangay Officials Directory
                </h1>
                <p className="text-sm text-gray-600 font-semibold">
                  Manage officials and view citizen feedback ratings.
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
          <StatCard title="Total Officials" value={stats.total} tone="indigo" />
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
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
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
                {editing ? "Edit Official" : "Add Official"}
              </h3>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Keep entries consistent for clean reporting and feedback tracking.
              </p>
            </div>

            {editing && (
              <span className="text-xs font-extrabold px-3 py-2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Editing mode
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-5">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                Name
              </label>
              <input
                placeholder="e.g., Juan Dela Cruz"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-4">
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
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
              </select>
            </div>

            <div className="md:col-span-3 flex items-end gap-2">
              {editing ? (
                <>
                  <button
                    onClick={saveEdit}
                    className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-extrabold hover:bg-indigo-700 transition shadow-md"
                  >
                    <FiEdit2 /> Save
                  </button>
                  <button
                    onClick={() => {
                      setEditing(null);
                      setForm(emptyForm);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 bg-slate-200 text-slate-800 px-5 py-2.5 rounded-xl font-extrabold hover:bg-slate-300 transition"
                  >
                    <FiXCircle /> Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={createOfficial}
                  className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-extrabold hover:bg-emerald-700 transition shadow-md"
                >
                  <FiPlus /> Add Official
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  {["Name", "Position", "Rating", "Feedback", "Actions"].map((head) => (
                    <th
                      key={head}
                      className="px-6 py-4 text-left text-[11px] font-extrabold uppercase tracking-wider text-gray-600"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filtered.map((o, idx) => {
                  const feedbackCount = o.feedback ? Object.keys(o.feedback).length : 0;

                  return (
                    <tr
                      key={o.id}
                      className={`border-b border-gray-100 transition-colors ${
                        idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                      } hover:bg-indigo-50/60`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                            <FiUser />
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-gray-900 truncate">{o.name}</p>
                            <p className="text-xs font-semibold text-gray-500">ID: {o.id}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-sm font-extrabold text-gray-900">{o.position}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-extrabold rounded-full border ${getRatingBadge(
                              o.rating
                            )}`}
                            title={ratingLabel(o.rating)}
                          >
                            <FiStar className="text-yellow-500" />
                            {o.rating !== null && o.rating !== undefined
                              ? `${Number(o.rating).toFixed(1)}`
                              : "No rating"}
                          </span>

                          {o.rating !== null && o.rating !== undefined && (
                            <span className="text-xs font-semibold text-gray-500">
                              {ratingLabel(o.rating)}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedOfficial(o)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-indigo-700 font-extrabold text-xs shadow-sm transition"
                        >
                          <FiMessageCircle />
                          {feedbackCount} {feedbackCount === 1 ? "feedback" : "feedbacks"}
                        </button>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEdit(o)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold text-xs transition shadow-sm"
                          >
                            <FiEdit2 /> Edit
                          </button>
                          <button
                            onClick={() => deleteOfficial(o.id)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-extrabold text-xs transition shadow-sm"
                          >
                            <FiTrash2 /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-500 font-semibold">
                      No officials found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 text-xs text-gray-500 font-semibold bg-white">
            Showing <span className="text-gray-800 font-extrabold">{filtered.length}</span> of{" "}
            <span className="text-gray-800 font-extrabold">{officials.length}</span> officials
          </div>
        </div>

        {selectedOfficial && (
          <FeedbackModal official={selectedOfficial} onClose={() => setSelectedOfficial(null)} />
        )}
      </div>
    </div>
  );
}

/* =======================
   UI Components
======================= */
function StatCard({ title, value, tone = "indigo" }) {
  const tones = {
    indigo: {
      ring: "ring-indigo-200",
      icon: "bg-indigo-600",
      glow: "bg-indigo-500/15",
      text: "text-indigo-700",
    },
    emerald: {
      ring: "ring-emerald-200",
      icon: "bg-emerald-600",
      glow: "bg-emerald-500/15",
      text: "text-emerald-700",
    },
    amber: {
      ring: "ring-amber-200",
      icon: "bg-amber-600",
      glow: "bg-amber-500/15",
      text: "text-amber-700",
    },
    slate: {
      ring: "ring-slate-200",
      icon: "bg-slate-600",
      glow: "bg-slate-500/15",
      text: "text-slate-700",
    },
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
   ENHANCED FEEDBACK MODAL
======================= */
function FeedbackModal({ official, onClose }) {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const feedbackRef = ref(db, `officials/${official.id}/feedback`);
    const unsubscribe = onValue(feedbackRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setFeedbacks(
          Object.entries(data)
            .map(([id, value]) => ({ id, ...value }))
            .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
        );
      } else {
        setFeedbacks([]);
      }
    });
    return () => unsubscribe();
  }, [official.id]);

  const getRatingStars = (rating) => {
    const stars = [];
    const num = Number(rating) || 0;
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FiStar
          key={i}
          className={`${i <= num ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          size={16}
        />
      );
    }
    return stars;
  };

  const getPerformanceBadge = (rating) => {
    const num = Number(rating) || 0;
    if (num >= 4.5) return { text: "Excellent", cls: "bg-emerald-600" };
    if (num >= 4) return { text: "Very Good", cls: "bg-green-600" };
    if (num >= 3) return { text: "Good", cls: "bg-amber-600" };
    if (num >= 2) return { text: "Fair", cls: "bg-orange-600" };
    return { text: "Needs Improvement", cls: "bg-rose-600" };
  };

  const avgRating =
    official.rating !== null && official.rating !== undefined ? Number(official.rating) : 0;
  const badge = getPerformanceBadge(avgRating);

  const formatFeedbackDate = (ts) => {
    if (!ts) return "No date";
    const d = new Date(ts);
    if (isNaN(d.getTime())) return "No date";
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl relative max-h-[90vh] overflow-hidden border border-white/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 md:p-7">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white rounded-full p-2 hover:bg-white/10 transition"
            title="Close"
          >
            <FiXCircle size={26} />
          </button>

          <div className="relative flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="bg-white/15 backdrop-blur-sm p-4 rounded-2xl border border-white/20">
                <FiUser className="text-white" size={38} />
              </div>

              <div className="min-w-0">
                <h2 className="text-2xl font-extrabold text-white truncate">{official.name}</h2>
                <p className="text-indigo-100 text-sm font-semibold mt-1">{official.position}</p>

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

            <div className="relative">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/15 border border-white/20 text-white text-xs font-extrabold">
                <FiMessageCircle />
                Citizen Feedback
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)] bg-linear-to-b from-white to-slate-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
              <FiMessageCircle className="text-indigo-600" />
              Reviews
            </h3>
            {feedbacks.length > 0 && (
              <span className="text-xs font-semibold text-gray-500">
                Sorted: newest first
              </span>
            )}
          </div>

          <div className="space-y-4">
            {feedbacks.length > 0 ? (
              feedbacks.map((f, index) => (
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
                          {formatFeedbackDate(f.timestamp)}
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
                  This official hasn't received any citizen reviews.
                </p>
              </div>
            )}
          </div>

          {feedbacks.length > 0 && (
            <div className="mt-6 text-xs text-gray-500 font-semibold">
              Tip: Click outside the modal to close.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
