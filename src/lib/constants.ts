// Super Admin email - only this account can access the dashboard
export const SUPER_ADMIN_EMAIL = "ahmad@gmail.com";

export function getBadgeClass(type: string): string {
  // Using Tailwind utility classes for the badges based on the design system
const map: Record<string, string> = {
    Admin: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    Rep: "bg-blue-50 text-blue-700 border border-blue-200",
    Sold: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Interested: "bg-indigo-50 text-indigo-700 border border-indigo-200",
    "Follow-up": "bg-amber-50 text-amber-700 border border-amber-200",
    "Not Interested": "bg-rose-50 text-rose-700 border border-rose-200",
    Other: "bg-purple-50 text-purple-700 border border-purple-200",
    Retail: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Wholesale: "bg-blue-50 text-blue-700 border border-blue-200",
    Corporate: "bg-amber-50 text-amber-700 border border-amber-200",
    Contractor: "bg-orange-50 text-orange-700 border border-orange-200",
    Architect: "bg-cyan-50 text-cyan-700 border border-cyan-200",
    Individual: "bg-gray-100 text-gray-700 border border-gray-200",
    Active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    Lead: "bg-blue-50 text-blue-700 border border-blue-200",
    Inactive: "bg-gray-100 text-gray-700 border border-gray-200",
    Pending: "bg-amber-50 text-amber-700 border border-amber-200",
  };
  const base = "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ";
  return base + (map[type] || "bg-gray-100 text-gray-700 border border-gray-200");
}

export function formatDate(d: any): string {
  if (!d) return "N/A";
  const date = d?.seconds ? new Date(d.seconds * 1000) : d?.toDate ? d.toDate() : new Date(d);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}
