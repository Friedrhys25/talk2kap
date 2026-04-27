// src/Components/Pagecomponents/Emergency.jsx
import React, { useState, useEffect, useRef } from "react";
import { FaFire } from "react-icons/fa";
import barangayLogo from "../../assets/sanroquelogo.png";

import {
  FiPhone,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiX,
  FiCheck,
  FiSearch,
  FiShield,
  FiActivity,
  FiLoader,
  FiAlertCircle,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import app from "../../firebaseConfig";

const firestore = getFirestore(app);

/* ── Category config ─────────────────────────────────────────────────────── */
const CATEGORIES = [
  { label: "Police",  color: "indigo", icon: FiShield },
  { label: "Fire",    color: "rose",   icon: FaFire },
  { label: "Medical", color: "emerald",icon: FiActivity },
];

const CATEGORY_STYLES = {
  indigo:  { pill: "bg-indigo-100 text-indigo-700 border-indigo-200",    dot: "bg-indigo-500",  ring: "ring-indigo-300",  btn: "bg-indigo-600 hover:bg-indigo-700"  },
  rose:    { pill: "bg-rose-100 text-rose-700 border-rose-200",          dot: "bg-rose-500",    ring: "ring-rose-300",    btn: "bg-rose-600 hover:bg-rose-700"      },
  emerald: { pill: "bg-emerald-100 text-emerald-700 border-emerald-200", dot: "bg-emerald-500", ring: "ring-emerald-300", btn: "bg-emerald-600 hover:bg-emerald-700" },
};

const colorOf = (cat) => {
  const found = CATEGORIES.find((c) => c.label === cat);
  return found ? found.color : "indigo";
};

/* ── Motion variants ─────────────────────────────────────────────────────── */
const rowVariants = {
  hidden:  { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.04, type: "spring", stiffness: 500, damping: 32 },
  }),
  exit: { opacity: 0, x: -20, transition: { duration: 0.18 } },
};

const modalVariants = {
  hidden:  { opacity: 0, scale: 0.93, y: -18 },
  visible: { opacity: 1, scale: 1,    y: 0,   transition: { type: "spring", stiffness: 520, damping: 34 } },
  exit:    { opacity: 0, scale: 0.93, y: -18, transition: { duration: 0.18 } },
};

const EMPTY_FORM = { name: "", number: "", category: "Police" };

