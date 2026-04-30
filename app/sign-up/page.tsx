"use client";
import Link from "next/link";
import { useState } from "react";

const STEPS = ["Account", "Your program", "Done"];

const PLANS = [
  { id: "starter", name: "Starter", price: "$49/mo", desc: "Up to 50 affiliates", highlight: false },
  { id: "growth",  name: "Growth",  price: "$149/mo", desc: "Up to 500 affiliates", highlight: true },
  { id: "scale",   name: "Scale",   price: "$399/mo", desc: "Unlimited affiliates", highlight: false },
];

const PROGRAM_TYPES = [
  { id: "ecommerce",  icon: "🛍", label: "E-commerce" },
  { id: "saas",       icon: "💻", label: "SaaS / Software" },
  { id: "creator",    icon: "🎥", label: "Creator / Media" },
  { id: "finance",    icon: "💰", label: "Finance / Fintech" },
  { id: "health",     icon: "🏥", label: "Health & Wellness" },
  { id: "other",      icon: "📦", label: "Other" },
];

const PERKS = [
  "14-day free trial, no card required",
  "Setup in under 5 minutes",
  "AI fraud detection from day 1",
  "Cancel or downgrade anytime",
];

export default function SignUpPage() {
  const [step, setStep]               = useState(0);
  const [name, setName]               = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [company, setCompany]         = useState("");
  const [programType, setProgramType] = useState("");
  const [plan, setPlan]               = useState("growth");
  const [loading, setLoading]         = useState(false);
  const [showPass, setShowPass]       = useState(false);
  const [agreed, setAgreed]           = useState(false);

  const handleStep0 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setStep(1);
  };

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setStep(2); }, 1500);
  };

  const passStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4 : 3;
  const strengthColors = ["", "#ef4444", "#f59e0b", "#3b82f6", "#10b981"];
  const strengthLabels = ["", "Weak", "Fair", "Good", "Strong"];

  return (
    <div className="min-h-screen flex">
      {/* ── Left Panel ──────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[420px] relative flex-col justify-between p-12 bg-gradient-to-br from-[#0d0d1f] via-[#0a0a18] to-[#030711] overflow-hidden flex-shrink-0">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-72 h-72 bg-violet-600/20 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 left-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-[60px]" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-white text-lg">A</div>
          <span className="font-bold text-white text-xl">Afflo</span>
        </div>

        <div className="relative">
          <h2 className="text-3xl font-black text-white leading-tight mb-6">
            Start earning from<br />
            <span className="gradient-text">your affiliates today.</span>
          </h2>

          {/* Perks */}
          <ul className="space-y-4 mb-8">
            {PERKS.map(perk => (
              <li key={perk} className="flex items-center gap-3 text-slate-300 text-sm">
                <span className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0 text-xs">✓</span>
                {perk}
              </li>
            ))}
          </ul>

          {/* Mini social proof */}
          <div className="card-dark rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {["SC","MJ","PP","AT"].map((init, i) => (
                <div key={init} className="w-8 h-8 rounded-full border-2 border-[#0d0d1f] -ml-2 first:ml-0 flex items-center justify-center text-white text-xs font-bold"
                  style={{ background: ["#7c3aed","#10b981","#f59e0b","#3b82f6"][i] }}>
                  {init}
                </div>
              ))}
              <span className="text-slate-400 text-xs ml-1">+2,996 brands</span>
            </div>
            <div className="text-slate-300 text-xs leading-relaxed">
              "We went from $0 to $48K/mo in affiliate revenue in 90 days."
            </div>
            <div className="text-slate-500 text-xs mt-1">— Sarah Chen, DTC Brand Founder</div>
          </div>
        </div>

        <div className="relative text-slate-600 text-xs">
          © 2026 Afflo · <a href="#" className="hover:text-slate-400">Privacy</a> · <a href="#" className="hover:text-slate-400">Terms</a>
        </div>
      </div>

      {/* ── Right Panel — Multi-step form ──────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#030711] overflow-y-auto">
        <div className="w-full max-w-lg">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center font-black text-white">A</div>
            <span className="font-bold text-white text-lg">Afflo</span>
          </div>

          {/* Step indicator */}
          {step < 2 && (
            <div className="flex items-center gap-3 mb-8">
              {STEPS.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i < step ? "bg-emerald-500 text-white" : i === step ? "bg-violet-600 text-white" : "bg-white/5 text-slate-500"
                  }`}>
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span className={`text-sm font-medium ${i === step ? "text-white" : "text-slate-500"}`}>{s}</span>
                  {i < STEPS.length - 1 && <div className="w-8 h-px bg-white/10" />}
                </div>
              ))}
            </div>
          )}

          {/* ── STEP 0: Account details ─────────────────────── */}
          {step === 0 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Create your account</h1>
                <p className="text-slate-400">Already have one? <Link href="/sign-in" className="text-violet-400 hover:text-violet-300 font-medium">Sign in</Link></p>
              </div>

              {/* OAuth */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white text-sm font-medium transition-all">
                  <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                  Google
                </button>
                <button className="flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/8 text-white text-sm font-medium transition-all">
                  <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.37.6.1.82-.26.82-.58 0-.28-.01-1.04-.02-2.04-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02.005 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
                  GitHub
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-white/8" />
                <span className="text-slate-600 text-xs">or with email</span>
                <div className="flex-1 h-px bg-white/8" />
              </div>

              <form onSubmit={handleStep0} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Full name</label>
                    <input type="text" required placeholder="Alex Johnson" value={name} onChange={e => setName(e.target.value)}
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Company name</label>
                    <input type="text" required placeholder="Acme Inc." value={company} onChange={e => setCompany(e.target.value)}
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Work email</label>
                  <input type="email" required autoComplete="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)}
                    className="input-dark w-full px-4 py-3 rounded-xl text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Password</label>
                  <div className="relative">
                    <input type={showPass ? "text" : "password"} required placeholder="Min. 8 characters" value={password} onChange={e => setPassword(e.target.value)}
                      className="input-dark w-full px-4 py-3 rounded-xl text-sm pr-16" />
                    <button type="button" onClick={() => setShowPass(!showPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs transition-colors">
                      {showPass ? "Hide" : "Show"}
                    </button>
                  </div>
                  {password && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 flex gap-1">
                        {[1,2,3,4].map(i => (
                          <div key={i} className="flex-1 h-1 rounded-full transition-all"
                            style={{ background: i <= passStrength ? strengthColors[passStrength] : "rgba(255,255,255,0.1)" }} />
                        ))}
                      </div>
                      <span className="text-xs" style={{ color: strengthColors[passStrength] }}>{strengthLabels[passStrength]}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-start gap-2.5 pt-1">
                  <input type="checkbox" id="agree" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="w-4 h-4 rounded border-white/20 bg-white/5 accent-violet-600 mt-0.5 flex-shrink-0 cursor-pointer" />
                  <label htmlFor="agree" className="text-sm text-slate-400 cursor-pointer leading-relaxed">
                    I agree to Afflo's{" "}
                    <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">Terms of Service</a> and{" "}
                    <a href="#" className="text-violet-400 hover:text-violet-300 transition-colors">Privacy Policy</a>
                  </label>
                </div>

                <button type="submit" disabled={!agreed}
                  className="btn-primary w-full py-3 rounded-xl text-white font-bold text-sm mt-2 disabled:opacity-40 disabled:cursor-not-allowed">
                  Continue →
                </button>
              </form>
            </>
          )}

          {/* ── STEP 1: Program setup ───────────────────────── */}
          {step === 1 && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-black text-white mb-2">Set up your program</h1>
                <p className="text-slate-400 text-sm">Tell us about your business so we can personalise Afflo for you.</p>
              </div>

              <form onSubmit={handleStep1} className="space-y-6">
                {/* Program type */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">What type of business are you?</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PROGRAM_TYPES.map(pt => (
                      <button type="button" key={pt.id} onClick={() => setProgramType(pt.id)}
                        className={`py-3 px-2 rounded-xl border text-center transition-all ${
                          programType === pt.id
                            ? "border-violet-500 bg-violet-500/15 text-violet-300"
                            : "border-white/10 bg-white/3 text-slate-400 hover:border-white/20"
                        }`}>
                        <div className="text-xl mb-1">{pt.icon}</div>
                        <div className="text-xs font-medium">{pt.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Plan selection */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Choose your plan <span className="text-slate-500">(14 days free, then billed)</span></label>
                  <div className="space-y-2">
                    {PLANS.map(p => (
                      <label key={p.id} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                        plan === p.id
                          ? "border-violet-500 bg-violet-500/10"
                          : "border-white/8 hover:border-white/15"
                      }`}>
                        <input type="radio" name="plan" value={p.id} checked={plan === p.id} onChange={() => setPlan(p.id)} className="accent-violet-600" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-semibold text-sm">{p.name}</span>
                            {p.highlight && <span className="text-xs bg-violet-600/20 text-violet-400 border border-violet-500/30 px-2 py-0.5 rounded-full">Popular</span>}
                          </div>
                          <div className="text-slate-400 text-xs">{p.desc}</div>
                        </div>
                        <div className="text-white font-bold text-sm">{p.price}</div>
                      </label>
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={!programType || loading}
                  className="btn-primary w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/></svg>
                      Setting up your account…
                    </span>
                  ) : "Launch my affiliate program →"}
                </button>

                <button type="button" onClick={() => setStep(0)} className="w-full text-slate-500 text-sm hover:text-slate-300 transition-colors">
                  ← Back
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: Success ─────────────────────────────── */}
          {step === 2 && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-4xl mx-auto mb-6">🎉</div>
              <h1 className="text-3xl font-black text-white mb-3">You're all set!</h1>
              <p className="text-slate-400 mb-2">Welcome to Afflo, <strong className="text-white">{name || "there"}</strong>.</p>
              <p className="text-slate-500 text-sm mb-10">We've created your <strong className="text-violet-400">{PLANS.find(p => p.id === plan)?.name}</strong> account. Your 14-day trial starts now.</p>

              <div className="grid grid-cols-1 gap-3 mb-8">
                {[
                  { icon: "🔗", title: "Create your first affiliate link", desc: "Generate a unique tracking link in 30 seconds" },
                  { icon: "👥", title: "Invite your first affiliates", desc: "Share your program page or browse the marketplace" },
                  { icon: "💸", title: "Set up payouts", desc: "Connect PayPal, bank, or crypto for affiliate payments" },
                ].map(item => (
                  <div key={item.title} className="card-dark rounded-xl p-4 text-left flex items-center gap-4 cursor-pointer hover:border-violet-500/30 transition-all">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <div className="text-white text-sm font-semibold">{item.title}</div>
                      <div className="text-slate-500 text-xs">{item.desc}</div>
                    </div>
                    <span className="ml-auto text-slate-600">→</span>
                  </div>
                ))}
              </div>

              <Link href="/sign-in" className="btn-primary inline-block text-white font-bold px-8 py-3 rounded-xl text-sm">
                Go to your dashboard →
              </Link>

              <p className="text-slate-600 text-xs mt-4">Check your email at <strong className="text-slate-400">{email}</strong> for account details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
