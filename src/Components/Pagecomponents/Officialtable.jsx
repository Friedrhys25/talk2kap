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
  FiCheckCircle,
  FiAlertCircle,
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
  suffix: "",
  position: "Kagawad",
  email: "",
  contactNumber: "",
  picture: "",
};

// Capitalize first letter only, preserve rest
const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const buildFullName = ({ firstName, middleInitial, lastName, suffix }) => {
  const mi = middleInitial?.trim() ? `${middleInitial.trim().replace(/\.?$/, "")}.` : "";
  return [firstName?.trim(), mi, lastName?.trim(), suffix?.trim()].filter(Boolean).join(" ");
};

const splitFullName = (fullName = "") => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], middleInitial: "", lastName: "", suffix: "" };
  if (parts.length === 2) return { firstName: parts[0], middleInitial: "", lastName: parts[1], suffix: "" };

  // Check if last part is a known suffix
  const knownSuffixes = ["Jr.", "Sr.", "Jr", "Sr", "II", "III", "IV", "V"];
  const lastPart = parts[parts.length - 1];
  const hasSuffix = knownSuffixes.includes(lastPart);

  if (hasSuffix && parts.length >= 3) {
    const suffix = lastPart;
    const lastName = parts[parts.length - 2];
    const middleInitial = parts.length >= 4 ? parts[parts.length - 3] : "";
    const firstName = parts.slice(0, parts.length - (middleInitial ? 3 : 2)).join(" ") || parts[0];
    return { firstName, middleInitial, lastName, suffix };
  }

  const lastName = parts[parts.length - 1];
  const middleInitial = parts[parts.length - 2];
  const firstName = parts.slice(0, parts.length - 2).join(" ");
  return { firstName, middleInitial, lastName, suffix: "" };
};

// Phone validation: must start with 09 and be exactly 11 digits
const isValidPhoneNumber = (number) => {
  return /^09\d{9}$/.test(number);
};

/* =======================
   SUCCESS TOAST
======================= */
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
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition"
        >
          <FiXCircle size={18} />
        </button>
      </div>
    </div>
  );
}

