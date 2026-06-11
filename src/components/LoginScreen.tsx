"use client";
import { ShieldCheck } from "lucide-react";

export default function LoginScreen({ email, setEmail, password, setPassword, error, onSubmit }: {
  email: string; setEmail: (v: string) => void;
  password: string; setPassword: (v: string) => void;
  error: string; onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EFECE5] p-4 text-gray-900">
      <div className="bg-white p-10 rounded-3xl w-full max-w-md animate-in shadow-sm border border-gray-100">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-black flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="text-3xl font-extrabold text-center mb-2 tracking-tight">Super Admin</h1>
        <p className="text-gray-500 text-center mb-8 text-sm font-medium">PaintCRM Network Control Center</p>
        {error && <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-sm mb-6 font-medium">{error}</div>}
        <form onSubmit={onSubmit} className="space-y-5">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="form-input" placeholder="superadmin@example.com" required />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 mb-2 uppercase tracking-wider">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              className="form-input" placeholder="••••••••" required />
          </div>
          <button type="submit" className="btn-primary w-full py-3.5 mt-4 text-[15px]">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
