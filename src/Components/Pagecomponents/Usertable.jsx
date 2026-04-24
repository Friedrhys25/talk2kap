// Usertable.jsx - Verified users list, clickable rows, detail modal with all Firestore fields
import React, { useState, useEffect, useMemo } from "react";
import barangayLogo from "../../assets/sanroquelogo.png";

import {
  FiUser, FiPhone, FiMapPin, FiHome,
  FiX, FiSearch, FiCheck, FiMail,
  FiChevronLeft, FiChevronRight,
  FiCalendar, FiHash, FiUserX, FiTrash2,
} from "react-icons/fi";
import {
  getFirestore,
  collection,
  onSnapshot,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import app from "../../firebaseConfig";

const firestore = getFirestore(app);

const PAGE_SIZE = 10;

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

// ── Pagination ───────────────────────────────────────────────────────────────
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
  const deduped = pages.filter((p, idx) => !(p === "..." && pages[idx - 1] === "..."));

  const btnBase = "inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-extrabold border transition";
  const active  = "bg-indigo-600 text-white border-indigo-600 shadow";
  const inactive = "bg-white text-gray-700 border-gray-200 hover:bg-gray-50";
  const disabled = "bg-white text-gray-300 border-gray-100 cursor-not-allowed";

  return (
    <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 bg-white/60">
      <p className="text-xs font-semibold text-gray-500">
        Showing <span className="font-extrabold text-gray-700">{from}–{to}</span> of{" "}
        <span className="font-extrabold text-gray-700">{totalItems}</span>
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}
          className={`${btnBase} ${currentPage === 1 ? disabled : inactive}`}>
          <FiChevronLeft size={14} />
        </button>
        {deduped.map((p, idx) =>
          p === "..." ? (
            <span key={`e-${idx}`} className="w-8 text-center text-xs text-gray-400 font-bold">…</span>
          ) : (
            <button key={p} onClick={() => onPageChange(p)}
              className={`${btnBase} ${currentPage === p ? active : inactive}`}>{p}</button>
          )
        )}
        <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className={`${btnBase} ${currentPage === totalPages ? disabled : inactive}`}>
          <FiChevronRight size={14} />
        </button>
      </div>
    </div>
  );
};

// ── Detail Modal ─────────────────────────────────────────────────────────────
const UserDetailModal = ({ user, onClose, onDisable, onDelete }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!user) return null;

  return (
    <>
      <div
        className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-[22px] w-full max-w-2xl relative shadow-2xl overflow-hidden border border-white/60 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative p-6 text-white bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-700">
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
            <button
              className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-all"
              onClick={onClose}
            >
              <FiX size={22} />
            </button>
            <div className="relative flex items-center gap-5">
              {/* ── BIGGER AVATAR ── */}
              <div className="w-28 h-28 rounded-2xl bg-white/15 border-2 border-white/30 grid place-items-center shrink-0 shadow-lg overflow-hidden">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.fullName}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => setPreviewImage(user.avatar)}
                  />
                ) : (
                  <FiUser size={52} className="text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-extrabold">{user.fullName || "—"}</h2>
                {user.email && (
                  <p className="text-sm text-white/75 mt-1 font-medium">{user.email}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Account credentials */}
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
                    <p className="text-sm font-bold text-gray-900 truncate">{user.email || "—"}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Personal info + ID image */}
            <div className="space-y-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                  <FiUser size={12} /> Personal Information
                </p>
                <InfoRow label="Full Name"    value={user.fullName}    icon={<FiUser  className="text-indigo-600"  size={16} />} tone="indigo"  />
                <InfoRow label="Contact"      value={user.number}      icon={<FiPhone className="text-emerald-600" size={16} />} tone="emerald" />
                <InfoRow label="Purok"        value={user.purok ? `Purok ${user.purok}` : "—"} icon={<FiMapPin className="text-amber-600" size={16} />} tone="amber" />
                <InfoRow label="Address"      value={user.address}     icon={<FiHome  className="text-purple-600"  size={16} />} tone="purple"  />
                {user.birthdate && (
                  <InfoRow label="Birthdate"  value={formatDate(user.birthdate)} icon={<FiCalendar className="text-rose-500" size={16} />} tone="rose" />
                )}
                {user.gender && (
                  <InfoRow label="Gender"     value={user.gender}      icon={<FiHash className="text-teal-600" size={16} />} tone="teal" />
                )}
                {user.disabled && (
                  <div className="rounded-xl border border-gray-300 bg-gray-100 px-4 py-3 flex items-center gap-2">
                    <FiX className="text-gray-600 shrink-0" size={16} />
                    <div>
                      <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">Account Disabled</p>
                      <p className="text-sm font-bold text-gray-700">This account has been disabled</p>
                    </div>
                  </div>
                )}
              </div>

            {/* Actions */}
            <div className="border-t pt-4 space-y-3">
              <div className="flex gap-3">
                <button
                  onClick={() => onDisable(user.id)}
                  disabled={user.disabled}
                  className={`flex-1 py-3 rounded-xl font-extrabold transition shadow-md inline-flex items-center justify-center gap-2 ${
                    user.disabled
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200"
                      : "bg-gray-700 text-white hover:bg-gray-800"
                  }`}
                >
                  <FiUserX size={16} />
                  {user.disabled ? "Account Disabled" : "Disable Account"}
                </button>
                <button
                  onClick={() => onDelete(user.id)}
                  className="flex-1 py-3 rounded-xl bg-rose-50 text-rose-700 font-extrabold border border-rose-200 hover:bg-rose-100 transition inline-flex items-center justify-center gap-2"
                >
                  <FiTrash2 size={16} /> Delete User
                </button>
              </div>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 transition shadow-md"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-9999"
          onClick={() => setPreviewImage(null)}
        >
          <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl" />
          <button
            className="absolute top-6 right-6 text-white text-3xl font-bold hover:scale-110 transition-transform"
            onClick={() => setPreviewImage(null)}
          >✕</button>
        </div>
      )}
    </>
  );
};