/* =======================
   CONFIRM ADD MODAL
======================= */
function ConfirmAddModal({ form, onConfirm, onCancel, loading }) {
  const fullName = buildFullName(form);
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
              Confirm Official Creation
            </h2>
          </div>
          <p className="text-sm text-gray-500 font-semibold mb-5 pl-[52px]">
            Please review the details before confirming.
          </p>

          {/* Details card */}
          <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100 mb-6">
            {/* Photo preview if available */}
            {form.picture && (
              <div className="px-5 py-4 flex items-center gap-3">
                <img
                  src={form.picture}
                  alt="Preview"
                  className="w-12 h-12 rounded-xl object-cover border border-gray-200 shadow-sm"
                />
                <span className="text-xs font-semibold text-gray-500">Profile Photo</span>
              </div>
            )}

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

            {form.email && (
              <div className="px-5 py-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">
                  Email
                </p>
                <p className="text-sm font-extrabold text-gray-900">{form.email}</p>
              </div>
            )}

            {form.contactNumber && (
              <div className="px-5 py-3.5">
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">
                  Contact Number
                </p>
                <p className="text-sm font-extrabold text-gray-900">{form.contactNumber}</p>
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

export default function OfficialTable() {
  const [officials, setOfficials] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("All Positions");
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [showFormModal, setShowFormModal] = useState(false);

  // Confirmation & success state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

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

  // ── Input handlers with constraints ──────────────────────────────────────
  const handleFirstNameChange = (e) => {
    const raw = e.target.value.slice(0, 20);
    const capitalized = capitalizeFirst(raw);
    setForm((prev) => ({ ...prev, firstName: capitalized }));
    setFormErrors((p) => ({ ...p, firstName: undefined }));
  };

  const handleLastNameChange = (e) => {
    const raw = e.target.value.slice(0, 20);
    const capitalized = capitalizeFirst(raw);
    setForm((prev) => ({ ...prev, lastName: capitalized }));
    setFormErrors((p) => ({ ...p, lastName: undefined }));
  };

  const handlePhoneChange = (e) => {
    // Only allow digits, max 11
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setForm((prev) => ({ ...prev, contactNumber: digits }));
    setFormErrors((p) => ({ ...p, contactNumber: undefined }));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value.slice(0, 50);
    setForm((prev) => ({ ...prev, email: val }));
    setFormErrors((p) => ({ ...p, email: undefined }));
  };

  const handleSuffixChange = (e) => {
    const val = e.target.value.slice(0, 5);
    setForm((prev) => ({ ...prev, suffix: val }));
  };

  // VALIDATION before showing confirm modal
  const validateForm = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (form.contactNumber && !isValidPhoneNumber(form.contactNumber)) {
      errors.contactNumber = "Phone number must start with 09 and be 11 digits.";
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      errors.email = "Invalid email format.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddClick = () => {
    if (!validateForm()) return;

    if (form.position === "Kapitan") {
      const existingKapitan = officials.find((o) => o.position === "Kapitan");
      if (existingKapitan) return alert("Only one Kapitan can be added!");
    }

    setShowConfirmModal(true);
  };

  // CONFIRMED CREATE
  const createOfficial = async () => {
    setConfirmLoading(true);
    try {
      await addDoc(collection(db, "officials"), {
        name: buildFullName(form),
        position: form.position,
        email: form.email,
        contactNumber: form.contactNumber,
        picture: form.picture,
      });
      const createdName = buildFullName(form);
      const createdPosition = form.position;
      setForm(emptyForm);
      setFormErrors({});
      setShowFormModal(false);
      setShowConfirmModal(false);
      setSuccessMessage(`${createdName} has been successfully added as ${createdPosition}.`);
    } catch (err) {
      console.error("Error creating official:", err);
      alert(
        err.code === "permission-denied"
          ? "You don't have permission to add officials."
          : `Error: ${err.message}`
      );
    } finally {
      setConfirmLoading(false);
    }
  };

  const startEdit = (o) => {
    setEditing(o.id);
    const parsed = splitFullName(o.name);
    setForm({
      ...parsed,
      position: o.position,
      email: o.email,
      contactNumber: o.contactNumber,
      picture: o.picture,
    });
    setFormErrors({});
    setShowFormModal(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (!validateForm()) return;

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
      const updatedName = buildFullName(form);
      setEditing(null);
      setForm(emptyForm);
      setFormErrors({});
      setShowFormModal(false);
      setSuccessMessage(`${updatedName}'s information has been successfully updated.`);
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
      setSuccessMessage("Official has been successfully deleted.");
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
    setFormErrors({});
  };

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
              <button
                onClick={() => { setEditing(null); setForm(emptyForm); setFormErrors({}); setShowFormModal(true); }}
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

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold ${
                        o.position === "Kapitan"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-700"
                      }`}>
                        {o.position}
                      </span>
                    </td>

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

              {/* Name Row */}
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-3">
                  Full Name
                </p>
                <div className="grid grid-cols-12 gap-3">
                  {/* First Name */}
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., Juan"
                      value={form.firstName}
                      onChange={handleFirstNameChange}
                      maxLength={20}
                      className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${formErrors.firstName ? "border-red-400" : "border-gray-200"}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {formErrors.firstName && <p className="text-xs text-red-500">{formErrors.firstName}</p>}
                      <p className="text-xs text-gray-400 ml-auto">{form.firstName.length}/20</p>
                    </div>
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
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., Dela Cruz"
                      value={form.lastName}
                      onChange={handleLastNameChange}
                      maxLength={20}
                      className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${formErrors.lastName ? "border-red-400" : "border-gray-200"}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {formErrors.lastName && <p className="text-xs text-red-500">{formErrors.lastName}</p>}
                      <p className="text-xs text-gray-400 ml-auto">{form.lastName.length}/20</p>
                    </div>
                  </div>

                  {/* Suffix */}
                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Suffix
                    </label>
                    <input
                      placeholder="Jr."
                      value={form.suffix}
                      onChange={handleSuffixChange}
                      maxLength={5}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center"
                    />
                  </div>
                </div>

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
                    onChange={handleEmailChange}
                    maxLength={50}
                    className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                      ${formErrors.email ? "border-red-400" : "border-gray-200"}`}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                    <p className="text-xs text-gray-400 ml-auto">{form.email.length}/50</p>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1 flex items-center gap-1">
                    <FiPhone size={11} /> Contact Number
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g., 09123456789"
                    value={form.contactNumber}
                    onChange={handlePhoneChange}
                    maxLength={11}
                    className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                      ${formErrors.contactNumber ? "border-red-400" : "border-gray-200"}`}
                  />
                  {formErrors.contactNumber ? (
                    <p className="text-xs text-red-500 mt-1">{formErrors.contactNumber}</p>
                  ) : (
                    <p className="text-xs text-gray-400 mt-1">{form.contactNumber.length}/11 — must start with 09</p>
                  )}
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
                      onClick={handleAddClick}
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

      {/* CONFIRMATION MODAL (Add only) */}
      {showConfirmModal && (
        <ConfirmAddModal
          form={form}
          loading={confirmLoading}
          onConfirm={createOfficial}
          onCancel={() => setShowConfirmModal(false)}
        />
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