// Reportstanod.jsx - Tanod Deployment Analytics (Firestore)
import React, { useState, useEffect, useMemo } from "react";
import barangayLogo from "../../assets/sanroquelogo.png";

import {
  TrendingUp, Clock, BarChart3, Calendar,
  AlertCircle, CheckCircle, PieChart, Activity, Layers, Star, Users,
  Trophy, Award, Medal, Sparkles,
} from "lucide-react";
import {
  BarChart, Bar, Line, LineChart, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
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

/* ── Helpers ─────────────────────────────────────────────────────────────────*/
const COMPLAINT_LABEL = {
  medical: "Medical Emergency",
  fire: "Fire Incident",
  noise: "Noise Complaints",
  waste: "Waste Management",
  infrastructure: "Infrastructure Issues",
  unknown: "Other Issues",
  irrelevant: "Irrelevant / Spam",
};

const formatType = (t) =>
  COMPLAINT_LABEL[(t || "").toLowerCase()] || t || "Unknown";

const parseIsoOrNull = (val) => {
  if (!val) return null;
  if (typeof val === "object" && typeof val.toDate === "function") return val.toDate();
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
};

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const getWeekOfMonth = (date) => {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.min(Math.ceil((date.getDate() + firstDay.getDay()) / 7), 4);
};

const COLORS = ["#4F46E5", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

/* ── Sub-components ──────────────────────────────────────────────────────────*/
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const resolved   = payload.find((p) => p.dataKey === "resolved")?.value   || 0;
  const pending    = payload.find((p) => p.dataKey === "pending")?.value    || 0;
  const total      = payload.find((p) => p.dataKey === "total")?.value      || 0;
  return (
    <div className="bg-white/95 backdrop-blur p-4 border border-indigo-200 rounded-2xl shadow-2xl">
      <p className="font-extrabold text-gray-900 mb-3 text-sm border-b pb-2">{label}</p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-6">
          <span className="text-emerald-700 font-bold">Resolved</span>
          <span className="font-extrabold text-emerald-800">{resolved}</span>
        </div>
        <div className="flex items-center justify-between gap-6">
          <span className="text-amber-700 font-bold">Pending / Other</span>
          <span className="font-extrabold text-amber-800">{pending}</span>
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
};

const Panel = ({ icon, title, subtitle, rightSlot, headerExtra, children }) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-xl">
    <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full bg-indigo-500/10 blur-3xl" />
    <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl" />
    <div className="relative px-6 py-5 border-b border-gray-200 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="text-base md:text-lg font-extrabold text-gray-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-xs md:text-sm text-gray-600 font-semibold mt-1">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        {headerExtra}
        {rightSlot && <div className="shrink-0">{rightSlot}</div>}
      </div>
    </div>
    <div className="relative p-6">{children}</div>
  </div>
);

const StatCard = ({ title, value, sub, icon, tone = "indigo", pill }) => {
  const t = {
    indigo:  { bg: "from-indigo-50/70 to-white",  iconBg: "bg-indigo-600",  ring: "ring-indigo-200",  pillBg: "bg-indigo-100 text-indigo-700"  },
    emerald: { bg: "from-emerald-50/70 to-white", iconBg: "bg-emerald-600", ring: "ring-emerald-200", pillBg: "bg-emerald-100 text-emerald-700" },
    amber:   { bg: "from-amber-50/70 to-white",   iconBg: "bg-amber-600",   ring: "ring-amber-200",   pillBg: "bg-amber-100 text-amber-700"    },
    rose:    { bg: "from-rose-50/70 to-white",    iconBg: "bg-rose-600",    ring: "ring-rose-200",    pillBg: "bg-rose-100 text-rose-700"      },
    violet:  { bg: "from-violet-50/70 to-white",  iconBg: "bg-violet-600",  ring: "ring-violet-200",  pillBg: "bg-violet-100 text-violet-700"  },
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

const ChartToggle = ({ value, onChange }) => {
  const modes = [
    { key: "bar",  label: "Bar",  icon: <BarChart3 size={14} /> },
    { key: "line", label: "Line", icon: <TrendingUp size={14} /> },
    { key: "area", label: "Area", icon: <Layers size={14} /> },
  ];
  return (
    <div className="inline-flex rounded-xl border border-gray-200 bg-slate-100 p-1 gap-0.5">
      {modes.map((m) => (
        <button key={m.key} onClick={() => onChange(m.key)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-extrabold transition ${
            value === m.key ? "bg-white text-indigo-700 shadow-sm border border-gray-200" : "text-gray-500 hover:text-gray-800"
          }`}>
          {m.icon} {m.label}
        </button>
      ))}
    </div>
  );
};

/* ── Employee of the Week Card ───────────────────────────────────────────────*/
const EmployeeOfTheWeek = ({ records }) => {
  // Build per-tanod stats using ALL records (overall / all-time)
  const tanodMap = {};
  records.forEach((r) => {
    if (!tanodMap[r.employeeId]) {
      tanodMap[r.employeeId] = {
        name: r.tanodName,
        total: 0,
        resolved: 0,
        ratings: [],
      };
    }
    tanodMap[r.employeeId].total += 1;
    if (r.status === "resolved") tanodMap[r.employeeId].resolved += 1;
    if (r.tanodRating !== null && r.tanodRating !== undefined && !isNaN(Number(r.tanodRating))) {
      tanodMap[r.employeeId].ratings.push(Number(r.tanodRating));
    }
  });

  const ranked = Object.values(tanodMap)
    .map((t) => ({
      ...t,
      avgRating: t.ratings.length
        ? (t.ratings.reduce((a, b) => a + b, 0) / t.ratings.length)
        : 0,
      resolvedPct: t.total > 0 ? ((t.resolved / t.total) * 100).toFixed(1) : "0.0",
    }))
    // Primary sort: most resolved; tiebreak: avgRating
    .sort((a, b) => b.resolved - a.resolved || b.avgRating - a.avgRating);

  const winner = ranked[0] || null;
  const runnerUps = ranked.slice(1, 4);

  const weekLabel = "All-Time Overall";

  const medalColors = [
    { bg: "bg-amber-50", ring: "ring-amber-300", text: "text-amber-700", icon: "text-amber-500", label: "bg-amber-100 text-amber-700" },
    { bg: "bg-slate-50", ring: "ring-slate-300", text: "text-slate-700", icon: "text-slate-400", label: "bg-slate-100 text-slate-700" },
    { bg: "bg-orange-50", ring: "ring-orange-300", text: "text-orange-700", icon: "text-orange-400", label: "bg-orange-100 text-orange-700" },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-yellow-200/80 bg-linear-to-br from-amber-50/90 via-yellow-50/80 to-white backdrop-blur shadow-2xl">
      {/* Glow orbs */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-amber-300/15 blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-yellow-200/20 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative px-6 py-5 border-b border-yellow-200/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-lg">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-extrabold text-gray-900 leading-tight">Top Employee</h3>
            <p className="text-xs text-amber-700 font-semibold mt-0.5">Most resolved complaints · {weekLabel}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-extrabold shadow-sm">
          <Sparkles size={12} /> Overall
        </span>
      </div>

      <div className="relative p-6">
        {!winner ? (
          <div className="text-center py-10 text-gray-500 font-semibold text-sm">
            No deployment data available yet.
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── Winner spotlight ── */}
            <div className="flex-1 relative overflow-hidden rounded-2xl border-2 border-amber-300/70 bg-linear-to-br from-amber-50 to-yellow-50 p-6 shadow-xl">
              {/* sparkle bg */}
              <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{ backgroundImage: "radial-linear(circle, #F59E0B 1px, transparent 1px)", backgroundSize: "20px 20px" }} />

              <div className="relative flex flex-col items-center text-center gap-4">
                {/* Avatar circle */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-2xl ring-4 ring-amber-200">
                    <span className="text-3xl font-extrabold text-white">
                      {winner.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  {/* Crown badge */}
                  <div className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center shadow-md">
                    <Trophy size={14} className="text-white" />
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-amber-600 mb-1">🏆 Top Performer</p>
                  <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">{winner.name}</h2>
                </div>

                {/* Stats row */}
                <div className="w-full grid grid-cols-3 gap-3 mt-1">
                  {[
                    { label: "Resolved", value: winner.resolved, sub: "overall", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                    { label: "Total", value: winner.total, sub: "deployments", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
                    { label: "Avg Rating", value: winner.avgRating > 0 ? winner.avgRating.toFixed(2) : "N/A", sub: "by residents", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
                  ].map((s) => (
                    <div key={s.label} className={`rounded-xl border p-3 ${s.bg}`}>
                      <p className={`text-2xl font-extrabold ${s.color}`}>{s.value}</p>
                      <p className="text-[10px] font-extrabold text-gray-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">{s.sub}</p>
                    </div>
                  ))}
                </div>

                {/* Resolution rate bar */}
                <div className="w-full">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-extrabold text-gray-700">Resolution Rate</span>
                    <span className="text-xs font-extrabold text-emerald-700">{winner.resolvedPct}%</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                      style={{ width: `${winner.resolvedPct}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Runner-ups ── */}
            {runnerUps.length > 0 && (
              <div className="lg:w-72 flex flex-col gap-3">
                <p className="text-xs font-extrabold uppercase tracking-widest text-gray-500 mb-1">Runner-ups</p>
                {runnerUps.map((t, i) => {
                  const mc = medalColors[i] || medalColors[2];
                  const rankIcons = [<Medal size={14} />, <Award size={14} />, <Star size={14} />];
                  return (
                    <div key={t.name}
                      className={`relative overflow-hidden rounded-xl border ${mc.ring} ring-1 ${mc.bg} p-4 flex items-center gap-3 shadow-sm`}>
                      <div className={`shrink-0 w-9 h-9 rounded-full ${mc.label} flex items-center justify-center font-extrabold text-sm`}>
                        {rankIcons[i] || (i + 2)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-extrabold text-sm ${mc.text} truncate`}>{t.name}</p>
                        <p className="text-xs text-gray-500 font-semibold">
                          {t.resolved} resolved · {t.resolvedPct}%
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-extrabold text-gray-900">{t.total}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">total</p>
                      </div>
                    </div>
                  );
                })}

                {/* Overall summary callout */}
                <div className="mt-2 rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 mb-1">Overall Summary</p>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>Total tanods active</span>
                      <span className="font-extrabold text-gray-900">{ranked.length}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>Total deployments</span>
                      <span className="font-extrabold text-gray-900">{records.length}</span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>Total resolved</span>
                      <span className="font-extrabold text-emerald-700">{records.filter(r => r.status === "resolved").length}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────────────────────*/
const Reportstanod = () => {
  const [view, setView] = useState("monthly");
  const [chartMode1, setChartMode1] = useState("bar");
  const [chartMode3, setChartMode3] = useState("bar");
  const [selectedMonth, setSelectedMonth] = useState("January");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(0); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rangeError, setRangeError] = useState("");
  const [loading, setLoading] = useState(true);

  // Raw deployment records
  const [records, setRecords] = useState([]);

  const formatRangeDate = (iso) => {
    if (!iso) return "—";
    const d = new Date(`${iso}T00:00:00`);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" });
  };

  const getRangeBounds = () => {
    if (!startDate || !endDate) return null;
    const start = new Date(`${startDate}T00:00:00`);
    const end   = new Date(`${endDate}T23:59:59`);
    return isNaN(start.getTime()) || isNaN(end.getTime()) ? null : { start, end };
  };

  /* ── Firestore listener: employee/{id}/deploymentHistory ──────────────── */
  useEffect(() => {
    setLoading(true);
    const employeesRef = collection(firestore, "employee");
    const innerUnsubs  = [];
    const recordMap = {};

    const rebuildRecords = () => {
      const all = Object.values(recordMap).flat();
      setRecords(all);
      setLoading(false);
    };

    const unsubEmployees = onSnapshot(
      employeesRef,
      (snap) => {
        snap.forEach((empDoc) => {
          const empId   = empDoc.id;
          const empData = empDoc.data();
          const suffix = empData.suffix ? ` ${empData.suffix}` : "";
          const tanodName = `${empData.firstName || ""} ${empData.lastName || ""}${suffix}`.trim() || "Unknown";

          const histRef = collection(firestore, "employee", empId, "deploymentHistory");

          const unsubHist = onSnapshot(histRef, (histSnap) => {
            recordMap[empId] = [];

            histSnap.forEach((hDoc) => {
              const h = hDoc.data();
              const date = parseIsoOrNull(h.deployedAt) || parseIsoOrNull(h.resolvedAt);
              if (!date) return;

              recordMap[empId].push({
                id:          hDoc.id,
                tanodName,
                employeeId:  empId,
                status:      (h.status || "unknown").toLowerCase(),
                type:        formatType(h.type),
                rawType:     (h.type || "unknown").toLowerCase(),
                month:       date.getMonth(),
                week:        getWeekOfMonth(date),
                date,
                tanodRating: h.tanodRating ?? null,
                complainantName: h.complainantName || "",
                description: h.description || "",
                incidentPurok: h.incidentPurok || "",
                deployedAt:  parseIsoOrNull(h.deployedAt),
                resolvedAt:  parseIsoOrNull(h.resolvedAt),
              });
            });

            rebuildRecords();
          });

          innerUnsubs.push(unsubHist);
        });
      },
      (err) => {
        console.error("Firestore error:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubEmployees();
      innerUnsubs.forEach((u) => u());
    };
  }, []);

  /* ── Date-range validation ────────────────────────────────────────────── */
  useEffect(() => {
    if (view === "monthly") {
      const bounds = getRangeBounds();
      if (!bounds) { setRangeError("Please select a valid start and end date."); return; }
      if (bounds.start > bounds.end) { setRangeError("Start date must be earlier than (or equal to) end date."); return; }
    }
    setRangeError("");
  }, [startDate, endDate, view]);

  /* ── Filtered records ─────────────────────────────────────────────────── */
  const filteredRecords = useMemo(() => {
    if (view === "monthly") {
      const bounds = getRangeBounds();
      if (!bounds || bounds.start > bounds.end) return [];
      return records.filter((r) => r.date >= bounds.start && r.date <= bounds.end);
    }
    const monthIdx = MONTHS.indexOf(selectedMonth);
    return records.filter((r) => r.month === monthIdx);
  }, [records, view, startDate, endDate, selectedMonth]);

  /* ── Monthly chart data ───────────────────────────────────────────────── */
  const monthlyData = useMemo(() =>
    MONTHS.map((m, i) => {
      const mc       = filteredRecords.filter((r) => r.month === i);
      const resolved = mc.filter((r) => r.status === "resolved").length;
      const pending  = mc.filter((r) => r.status !== "resolved").length;
      return { name: m.substring(0, 3), resolved, pending, total: mc.length };
    }), [filteredRecords]);

  /* ── Weekly chart data ────────────────────────────────────────────────── */
  const weeklyData = useMemo(() => {
    const monthIdx = MONTHS.indexOf(selectedMonth);
    return [1, 2, 3, 4].map((wk) => {
      const wc       = filteredRecords.filter((r) => r.month === monthIdx && r.week === wk);
      const resolved = wc.filter((r) => r.status === "resolved").length;
      const pending  = wc.filter((r) => r.status !== "resolved").length;
      return { name: `Week ${wk}`, resolved, pending, total: wc.length };
    });
  }, [filteredRecords, selectedMonth]);

  const graphData = view === "monthly" ? monthlyData : weeklyData;

  /* ── KPI ──────────────────────────────────────────────────────────────── */
  const totalDeployments = filteredRecords.length;
  const totalResolved    = filteredRecords.filter((r) => r.status === "resolved").length;
  const totalPending     = filteredRecords.filter((r) => r.status !== "resolved").length;

  const ratingsArr = filteredRecords
    .map((r) => r.tanodRating)
    .filter((v) => v !== null && v !== undefined && !isNaN(Number(v)));
  const avgRating = ratingsArr.length
    ? (ratingsArr.reduce((a, b) => a + Number(b), 0) / ratingsArr.length).toFixed(2)
    : "N/A";

  const resolvedPct    = totalDeployments > 0 ? ((totalResolved / totalDeployments) * 100).toFixed(1) : "0.0";
  const avgPerPeriod   = view === "monthly"
    ? Math.round(totalDeployments / 12)
    : Math.round(totalDeployments / Math.max(weeklyData.length, 1));

  /* ── Category data ────────────────────────────────────────────────────── */
  const categoryData = useMemo(() => {
    const counts = {};
    filteredRecords.forEach((r) => {
      counts[r.type] = (counts[r.type] || 0) + 1;
    });
    return Object.entries(counts)
      .filter(([, c]) => c > 0)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, value]) => ({ name, value }));
  }, [filteredRecords]);

  /* ── Top tanods table ─────────────────────────────────────────────────── */
  const topTanods = useMemo(() => {
    const map = {};
    filteredRecords.forEach((r) => {
      if (!map[r.employeeId]) {
        map[r.employeeId] = { name: r.tanodName, total: 0, resolved: 0, ratings: [] };
      }
      map[r.employeeId].total += 1;
      if (r.status === "resolved") map[r.employeeId].resolved += 1;
      if (r.tanodRating !== null && r.tanodRating !== undefined && !isNaN(Number(r.tanodRating))) {
        map[r.employeeId].ratings.push(Number(r.tanodRating));
      }
    });
    return Object.values(map)
      .map((t) => ({
        ...t,
        avgRating: t.ratings.length
          ? (t.ratings.reduce((a, b) => a + b, 0) / t.ratings.length).toFixed(2)
          : "N/A",
        resolvedPct: t.total > 0 ? ((t.resolved / t.total) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredRecords]);

  /* ── Loading ──────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-700 font-semibold text-sm">Loading tanod analytics...</p>
          <p className="text-gray-500 text-xs mt-1">Fetching deployment history from Firestore</p>
        </div>
      </div>
    );
  }

  /* ── Render ───────────────────────────────────────────────────────────── */
  return (
    <div className="relative min-h-screen bg-linear-to-br from-slate-50 via-indigo-50 to-blue-50">
      {/* Watermark */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: `url(${barangayLogo})`,
          backgroundPosition: "right 35% center",
          backgroundRepeat: "no-repeat",
          backgroundSize: "49%",
          opacity: 0.18,
          filter: "brightness(1.4) contrast(1.1)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/80 backdrop-blur shadow-xl">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-indigo-500/15 blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-pink-500/15 blur-3xl" />

          <div className="relative p-6 md:p-7 flex flex-col md:flex-row md:items-center md:justify-between gap-5">
            <div>
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">Tanod Deployment Analytics</h1>
              <p className="text-sm text-gray-600 font-semibold mt-1">
                Deployment trends, resolution rates, and performance metrics (Firestore Live)
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
                  {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Monthly date filter */}
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
                <p className="text-sm font-semibold text-gray-700">
                  Weekly view shows deployments for <span className="font-extrabold text-indigo-700">{selectedMonth}</span> only.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Employee of the Week ───────────────────────────────────────── */}
        <EmployeeOfTheWeek records={records} />

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Deployments" value={totalDeployments}
            sub={view === "monthly" ? "Date-filtered range" : `For ${selectedMonth}`}
            icon={<Users size={20} />} tone="indigo" pill="TOTAL" />
          <StatCard title="Resolved" value={totalResolved}
            sub="Successfully completed"
            icon={<CheckCircle size={20} />} tone="emerald" pill={`${resolvedPct}%`} />
          <StatCard title="Pending / Other" value={totalPending}
            sub="Not yet resolved"
            icon={<AlertCircle size={20} />} tone="amber" pill={`${(100 - parseFloat(resolvedPct)).toFixed(1)}%`} />
          <StatCard title="Avg. Rating" value={avgRating}
            sub={`From ${ratingsArr.length} rated deployments`}
            icon={<Star size={20} />} tone="violet" pill="★" />
        </div>

        {/* ── Figure 1: Deployment Trend ────────────────────────────────── */}
        <Panel
          icon={<TrendingUp size={18} />}
          title="Figure 1: Deployment Trend Analysis"
          subtitle={view === "monthly"
            ? "Monthly resolved vs pending deployments (date-filtered)"
            : `Weekly breakdown for ${selectedMonth}`}
          headerExtra={<ChartToggle value={chartMode1} onChange={setChartMode1} />}
          rightSlot={
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-extrabold text-gray-700 shadow-sm">
              <Clock size={14} className="text-indigo-600" />
              Avg: {avgPerPeriod} / {view === "monthly" ? "month" : "week"}
            </span>
          }
        >
          <div className="h-[420px] w-full rounded-2xl bg-linear-to-b from-slate-50 to-white p-4 border border-gray-200">
            <ResponsiveContainer>
              {chartMode1 === "bar" ? (
                <ComposedChart data={graphData} margin={{ top: 18, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#4B5563" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} />
                  <YAxis stroke="#4B5563" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 14, fontWeight: 800 }} iconType="circle" />
                  <Bar dataKey="resolved" fill="#10B981" name="Resolved" radius={[10, 10, 0, 0]} />
                  <Bar dataKey="pending"  fill="#F59E0B" name="Pending / Other" radius={[10, 10, 0, 0]} />
                  <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={3} name="Total"
                    dot={{ fill: "#4F46E5", r: 4, strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                </ComposedChart>
              ) : chartMode1 === "line" ? (
                <LineChart data={graphData} margin={{ top: 18, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#4B5563" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} />
                  <YAxis stroke="#4B5563" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 14, fontWeight: 800 }} iconType="circle" />
                  <Line type="monotone" dataKey="resolved" stroke="#10B981" strokeWidth={3} name="Resolved" dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="pending"  stroke="#F59E0B" strokeWidth={3} name="Pending / Other" dot={{ r: 5 }} />
                  <Line type="monotone" dataKey="total"    stroke="#4F46E5" strokeWidth={3} name="Total" dot={{ r: 5 }} />
                </LineChart>
              ) : (
                <AreaChart data={graphData} margin={{ top: 18, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#4B5563" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} />
                  <YAxis stroke="#4B5563" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={{ stroke: "#E5E7EB" }} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 14, fontWeight: 800 }} iconType="circle" />
                  <Area type="monotone" dataKey="resolved" fill="#10B981" fillOpacity={0.15} stroke="#10B981" strokeWidth={2} name="Resolved" />
                  <Area type="monotone" dataKey="pending"  fill="#F59E0B" fillOpacity={0.15} stroke="#F59E0B" strokeWidth={2} name="Pending / Other" />
                  <Area type="monotone" dataKey="total"    fill="#4F46E5" fillOpacity={0.10} stroke="#4F46E5" strokeWidth={2} name="Total" />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* ── Figure 2 + 3 ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Figure 2: Resolution pie */}
          <Panel icon={<PieChart size={18} />} title="Figure 2: Deployment Resolution Status" subtitle="Resolved vs pending share">
            <div className="h-72 rounded-2xl border border-gray-200 bg-linear-to-b from-slate-50 to-white p-4">
              <ResponsiveContainer>
                <RPieChart>
                  <Pie
                    data={[
                      { name: "Resolved",      value: totalResolved },
                      { name: "Pending/Other", value: totalPending  },
                    ]}
                    cx="50%" cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                    outerRadius={92} dataKey="value"
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#F59E0B" />
                  </Pie>
                  <Tooltip />
                </RPieChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          {/* Figure 3: Category distribution */}
          <Panel
            icon={<BarChart3 size={18} />}
            title="Figure 3: Deployment Type Distribution"
            subtitle="Top complaint types handled"
            headerExtra={<ChartToggle value={chartMode3} onChange={setChartMode3} />}
          >
            <div className="h-72 rounded-2xl border border-gray-200 bg-linear-to-b from-slate-50 to-white p-4">
              <ResponsiveContainer>
                {chartMode3 === "bar" ? (
                  <BarChart data={categoryData} layout="vertical" margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 12, fontWeight: 700 }} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11, fontWeight: 700 }} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                ) : chartMode3 === "line" ? (
                  <LineChart data={categoryData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 12, fontWeight: 700 }} allowDecimals={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#4F46E5" strokeWidth={3} dot={{ r: 6, fill: "#4F46E5" }} />
                  </LineChart>
                ) : (
                  <AreaChart data={categoryData} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                    <YAxis tick={{ fontSize: 12, fontWeight: 700 }} allowDecimals={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" fill="#4F46E5" fillOpacity={0.15} stroke="#4F46E5" strokeWidth={2} />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        {/* ── Table 1: Top Tanods ───────────────────────────────────────── */}
        <Panel icon={<Users size={18} />} title="Table 1: Top Tanod Performance" subtitle="Ranked by total deployments">
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200">
                  {["Rank", "Tanod Name", "Total Deployments", "Resolved", "Resolution Rate", "Avg. Rating"].map((h) => (
                    <th key={h} className={`px-5 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-600 ${h === "Rank" || h === "Tanod Name" ? "text-left" : "text-center"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topTanods.length > 0 ? topTanods.map((t, i) => (
                  <tr key={i}
                    className={`border-b border-gray-100 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/60`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-sm">
                        {i + 1}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-extrabold text-gray-900 text-sm">{t.name}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-xl font-extrabold text-gray-900">{t.total}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="text-xl font-extrabold text-emerald-700">{t.resolved}</span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full font-extrabold text-xs">
                        {t.resolvedPct}%
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span className="inline-flex items-center gap-1 justify-center bg-violet-100 text-violet-700 px-4 py-2 rounded-full font-extrabold text-xs">
                        <Star size={12} /> {t.avgRating}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-gray-500 font-semibold">
                      No deployment data available for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* ── Table 2: Top Complaint Categories ────────────────────────── */}
        <Panel icon={<Clock size={18} />} title="Table 2: Top Deployment Categories" subtitle="Ranked by total cases handled">
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="border-b border-gray-200">
                  {["Rank", "Category", "Total Cases", "Percentage"].map((h) => (
                    <th key={h} className={`px-6 py-4 text-[11px] font-extrabold uppercase tracking-wider text-gray-600 ${h === "Rank" ? "text-left" : "text-center"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {categoryData.length > 0 ? (() => {
                  const catTotal = categoryData.reduce((s, c) => s + c.value, 0);
                  return categoryData.map((c, i) => (
                    <tr key={c.name}
                      className={`border-b border-gray-100 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"} hover:bg-indigo-50/60`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-extrabold text-sm">
                          {i + 1}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-extrabold text-gray-900 text-sm">{c.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-xl font-extrabold text-gray-900">{c.value}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full font-extrabold text-xs">
                          {catTotal > 0 ? ((c.value / catTotal) * 100).toFixed(1) : "0.0"}%
                        </span>
                      </td>
                    </tr>
                  ));
                })() : (
                  <tr>
                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500 font-semibold">
                      No category data available for this period
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

export default Reportstanod;