import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { C, FONT_BODY, FONT_HEAD, W, H } from "../theme";
import { Callout, Desert, PanelField, SceneTag, StepTracker, Sky, Sun, Vignette, ease, lerp } from "../components/common";
import { SceneProps, wordFrame } from "./types";

// ---------------- 1. INTRO ----------------
export const Intro: React.FC<SceneProps> = ({ s }) => {
  const f = useCurrentFrame();
  const d = s.durationFrames;
  const skyT = ease(f, [0, d * 0.9], [0, 1]);
  const sunY = ease(f, [0, d * 0.85], [720, 250]);
  const title = ["How", "a", "Solar", "Power", "Plant", "Works"];
  const push = ease(f, [0, d], [1, 1.08]);
  return (
    <AbsoluteFill>
      <Sky from="dawn" to="day" t={skyT} />
      <Sun x={1380} y={sunY} r={70} glow={ease(f, [0, 60], [0.4, 1])} />
      <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 70%" }}>
        <Desert />
        <PanelField grow={ease(f, [30, d * 0.8], [0, 1])} glint={f / 140} />
      </AbsoluteFill>
      <Vignette />
      <div style={{ position: "absolute", top: 250, width: "100%", textAlign: "center", fontFamily: FONT_HEAD, color: C.ink }}>
        <div style={{ fontSize: 30, letterSpacing: 10, fontWeight: 500, opacity: ease(f, [10, 30], [0, 0.85]) }}>
          ENERGY EXPLAINED
        </div>
        <div style={{ fontSize: 118, fontWeight: 700, lineHeight: 1.05, marginTop: 18, textShadow: "0 6px 40px rgba(0,0,0,0.45)" }}>
          {title.map((w, i) => {
            const t = ease(f, [18 + i * 5, 42 + i * 5], [0, 1]);
            return (
              <span key={w} style={{ display: "inline-block", marginRight: 26, opacity: t, transform: `translateY(${(1 - t) * 50}px)`,
                color: w === "Solar" ? C.sun : C.ink }}>{w}</span>
            );
          })}
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 36, marginTop: 24, opacity: ease(f, [70, 95], [0, 0.9]) }}>
          From sunlight to city lights — step by step
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 2. PANEL FIELD ----------------
export const Field: React.FC<SceneProps> = ({ s, n, total }) => {
  const f = useCurrentFrame();
  const d = s.durationFrames;
  const tRows = wordFrame(s, /rows/);
  const tTilt = wordFrame(s, /tilted/);
  const sun = { x: 1560, y: 190 };
  const drift = ease(f, [0, d], [0, -40]);
  return (
    <AbsoluteFill>
      <Sky from="day" />
      <Sun x={sun.x} y={sun.y} r={62} />
      {/* sun rays onto field */}
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          const tx = 250 + i * 230;
          const ty = 760 + (i % 3) * 60;
          const dash = (f * 6 + i * 40) % 120;
          return (
            <line key={i} x1={sun.x} y1={sun.y} x2={tx} y2={ty} stroke={C.sunCore} strokeOpacity={0.55 * ease(f, [20, 50], [0, 1])}
              strokeWidth={3} strokeDasharray="18 22" strokeDashoffset={-dash} />
          );
        })}
      </svg>
      <AbsoluteFill style={{ transform: `translateY(${drift}px)` }}>
        <Desert />
        <PanelField grow={ease(f, [0, 110], [0.05, 1])} glint={f / 110} />
      </AbsoluteFill>
      <Vignette />
      <SceneTag n={n} total={total} label="Photovoltaic panels" />
      <StepTracker active={0} />
      <Callout x={560} y={930} tx={680} ty={590} text="PV panel rows" sub="long rows, spaced to avoid shading" at={tRows} />
      <Callout x={1330} y={880} tx={1450} ty={700} text="Tilted to the sun" sub="≈ your latitude, facing south in India" at={tTilt} />
      <div style={{ position: "absolute", left: 80, top: 210, fontFamily: FONT_BODY, color: C.ink, textAlign: "left",
        opacity: ease(f, [wordFrame(s, /thousands/), wordFrame(s, /thousands/) + 15], [0, 1]) }}>
        <div style={{ fontFamily: FONT_HEAD, fontSize: 64, fontWeight: 700 }}>
          {Math.round(ease(f, [wordFrame(s, /thousands/), wordFrame(s, /thousands/) + 45], [0, 250000])).toLocaleString("en-IN")}
        </div>
        <div style={{ fontSize: 22, opacity: 0.85 }}>panels in a typical 100 MW plant</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 3. SILICON CELL ----------------
