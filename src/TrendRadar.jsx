import React, { useState, useEffect, useMemo } from "react";
import {
  Radar, TrendingUp, Star, Zap, Users, ShoppingBag, Coins, Video,
  Check, Activity, Bell, ArrowRight, Gauge, Sparkles, Lock,
} from "lucide-react";

/* =========================================================
   MOCK SIGNAL ENGINE
   ========================================================= */
const PERSONAS = [
  { id: "creator", label: "Creator", icon: Video, tag: "TikTok / Shorts / Reels" },
  { id: "store", label: "E-commerce", icon: ShoppingBag, tag: "Product sourcing" },
  { id: "marketer", label: "Marketer", icon: Users, tag: "Campaign timing" },
  { id: "investor", label: "Investor", icon: Coins, tag: "Meme-coin narratives" },
];

const CATEGORY_BY_PERSONA = {
  creator: ["Sound", "Hashtag", "Format"],
  store: ["Product", "Aesthetic", "Hashtag"],
  marketer: ["Hashtag", "Format", "Aesthetic"],
  investor: ["Coin", "Narrative"],
};

const NAME_POOL = {
  Sound: ["\"Corridor\" slowed remix", "8-bit villain riff", "rainy lo-fi loop v2", "static-hum transition cue", "brainrot sound mashup #7"],
  Hashtag: ["#quietluxury2", "#deskbombing", "#feralgirlsummer3", "#cozycore.exe", "#glitchcore.tools", "#italianbrainrot"],
  Format: ["POV: silent vlog", "3-second hook stitch", "\"rate my setup\" duet", "split-screen reaction", "AI-narrated brainrot skit"],
  Product: ["mini heatless curler v2", "glass-skin serum stick", "LED desk fog lamp", "wearable neck-fan clip"],
  Aesthetic: ["mob wife 2.0", "dopamine minimalism", "goblincore office", "liminal beige"],
  Coin: ["$FROGWIF", "$STATIC", "$NANOCAT", "$GHOSTPEPE", "$BRAINROT"],
  Narrative: ["AI-agent memes", "retro-internet nostalgia", "sleep-deprived dev humor", "anti-hustle culture", "Italian brainrot animal lore (Tralalero Tralala, Bombardiro Crocodilo)", "surreal AI-generated meme creatures"],
};
const PLATFORMS = ["TikTok", "Instagram Reels", "X", "YouTube Shorts", "Telegram"];

function seedRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}
function generateTrends() {
  const rand = seedRandom(42);
  const out = [];
  let id = 0;
  Object.entries(NAME_POOL).forEach(([category, names]) => {
    names.forEach((name) => {
      id += 1;
      const velocity = Math.round(20 + rand() * 780);
      const spark = Array.from({ length: 12 }, (_, i) => {
        const base = 10 + i * (velocity / 120);
        return Math.max(2, Math.round(base + rand() * 15));
      });
      out.push({
        id, name, category,
        platform: PLATFORMS[Math.floor(rand() * PLATFORMS.length)],
        velocity, spark,
        firstSeen: Math.round(1 + rand() * 60),
        score: Math.min(99, Math.round(velocity / 9 + rand() * 15)),
      });
    });
  });
  return out.sort((a, b) => b.score - a.score);
}
const ALL_TRENDS = generateTrends();

// Your live backend API (Railway). If it returns real trends, we use them.
// If the database is still empty, we fall back to the local mock data above
// so the page never looks broken while you're still setting things up.
const API_BASE = "https://trend-radar-backend-production.up.railway.app";

/* =========================================================
   VISUAL PRIMITIVES
   ========================================================= */
