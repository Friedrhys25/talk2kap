// ReportAnalytics.jsx - Firestore version (matches Notiftable.jsx pattern)
import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp, Clock, BarChart3, Calendar,
  AlertCircle, CheckCircle, PieChart, Activity, Sparkles,
} from "lucide-react";
import {
  BarChart, Bar, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  Legend, ResponsiveContainer, ComposedChart,
  PieChart as RPieChart, Pie, Cell,
} from "recharts";
import {
  getFirestore,
  collection,
  onSnapshot,
} from "firebase/firestore";
import app from "../../firebaseConfig";

const firestore = getFirestore(app);

/* ── Tooltip ─────────────────────────────────────────────────────────────────*/
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const nonUrgent = payload.find((p) => p.dataKey === "nonUrgent")?.value || 0;
    const urgent    = payload.find((p) => p.dataKey === "urgent")?.value    || 0;
    const total     = payload.find((p) => p.dataKey === "total")?.value     || 0;
    return (
      <div className="bg-white/95 backdrop-blur p-4 border border-indigo-200 rounded-2xl shadow-2xl">
        <p className="font-extrabold text-gray-900 mb-3 text-sm border-b pb-2">{label}</p>
        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-6">
            <span className="text-amber-700 font-bold">Non-Urgent</span>
            <span className="font-extrabold text-amber-800">{nonUrgent}</span>
          </div>
          <div className="flex items-center justify-between gap-6">
            <span className="text-rose-700 font-bold">Urgent</span>
            <span className="font-extrabold text-rose-800">{urgent}</span>
          </div>
          <div className="pt-2 mt-2 border-t border-gray-200">
            <div className="flex items-center justify-between gap-6">
              <span className="text-indigo-700 font-extrabold">Total</span>
              <span className="font-extrabold text-indigo-900 text-base">{total}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/* ── UI helpers ──────────────────────────────────────────────────────────────*/
const Panel = ({ icon, title, subtitle, rightSlot, children }) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-xl">
    <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
    <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl" />
    <div className="relative px-6 py-5 border-b border-gray-200 flex items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-extrabold text-gray-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-xs md:text-sm text-gray-600 font-semibold mt-1">{subtitle}</p>}
        </div>
      </div>
      {rightSlot && <div className="shrink-0">{rightSlot}</div>}
    </div>
    <div className="relative p-6">{children}</div>
  </div>
);

const StatCard = ({ title, value, sub, icon, tone = "indigo", pill }) => {
  const t = {
    indigo: { ring: "ring-indigo-200", bg: "from-indigo-50/70 to-white", iconBg: "bg-indigo-600", pillBg: "bg-indigo-100 text-indigo-700" },
    rose:   { ring: "ring-rose-200",   bg: "from-rose-50/70 to-white",   iconBg: "bg-rose-600",   pillBg: "bg-rose-100 text-rose-700"     },
    amber:  { ring: "ring-amber-200",  bg: "from-amber-50/70 to-white",  iconBg: "bg-amber-600",  pillBg: "bg-amber-100 text-amber-700"   },
  }[tone];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/85 backdrop-blur shadow-xl">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
      <div className={`relative p-6 bg-linear-to-b ${t.bg}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[11px] md:text-xs font-extrabold uppercase tracking-wider text-gray-600">{title}</p>
              {pill && <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full ${t.pillBg}`}>{pill}</span>}
            </div>
            <p className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{value}</p>
            {sub && <p className="mt-1 text-xs md:text-sm font-semibold text-gray-600">{sub}</p>}
          </div>
          <div className={`shrink-0 rounded-xl ${t.iconBg} text-white p-3 shadow-lg ring-4 ${t.ring}`}>{icon}</div>
        </div>
      </div>
    </div>
  );
};

const Segmented = ({ value, onChange }) => (
  <div className="inline-flex rounded-xl border border-gray-200 bg-white/70 backdrop-blur p-1 shadow-sm">
    {["monthly", "weekly"].map((v) => (
      <button key={v} onClick={() => onChange(v)}
        className={`px-4 py-2 rounded-lg text-sm font-extrabold transition ${
          value === v ? "bg-indigo-600 text-white shadow" : "text-gray-700 hover:bg-gray-50"
        }`}>
        {v.charAt(0).toUpperCase() + v.slice(1)}
      </button>
    ))}
  </div>
);

