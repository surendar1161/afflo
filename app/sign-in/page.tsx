"use client";
import Link from "next/link";
import { useState } from "react";

const SOCIAL_PROOF = [
  { metric: "3,000+", label: "brands" },
  { metric: "$2.4B+", label: "tracked" },
  { metric: "500K+", label: "affiliates" },
];

export default function SignInPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel — Brand ─────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-gradient-to-br from-[#0d0d1f] via-[#0a0a18] to-[#030711] overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-violet-600/20 rounded-full blur-[100px]" />
          <div className="absolute bottom-1/4 right-1/4 w-60 h-60 bg-emerald-500/10 rounded-full blur-[80px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-white text-lg">A</div>
          <span className="font-bold text-white text-xl">Afflo</span>
        </div>

        {/* Center content */}
        <div className="relative">
          <div className="mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Affiliate revenue, on autopilot
            </div>
            <h2 className="text-4xl font-black text-white leading-tight mb-4">
              Welcome back to<br />
              <span className="gradient-text">your affiliate OS.</span>
            </h2>
            <p className="text-slate-400 text-base leading-relaxed">
              Track every click, manage your affiliates, and grow your program — all from one powerful dashboard.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-6">
            {SOCIAL_PROOF.map(s => (
              <div key={s.label} className="card-dark rounded-xl px-4 py-3 text-center">
                <div className="text-xl font-black text-white">{s.metric}</div>
                <div className="text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Testimonial card */}
          <div className="mt-8 card-dark rounded-2xl p-5">
            <div className="text-slate-300 text-sm leading-relaxed mb-4">
              "Switched from Impact.com and saved $2,400/mo. Every feature we need, 10x better UX."
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold">MJ</div>
              <div>
                <div className="text-white text-sm font-semibold">Marcus Johnson</div>
                <div className="text-slate-500 text-xs">CMO, B2B SaaS Startup</div>
              </div>
              <div className="ml-auto flex gap-0.5">
                {[1,2,3,4,5].map(i => <span key={i} className="text-yellow-400 text-xs">★</span>)}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="relative text-slate-600 text-xs">
          © 2026 Afflo · <a href="#" className="hover:text-slate-400 transition-colors">Privacy</a> · <a href="#" className="hover:text-slate-400 transition-colors">Terms</a>
        </div>
      </div>

      {/* ── Right Panel — Form ──────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-[#030711]">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-white">A</div>
            <span className="font-bold text-white text-lg">Afflo</span>
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white mb-2">Sign in</h1>
            <p className="text-slate-400">Don't have an account? <Link href="/sign-up" className="text-violet-400 hover:text-violet-300 font-medium transition-colors">Start free trial</Link></p>
          </div>

          {/* OAuth buttons */}
          <div className="flex flex-col gap-3 mb-6">
            <button className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white text-sm font-medium transition-all">
              <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continue with Google
            </button>
            <button className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white text-sm font-medium transition-all">
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.1.82-.26.82-.58 0-.28-.01-1.04-.02-2.04-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
              Continue with GitHub
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-slate-600 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Email address</label>
              <input
                type="email" required autoComplete="email"
                placeholder="you@company.com"
                value={email} onChange={e => setEmail(e.target.value)}
                className="input-dark w-full px-4 py-3 rounded-xl text-sm"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-300">Password</label>
                <a href="#" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">Forgot password?</a>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"} required autoComplete="current-password"
                  placeholder="••••••••"
                  value={password} onChange={e => setPassword(e.target.value)}
                  className="input-dark w-full px-4 py-3 rounded-xl text-sm pr-11"
                />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs">
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="w-4 h-4 rounded border-white/20 bg-white/5 accent-violet-600" />
              <label htmlFor="remember" className="text-sm text-slate-400 cursor-pointer">Remember me for 30 days</label>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 rounded-xl text-white font-bold text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/></svg>
                  Signing in…
                </span>
              ) : "Sign in to Afflo"}
            </button>
          </form>

          <p className="text-center text-slate-500 text-xs mt-8">
            By signing in, you agree to our{" "}
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a> and{" "}
            <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}