function Sparkline({ data, color = "#b276ff" }) {
  const max = Math.max(...data);
  const points = data.map((v, i) => `${(i / (data.length - 1)) * 100},${28 - (v / max) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RadarSweep() {
  const [angle, setAngle] = useState(0);
  useEffect(() => {
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = now - last; last = now;
      setAngle((a) => (a + dt * 0.045) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const blips = useMemo(
    () => ALL_TRENDS.slice(0, 11).map((t, i) => ({
      id: t.id, r: 16 + ((i * 34) % 80), theta: (i * 53) % 360, size: 3 + (t.score % 5),
    })),
    []
  );

  return (
    <div className="relative w-full aspect-square max-w-md mx-auto">
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <radialGradient id="radarBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#231638" />
            <stop offset="100%" stopColor="#0b0716" />
          </radialGradient>
          <linearGradient id="sweepGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#b276ff" stopOpacity="0" />
            <stop offset="100%" stopColor="#b276ff" stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill="url(#radarBg)" stroke="#3f2d5e" strokeWidth="1" />
        {[80, 60, 40, 20].map((r) => (
          <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="#3f2d5e" strokeWidth="0.6" />
        ))}
        <line x1="2" y1="100" x2="198" y2="100" stroke="#3f2d5e" strokeWidth="0.5" />
        <line x1="100" y1="2" x2="100" y2="198" stroke="#3f2d5e" strokeWidth="0.5" />
        <g style={{ transformOrigin: "100px 100px", transform: `rotate(${angle}deg)` }}>
          <path d="M100,100 L100,2 A98,98 0 0,1 149,15 Z" fill="url(#sweepGrad)" />
        </g>
        {blips.map((b) => {
          const rad = (b.theta * Math.PI) / 180;
          const x = 100 + b.r * Math.cos(rad);
          const y = 100 + b.r * Math.sin(rad);
          const lit = ((angle - b.theta + 360) % 360) < 40;
          return <circle key={b.id} cx={x} cy={y} r={b.size / 2} fill={lit ? "#e2c6ff" : "#b276ff"} opacity={lit ? 1 : 0.55} />;
        })}
        <circle cx="100" cy="100" r="2" fill="#b276ff" />
      </svg>
    </div>
  );
}

function SignalTicker() {
  const items = useMemo(() => ALL_TRENDS.slice(0, 14), []);
  const line = items.map((t) => `${t.name} +${t.velocity}%`).join("   ///   ");
  return (
    <div className="border-y border-[#2a1f42] bg-[#150e22] overflow-hidden py-2.5">
      <div className="whitespace-nowrap mono text-xs text-[#9a7ec4] animate-[ticker_38s_linear_infinite]">
        {line} /// {line}
      </div>
      <style>{`@keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

function FloatingIcons() {
  const items = [
    { emoji: "🐊", top: "6%", left: "4%", size: 26, delay: "0s", dur: "7s" },
    { emoji: "💀", top: "14%", left: "88%", size: 22, delay: "1.2s", dur: "6s" },
    { emoji: "🎵", top: "24%", left: "12%", size: 20, delay: "0.6s", dur: "8s" },
    { emoji: "🚀", top: "10%", left: "60%", size: 24, delay: "2s", dur: "6.5s" },
    { emoji: "🪙", top: "34%", left: "92%", size: 20, delay: "0.3s", dur: "7.5s" },
    { emoji: "🦈", top: "46%", left: "6%", size: 22, delay: "1.5s", dur: "7s" },
    { emoji: "🐸", top: "4%", left: "35%", size: 18, delay: "2.4s", dur: "6.8s" },
    { emoji: "💵", top: "56%", left: "88%", size: 22, delay: "0.8s", dur: "7.2s" },
    { emoji: "💶", top: "68%", left: "8%", size: 20, delay: "1.8s", dur: "6.4s" },
    { emoji: "₿", top: "40%", left: "48%", size: 24, delay: "0.4s", dur: "8s" },
    { emoji: "💰", top: "78%", left: "92%", size: 22, delay: "2.6s", dur: "7s" },
    { emoji: "📈", top: "86%", left: "20%", size: 20, delay: "1s", dur: "6.6s" },
    { emoji: "🔥", top: "60%", left: "40%", size: 18, delay: "1.4s", dur: "7.4s" },
    { emoji: "🪙", top: "92%", left: "60%", size: 18, delay: "0.2s", dur: "7s" },
    { emoji: "👛", top: "30%", left: "22%", size: 18, delay: "2.2s", dur: "6.9s" },
    { emoji: "🎉", top: "72%", left: "50%", size: 18, delay: "1.6s", dur: "7.1s" },
  ];
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {items.map((it, i) => (
        <span
          key={i}
          className="absolute opacity-15 select-none"
          style={{
            top: it.top,
            left: it.left,
            fontSize: it.size,
            animation: `floaty ${it.dur} ease-in-out ${it.delay} infinite`,
          }}
        >
          {it.emoji}
        </span>
      ))}
      <style>{`@keyframes floaty { 0%,100% { transform: translateY(0px) rotate(0deg); } 50% { transform: translateY(-14px) rotate(6deg); } }`}</style>
    </div>
  );
}

/* =========================================================
   MAIN
   ========================================================= */
export default function TrendRadar() {
  const [persona, setPersona] = useState("creator");
  const [watchlist, setWatchlist] = useState(new Set());
  const [tier, setTier] = useState("pro");
  const [liveTrends, setLiveTrends] = useState(null); // null = not loaded yet / use mock

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_BASE}/api/trends?persona=${persona}&tier=${tier}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (data?.trends?.length > 0) {
          setLiveTrends(data.trends);
        } else {
          setLiveTrends(null); // DB empty (or not seeded yet) -> use mock data
        }
      })
      .catch(() => {
        if (!cancelled) setLiveTrends(null); // backend unreachable -> use mock data
      });
    return () => { cancelled = true; };
  }, [persona, tier]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("watchlist");
      if (saved) setWatchlist(new Set(JSON.parse(saved)));
    } catch (e) { /* nothing saved yet */ }
    // TODO: once the backend is live, replace this with a fetch to
    // GET /api/trends?persona=...&tier=... and load the user's real watchlist.
  }, []);

  const toggleWatch = (id) => {
    setWatchlist((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem("watchlist", JSON.stringify(Array.from(next)));
      // TODO: also POST /api/trends/:id/watch { user_id } once backend is connected.
      return next;
    });
  };

  const categories = CATEGORY_BY_PERSONA[persona];
  const visibleTrends = liveTrends ?? ALL_TRENDS.filter((t) => categories.includes(t.category));
  const freeLimit = 3;
  const activePersona = PERSONAS.find((p) => p.id === persona);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch(`${API_BASE}/api/trends/refresh`, { method: "POST" });
      const r = await fetch(`${API_BASE}/api/trends?persona=${persona}&tier=${tier}`);
      const data = await r.json();
      if (data?.trends?.length > 0) setLiveTrends(data.trends);
    } catch (e) {
      // backend unreachable or Gemini key missing — silently keep current view
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0714] text-[#f1e9fb]">
      <FloatingIcons />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap');
        .display { font-family: 'Space Grotesk', sans-serif; }
        .body-f { font-family: 'Inter', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        * { scrollbar-color: #3f2d5e #0a0714; }
      `}</style>

      {/* NAV */}
      <header className="border-b border-[#2a1f42] sticky top-0 bg-[#0a0714]/90 backdrop-blur z-30">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-[#b276ff]" />
            <span className="display font-bold tracking-tight text-lg">TREND / RADAR</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 mono text-xs text-[#bda8dc]">
            <a href="#feed" className="hover:text-[#b276ff] transition">Live Feed</a>
            <a href="#how" className="hover:text-[#b276ff] transition">How it works</a>
            <a href="#pricing" className="hover:text-[#b276ff] transition">Pricing</a>
          </nav>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 mono text-[11px] text-[#bda8dc] border border-[#2a1f42] hover:border-[#b276ff] hover:text-[#b276ff] px-3 py-1.5 rounded-full transition disabled:opacity-50"
            >
              <Activity className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Scanning..." : "Refresh"}
            </button>
            <div className="mono text-[11px] text-[#9a7ec4] flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 animate-pulse" />
              {ALL_TRENDS.length} SIGNALS LIVE
            </div>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section className="relative max-w-6xl mx-auto px-6 pt-16 pb-14 grid md:grid-cols-2 gap-10 items-center overflow-hidden">
        <div>
          <p className="mono text-xs text-[#b276ff] tracking-widest mb-4">EARLY-SIGNAL DETECTION</p>
          <h1 className="display text-4xl md:text-5xl font-bold leading-[1.05] mb-5">
            See the trend<br />before it's a trend.
          </h1>
          <p className="body-f text-[#bda8dc] text-base leading-relaxed mb-8 max-w-md">
            We track sounds, hashtags, products and meme coins the moment their growth curve starts
            bending upward — hours or days before they hit the mainstream feed.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {PERSONAS.map((p) => {
              const Icon = p.icon;
              const active = persona === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPersona(p.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-sm mono transition ${
                    active ? "bg-[#b276ff] text-[#0a0714] font-medium" : "bg-[#1e1530] text-[#bda8dc] hover:bg-[#2a1f42]"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" /> {p.label}
                </button>
              );
            })}
          </div>
          <p className="mono text-[11px] text-[#6b5589] mb-8">{activePersona.tag}</p>
          <a href="#pricing" className="inline-flex items-center gap-2 bg-[#b276ff] text-[#0a0714] px-5 py-3 rounded-lg font-semibold text-sm hover:bg-[#e2c6ff] transition">
            Start free <ArrowRight className="w-4 h-4" />
          </a>
        </div>
        <RadarSweep />
      </section>

      <SignalTicker />

      {/* HOW IT WORKS */}
      <section id="how" className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="display text-2xl font-bold mb-8">How the radar works</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { icon: Gauge, title: "Velocity scan", body: "We measure how fast a sound, tag or coin is accelerating right now — not how big it already is." },
            { icon: Sparkles, title: "Noise filter", body: "One-off spikes get discarded. Only sustained, compounding growth gets promoted to a signal." },
            { icon: Bell, title: "Instant alert", body: "The moment something crosses your threshold, it lands in your feed and inbox — first." },
          ].map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="rounded-xl border border-[#2a1f42] bg-[#150e22] p-5">
                <Icon className="w-5 h-5 text-[#b276ff] mb-3" />
                <p className="display font-semibold mb-1.5">{f.title}</p>
                <p className="body-f text-sm text-[#bda8dc] leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* FEED */}
      <section id="feed" className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="display text-xl font-bold">Live feed — {activePersona.label}</h2>
          <span className="mono text-xs text-[#9a7ec4]">sorted by trend score</span>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {visibleTrends.map((t, idx) => {
            const locked = tier === "free" && idx >= freeLimit;
            const watched = watchlist.has(t.id);
            return (
              <div key={t.id} className="relative rounded-xl border border-[#2a1f42] bg-[#150e22] p-4 overflow-hidden">
                {locked && (
                  <div className="absolute inset-0 bg-[#0a0714]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-10">
                    <Lock className="w-4 h-4 text-[#b276ff]" />
                    <span className="mono text-xs text-[#bda8dc]">Pro signal</span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="mono text-[10px] text-[#9a7ec4] uppercase tracking-wide">{t.category} · {t.platform}</p>
                    <p className="display font-semibold text-sm mt-1">{t.name}</p>
                  </div>
                  <button onClick={() => toggleWatch(t.id)} className="shrink-0">
                    <Star className={`w-4 h-4 ${watched ? "fill-[#b276ff] text-[#b276ff]" : "text-[#6b5589]"}`} />
                  </button>
                </div>
                <Sparkline data={t.spark} />
                <div className="flex items-center justify-between mt-2">
                  <span className="flex items-center gap-1 text-[#b276ff] mono text-xs">
                    <TrendingUp className="w-3.5 h-3.5" /> +{t.velocity}% / 48h
                  </span>
                  <span className="mono text-[10px] text-[#9a7ec4]">score {t.score}</span>
                </div>
                <p className="mono text-[10px] text-[#6b5589] mt-1">first seen {t.firstSeen}h ago</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* TESTIMONIALS (illustrative placeholders — swap for real user feedback) */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-center justify-between mb-1">
          <h2 className="display text-2xl font-bold">What early users are saying</h2>
          <span className="flex items-center gap-1 mono text-xs text-[#9a7ec4]">
            <Star className="w-3.5 h-3.5 fill-[#b276ff] text-[#b276ff]" /> 4.8 / 5
          </span>
        </div>
        <p className="mono text-[10px] text-[#6b5589] mb-6">Illustrative example quotes — replace with real testimonials once you have them.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Creator, 240K followers", quote: "Caught a sound two days before it blew up. My video hit 4x my usual views riding it early." },
            { name: "DTC store owner", quote: "Spotted a product aesthetic trending before our competitors did. Sourced it in time for the wave." },
            { name: "Independent trader", quote: "The narrative tracking on meme coins is genuinely useful for spotting where attention is shifting." },
          ].map((t) => (
            <div key={t.name} className="rounded-xl border border-[#2a1f42] bg-[#150e22] p-5">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-[#b276ff] text-[#b276ff]" />
                ))}
              </div>
              <p className="body-f text-sm text-[#f1e9fb] leading-relaxed mb-3">"{t.quote}"</p>
              <p className="mono text-[10px] text-[#9a7ec4]">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="display text-2xl font-bold mb-2">Plans</h2>
        <p className="body-f text-[#bda8dc] mb-8 text-sm">Unlock every signal and get alerted the moment it moves.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { id: "free", name: "Free", price: "$0", period: "", features: ["3 trends per persona", "24h delayed data", "No alerts"] },
            { id: "pro", name: "Pro", price: "$29", period: "/mo", features: ["All trends, live", "Push alerts on new signals", "Watchlist & history", "Every category unlocked"], highlight: true },
            { id: "investor", name: "Signal+", price: "$99", period: "/mo", features: ["Everything in Pro", "On-chain meme-coin scanner", "API access", "Priority on new signal types"] },
          ].map((plan) => (
            <div
              key={plan.id}
              onClick={() => setTier(plan.id)}
              className={`cursor-pointer rounded-xl border p-6 transition relative ${
                tier === plan.id ? "border-[#b276ff] bg-[#1e1530]" : "border-[#2a1f42] bg-[#150e22] hover:border-[#3f2d5e]"
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-2.5 left-6 bg-[#b276ff] text-[#0a0714] text-[10px] font-bold px-2 py-0.5 rounded-full mono">MOST POPULAR</span>
              )}
              <p className="display font-bold text-lg">{plan.name}</p>
              <p className="mono text-2xl font-bold text-[#b276ff] my-2">{plan.price}<span className="text-sm text-[#9a7ec4]">{plan.period}</span></p>
              <ul className="space-y-1.5 mt-4">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm body-f text-[#bda8dc]">
                    <Check className="w-3.5 h-3.5 text-[#b276ff] mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <button className={`mt-5 w-full py-2.5 rounded-lg text-sm font-semibold transition ${
                tier === plan.id ? "bg-[#b276ff] text-[#0a0714]" : "bg-[#2a1f42] text-[#f1e9fb] hover:bg-[#3f2d5e]"
              }`}>
                {tier === plan.id ? "Selected (demo)" : "Choose plan"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-[#2a1f42] py-8 text-center">
        <div className="flex items-center justify-center gap-4 mono text-[11px] text-[#9a7ec4]">
          <a href="/privacy.html" className="hover:text-[#b276ff] transition">Privacy Policy</a>
          <span className="text-[#3f2d5e]">·</span>
          <a href="/terms.html" className="hover:text-[#b276ff] transition">Terms of Service</a>
        </div>
        <p className="mono text-[10px] text-[#6b5589] mt-3">© {new Date().getFullYear()} Trend Radar. All rights reserved.</p>
      </footer>
    </div>
  );
}
