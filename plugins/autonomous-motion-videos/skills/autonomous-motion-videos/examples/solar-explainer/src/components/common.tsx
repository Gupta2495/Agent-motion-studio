import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig, random } from "remotion";
import { C, FONT_BODY, FONT_HEAD, W, H } from "../theme";

// ---------- math helpers ----------
export const ease = (
  f: number,
  input: [number, number],
  output: [number, number],
  easing: (t: number) => number = Easing.bezier(0.33, 0, 0.2, 1),
) => interpolate(f, input, output, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing });

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const mixColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
};

export type Pt = [number, number];
/** point at normalised distance t (0..1) along a polyline */
export const pointAt = (pts: Pt[], t: number): Pt => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  const total = segs.reduce((a, b) => a + b, 0);
  let d = ((t % 1) + 1) % 1 * total;
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) {
      const k = d / segs[i];
      return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)];
    }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};
export const polyLen = (pts: Pt[]) =>
  pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
export const polyD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");

// ---------- sky + sun ----------
const SKY = {
  dawn: ["#1B2A4E", "#E98A5E", "#FFD29A"],
  day: ["#2F7FE0", "#7EC3FF", "#DDF0FF"],
  dusk: ["#0B1230", "#4B2A6B", "#F08A4B"],
  night: ["#050A18", "#0D1838", "#27315C"],
};
export const Sky: React.FC<{ from: keyof typeof SKY; to?: keyof typeof SKY; t?: number }> = ({ from, to, t = 0 }) => {
  const a = SKY[from];
  const b = SKY[to ?? from];
  const c = a.map((col, i) => mixColor(col, b[i], t));
  return <AbsoluteFill style={{ background: `linear-gradient(180deg, ${c[0]} 0%, ${c[1]} 58%, ${c[2]} 100%)` }} />;
};

export const Sun: React.FC<{ x: number; y: number; r: number; glow?: number }> = ({ x, y, r, glow = 1 }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <radialGradient id="sunGlow">
          <stop offset="0%" stopColor={C.sunCore} stopOpacity={0.9 * glow} />
          <stop offset="35%" stopColor={C.sun} stopOpacity={0.45 * glow} />
          <stop offset="100%" stopColor={C.sun} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle cx={x} cy={y} r={r * 4.2} fill="url(#sunGlow)" />
      <g transform={`rotate(${f * 0.25} ${x} ${y})`} opacity={0.5 * glow}>
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={i} x1={x} y1={y - r * 1.35} x2={x} y2={y - r * (1.8 + (i % 2) * 0.45)}
            stroke={C.sunCore} strokeWidth={4} strokeLinecap="round" transform={`rotate(${i * 22.5} ${x} ${y})`} />
        ))}
      </g>
      <circle cx={x} cy={y} r={r} fill={C.sun} />
      <circle cx={x} cy={y} r={r * 0.72} fill={C.sunCore} opacity={0.85} />
    </svg>
  );
};

// ---------- desert ground ----------
export const Desert: React.FC<{ horizon?: number; tint?: number }> = ({ horizon = 640, tint = 0 }) => (
  <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
    <defs>
      <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={mixColor(C.sand, "#5A3F5E", tint)} />
        <stop offset="1" stopColor={mixColor(C.sandDark, "#2A1D36", tint)} />
      </linearGradient>
    </defs>
    <path d={`M0 ${horizon} C 300 ${horizon - 40}, 520 ${horizon - 10}, 820 ${horizon - 28} S 1400 ${horizon - 50}, 1920 ${horizon - 18} L1920 1080 L0 1080 Z`}
      fill={mixColor("#D9B27A", "#3D2B4A", tint)} opacity={0.8} />
    <path d={`M0 ${horizon + 20} C 400 ${horizon + 5}, 900 ${horizon + 30}, 1920 ${horizon + 8} L1920 1080 L0 1080 Z`} fill="url(#sand)" />
  </svg>
);

// ---------- perspective solar panel field ----------
/** rows of panels receding to a vanishing point; `grow` 0..1 reveals rows front-to-back */
export const PanelField: React.FC<{ grow?: number; glint?: number; dusk?: number; rows?: number; horizon?: number }> = ({
  grow = 1, glint = 0, dusk = 0, rows = 9, horizon = 640,
}) => {
  const vp: Pt = [W * 0.5, horizon - 60];
  const items: React.ReactNode[] = [];
  for (let r = rows - 1; r >= 0; r--) {
    const depth = r / rows; // 0 = front
    const appear = ease(grow * (rows + 3) - r, [0, 1], [0, 1]);
    if (appear <= 0) continue;
    const y = lerp(1030, horizon + 8, Math.pow(depth, 0.62));
    const h = lerp(66, 5, Math.pow(depth, 0.62));
    const spread = lerp(1.0, 0.08, Math.pow(depth, 0.62));
    const x0 = lerp(vp[0], -260, spread);
    const x1 = lerp(vp[0], W + 260, spread);
    const tilt = h * 0.55;
    const cols = 26;
    const panelCol = mixColor(C.panel, "#1A2150", dusk);
    const hi = mixColor(C.panelHi, "#6C4E86", dusk);
    const g = glint > 0 ? Math.max(0, 1 - Math.abs(((glint * 1.6 - depth) % 1.6) - 0.3) * 4) : 0;
    items.push(
      <g key={r} opacity={appear} transform={`translate(0 ${(1 - appear) * 30})`}>
        {/* support legs */}
        {Array.from({ length: 7 }).map((_, i) => {
          const lx = lerp(x0, x1, (i + 0.5) / 7);
          return <line key={i} x1={lx} y1={y} x2={lx} y2={y + h * 0.5} stroke="#5E6678" strokeWidth={Math.max(1, h * 0.05)} />;
        })}
        <polygon points={`${x0},${y + h * 0.55} ${x1},${y + h * 0.55} ${x1},${y + h * 0.2} ${x0},${y + h * 0.2}`} fill="#000" opacity={0.18} />
        <polygon points={`${x0},${y} ${x1},${y} ${x1 + tilt * 0.2},${y - h} ${x0 - tilt * 0.2},${y - h}`}
          fill={panelCol} stroke={C.frame} strokeWidth={Math.max(0.6, h * 0.025)} />
        <polygon points={`${x0},${y} ${x1},${y} ${x1 + tilt * 0.2},${y - h} ${x0 - tilt * 0.2},${y - h}`}
          fill={hi} opacity={0.18 + g * 0.55} />
        {Array.from({ length: cols - 1 }).map((_, i) => {
          const t = (i + 1) / cols;
          return <line key={i} x1={lerp(x0, x1, t)} y1={y} x2={lerp(x0 - tilt * 0.2, x1 + tilt * 0.2, t)} y2={y - h}
            stroke={C.panelLine} strokeOpacity={0.35} strokeWidth={Math.max(0.4, h * 0.012)} />;
        })}
        <line x1={x0 - tilt * 0.1} y1={y - h / 2} x2={x1 + tilt * 0.1} y2={y - h / 2} stroke={C.panelLine} strokeOpacity={0.3} strokeWidth={Math.max(0.4, h * 0.012)} />
      </g>,
    );
  }
  return <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>{items}</svg>;
};

// ---------- text chrome ----------
export const SceneTag: React.FC<{ n: number; total: number; label: string }> = ({ n, total, label }) => {
  const f = useCurrentFrame();
  const o = ease(f, [6, 22], [0, 1]);
  const lw = ease(f, [10, 34], [0, 1]);
  return (
    <div style={{ position: "absolute", left: 80, top: 64, opacity: o, fontFamily: FONT_HEAD, color: C.ink }}>
      <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 500, opacity: 0.75 }}>
        {String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}
      </div>
      <div style={{ fontSize: 46, fontWeight: 700, marginTop: 6, textShadow: "0 2px 18px rgba(0,0,0,0.35)" }}>{label}</div>
      <div style={{ height: 4, width: 120 * lw, background: C.sun, borderRadius: 2, marginTop: 12 }} />
    </div>
  );
};

