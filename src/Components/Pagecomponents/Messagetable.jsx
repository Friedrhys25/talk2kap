// MessageTable.jsx - Updated to use Firestore
import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  FiMail, FiX, FiSearch, FiSend, FiMapPin,
  FiFileText, FiMessageSquare, FiBell, FiCheck,
} from "react-icons/fi";
import {
  getFirestore,
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import app from "../../firebaseConfig";

const firestore = getFirestore(app);

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatTimestamp = (ts) => {
  if (!ts) return "";
  if (ts?.toDate) return ts.toDate().toLocaleString();
  if (typeof ts === "string") return ts;
  if (typeof ts === "number") return new Date(ts).toLocaleString();
  return "";
};

const getIssueColor = (type) => {
  const colors = {
    medical:        "bg-red-100 text-red-800 border-red-200",
    fire:           "bg-orange-100 text-orange-800 border-orange-200",
    noise:          "bg-purple-100 text-purple-800 border-purple-200",
    waste:          "bg-green-100 text-green-800 border-green-200",
    infrastructure: "bg-gray-100 text-gray-800 border-gray-200",
  };
  return colors[(type || "").toLowerCase()] || "bg-gray-100 text-gray-800 border-gray-200";
};

const getStatusDisplay = (status) => ({
  unread: { color: "bg-yellow-100 text-yellow-800 border-yellow-200", text: "Unread" },
  read:   { color: "bg-emerald-100 text-emerald-800 border-emerald-200", text: "Read"   },
}[status] || { color: "bg-yellow-100 text-yellow-800 border-yellow-200", text: "Unread" });

// ── Main Component ────────────────────────────────────────────────────────────
const MessageTable = () => {
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef(null);

  // ── Firestore listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const usersRef = collection(firestore, "users");
    const innerUnsubs = [];

    // convoMap: complaintId -> conversation object
    const convoMap = {};

    const rebuild = () => {
      const convos = Object.values(convoMap);
      convos.sort((a, b) => {
        if (a.status !== b.status) return a.status === "unread" ? -1 : 1;
        if (a.hasMessages !== b.hasMessages) return b.hasMessages - a.hasMessages;
        return a.complainant.localeCompare(b.complainant);
      });
      setConversations([...convos]);
    };

    const unsubUsers = onSnapshot(usersRef, (usersSnapshot) => {
      usersSnapshot.forEach((userDoc) => {
        const userId   = userDoc.id;
        const userData = userDoc.data();
        const fullName = [userData.firstName, userData.middleName, userData.lastName]
          .filter(Boolean).join(" ").trim() || "Anonymous";

        const complaintsRef = collection(firestore, "users", userId, "userComplaints");

        const unsubComplaints = onSnapshot(complaintsRef, (complaintsSnap) => {
          complaintsSnap.forEach((cDoc) => {
            const complaint    = cDoc.data();
            const complaintId  = cDoc.id;
            const chatRef      = collection(firestore, "users", userId, "userComplaints", complaintId, "chat");

            const unsubChat = onSnapshot(chatRef, (chatSnap) => {
              const messages = [];
              chatSnap.forEach((msgDoc) => {
                messages.push({ id: msgDoc.id, ...msgDoc.data() });
              });

              // Sort messages by timestamp ascending
              messages.sort((a, b) => {
                const ta = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
                const tb = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
                return ta - tb;
              });

              const lastMsg      = messages.length > 0 ? messages[messages.length - 1] : null;
              const unreadCount  = messages.filter((m) => m.senderId !== "admin" && m.read === false).length;

              convoMap[complaintId] = {
                id:           complaintId,
                userId,
                complaintId,
                complainant:  fullName,
                purok:        complaint.incidentPurok || complaint.purok || userData.purok || "—",
                issueType:    complaint.type    || "—",
                description:  complaint.message || "—",
                messages,
                status:       unreadCount > 0 ? "unread" : "read",
                lastMessage:  lastMsg ? formatTimestamp(lastMsg.timestamp) ? `${lastMsg.message}` : lastMsg.message : "No messages yet",
                hasMessages:  messages.length > 0,
                unreadCount,
              };

              rebuild();

              // Keep selectedConversation in sync
              setSelectedConversation((prev) => {
                if (!prev || prev.complaintId !== complaintId) return prev;
                return { ...convoMap[complaintId] };
              });
            });

            innerUnsubs.push(unsubChat);
          });
        });

        innerUnsubs.push(unsubComplaints);
      });
    });

    return () => {
      unsubUsers();
      innerUnsubs.forEach((u) => u());
    };
  }, []);

  // ── Stats ───────────────────────────────────────────────────────────────────
  const stats = useMemo(() => ({
    total:  conversations.length,
    unread: conversations.filter((c) => c.status === "unread").length,
    read:   conversations.filter((c) => c.status === "read").length,
  }), [conversations]);

  // ── Filtered list ───────────────────────────────────────────────────────────
  const filteredConversations = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return conversations.filter((c) => {
      const matchesFilter = filter === "all" || c.status === filter;
      const matchesSearch =
        c.complainant.toLowerCase().includes(term) ||
        String(c.purok).toLowerCase().includes(term) ||
        String(c.issueType).toLowerCase().includes(term) ||
        String(c.description).toLowerCase().includes(term) ||
        String(c.lastMessage).toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });
  }, [conversations, filter, searchTerm]);

  // ── Open conversation + mark messages read ──────────────────────────────────
  const openConversation = async (conversation) => {
    setSelectedConversation(conversation);
    const { userId, complaintId, messages } = conversation;

    try {
      const unread = messages.filter((m) => m.senderId !== "admin" && m.read === false);
      for (const msg of unread) {
        await updateDoc(
          doc(firestore, "users", userId, "userComplaints", complaintId, "chat", msg.id),
          { read: true }
        );
      }
    } catch (err) {
      console.error("Error marking messages as read:", err);
    }
  };

  // ── Send reply ──────────────────────────────────────────────────────────────
  const handleSendReply = async () => {
    if (!reply.trim() || !selectedConversation) return;
    const { userId, complaintId } = selectedConversation;

    try {
      await addDoc(
        collection(firestore, "users", userId, "userComplaints", complaintId, "chat"),
        {
          senderId:  "admin",
          message:   reply.trim(),
          timestamp: serverTimestamp(),
          read:      false,
        }
      );
      setReply("");
    } catch (err) {
      console.error("Error sending reply:", err);
    }
  };

  // ── Auto-scroll ─────────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConversation?.messages?.length]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
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

        {/* Search */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div />
          <div className="relative w-full lg:w-[420px]">
            <FiSearch className="absolute left-3 top-1/2 text-gray-400 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search complainant, purok, issue, message..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white/80 backdrop-blur shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Stats + Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {Object.entries(stats).map(([key, value]) => (
              <div key={key} className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg">
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl" />
                <div className="relative p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600">{key}</p>
                  <p className={`mt-1 text-3xl font-extrabold tracking-tight ${
                    key === "unread" ? "text-yellow-700" : key === "read" ? "text-emerald-700" : "text-gray-900"
                  }`}>{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4">
            <div className="rounded-2xl border border-white/60 bg-white/75 backdrop-blur shadow-lg p-4">
              <p className="text-xs font-extrabold uppercase tracking-wider text-gray-600 mb-3">Filter</p>
              <div className="flex flex-wrap gap-2">
                {["all", "unread", "read"].map((f) => (
                  <button key={f} onClick={() => setFilter(f)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                      filter === f ? "bg-indigo-600 text-white shadow-md" : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    }`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left">
              <thead className="bg-white sticky top-0 z-10">
                <tr className="border-b border-gray-200">
                  {["Complainant", "Purok", "Issue Type", "Description", "Last Message", "Status"].map((h) => (
                    <th key={h} className="px-6 py-4 text-xs font-extrabold uppercase tracking-wider text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredConversations.map((c, idx) => {
                  const status = getStatusDisplay(c.status);
                  return (
                    <tr key={c.id}
                      className={`border-b border-gray-100 transition cursor-pointer ${idx % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/50`}
                      onClick={() => openConversation(c)}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{c.complainant}</span>
                          {c.unreadCount > 0 && (
                            <span className="relative flex items-center justify-center">
                              <span className="animate-ping absolute inline-flex h-5 w-5 rounded-full bg-red-400 opacity-70" />
                              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-xs font-extrabold items-center justify-center shadow">
                                {c.unreadCount}
                              </span>
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-800">Purok {c.purok}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border ${getIssueColor(c.issueType)}`}>
                          {c.issueType}
                        </span>
                      </td>
                      <td className="px-6 py-4 max-w-xs truncate" title={c.description}>
                        <span className="text-sm text-gray-700">{c.description}</span>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm text-gray-700" title={c.lastMessage}>{c.lastMessage}</span>
                          {c.status === "unread" && <FiBell className="text-red-500 animate-pulse shrink-0" size={16} />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold border ${status.color}`}>
                          {status.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredConversations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-500 font-semibold">No messages found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 text-xs text-gray-500 font-semibold border-t border-gray-100">
            Tip: Unread conversations are prioritized at the top.
          </div>
        </div>

        {/* Chat Modal */}
        {selectedConversation && (
          <div className="fixed inset-0 bg-black/35 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedConversation(null)}>
            <div className="bg-white rounded-[22px] w-full max-w-3xl max-h-[92vh] relative shadow-2xl flex flex-col overflow-hidden border border-white/60"
              onClick={(e) => e.stopPropagation()}>

              {/* Modal header */}
              <div className="relative p-6 text-white bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-700 shrink-0">
                <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-white/10 blur-3xl" />
                <button className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full p-2 transition-all"
                  onClick={() => setSelectedConversation(null)}><FiX size={22} /></button>
                <div className="relative">
                  <h2 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
                    <FiMail /> {selectedConversation.complainant}
                  </h2>
                  <p className="text-indigo-100 text-xs font-semibold mt-1">
                    Case ID: {selectedConversation.complaintId}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="p-5 bg-slate-50 border-b shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <InfoPill icon={<FiMapPin className="text-emerald-600" />} label="Purok"
                    value={`Purok ${selectedConversation.purok}`} tone="emerald" />
                  <InfoPill icon={<FiFileText className="text-purple-600" />} label="Issue"
                    value={selectedConversation.issueType} tone="purple"
                    badgeClass={getIssueColor(selectedConversation.issueType)} />
                  <InfoPill icon={<FiMessageSquare className="text-blue-600" />} label="Status"
                    value={getStatusDisplay(selectedConversation.status).text} tone="blue"
                    badgeClass={getStatusDisplay(selectedConversation.status).color} />
                </div>
                <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
                  <p className="text-xs text-gray-500 font-extrabold uppercase tracking-wider mb-2">Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{selectedConversation.description}</p>
                </div>
              </div>

              {/* Messages */}
              <div className="p-5 space-y-3 overflow-y-auto bg-white flex-1">
                {selectedConversation.messages.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    <FiMessageSquare size={42} className="mx-auto mb-2 opacity-25" />
                    <p className="font-semibold">No messages yet.</p>
                    <p className="text-sm">Send a reply to start the conversation.</p>
                  </div>
                ) : (
                  selectedConversation.messages.map((m) => {
                    const isAdmin = m.senderId === "admin";
                    return (
                      <div key={m.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm border ${
                          isAdmin ? "bg-indigo-600 text-white border-indigo-600" : "bg-slate-100 text-gray-900 border-slate-200"
                        }`}>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.message}</p>
                          <div className="mt-2 flex items-center justify-between gap-4">
                            <span className={`text-[11px] font-semibold ${isAdmin ? "text-indigo-100" : "text-gray-500"}`}>
                              {formatTimestamp(m.timestamp)}
                            </span>
                            {!isAdmin && (
                              <span className={`text-[11px] font-extrabold ${m.read ? "text-emerald-700" : "text-rose-700"}`}>
                                {m.read ? <span className="inline-flex items-center gap-1"><FiCheck /> Read</span> : "Sent"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Reply */}
              <div className="p-5 border-t bg-white shrink-0">
                <div className="flex gap-2">
                  <textarea rows={3} value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={`Reply to ${selectedConversation.complainant}...`}
                    className="flex-1 rounded-xl border border-gray-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <button onClick={handleSendReply}
                    className="bg-indigo-600 text-white px-5 rounded-xl flex items-center gap-2 hover:bg-indigo-700 transition font-extrabold shadow-md">
                    <FiSend /> Send
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-gray-500 font-semibold">
                  Press <span className="font-extrabold">Enter</span> to send •{" "}
                  <span className="font-extrabold">Shift + Enter</span> for new line
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageTable;

/* ── Helper component ────────────────────────────────────────────────────────*/
const InfoPill = ({ icon, label, value, tone = "blue", badgeClass }) => {
  const tones = {
    emerald: "bg-emerald-100", purple: "bg-purple-100",
    blue:    "bg-blue-100",    indigo: "bg-indigo-100",
  };
  return (
    <div className="flex items-start gap-3 bg-white rounded-xl border border-gray-200 p-4">
      <div className={`shrink-0 p-2 rounded-lg ${tones[tone] || tones.blue}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 font-extrabold uppercase tracking-wider">{label}</p>
        {badgeClass ? (
          <span className={`inline-flex mt-1 px-3 py-1 rounded-full text-xs font-extrabold border ${badgeClass}`}>{value}</span>
        ) : (
          <p className="mt-1 text-sm font-extrabold text-gray-900 truncate">{value}</p>
        )}
      </div>
    </div>
  );
};