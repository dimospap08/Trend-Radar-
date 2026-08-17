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

// The backend returns fields named differently (and as strings) compared to
// the local mock data above (e.g. spark_data instead of spark, velocity_pct
// as a string instead of velocity as a number). This converts a raw backend
// trend row into the exact shape the rest of this component expects.
function normalizeTrend(t) {
  const hoursAgo = t.first_seen_at
    ? Math.max(1, Math.round((Date.now() - new Date(t.first_seen_at).getTime()) / 3600000))
    : t.firstSeen ?? 24;
  const spark = Array.isArray(t.spark_data)
    ? t.spark_data
    : Array.isArray(t.spark)
    ? t.spark
    : [10, 12, 14, 13, 16, 18, 17, 20, 22, 21, 24, 26];
  return {
    id: t.id,
    name: t.name,
    category: t.category,
    platform: t.platform,
    velocity: Number(t.velocity_pct ?? t.velocity ?? 30),
    score: Number(t.score ?? 50),
    spark,
    firstSeen: hoursAgo,
  };
}

/* =========================================================
   VISUAL PRIMITIVES
   ========================================================= */
function Sparkline({ data, color = "#b276ff" }) {
  const safeData = Array.isArray(data) && data.length > 0 ? data : [1, 1];
  const max = Math.max(...safeData) || 1;
  const points = safeData.map((v, i) => `${(i / (safeData.length - 1 || 1)) * 100},${28 - (v / max) * 26}`).join(" ");
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
    { emoji: "🐸", top: "4%", left: "35%", size: 18, delay: "2
