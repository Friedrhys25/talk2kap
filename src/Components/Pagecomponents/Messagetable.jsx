import React, { useState, useEffect, useRef } from "react";
import {
  FiUser,
  FiCheck,
  FiX,
  FiSearch,
  FiMail,
  FiXCircle,
  FiSend,
  FiInbox,
} from "react-icons/fi";

const MessageTable = () => {
  const [filter, setFilter] = useState("all"); // all, read, unread
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState([
    {
      id: 1,
      participants: "Juan Dela Cruz",
      status: "unread",
      messages: [
        { from: "Juan", text: "Hello po, admin!", time: "08:30 AM" },
        { from: "Admin", text: "Hi Juan! Kumusta?", time: "08:32 AM" },
        { from: "Juan", text: "Okay lang po. May update ba sa barangay project?", time: "08:35 AM" },
        { from: "Admin", text: "Yes! May meeting tayo bukas 10 AM.", time: "08:40 AM" },
        { from: "Juan", text: "Salamat po sa info!", time: "08:42 AM" },
      ],
    },
    {
      id: 2,
      participants: "Maria Santos",
      status: "read",
      messages: [
        { from: "Maria", text: "Good evening admin!", time: "07:45 PM" },
        { from: "Admin", text: "Hello Maria! Kamusta?", time: "07:47 PM" },
        { from: "Maria", text: "Pwede po ba mag-volunteer bukas?", time: "07:50 PM" },
        { from: "Admin", text: "Sure, Maria. Salamat sa pag-volunteer!", time: "07:55 PM" },
      ],
    },
    {
      id: 3,
      participants: "Pedro Reyes",
      status: "unread",
      messages: [
        { from: "Pedro", text: "Hi admin, may reklamo ako sa drainage.", time: "09:15 AM" },
        { from: "Admin", text: "Okay, Pedro. Anong lugar po?", time: "09:17 AM" },
        { from: "Pedro", text: "Sa kanto ng Main St. at Rizal Ave.", time: "09:20 AM" },
      ],
    },
    {
      id: 4,
      participants: "Angela Mendoza",
      status: "read",
      messages: [
        { from: "Angela", text: "Admin, thank you for the update sa water supply.", time: "06:05 PM" },
        { from: "Admin", text: "Walang anuman, Angela!", time: "06:07 PM" },
        { from: "Angela", text: "Very helpful!", time: "06:08 PM" },
      ],
    },
    {
      id: 5,
      participants: "Roberto Cruz",
      status: "unread",
      messages: [
        { from: "Roberto", text: "Hello admin, may event po tayo sa plaza next week?", time: "11:30 AM" },
        { from: "Admin", text: "Yes, Roberto. Saturday 9 AM.", time: "11:32 AM" },
        { from: "Roberto", text: "Noted. Salamat!", time: "11:35 AM" },
      ],
    },
    {
      id: 6,
      participants: "Teresa Lopez",
      status: "read",
      messages: [
        { from: "Teresa", text: "Admin, pwede po bang mag-submit ng report online?", time: "03:20 PM" },
        { from: "Admin", text: "Yes, Teresa. I-upload lang sa portal.", time: "03:22 PM" },
        { from: "Teresa", text: "Okay, thank you!", time: "03:25 PM" },
      ],
    },
    {
      id: 7,
      participants: "Manuel Fernandez",
      status: "unread",
      messages: [
        { from: "Manuel", text: "Hi admin, kailangan namin ng ayuda sa kalsada.", time: "10:10 AM" },
        { from: "Admin", text: "Noted, Manuel. We will send a team.", time: "10:15 AM" },
        { from: "Manuel", text: "Salamat po!", time: "10:17 AM" },
      ],
    },
    {
      id: 8,
      participants: "Liza Dizon",
      status: "read",
      messages: [
        { from: "Liza", text: "Good morning admin, update po sa vaccination?", time: "08:00 AM" },
        { from: "Admin", text: "Yes, Liza. Schedule tomorrow 9 AM.", time: "08:05 AM" },
        { from: "Liza", text: "Got it, thanks!", time: "08:10 AM" },
      ],
    },
  ]);

  const [selectedConversation, setSelectedConversation] = useState(null);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef(null);

  // Filter + search
  const filteredConversations = conversations.filter((c) => {
    const matchesFilter = filter === "all" ? true : c.status === filter;
    const matchesSearch = c.participants
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Stats
  const stats = {
    total: conversations.length,
    unread: conversations.filter((c) => c.status === "unread").length,
    read: conversations.filter((c) => c.status === "read").length,
  };

  // Update status
  const updateStatus = (id, newStatus) => {
    setConversations(
      conversations.map((c) =>
        c.id === id ? { ...c, status: newStatus } : c
      )
    );
  };

  // Handle reply
  const handleSendReply = () => {
    if (!reply.trim() || !selectedConversation) return;

    const newMessage = {
      from: "Admin",
      text: reply,
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const updatedConvos = conversations.map((c) =>
      c.id === selectedConversation.id
        ? { ...c, messages: [...c.messages, newMessage], status: "read" }
        : c
    );
    setConversations(updatedConvos);

    const updatedCurrent = updatedConvos.find(
      (c) => c.id === selectedConversation.id
    );
    setSelectedConversation(updatedCurrent);

    setReply("");
  };

  // Open conversation and auto-mark as read
  const openConversation = (conversation) => {
    const updated = { ...conversation, status: "read" };
    setSelectedConversation(updated);
    updateStatus(conversation.id, "read");
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedConversation]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendReply();
    }
  };

  return (
    <div className="space-y-6 max-h-screen overflow-y-auto">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-shrink-0">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Conversations</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <FiInbox className="text-indigo-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Unread</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.unread}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <FiMail className="text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Read</p>
              <p className="text-2xl font-bold text-green-600">{stats.read}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheck className="text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "unread"
                  ? "bg-yellow-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Unread ({stats.unread})
            </button>
            <button
              onClick={() => setFilter("read")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "read"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Read ({stats.read})
            </button>
          </div>
        </div>
      </div>

      {/* Conversations Table - Scrollable */}
      <div className="bg-white rounded-lg shadow-sm border flex-1 min-h-0">
        <div className="h-96 overflow-y-auto">
          <table className="w-full">
            <thead className="bg-indigo-50 border-b sticky top-0 z-10">
              <tr>
                {["Participant", "Last Message", "Status", "Actions"].map(
                  (head) => (
                    <th
                      key={head}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider"
                    >
                      {head}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConversations.map((c) => {
                const lastMsg = c.messages[c.messages.length - 1];
                return (
                  <tr
                    key={c.id}
                    className="hover:bg-indigo-50 transition-colors cursor-pointer"
                    onClick={() => openConversation(c)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <FiUser className="text-gray-500" /> {c.participants}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={lastMsg.text}>
                        {lastMsg.text}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          c.status === "unread"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {c.status === "unread" ? "Unread" : "Read"}
                      </span>
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex gap-2">
                        {c.status === "unread" && (
                          <button
                            onClick={() => updateStatus(c.id, "read")}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Mark as Read"
                          >
                            <FiCheck />
                          </button>
                        )}
                        {c.status === "read" && (
                          <button
                            onClick={() => updateStatus(c.id, "unread")}
                            className="text-yellow-600 hover:text-yellow-800 transition-colors"
                            title="Mark as Unread"
                          >
                            <FiX />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filteredConversations.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500 text-lg">No conversations found</div>
            <p className="text-gray-400 mt-2">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Results Summary */}
      {filteredConversations.length > 0 && (
        <div className="text-sm text-gray-600 text-center flex-shrink-0">
          Showing {filteredConversations.length} of {conversations.length} conversations
        </div>
      )}

      {/* Modal for Conversation */}
      {selectedConversation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl h-[90vh] flex flex-col">
            <div className="p-6 border-b flex-shrink-0">
              <button
                onClick={() => setSelectedConversation(null)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiXCircle size={24} />
              </button>

              <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-700">
                <FiMail /> {selectedConversation.participants}
              </h2>
            </div>

            {/* Chat history - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {selectedConversation.messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.from === "Admin" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`p-3 rounded-2xl max-w-sm shadow-sm ${
                      m.from === "Admin"
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-gray-200 text-gray-900 rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm">{m.text}</p>
                    <p
                      className={`text-xs mt-1 ${
                        m.from === "Admin" ? "text-indigo-200" : "text-gray-600"
                      }`}
                    >
                      {m.time}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Section */}
            <div className="p-6 border-t flex-shrink-0">
              <textarea
                rows={3}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Reply to ${selectedConversation.participants}...`}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
              <div className="flex justify-between items-center mt-3">
                <p className="text-xs text-gray-500">Press Enter to send, Shift+Enter for new line</p>
                <button
                  onClick={handleSendReply}
                  disabled={!reply.trim()}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend /> Send Reply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageTable;