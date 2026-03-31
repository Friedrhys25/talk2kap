// Notiftable.jsx
// Flow: pending → assign tanod modal → in-progress → resolve feedback modal → resolved
// On assign:  writes assignedComplaints[] to users/{tanodUid} in Firestore
// On resolve: updates that entry's status to "resolved" inside the same array
import React, { useState, useEffect, useMemo } from "react";
import {
  FiAlertTriangle, FiClock, FiSearch, FiX,
  FiUser, FiMapPin, FiFileText, FiCalendar,
  FiCheckCircle, FiHome, FiShield, FiStar, FiMessageSquare,
  FiEye, FiList,
} from "react-icons/fi";
import {
  collection, onSnapshot, doc, updateDoc,
  getDoc, addDoc, serverTimestamp, query, where,
} from "firebase/firestore";
import { firestore } from "../../firebaseConfig";

// ── Persisted seen-feedback keys ──────────────────────────────────────────────
const SEEN_KEY = "seenFeedbackKeys";
const loadSeenKeys = () => {
  try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || "[]")); }
  catch { return new Set(); }
};
const saveSeenKey = (key) => {
  try {
    const s = loadSeenKeys(); s.add(key);
    localStorage.setItem(SEEN_KEY, JSON.stringify([...s]));
  } catch {}
};

// ── Star picker ───────────────────────────────────────────────────────────────
const StarPicker = ({ value, onChange, size = 28 }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)}
        className="transition-transform hover:scale-110 focus:outline-none">
        <FiStar size={size}
          className={n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-300 hover:text-yellow-300"} />
      </button>
    ))}
  </div>
);

const ratingLabel = (r) =>
  ["", "Poor", "Fair", "Good", "Very Good", "Excellent"][r] || "";