// ── Main Usertable ───────────────────────────────────────────────────────────
const Usertable = () => {
  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState("");
  const [purokFilter, setPurokFilter]   = useState("All Purok");
  const [currentPage, setCurrentPage]   = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);

  // ── Disable user ──────────────────────────────────────────────────────────
  const disableUser = async (id) => {
    if (!window.confirm("Disable this account? The user will no longer be able to log in.")) return;
    try {
      await updateDoc(doc(firestore, "users", id), { disabled: true });
      setUsers((prev) => prev.map((u) => u.id === id ? { ...u, disabled: true } : u));
      setSelectedUser((prev) => prev?.id === id ? { ...prev, disabled: true } : prev);
    } catch (err) {
      console.error("Error disabling user:", err);
      alert("Failed to disable account.");
    }
  };

  // ── Delete user ───────────────────────────────────────────────────────────
  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(firestore, "users", id));
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setSelectedUser(null);
    } catch (err) {
      console.error("Error deleting user:", err);
      alert("Failed to delete user.");
    }
  };

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [searchTerm, purokFilter]);

  // ── Firestore: only verified users ────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "users"),
      (snapshot) => {
        const arr = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const status = (data.idstatus || "pending").toLowerCase();
          const isVerified = status === "verified" || status === "approved";
          if (!isVerified) return;

          const fullName = [data.firstName, data.middleName, data.lastName]
            .filter(Boolean).join(" ").trim() || "—";

          arr.push({
            id: docSnap.id,
            fullName,
            ...data,
          });
        });

        arr.sort((a, b) => {
          const da = toDate(a.createdAt);
          const db = toDate(b.createdAt);
          if (da && db) return db - da;
          if (da) return -1;
          if (db) return 1;
          return (a.fullName || "").localeCompare(b.fullName || "");
        });

        setUsers(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Purok options ─────────────────────────────────────────────────────────
  const purokOptions = useMemo(() => {
    const base = ["All Purok", "Purok 1", "Purok 2", "Purok 3", "Purok 4", "Purok 5"];
    const unique = new Set();
    users.forEach((u) => {
      const p = u.purok;
      if (p != null && String(p).trim() !== "") unique.add(String(p).trim());
    });
    const baseSet = new Set(base);
    const extras = Array.from(unique)
      .map((p) => `Purok ${p}`)
      .filter((l) => !baseSet.has(l))
      .sort((a, b) => {
        const na = Number(a.replace(/\D/g, "")), nb = Number(b.replace(/\D/g, ""));
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      });
    return [...base, ...extras];
  }, [users]);

  // ── Stats ─────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    users.length,
    active:   users.filter((u) => !u.disabled).length,
    disabled: users.filter((u) => !!u.disabled).length,
  }), [users]);

  // ── Filtered ──────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return users.filter((u) => {
      const matchSearch =
        (u.fullName  || "").toLowerCase().includes(term) ||
        (u.email     || "").toLowerCase().includes(term) ||
        String(u.number  || "").toLowerCase().includes(term) ||
        String(u.purok   || "").toLowerCase().includes(term) ||
        (u.address   || "").toLowerCase().includes(term);
      const matchPurok =
        purokFilter === "All Purok"
          ? true
          : `Purok ${String(u.purok ?? "").trim()}` === purokFilter;
      return matchSearch && matchPurok;
    });
  }, [users, searchTerm, purokFilter]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated   = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Page title */}
        <div className="flex items-center gap-3">
          <FiUser className="text-indigo-600" size={22} />
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Verified User List</h1>
          <span className="ml-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-50 text-emerald-600 border border-emerald-200">
            <FiCheck size={11} /> Verified Only
          </span>
        </div>

        {/* Search & filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search name, email, contact, purok, address..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Total Verified",  value: stats.total,    color: "text-indigo-700"  },
            { label: "Active",          value: stats.active,   color: "text-emerald-700" },
            { label: "Disabled Accounts", value: stats.disabled, color: "text-rose-700"  },
          ].map(({ label, value, color }) => (
            <div key={label} className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
              <div className="relative p-4">
                <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">{label}</p>
                <p className={`mt-1 text-3xl font-extrabold tracking-tight ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
              <span className="text-gray-500 font-semibold">Loading verified users...</span>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-white sticky top-0 z-10">
                    <tr className="border-b border-gray-200">
                      {["#", "Name", "Email", "Contact", "Purok", "Address", "Status"].map((h) => (
                        <th key={h} className="px-5 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-600">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((user, idx) => (
                      <tr
                        key={user.id}
                        className={`border-b border-gray-100 transition cursor-pointer ${
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"
                        } hover:bg-indigo-50/60`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <td className="px-5 py-4 text-xs font-bold text-gray-400">
                          {(currentPage - 1) * PAGE_SIZE + idx + 1}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 grid place-items-center shrink-0 overflow-hidden">
                              {user.avatar
                                ? <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                                : <FiUser className="text-indigo-500" size={14} />
                              }
                            </div>
                            <span className="font-bold text-gray-900 text-sm">{user.fullName}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 font-semibold max-w-[180px] truncate" title={user.email || ""}>
                          {user.email || "—"}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-800">{user.number || "—"}</td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                          {user.purok ? `Purok ${user.purok}` : "—"}
                        </td>
                        <td className="px-5 py-4 text-sm text-gray-700 max-w-[180px] truncate" title={user.address || ""}>
                          {user.address || "—"}
                        </td>
                        <td className="px-5 py-4">
                          {user.disabled ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold border bg-gray-100 text-gray-600 border-gray-200">
                              Disabled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold border bg-emerald-50 text-emerald-700 border-emerald-200">
                              <FiCheck size={10} /> Active
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="text-center py-12 text-gray-500 font-semibold">
                          No verified users found
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
            </>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} onDisable={disableUser} onDelete={deleteUser} />
      )}
    </div>
  );
};

export default Usertable;

// ── InfoRow helper ───────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, tone = "indigo" }) => {
  const tones = {
    indigo:  "bg-indigo-100",
    emerald: "bg-emerald-100",
    amber:   "bg-amber-100",
    purple:  "bg-purple-100",
    rose:    "bg-rose-100",
    teal:    "bg-teal-100",
  };
  return (
    <div className="flex items-start gap-3">
      <div className={`p-2 rounded-lg ${tones[tone] || tones.indigo}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[10px] text-gray-500 font-extrabold uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-gray-900 truncate" title={value || ""}>{value || "—"}</p>
      </div>
    </div>
  );
};