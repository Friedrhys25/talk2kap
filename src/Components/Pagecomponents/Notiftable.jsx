// Notiftable.jsx - Fixed date filter default to show all complaints
import React, { useState, useEffect, useMemo } from "react";
import {
  FiAlertTriangle, FiClock, FiSearch, FiX,
  FiUser, FiMapPin, FiFileText, FiCalendar,
  FiCheckCircle, FiHome,
} from "react-icons/fi";
import {
  getFirestore,
  collection,
  onSnapshot,
  doc,
  updateDoc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import app from "../../firebaseConfig";

const firestore = getFirestore(app);

const Notiftable = () => {
  const [filter, setFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [issueFilter, setIssueFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackAvailable, setFeedbackAvailable] = useState({});
  const [loading, setLoading] = useState(true);

  // ✅ Default: show ALL time (empty = no date filter applied)
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateError, setDateError] = useState("");

  // ── Firestore listener ───────────────────────────────────────────────────────
  useEffect(() => {
    const usersRef = collection(firestore, "users");
    const innerUnsubs = [];

    const unsubUsers = onSnapshot(
      usersRef,
      (usersSnapshot) => {
        setLoading(false);

        usersSnapshot.forEach((userDoc) => {
          const userData = userDoc.data();
          const userId = userDoc.id;
          const fullName = [userData.firstName, userData.middleName, userData.lastName]
            .filter(Boolean).join(" ").trim() || "Unknown";

          const complaintsRef = collection(firestore, "users", userId, "userComplaints");

          const unsubComplaints = onSnapshot(complaintsRef, (complaintsSnap) => {
            setNotifications((prev) => {
              const rest = prev.filter((c) => c.userId !== userId);
              const fresh = [];

              complaintsSnap.forEach((cDoc) => {
                const c = cDoc.data();
                let timestampStr = "—";
                let rawDate = new Date(0);

                if (c.timestamp && typeof c.timestamp.toDate === "function") {
                  rawDate = c.timestamp.toDate();
                  timestampStr = rawDate.toLocaleString();
                } else if (typeof c.timestamp === "string") {
                  timestampStr = c.timestamp;
                  rawDate = new Date(c.timestamp) || new Date(0);
                }

                fresh.push({
                  complaintKey: cDoc.id,
                  userId,
                  name: fullName,
                  purok: userData.purok || "—",
                  address: userData.address || "—",
                  evidencePhoto: c.evidencePhoto || null,
                  incidentPurok: c.incidentPurok || "—",
                  incidentLocation: c.incidentLocation || "—",
                  message: c.message || "",
                  label: c.label || "non-urgent",
                  type: c.type || "—",
                  status: c.status || "pending",
                  timestamp: timestampStr,
                  _rawTimestamp: rawDate,
                });
              });

              return [...rest, ...fresh].sort((a, b) => b._rawTimestamp - a._rawTimestamp);
            });
          });

          innerUnsubs.push(unsubComplaints);
        });

        getDocs(collection(firestore, "complaintFeedback"))
          .then((snap) => {
            const map = {};
            snap.forEach((d) => { if (d.data()?.feedbackMessage) map[d.id] = true; });
            setFeedbackAvailable(map);
          })
          .catch(console.error);
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubUsers();
      innerUnsubs.forEach((u) => u());
    };
  }, []);

  // ── Date validation ──────────────────────────────────────────────────────────
  const getDateBounds = () => {
    // ✅ If either date is empty, return null = no date filtering
    if (!startDate || !endDate) return null;
    const start = new Date(`${startDate}T00:00:00`);
    const end = new Date(`${endDate}T23:59:59`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    return { start, end };
  };

  useEffect(() => {
    if (!startDate && !endDate) { setDateError(""); return; }
    const bounds = getDateBounds();
    if (!bounds && (startDate || endDate)) { setDateError("Please select both From and To dates."); return; }
    if (bounds && bounds.start > bounds.end) { setDateError("From date must be earlier than To date."); return; }
    setDateError("");
  }, [startDate, endDate]);

  // ── Derived data ─────────────────────────────────────────────────────────────
  const issueTypes = useMemo(() => {
    const set = new Set();
    notifications.forEach((n) => { const t = (n.type || "").trim(); if (t && t !== "—") set.add(t); });
    const arr = Array.from(set);
    const preferred = ["medical", "fire", "noise", "waste", "infrastructure"];
    const lowerMap = new Map(arr.map((x) => [x.toLowerCase(), x]));
    return [
      ...preferred.map((p) => lowerMap.get(p)).filter(Boolean),
      ...arr.filter((x) => !preferred.includes(x.toLowerCase())).sort(),
    ];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const bounds = getDateBounds();
    return notifications.filter((n) => {
      if (filter === "urgent" && n.label !== "urgent") return false;
      if (filter === "non-urgent" && n.label === "urgent") return false;
      if (statusFilter !== "all" && n.status !== statusFilter) return false;
      if (issueFilter !== "all" && (n.type || "").toLowerCase() !== issueFilter.toLowerCase()) return false;
      const term = searchTerm.toLowerCase();
      if (term && !n.name?.toLowerCase().includes(term) && !n.type?.toLowerCase().includes(term) &&
          !n.message?.toLowerCase().includes(term) && !n.incidentPurok?.toLowerCase().includes(term)) return false;
      // ✅ Only apply date filter if both dates are set
      if (!dateError && bounds) {
        if (n._rawTimestamp < bounds.start || n._rawTimestamp > bounds.end) return false;
      }
      return true;
    });
  }, [notifications, filter, statusFilter, issueFilter, searchTerm, startDate, endDate, dateError]);

  const stats = useMemo(() => ({
    total: filteredNotifications.length,
    pending: filteredNotifications.filter((n) => n.status === "pending").length,
    "in-progress": filteredNotifications.filter((n) =>
      n.status === "in-progress" || n.status === "in progress"
    ).length,
    resolved: filteredNotifications.filter((n) => n.status === "resolved").length,
  }), [filteredNotifications]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getUrgencyDisplay = (label) =>
    label === "urgent"
      ? { icon: <FiAlertTriangle className="text-red-600" />, text: "Urgent", pill: "bg-red-100 text-red-800 ring-1 ring-red-200" }
      : { icon: <FiClock className="text-blue-600" />, text: "Non-Urgent", pill: "bg-blue-100 text-blue-800 ring-1 ring-blue-200" };

  const getIssueColor = (type) => ({
    medical: "bg-red-100 text-red-800 ring-1 ring-red-200",
    fire: "bg-orange-100 text-orange-800 ring-1 ring-orange-200",
    noise: "bg-purple-100 text-purple-800 ring-1 ring-purple-200",
    waste: "bg-green-100 text-green-800 ring-1 ring-green-200",
    infrastructure: "bg-gray-100 text-gray-800 ring-1 ring-gray-200",
  })[(type || "").toLowerCase()] || "bg-gray-100 text-gray-800 ring-1 ring-gray-200";

  const getStatusDisplay = (status) => ({
    pending: { pill: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200", text: "Pending" },
    "in-progress": { pill: "bg-blue-100 text-blue-900 ring-1 ring-blue-200", text: "In Progress" },
    "in progress": { pill: "bg-blue-100 text-blue-900 ring-1 ring-blue-200", text: "In Progress" },
    resolved: { pill: "bg-green-100 text-green-900 ring-1 ring-green-200", text: "Resolved" },
  })[(status || "").toLowerCase()] || { pill: "bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200", text: "Pending" };

  // ── Update status ────────────────────────────────────────────────────────────
  const updateComplaintStatus = async (complaint, newStatus) => {
    if (!complaint?.userId || !complaint?.complaintKey) return;
    try {
      await updateDoc(
        doc(firestore, "users", complaint.userId, "userComplaints", complaint.complaintKey),
        { status: newStatus }
      );
      setNotifications((prev) =>
        prev.map((c) => c.complaintKey === complaint.complaintKey ? { ...c, status: newStatus } : c)
      );
      setSelectedComplaint((prev) => prev ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      console.error("Error updating:", err);
      alert("Failed to update status.");
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.15,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total" value={stats.total} tone="indigo" />
          <StatCard label="Pending" value={stats.pending} tone="yellow" />
          <StatCard label="In Progress" value={stats["in-progress"]} tone="blue" />
          <StatCard label="Resolved" value={stats.resolved} tone="green" />
        </div>

        {/* Filters */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60">
          <div className="p-5 space-y-4">
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-end justify-between">

              {/* Search */}
              <div className="w-full xl:w-[380px]">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 text-gray-400 -translate-y-1/2" size={18} />
                  <input
                    type="text"
                    placeholder="Search complaints..."
                    className="w-full pl-11 pr-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              {/* Date Range — optional, empty = show all */}
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                {[["From", startDate, setStartDate], ["To", endDate, setEndDate]].map(([lbl, val, setter]) => (
                  <div key={lbl} className="flex flex-col w-full sm:w-[200px]">
                    <label className="text-xs font-bold text-gray-700 mb-1.5">
                      {lbl} <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input type="date" value={val} onChange={(e) => setter(e.target.value)}
                      className="px-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200" />
                  </div>
                ))}
                {(startDate || endDate) && (
                  <div className="flex flex-col justify-end">
                    <button
                      onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="px-4 py-3 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition"
                    >
                      Clear dates
                    </button>
                  </div>
                )}
              </div>

              {/* Issue Type */}
              <div className="flex flex-col w-full sm:w-[220px]">
                <label className="text-xs font-bold text-gray-700 mb-1.5">Issue Type</label>
                <select value={issueFilter} onChange={(e) => setIssueFilter(e.target.value)}
                  className="px-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200">
                  <option value="all">All Types</option>
                  {issueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Urgency */}
              <div className="flex gap-2 w-full xl:w-auto">
                {["all", "urgent", "non-urgent"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                      filter === f ? "bg-indigo-600 text-white border-indigo-600 shadow-lg" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {f.charAt(0).toUpperCase() + f.slice(1).replace("-", " ")}
                  </button>
                ))}
              </div>
            </div>

            {dateError && (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold">{dateError}</div>
            )}

            {/* Status Filter */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold text-gray-700">Status:</span>
              {["all", "pending", "in-progress", "resolved"].map((s) => {
                const active = statusFilter === s;
                const style = s === "pending" ? "bg-yellow-600 text-white"
                  : s === "in-progress" ? "bg-blue-600 text-white"
                  : s === "resolved" ? "bg-green-600 text-white"
                  : "bg-gray-900 text-white";
                return (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2.5 rounded-xl transition-all text-sm font-bold border ${
                      active ? `${style} border-transparent shadow-lg` : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                    }`}>
                    {s === "all" ? "All Status" : s.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mr-3" />
              <span className="text-gray-500 font-semibold">Loading complaints...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gray-200">
                    {["Urgency", "Purok", "Complainant", "Issue Type", "Description", "Date", "Status"].map((h) => (
                      <th key={h} className="px-6 py-4 text-xs font-extrabold tracking-wider text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((n, idx) => {
                    const urgency = getUrgencyDisplay(n.label);
                    const status = getStatusDisplay(n.status);
                    return (
                      <tr key={n.complaintKey}
                        className={`${idx % 2 === 0 ? "bg-white" : "bg-slate-50/70"} border-b border-gray-100 hover:bg-indigo-50/60 transition cursor-pointer`}
                        onClick={() => setSelectedComplaint(n)}>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${urgency.pill}`}>
                            {urgency.icon}{urgency.text}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-gray-900">Purok {n.incidentPurok}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            {n.name}
                            {n.status === "resolved" && feedbackAvailable[n.complaintKey] && (
                              <span className="relative flex items-center justify-center">
                                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${getIssueColor(n.type)}`}>{n.type}</span>
                        </td>
                        <td className="px-6 py-4 max-w-[420px]">
                          <p className="text-sm font-semibold text-gray-700 line-clamp-1">{n.message}</p>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-gray-800">{n.timestamp}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${status.pill}`}>{status.text}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredNotifications.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-500 text-sm font-bold">
                        No complaints found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail Modal */}
        {selectedComplaint && (
          <div className="fixed inset-0 z-50 p-4 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setSelectedComplaint(null)}>
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[96vh] shadow-2xl overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white">
                <button className="absolute top-4 right-4 text-white/90 hover:bg-white/15 rounded-full p-2 transition"
                  onClick={() => setSelectedComplaint(null)}><FiX size={22} /></button>
                <h2 className="text-2xl font-extrabold">Complaint Details</h2>
                <p className="text-white/85 text-sm font-semibold mt-1">Case ID: {selectedComplaint.complaintKey}</p>
              </div>

              <div className="p-6 overflow-y-auto space-y-5">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className={`rounded-xl px-4 py-3 ${getStatusDisplay(selectedComplaint.status).pill}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <FiCheckCircle size={18} />
                      Status: {getStatusDisplay(selectedComplaint.status).text}
                    </div>
                  </div>
                  <div className={`rounded-xl px-4 py-3 ${getUrgencyDisplay(selectedComplaint.label).pill}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      {getUrgencyDisplay(selectedComplaint.label).icon}
                      {getUrgencyDisplay(selectedComplaint.label).text}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={<FiUser size={18} />} title="Complainant" value={selectedComplaint.name} tone="indigo" />
                  <InfoRow icon={<FiMapPin size={18} />} title="Purok" value={`Purok ${selectedComplaint.incidentPurok}`} tone="green" />
                  <InfoRow icon={<FiHome size={18} />} title="Incident Location" value={selectedComplaint.incidentLocation} tone="amber" />
                  <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700"><FiFileText size={18} /></div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Issue Type</p>
                        <span className={`inline-flex mt-2 px-3 py-1.5 rounded-full text-sm font-bold ${getIssueColor(selectedComplaint.type)}`}>
                          {selectedComplaint.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <InfoRow icon={<FiCalendar size={18} />} title="Date Reported" value={selectedComplaint.timestamp} tone="orange" />
                  {selectedComplaint.evidencePhoto && (
                    <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                      <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider mb-2">Proof</p>
                      <img src={selectedComplaint.evidencePhoto} alt="Proof"
                        onClick={() => setPreviewImage(selectedComplaint.evidencePhoto)}
                        className="w-full h-auto object-cover rounded-xl shadow-lg border cursor-pointer hover:opacity-90 transition" />
                      <p className="mt-2 text-xs font-semibold text-gray-600">Click image to preview.</p>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                  <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider mb-2">Complaint Description</p>
                  <p className="text-sm font-semibold text-gray-800 leading-relaxed whitespace-pre-line">{selectedComplaint.message}</p>
                </div>

                {selectedComplaint.status === "resolved" && (
                  <button
                    className="px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
                    onClick={async () => {
                      const key = selectedComplaint?.complaintKey;
                      if (!key) return;
                      try {
                        const fbDoc = await getDoc(doc(firestore, "complaintFeedback", key));
                        setFeedbackMessage(fbDoc.data()?.feedbackMessage || "No feedback yet.");
                      } catch {
                        setFeedbackMessage("Failed to load feedback.");
                      }
                      setShowFeedbackModal(true);
                      setFeedbackAvailable((prev) => { const u = { ...prev }; delete u[key]; return u; });
                    }}>
                    View Feedback
                  </button>
                )}
              </div>

              <div className="border-t p-5 bg-white">
                <button
                  disabled={selectedComplaint.status === "resolved"}
                  className={`w-full py-3.5 rounded-xl text-white text-base font-extrabold transition shadow-lg ${
                    selectedComplaint.status === "pending"
                      ? "bg-blue-600 hover:bg-blue-700"
                      : selectedComplaint.status === "in-progress" || selectedComplaint.status === "in progress"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-gray-400 cursor-not-allowed"}`}
                  onClick={() => {
                    const next = selectedComplaint.status === "pending" ? "in-progress"
                      : (selectedComplaint.status === "in-progress" || selectedComplaint.status === "in progress")
                        ? "resolved" : "resolved";
                    updateComplaintStatus(selectedComplaint, next);
                  }}>
                  {selectedComplaint.status === "pending" ? "Approve → In Progress"
                    : (selectedComplaint.status === "in-progress" || selectedComplaint.status === "in progress")
                      ? "Mark as Resolved" : "Resolved ✓"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[9999] backdrop-blur-sm p-4"
            onClick={() => setShowFeedbackModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-600 text-white rounded-xl p-2.5"><FiCheckCircle size={20} /></span>
                  <h3 className="text-xl font-extrabold text-indigo-700">Feedback</h3>
                </div>
                <button className="text-gray-500 hover:text-indigo-700 p-2 rounded-full hover:bg-indigo-50"
                  onClick={() => setShowFeedbackModal(false)}><FiX size={22} /></button>
              </div>
              <div className="px-6 py-6">
                <p className="text-gray-800 text-sm font-semibold whitespace-pre-line leading-relaxed">{feedbackMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[9999] p-4"
            onClick={() => setPreviewImage(null)}>
            <img src={previewImage} alt="Preview" className="max-w-[92%] max-h-[92%] rounded-2xl shadow-2xl border border-white/20" />
            <button className="absolute top-6 right-6 text-white text-4xl font-extrabold" onClick={() => setPreviewImage(null)}>✖</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notiftable;

/* ── Helpers ──────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, tone }) => {
  const t = {
    indigo: { ring: "ring-indigo-200", bg: "from-indigo-50 to-white", dot: "bg-indigo-600", text: "text-indigo-700" },
    yellow: { ring: "ring-yellow-200", bg: "from-yellow-50 to-white", dot: "bg-yellow-600", text: "text-yellow-700" },
    blue:   { ring: "ring-blue-200",   bg: "from-blue-50 to-white",   dot: "bg-blue-600",   text: "text-blue-700"   },
    green:  { ring: "ring-green-200",  bg: "from-green-50 to-white",  dot: "bg-green-600",  text: "text-green-700"  },
  }[tone] || {};
  return (
    <div className="rounded-2xl bg-white shadow-xl border border-gray-200 overflow-hidden">
      <div className={`p-5 bg-gradient-to-b ${t.bg}`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={`text-xs font-extrabold uppercase tracking-wider ${t.text}`}>{label}</p>
            <p className="mt-2 text-3xl font-extrabold text-gray-900">{value}</p>
          </div>
          <div className={`shrink-0 w-3.5 h-3.5 rounded-full ${t.dot} ring-8 ${t.ring}`} />
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, title, value, tone }) => {
  const chip = {
    indigo: "bg-indigo-100 text-indigo-700", green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",    orange: "bg-orange-100 text-orange-700",
  }[tone] || "bg-indigo-100 text-indigo-700";
  return (
    <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl ${chip}`}>{icon}</div>
        <div className="flex-1">
          <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">{title}</p>
          <p className="mt-1.5 text-sm font-extrabold text-gray-900">{value || "—"}</p>
        </div>
      </div>
    </div>
  );
};