type Word = { t: number; d: number; w: string };
/** karaoke-style captions: groups words into short lines, highlights the spoken word */
export const Captions: React.FC<{ words: Word[]; offsetFrames: number }> = ({ words, offsetFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (f - offsetFrames) / fps;
  const lines: Word[][] = [];
  let cur: Word[] = [];
  let len = 0;
  words.forEach((w, i) => {
    const prev = words[i - 1];
    const pause = prev ? w.t - (prev.t + prev.d) : 0;
    if (cur.length && (len + w.w.length > 44 || pause > 0.28)) { lines.push(cur); cur = []; len = 0; }
    cur.push(w); len += w.w.length + 1;
  });
  if (cur.length) lines.push(cur);
  const idx = lines.findIndex((l, i) => {
    const next = lines[i + 1];
    return t >= l[0].t - 0.15 && (!next || t < next[0].t - 0.15);
  });
  if (idx < 0 || t < -0.2) return null;
  const line = lines[idx];
  const end = line[line.length - 1];
  const fadeOut = idx === lines.length - 1 ? ease(t, [end.t + end.d + 0.4, end.t + end.d + 0.7], [1, 0]) : 1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", opacity: fadeOut }}>
      <div style={{ background: "rgba(6,12,24,0.62)", backdropFilter: "blur(8px)", padding: "14px 30px", borderRadius: 14,
        fontFamily: FONT_BODY, fontSize: 38, fontWeight: 600, color: C.inkDim, letterSpacing: 0.2, border: "1px solid rgba(255,255,255,0.08)" }}>
        {line.map((w, i) => {
          const active = t >= w.t && t < w.t + Math.max(w.d, 0.18) + 0.05;
          const spoken = t >= w.t;
          return (
            <span key={i} style={{ color: active ? C.sun : spoken ? C.ink : C.inkDim, marginRight: 11 }}>{w.w}</span>
          );
        })}
      </div>
    </div>
  );
};

const STEPS = ["Sunlight", "Solar cells", "DC", "Inverter", "Transformer", "Grid"];
export const StepTracker: React.FC<{ active: number }> = ({ active }) => {
  const f = useCurrentFrame();
  const o = ease(f, [0, 15], [0, 1]);
  return (
    <div style={{ position: "absolute", right: 80, top: 74, display: "flex", gap: 10, opacity: o, fontFamily: FONT_BODY }}>
      {STEPS.map((s, i) => {
        const on = i === active;
        const done = i < active;
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 14px", borderRadius: 999,
            background: on ? "rgba(255,200,61,0.95)" : done ? "rgba(255,255,255,0.18)" : "rgba(6,12,24,0.35)",
            color: on ? "#1A1405" : C.ink, fontSize: 18, fontWeight: 600, border: "1px solid rgba(255,255,255,0.14)" }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: on ? "#1A1405" : done ? C.grid : "rgba(255,255,255,0.4)" }} />
            {s}
          </div>
        );
      })}
    </div>
  );
};

/** callout label with leader line; appears at frame `at` */
export const Callout: React.FC<{ x: number; y: number; tx: number; ty: number; text: string; sub?: string; at: number; color?: string }> = ({
  x, y, tx, ty, text, sub, at, color = C.ink,
}) => {
  const f = useCurrentFrame();
  const p = ease(f, [at, at + 18], [0, 1]);
  const o = ease(f, [at + 8, at + 22], [0, 1]);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={x} cy={y} r={7 * p} fill={color} />
        <circle cx={x} cy={y} r={16 * p} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={2} />
        <line x1={x} y1={y} x2={lerp(x, tx, p)} y2={lerp(y, ty, p)} stroke={color} strokeWidth={2.5} strokeOpacity={0.9} />
      </svg>
      <div style={{ position: "absolute", left: tx + (tx > x ? 14 : -14), top: ty - 26, opacity: o,
        transform: `translateX(${tx > x ? 0 : -100}%)`, fontFamily: FONT_HEAD, color: C.ink, background: "rgba(6,12,24,0.6)", padding: "10px 18px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>{text}</div>
        {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 22, fontWeight: 400, opacity: 0.8, marginTop: 2 }}>{sub}</div>}
      </div>
    </>
  );
};

/** particles flowing along a polyline */
export const Flow: React.FC<{ pts: Pt[]; color: string; count?: number; speed?: number; size?: number; on?: number; seed?: string; wiggle?: number }> = ({
  pts, color, count = 14, speed = 0.012, size = 7, on = 1, seed = "f", wiggle = 0,
}) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <path d={polyD(pts)} fill="none" stroke={color} strokeOpacity={0.22 * on} strokeWidth={size * 1.6} strokeLinecap="round" strokeLinejoin="round" />
      {Array.from({ length: count }).map((_, i) => {
        const t = i / count + f * speed + random(seed + i) * 0.02;
        const [x, y] = pointAt(pts, t);
        const wob = wiggle ? Math.sin(f * 0.3 + i) * wiggle : 0;
        return (
          <g key={i} opacity={on}>
            <circle cx={x} cy={y + wob} r={size * 2.2} fill={color} opacity={0.18} />
            <circle cx={x} cy={y + wob} r={size} fill={color} />
          </g>
        );
      })}
    </svg>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)" }} />
);

/** fade scene in/out at its edges */
export const SceneFade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  const o = Math.min(ease(f, [0, 12], [0, 1]), ease(f, [dur - 12, dur], [1, 0]));
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