/* ── Main Component ──────────────────────────────────────────────────────────*/
const ReportAnalytics = () => {
  const [view, setView] = useState("monthly");
  const [selectedMonth, setSelectedMonth] = useState("January");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(0); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [complaintData, setComplaintData] = useState({ monthlyComplaints: [], weeklyComplaints: {}, topComplaints: [] });
  const [loading, setLoading] = useState(true);
  const [rangeError, setRangeError] = useState("");

  const months = useMemo(() => [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ], []);

  const formatRangeDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(`${iso}T00:00:00`);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  };

  const formatComplaintType = (type) => ({
    medical: "Medical Emergency", fire: "Fire Incident",
    noise: "Noise Complaints", waste: "Waste Management",
    infrastructure: "Infrastructure Issues", unknown: "Other Issues",
    irrelevant: "Irrelevant / Spam",
  })[(type || "").toLowerCase()] || type;

  const getWeekOfMonth = (date) => {
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
    return Math.min(Math.ceil((date.getDate() + firstDay.getDay()) / 7), 4);
  };

  const getRangeBounds = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(`${startDate}T00:00:00`);
    const end   = new Date(`${endDate}T23:59:59`);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
    return { start, end };
  };

  const buildMonthlyStats = (complaints) =>
    months.map((monthName, monthIndex) => {
      const mc = complaints.filter((c) => c.month === monthIndex);
      return { month: monthName, urgent: mc.filter((c) => c.isUrgent).length, nonUrgent: mc.filter((c) => !c.isUrgent).length };
    });

  const buildWeeklyStats = (complaints) => {
    const ws = {};
    months.forEach((monthName, monthIndex) => {
      ws[monthName] = [1, 2, 3, 4].map((weekNum) => {
        const wc = complaints.filter((c) => c.month === monthIndex && c.week === weekNum);
        return { week: `Week ${weekNum}`, urgent: wc.filter((c) => c.isUrgent).length, nonUrgent: wc.filter((c) => !c.isUrgent).length };
      });
    });
    return ws;
  };

  const buildTopComplaints = (complaints) => {
    const typeCount = {};
    complaints.forEach((c) => {
      const t = (c.type || "unknown").toLowerCase();
      typeCount[t] = (typeCount[t] || 0) + 1;
    });
    return Object.entries(typeCount)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({ type: formatComplaintType(type), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  // ── Firestore listener ─────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);

    // Validate date range for monthly view
    if (view === "monthly") {
      const bounds = getRangeBounds();
      if (!bounds) {
        setRangeError("Please select a valid start and end date.");
        setComplaintData({ monthlyComplaints: buildMonthlyStats([]), weeklyComplaints: buildWeeklyStats([]), topComplaints: [] });
        setLoading(false);
        return;
      }
      if (bounds.start > bounds.end) {
        setRangeError("Start date must be earlier than (or equal to) end date.");
        setComplaintData({ monthlyComplaints: buildMonthlyStats([]), weeklyComplaints: buildWeeklyStats([]), topComplaints: [] });
        setLoading(false);
        return;
      }
      setRangeError("");
    } else {
      setRangeError("");
    }

    const usersRef = collection(firestore, "users");
    const innerUnsubs = [];

    // Accumulate all complaints across users
    const complaintMap = {}; // userId -> complaints[]

    const unsubUsers = onSnapshot(
      usersRef,
      (usersSnapshot) => {
        usersSnapshot.forEach((userDoc) => {
          const userId = userDoc.id;
          const complaintsRef = collection(firestore, "users", userId, "userComplaints");

          const unsubComplaints = onSnapshot(complaintsRef, (complaintsSnap) => {
            complaintMap[userId] = [];

            complaintsSnap.forEach((cDoc) => {
              const c = cDoc.data();

              // Firestore Timestamp → JS Date
              let parsedDate = null;
              if (c.timestamp && typeof c.timestamp.toDate === "function") {
                parsedDate = c.timestamp.toDate();
              } else if (typeof c.timestamp === "string") {
                // fallback: parse "DD/MM/YYYY, HH:MM:SS" format
                const [datePart, timePart] = (c.timestamp || "").split(", ");
                if (datePart && timePart) {
                  const [day, month, year] = datePart.split("/");
                  const d = new Date(`${year}-${month}-${day}T${timePart}`);
                  if (!isNaN(d.getTime())) parsedDate = d;
                }
              }

              if (!parsedDate) return;

              complaintMap[userId].push({
                ...c,
                id: cDoc.id,
                date: parsedDate,
                month: parsedDate.getMonth(),
                monthName: months[parsedDate.getMonth()],
                week: getWeekOfMonth(parsedDate),
                isUrgent: c.label === "urgent",
              });
            });

            // Rebuild stats from all users every time any user's complaints change
            const allComplaints = Object.values(complaintMap).flat();

            let effective = allComplaints;
            if (view === "monthly") {
              const bounds = getRangeBounds();
              if (bounds) effective = allComplaints.filter((c) => c.date >= bounds.start && c.date <= bounds.end);
            }

            setComplaintData({
              monthlyComplaints: buildMonthlyStats(effective),
              weeklyComplaints:  buildWeeklyStats(effective),
              topComplaints:     buildTopComplaints(effective),
            });
            setLoading(false);
          });

          innerUnsubs.push(unsubComplaints);
        });
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
  }, [startDate, endDate, months, view]);

  // ── Derived display data ───────────────────────────────────────────────────
  const monthlyData = months.map((m) => {
    const record = complaintData.monthlyComplaints.find((d) => d.month === m);
    const urgent = record?.urgent || 0;
    const nonUrgent = record?.nonUrgent || 0;
    return { name: m.substring(0, 3), urgent, nonUrgent, total: urgent + nonUrgent };
  });

  const weeklyData = (complaintData.weeklyComplaints[selectedMonth] || []).map((d) => ({
    name: d.week,
    urgent: d.urgent || 0,
    nonUrgent: d.nonUrgent || 0,
    total: (d.urgent || 0) + (d.nonUrgent || 0),
  }));

  const graphData = view === "monthly" ? monthlyData : weeklyData;

  const currentData = view === "monthly"
    ? complaintData.monthlyComplaints
    : complaintData.weeklyComplaints[selectedMonth] || [];

  const totalComplaints  = currentData.reduce((s, i) => s + (i.urgent || 0) + (i.nonUrgent || 0), 0);
  const totalUrgent      = currentData.reduce((s, i) => s + (i.urgent || 0), 0);
  const totalNonUrgent   = currentData.reduce((s, i) => s + (i.nonUrgent || 0), 0);
  const avgPerPeriod     = view === "monthly"
    ? Math.round(totalComplaints / 12)
    : Math.round(totalComplaints / Math.max(currentData.length, 1));

  const urgentPercentage    = totalComplaints > 0 ? ((totalUrgent    / totalComplaints) * 100).toFixed(1) : "0.0";
  const nonUrgentPercentage = totalComplaints > 0 ? ((totalNonUrgent / totalComplaints) * 100).toFixed(1) : "0.0";

  const categoryData = complaintData.topComplaints.map((c) => ({ name: c.type, value: c.count }));
  const COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-sm">Loading analytics data...</p>
          <p className="text-gray-500 text-xs mt-1">Fetching from Firestore</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: 'url("/src/assets/sanroquelogo.png")',
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.18,
          filter: "brightness(1.4) contrast(1.1)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-pink-500/15 blur-3xl" />

          <div className="relative p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">Report Analytics Dashboard</h1>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Trends, distributions, and top complaint categories (Firestore Live)
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              <Segmented value={view} onChange={setView} />
              {view === "weekly" && (
                <select
                  className="w-full sm:w-56 px-4 py-2.5 border border-gray-200 rounded-xl bg-white/80 text-gray-700 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  {months.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Date range — monthly only */}
          {view === "monthly" && (
            <div className="px-6 pb-6 md:px-7">
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="text-indigo-600" size={18} />
                    <p className="text-sm font-extrabold text-gray-900">Date Range Filter</p>
                  </div>
                  <div className="text-xs text-gray-500 font-semibold">
                    Average / period: <span className="text-gray-800 font-extrabold">{avgPerPeriod} per month</span>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[["From", startDate, setStartDate], ["To", endDate, setEndDate]].map(([lbl, val, setter]) => (
                    <div key={lbl}>
                      <label className="block text-[11px] font-extrabold text-gray-600 uppercase tracking-wider mb-1">{lbl}</label>
                      <input type="date" value={val} onChange={(e) => setter(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-gray-700 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  ))}
                  <div className="rounded-xl border border-gray-200 bg-slate-50 p-4">
                    <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">Current Range</p>
                    <p className="text-sm font-extrabold text-gray-900 mt-1">
                      {formatRangeDate(startDate)} → {formatRangeDate(endDate)}
                    </p>
                    <p className="text-xs text-gray-500 font-semibold mt-1">Monthly view is date-filtered</p>
                  </div>
                </div>

                {rangeError && (
                  <div className="mt-4 p-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-extrabold text-sm">
                    {rangeError}
                  </div>
                )}
              </div>
            </div>
          )}

          {view === "weekly" && (
            <div className="px-6 pb-6 md:px-7">
              <div className="rounded-2xl border border-gray-200 bg-white/70 p-4 shadow-sm flex items-center gap-3">
                <Activity className="text-indigo-600" size={18} />
                <p className="text-sm font-semibold text-gray-700">Weekly view ignores the date range filter.</p>
              </div>
            </div>
          )}
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Complaints" value={totalComplaints}
            sub={view === "monthly" ? "Monthly (date-filtered)" : `Weekly for ${selectedMonth}`}
            icon={<BarChart3 size={20} />} tone="indigo" pill="TOTAL" />
          <StatCard title="Urgent Cases" value={totalUrgent}
            sub="Requires immediate attention"
            icon={<AlertCircle size={20} />} tone="rose" pill={`${urgentPercentage}%`} />
          <StatCard title="Non-Urgent Cases" value={totalNonUrgent}
            sub="Standard priority level"
            icon={<CheckCircle size={20} />} tone="amber" pill={`${nonUrgentPercentage}%`} />
        </div>

        {/* Main Chart */}
        <Panel
          icon={<TrendingUp size={18} />}
          title="Figure 1: Complaint Trend Analysis"
          subtitle={view === "monthly"
            ? "Monthly distribution of urgent and non-urgent complaints (date-filtered)"
            : `Weekly breakdown for ${selectedMonth}`}
          rightSlot={
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-extrabold text-gray-700 shadow-sm">
              <Clock size={14} className="text-indigo-600" />
              Avg: {avgPerPeriod} / {view === "monthly" ? "month" : "week"}
            </span>
          }
        >
          <div className="h-[420px] w-full rounded-2xl bg-linear-to-b from-slate-50 to-white p-4 border border-gray-200">
            <ResponsiveContainer>
              <ComposedChart data={graphData} margin={{ top: 18, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#4B5563" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} />
                <YAxis stroke="#4B5563" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: 14, fontWeight: 800 }} iconType="circle" />
                <Bar dataKey="nonUrgent" fill="#F59E0B" name="Non-Urgent" radius={[10, 10, 0, 0]} />
                <Bar dataKey="urgent" fill="#EF4444" name="Urgent" radius={[10, 10, 0, 0]} />
                <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={3} name="Total"
                  dot={{ fill: "#4F46E5", r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Distribution Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Panel icon={<PieChart size={18} />} title="Figure 2: Complaint Priority Distribution" subtitle="Urgent vs non-urgent share">
            <div className="h-72 rounded-2xl border border-gray-200 bg-linear-to-b from-slate-50 to-white p-4">
              <ResponsiveContainer>
                <RPieChart>
                  <Pie
                    data={[
                      { name: "Urgent",     value: totalUrgent    },
                      { name: "Non-Urgent", value: totalNonUrgent },
                    ]}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={92} dataKey="value"
                  >
                    <Cell fill="#EF4444" />
                    <Cell fill="#F59E0B" />
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <Panel icon={<BarChart3 size={18} />} title="Figure 3: Complaint Category Distribution" subtitle="Top complaint types by count">
            <div className="h-72 rounded-2xl border border-gray-200 bg-linear-to-b from-slate-50 to-white p-4">
              <ResponsiveContainer>
                <BarChart data={categoryData} layout="vertical" margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12, fontWeight: 700 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fontWeight: 700 }} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* Table */}
        <Panel icon={<Clock size={18} />} title="Table 1: Top Complaint Categories" subtitle="Ranked by total cases">
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200">
                  {["Rank", "Complaint Category", "Total Cases", "Percentage"].map((h) => (
                    <th key={h} className={`px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-600 ${h === "Rank" ? "text-left" : "text-center"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {complaintData.topComplaints.length > 0 ? (
                  complaintData.topComplaints.map((complaint, index) => {
                    const totalCases = complaintData.topComplaints.reduce((s, c) => s + c.count, 0);
                    const pct = totalCases > 0 ? ((complaint.count / totalCases) * 100).toFixed(1) : "0.0";
                    return (
                      <tr key={complaint.type}
                        className={`border-b border-gray-100 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/60`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-sm">
                            {index + 1}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-extrabold text-gray-900 text-sm">{complaint.type}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xl font-extrabold text-gray-900">{complaint.count}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-extrabold text-xs">
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-semibold">
                      {view === "monthly" ? "No complaint data available for this date range" : "No complaint data available yet"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
};

export default ReportAnalytics;