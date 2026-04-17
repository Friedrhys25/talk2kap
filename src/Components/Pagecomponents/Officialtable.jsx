import React, { useEffect, useMemo, useState } from "react";
import barangayLogo from "../../assets/sanroquelogo.png";

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

const emptyForm = {
  firstName: "",
  middleInitial: "",
  lastName: "",
  position: "Kagawad",
  email: "",
  contactNumber: "",
  picture: "",
};

const buildFullName = ({ firstName, middleInitial, lastName }) => {
  const mi = middleInitial?.trim() ? `${middleInitial.trim().replace(/\.?$/, "")}.` : "";
  return [firstName?.trim(), mi, lastName?.trim()].filter(Boolean).join(" ");
};

const splitFullName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], middleInitial: "", lastName: "" };
  if (parts.length === 2) return { firstName: parts[0], middleInitial: "", lastName: parts[1] };
  const lastName = parts[parts.length - 1];
  const middleInitial = parts[parts.length - 2];
  const firstName = parts.slice(0, parts.length - 2).join(" ");
  return { firstName, middleInitial, lastName };
};

export default function OfficialTable() {
  const [officials, setOfficials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All Positions");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

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
      const list = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || "",
          position: data.position || "N/A",
          email: data.email || "",
          contactNumber: data.contactNumber || "",
          picture: data.picture || "",
        };
      });

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

  // FILTER
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

  // CRUD
  const createOfficial = async () => {
    if (!form.firstName.trim() || !form.lastName.trim())
      return alert("Please enter at least First Name and Last Name.");

    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan");
      if (existingKapitan) return alert("Only one Kapitan can be added!");
    }

    try {
      await addDoc(collection(db, "officials"), {
        name: buildFullName(form),
        position: form.position,
        email: form.email,
        contactNumber: form.contactNumber,
        picture: form.picture,
      });
      setForm(emptyForm);
      setShowFormModal(false);
    } catch (err) {
      console.error("Error creating official:", err);
      alert(
        err.code === "permission-denied"
          ? "You don't have permission to add officials."
          : `Error: ${err.message}`
      );
    }
  };

  const startEdit = (o) => {
    setEditing(o.id);
    setForm({ ...splitFullName(o.name), position: o.position, email: o.email, contactNumber: o.contactNumber, picture: o.picture });
    setShowFormModal(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!form.firstName.trim() || !form.lastName.trim())
      return alert("Please enter at least First Name and Last Name.");

    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan" && o.id !== editing);
      if (existingKapitan) return alert("Only one Kapitan can be added!");
    }

    try {
      await updateDoc(doc(db, "officials", editing), {
        name: buildFullName(form),
        position: form.position,
        email: form.email,
        contactNumber: form.contactNumber,
        picture: form.picture,
      });
      setEditing(null);
      setForm(emptyForm);
      setShowFormModal(false);
    } catch (err) {
      console.error("Error updating official:", err);
      alert(
        err.code === "permission-denied"
          ? "You don't have permission to edit officials."
          : `Error: ${err.message}`
      );
    }
  };

  const deleteOfficial = async (id) => {
    if (!confirm("Delete this official?")) return;
    try {
      await deleteDoc(doc(db, "officials", id));
    } catch (err) {
      console.error("Error deleting official:", err);
      alert(
        err.code === "permission-denied"
          ? "You don't have permission to delete officials."
          : `Error: ${err.message}`
      );
    }
  };

  const closeModal = () => {
    setShowFormModal(false);
    setEditing(null);
    setForm(emptyForm);
  };

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
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
                <h1 className="text-lg md:text-xl font-extrabold text-gray-900">
                  Barangay Officials Directory
                </h1>
                <p className="text-sm text-gray-600 font-semibold">
                  Manage barangay officials and their positions.
                </p>
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
              {/* Add Official Button */}
              <button
                onClick={() => { setEditing(null); setForm(emptyForm); setShowFormModal(true); }}
                className="inline-flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-extrabold hover:bg-emerald-700 transition shadow-md whitespace-nowrap text-sm"
              >
                <FiPlus size={16} /> Add Official
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-white/60 p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <div className="text-xs font-extrabold uppercase tracking-wider text-gray-600">
                Filter by Position
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
            <p className="text-xs text-gray-500 font-semibold">
              Showing <span className="text-gray-800 font-extrabold">{filtered.length}</span> of{" "}
              <span className="text-gray-800 font-extrabold">{officials.length}</span> officials
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/80 backdrop-blur rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  {["Official", "Position", "Contact", "Actions"].map((head) => (
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
                    {/* Official */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center overflow-hidden shrink-0">
                          {o.picture ? (
                            <img
                              src={o.picture}
                              alt={o.name}
                              className="w-10 h-10 object-cover"
                              onError={(e) => (e.target.style.display = "none")}
                            />
                          ) : (
                            <FiUser size={18} />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-gray-900 truncate">{o.name}</p>
                          <p className="text-xs font-semibold text-gray-400">ID: {o.id.slice(0, 8)}…</p>
                        </div>
                      </div>
                    </td>

                    {/* Position */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                        o.position === "Kapitan"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {o.position}
                      </span>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {o.email && (
                          <p className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                            <FiMail size={11} className="text-indigo-400" />
                            <span className="truncate max-w-[180px]">{o.email}</span>
                          </p>
                        )}
                        {o.contactNumber && (
                          <p className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold">
                            <FiPhone size={11} className="text-emerald-400" />
                            {o.contactNumber}
                          </p>
                        )}
                        {!o.email && !o.contactNumber && (
                          <span className="text-xs text-gray-400 font-semibold italic">No contact info</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(o)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold text-xs transition shadow-sm"
                        >
                          <FiEdit2 size={12} /> Edit
                        </button>
                        <button
                          onClick={() => deleteOfficial(o.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-extrabold text-xs transition shadow-sm"
                        >
                          <FiTrash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-16 text-gray-400 font-semibold">
                      <FiUser size={36} className="mx-auto mb-3 opacity-30" />
                      No officials found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =====================
          ADD / EDIT MODAL
      ===================== */}
      {showFormModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative max-h-[92vh] overflow-y-auto border border-white/60"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 px-7 py-6 rounded-t-3xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center">
                  {editing ? <FiEdit2 size={18} className="text-white" /> : <FiPlus size={18} className="text-white" />}
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white">
                    {editing ? "Edit Official" : "Add New Official"}
                  </h2>
                  <p className="text-indigo-200 text-xs font-semibold">
                    {editing ? "Update the official's information below." : "Fill in the details to register a new official."}
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-white/80 hover:text-white rounded-full p-2 hover:bg-white/10 transition"
              >
                <FiXCircle size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-7 space-y-5">

              {/* Name Row — 3 separate fields */}
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-3">
                  Full Name
                </p>
                <div className="grid grid-cols-12 gap-3">
                  {/* First Name */}
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., Juan"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  {/* Middle Initial */}
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      M.I.
                    </label>
                    <input
                      placeholder="e.g., D"
                      maxLength={2}
                      value={form.middleInitial}
                      onChange={(e) => setForm({ ...form, middleInitial: e.target.value.toUpperCase() })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center tracking-widest"
                    />
                  </div>

                  {/* Last Name */}
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., Dela Cruz"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                </div>

                {/* Live preview */}
                {(form.firstName || form.lastName) && (
                  <p className="mt-2 text-xs text-indigo-600 font-extrabold">
                    Preview: {buildFullName(form) || "—"}
                  </p>
                )}
              </div>

              {/* Position */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                  Position
                </label>
                <select
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-semibold"
                >
                  {positionOptions
                    .filter((p) => p !== "All Positions")
                    .map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                </select>
              </div>

              {/* Email & Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                    <FiMail size={11} /> Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g., juan@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                    <FiPhone size={11} /> Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., +63 912 345 6789"
                    value={form.contactNumber}
                    onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                </div>
              </div>

              {/* Picture */}
              <div>
                <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                  <FiImage size={11} /> Picture
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => setForm({ ...form, picture: event.target?.result });
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm file:mr-4 file:py-1.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
                {form.picture && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={form.picture}
                      alt="Preview"
                      className="w-16 h-16 object-cover rounded-xl border border-gray-200 shadow-sm"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                    <div>
                      <p className="text-xs font-extrabold text-gray-700">Photo preview</p>
                      <button
                        onClick={() => setForm({ ...form, picture: "" })}
                        className="text-xs text-rose-500 font-semibold hover:underline mt-0.5"
                      >
                        Remove photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                {editing ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-indigo-700 transition shadow-md text-sm"
                    >
                      <FiEdit2 size={15} /> Save Changes
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-5 py-3 rounded-xl font-extrabold hover:bg-slate-200 transition text-sm"
                    >
                      <FiXCircle size={15} /> Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={createOfficial}
                      className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-extrabold hover:bg-emerald-700 transition shadow-md text-sm"
                    >
                      <FiPlus size={15} /> Add Official
                    </button>
                    <button
                      onClick={closeModal}
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

      {/* Official Detail Modal */}
      {selectedOfficial && (
        <OfficialDetailModal
          official={selectedOfficial}
          onClose={() => setSelectedOfficial(null)}
        />
      )}
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
        {/* Header */}
        <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 md:p-8">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/90 hover:text-white rounded-full p-2 hover:bg-white/10 transition"
          >
            <FiXCircle size={26} />
          </button>

          <div className="relative flex flex-col items-center gap-5">
            <div className="w-28 h-28 rounded-2xl bg-white/15 border-4 border-white/30 overflow-hidden flex items-center justify-center shadow-xl">
              {official.picture ? (
                <img src={official.picture} alt={official.name} className="w-full h-full object-cover" />
              ) : (
                <FiUser className="text-white" size={56} />
              )}
            </div>
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">{official.name}</h2>
              <p className="text-indigo-200 text-lg font-semibold mt-1">{official.position}</p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="p-6 md:p-8 space-y-5">
          {official.email && (
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-100">
                <FiMail className="text-indigo-600" size={20} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Email</p>
                <a href={`mailto:${official.email}`} className="mt-1 text-lg font-extrabold text-gray-900 hover:text-indigo-600 transition break-all">
                  {official.email}
                </a>
              </div>
            </div>
          )}

          {official.contactNumber && (
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100">
                <FiPhone className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Contact Number</p>
                <a href={`tel:${official.contactNumber}`} className="mt-1 text-lg font-extrabold text-gray-900 hover:text-green-600 transition">
                  {official.contactNumber}
                </a>
              </div>
            </div>
          )}

          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-purple-100">
              <FiUser className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">Position</p>
              <p className="mt-1 text-lg font-extrabold text-gray-900">{official.position}</p>
            </div>
          </div>

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