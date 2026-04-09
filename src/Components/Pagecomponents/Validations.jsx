// Validations.jsx - verified = green, filter = verified (not approved)
import React, { useState, useEffect, useMemo } from "react";
import {
  FiUser, FiPhone, FiMapPin, FiHome,
  FiX, FiSearch, FiCheck, FiSlash, FiTrash2, FiShield, FiSun, FiMoon,
} from "react-icons/fi";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
} from "firebase/firestore";
import app from "../../firebaseConfig";

const firestore = getFirestore(app);

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

  // Tanod-specific state
  const [tanodSearch, setTanodSearch] = useState("");
  const [tanodPurokFilter, setTanodPurokFilter] = useState("All Purok");

  // ── Firestore listener (Residents from users collection) ───────────────────
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

        const order = { pending: 0, declined: 1, verified: 2 };
        userArray.sort((a, b) => {
          const ao = order[a.idstatus] ?? 9;
          const bo = order[b.idstatus] ?? 9;
          if (ao !== bo) return ao - bo;
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

  // ── Firestore listener (Tanods/Employees from employee collection) ───────────
  useEffect(() => {
    const empCol = collection(firestore, "employee");
    // Fetch employees where idstatus is null or "pending"
    const unsubscribe = onSnapshot(empCol, (snapshot) => {
      const tanodArray = [];
      snapshot.forEach((docSnap) => {
        const tanod = docSnap.data();
        const idStatus = (tanod.idstatus || "").toLowerCase();
        
        // Only include if idstatus is null, "pending", or undefined
        if (idStatus === "" || idStatus === "pending" || !tanod.idstatus) {
          tanodArray.push({
            id: docSnap.id,
            complainant: [tanod.firstName, tanod.middleName, tanod.lastName]
              .filter(Boolean).join(" ").trim() || "—",
            ...tanod,
            idstatus: normalizeStatus(tanod.idstatus),
            _collection: "employee",
          });
        }
      });

      const order = { pending: 0, declined: 1, verified: 2 };
      tanodArray.sort((a, b) => {
        const ao = order[a.idstatus] ?? 9;
        const bo = order[b.idstatus] ?? 9;
        if (ao !== bo) return ao - bo;
        return (a.complainant || "").localeCompare(b.complainant || "");
      });

      setTanods(tanodArray);
      setTanodLoading(false);
    },
    (err) => {
      console.error("Firestore error fetching tanods:", err);
      setTanodLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ── Separate residents (no longer need to filter tanods from users) ────────
  const residents = useMemo(() => users, [users]);

  // ── Purok options ────────────────────────────────────────────────────────────
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

  // ── Stats (residents only) ───────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:    residents.length,
    pending:  residents.filter((u) => u.idstatus === "pending").length,
    verified: residents.filter((u) => u.idstatus === "verified").length,
    declined: residents.filter((u) => u.idstatus === "declined").length,
  }), [residents]);

  // ── Tanod stats ──────────────────────────────────────────────────────────────
  const tanodStats = useMemo(() => ({
    total:    tanods.length,
    pending:  tanods.filter((u) => u.idstatus === "pending").length,
    verified: tanods.filter((u) => u.idstatus === "verified").length,
    declined: tanods.filter((u) => u.idstatus === "declined").length,
  }), [tanods]);

  // ── Filtered residents ───────────────────────────────────────────────────────
  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return residents.filter((user) => {
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

  // ── Filtered tanods ──────────────────────────────────────────────────────────
  const filteredTanods = useMemo(() => {
    const term = tanodSearch.toLowerCase();
    return tanods.filter((user) => {
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

  // ── Shift helpers ────────────────────────────────────────────────────────────
  const shiftChip = (shift) => {
    if (!shift || shift === "none") return "bg-gray-100 text-gray-500 border-gray-200";
    if (shift === "morning") return "bg-amber-100 text-amber-800 border-amber-200";
    if (shift === "evening") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    return "bg-gray-100 text-gray-500 border-gray-200";
  };

  const shiftLabel = (shift) => {
    if (shift === "morning") return "Morning";
    if (shift === "evening") return "Evening";
    return "No Shift";
  };

  const ShiftIcon = ({ shift, size = 13 }) => {
    if (shift === "morning") return <FiSun size={size} />;
    if (shift === "evening") return <FiMoon size={size} />;
    return null;
  };

  // ── Update / Delete ──────────────────────────────────────────────────────────
  const updateStatus = async (id, newStatus) => {
    try {
      // Check if updating a resident (users collection) or tanod (employee collection)
      const isResident = residents.some(u => u.id === id);
      const isTanod = tanods.some(t => t.id === id);
      
      if (isResident) {
        await updateDoc(doc(firestore, "users", id), { idstatus: newStatus });
        const normalized = normalizeStatus(newStatus);
        setUsers((prev) => prev.map((u) => u.id === id ? { ...u, idstatus: normalized } : u));
        if (selectedUser?.id === id)
          setSelectedUser((prev) => prev ? { ...prev, idstatus: normalized } : prev);
      } else if (isTanod) {
        await updateDoc(doc(firestore, "employee", id), { idstatus: newStatus });
        const normalized = normalizeStatus(newStatus);
        setTanods((prev) => prev.map((t) => t.id === id ? { ...t, idstatus: normalized } : t));
        if (selectedUser?.id === id)
          setSelectedUser((prev) => prev ? { ...prev, idstatus: normalized } : prev);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status.");
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Delete this user permanently? This cannot be undone.")) return;
    try {
      // Check if deleting a resident (users collection) or tanod (employee collection)
      const isResident = residents.some(u => u.id === id);
      const isTanod = tanods.some(t => t.id === id);
      
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

  const updateShift = async (id, newShift) => {
    try {
      // Check if updating a resident (users collection) or tanod (employee collection)
      const isResident = residents.some(u => u.id === id);
      const isTanod = tanods.some(t => t.id === id);
      
      if (isResident) {
        await updateDoc(doc(firestore, "users", id), { shift: newShift });
        setUsers((prev) => prev.map((u) => u.id === id ? { ...u, shift: newShift } : u));
        if (selectedUser?.id === id)
          setSelectedUser((prev) => prev ? { ...prev, shift: newShift } : prev);
      } else if (isTanod) {
        await updateDoc(doc(firestore, "employee", id), { shift: newShift });
        setTanods((prev) => prev.map((t) => t.id === id ? { ...t, shift: newShift } : t));
        if (selectedUser?.id === id)
          setSelectedUser((prev) => prev ? { ...prev, shift: newShift } : prev);
      }
    } catch (err) {
      console.error("Error updating shift:", err);
      alert("Failed to update shift.");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1: RESIDENTS
        ════════════════════════════════════════════════════════════════════ */}

        {/* Section Label */}
        <div className="flex items-center gap-3">
          <FiUser className="text-indigo-600" size={22} />
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Resident Validations</h1>
        </div>

        {/* Search + Purok */}
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

        {/* Stats + Filter */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Stats */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-4 gap-4">
            {[
              { key: "total",    value: stats.total,    color: "text-gray-900"    },
              { key: "pending",  value: stats.pending,  color: "text-amber-700"   },
              { key: "verified", value: stats.verified, color: "text-emerald-700" },
              { key: "declined", value: stats.declined, color: "text-rose-700"    },
            ].map(({ key, value, color }) => (
              <div key={key} className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
                <div className="relative p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">{key}</p>
                  <p className={`mt-1 text-3xl font-extrabold tracking-tight ${color}`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Filter buttons */}
          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-3">Filter</p>
              <div className="flex flex-nowrap gap-2 overflow-x-auto pb-1">
                {["all", "pending", "verified", "declined"].map((f) => {
                  const active = filter === f;
                  const activeStyle =
                    f === "verified" ? "bg-emerald-600 text-white border-emerald-600" :
                    f === "declined" ? "bg-rose-600 text-white border-rose-600" :
                    f === "pending"  ? "bg-amber-500 text-white border-amber-500" :
                    "bg-indigo-600 text-white border-indigo-600";
                  return (
                    <button key={f} onClick={() => setFilter(f)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition border ${
                        active
                          ? `${activeStyle} shadow-md`
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}>
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="border-b border-gray-200">
                    {["Name", "Contact", "Purok", "Address", "ID Verification", "Status", "Actions"].map((h) => (
                      <th key={h} className={`px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-600 ${h === "Actions" ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user, idx) => (
                    <tr key={user.id}
                      className={`border-b border-gray-100 transition ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/50 cursor-pointer`}
                      onClick={() => setSelectedUser(user)}>
                      <td className="px-6 py-4 font-bold text-gray-900">{user.complainant || "—"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">{user.number || "—"}</td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-800">Purok {user.purok || "—"}</td>
                      <td className="px-6 py-4 max-w-sm truncate text-sm text-gray-700" title={user.address || ""}>{user.address || "—"}</td>
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
                        <button onClick={() => deleteUser(user.id)}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-extrabold border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition">
                          <FiTrash2 /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-500 font-semibold">No registrations found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2: TANOD / EMPLOYEES
        ════════════════════════════════════════════════════════════════════ */}

        {/* Divider */}
        <div className="border-t-2 border-dashed border-indigo-200 pt-4" />

        {/* Section Label */}
        <div className="flex items-center gap-3">
          <FiShield className="text-indigo-600" size={22} />
          <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Tanod / Employee Validations</h1>
          <span className="ml-2 px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200">
            {tanods.length} Tanod{tanods.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Tanod Search + Purok */}
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

        {/* Tanod Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {[
            { key: "total",    label: "Total Tanods", value: tanodStats.total,    color: "text-gray-900"    },
            { key: "pending",  label: "Pending",      value: tanodStats.pending,  color: "text-amber-700"   },
            { key: "verified", label: "Verified",     value: tanodStats.verified, color: "text-emerald-700" },
            { key: "declined", label: "Declined",     value: tanodStats.declined, color: "text-rose-700"    },
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
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead className="bg-indigo-50 sticky top-0 z-10">
                  <tr className="border-b border-indigo-100">
                    {["Name", "Contact", "Purok", "Address", "Position", "Shift", "ID Status", "Verification", "Actions"].map((h) => (
                      <th key={h} className={`px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-indigo-700 ${h === "Actions" ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredTanods.map((user, idx) => (
                    <tr
                      key={user.id}
                      className={`border-b border-indigo-50 transition ${idx % 2 === 0 ? "bg-white" : "bg-indigo-50/30"} hover:bg-indigo-50/70 cursor-pointer`}
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
                      <td className="px-6 py-4 max-w-xs truncate text-sm text-gray-700" title={user.address || ""}>{user.address || "—"}</td>
                      <td className="px-6 py-4">
                        {user.position ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border bg-indigo-100 text-indigo-700 border-indigo-200 capitalize">
                            {user.position}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={user.shift || "none"}
                          onChange={(e) => updateShift(user.id, e.target.value)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${shiftChip(user.shift)}`}
                        >
                          <option value="none">No Shift</option>
                          <option value="morning">☀️ Morning</option>
                          <option value="evening">🌙 Evening</option>
                        </select>
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
                  ))}
                  {filteredTanods.length === 0 && (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-gray-500 font-semibold">No tanods found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Detail Modal (shared for residents & tanods) ──────────────────── */}
        {selectedUser && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/35 backdrop-blur-sm z-50 p-4"
            onClick={() => setSelectedUser(null)}>
            <div className="bg-white rounded-[22px] w-full max-w-2xl relative shadow-2xl overflow-hidden border border-white/60"
              onClick={(e) => e.stopPropagation()}>

              {/* Modal header */}
              <div className="relative p-6 text-white bg-linear-to-r from-indigo-600 via-blue-600 to-indigo-700">
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <button className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-all"
                  onClick={() => setSelectedUser(null)}><FiX size={22} /></button>
                <div className="relative">
                  <div className="flex items-start gap-4">
                    {/* Avatar Display for Tanods */}
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
                          {selectedUser.isEmployee ? "Tanod Details" : "User Details"}
                        </h2>
                        {selectedUser.isEmployee && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-extrabold bg-white/20 border border-white/30 ml-1">
                            <FiShield size={12} /> Tanod
                          </span>
                        )}
                      </div>
                      <p className="text-indigo-100 text-xs font-semibold mt-1">ID: {selectedUser.id}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Status badge */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${statusChip(selectedUser.idstatus)}`}>
                  <span className="font-extrabold text-sm">
                    Status: {statusLabel(selectedUser.idstatus)}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <InfoRow label="Name"    value={selectedUser.complainant} icon={<FiUser  className="text-indigo-600"  size={18} />} tone="indigo"  />
                    <InfoRow label="Contact" value={selectedUser.number}      icon={<FiPhone className="text-emerald-600" size={18} />} tone="emerald" />
                    <InfoRow label="Purok"   value={selectedUser.purok ? `Purok ${selectedUser.purok}` : "—"} icon={<FiMapPin className="text-amber-600" size={18} />} tone="amber"   />
                    <InfoRow label="Address" value={selectedUser.address}     icon={<FiHome  className="text-purple-600"  size={18} />} tone="purple"  />
                    {selectedUser.isEmployee && (
                      <InfoRow
                        label="Position"
                        value={selectedUser.position}
                        icon={<FiShield className="text-indigo-600" size={18} />}
                        tone="indigo"
                      />
                    )}
                    {selectedUser.isEmployee && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-amber-100">
                          {selectedUser.shift === "evening"
                            ? <FiMoon className="text-indigo-600" size={18} />
                            : <FiSun className="text-amber-600" size={18} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider mb-1">Shift</p>
                          <select
                            value={selectedUser.shift || "none"}
                            onChange={(e) => updateShift(selectedUser.id, e.target.value)}
                            className={`w-full px-3 py-2 rounded-xl text-sm font-extrabold border cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-400 transition ${shiftChip(selectedUser.shift)}`}
                          >
                            <option value="none">No Shift</option>
                            <option value="morning">☀️ Morning Shift</option>
                            <option value="evening">🌙 Evening Shift</option>
                          </select>
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

                {/* Approve / Decline */}
                <div className="border-t pt-4 flex gap-2">
                  <button
                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-white font-extrabold hover:bg-emerald-700 transition shadow-md"
                    onClick={() => updateStatus(selectedUser.id, "verified")}
                  >
                    ✓ Approve
                  </button>
                  <button
                    className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-extrabold hover:bg-rose-700 transition shadow-md"
                    onClick={() => updateStatus(selectedUser.id, "declined")}
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
        )}

        {/* Fullscreen image preview */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-9999"
            onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Preview" className="max-w-[90%] max-h-[90%] rounded-lg shadow-2xl" />
            <button className="absolute top-6 right-6 text-white text-3xl font-bold hover:scale-110 transition-transform"
              onClick={() => setPreviewImage(null)}>✕</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Validations;

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