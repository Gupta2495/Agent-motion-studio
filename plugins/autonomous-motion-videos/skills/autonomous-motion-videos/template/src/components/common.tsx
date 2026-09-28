import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { C, FONT_BODY, FONT_HEAD, W, H } from "../theme";

// ---------- math ----------
export const ease = (f: number, i: [number, number], o: [number, number], e = Easing.bezier(0.33, 0, 0.2, 1)) =>
  interpolate(f, i, o, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mixColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], t))).join(",")})`;
};
export type Pt = [number, number];
export const pointAt = (pts: Pt[], t: number): Pt => {
  const segs = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
  let d = (((t % 1) + 1) % 1) * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i]) { const k = d / segs[i]; return [lerp(pts[i][0], pts[i + 1][0], k), lerp(pts[i][1], pts[i + 1][1], k)]; }
    d -= segs[i];
  }
  return pts[pts.length - 1];
};
export const polyD = (pts: Pt[]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0]},${p[1]}`).join(" ");

// ---------- backgrounds ----------
export const Blueprint: React.FC<{ grid?: boolean }> = ({ grid = true }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, ${C.bg1} 0%, ${C.bg2} 75%)` }}>
    {grid && (
      <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.1 }}>
        {Array.from({ length: 33 }).map((_, i) => <line key={"v" + i} x1={i * 60} y1={0} x2={i * 60} y2={H} stroke={C.grid} />)}
        {Array.from({ length: 19 }).map((_, i) => <line key={"h" + i} x1={0} y1={i * 60} x2={W} y2={i * 60} stroke={C.grid} />)}
      </svg>
    )}
  </AbsoluteFill>
);

/** slowly drifting glow particles (ambient motion for any scene) */
export const Particles: React.FC<{ count?: number; color?: string; seed?: string }> = ({ count = 40, color = C.accent, seed = "p" }) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = (random(seed + "x" + i) * W + f * (0.3 + random(seed + "s" + i))) % W;
        const y = (random(seed + "y" + i) * H - f * (0.4 + random(seed + "v" + i) * 0.8) + H * 4) % H;
        const r = 1.5 + random(seed + "r" + i) * 3.5;
        return <circle key={i} cx={x} cy={y} r={r} fill={color} opacity={0.15 + 0.35 * random(seed + "o" + i)} />;
      })}
    </svg>
  );
};

/** route C: slow zoom/pan over an image in public/ */
export const KenBurns: React.FC<{ src: string; dur: number; from?: number; to?: number; panX?: number; panY?: number }> = ({
  src, dur, from = 1.0, to = 1.12, panX = -30, panY = -10,
}) => {
  const f = useCurrentFrame();
  const k = ease(f, [0, dur], [0, 1], Easing.linear);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover",
        transform: `scale(${lerp(from, to, k)}) translate(${panX * k}px, ${panY * k}px)` }} />
    </AbsoluteFill>
  );
};

export const Vignette: React.FC = () => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.38) 100%)" }} />
);

export const SceneFade: React.FC<{ dur: number; children: React.ReactNode }> = ({ dur, children }) => {
  const f = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: Math.min(ease(f, [0, 12], [0, 1]), ease(f, [dur - 12, dur], [1, 0])) }}>{children}</AbsoluteFill>;
};

// ---------- text chrome ----------
export const SceneTag: React.FC<{ n: number; total: number; label: string }> = ({ n, total, label }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 80, top: 64, opacity: ease(f, [6, 22], [0, 1]), fontFamily: FONT_HEAD, color: C.ink }}>
      <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 500, opacity: 0.75 }}>{String(n).padStart(2, "0")} / {String(total).padStart(2, "0")}</div>
      <div style={{ fontSize: 46, fontWeight: 700, marginTop: 6 }}>{label}</div>
      <div style={{ height: 4, width: 120 * ease(f, [10, 34], [0, 1]), background: C.accent, borderRadius: 2, marginTop: 12 }} />
    </div>
  );
};

export const StepTracker: React.FC<{ steps: string[]; active: number }> = ({ steps, active }) => {
  const f = useCurrentFrame();
  return (
    <div style={{ position: "absolute", right: 80, top: 74, display: "flex", gap: 10, fontFamily: FONT_BODY, opacity: ease(f, [0, 15], [0, 1]) }}>
      {steps.map((s, i) => (
        <div key={s} style={{ padding: "8px 14px", borderRadius: 999, fontSize: 18, fontWeight: 600, border: "1px solid rgba(255,255,255,0.14)",
          background: i === active ? C.accent : i < active ? "rgba(255,255,255,0.18)" : "rgba(6,12,24,0.35)", color: i === active ? "#1A1405" : C.ink }}>
          {s}
        </div>
      ))}
    </div>
  );
};

type Word = { t: number; d: number; w: string };
/** karaoke captions; splits on pauses (TTS words carry no punctuation) */
export const Captions: React.FC<{ words: Word[]; offsetFrames: number }> = ({ words, offsetFrames }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = (f - offsetFrames) / fps;
  const lines: Word[][] = [];
  let cur: Word[] = [], len = 0;
  words.forEach((w, i) => {
    const p = words[i - 1];
    const gap = p ? w.t - (p.t + p.d) : 0;
    if (cur.length && (len + w.w.length > 44 || gap > 0.28)) { lines.push(cur); cur = []; len = 0; }
    cur.push(w); len += w.w.length + 1;
  });
  if (cur.length) lines.push(cur);
  const idx = lines.findIndex((l, i) => t >= l[0].t - 0.15 && (!lines[i + 1] || t < lines[i + 1][0].t - 0.15));
  if (idx < 0 || t < -0.2) return null;
  const line = lines[idx], end = line[line.length - 1];
  const fade = idx === lines.length - 1 ? ease(t, [end.t + end.d + 0.4, end.t + end.d + 0.7], [1, 0]) : 1;
  return (
    <div style={{ position: "absolute", left: 0, right: 0, bottom: 70, display: "flex", justifyContent: "center", opacity: fade }}>
      <div style={{ background: "rgba(6,12,24,0.62)", padding: "14px 30px", borderRadius: 14, fontFamily: FONT_BODY, fontSize: 38,
        fontWeight: 600, border: "1px solid rgba(255,255,255,0.08)" }}>
        {line.map((w, i) => {
          const active = t >= w.t && t < w.t + Math.max(w.d, 0.18) + 0.05;
          return <span key={i} style={{ marginRight: 11, color: active ? C.accent : t >= w.t ? C.ink : C.inkDim }}>{w.w}</span>;
        })}
      </div>
    </div>
  );
};

/** label with leader line; keep tx > x near the left edge so the text stays on screen */
export const Callout: React.FC<{ x: number; y: number; tx: number; ty: number; text: string; sub?: string; at: number }> = ({ x, y, tx, ty, text, sub, at }) => {
  const f = useCurrentFrame();
  const p = ease(f, [at, at + 18], [0, 1]);
  return (
    <>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <circle cx={x} cy={y} r={7 * p} fill={C.ink} />
        <circle cx={x} cy={y} r={16 * p} fill="none" stroke={C.ink} strokeOpacity={0.5} strokeWidth={2} />
        <line x1={x} y1={y} x2={lerp(x, tx, p)} y2={lerp(y, ty, p)} stroke={C.ink} strokeWidth={2.5} />
      </svg>
      <div style={{ position: "absolute", left: tx + (tx > x ? 14 : -14), top: ty - 26, opacity: ease(f, [at + 8, at + 22], [0, 1]),
        transform: `translateX(${tx > x ? 0 : -100}%)`, fontFamily: FONT_HEAD, color: C.ink, background: "rgba(6,12,24,0.6)", padding: "10px 18px", borderRadius: 12 }}>
        <div style={{ fontSize: 34, fontWeight: 700 }}>{text}</div>
        {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 22, opacity: 0.8 }}>{sub}</div>}
      </div>
    </>
  );
};

/** glowing particles flowing along a polyline (current, water, data...) */
export const Flow: React.FC<{ pts: Pt[]; color: string; count?: number; speed?: number; size?: number; on?: number; seed?: string; wiggle?: number }> = ({
  pts, color, count = 14, speed = 0.012, size = 7, on = 1, seed = "f", wiggle = 0,
}) => {
  const f = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
      <path d={polyD(pts)} fill="none" stroke={color} strokeOpacity={0.22 * on} strokeWidth={size * 1.6} strokeLinecap="round" strokeLinejoin="round" />
      {Array.from({ length: count }).map((_, i) => {
        const [x, y] = pointAt(pts, i / count + f * speed + random(seed + i) * 0.02);
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
