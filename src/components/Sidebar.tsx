"use client";
import { LayoutDashboard, Users, Briefcase, Activity, LogOut, ShieldCheck } from "lucide-react";

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "admins", label: "Admins", icon: ShieldCheck },
  { id: "reps", label: "Representatives", icon: Briefcase },
  { id: "customers", label: "Customers", icon: Users },
  { id: "visits", label: "Visits Log", icon: Activity },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout }: {
  activeTab: string; setActiveTab: (t: string) => void; onLogout: () => void;
}) {
  return (
    <aside className="w-[240px] min-h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-40 shadow-sm">
      {/* Logo */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-extrabold text-black tracking-tight leading-tight">PaintCRM</h1>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Admin Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 mt-2">
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold px-4 mb-4">Management</p>
        {navItems.map(item => (
          <button key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`sidebar-link w-full ${activeTab === item.id ? "active" : ""}`}>
            <item.icon className="w-[18px] h-[18px]" strokeWidth={activeTab === item.id ? 2.5 : 2} />
            <span className="font-semibold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-2 mb-4 px-3">
          <div className="w-2 h-2 rounded-full bg-emerald-500 pulse-dot"></div>
          <span className="text-xs font-semibold text-gray-500">Firebase Connected</span>
        </div>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-sm font-semibold">
          <LogOut className="w-[18px] h-[18px]" strokeWidth={2.5} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
