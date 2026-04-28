"use client";
// app/analytics/page.tsx — Impact analytics dashboard

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area,
  PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { AppShell }          from "@/components/layout/AppShell";
import { StatCard }          from "@/components/ui/Badges";
import { cn }                from "@/lib/utils";
import { dashboardService }  from "@/lib/api/tasks.service";
import type { DashboardStats } from "@/types/api.types";

// ── Chart data helpers ────────────────────────────────────────

function genTrend() {
  return ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, i) => ({
    day,
    critical: Math.floor(3 + Math.sin(i)*2 + Math.random()*3),
    moderate: Math.floor(6 + Math.cos(i)*3 + Math.random()*4),
    low:      Math.floor(4 + Math.random()*3),
  }));
}
function genZone() {
  return ["Ward 1","Ward 2","Ward 3","Ward 4","Ward 5","Ward 6"].map((zone) => ({
    zone,
    needs:      Math.floor(5  + Math.random()*15),
    volunteers: Math.floor(3  + Math.random()*10),
    matched:    Math.floor(2  + Math.random()*12),
  }));
}
function genUtil() {
  return ["08:00","10:00","12:00","14:00","16:00","18:00","20:00"].map((time) => ({
    time,
    utilisation: Math.floor(55 + Math.random()*35),
    dispatched:  Math.floor(3  + Math.random()*10),
  }));
}
const PIE_DATA = [
  { name:"Food",      value:28, color:"#f59e0b" },
  { name:"Medical",   value:22, color:"#ef4444" },
  { name:"Water",     value:15, color:"#38bdf8" },
  { name:"Shelter",   value:12, color:"#8b5cf6" },
  { name:"Education", value:10, color:"#6366f1" },
  { name:"Other",     value:13, color:"#64748b" },
];

// ── Custom tooltip ────────────────────────────────────────────
const Tip = ({ active, payload, label }: { active?: boolean; payload?: {name:string;value:number;color:string}[]; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-white/[0.1] bg-[#111827] px-3 py-2.5 shadow-xl">
      <p className="text-xs font-mono text-slate-400 mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
          <span className="text-xs text-slate-300 capitalize">{p.name}:</span>
          <span className="text-xs font-mono text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

function Card({ title, sub, children, className }: { title:string; sub?:string; children:React.ReactNode; className?:string }) {
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, ease:[0.22,1,0.36,1] }}
      className={cn("rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5", className)}>
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {sub && <p className="text-xs text-slate-500 mt-0.5">{sub}</p>}
      </div>
      {children}
    </motion.div>
  );
}

type Range = "7d"|"30d"|"90d";

