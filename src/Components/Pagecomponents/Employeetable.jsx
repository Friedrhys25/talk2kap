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
  FiSun,
  FiMoon,
  FiLock,
  FiKey,
  FiPhone,
  FiMapPin,
  FiHome,
  FiMail,
  FiHash,
  FiBriefcase,
  FiX,
  FiUserX,
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
  shift: "none",
};

const API_URL = "https://talk2kap-backend.onrender.com";
const PAGE_SIZE = 10;

const capitalize = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

const capitalizeFirst = (str) => {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
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

const VALID_EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com",
  "proton.me", "protonmail.com", "zoho.com", "aol.com", "gmx.com",
  "mail.com", "yandex.com", "fastmail.com", "tutanota.com", "hushmail.com",
  "rediffmail.com", "lycos.com", "mail.ru", "inbox.com", "runbox.com",
];

const isValidEmail = (email) => {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return false;
  const domain = trimmed.split("@")[1];
  return VALID_EMAIL_DOMAINS.includes(domain);
};

const isValidPassword = (password) => {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[!@#$%^&*]/.test(password)) return false;
  return true;
};

const getPasswordStrength = (password) => {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[!@#$%^&*]/.test(password)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-rose-500", width: "w-1/5" };
  if (score === 3) return { label: "Fair", color: "bg-amber-500", width: "w-3/5" };
  if (score === 4) return { label: "Good", color: "bg-blue-500", width: "w-4/5" };
  return { label: "Strong", color: "bg-emerald-500", width: "w-full" };
};

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

const isValidPhoneNumber = (number) => {
  if (!/^09\d{9}$/.test(number)) return false;
  const digits = number.slice(2); // 9 digits after "09"

  // 1. All same digit: 09111111111
  if (/^(.)\1{8}$/.test(digits)) return false;

  // 2. Fully ascending sequential: 09123456789
  const isSequentialAsc = [...digits].every(
    (d, i, arr) => i === 0 || Number(d) === Number(arr[i - 1]) + 1
  );
  if (isSequentialAsc) return false;

  // 3. Fully descending sequential: 09987654321
  const isSequentialDesc = [...digits].every(
    (d, i, arr) => i === 0 || Number(d) === Number(arr[i - 1]) - 1
  );
  if (isSequentialDesc) return false;

  // 4. Any single digit appears 7+ times
  const digitCounts = {};
  for (const d of digits) digitCounts[d] = (digitCounts[d] || 0) + 1;
  if (Object.values(digitCounts).some((count) => count >= 7)) return false;

  // 5. Repeating 2-digit chunk 3+ times anywhere: 121212xxx
  if (/(.{2})\1{2}/.test(digits)) return false;

  // 6. Repeating 3-digit chunk 2+ times anywhere: catches 09123123123, 09456456456
  if (/(.{3})\1{1}/.test(digits)) return false;

  // 7. Ascending run of 5+ consecutive digits anywhere: 12345, 23456…
  for (let i = 0; i <= digits.length - 5; i++) {
    const slice = digits.slice(i, i + 5);
    const isAscSeq = [...slice].every(
      (d, j, arr) => j === 0 || Number(d) === Number(arr[j - 1]) + 1
    );
    if (isAscSeq) return false;
  }

  // 8. Descending run of 5+ consecutive digits anywhere: 98765, 87654…
  for (let i = 0; i <= digits.length - 5; i++) {
    const slice = digits.slice(i, i + 5);
    const isDescSeq = [...slice].every(
      (d, j, arr) => j === 0 || Number(d) === Number(arr[j - 1]) - 1
    );
    if (isDescSeq) return false;
  }

  return true;
};

const getPhoneError = (number) => {
  if (!number) return null;
  if (!/^09/.test(number)) return "Phone number must start with 09.";
  if (number.length < 11) return `${number.length}/11 — must start with 09`;
  if (!/^09\d{9}$/.test(number)) return "Must be exactly 11 digits starting with 09.";
  if (!isValidPhoneNumber(number)) return "Invalid number — avoid repeating or sequential digits (e.g. 09111111111, 09123456789).";
  return null;
};

// ── InfoRow helper ────────────────────────────────────────────────────────────
function InfoRow({ icon, label, value, tone = "indigo" }) {
  const tones = {
    indigo:  "bg-indigo-100",
    emerald: "bg-emerald-100",
    amber:   "bg-amber-100",
    purple:  "bg-purple-100",
    rose:    "bg-rose-100",
    teal:    "bg-teal-100",
    blue:    "bg-blue-100",
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${tones[tone] || tones.indigo} shrink-0`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate" title={value || ""}>{value || "—"}</p>
      </div>
    </div>
  );
}

// ── Employee Detail Modal ─────────────────────────────────────────────────────
function EmployeeDetailModal({ employee, onClose, onEdit, onDelete, onDisable }) {
  const [previewImage, setPreviewImage] = useState(null);

  if (!employee) return null;

  const mi = employee.middleInitial?.trim()
    ? `${employee.middleInitial.trim().replace(/\.?$/, "")}.`
    : "";
  const fullName = [employee.firstName, mi, employee.lastName, employee.suffix]
    .filter(Boolean)
    .join(" ");

  const getRatingStars = (rating) => {
    const num = Number(rating) || 0;
    return Array.from({ length: 5 }, (_, i) => (
      <FiStar
        key={i}
        className={i < num ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
        size={14}
      />
    ));
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

  const avgRating = employee.rating ?? null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-hidden border border-white/60 flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative overflow-hidden bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 p-6 shrink-0">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-white/10 blur-3xl" />

            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white rounded-full p-2 hover:bg-white/10 transition z-10"
            >
              <FiX size={22} />
            </button>

            <div className="relative flex items-start gap-5">
              {/* Avatar */}
              <div
                className="w-24 h-24 rounded-2xl bg-white/15 border-2 border-white/30 flex items-center justify-center shrink-0 shadow-lg overflow-hidden cursor-pointer"
                onClick={() => employee.avatar && setPreviewImage(employee.avatar)}
              >
                {employee.avatar ? (
                  <img
                    src={employee.avatar}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiUser className="text-white" size={38} />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-extrabold text-white truncate">{fullName || "—"}</h2>
                <p className="text-indigo-200 text-sm font-semibold mt-1">{employee.position || "—"}</p>

                {/* Shift badge */}
                <div className="mt-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-full border ${shiftChip(employee.shift)}`}>
                    {employee.shift === "morning" ? <FiSun size={11} /> : employee.shift === "evening" ? <FiMoon size={11} /> : null}
                    {shiftLabel(employee.shift)}
                  </span>
                </div>

                {/* Rating summary */}
                <div className="mt-3 inline-flex items-center gap-3 bg-white/15 border border-white/20 rounded-2xl px-4 py-2.5">
                  <div>
                    <p className="text-white/70 text-[10px] font-extrabold uppercase tracking-wider">Avg. Rating</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-extrabold text-white">
                        {avgRating !== null ? avgRating.toFixed(1) : "N/A"}
                      </span>
                      <div className="flex gap-0.5">{getRatingStars(avgRating ?? 0)}</div>
                    </div>
                  </div>
                  <div className="h-8 w-px bg-white/25" />
                  <div>
                    <p className="text-white/70 text-[10px] font-extrabold uppercase tracking-wider">Reviews</p>
                    <p className="text-2xl font-extrabold text-white mt-0.5">{employee.feedbacks?.length ?? 0}</p>
                  </div>
                </div>

                {avgRating !== null && (
                  <div className="mt-2">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold rounded-full border ${getRatingBadge(avgRating)}`}>
                      <FiStar size={11} className="text-yellow-500" />
                      {ratingLabel(avgRating)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-linear-to-b from-white to-slate-50">

            {/* Account Credentials */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <FiMail size={12} /> Account Credentials
              </p>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 overflow-hidden">
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="p-2 rounded-lg bg-indigo-100">
                    <FiMail className="text-indigo-600" size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500">Email</p>
                    <p className="text-sm font-bold text-gray-900 truncate">{employee.email || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal Information */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <FiUser size={12} /> Personal Information
              </p>
              <div className="space-y-3">
                <InfoRow
                  label="Full Name"
                  value={fullName}
                  icon={<FiUser className="text-indigo-600" size={16} />}
                  tone="indigo"
                />
                <InfoRow
                  label="Contact Number"
                  value={employee.number}
                  icon={<FiPhone className="text-emerald-600" size={16} />}
                  tone="emerald"
                />
                <InfoRow
                  label="Purok"
                  value={employee.purok ? `Purok ${employee.purok}` : "—"}
                  icon={<FiMapPin className="text-amber-600" size={16} />}
                  tone="amber"
                />
                <InfoRow
                  label="Address"
                  value={employee.address}
                  icon={<FiHome className="text-purple-600" size={16} />}
                  tone="purple"
                />
              </div>
            </div>

            {/* Work Information */}
            <div>
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
                <FiBriefcase size={12} /> Work Information
              </p>
              <div className="space-y-3">
                <InfoRow
                  label="Position"
                  value={employee.position}
                  icon={<FiBriefcase className="text-blue-600" size={16} />}
                  tone="blue"
                />
                <InfoRow
                  label="Shift"
                  value={shiftLabel(employee.shift)}
                  icon={employee.shift === "morning" ? <FiSun className="text-amber-600" size={16} /> : <FiMoon className="text-indigo-600" size={16} />}
                  tone={employee.shift === "morning" ? "amber" : "indigo"}
                />

                {/* Account Status row */}
                {employee.disabled && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 shrink-0">
                      <FiUserX className="text-gray-600" size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">Account Status</p>
                      <p className="text-sm font-bold text-gray-700">Disabled</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-4 space-y-3">
              {/* Edit — full width on top */}
              <button
                onClick={() => { onClose(); onEdit(employee); }}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 transition shadow-md inline-flex items-center justify-center gap-2 text-sm"
              >
                <FiEdit2 size={15} /> Edit Employee
              </button>

              {/* Disable Account + Delete side by side */}
              <div className="flex gap-3">
                <button
                  onClick={() => onDisable(employee.id)}
                  disabled={!!employee.disabled}
                  className={`flex-1 py-3 rounded-xl font-extrabold transition inline-flex items-center justify-center gap-2 text-sm ${
                    employee.disabled
                      ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                      : "bg-gray-800 text-white hover:bg-gray-900 shadow-md"
                  }`}
                >
                  <FiUserX size={15} />
                  {employee.disabled ? "Disabled" : "Disable Account"}
                </button>
                <button
                  onClick={() => { onDelete(employee.id); onClose(); }}
                  className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-700 font-extrabold border border-rose-200 hover:bg-rose-100 transition inline-flex items-center justify-center gap-2 text-sm"
                >
                  <FiTrash2 size={15} /> Delete
                </button>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen image preview */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-9999"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-[90%] max-h-[90%] rounded-2xl shadow-2xl"
          />
          <button
            className="absolute top-6 right-6 text-white text-3xl font-bold hover:scale-110 transition-transform"
            onClick={() => setPreviewImage(null)}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const fullName = [
    form.firstName,
    form.middleInitial?.trim() ? `${form.middleInitial.trim().replace(/\.?$/, "")}.` : "",
    form.lastName,
    form.suffix,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md relative border border-white/60 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 w-full bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-600" />

        <div className="p-7">
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

          <div className="bg-gray-50 rounded-2xl border border-gray-100 divide-y divide-gray-100 mb-6">
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">Full Name</p>
              <p className="text-sm font-extrabold text-gray-900">{fullName || "—"}</p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">Position</p>
              <p className="text-sm font-extrabold text-gray-900">{form.position}</p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">Shift</p>
              <p className="text-sm font-extrabold text-gray-900">{shiftLabel(form.shift)}</p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">Phone Number</p>
              <p className="text-sm font-extrabold text-gray-900">{form.number || "—"}</p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">Purok</p>
              <p className="text-sm font-extrabold text-gray-900">{form.purok || "—"}</p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">Address</p>
              <p className="text-sm font-extrabold text-gray-900">{form.address || "—"}</p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">Login Email</p>
              <p className="text-sm font-extrabold text-gray-900">{form.email || "—"}</p>
            </div>
            <div className="px-5 py-3.5">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 mb-0.5">Password</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-extrabold text-gray-900 tracking-widest flex-1">
                  {showConfirmPassword ? form.password : "••••••••"}
                </p>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  className="text-gray-400 hover:text-indigo-600 transition shrink-0"
                >
                  {showConfirmPassword ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
            </div>
          </div>

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
                <><FiCheckCircle size={15} /> Confirm &amp; Create</>
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
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);
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
        const lastNameA = (a.lastName || "").toLowerCase();
        const lastNameB = (b.lastName || "").toLowerCase();
        if (lastNameA !== lastNameB) return lastNameA.localeCompare(lastNameB);
        const firstNameA = (a.firstName || "").toLowerCase();
        const firstNameB = (b.firstName || "").toLowerCase();
        return firstNameA.localeCompare(firstNameB);
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
    if (!showFormModal) {
      setShowPassword(false);
      setShowEditPassword(false);
      setShowCurrentPassword(false);
      setShowChangePassword(false);
      setCurrentPassword("");
    }
  }, [showFormModal]);

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

  // ── Input handlers ────────────────────────────────────────────────────────
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
    const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
    setForm((prev) => ({ ...prev, number: digits }));
    setFormErrors((p) => ({ ...p, number: undefined }));
  };

  const handleAddressChange = (e) => {
    const val = e.target.value.slice(0, 100);
    setForm((prev) => ({ ...prev, address: val }));
    setFormErrors((p) => ({ ...p, address: undefined }));
  };

  const handleEmailChange = (e) => {
    const val = e.target.value.slice(0, 80);
    setForm((prev) => ({ ...prev, email: val }));
    setFormErrors((p) => ({ ...p, email: undefined }));
  };

  const handleSuffixChange = (e) => {
    const val = e.target.value.slice(0, 5);
    setForm((prev) => ({ ...prev, suffix: val }));
  };

  // ── CRUD ──────────────────────────────────────────────────────────────────
  const validateForm = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = "First name is required.";
    if (!form.lastName.trim()) errors.lastName = "Last name is required.";
    if (!form.shift || form.shift === "none") errors.shift = "Please select a shift.";
    if (!form.number.trim()) {
      errors.number = "Phone number is required.";
    } else {
      const phoneErr = getPhoneError(form.number);
      if (form.number.length < 11) errors.number = "Phone number must be 11 digits.";
      else if (phoneErr) errors.number = phoneErr;
    }
    if (!form.purok) errors.purok = "Purok is required.";
    if (!form.address.trim()) errors.address = "Address is required.";

    if (!editing) {
      if (!form.email.trim()) {
        errors.email = "Email is required.";
      } else if (!isValidEmail(form.email)) {
        errors.email = "Invalid email. Use a valid provider (e.g. gmail.com, yahoo.com).";
      }
      if (!form.password) {
        errors.password = "Password is required.";
      } else if (!isValidPassword(form.password)) {
        errors.password = "Must be 8+ chars with uppercase, lowercase, number & special char (!@#$%^&*).";
      }
    } else {
      if (form.password && !isValidPassword(form.password)) {
        errors.password = "Must be 8+ chars with uppercase, lowercase, number & special char (!@#$%^&*).";
      }
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
          shift: form.shift,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to create employee."); return; }
      if (data.employeeId || data.uid) {
        const empId = data.employeeId || data.uid;
        await updateDoc(doc(db, "employee", empId), {
          idstatus: null,
          shift: form.shift,
          password: form.password,
        });
      }
      const createdName = [
        capitalize(form.firstName.trim()),
        form.middleInitial?.trim() ? `${form.middleInitial.trim().toUpperCase().replace(/\.?$/, "")}.` : "",
        capitalize(form.lastName.trim()),
        form.suffix.trim(),
      ].filter(Boolean).join(" ");

      const positionSaved = form.position;
      setForm(emptyForm);
      setFormErrors({});
      setShowConfirm(false);
      setShowFormModal(false);
      setSuccessMessage(`${createdName} has been successfully added as ${positionSaved}.`);
    } catch (err) {
      console.error("Error creating employee:", err);
      alert("Failed to connect to backend. Make sure the server is running.");
    } finally {
      setCreating(false);
    }
  };

  const startEdit = (e) => {
    setEditing(e.id);
    setShowChangePassword(false);
    setShowCurrentPassword(false);
    setCurrentPassword(e.password || "");
    setForm({
      firstName: e.firstName || "",
      lastName: e.lastName || "",
      middleInitial: e.middleInitial || "",
      suffix: e.suffix || "",
      position: e.position || "BARANGAY UTILITY",
      number: e.number || "",
      purok: e.purok || "",
      address: e.address || "",
      email: e.email || "",
      password: "",
      shift: e.shift || "none",
    });
    setShowFormModal(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    const errors = {};
    if (!form.shift || form.shift === "none") errors.shift = "Please select a shift.";
    if (!form.number.trim()) {
      errors.number = "Phone number is required.";
    } else {
      const phoneErr = getPhoneError(form.number);
      if (form.number.length < 11) errors.number = "Phone number must be 11 digits.";
      else if (phoneErr) errors.number = phoneErr;
    }
    if (!form.purok) errors.purok = "Purok is required.";
    if (!form.address.trim()) errors.address = "Address is required.";
    if (form.email && !isValidEmail(form.email)) {
      errors.email = "Invalid email. Use a valid provider (e.g. gmail.com, yahoo.com).";
    }
    if (form.password && !isValidPassword(form.password)) {
      errors.password = "Must be 8+ chars with uppercase, lowercase, number & special char (!@#$%^&*).";
    }
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const updatePayload = {
      position: form.position,
      number: form.number.trim(),
      purok: form.purok.trim(),
      address: form.address.trim(),
      shift: form.shift,
      email: form.email.trim(),
    };

    await updateDoc(doc(db, "employee", editing), updatePayload);

    if (form.password) {
      try {
        await fetch(`${API_URL}/api/update-employee-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ uid: editing, password: form.password }),
        });
        await updateDoc(doc(db, "employee", editing), { password: form.password });
      } catch (err) {
        console.error("Error updating password:", err);
      }
    }

    const updatedName = [
      form.firstName,
      form.middleInitial?.trim() ? `${form.middleInitial.trim().replace(/\.?$/, "")}.` : "",
      form.lastName,
      form.suffix,
    ].filter(Boolean).join(" ");
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowFormModal(false);
    setSuccessMessage(`${updatedName}'s information has been successfully updated.`);
  };

  const deleteEmployee = async (id) => {
    if (!confirm("Delete this employee?")) return;
    await deleteDoc(doc(db, "employee", id));
    setSuccessMessage("Employee has been successfully deleted.");
  };

  // ── Disable employee ──────────────────────────────────────────────────────
  const disableEmployee = async (id) => {
    if (!confirm("Disable this employee's account? They will no longer be able to log in.")) return;
    try {
      await updateDoc(doc(db, "employee", id), { disabled: true });
      setEmployees((prev) =>
        prev.map((e) => (e.id === id ? { ...e, disabled: true } : e))
      );
      setSelectedEmployeeDetail((prev) =>
        prev?.id === id ? { ...prev, disabled: true } : prev
      );
      setSuccessMessage("Employee account has been disabled.");
    } catch (err) {
      console.error("Error disabling employee:", err);
      alert("Failed to disable employee account.");
    }
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setEditing(null);
    setForm(emptyForm);
    setFormErrors({});
    setShowPassword(false);
    setShowEditPassword(false);
    setShowCurrentPassword(false);
    setShowChangePassword(false);
    setCurrentPassword("");
  };

  const passwordStrength = getPasswordStrength(form.password);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">

      {successMessage && (
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage("")} />
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
            <table className="w-full min-w-[1060px]">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  {["Name", "Position", "Shift", "Rating", "Feedback", "Actions"].map((h) => (
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
                    className={`border-b border-gray-100 transition-colors cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/60`}
                    onClick={() => setSelectedEmployeeDetail(e)}
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

                    {/* Shift */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold rounded-full border ${shiftChip(e.shift)}`}>
                        {e.shift === "morning" ? <FiSun size={12} /> : e.shift === "evening" ? <FiMoon size={12} /> : null}
                        {shiftLabel(e.shift)}
                      </span>
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
                        onClick={(ev) => { ev.stopPropagation(); setSelectedEmployee(e); }}
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
                          onClick={(ev) => { ev.stopPropagation(); startEdit(e); }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 font-extrabold text-xs transition shadow-sm"
                        >
                          <FiEdit2 /> Edit
                        </button>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); deleteEmployee(e.id); }}
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
                    <td colSpan={6} className="text-center py-16 text-gray-400 font-semibold">
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

              {/* Section 1: Personal Information */}
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <span className="inline-flex w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] items-center justify-center font-extrabold">1</span>
                  Personal Information
                </p>
                <div className="grid grid-cols-12 gap-3">
                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., Maria"
                      value={form.firstName}
                      disabled={!!editing}
                      onChange={handleFirstNameChange}
                      maxLength={20}
                      className={`w-full border rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${editing ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : "bg-white border-gray-200"}
                        ${formErrors.firstName ? "border-red-400" : ""}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {formErrors.firstName && <p className="text-xs text-red-500">{formErrors.firstName}</p>}
                      {!editing && <p className="text-xs text-gray-400 ml-auto">{form.firstName.length}/20</p>}
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">M.I.</label>
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

                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., Santos"
                      value={form.lastName}
                      disabled={!!editing}
                      onChange={handleLastNameChange}
                      maxLength={20}
                      className={`w-full border rounded-xl px-4 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${editing ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : "bg-white border-gray-200"}
                        ${formErrors.lastName ? "border-red-400" : ""}`}
                    />
                    <div className="flex items-center justify-between mt-1">
                      {formErrors.lastName && <p className="text-xs text-red-500">{formErrors.lastName}</p>}
                      {!editing && <p className="text-xs text-gray-400 ml-auto">{form.lastName.length}/20</p>}
                    </div>
                  </div>

                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">Suffix</label>
                    <input
                      placeholder="Jr."
                      value={form.suffix}
                      disabled={!!editing}
                      onChange={handleSuffixChange}
                      maxLength={5}
                      className={`w-full border rounded-xl px-3 py-2.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-center
                        ${editing ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : "bg-white border-gray-200"}`}
                    />
                  </div>
                </div>

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

              {/* Section 2: Position, Shift & Contact */}
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <span className="inline-flex w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] items-center justify-center font-extrabold">2</span>
                  Position, Shift &amp; Contact
                </p>
                <div className="grid grid-cols-12 gap-3">
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

                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Shift <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {[
                        { value: "morning", label: "Morning", icon: <FiSun size={14} className="text-amber-500" /> },
                        { value: "evening", label: "Evening", icon: <FiMoon size={14} className="text-indigo-500" /> },
                      ].map((s) => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => {
                            setForm({ ...form, shift: s.value });
                            setFormErrors((p) => ({ ...p, shift: undefined }));
                          }}
                          className={`flex-1 flex flex-col items-center justify-center gap-1 py-2.5 px-2 rounded-xl border text-xs font-extrabold transition
                            ${form.shift === s.value
                              ? s.value === "morning"
                                ? "bg-amber-100 border-amber-400 text-amber-800 shadow-sm"
                                : "bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm"
                              : formErrors.shift
                              ? "bg-white border-red-400 text-gray-500 hover:bg-gray-50"
                              : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                            }`}
                        >
                          {s.icon}
                          {s.label}
                        </button>
                      ))}
                    </div>
                    {formErrors.shift && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.shift}</p>
                    )}
                  </div>

                  <div className="col-span-12 sm:col-span-4">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g., 09123456789"
                      value={form.number}
                      onChange={handlePhoneChange}
                      maxLength={11}
                      className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${formErrors.number ? "border-red-400" : "border-gray-200"}`}
                    />
                    {formErrors.number ? (
                      <p className="text-xs text-red-500 mt-1">{formErrors.number}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">
                        {form.number.length}/11 — must start with 09
                        {form.number.length === 11 && isValidPhoneNumber(form.number) && (
                          <span className="text-emerald-600 font-bold ml-1">✓ Valid</span>
                        )}
                        {form.number.length === 11 && !isValidPhoneNumber(form.number) && (
                          <span className="text-red-500 font-bold ml-1">✗ Invalid pattern</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="col-span-12 sm:col-span-2">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Purok <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={form.purok}
                      onChange={(e) => {
                        setForm({ ...form, purok: e.target.value });
                        setFormErrors((p) => ({ ...p, purok: undefined }));
                      }}
                      className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${formErrors.purok ? "border-red-400" : "border-gray-200"}`}
                    >
                      <option value="">Select</option>
                      {["1", "2", "3", "4", "5", "6"].map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    {formErrors.purok && (
                      <p className="text-xs text-red-500 mt-1">{formErrors.purok}</p>
                    )}
                  </div>

                  <div className="col-span-12 sm:col-span-10">
                    <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                      Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      placeholder="e.g., 50 Church St., Grace Village, Purok 1"
                      value={form.address}
                      onChange={handleAddressChange}
                      maxLength={100}
                      className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm
                        ${formErrors.address ? "border-red-400" : "border-gray-200"}`}
                    />
                    {formErrors.address ? (
                      <p className="text-xs text-red-500 mt-1">{formErrors.address}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-1">{form.address.length}/100</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Account Credentials */}
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-2">
                  <span className="inline-flex w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] items-center justify-center font-extrabold">3</span>
                  Account Credentials
                </p>

                {editing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">Email</label>
                        <input
                          type="email"
                          name="edit-email-field"
                          autoComplete="off"
                          placeholder="e.g., maria@gmail.com"
                          value={form.email}
                          onChange={handleEmailChange}
                          maxLength={80}
                          className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${formErrors.email ? "border-red-400" : "border-gray-200"}`}
                        />
                        {formErrors.email
                          ? <p className="text-xs text-red-500 mt-1">{formErrors.email}</p>
                          : <p className="text-xs text-gray-400 mt-1">{form.email.length}/80</p>
                        }
                      </div>

                      <div className="col-span-12 sm:col-span-6">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">Current Password</label>
                        <div className={`relative w-full border rounded-xl bg-gray-50 border-gray-100 flex items-center`}>
                          <FiLock size={14} className="text-gray-400 shrink-0 ml-4" />
                          <span className={`flex-1 px-3 py-2.5 text-sm font-semibold text-gray-700 select-all tracking-wide ${!showCurrentPassword ? "tracking-[0.25em]" : ""}`}>
                            {showCurrentPassword
                              ? (currentPassword || <span className="text-gray-400 italic font-normal text-xs">Not stored in record</span>)
                              : "••••••••"
                            }
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="pr-4 text-gray-400 hover:text-indigo-600 transition"
                          >
                            {showCurrentPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                          </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Admin view only — visible to you.</p>
                      </div>
                    </div>

                    <div>
                      {!showChangePassword ? (
                        <button
                          type="button"
                          onClick={() => {
                            setShowChangePassword(true);
                            setForm((p) => ({ ...p, password: "" }));
                            setFormErrors((p) => ({ ...p, password: undefined }));
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 hover:border-indigo-500 hover:bg-indigo-50 font-extrabold text-xs transition"
                        >
                          <FiKey size={14} /> Change Password
                        </button>
                      ) : (
                        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-extrabold text-indigo-700 flex items-center gap-1.5">
                              <FiKey size={13} /> Set New Password
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setShowChangePassword(false);
                                setForm((p) => ({ ...p, password: "" }));
                                setFormErrors((p) => ({ ...p, password: undefined }));
                              }}
                              className="text-xs text-gray-400 hover:text-gray-600 font-semibold flex items-center gap-1 transition"
                            >
                              <FiXCircle size={13} /> Cancel
                            </button>
                          </div>
                          <div className="relative">
                            <input
                              type={showEditPassword ? "text" : "password"}
                              name="new-password-field"
                              autoComplete="new-password"
                              placeholder="Min. 8 chars, A-Z, a-z, 0-9, !@#$"
                              value={form.password}
                              onChange={(e) => {
                                setForm({ ...form, password: e.target.value });
                                setFormErrors((p) => ({ ...p, password: undefined }));
                              }}
                              className={`w-full border rounded-xl px-4 py-2.5 pr-10 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${formErrors.password ? "border-red-400" : "border-indigo-200"}`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowEditPassword(!showEditPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            >
                              {showEditPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                            </button>
                          </div>
                          {form.password && passwordStrength && (
                            <div className="space-y-1">
                              <div className="h-1.5 w-full bg-indigo-100 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                              </div>
                              <p className={`text-[10px] font-extrabold ${
                                passwordStrength.label === "Weak" ? "text-rose-500" :
                                passwordStrength.label === "Fair" ? "text-amber-500" :
                                passwordStrength.label === "Good" ? "text-blue-500" : "text-emerald-500"
                              }`}>
                                Strength: {passwordStrength.label}
                              </p>
                            </div>
                          )}
                          {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
                          {!formErrors.password && !form.password && (
                            <p className="text-xs text-indigo-500/70">8+ chars • A-Z • a-z • 0-9 • !@#$%^&amp;*</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-12 sm:col-span-6">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="new-email-field"
                        autoComplete="new-email"
                        placeholder="e.g., maria@gmail.com"
                        value={form.email}
                        onChange={handleEmailChange}
                        maxLength={80}
                        className={`w-full border rounded-xl px-4 py-2.5 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm ${formErrors.email ? "border-red-400" : "border-gray-200"}`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        {formErrors.email
                          ? <p className="text-xs text-red-500">{formErrors.email}</p>
                          : <p className="text-xs text-gray-400">Must use a valid email provider</p>
                        }
                        <p className="text-xs text-gray-400 ml-auto">{form.email.length}/80</p>
                      </div>
                    </div>

                    <div className="col-span-12 sm:col-span-6">
                      <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600 mb-1">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          name="new-password-field"
                          autoComplete="new-password"
                          placeholder="Min. 8 chars, A-Z, a-z, 0-9, !@#$"
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
                      {form.password && passwordStrength && (
                        <div className="mt-2 space-y-1">
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color} ${passwordStrength.width}`} />
                          </div>
                          <p className={`text-[10px] font-extrabold ${
                            passwordStrength.label === "Weak" ? "text-rose-500" :
                            passwordStrength.label === "Fair" ? "text-amber-500" :
                            passwordStrength.label === "Good" ? "text-blue-500" : "text-emerald-500"
                          }`}>
                            Strength: {passwordStrength.label}
                          </p>
                        </div>
                      )}
                      {formErrors.password && <p className="text-xs text-red-500 mt-1">{formErrors.password}</p>}
                      {!formErrors.password && !form.password && (
                        <p className="text-xs text-gray-400 mt-1">8+ chars • A-Z • a-z • 0-9 • !@#$%^&amp;*</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

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

      {/* Confirm Add Modal */}
      {showConfirm && (
        <ConfirmAddModal
          form={form}
          loading={creating}
          onConfirm={createEmployee}
          onCancel={() => setShowConfirm(false)}
        />
      )}

      {/* Employee Detail Modal */}
      {selectedEmployeeDetail && (
        <EmployeeDetailModal
          employee={selectedEmployeeDetail}
          onClose={() => setSelectedEmployeeDetail(null)}
          onEdit={(emp) => { setSelectedEmployeeDetail(null); startEdit(emp); }}
          onDelete={(id) => { setSelectedEmployeeDetail(null); deleteEmployee(id); }}
          onDisable={disableEmployee}
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