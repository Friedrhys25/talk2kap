import React, { useEffect, useMemo, useState } from "react";
import {
  FiUser,
  FiXCircle,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiMail,
  FiPhone,
  FiImage,
} from "react-icons/fi";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { firestore as db } from "../../firebaseConfig";

const emptyForm = { name: "", position: "Kagawad", email: "", contactNumber: "", picture: "" };

export default function OfficialTable() {
  const [officials, setOfficials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All Positions");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedOfficial, setSelectedOfficial] = useState(null);

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

  // FETCH DATA
  useEffect(() => {
    const officialsRef = collection(db, "officials");
    const unsubscribe = onSnapshot(officialsRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => {
        const officialData = doc.data();
        return {
          id: doc.id,
          name: officialData.name || "",
          position: officialData.position || "N/A",
          email: officialData.email || "",
          contactNumber: officialData.contactNumber || "",
          picture: officialData.picture || "",
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

      const matchesPosition =
        positionFilter === "All Positions" || o.position === positionFilter;

      return matchesSearch && matchesPosition;
    });
  }, [officials, searchTerm, positionFilter]);

  // Remove getRatingBadge and ratingLabel since we don't need ratings anymore

  // CRUD
  const createOfficial = async () => {
    if (!form.name.trim()) return alert("Please enter a name");

    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan");
      if (existingKapitan) return alert("Only one Kapitan can be added!");
    }

    try {
      await addDoc(collection(db, "officials"), {
        name: form.name,
        position: form.position,
        email: form.email,
        contactNumber: form.contactNumber,
        picture: form.picture,
      });
      setForm(emptyForm);
    } catch (err) {
      console.error("Error creating official:", err);
      if (err.code === "permission-denied") {
        alert("You don't have permission to add officials. Please contact your administrator.");
      } else {
        alert(`Error creating official: ${err.message}`);
      }
    }
  };

  const startEdit = (o) => {
    setEditing(o.id);
    setForm({
      name: o.name,
      position: o.position,
      email: o.email,
      contactNumber: o.contactNumber,
      picture: o.picture,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.name.trim()) return alert("Please enter a name");

    // prevent multiple Kapitan
    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan" && o.id !== editing);
      if (existingKapitan) return alert("Only one Kapitan can be added!");
    }

    try {
      await updateDoc(doc(db, "officials", editing), {
        name: form.name,
        position: form.position,
        email: form.email,
        contactNumber: form.contactNumber,
        picture: form.picture,
      });

      setEditing(null);
      setForm(emptyForm);
    } catch (err) {
      console.error("Error updating official:", err);
      if (err.code === "permission-denied") {
        alert("You don't have permission to edit officials. Please contact your administrator.");
      } else {
        alert(`Error updating official: ${err.message}`);
      }
    }
  };

  const deleteOfficial = async (id) => {
    if (!confirm("Delete this official?")) return;
    try {
      await deleteDoc(doc(db, "officials", id));
    } catch (err) {
      console.error("Error deleting official:", err);
      if (err.code === "permission-denied") {
        alert("You don't have permission to delete officials. Please contact your administrator.");
      } else {
        alert(`Error deleting official: ${err.message}`);
      }
    }
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
                  Manage barangay officials and their positions.
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
                Maintain accurate information about barangay officials and their positions.
              </p>
            </div>

            {editing && (
              <span className="text-xs font-extrabold px-3 py-2 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                Editing mode
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-6">
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

            <div className="md:col-span-6">
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

            <div className="md:col-span-6">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                <FiMail size={12} /> Email
              </label>
              <input
                type="email"
                placeholder="e.g., juan@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-6">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                <FiPhone size={12} /> Contact Number
              </label>
              <input
                type="tel"
                placeholder="e.g., +63 912 345 6789"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-12">
              <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                <FiImage size={12} /> Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                      setForm({ ...form, picture: event.target?.result });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
              />
              {form.picture && (
                <div className="mt-3 rounded-xl overflow-hidden border border-gray-200 bg-slate-100 p-2">
                  <img
                    src={form.picture}
                    alt="Preview"
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-12 flex items-end gap-2">
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
                  {["Name", "Position", "Actions"].map((head) => (
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
                {filtered.map((o, idx) => (
                  <tr
                    key={o.id}
                    onClick={() => setSelectedOfficial(o)}
                    className={`border-b border-gray-100 transition-colors cursor-pointer ${
                      idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                    } hover:bg-indigo-50/60`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                          {o.picture ? (
                            <img
                              src={o.picture}
                              alt={o.name}
                              className="w-9 h-9 rounded-xl object-cover"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <FiUser />
                          )}
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

                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
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
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={3} className="text-center py-12 text-gray-500 font-semibold">
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
          <OfficialDetailModal official={selectedOfficial} onClose={() => setSelectedOfficial(null)} />
        )}
      </div>
    </div>
  );
}

/* =======================
   OFFICIAL DETAIL MODAL
======================= */
function OfficialDetailModal({ official, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-auto border border-white/60"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Picture */}
        <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 md:p-8">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white rounded-full p-2 hover:bg-white/10 transition"
            title="Close"
          >
            <FiXCircle size={26} />
          </button>

          <div className="relative flex flex-col items-center gap-6">
            {/* Picture */}
            <div className="w-32 h-32 rounded-2xl bg-white/15 border-4 border-white/30 overflow-hidden flex items-center justify-center shadow-xl">
              {official.picture ? (
                <img
                  src={official.picture}
                  alt={official.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <FiUser className="text-white" size={64} />
              )}
            </div>

            {/* Name and Position */}
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">{official.name}</h2>
              <p className="text-indigo-100 text-lg font-semibold mt-2">{official.position}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Email */}
          {official.email && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
                  <FiMail className="text-indigo-600" size={20} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">Email</p>
                <a
                  href={`mailto:${official.email}`}
                  className="mt-1 text-lg font-extrabold text-gray-900 hover:text-indigo-600 transition break-all"
                >
                  {official.email}
                </a>
              </div>
            </div>
          )}

          {/* Contact Number */}
          {official.contactNumber && (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-100">
                  <FiPhone className="text-green-600" size={20} />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">Contact Number</p>
                <a
                  href={`tel:${official.contactNumber}`}
                  className="mt-1 text-lg font-extrabold text-gray-900 hover:text-green-600 transition"
                >
                  {official.contactNumber}
                </a>
              </div>
            </div>
          )}

          {/* Position */}
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100">
                <FiUser className="text-purple-600" size={20} />
              </div>
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">Position</p>
              <p className="mt-1 text-lg font-extrabold text-gray-900">{official.position}</p>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="w-full bg-indigo-600 text-white py-3 rounded-2xl font-extrabold hover:bg-indigo-700 transition shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