export default function AnalyticsPage() {
  const [range,    setRange]    = useState<Range>("7d");
  const [stats,    setStats]    = useState<DashboardStats|null>(null);
  const [loading,  setLoading]  = useState(true);

  const trendData = genTrend();
  const zoneData  = genZone();
  const utilData  = genUtil();

  useEffect(() => {
    dashboardService.getStats().then(setStats).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  const axisProps = { fill:"#64748b", fontSize:11, fontFamily:"DM Mono" };

  return (
    <AppShell title="Analytics">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
        <p className="text-sm text-slate-400">Impact overview · AI Social OS</p>
        <div className="flex items-center gap-3">
          {/* Range picker */}
          <div className="flex gap-1 p-1 rounded-xl border border-white/[0.07] bg-white/[0.03]">
            {(["7d","30d","90d"] as Range[]).map((r) => (
              <button key={r} onClick={()=>setRange(r)} className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-all",
                range===r ? "bg-white/[0.1] text-slate-200 border border-white/[0.12]" : "text-slate-500 hover:text-slate-300")}>
                {r}
              </button>
            ))}
          </div>
          <motion.button whileTap={{scale:0.96}}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-slate-200 border border-white/[0.07] hover:border-white/[0.14] hover:bg-white/[0.04] transition-all">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Export
          </motion.button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {loading || !stats ? (
          Array.from({length:4}).map((_,i)=>(
            <div key={i} className="h-28 rounded-2xl bg-white/[0.04] border border-white/[0.07] animate-pulse"/>
          ))
        ) : (<>
          <StatCard label="People Reached" value={stats.people_reached_today} sub="today" accent="emerald"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>}/>
          <StatCard label="Active Tasks" value={stats.active_tasks} sub="in progress" accent="amber"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>}/>
          <StatCard label="Utilisation" value={`${Math.round((stats.available_volunteers/Math.max(stats.total_volunteers,1))*100)}%`} sub="volunteer rate" accent="violet"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>}/>
          <StatCard label="Avg Dispatch" value={`${stats.avg_dispatch_minutes}m`} sub="vs 45m baseline" accent="sky" trend="down" trendValue="-91%"
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}/>
        </>)}
      </div>

      {/* Row 1: trend + pie */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        <Card title="Need Volume Trend" sub={`Weekly breakdown by urgency · last ${range}`} className="xl:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trendData} margin={{top:4,right:12,bottom:0,left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="day" tick={axisProps} axisLine={false} tickLine={false}/>
              <YAxis tick={axisProps} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:"#64748b",paddingTop:12}}/>
              <Line type="monotone" dataKey="critical" stroke="#ef4444" strokeWidth={2} dot={false} activeDot={{r:4,fill:"#ef4444"}}/>
              <Line type="monotone" dataKey="moderate" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{r:4,fill:"#f59e0b"}}/>
              <Line type="monotone" dataKey="low"      stroke="#22c55e" strokeWidth={2} dot={false} activeDot={{r:4,fill:"#22c55e"}}/>
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Need Type Breakdown" sub="Distribution by category">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={PIE_DATA} cx="50%" cy="50%" innerRadius={50} outerRadius={78} paddingAngle={3} dataKey="value">
                {PIE_DATA.map((e,i)=><Cell key={i} fill={e.color} opacity={0.85}/>)}
              </Pie>
              <Tooltip content={<Tip/>}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3">
            {PIE_DATA.map(({name,value,color})=>(
              <div key={name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{background:color}}/>
                <span className="text-[10px] text-slate-400 flex-1 truncate">{name}</span>
                <span className="text-[10px] font-mono text-slate-500">{value}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2: zone + utilisation */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card title="Zone Coverage" sub="Needs vs volunteers vs matched per ward">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={zoneData} margin={{top:4,right:12,bottom:0,left:-20}}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="zone" tick={axisProps} axisLine={false} tickLine={false}/>
              <YAxis tick={axisProps} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Legend iconType="square" iconSize={8} wrapperStyle={{fontSize:11,color:"#64748b",paddingTop:12}}/>
              <Bar dataKey="needs"      fill="#ef4444" opacity={0.75} radius={[3,3,0,0]}/>
              <Bar dataKey="volunteers" fill="#38bdf8" opacity={0.75} radius={[3,3,0,0]}/>
              <Bar dataKey="matched"    fill="#34d399" opacity={0.85} radius={[3,3,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Volunteer Utilisation" sub="Dispatch rate across the day">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={utilData} margin={{top:4,right:12,bottom:0,left:-20}}>
              <defs>
                <linearGradient id="uG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.02}/>
                </linearGradient>
                <linearGradient id="dG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#38bdf8" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.02}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)"/>
              <XAxis dataKey="time" tick={axisProps} axisLine={false} tickLine={false}/>
              <YAxis tick={axisProps} axisLine={false} tickLine={false}/>
              <Tooltip content={<Tip/>}/>
              <Legend iconType="circle" iconSize={8} wrapperStyle={{fontSize:11,color:"#64748b",paddingTop:12}}/>
              <Area type="monotone" dataKey="utilisation" stroke="#8b5cf6" strokeWidth={2} fill="url(#uG)" dot={false} activeDot={{r:4}}/>
              <Area type="monotone" dataKey="dispatched"  stroke="#38bdf8" strokeWidth={2} fill="url(#dG)" dot={false} activeDot={{r:4}}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Footer */}
      <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.4}}
        className="mt-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-5 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span className="text-xs text-slate-400">AI Social OS · Google Solution Challenge 2026</span>
        </div>
        <span className="text-xs text-slate-600 font-mono">SDG 1 · SDG 2 · SDG 3 · SDG 17 · Hungarian Algorithm + spaCy + Claude Haiku</span>
      </motion.div>
    </AppShell>
  );
}