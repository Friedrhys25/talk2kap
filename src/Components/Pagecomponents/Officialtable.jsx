import React, { useState } from "react";
import { FiUser, FiStar, FiSearch, FiXCircle, FiMessageCircle } from "react-icons/fi";

const OfficialTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOfficial, setSelectedOfficial] = useState(null);
  const [filter, setFilter] = useState("all"); // all, topRated, lowRated

  const officials = [
    {
      id: 1,
      name: "Kapitan Juan Dela Cruz",
      position: "Barangay Captain",
      rating: 4.5,
      feedbacks: [
        { citizen: "Maria Santos", message: "Very responsive", time: "09:00 AM" },
        { citizen: "Pedro Reyes", message: "Quick action on requests", time: "10:15 AM" },
      ],
    },
    {
      id: 2,
      name: "Kagawad Maria Santos",
      position: "Councilor",
      rating: 3.2,
      feedbacks: [{ citizen: "Ana Cruz", message: "Needs improvement on follow-up", time: "11:30 AM" }],
    },
    {
      id: 3,
      name: "Kagawad Pedro Reyes",
      position: "Councilor",
      rating: 5.0,
      feedbacks: [{ citizen: "Juan Cruz", message: "Excellent service!", time: "02:00 PM" }],
    },
    {
      id: 4,
      name: "Kagawad Jose Ramirez",
      position: "Councilor",
      rating: 4.3,
      feedbacks: [{ citizen: "Liza Dizon", message: "Very approachable and helpful", time: "01:15 PM" }],
    },
    {
      id: 5,
      name: "Kagawad Angela Mendoza",
      position: "Councilor",
      rating: 3.8,
      feedbacks: [{ citizen: "Mark Villanueva", message: "Good but sometimes slow response", time: "03:40 PM" }],
    },
    {
      id: 6,
      name: "Kagawad Roberto Cruz",
      position: "Councilor",
      rating: 4.7,
      feedbacks: [{ citizen: "Ella Santos", message: "Consistent with community meetings", time: "04:25 PM" }],
    },
    {
      id: 7,
      name: "Kagawad Teresa Lopez",
      position: "Councilor",
      rating: 4.0,
      feedbacks: [{ citizen: "Carlo Reyes", message: "Organizes events well", time: "05:10 PM" }],
    },
    {
      id: 8,
      name: "Kagawad Manuel Fernandez",
      position: "Councilor",
      rating: 3.5,
      feedbacks: [{ citizen: "Joan Tan", message: "Needs to improve attendance", time: "06:00 PM" }],
    },
  ];

  // Filter officials based on search and rating
  const filteredOfficials = officials.filter((o) => {
    const matchesSearch =
      o.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.position.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      (filter === "topRated" && o.rating >= 4) ||
      (filter === "lowRated" && o.rating < 4);
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: officials.length,
    topRated: officials.filter((o) => o.rating >= 4).length,
    lowRated: officials.filter((o) => o.rating < 4).length,
  };

  const getRatingBadge = (rating) => {
    if (rating >= 4) return "bg-green-100 text-green-800";
    return "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="space-y-6 h-screen p-6 bg-gray-50 ">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: "Total Officials", value: stats.total, icon: <FiUser className="text-blue-600" />, bg: "bg-blue-100" },
          { title: "Top Rated (≥4⭐)", value: stats.topRated, icon: <FiStar className="text-green-600" />, bg: "bg-green-100" },
          { title: "Needs Improvement (<4⭐)", value: stats.lowRated, icon: <FiStar className="text-yellow-600" />, bg: "bg-yellow-100" },
        ].map((s, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between border">
            <div>
              <p className="text-sm text-gray-600">{s.title}</p>
              <p className="text-2xl font-bold text-gray-800">{s.value}</p>
            </div>
            <div className={`w-10 h-10 flex items-center justify-center rounded-full ${s.bg}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {/* Search + Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm border flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search officials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === "all" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            All ({officials.length})
          </button>
          <button
            onClick={() => setFilter("topRated")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === "topRated" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Top Rated ({stats.topRated})
          </button>
          <button
            onClick={() => setFilter("lowRated")}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === "lowRated" ? "bg-yellow-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
          >
            Needs Improvement ({stats.lowRated})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border ">
        <table className="w-full min-w-[700px]">
          <thead className="bg-gray-50 border-b">
            <tr>
              {["Name", "Position", "Rating", "Feedback"].map((head) => (
                <th key={head} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredOfficials.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-2 truncate" title={o.name}>
                  <FiUser className="text-gray-500" /> {o.name}
                </td>
                <td className="px-6 py-4 truncate" title={o.position}>{o.position}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRatingBadge(o.rating)}`}>
                    {o.rating}⭐
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => setSelectedOfficial(o)}
                    className="flex items-center gap-1 text-indigo-600 hover:underline"
                  >
                    <FiMessageCircle /> View Feedback
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredOfficials.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No officials found. Try adjusting your search or filters.
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600 text-center">Showing {filteredOfficials.length} of {officials.length} officials</div>

      {/* Modal */}
      {selectedOfficial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative flex flex-col max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOfficial(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
            >
              <FiXCircle size={22} />
            </button>

            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-indigo-700">
              <FiUser /> {selectedOfficial.name}
            </h2>
            <p className="text-gray-600 mb-2">{selectedOfficial.position}</p>
            <p className="text-yellow-600 font-medium flex items-center gap-1 mb-4">
              <FiStar /> Rating: {selectedOfficial.rating}
            </p>

            <div className="space-y-3 pr-2">
              {selectedOfficial.feedbacks.map((f, i) => (
                <div key={i} className="bg-gray-100 rounded-lg p-3 shadow-sm">
                  <p className="text-sm text-gray-900">
                    <strong>{f.citizen}:</strong> {f.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{f.time}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OfficialTable;