// ── Tanod Workload Modal ──────────────────────────────────────────────────────
const TanodWorkloadModal = ({ tanod, allComplaints, onClose }) => {
  const assigned = useMemo(() => {
    if (!tanod) return [];
    return allComplaints.filter(
      (c) => c.assignedTanodUid === tanod.uid && c.status !== "resolved"
    );
  }, [tanod, allComplaints]);

  const resolved = useMemo(() => {
    if (!tanod) return [];
    return allComplaints.filter(
      (c) => c.assignedTanodUid === tanod.uid && c.status === "resolved"
    );
  }, [tanod, allComplaints]);

  if (!tanod) return null;

  const statusPill = (s) => ({
    "in-progress":  "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
    "in progress":  "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
    resolved:       "bg-green-100 text-green-800 ring-1 ring-green-200",
    pending:        "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200",
  })[(s||"").toLowerCase()] || "bg-gray-100 text-gray-700";

  const statusText = (s) => ({
    "in-progress": "In Progress",
    "in progress":  "In Progress",
    resolved:       "Resolved",
    pending:        "Pending",
  })[(s||"").toLowerCase()] || s;

  return (
    <div className="fixed inset-0 z-[80] p-4 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}>

        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 p-2.5 rounded-xl"><FiShield size={20} /></div>
            <div>
              <h3 className="text-lg font-extrabold">{tanod.fullName}</h3>
              <p className="text-indigo-100 text-xs font-semibold capitalize mt-0.5">
                {tanod.employeeRole || tanod.position || "Employee"}
              </p>
            </div>
          </div>
          <button className="text-white/80 hover:text-white hover:bg-white/15 rounded-full p-2 transition"
            onClick={onClose}><FiX size={20} /></button>
        </div>

        <div className="px-6 py-4 border-b flex gap-3 shrink-0">
          <div className="flex-1 rounded-xl bg-blue-50 ring-1 ring-blue-200 px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-blue-700">{assigned.length}</p>
            <p className="text-xs font-bold text-blue-600 mt-0.5">Active</p>
          </div>
          <div className="flex-1 rounded-xl bg-green-50 ring-1 ring-green-200 px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-green-700">{resolved.length}</p>
            <p className="text-xs font-bold text-green-600 mt-0.5">Resolved</p>
          </div>
          <div className="flex-1 rounded-xl bg-indigo-50 ring-1 ring-indigo-200 px-4 py-3 text-center">
            <p className="text-2xl font-extrabold text-indigo-700">{assigned.length + resolved.length}</p>
            <p className="text-xs font-bold text-indigo-600 mt-0.5">Total</p>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {assigned.length === 0 && resolved.length === 0 ? (
            <div className="text-center py-10">
              <FiList className="mx-auto text-gray-300 mb-3" size={36} />
              <p className="text-gray-500 text-sm font-bold">No complaints assigned to this tanod.</p>
            </div>
          ) : (
            <>
              {assigned.length > 0 && (
                <>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-2">Active Assignments</p>
                  {assigned.map((c) => (
                    <div key={c.complaintKey}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-extrabold text-gray-900 truncate">{c.name}</p>
                          <p className="text-xs text-gray-500 font-semibold">Purok {c.incidentPurok} · {c.type}</p>
                        </div>
                        <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusPill(c.status)}`}>
                          {statusText(c.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 font-semibold line-clamp-2">{c.message}</p>
                      <p className="text-xs text-gray-400 font-semibold">{c.timestamp}</p>
                    </div>
                  ))}
                </>
              )}
              {resolved.length > 0 && (
                <>
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-500 mt-4 mb-2">Resolved Complaints</p>
                  {resolved.map((c) => (
                    <div key={c.complaintKey}
                      className="rounded-xl border border-gray-100 bg-slate-50 p-4 space-y-1 opacity-80">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-700 truncate">{c.name}</p>
                          <p className="text-xs text-gray-400 font-semibold">Purok {c.incidentPurok} · {c.type}</p>
                        </div>
                        <span className={`shrink-0 inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${statusPill(c.status)}`}>
                          {statusText(c.status)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 font-semibold line-clamp-1">{c.message}</p>
                      <p className="text-xs text-gray-400 font-semibold">{c.timestamp}</p>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
const Notiftable = () => {
  const [filter, setFilter]               = useState("all");
  const [statusFilter, setStatusFilter]   = useState("all");
  const [issueFilter, setIssueFilter]     = useState("all");
  const [searchTerm, setSearchTerm]       = useState("");
  const [notifications, setNotifications] = useState([]);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [previewImage, setPreviewImage]   = useState(null);
  const [feedbackAvailable, setFeedbackAvailable] = useState({});
  const [seenKeys]                        = useState(() => loadSeenKeys());
  const [loading, setLoading]             = useState(true);
  const [startDate, setStartDate]         = useState("");
  const [endDate, setEndDate]             = useState("");
  const [dateError, setDateError]         = useState("");

  const [tanods, setTanods]               = useState([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTarget, setAssignTarget]   = useState(null);
  const [selectedTanod, setSelectedTanod] = useState("");
  const [assigning, setAssigning]         = useState(false);

  const [showWorkloadModal, setShowWorkloadModal] = useState(false);
  const [workloadTanod, setWorkloadTanod]         = useState(null);

  const [showViewFeedbackModal, setShowViewFeedbackModal] = useState(false);
  const [viewFeedbackData, setViewFeedbackData]           = useState(null);

  const [showResolveFeedback, setShowResolveFeedback] = useState(false);
  const [resolvingComplaint, setResolvingComplaint]   = useState(null);
  const [tanodRating, setTanodRating]     = useState(0);
  const [tanodComment, setTanodComment]   = useState("");
  const [systemRating, setSystemRating]   = useState(0);
  const [systemComment, setSystemComment] = useState("");
  const [submittingResolve, setSubmittingResolve] = useState(false);

  // ── Fetch tanods ──────────────────────────────────────────────────────────
  useEffect(() => {
    const q = query(collection(firestore, "users"), where("isEmployee", "==", true));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({
        uid: d.id, ...d.data(),
        fullName: [d.data().firstName, d.data().middleName, d.data().lastName]
          .filter(Boolean).join(" ").trim() || "Unknown",
      }));
      list.sort((a, b) => a.fullName.localeCompare(b.fullName));
      setTanods(list);
    });
    return () => unsub();
  }, []);

  // ── Feedback listener ─────────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(firestore, "complaintFeedback"), (snap) => {
      const map = {};
      snap.forEach((d) => {
        if ((d.data()?.tanodComment || d.data()?.systemComment) && !seenKeys.has(d.id))
          map[d.id] = true;
      });
      setFeedbackAvailable(map);
    });
    return () => unsub();
  }, []);

  // ── Complaints listener ───────────────────────────────────────────────────
  useEffect(() => {
    const innerUnsubs = [];
    const unsubUsers = onSnapshot(
      collection(firestore, "users"),
      (usersSnap) => {
        setLoading(false);
        usersSnap.forEach((userDoc) => {
          const userData = userDoc.data();
          const userId   = userDoc.id;
          const fullName = [userData.firstName, userData.middleName, userData.lastName]
            .filter(Boolean).join(" ").trim() || "Unknown";
          const unsub = onSnapshot(
            collection(firestore, "users", userId, "userComplaints"),
            (cSnap) => {
              setNotifications((prev) => {
                const rest  = prev.filter((c) => c.userId !== userId);
                const fresh = [];
                cSnap.forEach((cDoc) => {
                  const c = cDoc.data();
                  let timestampStr = "—", rawDate = new Date(0);
                  if (c.timestamp?.toDate) {
                    rawDate = c.timestamp.toDate(); timestampStr = rawDate.toLocaleString();
                  } else if (typeof c.timestamp === "string") {
                    timestampStr = c.timestamp; rawDate = new Date(c.timestamp) || new Date(0);
                  }
                  fresh.push({
                    complaintKey:      cDoc.id, userId,
                    name:              fullName,
                    purok:             userData.purok || "—",
                    address:           userData.address || "—",
                    evidencePhoto:     c.evidencePhoto || null,
                    incidentPurok:     c.incidentPurok || "—",
                    incidentLocation:  c.incidentLocation || "—",
                    message:           c.message || "",
                    label:             c.label || "non-urgent",
                    type:              c.type || "—",
                    status:            c.status || "pending",
                    timestamp:         timestampStr,
                    _rawTimestamp:     rawDate,
                    assignedTanodUid:  c.assignedTanodUid  || null,
                    assignedTanodName: c.assignedTanodName || null,
                    feedbackDocId:     c.feedbackDocId     || null,
                  });
                });
                return [...rest, ...fresh].sort((a, b) => b._rawTimestamp - a._rawTimestamp);
              });
            }
          );
          innerUnsubs.push(unsub);
        });
      },
      (err) => { console.error(err); setLoading(false); }
    );
    return () => { unsubUsers(); innerUnsubs.forEach((u) => u()); };
  }, []);

  // ── Date validation ───────────────────────────────────────────────────────
  const getDateBounds = () => {
    if (!startDate || !endDate) return null;
    const s = new Date(`${startDate}T00:00:00`), e = new Date(`${endDate}T23:59:59`);
    return isNaN(s) || isNaN(e) ? null : { start: s, end: e };
  };
  useEffect(() => {
    if (!startDate && !endDate) { setDateError(""); return; }
    const b = getDateBounds();
    if (!b && (startDate || endDate)) { setDateError("Please select both From and To dates."); return; }
    if (b && b.start > b.end) { setDateError("From date must be earlier than To date."); return; }
    setDateError("");
  }, [startDate, endDate]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const issueTypes = useMemo(() => {
    const set = new Set();
    notifications.forEach((n) => { const t = (n.type||"").trim(); if (t && t !== "—") set.add(t); });
    const arr = Array.from(set);
    const pref = ["medical","fire","noise","waste","infrastructure"];
    const lm = new Map(arr.map((x) => [x.toLowerCase(), x]));
    return [...pref.map((p) => lm.get(p)).filter(Boolean), ...arr.filter((x) => !pref.includes(x.toLowerCase())).sort()];
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    const bounds = getDateBounds();
    return notifications.filter((n) => {
      if (filter === "urgent"     && n.label !== "urgent") return false;
      if (filter === "non-urgent" && n.label === "urgent") return false;
      if (statusFilter !== "all"  && n.status !== statusFilter) return false;
      if (issueFilter  !== "all"  && (n.type||"").toLowerCase() !== issueFilter.toLowerCase()) return false;
      const term = searchTerm.toLowerCase();
      if (term && !n.name?.toLowerCase().includes(term) && !n.type?.toLowerCase().includes(term) &&
          !n.message?.toLowerCase().includes(term) && !n.incidentPurok?.toLowerCase().includes(term)) return false;
      if (!dateError && bounds) {
        if (n._rawTimestamp < bounds.start || n._rawTimestamp > bounds.end) return false;
      }
      return true;
    });
  }, [notifications, filter, statusFilter, issueFilter, searchTerm, startDate, endDate, dateError]);

  const stats = useMemo(() => ({
    total:         filteredNotifications.length,
    pending:       filteredNotifications.filter((n) => n.status === "pending").length,
    "in-progress": filteredNotifications.filter((n) => ["in-progress","in progress"].includes(n.status)).length,
    resolved:      filteredNotifications.filter((n) => n.status === "resolved").length,
  }), [filteredNotifications]);

  // ── Display helpers ───────────────────────────────────────────────────────
  const getUrgencyDisplay = (label) =>
    label === "urgent"
      ? { icon: <FiAlertTriangle className="text-red-600" />,  text: "Urgent",     pill: "bg-red-100 text-red-800 ring-1 ring-red-200"   }
      : { icon: <FiClock         className="text-blue-600" />, text: "Non-Urgent", pill: "bg-blue-100 text-blue-800 ring-1 ring-blue-200" };

  const getIssueColor = (type) => ({
    medical:"bg-red-100 text-red-800 ring-1 ring-red-200",
    fire:"bg-orange-100 text-orange-800 ring-1 ring-orange-200",
    noise:"bg-purple-100 text-purple-800 ring-1 ring-purple-200",
    waste:"bg-green-100 text-green-800 ring-1 ring-green-200",
    infrastructure:"bg-gray-100 text-gray-800 ring-1 ring-gray-200",
  })[(type||"").toLowerCase()] || "bg-gray-100 text-gray-800 ring-1 ring-gray-200";

  const getStatusDisplay = (status) => ({
    pending:      { pill:"bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200", text:"Pending"     },
    "in-progress":{ pill:"bg-blue-100 text-blue-900 ring-1 ring-blue-200",       text:"In Progress" },
    "in progress":{ pill:"bg-blue-100 text-blue-900 ring-1 ring-blue-200",       text:"In Progress" },
    resolved:     { pill:"bg-green-100 text-green-900 ring-1 ring-green-200",    text:"Resolved"    },
  })[(status||"").toLowerCase()] || { pill:"bg-yellow-100 text-yellow-900 ring-1 ring-yellow-200", text:"Pending" };

  // ── Assign tanod ──────────────────────────────────────────────────────────
  const openAssignModal = (complaint) => {
    setAssignTarget(complaint);
    setSelectedTanod(complaint.assignedTanodUid || "");
    setShowAssignModal(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // confirmAssignAndApprove
  // 1. Updates userComplaints doc (existing)
  // 2. Writes assignedComplaints[] to tanod's users doc  ← NEW
  //    Firestore path: users/{tanodUid}
  //    Field written: assignedComplaints (array of objects)
  //    Each object has: complaintKey, description, complainantName,
  //      complainantUserId, type, incidentPurok, incidentLocation,
  //      urgency, status, assignedAt
  // 3. If reassigned from another tanod, removes entry from old tanod's doc
  // ─────────────────────────────────────────────────────────────────────────
  const confirmAssignAndApprove = async () => {
    if (!selectedTanod) return alert("Please select a tanod first.");
    if (!assignTarget)  return;
    setAssigning(true);
    try {
      const tanod     = tanods.find((t) => t.uid === selectedTanod);
      const tanodName = tanod?.fullName || "";

      // Step 1 — update complaint doc
      await updateDoc(
        doc(firestore, "users", assignTarget.userId, "userComplaints", assignTarget.complaintKey),
        {
          assignedTanodUid:  selectedTanod,
          assignedTanodName: tanodName,
          status:            "in-progress",
        }
      );

      // Step 2 — build the entry object that will be visible in Firestore
      //           under users/{tanodUid}.assignedComplaints[]
      const newEntry = {
        complaintKey:       assignTarget.complaintKey,
        description:        assignTarget.message,        // complaint description text
        complainantName:    assignTarget.name,
        complainantUserId:  assignTarget.userId,
        type:               assignTarget.type,
        incidentPurok:      assignTarget.incidentPurok,
        incidentLocation:   assignTarget.incidentLocation,
        urgency:            assignTarget.label,
        status:             "in-progress",
        assignedAt:         new Date().toISOString(),
      };

      // Fetch the new tanod's current assignedComplaints, replace or append
      const newTanodRef  = doc(firestore, "users", selectedTanod);
      const newTanodSnap = await getDoc(newTanodRef);
      const existingList = newTanodSnap.exists()
        ? (newTanodSnap.data().assignedComplaints || [])
        : [];

      // If this complaint was already in the list (reassign), replace it; else append
      const alreadyExists = existingList.some((e) => e.complaintKey === assignTarget.complaintKey);
      const updatedList = alreadyExists
        ? existingList.map((e) => e.complaintKey === assignTarget.complaintKey ? newEntry : e)
        : [...existingList, newEntry];

      await updateDoc(newTanodRef, { assignedComplaints: updatedList });

      // Step 3 — if reassigned away from a DIFFERENT previous tanod, clean that doc
      if (
        assignTarget.assignedTanodUid &&
        assignTarget.assignedTanodUid !== selectedTanod
      ) {
        const oldTanodRef  = doc(firestore, "users", assignTarget.assignedTanodUid);
        const oldTanodSnap = await getDoc(oldTanodRef);
        if (oldTanodSnap.exists()) {
          const oldList    = oldTanodSnap.data().assignedComplaints || [];
          const cleanedList = oldList.filter(
            (e) => e.complaintKey !== assignTarget.complaintKey
          );
          await updateDoc(oldTanodRef, { assignedComplaints: cleanedList });
        }
      }

      // Step 4 — update local React state
      const patch = (c) =>
        c.complaintKey === assignTarget.complaintKey
          ? { ...c, assignedTanodUid: selectedTanod, assignedTanodName: tanodName, status: "in-progress" }
          : c;
      setNotifications((prev) => prev.map(patch));
      setSelectedComplaint((prev) => prev ? patch(prev) : prev);
      setShowAssignModal(false);
      setAssignTarget(null);
      setSelectedTanod("");
    } catch (err) {
      console.error(err);
      alert("Failed to assign tanod.");
    } finally {
      setAssigning(false);
    }
  };

  // ── Open resolve-feedback modal ───────────────────────────────────────────
  const openResolveFeedback = (complaint) => {
    setResolvingComplaint(complaint);
    setTanodRating(0); setTanodComment("");
    setSystemRating(0); setSystemComment("");
    setShowResolveFeedback(true);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // submitResolveFeedback
  // After saving complaintFeedback and updating userComplaints status,
  // also updates the matching entry inside users/{tanodUid}.assignedComplaints[]
  // to status: "resolved" so it's reflected directly on the tanod's doc.
  // ─────────────────────────────────────────────────────────────────────────
  const submitResolveFeedback = async () => {
    if (!resolvingComplaint) return;
    if (tanodRating === 0)   return alert("Please rate the tanod.");
    if (systemRating === 0)  return alert("Please rate the system.");
    setSubmittingResolve(true);
    try {
      const fbRef = await addDoc(collection(firestore, "complaintFeedback"), {
        employeeId:      resolvingComplaint.assignedTanodUid  || null,
        employeeName:    resolvingComplaint.assignedTanodName || "",
        complaintKey:    resolvingComplaint.complaintKey,
        complainantName: resolvingComplaint.name,
        complaintType:   resolvingComplaint.type,
        rating:          tanodRating,
        tanodRating,
        tanodComment:    tanodComment.trim(),
        systemRating,
        systemComment:   systemComment.trim(),
        citizen:         resolvingComplaint.name,
        resolvedAt:      serverTimestamp(),
        timestamp:       serverTimestamp(),
      });

      // Update complaint doc
      await updateDoc(
        doc(firestore, "users", resolvingComplaint.userId, "userComplaints", resolvingComplaint.complaintKey),
        { status: "resolved", feedbackDocId: fbRef.id }
      );

      // Update assignedComplaints entry inside tanod's user doc
      if (resolvingComplaint.assignedTanodUid) {
        const tanodRef  = doc(firestore, "users", resolvingComplaint.assignedTanodUid);
        const tanodSnap = await getDoc(tanodRef);
        if (tanodSnap.exists()) {
          const list    = tanodSnap.data().assignedComplaints || [];
          const updated = list.map((entry) =>
            entry.complaintKey === resolvingComplaint.complaintKey
              ? { ...entry, status: "resolved", resolvedAt: new Date().toISOString() }
              : entry
          );
          await updateDoc(tanodRef, { assignedComplaints: updated });
        }
      }

      const patch = (c) =>
        c.complaintKey === resolvingComplaint.complaintKey
          ? { ...c, status: "resolved", feedbackDocId: fbRef.id }
          : c;
      setNotifications((prev) => prev.map(patch));
      setSelectedComplaint((prev) => prev ? patch(prev) : prev);
      setShowResolveFeedback(false);
      setResolvingComplaint(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save feedback.");
    } finally {
      setSubmittingResolve(false);
    }
  };

  // ── View already-submitted feedback ──────────────────────────────────────
  const handleViewFeedback = async (complaint) => {
    const key = complaint.feedbackDocId || complaint.complaintKey;
    if (!key) return;
    try {
      const fbDoc = await getDoc(doc(firestore, "complaintFeedback", key));
      setViewFeedbackData(fbDoc.exists() ? fbDoc.data() : null);
    } catch { setViewFeedbackData(null); }
    saveSeenKey(key); seenKeys.add(key);
    setFeedbackAvailable((prev) => { const u = { ...prev }; delete u[key]; return u; });
    setShowViewFeedbackModal(true);
  };

  // ── Action button ─────────────────────────────────────────────────────────
  const handleActionClick = (complaint) => {
    if (complaint.status === "pending") openAssignModal(complaint);
    else if (["in-progress","in progress"].includes(complaint.status)) openResolveFeedback(complaint);
  };
  const actionLabel = (s) =>
    s === "pending"                             ? "Assign Tanod & Approve →"
    : ["in-progress","in progress"].includes(s) ? "Mark as Resolved"
    : "Resolved ✓";
  const actionBg = (s) =>
    s === "pending"                             ? "bg-blue-600 hover:bg-blue-700"
    : ["in-progress","in progress"].includes(s) ? "bg-green-600 hover:bg-green-700"
    : "bg-gray-400 cursor-not-allowed";

  const getTanodActiveCount = (tanodUid) =>
    notifications.filter(
      (c) => c.assignedTanodUid === tanodUid &&
             ["in-progress","in progress"].includes(c.status)
    ).length;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      <div className="fixed inset-0 pointer-events-none z-0"
        style={{ backgroundImage:'url("/src/assets/sanroquelogo.png")', backgroundPosition:"right 35% center",
          backgroundRepeat:"no-repeat", backgroundSize:"49%", opacity:0.15 }} aria-hidden="true" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total"       value={stats.total}          tone="indigo" />
          <StatCard label="Pending"     value={stats.pending}        tone="yellow" />
          <StatCard label="In Progress" value={stats["in-progress"]} tone="blue"   />
          <StatCard label="Resolved"    value={stats.resolved}       tone="green"  />
        </div>

        {/* Filters */}
        <div className="bg-white/85 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60">
          <div className="p-5 space-y-4">
            <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-end justify-between">
              <div className="w-full xl:w-[380px]">
                <label className="text-xs font-bold text-gray-700 block mb-1.5">Search</label>
                <div className="relative">
                  <FiSearch className="absolute left-4 top-1/2 text-gray-400 -translate-y-1/2" size={18} />
                  <input type="text" placeholder="Search complaints..."
                    className="w-full pl-11 pr-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200"
                    value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                {[["From", startDate, setStartDate], ["To", endDate, setEndDate]].map(([lbl, val, setter]) => (
                  <div key={lbl} className="flex flex-col w-full sm:w-[200px]">
                    <label className="text-xs font-bold text-gray-700 mb-1.5">{lbl} <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input type="date" value={val} onChange={(e) => setter(e.target.value)}
                      className="px-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200" />
                  </div>
                ))}
                {(startDate || endDate) && (
                  <div className="flex flex-col justify-end">
                    <button onClick={() => { setStartDate(""); setEndDate(""); }}
                      className="px-4 py-3 text-sm font-bold text-gray-500 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 transition">Clear dates</button>
                  </div>
                )}
              </div>

              <div className="flex flex-col w-full sm:w-[220px]">
                <label className="text-xs font-bold text-gray-700 mb-1.5">Issue Type</label>
                <select value={issueFilter} onChange={(e) => setIssueFilter(e.target.value)}
                  className="px-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-4 focus:ring-indigo-200">
                  <option value="all">All Types</option>
                  {issueTypes.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              <div className="flex gap-2 w-full xl:w-auto">
                {["all","urgent","non-urgent"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-3 rounded-xl text-sm font-bold transition-all border ${
                      filter === f ? "bg-indigo-600 text-white border-indigo-600 shadow-lg" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1).replace("-"," ")}
                  </button>
                ))}
              </div>
            </div>

            {dateError && <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm font-bold">{dateError}</div>}

            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-bold text-gray-700">Status:</span>
              {["all","pending","in-progress","resolved"].map((s) => {
                const active = statusFilter === s;
                const style = s==="pending"?"bg-yellow-600 text-white":s==="in-progress"?"bg-blue-600 text-white":s==="resolved"?"bg-green-600 text-white":"bg-gray-900 text-white";
                return (
                  <button key={s} onClick={() => setStatusFilter(s)}
                    className={`px-4 py-2.5 rounded-xl transition-all text-sm font-bold border ${active ? `${style} border-transparent shadow-lg` : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}>
                    {s==="all"?"All Status":s.split("-").map((w)=>w[0].toUpperCase()+w.slice(1)).join(" ")}
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
              <table className="w-full min-w-[1080px] text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-b border-gray-200">
                    {["Urgency","Purok","Complainant","Issue Type","Description","Assigned Tanod","Date","Status"].map((h) => (
                      <th key={h} className="px-5 py-4 text-xs font-extrabold tracking-wider text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredNotifications.map((n, idx) => {
                    const urgency = getUrgencyDisplay(n.label);
                    const status  = getStatusDisplay(n.status);
                    return (
                      <tr key={n.complaintKey}
                        className={`${idx%2===0?"bg-white":"bg-slate-50/70"} border-b border-gray-100 hover:bg-indigo-50/60 transition cursor-pointer`}
                        onClick={() => setSelectedComplaint(n)}>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${urgency.pill}`}>{urgency.icon}{urgency.text}</span>
                        </td>
                        <td className="px-5 py-4 text-sm font-bold text-gray-900">Purok {n.incidentPurok}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            {n.name}
                            {n.status==="resolved" && feedbackAvailable[n.feedbackDocId||n.complaintKey] && (
                              <span className="relative flex items-center justify-center">
                                <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${getIssueColor(n.type)}`}>{n.type}</span>
                        </td>
                        <td className="px-5 py-4 max-w-[280px]">
                          <p className="text-sm font-semibold text-gray-700 line-clamp-1">{n.message}</p>
                        </td>
                        <td className="px-5 py-4">
                          {n.assignedTanodName
                            ? <div className="flex items-center gap-1.5"><FiShield className="text-indigo-500 shrink-0" size={14} /><span className="text-xs font-bold text-indigo-700">{n.assignedTanodName}</span></div>
                            : <span className="text-xs text-gray-400 font-semibold italic">Unassigned</span>}
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-gray-800">{n.timestamp}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex px-3 py-1.5 rounded-full text-xs font-bold ${status.pill}`}>{status.text}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredNotifications.length === 0 && (
                    <tr><td colSpan={8} className="text-center py-10 text-gray-500 text-sm font-bold">No complaints found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Detail Modal ─────────────────────────────────────────────────── */}
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
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                  <div className={`rounded-xl px-4 py-3 ${getStatusDisplay(selectedComplaint.status).pill}`}>
                    <div className="flex items-center gap-2 text-sm font-bold"><FiCheckCircle size={18} />Status: {getStatusDisplay(selectedComplaint.status).text}</div>
                  </div>
                  <div className={`rounded-xl px-4 py-3 ${getUrgencyDisplay(selectedComplaint.label).pill}`}>
                    <div className="flex items-center gap-2 text-sm font-bold">{getUrgencyDisplay(selectedComplaint.label).icon}{getUrgencyDisplay(selectedComplaint.label).text}</div>
                  </div>
                  {selectedComplaint.assignedTanodName && (
                    <div className="rounded-xl px-4 py-3 bg-indigo-50 ring-1 ring-indigo-200">
                      <div className="flex items-center gap-2 text-sm font-bold text-indigo-800"><FiShield size={18} />Tanod: {selectedComplaint.assignedTanodName}</div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={<FiUser size={18} />}     title="Complainant"       value={selectedComplaint.name}                     tone="indigo" />
                  <InfoRow icon={<FiMapPin size={18} />}   title="Purok"             value={`Purok ${selectedComplaint.incidentPurok}`} tone="green"  />
                  <InfoRow icon={<FiHome size={18} />}     title="Incident Location" value={selectedComplaint.incidentLocation}          tone="amber"  />
                  <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700"><FiFileText size={18} /></div>
                      <div className="flex-1">
                        <p className="text-xs font-extrabold text-gray-600 uppercase tracking-wider">Issue Type</p>
                        <span className={`inline-flex mt-2 px-3 py-1.5 rounded-full text-sm font-bold ${getIssueColor(selectedComplaint.type)}`}>{selectedComplaint.type}</span>
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
                  <button className="inline-flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition"
                    onClick={() => handleViewFeedback(selectedComplaint)}>
                    <FiStar size={16} /> View Submitted Feedback
                  </button>
                )}
              </div>
              <div className="border-t p-5 bg-white">
                <button disabled={selectedComplaint.status === "resolved"}
                  className={`w-full py-3.5 rounded-xl text-white text-base font-extrabold transition shadow-lg ${actionBg(selectedComplaint.status)}`}
                  onClick={() => handleActionClick(selectedComplaint)}>
                  {actionLabel(selectedComplaint.status)}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Assign Tanod Modal ───────────────────────────────────────────── */}
        {showAssignModal && (
          <div className="fixed inset-0 z-[60] p-4 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowAssignModal(false)}>
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-white/20 p-2.5 rounded-xl"><FiShield size={20} /></div>
                  <div>
                    <h3 className="text-lg font-extrabold">Assign Tanod</h3>
                    <p className="text-indigo-100 text-xs font-semibold mt-0.5">Select a tanod before approving</p>
                  </div>
                </div>
                <button className="text-white/80 hover:text-white hover:bg-white/15 rounded-full p-2 transition"
                  onClick={() => setShowAssignModal(false)}><FiX size={20} /></button>
              </div>
              <div className="p-6 space-y-4">
                <div className="rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3">
                  <p className="text-xs font-extrabold text-indigo-700 uppercase tracking-wider">Complaint</p>
                  <p className="text-sm font-bold text-gray-800 mt-1 line-clamp-2">{assignTarget?.message || "—"}</p>
                  <p className="text-xs text-gray-500 font-semibold mt-0.5">by {assignTarget?.name} · Purok {assignTarget?.incidentPurok}</p>
                </div>
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">
                    Select Tanod / Employee
                  </label>
                  {tanods.length === 0
                    ? <p className="text-sm text-gray-500 font-semibold">No tanods found.</p>
                    : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {tanods.map((t) => {
                          const activeCount = getTanodActiveCount(t.uid);
                          return (
                            <label key={t.uid}
                              className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedTanod===t.uid ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-300" : "border-gray-200 bg-white hover:bg-gray-50"}`}>
                              <input type="radio" name="tanod" value={t.uid} checked={selectedTanod===t.uid}
                                onChange={() => setSelectedTanod(t.uid)} className="accent-indigo-600" />
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                                  <FiUser size={15} />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-extrabold text-gray-900 truncate">{t.fullName}</p>
                                  <p className="text-xs text-gray-500 font-semibold truncate capitalize">
                                    {t.employeeRole || t.position || "Employee"}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${
                                    activeCount === 0 ? "bg-green-100 text-green-700"
                                    : activeCount <= 2 ? "bg-yellow-100 text-yellow-700"
                                    : "bg-red-100 text-red-700"}`}>
                                    {activeCount} active
                                  </span>
                                  <button type="button"
                                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); setWorkloadTanod(t); setShowWorkloadModal(true); }}
                                    className="p-1.5 rounded-lg text-indigo-500 hover:bg-indigo-100 transition"
                                    title="View assignments">
                                    <FiEye size={14} />
                                  </button>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}
                </div>
              </div>
              <div className="border-t px-6 py-4 bg-slate-50 flex gap-3">
                <button onClick={() => setShowAssignModal(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 transition">Cancel</button>
                <button onClick={confirmAssignAndApprove} disabled={!selectedTanod || assigning}
                  className={`flex-1 py-3 rounded-xl text-white font-extrabold text-sm transition shadow-md ${!selectedTanod||assigning ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"}`}>
                  {assigning ? "Assigning…" : "Confirm & Approve →"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Tanod Workload Modal ─────────────────────────────────────────── */}
        {showWorkloadModal && (
          <TanodWorkloadModal
            tanod={workloadTanod}
            allComplaints={notifications}
            onClose={() => { setShowWorkloadModal(false); setWorkloadTanod(null); }}
          />
        )}

        {/* ── Resolve Feedback Modal ───────────────────────────────────────── */}
        {showResolveFeedback && resolvingComplaint && (
          <div className="fixed inset-0 z-[60] p-4 bg-black/50 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setShowResolveFeedback(false)}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
              onClick={(e) => e.stopPropagation()}>
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3 text-white">
                  <div className="bg-white/20 p-2.5 rounded-xl"><FiMessageSquare size={20} /></div>
                  <div>
                    <h3 className="text-lg font-extrabold">Submit Feedback</h3>
                    <p className="text-green-100 text-xs font-semibold mt-0.5">Rate before marking as resolved</p>
                  </div>
                </div>
                <button className="text-white/80 hover:text-white hover:bg-white/15 rounded-full p-2 transition"
                  onClick={() => setShowResolveFeedback(false)}><FiX size={20} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                <div className="rounded-xl border border-gray-200 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-extrabold text-gray-500 uppercase tracking-wider">Complaint</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5 line-clamp-2">{resolvingComplaint.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">by {resolvingComplaint.name} · {resolvingComplaint.type} · Purok {resolvingComplaint.incidentPurok}</p>
                </div>
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-600 text-white p-2.5 rounded-xl"><FiShield size={17} /></div>
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">Rate the Tanod</p>
                      {resolvingComplaint.assignedTanodName && (
                        <p className="text-xs text-indigo-700 font-bold">{resolvingComplaint.assignedTanodName}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">Star Rating <span className="text-red-500">*</span></label>
                    <StarPicker value={tanodRating} onChange={setTanodRating} />
                    {tanodRating > 0 && <p className="text-xs font-bold text-indigo-600 mt-1.5">{ratingLabel(tanodRating)}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea rows={3} placeholder="How did the tanod perform?"
                      value={tanodComment} onChange={(e) => setTanodComment(e.target.value)}
                      className="w-full px-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white resize-none focus:outline-none focus:ring-4 focus:ring-indigo-200" />
                  </div>
                </div>
                <div className="rounded-2xl border border-purple-100 bg-purple-50/60 p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-600 text-white p-2.5 rounded-xl"><FiCheckCircle size={17} /></div>
                    <div>
                      <p className="text-sm font-extrabold text-gray-900">Rate the System</p>
                      <p className="text-xs text-purple-700 font-bold">Talk2Kap Barangay App</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">Star Rating <span className="text-red-500">*</span></label>
                    <StarPicker value={systemRating} onChange={setSystemRating} />
                    {systemRating > 0 && <p className="text-xs font-bold text-purple-600 mt-1.5">{ratingLabel(systemRating)}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-2">Comment <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea rows={3} placeholder="Any suggestions for improvement?"
                      value={systemComment} onChange={(e) => setSystemComment(e.target.value)}
                      className="w-full px-4 py-3 text-sm font-semibold border border-gray-200 rounded-xl bg-white resize-none focus:outline-none focus:ring-4 focus:ring-purple-200" />
                  </div>
                </div>
              </div>
              <div className="border-t px-6 py-4 bg-white flex gap-3 shrink-0">
                <button onClick={() => setShowResolveFeedback(false)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-100 transition">Cancel</button>
                <button onClick={submitResolveFeedback}
                  disabled={submittingResolve || tanodRating===0 || systemRating===0}
                  className={`flex-1 py-3 rounded-xl text-white font-extrabold text-sm transition shadow-md ${
                    submittingResolve||tanodRating===0||systemRating===0 ? "bg-gray-300 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"}`}>
                  {submittingResolve ? "Saving…" : "Submit & Mark Resolved ✓"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── View Feedback Modal ───────────────────────────────────────────── */}
        {showViewFeedbackModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-[70] backdrop-blur-sm p-4"
            onClick={() => setShowViewFeedbackModal(false)}>
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-5 border-b flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white">
                <div className="flex items-center gap-3">
                  <span className="bg-indigo-600 text-white rounded-xl p-2.5"><FiStar size={20} /></span>
                  <h3 className="text-xl font-extrabold text-indigo-700">Submitted Feedback</h3>
                </div>
                <button className="text-gray-500 hover:text-indigo-700 p-2 rounded-full hover:bg-indigo-50"
                  onClick={() => setShowViewFeedbackModal(false)}><FiX size={22} /></button>
              </div>
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                {viewFeedbackData ? (
                  <>
                    <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-indigo-600 text-white p-2 rounded-xl"><FiShield size={15} /></div>
                        <div>
                          <p className="text-sm font-extrabold text-gray-900">Tanod Rating</p>
                          {viewFeedbackData.employeeName && <p className="text-xs text-indigo-700 font-semibold">{viewFeedbackData.employeeName}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((n) => (
                            <FiStar key={n} size={22} className={n<=(viewFeedbackData.tanodRating||viewFeedbackData.rating||0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                          ))}
                        </div>
                        <span className="text-sm font-extrabold text-gray-800">
                          {viewFeedbackData.tanodRating||viewFeedbackData.rating||0}/5{" "}
                          <span className="text-indigo-600">— {ratingLabel(viewFeedbackData.tanodRating||viewFeedbackData.rating)}</span>
                        </span>
                      </div>
                      {viewFeedbackData.tanodComment && (
                        <div className="bg-white rounded-xl border border-indigo-100 p-3">
                          <p className="text-sm text-gray-700 leading-relaxed">{viewFeedbackData.tanodComment}</p>
                        </div>
                      )}
                    </div>
                    <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-5 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-600 text-white p-2 rounded-xl"><FiCheckCircle size={15} /></div>
                        <div>
                          <p className="text-sm font-extrabold text-gray-900">System Rating</p>
                          <p className="text-xs text-purple-700 font-semibold">Talk2Kap Barangay App</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((n) => (
                            <FiStar key={n} size={22} className={n<=(viewFeedbackData.systemRating||0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} />
                          ))}
                        </div>
                        <span className="text-sm font-extrabold text-gray-800">
                          {viewFeedbackData.systemRating||0}/5{" "}
                          <span className="text-purple-600">— {ratingLabel(viewFeedbackData.systemRating)}</span>
                        </span>
                      </div>
                      {viewFeedbackData.systemComment && (
                        <div className="bg-white rounded-xl border border-purple-100 p-3">
                          <p className="text-sm text-gray-700 leading-relaxed">{viewFeedbackData.systemComment}</p>
                        </div>
                      )}
                    </div>
                    {viewFeedbackData.resolvedAt && (
                      <p className="text-xs text-gray-400 font-semibold text-center">
                        Submitted on{" "}
                        {viewFeedbackData.resolvedAt?.toDate
                          ? viewFeedbackData.resolvedAt.toDate().toLocaleString() : "—"}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 text-sm font-semibold text-center py-8">No feedback data found.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Image Preview ─────────────────────────────────────────────────── */}
        {previewImage && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-[80] p-4"
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

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const StatCard = ({ label, value, tone }) => {
  const t = {
    indigo:{ ring:"ring-indigo-200", bg:"from-indigo-50 to-white", dot:"bg-indigo-600", text:"text-indigo-700" },
    yellow:{ ring:"ring-yellow-200", bg:"from-yellow-50 to-white", dot:"bg-yellow-600", text:"text-yellow-700" },
    blue:  { ring:"ring-blue-200",   bg:"from-blue-50 to-white",   dot:"bg-blue-600",   text:"text-blue-700"   },
    green: { ring:"ring-green-200",  bg:"from-green-50 to-white",  dot:"bg-green-600",  text:"text-green-700"  },
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
  const chip = { indigo:"bg-indigo-100 text-indigo-700", green:"bg-green-100 text-green-700", amber:"bg-amber-100 text-amber-700", orange:"bg-orange-100 text-orange-700" }[tone] || "bg-indigo-100 text-indigo-700";
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