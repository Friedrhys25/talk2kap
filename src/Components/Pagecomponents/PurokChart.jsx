// PurokChart.jsx - WITH Firestore Users Per Purok Graph
// ✅ Fetches all users from Firestore `users` collection
// ✅ Groups users by their `purok` field
// ✅ Renders a dedicated bar chart for registered users per purok
// ✅ Shows loading/empty states gracefully

import React, { useMemo, useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, BarChart3, ClipboardList, Home, Vote, UserCheck, Loader2 } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../../firebaseConfig";

const purokData = [
  { name: "P1", population: 1228, households: 328, registered_voters: 596 },
  { name: "P2", population: 1576, households: 414, registered_voters: 764 },
  { name: "P3", population: 2894, households: 584, registered_voters: 1405 },
  { name: "P4", population: 1553, households: 463, registered_voters: 754 },
  { name: "P5", population: 3481, households: 508, registered_voters: 1690 },
  { name: "P6", population: 3074, households: 742, registered_voters: 1493 },
];

const PUROK_KEYS = ["P1", "P2", "P3", "P4", "P5", "P6"];

const colors = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

// ─────────────────────────────────────────────
// Hook: fetch users from Firestore & group by purok
// ─────────────────────────────────────────────
const useFirestoreUsersByPurok = () => {
  const [usersByPurok, setUsersByPurok] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const snapshot = await getDocs(collection(firestore, "users"));

        // Initialize counts for all puroks
        const counts = {};
        PUROK_KEYS.forEach((k) => (counts[k] = 0));

        snapshot.forEach((doc) => {
          const data = doc.data();
          // Support both "purok" and "Purok" field names
          const purok = (data.purok || data.Purok || "").toString().trim().toUpperCase();
          // Normalize: "PUROK 1" → "P1", "P1" → "P1", "1" → "P1"
          let key = purok;
          if (/^PUROK\s*(\d)$/.test(purok)) {
            key = "P" + purok.replace(/^PUROK\s*/, "");
          } else if (/^\d$/.test(purok)) {
            key = "P" + purok;
          }
          if (counts[key] !== undefined) {
            counts[key]++;
          }
        });

        const chartData = PUROK_KEYS.map((k) => ({ name: k, users: counts[k] }));
        setUsersByPurok(chartData);
        setTotalUsers(snapshot.size);
      } catch (err) {
        console.error("Failed to fetch users from Firestore:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  return { usersByPurok, totalUsers, loading, error };
};

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
const PurokChart = () => {
  const { usersByPurok, totalUsers, loading, error } = useFirestoreUsersByPurok();

  const totals = useMemo(() => ({
    population: purokData.reduce((sum, p) => sum + p.population, 0),
    households: purokData.reduce((sum, p) => sum + p.households, 0),
    voters: purokData.reduce((sum, p) => sum + p.registered_voters, 0),
  }), []);

  const pieData = useMemo(
    () => purokData.map((p) => ({ name: p.name, value: p.population })),
    []
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50">
      {/* Watermark */}
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-10 space-y-10">

        {/* ── Header ── */}
        <div className="relative overflow-hidden rounded-[26px] border border-white/60 bg-white/70 backdrop-blur-xl shadow-2xl">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-pink-500/20 blur-3xl" />
          <div className="relative p-7 md:p-9">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="inline-flex items-center gap-3">
                <span className="h-[3px] w-12 md:w-16 bg-gradient-to-r from-transparent to-indigo-500 rounded-full" />
                <div className="inline-flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-3xl bg-white shadow-lg border border-gray-200">
                  <Users className="text-indigo-600" size={24} />
                </div>
                <span className="h-[3px] w-12 md:w-16 bg-gradient-to-l from-transparent to-indigo-500 rounded-full" />
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Purok Overview Dashboard
              </h1>
              <p className="text-gray-700 text-base md:text-lg font-semibold max-w-3xl">
                Comprehensive demographic data and statistics by Purok — clean and readable for reporting.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <div className="h-1.5 w-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="h-1.5 w-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="h-1.5 w-1.5 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── KPI Cards (now 4 columns including System Users) ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Total Population"
            value={totals.population}
            icon={<Users size={22} />}
            tone="indigo"
            subtitle="All puroks combined"
          />
          <KpiCard
            title="Total Households"
            value={totals.households}
            icon={<Home size={22} />}
            tone="green"
            subtitle="Registered households"
          />
          <KpiCard
            title="Registered Voters"
            value={totals.voters}
            icon={<Vote size={22} />}
            tone="amber"
            subtitle="Active voters count"
          />
          <KpiCard
            title="System Users"
            value={loading ? "…" : totalUsers}
            icon={<UserCheck size={22} />}
            tone="purple"
            subtitle="Users in Firestore"
          />
        </div>

        {/* ── Charts Row 1 ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Bar Panel */}
          <Panel
            title="Figure 1: Purok Demographics"
            icon={<BarChart3 className="text-indigo-600" size={22} />}
            badge="Overview"
          >
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4">
              <div className="h-[340px]">
                <ResponsiveContainer>
                  <BarChart data={purokData} margin={{ top: 18, right: 24, left: 6, bottom: 12 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 800 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} />
                    <YAxis tick={{ fontSize: 13, fontWeight: 800 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} />
                    <Tooltip content={<PrettyTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 13, fontWeight: 800 }} iconType="circle" />
                    <Bar dataKey="population" fill="#4F46E5" radius={[10, 10, 0, 0]} barSize={22} />
                    <Bar dataKey="households" fill="#10B981" radius={[10, 10, 0, 0]} barSize={22} />
                    <Bar dataKey="registered_voters" fill="#F59E0B" radius={[10, 10, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold text-gray-600">
              Population, households, and voter breakdown per purok.
            </p>
          </Panel>

          {/* Pie Panel */}
          <Panel
            title="Figure 2: Population Distribution by Purok"
            icon={<BarChart3 className="text-indigo-600" size={22} />}
            badge="Distribution"
          >
            <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4">
              <div className="h-[340px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      innerRadius={62}
                      paddingAngle={2}
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                      dataKey="value"
                      style={{ fontSize: 12, fontWeight: 800 }}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={colors[index]} />
                      ))}
                    </Pie>
                    <Tooltip content={<PrettyTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-4">
              {pieData.map((p, idx) => (
                <span key={p.name} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-gray-200 shadow-sm text-xs font-extrabold text-gray-700">
                  <span className="w-3 h-3 rounded" style={{ background: colors[idx] }} />
                  {p.name}
                </span>
              ))}
            </div>
          </Panel>
        </div>

        {/* ── NEW: Figure 3 — Firestore Users Per Purok ── */}
        <Panel
          title="Figure 3: Registered System Users per Purok"
          icon={<UserCheck className="text-purple-600" size={22} />}
          badge="Live · Firestore"
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-4 text-gray-500">
              <Loader2 className="animate-spin text-indigo-500" size={40} />
              <p className="text-sm font-semibold">Loading users from Firestore…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[300px] gap-3 text-red-500">
              <p className="text-sm font-bold">⚠ Failed to load users</p>
              <p className="text-xs text-gray-500 max-w-sm text-center">{error}</p>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-gray-200 bg-gradient-to-b from-slate-50 to-white p-4">
                <div className="h-[340px]">
                  <ResponsiveContainer>
                    <BarChart
                      data={usersByPurok}
                      margin={{ top: 24, right: 24, left: 10, bottom: 12 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 13, fontWeight: 800, fill: "#374151" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                        tickLine={false}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 13, fontWeight: 800, fill: "#374151" }}
                        axisLine={{ stroke: "#E5E7EB" }}
                        tickLine={false}
                        label={{
                          value: "Users",
                          angle: -90,
                          position: "insideLeft",
                          offset: 12,
                          style: { fontSize: 12, fontWeight: 700, fill: "#6B7280" },
                        }}
                      />
                      <Tooltip content={<PrettyTooltip />} />
                      <Bar
                        dataKey="users"
                        name="System Users"
                        radius={[10, 10, 0, 0]}
                        barSize={42}
                        label={{
                          position: "top",
                          fontSize: 13,
                          fontWeight: 800,
                          fill: "#4F46E5",
                        }}
                      >
                        {usersByPurok.map((_, index) => (
                          <Cell key={index} fill={colors[index % colors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Per-purok mini stat cards */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-5">
                {usersByPurok.map((p, idx) => (
                  <div
                    key={p.name}
                    className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm py-3 px-2 gap-1"
                  >
                    <span className="w-3 h-3 rounded-full" style={{ background: colors[idx % colors.length] }} />
                    <span className="text-xs font-extrabold text-gray-500 uppercase tracking-wide">{p.name}</span>
                    <span className="text-xl font-extrabold" style={{ color: colors[idx % colors.length] }}>
                      {p.users}
                    </span>
                    <span className="text-[10px] font-semibold text-gray-400">users</span>
                  </div>
                ))}
              </div>

              <p className="mt-4 text-sm font-semibold text-gray-600">
                Data fetched live from Firestore{" "}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold">users</code>{" "}
                collection, grouped by the{" "}
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-indigo-600 font-bold">purok</code>{" "}
                field.
              </p>
            </>
          )}
        </Panel>

        {/* ── Table ── */}
        <Panel
          title="Table 1: Detailed Purok Information"
          icon={<ClipboardList className="text-orange-600" size={22} />}
          badge="Details"
        >
          <div className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full bg-white">
              <thead className="sticky top-0 z-10 bg-white">
                <tr className="border-b-2 border-gray-200">
                  <Th>Purok</Th>
                  <Th center>Population</Th>
                  <Th center>Households</Th>
                  <Th center>Registered Voters</Th>
                  <Th center>System Users</Th>
                </tr>
              </thead>
              <tbody>
                {purokData.map((purok, index) => {
                  const userEntry = usersByPurok.find((u) => u.name === purok.name);
                  return (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 transition-colors ${
                        index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      } hover:bg-indigo-50/60`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ background: colors[index % colors.length] }} />
                          <span className="text-base md:text-lg font-extrabold text-gray-900">{purok.name}</span>
                        </div>
                      </td>
                      <Td center><span className="text-lg md:text-xl font-extrabold text-gray-900">{purok.population}</span></Td>
                      <Td center><span className="text-lg md:text-xl font-extrabold text-gray-900">{purok.households}</span></Td>
                      <Td center><span className="text-lg md:text-xl font-extrabold text-gray-900">{purok.registered_voters}</span></Td>
                      <Td center>
                        {loading ? (
                          <Loader2 className="animate-spin inline text-indigo-400" size={16} />
                        ) : (
                          <span
                            className="inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-extrabold text-white"
                            style={{ background: colors[index % colors.length] }}
                          >
                            {userEntry ? userEntry.users : 0}
                          </span>
                        )}
                      </Td>
                    </tr>
                  );
                })}

                {/* Totals row */}
                <tr className="bg-gradient-to-r from-indigo-100 via-purple-100 to-pink-100 border-t-2 border-gray-200">
                  <td className="px-6 py-4 text-base md:text-lg font-extrabold text-gray-900">Total</td>
                  <Td center><span className="text-lg md:text-xl font-extrabold text-gray-900">{totals.population}</span></Td>
                  <Td center><span className="text-lg md:text-xl font-extrabold text-gray-900">{totals.households}</span></Td>
                  <Td center><span className="text-lg md:text-xl font-extrabold text-gray-900">{totals.voters}</span></Td>
                  <Td center>
                    <span className="text-lg md:text-xl font-extrabold text-gray-900">
                      {loading ? "…" : totalUsers}
                    </span>
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

      </div>
    </div>
  );
};

export default PurokChart;

/* =======================
   UI Helpers
======================= */

const Panel = ({ title, icon, badge, children }) => (
  <div className="bg-white/85 backdrop-blur rounded-[24px] shadow-2xl border border-white/60 overflow-hidden">
    <div className="px-6 py-5 md:px-7 md:py-5 border-b border-gray-200 flex items-center justify-between gap-3">
      <h3 className="text-lg md:text-xl font-extrabold text-gray-900 flex items-center gap-3">
        {icon}
        {title}
      </h3>
      {badge && (
        <span className="text-xs font-extrabold text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-full shadow-sm">
          {badge}
        </span>
      )}
    </div>
    <div className="p-6 md:p-7">{children}</div>
  </div>
);

const KpiCard = ({ title, value, icon, subtitle, tone = "indigo" }) => {
  const tones = {
    indigo: { ring: "ring-indigo-200", bg: "from-indigo-50/80 to-white", iconBg: "bg-indigo-600", glow: "bg-indigo-500/20", accent: "text-indigo-700" },
    green:  { ring: "ring-green-200",  bg: "from-green-50/80 to-white",  iconBg: "bg-green-600",  glow: "bg-green-500/20",  accent: "text-green-700" },
    amber:  { ring: "ring-amber-200",  bg: "from-amber-50/80 to-white",  iconBg: "bg-amber-600",  glow: "bg-amber-500/20",  accent: "text-amber-700" },
    purple: { ring: "ring-purple-200", bg: "from-purple-50/80 to-white", iconBg: "bg-purple-600", glow: "bg-purple-500/20", accent: "text-purple-700" },
  };
  const t = tones[tone] || tones.indigo;

  return (
    <div className="relative overflow-hidden rounded-[24px] bg-white shadow-2xl border border-gray-200">
      <div className={`absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl ${t.glow}`} />
      <div className={`absolute -bottom-20 -left-20 w-72 h-72 rounded-full blur-3xl ${t.glow}`} />
      <div className={`relative p-6 bg-gradient-to-b ${t.bg}`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-xs md:text-sm font-extrabold uppercase tracking-wider ${t.accent}`}>{title}</p>
            <p className="mt-2 text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">{value}</p>
            <p className="mt-1.5 text-xs md:text-sm font-semibold text-gray-600">{subtitle}</p>
          </div>
          <div className={`shrink-0 rounded-2xl ${t.iconBg} text-white p-3 shadow-lg ring-4 ${t.ring}`}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

const Th = ({ children, center }) => (
  <th className={`px-6 py-4 text-xs md:text-sm font-extrabold tracking-wider text-gray-600 uppercase ${center ? "text-center" : "text-left"}`}>
    {children}
  </th>
);

const Td = ({ children, center }) => (
  <td className={`px-6 py-4 ${center ? "text-center" : "text-left"}`}>{children}</td>
);

const PrettyTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-4">
      <p className="text-sm font-extrabold text-gray-900">{label}</p>
      <div className="mt-3 space-y-2">
        {payload.map((p, idx) => (
          <div key={idx} className="flex items-center justify-between gap-8 text-xs md:text-sm font-bold text-gray-700">
            <span className="inline-flex items-center gap-2">
              <span className="w-3 h-3 rounded" style={{ background: p.color }} />
              {p.name}
            </span>
            <span className="text-gray-900 font-extrabold">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};