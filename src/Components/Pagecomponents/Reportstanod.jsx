// Reportstanod.jsx - Tanod Deployment Analytics (Firestore)
import React, { useState, useEffect, useMemo } from "react";
import barangayLogo from "../../assets/sanroquelogo.png";

import {
  TrendingUp, Clock, BarChart3, Calendar,
  AlertCircle, CheckCircle, PieChart, Activity, Layers, Star, Users,
  Trophy, Award, Medal, Sparkles, Shield, Zap, MapPin, Moon, Sun,
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
  doc,
  getDoc,
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

/* ── Custom Tooltip for Trend Chart ─────────────────────────────────────────*/
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const resolved = payload.find((p) => p.dataKey === "resolved")?.value || 0;
  const pending  = payload.find((p) => p.dataKey === "pending")?.value  || 0;
  const total    = payload.find((p) => p.dataKey === "total")?.value    || 0;
  return (
    <div className="bg-white/95 backdrop-blur p-4 border border-indigo-200 rounded-2xl shadow-2xl">
      <p className="font-extrabold text-gray-900 mb-3 text-sm border-b pb-2">{label}</p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-6">
          <span className="text-emerald-700 font-bold">Resolved</span>
          <span className="font-extrabold text-emerald-800">{resolved}</span>
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

/* ── Custom Tooltip for Tanod Resolved Chart ─────────────────────────────────*/
const TanodResolvedTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const resolved   = payload.find((p) => p.dataKey === "resolved")?.value    || 0;
  const inProgress = payload.find((p) => p.dataKey === "inProgress")?.value  || 0;
  const total      = resolved + inProgress;
  const rate       = total > 0 ? ((resolved / total) * 100).toFixed(1) : "0.0";
  return (
    <div className="bg-white/95 backdrop-blur p-4 border border-emerald-200 rounded-2xl shadow-2xl max-w-[210px]">
      <p className="font-extrabold text-gray-900 mb-3 text-sm border-b pb-2 wrap-break-words">{label}</p>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between gap-4">
          <span className="text-emerald-700 font-bold">Resolved</span>
          <span className="font-extrabold text-emerald-800">{resolved}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span className="text-indigo-700 font-bold">Total Deployments</span>
          <span className="font-extrabold text-indigo-800">{total}</span>
        </div>
        <div className="pt-2 mt-2 border-t border-gray-200">
          <div className="flex items-center justify-between gap-4">
            <span className="text-violet-700 font-extrabold">Resolution Rate</span>
            <span className="font-extrabold text-violet-900">{rate}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ── Panel ───────────────────────────────────────────────────────────────────*/
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

/* ── StatCard ────────────────────────────────────────────────────────────────*/
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

/* ── Segmented Toggle ────────────────────────────────────────────────────────*/
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

/* ── Chart Mode Toggle ───────────────────────────────────────────────────────*/
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

/* ── Custom X-Axis Tick ──────────────────────────────────────────────────────*/
const TanodXAxisTick = ({ x, y, payload }) => {
  const name = payload?.value || "";
  const parts = name.split(" ");
  const line1 = parts.slice(0, Math.ceil(parts.length / 2)).join(" ");
  const line2 = parts.slice(Math.ceil(parts.length / 2)).join(" ");
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={14} textAnchor="middle" fill="#374151" fontSize={11} fontWeight={700}>
        {line1}
      </text>
      {line2 && (
        <text x={0} y={0} dy={27} textAnchor="middle" fill="#374151" fontSize={11} fontWeight={700}>
          {line2}
        </text>
      )}
    </g>
  );
};

/* ── Custom Bar Label ────────────────────────────────────────────────────────*/
const ResolvedBarLabel = ({ x, y, width, value }) => {
  if (!value) return null;
  return (
    <text x={x + width / 2} y={y - 6} textAnchor="middle" fill="#065F46" fontSize={12} fontWeight={800}>
      {value}
    </text>
  );
};

/* ── Avatar Component ────────────────────────────────────────────────────────*/
const TanodAvatar = ({ avatar, name, size = "lg", ring = "ring-4 ring-amber-200" }) => {
  const initials = (name || "")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const sizeClasses = {
    lg: "w-28 h-28",
    md: "w-12 h-12",
    sm: "w-10 h-10",
  };

  const textSizes = {
    lg: "text-3xl",
    md: "text-base",
    sm: "text-sm",
  };

  if (avatar && avatar.startsWith("data:image")) {
    return (
      <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${ring} shadow-2xl border-2 border-white shrink-0`}>
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => { e.target.style.display = "none"; e.target.parentNode.classList.add("show-fallback"); }}
        />
      </div>
    );
  }

  return (
    <div className={`${sizeClasses[size]} rounded-full bg-linear-to-br from-amber-400 to-yellow-500 flex items-center justify-center ${ring} shadow-2xl border-2 border-white shrink-0`}>
      <span className={`${textSizes[size]} font-extrabold text-white`}>{initials}</span>
    </div>
  );
};

/* ── Position Badge ──────────────────────────────────────────────────────────*/
const PositionBadge = ({ position }) => {
  if (!position) return null;
  const pos = position.toUpperCase();

  const configs = {
    "BHW": { bg: "bg-rose-100 border-rose-300", text: "text-rose-800", icon: <Shield size={11} />, label: "BHW" },
    "TANOD": { bg: "bg-indigo-100 border-indigo-300", text: "text-indigo-800", icon: <Shield size={11} />, label: "Tanod" },
    "KAGAWAD": { bg: "bg-violet-100 border-violet-300", text: "text-violet-800", icon: <Star size={11} />, label: "Kagawad" },
    "SK": { bg: "bg-emerald-100 border-emerald-300", text: "text-emerald-800", icon: <Zap size={11} />, label: "SK" },
  };

  const cfg = Object.entries(configs).find(([k]) => pos.includes(k))?.[1] || {
    bg: "bg-gray-100 border-gray-300", text: "text-gray-700", icon: <Shield size={11} />, label: position,
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${cfg.bg} ${cfg.text}`}>
      {cfg.icon}
      {cfg.label}
    </span>
  );
};

/* ── Shift Badge ─────────────────────────────────────────────────────────────*/
const ShiftBadge = ({ shift }) => {
  if (!shift) return null;
  const isNight = (shift || "").toLowerCase().includes("night");
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
      isNight
        ? "bg-slate-800 border-slate-700 text-slate-100"
        : "bg-amber-50 border-amber-300 text-amber-800"
    }`}>
      {isNight ? <Moon size={11} /> : <Sun size={11} />}
      {shift.charAt(0).toUpperCase() + shift.slice(1)} Shift
    </span>
  );
};

/* ── Star Rating Display ─────────────────────────────────────────────────────*/
const StarRating = ({ value, max = 5 }) => {
  const num = parseFloat(value) || 0;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.floor(num);
        const partial = !filled && i < num;
        return (
          <span key={i} className="relative inline-block">
            <Star
              size={14}
              className="text-gray-200"
              fill="currentColor"
            />
            {(filled || partial) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: filled ? "100%" : `${(num % 1) * 100}%` }}
              >
                <Star size={14} className="text-amber-400" fill="currentColor" />
              </span>
            )}
          </span>
        );
      })}
      <span className="ml-1 text-xs font-extrabold text-gray-700">{num > 0 ? num.toFixed(2) : "N/A"}</span>
    </div>
  );
};

/* ── Employee of the Week Card ───────────────────────────────────────────────*/
const EmployeeOfTheWeek = ({ records, employeeProfiles }) => {
  const tanodMap = {};
  records.forEach((r) => {
    if (!tanodMap[r.employeeId]) {
      tanodMap[r.employeeId] = { name: r.tanodName, total: 0, resolved: 0, ratings: [] };
    }
    tanodMap[r.employeeId].total += 1;
    if (r.status === "resolved") tanodMap[r.employeeId].resolved += 1;
    if (r.tanodRating !== null && r.tanodRating !== undefined && !isNaN(Number(r.tanodRating))) {
      tanodMap[r.employeeId].ratings.push(Number(r.tanodRating));
    }
  });

  const ranked = Object.entries(tanodMap)
    .map(([empId, t]) => ({
      ...t,
      empId,
      profile: employeeProfiles[empId] || null,
      avgRating: t.ratings.length
        ? (t.ratings.reduce((a, b) => a + b, 0) / t.ratings.length)
        : 0,
      resolvedPct: t.total > 0 ? ((t.resolved / t.total) * 100).toFixed(1) : "0.0",
    }))
    .sort((a, b) => b.resolved - a.resolved || b.avgRating - a.avgRating);

  const winner    = ranked[0] || null;
  const runnerUps = ranked.slice(1, 4);

  const medalConfigs = [
    { ring: "ring-amber-300", bg: "from-amber-50 to-yellow-50", border: "border-amber-200", text: "text-amber-700", badge: "bg-amber-100 text-amber-800 border-amber-300", rankIcon: <Trophy size={13} className="text-amber-600" /> },
    { ring: "ring-slate-300", bg: "from-slate-50 to-gray-50",   border: "border-slate-200", text: "text-slate-700", badge: "bg-slate-100 text-slate-700 border-slate-300",  rankIcon: <Medal size={13} className="text-slate-500" /> },
    { ring: "ring-orange-300", bg: "from-orange-50 to-amber-50", border: "border-orange-200", text: "text-orange-700", badge: "bg-orange-100 text-orange-800 border-orange-300", rankIcon: <Award size={13} className="text-orange-500" /> },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl border border-amber-200/80 bg-linear-to-br from-amber-50/90 via-yellow-50/80 to-white shadow-2xl">
      {/* Decorative orbs */}
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-yellow-400/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-amber-300/15 blur-3xl pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-linear-to-r from-amber-400 via-yellow-400 to-amber-300 rounded-t-3xl" />

      {/* Header */}
      <div className="relative px-6 py-5 border-b border-amber-200/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-linear-to-br from-amber-400 to-yellow-500 text-white flex items-center justify-center shadow-lg">
            <Trophy size={20} />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-extrabold text-gray-900 leading-tight">Top Employee</h3>
            <p className="text-xs text-amber-700 font-semibold mt-0.5">Most resolved complaints · All-Time Overall</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 border border-amber-200 text-amber-700 text-xs font-extrabold shadow-sm">
          <Sparkles size={12} /> Overall
        </span>
      </div>

      <div className="relative p-6">
        {!winner ? (
          <div className="text-center py-12 text-gray-500 font-semibold text-sm">
            No deployment data available yet.
          </div>
        ) : (
          <div className="flex flex-col xl:flex-row gap-6">

            {/* ── Winner Spotlight ── */}
            <div className="flex-1 relative overflow-hidden rounded-2xl border-2 border-amber-300/80 bg-linear-to-br from-amber-50 via-yellow-50 to-white shadow-xl">
              {/* Subtle pattern */}
              <div className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `radial-linear(circle at 20px 20px, #F59E0B 1px, transparent 0)`,
                  backgroundSize: "40px 40px",
                }} />

              <div className="relative p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">

                {/* Avatar column */}
                <div className="flex flex-col items-center gap-3 shrink-0">
                  <div className="relative">
                    {/* Crown decoration */}
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-2xl select-none z-10">👑</div>
                    <TanodAvatar
                      avatar={winner.profile?.avatar}
                      name={winner.name}
                      size="lg"
                      ring="ring-4 ring-amber-300"
                    />
                    {/* Gold #1 badge */}
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-linear-to-br from-amber-400 to-yellow-500 border-2 border-white flex items-center justify-center shadow-md">
                      <Trophy size={14} className="text-white" />
                    </div>
                  </div>

                  {/* Deployment status pill */}
                  {winner.profile?.deploymentStatus && (
                    <span className={`text-[11px] font-extrabold px-2.5 py-1 rounded-full border ${
                      winner.profile.deploymentStatus === "available"
                        ? "bg-emerald-100 border-emerald-300 text-emerald-800"
                        : "bg-rose-100 border-rose-300 text-rose-800"
                    }`}>
                      {winner.profile.deploymentStatus === "available" ? "● Available" : "● Deployed"}
                    </span>
                  )}
                </div>

                {/* Info column */}
                <div className="flex-1 min-w-0">
                  {/* Name & badges row */}
                  <div className="mb-3">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 mb-1">🏆 Top Performer</p>
                    <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight mb-2">{winner.name}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                      {winner.profile?.position && <PositionBadge position={winner.profile.position} />}
                      {winner.profile?.shift && <ShiftBadge shift={winner.profile.shift} />}
                      {winner.profile?.purok && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold border bg-blue-50 border-blue-200 text-blue-800">
                          <MapPin size={10} /> Purok {winner.profile.purok}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Star rating */}
                  <div className="mb-4">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-gray-500 mb-1">Resident Rating</p>
                    <StarRating value={winner.avgRating} />
                  </div>

                  {/* KPI mini-grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Resolved", value: winner.resolved, sub: "overall", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
                      { label: "Total", value: winner.total, sub: "deployments", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-200" },
                      { label: "Rate", value: `${winner.resolvedPct}%`, sub: "resolution", color: "text-violet-700", bg: "bg-violet-50 border-violet-200" },
                    ].map((s) => (
                      <div key={s.label} className={`rounded-xl border p-2.5 text-center ${s.bg}`}>
                        <p className={`text-xl font-extrabold ${s.color}`}>{s.value}</p>
                        <p className="text-[9px] font-extrabold text-gray-600 uppercase tracking-wider mt-0.5">{s.label}</p>
                        <p className="text-[9px] text-gray-400 font-semibold">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  {/* Resolution bar */}
                  <div className="mt-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-extrabold text-gray-600 uppercase tracking-wider">Resolution Rate</span>
                      <span className="text-xs font-extrabold text-emerald-700">{winner.resolvedPct}%</span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-gray-100 border border-gray-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-emerald-400 to-emerald-600 transition-all duration-700"
                        style={{ width: `${winner.resolvedPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right panel: Runner-ups + Summary ── */}
            <div className="xl:w-80 flex flex-col gap-4">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-gray-500">Runner-ups</p>

              {runnerUps.map((t, i) => {
                const mc = medalConfigs[i] || medalConfigs[2];
                return (
                  <div key={t.name}
                    className={`relative overflow-hidden rounded-2xl border bg-linear-to-br ${mc.bg} ${mc.border} p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow`}>
                    {/* Rank badge */}
                    <div className={`shrink-0 w-9 h-9 rounded-full border flex items-center justify-center ${mc.badge}`}>
                      {mc.rankIcon}
                    </div>

                    {/* Avatar */}
                    <TanodAvatar
                      avatar={t.profile?.avatar}
                      name={t.name}
                      size="sm"
                      ring="ring-2 ring-white"
                    />

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <p className={`font-extrabold text-sm ${mc.text} truncate`}>{t.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        {t.profile?.position && (
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border ${mc.badge}`}>
                            {t.profile.position}
                          </span>
                        )}
                        <span className="text-[10px] text-gray-500 font-semibold">
                          {t.resolved} resolved · {t.resolvedPct}%
                        </span>
                      </div>
                    </div>

                    {/* Total */}
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-extrabold text-gray-900">{t.total}</p>
                      <p className="text-[10px] text-gray-400 font-semibold">deploys</p>
                    </div>
                  </div>
                );
              })}

              {/* Overall summary card */}
              <div className="mt-auto rounded-2xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-white p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                    <Users size={12} />
                  </div>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700">Overall Summary</p>
                </div>
                <div className="space-y-2">
                  {[
                    { label: "Total tanods active", value: ranked.length, color: "text-gray-900" },
                    { label: "Total deployments", value: records.length, color: "text-gray-900" },
                    { label: "Total resolved", value: records.filter(r => r.status === "resolved").length, color: "text-emerald-700" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center text-xs font-semibold text-gray-600">
                      <span>{row.label}</span>
                      <span className={`font-extrabold ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Component ──────────────────────────────────────────────────────────*/
const Reportstanod = () => {
  const [view, setView] = useState("monthly");
  const [chartMode3, setChartMode3] = useState("bar");
  const [selectedMonth, setSelectedMonth] = useState("January");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setMonth(0); d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [rangeError, setRangeError] = useState("");
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  /* NEW: store employee profile data (avatar, position, shift, purok, etc.) */
  const [employeeProfiles, setEmployeeProfiles] = useState({});

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

  /* ── Firestore listener ───────────────────────────────────────────────── */
  useEffect(() => {
    setLoading(true);

    const employeeNameMap = {};
    const historyRecords  = {};
    const complaintRecords = {};
    const innerUnsubs     = [];

    const rebuildRecords = () => {
      const histFlat = Object.values(historyRecords).flat();
      const coveredComplaintIds = new Set(histFlat.map((r) => r.complaintId).filter(Boolean));
      const complaintFlat = Object.values(complaintRecords)
        .flat()
        .filter((r) => !coveredComplaintIds.has(r.complaintId));
      setRecords([...histFlat, ...complaintFlat]);
      setLoading(false);
    };

    // ── 1. Listen to complaints ──
    const complaintsRef = collection(firestore, "complaints");
    const unsubComplaints = onSnapshot(complaintsRef, (snap) => {
      Object.keys(complaintRecords).forEach((k) => delete complaintRecords[k]);

      snap.forEach((cDoc) => {
        const c = cDoc.data();
        const rawStatus = (c.status || "").toLowerCase();
        if (rawStatus === "resolved") return;

        const date =
          parseIsoOrNull(c.deployedAt) ||
          parseIsoOrNull(c.createdAt)  ||
          parseIsoOrNull(c.timestamp)  ||
          parseIsoOrNull(c.dateCreated)||
          parseIsoOrNull(c.date);
        if (!date) return;

        const rawTanods =
          c.deployedTanods    ||
          c.assignedTanods    ||
          c.tanods            ||
          c.deployedTo        ||
          c.respondingTanods  ||
          [];

        const singleTanod = c.deployedTanod || c.assignedTanod || null;
        const allRefs = [
          ...( Array.isArray(rawTanods) ? rawTanods : Object.values(rawTanods) ),
          ...(singleTanod ? [singleTanod] : []),
        ];

        if (!allRefs.length) return;

        allRefs.forEach((tanodRef) => {
          const empId =
            typeof tanodRef === "string"
              ? tanodRef
              : tanodRef.id         ||
                tanodRef.employeeId ||
                tanodRef.uid        ||
                tanodRef.tanodId    ||
                null;

          if (!empId) return;

          const tanodName =
            (typeof tanodRef === "object" && (tanodRef.name || tanodRef.tanodName || tanodRef.fullName))
              ? (tanodRef.name || tanodRef.tanodName || tanodRef.fullName)
              : (employeeNameMap[empId] || "Unknown");

          const key = `complaint_${cDoc.id}_${empId}`;

          complaintRecords[key] = [{
            id:              key,
            complaintId:     cDoc.id,
            tanodName,
            employeeId:      empId,
            status:          "in_progress",
            type:            formatType(c.type || c.issueType || c.complaintType),
            rawType:         (c.type || c.issueType || c.complaintType || "unknown").toLowerCase(),
            month:           date.getMonth(),
            week:            getWeekOfMonth(date),
            date,
            tanodRating:     null,
            complainantName: c.complainantName || c.name || c.complainant || "",
            description:     c.description || c.details || "",
            incidentPurok:   c.purok || c.incidentPurok || c.location || "",
            deployedAt:      parseIsoOrNull(c.deployedAt),
            resolvedAt:      null,
          }];
        });
      });

      rebuildRecords();
    }, (err) => console.error("Complaints listener error:", err));

    innerUnsubs.push(unsubComplaints);

    // ── 2. Listen to employees ──
    const employeesRef = collection(firestore, "employee");
    const unsubEmployees = onSnapshot(
      employeesRef,
      (snap) => {
        // Collect all profiles for the Top Employee card
        const profiles = {};

        snap.forEach((empDoc) => {
          const empId   = empDoc.id;
          const empData = empDoc.data();
          const suffix  = empData.suffix ? ` ${empData.suffix}` : "";
          const tanodName = `${empData.firstName || ""} ${empData.lastName || ""}${suffix}`.trim() || "Unknown";

          employeeNameMap[empId] = tanodName;

          // Store full profile for UI display
          profiles[empId] = {
            avatar:           empData.avatar || null,
            position:         empData.position || null,
            shift:            empData.shift || null,
            purok:            empData.purok || null,
            deploymentStatus: empData.deploymentStatus || null,
            number:           empData.number || null,
          };

          const histRef   = collection(firestore, "employee", empId, "deploymentHistory");
          const unsubHist = onSnapshot(histRef, (histSnap) => {
            historyRecords[empId] = [];
            histSnap.forEach((hDoc) => {
              const h    = hDoc.data();
              const date = parseIsoOrNull(h.deployedAt) || parseIsoOrNull(h.resolvedAt);
              if (!date) return;

              const rawSt  = (h.status || "unknown").toLowerCase();
              const status = rawSt === "resolved" ? "resolved" : "in_progress";

              historyRecords[empId].push({
                id:              hDoc.id,
                complaintId:     h.complaintId || null,
                tanodName,
                employeeId:      empId,
                status,
                type:            formatType(h.type),
                rawType:         (h.type || "unknown").toLowerCase(),
                month:           date.getMonth(),
                week:            getWeekOfMonth(date),
                date,
                tanodRating:     h.tanodRating ?? null,
                complainantName: h.complainantName || "",
                description:     h.description || "",
                incidentPurok:   h.incidentPurok || "",
                deployedAt:      parseIsoOrNull(h.deployedAt),
                resolvedAt:      parseIsoOrNull(h.resolvedAt),
              });
            });
            rebuildRecords();
          });
          innerUnsubs.push(unsubHist);
        });

        // Update employee profiles state
        setEmployeeProfiles({ ...profiles });
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

  const resolvedPct  = totalDeployments > 0 ? ((totalResolved / totalDeployments) * 100).toFixed(1) : "0.0";
  const avgPerPeriod = view === "monthly"
    ? Math.round(totalDeployments / 12)
    : Math.round(totalDeployments / 4);

  /* ── Per-Tanod Resolved Chart Data ───────────────────────────────────── */
  const tanodResolvedData = useMemo(() => {
    const map = {};
    filteredRecords.forEach((r) => {
      if (!map[r.employeeId]) {
        map[r.employeeId] = { name: r.tanodName, resolved: 0, inProgress: 0 };
      }
      if (r.status === "resolved") {
        map[r.employeeId].resolved += 1;
      } else {
        map[r.employeeId].inProgress += 1;
      }
    });
    return Object.values(map)
      .sort((a, b) => b.resolved - a.resolved)
      .map((t) => ({
        name:       t.name,
        resolved:   t.resolved,
        inProgress: t.inProgress,
        total:      t.resolved + t.inProgress,
      }));
  }, [filteredRecords]);

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
          <p className="text-gray-700 font-semibold text-sm">Loading Employee analytics...</p>
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
              <h1 className="text-xl md:text-2xl font-extrabold text-gray-900">Employee Deployment Analytics</h1>
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
        <EmployeeOfTheWeek records={records} employeeProfiles={employeeProfiles} />

        {/* ── KPI Cards ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Total Deployments" value={totalDeployments}
            sub={view === "monthly" ? "Date-filtered range" : `For ${selectedMonth}`}
            icon={<Users size={20} />} tone="indigo" pill="TOTAL" />
          <StatCard title="Resolved" value={totalResolved}
            sub="Successfully completed"
            icon={<CheckCircle size={20} />} tone="emerald" pill={`${resolvedPct}%`} />
          <StatCard title="Avg. Rating" value={avgRating}
            sub={`From ${ratingsArr.length} rated deployments`}
            icon={<Star size={20} />} tone="violet" pill="★" />
        </div>

        {/* ── Figure 1: Per-Tanod Resolved Count Bar Chart ──────────────── */}
        <Panel
          icon={<Users size={18} />}
          title="Figure 1: Tanod Resolved Deployments"
          subtitle={
            view === "monthly"
              ? "Number of resolved cases per tanod (date-filtered)"
              : `Resolved cases per tanod for ${selectedMonth}`
          }
          rightSlot={
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-extrabold text-gray-700 shadow-sm">
              <CheckCircle size={14} className="text-emerald-600" />
              {totalResolved} total resolved
            </span>
          }
        >
          {tanodResolvedData.length === 0 ? (
            <div className="h-[420px] flex items-center justify-center rounded-2xl bg-slate-50 border border-gray-200">
              <p className="text-gray-500 font-semibold text-sm">No resolved deployment data available for this period.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-linear-to-b from-slate-50 to-white p-4 border border-gray-200 overflow-x-auto">
              <div style={{ minWidth: Math.max(tanodResolvedData.length * 90, 400), height: 420 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={tanodResolvedData}
                    margin={{ top: 30, right: 24, left: 0, bottom: 60 }}
                    barCategoryGap="30%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={<TanodXAxisTick />}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickLine={false}
                      interval={0}
                      height={60}
                    />
                    <YAxis
                      stroke="#4B5563"
                      tick={{ fontSize: 12, fontWeight: 700 }}
                      axisLine={{ stroke: "#E5E7EB" }}
                      tickLine={false}
                      allowDecimals={false}
                      label={{
                        value: "No. of Resolved",
                        angle: -90,
                        position: "insideLeft",
                        offset: 10,
                        style: { fontSize: 11, fontWeight: 800, fill: "#6B7280" },
                      }}
                    />
                    <Tooltip content={<TanodResolvedTooltip />} cursor={{ fill: "#EEF2FF" }} />
                    <Legend
                      wrapperStyle={{ paddingTop: 16, fontWeight: 800, fontSize: 12 }}
                      iconType="circle"
                    />
                    <Bar
                      dataKey="resolved"
                      name="Resolved"
                      fill="#10B981"
                      radius={[10, 10, 0, 0]}
                      label={<ResolvedBarLabel />}
                    >
                      {tanodResolvedData.map((_, i) => (
                        <Cell key={i} fill={`hsl(${160 - i * 12}, 70%, ${42 + i * 3}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {tanodResolvedData.length > 0 && (
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {tanodResolvedData.slice(0, 4).map((t, i) => (
                <div key={t.name} className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 flex items-center gap-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-extrabold shadow">
                    {i + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-gray-800 truncate">{t.name.split(" ")[0]}</p>
                    <p className="text-[11px] text-emerald-700 font-extrabold">{t.resolved} resolved</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        {/* ── Figure 2 + 3 ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Figure 2: Per-Tanod Resolution Rate Pie */}
          <Panel icon={<PieChart size={18} />} title="Figure 2: Tanod Resolution Rate" subtitle="Each tanod's share of resolved deployments">
            <div className="rounded-2xl border border-gray-200 bg-linear-to-b from-slate-50 to-white p-4">
              {tanodResolvedData.length === 0 ? (
                <div className="h-64 flex items-center justify-center">
                  <p className="text-gray-500 font-semibold text-sm">No data available for this period.</p>
                </div>
              ) : (() => {
                const pieData = tanodResolvedData.map((t) => ({
                  name:  t.name,
                  value: t.resolved,
                  rate:  (t.resolved + t.inProgress) > 0
                    ? ((t.resolved / (t.resolved + t.inProgress)) * 100).toFixed(1)
                    : "0.0",
                }));
                const PIE_COLORS = [
                  "#10B981","#4F46E5","#F59E0B","#06B6D4",
                  "#EF4444","#8B5CF6","#EC4899","#14B8A6",
                  "#F97316","#6366F1","#84CC16","#0EA5E9",
                ];
                return (
                  <div className="flex flex-col gap-4">
                    <div style={{ height: 280 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={44}
                            dataKey="value"
                            labelLine={false}
                            label={false}
                          >
                            {pieData.map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ active, payload }) => {
                              if (!active || !payload?.length) return null;
                              const d = payload[0].payload;
                              return (
                                <div className="bg-white/95 backdrop-blur p-3 border border-gray-200 rounded-xl shadow-xl text-sm">
                                  <p className="font-extrabold text-gray-900 mb-1 border-b pb-1">{d.name}</p>
                                  <div className="space-y-1">
                                    <div className="flex justify-between gap-6">
                                      <span className="text-emerald-700 font-bold">Resolved</span>
                                      <span className="font-extrabold">{d.value}</span>
                                    </div>
                                    <div className="flex justify-between gap-6">
                                      <span className="text-violet-700 font-bold">Resolution Rate</span>
                                      <span className="font-extrabold">{d.rate}%</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }}
                          />
                        </RPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {pieData.map((d, i) => (
                        <div key={d.name} className="flex items-center gap-2 bg-white rounded-xl border border-gray-100 px-3 py-2 shadow-sm">
                          <span className="shrink-0 w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                          <span className="text-xs font-extrabold text-gray-800 truncate flex-1">{d.name}</span>
                          <span className="shrink-0 text-[11px] font-extrabold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] + "22", color: PIE_COLORS[i % PIE_COLORS.length] }}>
                            {d.rate}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
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