const LAYERS = [
  { name: "Anti-reflective glass", color: "#9FD3FF", op: 0.35, h: 60 },
  { name: "N-type silicon", sub: "extra electrons", color: "#2F66D0", op: 1, h: 120 },
  { name: "P–N junction", sub: "electric field", color: "#FFD54A", op: 1, h: 10 },
  { name: "P-type silicon", sub: "electron 'holes'", color: "#5B3FA8", op: 1, h: 170 },
  { name: "Back contact", color: "#9AA4B5", op: 1, h: 34 },
];

export const Cell: React.FC<SceneProps> = ({ s, n, total }) => {
  const f = useCurrentFrame();
  const d = s.durationFrames;
  const X0 = 300, X1 = 1300, TOP = 330;
  const tPhotons = wordFrame(s, /photons/);
  const tElectrons = wordFrame(s, /electrons/);
  const tCurrent = wordFrame(s, /current/);
  const zoom = ease(f, [0, 40], [0.86, 1]);
  let y = TOP;
  const layerRects = LAYERS.map((L, i) => {
    const top = y;
    y += L.h;
    const appear = ease(f, [8 + i * 7, 26 + i * 7], [0, 1]);
    return { ...L, top, appear, i };
  });
  const junctionY = layerRects[2].top + 5;
  // photon -> electron events
  const events = Array.from({ length: 26 }).map((_, i) => {
    const start = tPhotons - 20 + i * 11;
    const x = lerp(X0 + 80, X1 - 120, random("px" + i));
    return { i, start, x };
  });
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 45% 40%, #14264A 0%, ${C.navy} 70%)` }}>
      <SceneTag n={n} total={total} label="Inside a solar cell" />
      <StepTracker active={1} />
      <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: "40% 55%" }}>
        <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
            <linearGradient id="nType" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3C7BF0" /><stop offset="1" stopColor="#2450B0" /></linearGradient>
            <linearGradient id="pType" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6A4CC0" /><stop offset="1" stopColor="#3D2A7A" /></linearGradient>
          </defs>
          {layerRects.map((L) => (
            <g key={L.name} opacity={L.appear} transform={`translate(${(1 - L.appear) * -40} 0)`}>
              <rect x={X0} y={L.top} width={X1 - X0} height={L.h}
                fill={L.i === 1 ? "url(#nType)" : L.i === 3 ? "url(#pType)" : L.color} fillOpacity={L.op}
                filter={L.i === 2 ? "url(#glow)" : undefined} />
              {/* side face for depth */}
              <polygon points={`${X1},${L.top} ${X1 + 60},${L.top - 40} ${X1 + 60},${L.top - 40 + L.h} ${X1},${L.top + L.h}`}
                fill={L.i === 1 ? "#1C3F8C" : L.i === 3 ? "#2E1F60" : L.color} fillOpacity={L.op * 0.8} />
            </g>
          ))}
          {/* top face */}
          <polygon points={`${X0},${TOP} ${X1},${TOP} ${X1 + 60},${TOP - 40} ${X0 + 60},${TOP - 40}`} fill="#BFE3FF" fillOpacity={0.35 * layerRects[0].appear} />
          {/* front metal contact fingers */}
          {Array.from({ length: 9 }).map((_, i) => {
            const x = lerp(X0 + 60, X1 - 60, i / 8);
            return <rect key={i} x={x - 6} y={TOP - 14} width={12} height={16} rx={2} fill="#E8EDF5" opacity={ease(f, [45 + i * 2, 55 + i * 2], [0, 1])} />;
          })}
          {/* busbar wire out to the right */}
          <path d={`M${X1 - 60} ${TOP - 20} H ${X0 - 170} V ${TOP + 230}`} stroke="#E8EDF5" strokeWidth={6} fill="none" opacity={ease(f, [55, 70], [0, 1])} />
          {/* photons & electrons */}
          {events.map(({ i, start, x }) => {
            const lf = f - start;
            if (lf < 0 || lf > 120) return null;
            const fall = ease(lf, [0, 22], [0, 1]);
            const py = lerp(60, junctionY, fall);
            const photonOn = lf < 24;
            // electron: pops at junction, rises to contact, then runs along busbar to the right
            const e1 = ease(lf, [22, 50], [0, 1]);
            const e2 = ease(lf, [50, 105], [0, 1]);
            const ex = e2 > 0 ? lerp(x, X0 - 170, e2) : x + Math.sin(lf * 0.5) * 6 * (1 - e1);
            const ey = e2 > 0 ? TOP - 20 : lerp(junctionY, TOP - 20, e1);
            const eOp = lf < 22 ? 0 : ease(lf, [100, 118], [1, 0]);
            const wave = Array.from({ length: 14 }).map((_, k) => `${k ? "L" : "M"}${x + Math.sin((k + lf) * 1.1) * 10},${py - 90 + k * 7}`).join(" ");
            return (
              <g key={i}>
                {photonOn && (
                  <g filter="url(#glow)">
                    <path d={wave} stroke={C.photon} strokeWidth={3} fill="none" opacity={0.8} />
                    <circle cx={x} cy={py} r={9} fill={C.photon} />
                  </g>
                )}
                {lf >= 20 && lf <= 30 && <circle cx={x} cy={junctionY} r={(lf - 20) * 4} fill="none" stroke={C.photon} strokeOpacity={1 - (lf - 20) / 10} strokeWidth={3} />}
                <g opacity={eOp} filter="url(#glow)">
                  <circle cx={ex} cy={ey} r={10} fill={C.electron} />
                  <text x={ex} y={ey + 5} fontSize={14} fontWeight={800} textAnchor="middle" fill="#06223A" fontFamily="Inter">–</text>
                </g>
              </g>
            );
          })}
        </svg>
        {/* layer labels */}
        {layerRects.map((L) => (
          <div key={L.name} style={{ position: "absolute", left: X1 + 90, top: L.top + L.h / 2 - 22, opacity: ease(f, [20 + L.i * 8, 36 + L.i * 8], [0, 1]),
            fontFamily: FONT_BODY, color: C.ink, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 26, fontWeight: 600 }}>{L.name}</span>
            {L.sub && <span style={{ fontSize: 20, opacity: 0.65, marginLeft: 12 }}>{L.sub}</span>}
          </div>
        ))}
      </AbsoluteFill>
      {/* legend */}
      <div style={{ position: "absolute", left: 300, bottom: 190, display: "flex", gap: 40, fontFamily: FONT_BODY, fontSize: 26, color: C.ink }}>
        <div style={{ opacity: ease(f, [tPhotons, tPhotons + 15], [0, 1]), display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: C.photon, boxShadow: `0 0 18px ${C.photon}` }} /> Photon (light)
        </div>
        <div style={{ opacity: ease(f, [tElectrons, tElectrons + 15], [0, 1]), display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 18, height: 18, borderRadius: 9, background: C.electron, boxShadow: `0 0 18px ${C.electron}` }} /> Free electron
        </div>
        <div style={{ opacity: ease(f, [tCurrent, tCurrent + 15], [0, 1]), display: "flex", alignItems: "center", gap: 12, color: C.electron, fontWeight: 700 }}>
          ← Moving electrons = electric current
        </div>
      </div>
    </AbsoluteFill>
  );
};
