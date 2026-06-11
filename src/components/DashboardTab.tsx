"use client";
import { useState, useMemo } from "react";
import { 
  Users, Briefcase, Activity, TrendingUp, ChevronRight, X, MapPin, 
  Calendar, User, MessageSquare, Download, FileText, CheckCircle, 
  Target, Award, PieChart, BarChart3, LineChart, MoreHorizontal,
  ArrowUp, ArrowDown, Minus, CalendarPlus, UserPlus, Plus, ChevronDown, Heart
} from "lucide-react";
import { getBadgeClass, formatDate } from "../lib/constants";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';

const OUTCOMES = ["Sold", "Interested", "Follow-up", "Not Interested", "Other"];
const OUTCOME_COLORS: Record<string, string> = {
  Sold: "#10b981", Interested: "#6366f1", "Follow-up": "#f59e0b",
  "Not Interested": "#f43f5e", Other: "#8b5cf6",
};

const normalizeOutcome = (outcome?: string) => {
  if (!outcome) return "Other";
  const lower = outcome.toLowerCase();
  if (lower === "sold") return "Sold";
  if (lower === "interested") return "Interested";
  if (lower === "follow-up") return "Follow-up";
  if (lower === "not interested") return "Not Interested";
  return "Other";
};

export default function DashboardTab({ 
  users = [], 
  customers = [], 
  visits = [],
  setActiveTab
}: { 
  users: any[]; 
  customers: any[]; 
  visits: any[];
  setActiveTab?: (tab: string) => void;
}) {
  const now = useMemo(() => new Date(), []);
  const todayStr = now.toDateString();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthAgo = new Date(now.getTime() - 30 * 86400000);

  const admins = useMemo(() => users.filter(u => u.role === "Admin"), [users]);
  const reps = useMemo(() => users.filter(u => u.role === "Rep"), [users]);
  const activeCustomers = useMemo(() => customers.filter(c => c.status === "Active"), [customers]);
  
  const newCustomers = useMemo(() => customers.filter(c => {
    if (!c.createdAt) return false;
    const d = c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000) : new Date(c.createdAt);
    return d >= monthAgo;
  }), [customers, monthAgo]);

  const newCustomersPreviousMonth = useMemo(() => {
    const twoMonthsAgo = new Date(now.getTime() - 60 * 86400000);
    return customers.filter(c => {
      if (!c.createdAt) return false;
      const d = c.createdAt?.seconds ? new Date(c.createdAt.seconds * 1000) : new Date(c.createdAt);
      return d >= twoMonthsAgo && d < monthAgo;
    });
  }, [customers, monthAgo, now]);

  const weekVisits = useMemo(() => visits.filter(v => {
    const d = v.date?.seconds ? new Date(v.date.seconds * 1000) : v.date ? new Date(v.date) : null;
    return d && d >= weekAgo;
  }), [visits, weekAgo]);

  const visitsLastWeek = useMemo(() => {
    const twoWeeksAgo = new Date(now.getTime() - 14 * 86400000);
    return visits.filter(v => {
      const d = v.date?.seconds ? new Date(v.date.seconds * 1000) : v.date ? new Date(v.date) : null;
      return d && d >= twoWeeksAgo && d < weekAgo;
    });
  }, [visits, weekAgo, now]);

  const soldVisits = useMemo(() => visits.filter(v => normalizeOutcome(v.outcome) === "Sold"), [visits]);
  
  const soldVisitsPreviousMonth = useMemo(() => {
    const twoMonthsAgo = new Date(now.getTime() - 60 * 86400000);
    return visits.filter(v => {
      const d = v.date?.seconds ? new Date(v.date.seconds * 1000) : v.date ? new Date(v.date) : null;
      return d && d >= twoMonthsAgo && d < monthAgo && normalizeOutcome(v.outcome) === "Sold";
    });
  }, [visits, monthAgo, now]);

  const convRate = visits.length > 0 ? ((soldVisits.length / visits.length) * 100).toFixed(1) : "0.0";
  
  const prevConvRate = useMemo(() => {
    const visitsPrevMonth = visits.filter(v => {
      const d = v.date?.seconds ? new Date(v.date.seconds * 1000) : v.date ? new Date(v.date) : null;
      return d && d >= new Date(now.getTime() - 60 * 86400000) && d < monthAgo;
    });
    if (visitsPrevMonth.length === 0) return 0;
    return (soldVisitsPreviousMonth.length / visitsPrevMonth.length) * 100;
  }, [visits, soldVisitsPreviousMonth, monthAgo, now]);

  const activeDeals = useMemo(() => visits.filter(v => {
    const out = normalizeOutcome(v.outcome);
    return out === "Interested" || out === "Follow-up";
  }).length, [visits]);

  const repLeaderboard = useMemo(() => reps.map(rep => {
    const rv = visits.filter(v => (v.repId || v.createdBy) === rep.id);
    const sold = rv.filter(v => normalizeOutcome(v.outcome) === "Sold").length;
    const rate = rv.length > 0 ? (sold / rv.length) * 100 : 0;
    const repCustomers = customers.filter(c => c.createdBy === rep.id).length;
    return { ...rep, totalVisits: rv.length, sold, rate: parseFloat(rate.toFixed(1)), customerCount: repCustomers };
  }).sort((a, b) => b.rate - a.rate || b.totalVisits - a.totalVisits), [reps, visits, customers]);

  const outcomeSummary = useMemo(() => OUTCOMES.map(o => ({
    label: o, count: visits.filter(v => normalizeOutcome(v.outcome) === o).length, color: OUTCOME_COLORS[o],
  })), [visits]);

  // Chart Data: Last 7 Days Trend
  const last7DaysTrend = useMemo(() => {
    const days: { dateStr: string; name: string; Visits: number; Deals: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      days.push({
        dateStr: d.toDateString(),
        name: d.toLocaleDateString("en-US", { month: 'short', day: 'numeric' }),
        Visits: 0,
        Deals: 0
      });
    }
    visits.forEach(v => {
      const d = v.date?.seconds ? new Date(v.date.seconds * 1000) : v.date ? new Date(v.date) : null;
      if (d) {
        const dStr = d.toDateString();
        const day = days.find(day => day.dateStr === dStr);
        if (day) {
          day.Visits += 1;
          if (normalizeOutcome(v.outcome) === "Sold") day.Deals += 1;
        }
      }
    });
    return days;
  }, [visits, now]);

  // Chart Data: Outcomes Pie Chart
  const outcomePieData = useMemo(() => outcomeSummary.filter(o => o.count > 0).map(o => ({
    name: o.label,
    value: o.count,
    color: o.color
  })), [outcomeSummary]);

  const renderGrowth = (current: number, previous: number, label: string) => {
    if (previous === 0 && current === 0) {
      return <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-0.5"><Minus className="w-3 h-3" /> No change</div>;
    }
    if (previous === 0) {
      return <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 mt-0.5"><ArrowUp className="w-3 h-3" /> 100% <span className="text-gray-400 font-medium">{label}</span></div>;
    }
    const pct = ((current - previous) / previous) * 100;
    if (pct > 0) {
      return <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 mt-0.5"><ArrowUp className="w-3 h-3" /> {pct.toFixed(1)}% <span className="text-gray-400 font-medium">{label}</span></div>;
    } else if (pct < 0) {
      return <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 mt-0.5"><ArrowDown className="w-3 h-3" /> {Math.abs(pct).toFixed(1)}% <span className="text-gray-400 font-medium">{label}</span></div>;
    } else {
      return <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-0.5"><Minus className="w-3 h-3" /> No change</div>;
    }
  };

  const formatDateRange = (start: Date, end: Date) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById("executive-report");
    if (!element) return;
    
    element.classList.add("printing");
    try {
      const html2pdf = (await import("html2pdf.js" as any)).default;
      const opt = {
        margin:       [0.5, 0.5, 0.5, 0.5],
        filename:     `PaintCRM_Dashboard_${now.toISOString().split('T')[0]}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'in', format: 'a4', orientation: 'landscape' }
      };
      await html2pdf().set(opt).from(element).save();
    } catch (err) {
      console.error("html2pdf failed, falling back to window.print()", err);
      window.print();
    } finally {
      element.classList.remove("printing");
    }
  };

  return (
    <div className="animate-in w-full pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 print:hidden">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-gray-500 font-medium mt-1">Overview of your CRM performance and activities</p>
        </div>
        <div className="flex gap-3 items-center">
          <button className="btn-outline flex items-center gap-2 bg-white text-sm hover:bg-gray-50 rounded-xl px-4 py-2.5 shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="font-bold text-gray-700">{formatDateRange(weekAgo, now)}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-gray-900/20 text-sm">
            <Download className="w-4 h-4" />
            <span>Export to PDF</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 mb-6 print:hidden">
        <button onClick={() => setActiveTab && setActiveTab("customers")} className="flex items-center gap-2 px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold border border-indigo-100 hover:bg-indigo-50 transition-colors text-sm shadow-sm">
          <Plus className="w-4 h-4" /> Add Customer
        </button>
        <button onClick={() => setActiveTab && setActiveTab("reps")} className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-xl font-bold border border-blue-100 hover:bg-blue-50 transition-colors text-sm shadow-sm">
          <UserPlus className="w-4 h-4" /> Add Representative
        </button>
        <button onClick={() => setActiveTab && setActiveTab("visits")} className="flex items-center gap-2 px-4 py-2 bg-white text-emerald-600 rounded-xl font-bold border border-emerald-100 hover:bg-emerald-50 transition-colors text-sm shadow-sm">
          <CalendarPlus className="w-4 h-4" /> Schedule Visit
        </button>
      </div>

      <div id="executive-report" className="space-y-6 print:m-0 print:p-0">
        
        {/* Core Metrics Cards (Top Row) */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="glass-card p-4 rounded-2xl border border-gray-100 flex gap-4 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Customers</span>
              <span className="text-2xl font-black text-gray-900 leading-tight">{customers.length}</span>
              {renderGrowth(newCustomers.length, newCustomersPreviousMonth.length, "vs last 30 days")}
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-gray-100 flex gap-4 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Representatives</span>
              <span className="text-2xl font-black text-gray-900 leading-tight">{reps.length}</span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-0.5"><Minus className="w-3 h-3" /> No change</div>
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-gray-100 flex gap-4 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <Activity className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Visits</span>
              <span className="text-2xl font-black text-gray-900 leading-tight">{weekVisits.length}</span>
              {renderGrowth(weekVisits.length, visitsLastWeek.length, "vs last 7 days")}
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-gray-100 flex gap-4 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Closed Deals</span>
              <span className="text-2xl font-black text-gray-900 leading-tight">{soldVisits.length}</span>
              {renderGrowth(soldVisits.length, soldVisitsPreviousMonth.length, "vs last 30 days")}
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-gray-100 flex gap-4 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
              <Target className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Conv. Rate</span>
              <span className="text-2xl font-black text-gray-900 leading-tight">{convRate}%</span>
              {renderGrowth(parseFloat(convRate), prevConvRate, "vs last 30 days")}
            </div>
          </div>

          <div className="glass-card p-4 rounded-2xl border border-gray-100 flex gap-4 items-center bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <Briefcase className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Active Deals</span>
              <span className="text-2xl font-black text-gray-900 leading-tight">{activeDeals}</span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-0.5"><Minus className="w-3 h-3" /> No change</div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-card rounded-3xl border border-gray-100 flex flex-col bg-white">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Engagement Trends</h3>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900">Last 7 Days <ChevronDown className="w-3 h-3"/></button>
            </div>
            <div className="p-4 flex-1 min-h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={last7DaysTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorDeals" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                    cursor={{ stroke: '#e5e7eb', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#4b5563', paddingTop: '10px' }} />
                  <Area type="monotone" dataKey="Visits" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVisits)" />
                  <Area type="monotone" dataKey="Deals" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorDeals)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="glass-card rounded-3xl border border-gray-100 flex flex-col bg-white">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Visit Outcomes</h3>
              </div>
              <button className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-900">Last 30 Days <ChevronDown className="w-3 h-3"/></button>
            </div>
            <div className="p-5 flex-1 flex flex-col items-center justify-center min-h-[250px]">
              {outcomePieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <RechartsPieChart>
                    <Pie
                      data={outcomePieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {outcomePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-gray-400 font-medium text-xs">No data available</div>
              )}
              
              <div className="w-full mt-4 grid grid-cols-2 gap-y-2 gap-x-4">
                {outcomePieData.map(o => (
                  <div key={o.name} className="flex items-center gap-2 text-[10px] font-semibold text-gray-700">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: o.color }} />
                    <span className="truncate">{o.name}</span>
                    <span className="ml-auto text-gray-900 font-bold">{o.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: Activity, Leaderboard, Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Activity */}
          <div className="glass-card rounded-3xl border border-gray-100 flex flex-col overflow-hidden bg-white">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-gray-900">Recent Activity</h3>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-4">
              {visits.slice(0, 4).map(v => (
                <div key={v.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-gray-900 truncate">Visit recorded</p>
                    <p className="text-[10px] text-gray-500 truncate">{customers.find(c => c.id === v.customerId)?.name || 'Unknown'}</p>
                  </div>
                  <div className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                     {formatDate(v.date)}
                  </div>
                </div>
              ))}
              {visits.length === 0 && <div className="text-xs text-gray-400 text-center py-4">No recent activity</div>}
            </div>
            <div className="p-3 border-t border-gray-50 flex justify-center">
              <button onClick={() => setActiveTab && setActiveTab("visits")} className="text-indigo-600 font-bold text-xs hover:underline">View All Activity</button>
            </div>
          </div>

          {/* Leaderboard Table */}
          <div className="glass-card rounded-3xl border border-gray-100 flex flex-col overflow-hidden bg-white">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Leaderboard</h3>
                <p className="text-[10px] text-gray-500 font-medium">Top performing representatives</p>
              </div>
              <button onClick={() => setActiveTab && setActiveTab("reps")} className="text-indigo-600 font-bold text-xs hover:underline">View All</button>
            </div>
            <div className="p-0 overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/50 uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3">Representative</th>
                    <th className="px-5 py-3">Visits</th>
                    <th className="px-5 py-3">Deals</th>
                    <th className="px-5 py-3 text-right">Conv. Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {repLeaderboard.length === 0 ? (
                    <tr><td colSpan={4} className="px-5 py-6 text-center text-gray-400 font-medium">No reps found.</td></tr>
                  ) : (
                    repLeaderboard.slice(0, 4).map((rep, i) => (
                      <tr key={rep.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                              {rep.displayName?.[0] || rep.email[0].toUpperCase()}
                            </div>
                            <p className="font-bold text-gray-900 truncate max-w-[80px]">
                              {rep.displayName || rep.email.split('@')[0]}
                            </p>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-gray-600 font-semibold">{rep.totalVisits}</td>
                        <td className="px-5 py-3 text-gray-900 font-bold">{rep.sold}</td>
                        <td className="px-5 py-3 text-right">
                          <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${rep.rate >= 20 ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}>
                            {rep.rate}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Customers */}
          <div className="glass-card rounded-3xl border border-gray-100 flex flex-col overflow-hidden bg-white">
            <div className="p-5 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-sm font-extrabold text-gray-900">Recent Customers</h3>
              <button onClick={() => setActiveTab && setActiveTab("customers")} className="text-indigo-600 font-bold text-xs hover:underline">View All</button>
            </div>
            <div className="p-0 overflow-x-auto flex-1">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50/50 uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                  <tr>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Added On</th>
                    <th className="px-5 py-3">Representative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {customers.length === 0 ? (
                    <tr><td colSpan={3} className="px-5 py-6 text-center text-gray-400 font-medium">No customers found.</td></tr>
                  ) : (
                    customers.slice(0, 4).map((c) => {
                      const rep = reps.find(r => r.id === c.createdBy);
                      return (
                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-[10px] shrink-0">
                                {c.name?.[0]?.toUpperCase() || '?'}
                              </div>
                              <p className="font-bold text-gray-900 truncate max-w-[80px]">
                                {c.name}
                              </p>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-gray-600 font-semibold">{formatDate(c.createdAt)}</td>
                          <td className="px-5 py-3 text-gray-900 font-medium truncate max-w-[80px]">
                            {rep?.displayName || rep?.email.split('@')[0] || 'Unknown'}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Row 4: Upcoming Visits */}
        <div className="glass-card rounded-3xl border border-gray-100 flex flex-col overflow-hidden bg-white">
          <div className="p-5 border-b border-gray-50 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <h3 className="text-sm font-extrabold text-gray-900">Upcoming Visits</h3>
            </div>
            <button onClick={() => setActiveTab && setActiveTab("visits")} className="text-indigo-600 font-bold text-xs flex items-center gap-1 hover:underline">View Calendar <ChevronDown className="w-3 h-3"/></button>
          </div>
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/50 uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3">Customer</th>
                  <th className="px-6 py-3">Date & Time</th>
                  <th className="px-6 py-3">Representative</th>
                  <th className="px-6 py-3">Purpose</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visits.filter(v => normalizeOutcome(v.outcome) === "Other" && (!v.outcome || v.outcome.toLowerCase() === "pending" || v.outcome.toLowerCase() === "scheduled")).slice(0, 4).length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400 font-medium">No upcoming visits.</td></tr>
                ) : (
                  visits.filter(v => normalizeOutcome(v.outcome) === "Other" && (!v.outcome || v.outcome.toLowerCase() === "pending" || v.outcome.toLowerCase() === "scheduled")).slice(0, 4).map((v) => {
                    const c = customers.find(c => c.id === v.customerId);
                    const rep = reps.find(r => r.id === v.repId || r.id === v.createdBy);
                    return (
                      <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-3 font-bold text-gray-900">{c?.name || 'Unknown'}</td>
                        <td className="px-6 py-3 text-gray-600 font-semibold">{formatDate(v.date)}</td>
                        <td className="px-6 py-3 text-gray-900 font-medium">{rep?.displayName || rep?.email.split('@')[0] || 'Unknown'}</td>
                        <td className="px-6 py-3 text-gray-600">{v.purpose || 'Follow up'}</td>
                        <td className="px-6 py-3">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-600 border border-blue-100">
                            Scheduled
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