/* ════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════════════════════*/
const Emergency = () => {
  const [hotlines, setHotlines]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [filterCat, setFilterCat]       = useState("All");

  const [modalOpen, setModalOpen]       = useState(false);
  const [editTarget, setEditTarget]     = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [saving, setSaving]             = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);

  const snapshotReceived = useRef(false);

  /* ── Firestore listener ─────────────────────────────────────────────────── */
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!snapshotReceived.current) setLoading(false);
    }, 5000);

    const ref = collection(firestore, "emergencyHotlines");
    const unsub = onSnapshot(
      ref,
      (snap) => {
        snapshotReceived.current = true;
        clearTimeout(timeout);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        data.sort(
          (a, b) =>
            a.category?.localeCompare(b.category) ||
            a.name?.localeCompare(b.name)
        );
        setHotlines(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore read error:", error);
        snapshotReceived.current = true;
        clearTimeout(timeout);
        setLoading(false);
      }
    );

    return () => { clearTimeout(timeout); unsub(); };
  }, []);

  /* ── Filtered list ──────────────────────────────────────────────────────── */
  const filtered = hotlines.filter((h) => {
    const matchCat = filterCat === "All" || h.category === filterCat;
    const q = search.toLowerCase();
    return matchCat && (
      h.name?.toLowerCase().includes(q) ||
      h.number?.includes(search)
    );
  });

  /* ── Modal helpers ──────────────────────────────────────────────────────── */
  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (hotline) => {
    setEditTarget(hotline);
    setForm({ name: hotline.name, number: hotline.number, category: hotline.category });
    setModalOpen(true);
  };

  /* ── Save ───────────────────────────────────────────────────────────────── */
  const handleSave = async () => {
    if (!form.name.trim() || !form.number.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await updateDoc(doc(firestore, "emergencyHotlines", editTarget.id), {
          ...form, updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(firestore, "emergencyHotlines"), {
          ...form, createdAt: serverTimestamp(),
        });
      }
      setModalOpen(false);
    } catch (e) {
      console.error("Save error:", e);
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ─────────────────────────────────────────────────────────────── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDoc(doc(firestore, "emergencyHotlines", deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Stats per category ─────────────────────────────────────────────────── */
  const counts = CATEGORIES.map((c) => ({
    ...c,
    count: hotlines.filter((h) => h.category === c.label).length,
  }));

  /* ════════════════════════════════════════════════════════════════════════
     RENDER
     ════════════════════════════════════════════════════════════════════════*/
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">

      {/* ── Watermark Background Logo (same as Usertable.jsx) ───────────── */}
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

      {/* ── Page Content ────────────────────────────────────────────────── */}
      <div className="relative z-10 w-full min-h-full p-6 space-y-6">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-linear-to-br from-rose-500 to-rose-700 grid place-items-center shadow-lg shadow-rose-200">
                <FiPhone size={18} className="text-white" />
              </span>
              Emergency Hotlines
            </h1>
            <p className="text-sm text-slate-400 font-medium mt-1 ml-[52px]">
              {hotlines.length} hotline{hotlines.length !== 1 ? "s" : ""} registered · Visible to app users
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-700 text-white text-sm font-extrabold shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all"
          >
            <FiPlus size={17} />
            Add Hotline
          </motion.button>
        </div>

        {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          {counts.map(({ label, color, icon: Icon, count }) => {
            const s = CATEGORY_STYLES[color];
            return (
              <motion.div
                key={label}
                whileHover={{ y: -2 }}
                className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-lg p-4 flex items-center gap-4"
              >
                <div className={`w-11 h-11 rounded-xl grid place-items-center ${s.btn} shadow-md`}>
                  <Icon size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-800">{count}</p>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">{label}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ── Filters ────────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-xs">
            <FiSearch size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or number…"
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/80 backdrop-blur text-sm font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm"
            />
          </div>

          <div className="flex gap-2">
            {["All", ...CATEGORIES.map((c) => c.label)].map((cat) => {
              const active = filterCat === cat;
              const color  = cat === "All" ? null : colorOf(cat);
              const s      = color ? CATEGORY_STYLES[color] : null;
              return (
                <motion.button
                  key={cat}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setFilterCat(cat)}
                  className={[
                    "px-3.5 py-1.5 rounded-lg text-xs font-extrabold border transition-all",
                    active && s  ? `${s.pill} shadow-sm`
                    : active     ? "bg-slate-800 text-white border-slate-800 shadow-sm"
                                 : "bg-white/80 backdrop-blur border-slate-200 text-slate-500 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {cat}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* ── Table ──────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="hidden sm:grid grid-cols-10 gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50/80">
            <span className="col-span-4 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Agency / Name</span>
            <span className="col-span-3 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Contact Number</span>
            <span className="col-span-2 text-[11px] font-extrabold uppercase tracking-widest text-slate-400">Category</span>
            <span className="col-span-1 text-[11px] font-extrabold uppercase tracking-widest text-slate-400 text-right">Actions</span>
          </div>

          {/* Body */}
          {loading ? (
            <div className="flex items-center justify-center gap-2.5 py-20 text-slate-400">
              <FiLoader size={20} className="animate-spin" />
              <span className="text-sm font-semibold">Loading hotlines…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-300">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 grid place-items-center">
                <FiPhone size={28} />
              </div>
              <p className="text-sm font-bold text-slate-400">
                {hotlines.length === 0 ? "No hotlines registered yet" : "No hotlines match your search"}
              </p>
              {hotlines.length === 0 && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={openAdd}
                  className="text-xs font-extrabold text-indigo-600 hover:underline mt-1">
                  + Add the first one
                </motion.button>
              )}
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              <AnimatePresence initial={false}>
                {filtered.map((h, i) => {
                  const color = colorOf(h.category);
                  const s = CATEGORY_STYLES[color];
                  const Icon = CATEGORIES.find(c => c.label === h.category)?.icon || FiPhone;
                  return (
                    <motion.li
                      key={h.id}
                      custom={i}
                      variants={rowVariants}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                      layout
                      className="sm:grid sm:grid-cols-10 sm:gap-4 flex flex-col gap-2 px-6 py-4 hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Name */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className={`shrink-0 w-8 h-8 rounded-lg grid place-items-center ${s.btn} shadow-sm`}>
                          <Icon size={14} className="text-white" />
                        </div>
                        <span className="text-sm font-extrabold text-slate-800 truncate">{h.name}</span>
                      </div>

                      {/* Number */}
                      <div className="col-span-3 flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-md bg-slate-100 grid place-items-center shrink-0">
                          <FiPhone size={11} className="text-slate-500" />
                        </div>
                        <a href={`tel:${h.number}`}
                          className="text-sm font-bold text-indigo-600 hover:text-indigo-800 hover:underline truncate">
                          {h.number}
                        </a>
                      </div>

                      {/* Category */}
                      <div className="col-span-2 flex items-center">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-extrabold border ${s.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                          {h.category}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="col-span-1 flex items-center justify-end gap-1.5">
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => openEdit(h)}
                          className="w-8 h-8 rounded-lg grid place-items-center border border-slate-200 bg-white text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm transition-all"
                          title="Edit"
                        >
                          <FiEdit2 size={13} />
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                          onClick={() => setDeleteTarget(h)}
                          className="w-8 h-8 rounded-lg grid place-items-center border border-slate-200 bg-white text-slate-400 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50 shadow-sm transition-all"
                          title="Delete"
                        >
                          <FiTrash2 size={13} />
                        </motion.button>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ADD / EDIT MODAL
            ═══════════════════════════════════════════════════════════════════*/}
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => !saving && setModalOpen(false)}
              />
              <motion.div
                variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                className="relative w-full max-w-md rounded-2xl border border-white/60 bg-white shadow-2xl overflow-hidden"
              >
                {/* Modal header */}
                <div className="relative p-6 bg-linear-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white">
                  <button
                    onClick={() => !saving && setModalOpen(false)}
                    className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition"
                  >
                    <FiX size={17} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
                      <FiPhone size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60">
                        {editTarget ? "Edit Hotline" : "New Hotline"}
                      </p>
                      <h3 className="text-lg font-extrabold">
                        {editTarget ? editTarget.name : "Add Emergency Hotline"}
                      </h3>
                    </div>
                  </div>
                </div>

                {/* Form */}
                <div className="p-6 space-y-4">
                  {/* Name */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Agency / Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="e.g. San Roque Police Station"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    />
                  </div>

                  {/* Number */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Contact Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      value={form.number}
                      onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                      placeholder="e.g. 0917-123-4567 or 911"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 transition"
                    />
                  </div>

                  {/* Category — visual selector */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2 block">
                      Category
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map(({ label, color, icon: Icon }) => {
                        const s = CATEGORY_STYLES[color];
                        const active = form.category === label;
                        return (
                          <motion.button
                            key={label}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setForm((f) => ({ ...f, category: label }))}
                            className={[
                              "flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-extrabold transition-all",
                              active
                                ? `${s.pill} border-current shadow-sm`
                                : "border-slate-200 text-slate-500 bg-white hover:bg-slate-50",
                            ].join(" ")}
                          >
                            <Icon size={18} />
                            {label}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => !saving && setModalOpen(false)}
                      disabled={saving}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 transition text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSave}
                      disabled={saving || !form.name.trim() || !form.number.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-indigo-600 to-indigo-700 text-white font-extrabold transition text-sm shadow-md shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {saving ? <FiLoader size={15} className="animate-spin" /> : <FiCheck size={15} />}
                      {saving ? "Saving…" : editTarget ? "Save Changes" : "Add Hotline"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ═══════════════════════════════════════════════════════════════════
            DELETE CONFIRM MODAL
            ═══════════════════════════════════════════════════════════════════*/}
        <AnimatePresence>
          {deleteTarget && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={() => !deleting && setDeleteTarget(null)}
              />
              <motion.div
                variants={modalVariants} initial="hidden" animate="visible" exit="exit"
                className="relative w-full max-w-sm rounded-2xl border border-white/60 bg-white shadow-2xl overflow-hidden"
              >
                <div className="p-6 bg-linear-to-r from-rose-600 to-rose-700 text-white">
                  <button
                    onClick={() => !deleting && setDeleteTarget(null)}
                    className="absolute top-4 right-4 text-white/70 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition"
                  >
                    <FiX size={17} />
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/15 border border-white/20 grid place-items-center">
                      <FiTrash2 size={20} />
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold uppercase tracking-widest text-white/60">Confirm Delete</p>
                      <h3 className="text-lg font-extrabold">Remove Hotline</h3>
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <p className="text-sm text-slate-500 font-semibold mb-1">You are about to delete:</p>
                  <p className="text-base font-extrabold text-slate-800 mb-1">{deleteTarget?.name}</p>
                  <p className="text-sm font-bold text-slate-500 mb-4">{deleteTarget?.number}</p>
                  <p className="text-xs text-slate-400 font-semibold mb-5 p-3 bg-rose-50 rounded-xl border border-rose-100">
                    ⚠️ This will immediately remove it from the app and cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => !deleting && setDeleteTarget(null)}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-extrabold hover:bg-slate-200 transition text-sm disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDelete}
                      disabled={deleting}
                      className="flex-1 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-rose-700 text-white font-extrabold transition text-sm shadow-md shadow-rose-200 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {deleting ? <FiLoader size={15} className="animate-spin" /> : <FiTrash2 size={15} />}
                      {deleting ? "Deleting…" : "Yes, Delete"}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>{/* end relative z-10 */}
    </div>
  );
};

export default Emergency;