// HoverDevCards.jsx - Firestore version (matches Notiftable.jsx pattern)
import React, { useState, useEffect, useMemo } from "react";
import {
  FiArrowLeft, FiAlertTriangle, FiClock,
  FiGrid, FiMapPin, FiTrendingUp,
} from "react-icons/fi";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip, Cell, LabelList, CartesianGrid,
} from "recharts";
import {
  getFirestore,
  collection,
  onSnapshot,
} from "firebase/firestore";
import app from "../../firebaseConfig";

const firestore = getFirestore(app);
const PUROKS = [1, 2, 3, 4, 5, 6];

// ── Main component ────────────────────────────────────────────────────────────
const HoverDevCards = ({ onPurokSelect, selectedPurok, onBackToDashboard }) => {
  const [purokStats, setPurokStats] = useState(() =>
    PUROKS.reduce((acc, p) => { acc[p] = { urgent: 0, nonUrgent: 0 }; return acc; }, {})
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const usersRef = collection(firestore, "users");
    const innerUnsubs = [];

    const unsubUsers = onSnapshot(
      usersRef,
      (usersSnapshot) => {
        // Reset stats to zero for a clean tally
        const nextStats = PUROKS.reduce((acc, p) => {
          acc[p] = { urgent: 0, nonUrgent: 0 };
          return acc;
        }, {});

        let pendingUsers = usersSnapshot.size;
        if (pendingUsers === 0) {
          setPurokStats(nextStats);
          setLoading(false);
          return;
        }

        usersSnapshot.forEach((userDoc) => {
          const userId = userDoc.id;
          const complaintsRef = collection(firestore, "users", userId, "userComplaints");

          const unsubComplaints = onSnapshot(complaintsRef, (complaintsSnap) => {
            // Recalculate all stats fresh on every update
            const freshStats = PUROKS.reduce((acc, p) => {
              acc[p] = { urgent: 0, nonUrgent: 0 };
              return acc;
            }, {});

            // We need ALL users' complaints — rebuild from scratch each time
            // by re-reading from our accumulated snapshot map
            complaintsSnap.forEach((cDoc) => {
              const c = cDoc.data();
              const raw = c?.incidentPurok ?? c?.purok;
              const purok = parseInt(raw, 10);
              if (!Number.isFinite(purok) || purok < 1 || purok > 6) return;

              if (c?.label === "urgent") nextStats[purok].urgent += 1;
              else nextStats[purok].nonUrgent += 1;
            });

            setPurokStats({ ...nextStats });
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
  }, []);

  const totals = useMemo(() => {
    const arr = Object.values(purokStats);
    const urgent = arr.reduce((s, v) => s + (v?.urgent || 0), 0);
    const nonUrgent = arr.reduce((s, v) => s + (v?.nonUrgent || 0), 0);
    return { urgent, nonUrgent, total: urgent + nonUrgent };
  }, [purokStats]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  if (selectedPurok) {
    return (
      <PurokInfo
        purokNumber={selectedPurok}
        onBack={onBackToDashboard}
        purokStats={purokStats}
      />
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 relative">
      {/* Watermark */}
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

      <div className="relative z-10 w-full max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 pt-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <div className="h-1 w-16 bg-gradient-to-r from-transparent to-indigo-500 rounded-full" />
            <FiGrid className="text-indigo-600 text-4xl animate-pulse" />
            <div className="h-1 w-16 bg-gradient-to-l from-transparent to-indigo-500 rounded-full" />
          </div>

          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Dashboard
          </h1>

          <p className="text-gray-600 text-base md:text-lg font-medium">
            Select a Purok to view detailed information
          </p>

          {/* Totals pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Pill color="indigo" icon={<FiTrendingUp />}>
              Total Cases: <span className="font-extrabold">{totals.total}</span>
            </Pill>
            <Pill color="red" icon={<FiAlertTriangle />}>
              Urgent: <span className="font-extrabold">{totals.urgent}</span>
            </Pill>
            <Pill color="blue" icon={<FiClock />}>
              Non-Urgent: <span className="font-extrabold">{totals.nonUrgent}</span>
            </Pill>
          </div>
        </div>

        {/* Purok Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PUROKS.map((p) => (
            <PurokCard
              key={p}
              purokNo={p}
              urgent={purokStats[p]?.urgent || 0}
              nonUrgent={purokStats[p]?.nonUrgent || 0}
              onClick={() => onPurokSelect(p)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

// ── UI helpers ────────────────────────────────────────────────────────────────
const Pill = ({ color = "indigo", icon, children }) => {
  const map = {
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    red:    "bg-red-50 text-red-700 border-red-200",
    blue:   "bg-blue-50 text-blue-700 border-blue-200",
    gray:   "bg-gray-50 text-gray-700 border-gray-200",
  };
  return (
    <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-bold shadow-sm ${map[color] || map.gray}`}>
      <span className="text-sm">{icon}</span>
      {children}
    </span>
  );
};

const PurokCard = ({ purokNo, urgent, nonUrgent, onClick }) => {
  const total = urgent + nonUrgent;
  const urgentPct = total > 0 ? Math.round((urgent / total) * 100) : 0;

  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-2xl border-2 border-gray-200 bg-white overflow-hidden
                 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-indigo-300"
    >
      <div className="h-1.5 w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" />
      <div className="absolute -top-16 -right-16 w-52 h-52 rounded-full bg-indigo-100/70 blur-2xl group-hover:bg-purple-100/80 transition-colors" />
      <div className="absolute -bottom-16 -left-16 w-52 h-52 rounded-full bg-pink-100/60 blur-2xl group-hover:bg-indigo-100/70 transition-colors" />

      <div className="relative p-6 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shadow-sm">
              <FiMapPin className="text-indigo-600" size={20} />
            </div>
            <div>
              <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">Purok</p>
              <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">{purokNo}</h3>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-extrabold">
            <FiTrendingUp /> Total: {total}
          </span>
        </div>

        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600">
            <span>Urgent share</span>
            <span>{urgentPct}%</span>
          </div>
          <div className="mt-2 h-2.5 w-full rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
              style={{ width: `${urgentPct}%` }}
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-3">
            <div className="flex items-center gap-2 text-red-700">
              <FiAlertTriangle />
              <span className="text-[11px] font-extrabold uppercase tracking-wide">Urgent</span>
            </div>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">{urgent}</p>
          </div>
          <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3">
            <div className="flex items-center gap-2 text-blue-700">
              <FiClock />
              <span className="text-[11px] font-extrabold uppercase tracking-wide">Non-Urgent</span>
            </div>
            <p className="mt-1 text-3xl font-extrabold text-gray-900">{nonUrgent}</p>
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end">
          <span className="inline-flex items-center gap-2 text-indigo-700 font-extrabold text-sm">
            View details
            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </button>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const item = payload[0]?.payload;
    return (
      <div className="bg-white p-3 rounded-xl shadow-xl border border-gray-200">
        <p className="font-extrabold text-gray-900">{item?.name}</p>
        <p className="text-sm text-gray-600 mt-1">
          Value: <span className="font-bold text-gray-900">{item?.value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// ── Purok Detail View ─────────────────────────────────────────────────────────
const PurokInfo = ({ purokNumber, onBack, purokStats }) => {
  const basePurokInfo = {
    1: { name: "Purok 1", description: "Information about Purok 1", residents: 1228 },
    2: { name: "Purok 2", description: "Information about Purok 2", residents: 1576 },
    3: { name: "Purok 3", description: "Information about Purok 3", residents: 2894 },
    4: { name: "Purok 4", description: "Information about Purok 4", residents: 1553 },
    5: { name: "Purok 5", description: "Information about Purok 5", residents: 3481 },
    6: { name: "Purok 6", description: "Information about Purok 6", residents: 3074 },
  };

  const baseInfo = basePurokInfo[purokNumber];
  const stats = purokStats[purokNumber] || { urgent: 0, nonUrgent: 0 };
  const purokData = {
    ...baseInfo,
    complaints: stats.urgent + stats.nonUrgent,
    urgent: stats.urgent,
    nonUrgent: stats.nonUrgent,
  };

  const complaintChartData = [
    { name: "Total",      value: purokData.complaints, color: "#10B981" },
    { name: "Urgent",     value: purokData.urgent,     color: "#EF4444" },
    { name: "Non-Urgent", value: purokData.nonUrgent,  color: "#3B82F6" },
  ];

  return (
    <div className="relative min-h-screen p-6 bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
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

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-extrabold"
        >
          <FiArrowLeft size={20} />
          <span className="text-lg">Back to Dashboard</span>
        </button>

        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
            <FiMapPin className="text-indigo-600" />
            <span className="font-extrabold text-gray-900">{purokData.name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900">{purokData.name} Overview</h1>
          <p className="text-gray-600">{purokData.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="TOTAL RESIDENTS"   value={purokData.residents}  tone="blue"   />
          <StatCard title="TOTAL COMPLAINTS"  value={purokData.complaints} tone="green"  />
          <StatCard title="URGENT"            value={purokData.urgent}     tone="red"    />
          <StatCard title="NON-URGENT"        value={purokData.nonUrgent}  tone="indigo" />
        </div>

        <div className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between gap-3">
            <h3 className="text-lg font-extrabold text-gray-900 flex items-center gap-3">
              <FiAlertTriangle className="text-orange-600" size={22} />
              Figure 1: Complaint Breakdown
            </h3>
            <span className="text-xs font-bold text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
              Firestore Live
            </span>
          </div>

          <div className="p-6">
            <div className="h-80 rounded-xl border border-gray-200 bg-gradient-to-b from-gray-50 to-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complaintChartData} margin={{ top: 20, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 800 }} />
                  <YAxis tick={{ fontSize: 12, fontWeight: 800 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" maxBarSize={120} radius={[12, 12, 0, 0]}>
                    {complaintChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList
                      dataKey="value"
                      position="top"
                      style={{ fontSize: "14px", fontWeight: 900, fill: "#111827" }}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mt-5">
              <LegendDot color="bg-green-500" label={`Total: ${purokData.complaints}`} />
              <LegendDot color="bg-red-500"   label={`Urgent: ${purokData.urgent}`} />
              <LegendDot color="bg-blue-500"  label={`Non-Urgent: ${purokData.nonUrgent}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, tone = "indigo" }) => {
  const tones = {
    indigo: "border-indigo-200",
    red:    "border-red-200",
    blue:   "border-blue-200",
    green:  "border-green-200",
    amber:  "border-amber-200",
  };
  return (
    <div className={`bg-white rounded-2xl shadow-lg border-2 ${tones[tone] || tones.indigo} p-6`}>
      <p className="text-xs font-extrabold tracking-wider text-gray-600 mb-1">{title}</p>
      <p className="text-4xl font-extrabold text-gray-900">{value}</p>
    </div>
  );
};

const LegendDot = ({ color, label }) => (
  <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-white border border-gray-200 shadow-sm">
    <span className={`w-3.5 h-3.5 rounded ${color}`} />
    <span className="text-sm font-semibold text-gray-700">{label}</span>
  </div>
);

// ── Export wrapper ────────────────────────────────────────────────────────────
export default function App() {
  const [selectedPurok, setSelectedPurok] = React.useState(null);
  return (
    <HoverDevCards
      selectedPurok={selectedPurok}
      onPurokSelect={setSelectedPurok}
      onBackToDashboard={() => setSelectedPurok(null)}
    />
  );
}