import React from "react";
import { AbsoluteFill, random, useCurrentFrame } from "remotion";
import { C, FONT_BODY, FONT_HEAD, W, H } from "../theme";
import { Flow, Pt, SceneTag, StepTracker, Sky, Sun, Vignette, ease, lerp, mixColor, polyD } from "../components/common";
import { SceneProps, wordFrame } from "./types";

const Blueprint: React.FC = () => (
  <AbsoluteFill style={{
    background: `radial-gradient(ellipse at 50% 45%, #13254A 0%, ${C.navy} 75%)`,
  }}>
    <svg width={W} height={H} style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
      {Array.from({ length: 33 }).map((_, i) => <line key={"v" + i} x1={i * 60} y1={0} x2={i * 60} y2={H} stroke="#8FB2FF" />)}
      {Array.from({ length: 19 }).map((_, i) => <line key={"h" + i} x1={0} y1={i * 60} x2={W} y2={i * 60} stroke="#8FB2FF" />)}
    </svg>
  </AbsoluteFill>
);

const Label: React.FC<{ x: number; y: number; at: number; title: string; sub?: string; align?: "left" | "center"; color?: string }> = ({ x, y, at, title, sub, align = "center", color = C.ink }) => {
  const f = useCurrentFrame();
  const o = ease(f, [at, at + 15], [0, 1]);
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(${align === "center" ? "-50%" : "0"}, ${(1 - o) * 12}px)`, opacity: o,
      fontFamily: FONT_HEAD, color, textAlign: align, whiteSpace: "nowrap" }}>
      <div style={{ fontSize: 34, fontWeight: 700 }}>{title}</div>
      {sub && <div style={{ fontFamily: FONT_BODY, fontSize: 22, opacity: 0.75, marginTop: 4 }}>{sub}</div>}
    </div>
  );
};

// ---------------- 4. DC + COMBINER ----------------
export const DC: React.FC<SceneProps> = ({ s, n, total }) => {
  const f = useCurrentFrame();
  const tCables = wordFrame(s, /Cables/);
  const tComb = wordFrame(s, /combiner/);
  const rows = [300, 470, 640, 810];
  const box = { x: 1040, y: 555 };
  const on = ease(f, [tCables - 10, tCables + 20], [0, 1]);
  const onOut = ease(f, [tComb, tComb + 25], [0, 1]);
  return (
    <AbsoluteFill>
      <Blueprint />
      <SceneTag n={n} total={total} label="Direct current (DC)" />
      <StepTracker active={2} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        {rows.map((y, r) => (
          <g key={r} opacity={ease(f, [r * 6, 20 + r * 6], [0, 1])}>
            {Array.from({ length: 6 }).map((_, i) => (
              <g key={i}>
                <rect x={130 + i * 105} y={y - 45} width={92} height={90} rx={6} fill={C.panel} stroke={C.panelLine} strokeOpacity={0.6} strokeWidth={2} />
                <line x1={130 + i * 105 + 46} y1={y - 45} x2={130 + i * 105 + 46} y2={y + 45} stroke={C.panelLine} strokeOpacity={0.35} />
                <line x1={130 + i * 105} y1={y} x2={130 + i * 105 + 92} y2={y} stroke={C.panelLine} strokeOpacity={0.35} />
              </g>
            ))}
          </g>
        ))}
        {/* combiner box */}
        <g opacity={ease(f, [tComb - 25, tComb], [0, 1])}>
          <rect x={box.x - 90} y={box.y - 120} width={180} height={240} rx={18} fill="#1B2B4A" stroke={C.dc} strokeWidth={3} />
          {Array.from({ length: 4 }).map((_, i) => <rect key={i} x={box.x - 55} y={box.y - 85 + i * 45} width={110} height={24} rx={5} fill="#263D66" stroke={C.dc} strokeOpacity={0.5} />)}
        </g>
      </svg>
      {rows.map((y, r) => (
        <Flow key={r} seed={"r" + r} on={on} color={C.dc} size={6} count={9} speed={0.011}
          pts={[[760, y], [880, y], [880, box.y - 60 + r * 40], [box.x - 90, box.y - 60 + r * 40]]} />
      ))}
      <Flow seed="out" on={onOut} color={C.dc} size={10} count={12} speed={0.013} pts={[[box.x + 90, box.y], [1780, box.y]]} />
      <Label x={box.x} y={box.y + 140} at={tComb} title="Combiner box" sub="gathers the current from every row" />
      <Label x={1450} y={box.y - 110} at={tComb + 20} title="to the inverter →" color={C.dc} />
      {/* DC graph */}
      <div style={{ position: "absolute", left: 1290, top: 700, opacity: ease(f, [wordFrame(s, /direct/), wordFrame(s, /direct/) + 15], [0, 1]) }}>
        <svg width={420} height={180}>
          <line x1={20} y1={150} x2={400} y2={150} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
          <line x1={20} y1={20} x2={20} y2={160} stroke="rgba(255,255,255,0.35)" strokeWidth={2} />
          <path d={`M20 70 H ${20 + 380 * ease(f, [wordFrame(s, /direct/), wordFrame(s, /direct/) + 40], [0, 1])}`} stroke={C.dc} strokeWidth={6} fill="none" strokeLinecap="round" />
        </svg>
        <div style={{ fontFamily: FONT_BODY, fontSize: 24, color: C.ink, marginTop: 4 }}>
          <b style={{ color: C.dc }}>DC</b> — flows steadily in <b>one direction</b>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 5. INVERTER ----------------
export const Inverter: React.FC<SceneProps> = ({ s, n, total }) => {
  const f = useCurrentFrame();
  const tInv = wordFrame(s, /inverter/);
  const tFifty = wordFrame(s, /fifty/);
  const tSmooth = wordFrame(s, /smooth/);
  const tHomes = wordFrame(s, /homes/);
  const cx = W / 2, cy = 540;
  const boxOn = ease(f, [tInv - 20, tInv + 5], [0, 1]);
  const flip = Math.sin((f - tInv) * 0.35) > 0 ? 0 : 180;
  const acDraw = ease(f, [tInv + 10, tSmooth + 20], [0, 1]);
  // AC wave on the right (scrolling)
  const wave = Array.from({ length: 121 }).map((_, i) => {
    const x = 1180 + i * 5.4;
    const y = 540 - Math.sin(i * 0.16 - f * 0.25) * 110;
    return `${i ? "L" : "M"}${x},${y}`;
  }).join(" ");
  const hz = Math.round(ease(f, [tFifty - 5, tFifty + 25], [0, 50]));
  return (
    <AbsoluteFill>
      <Blueprint />
      <SceneTag n={n} total={total} label="DC → AC: the inverter" />
      <StepTracker active={3} />
      {/* home hint */}
      <div style={{ position: "absolute", right: 90, top: 190, fontFamily: FONT_BODY, color: C.ink, fontSize: 24, textAlign: "right",
        opacity: ease(f, [tHomes, tHomes + 15], [0, 1]) }}>
        Homes & the grid use <b style={{ color: C.ac }}>alternating current (AC)</b>
      </div>
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <defs><filter id="g2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>
        {/* DC in */}
        <line x1={120} y1={cy} x2={cx - 190} y2={cy} stroke={C.dc} strokeOpacity={0.25} strokeWidth={16} strokeLinecap="round" />
        {/* AC out wave */}
        <g opacity={acDraw} filter="url(#g2)">
          <path d={wave} stroke={C.ac} strokeWidth={7} fill="none" strokeLinecap="round" />
        </g>
        <line x1={1180} y1={cy} x2={1830} y2={cy} stroke="rgba(255,255,255,0.18)" strokeWidth={2} strokeDasharray="8 10" opacity={acDraw} />
        {/* inverter box */}
        <g opacity={boxOn} transform={`translate(${cx} ${cy}) scale(${lerp(0.85, 1, boxOn)}) translate(${-cx} ${-cy})`}>
          <rect x={cx - 190} y={cy - 170} width={380} height={340} rx={26} fill="#1A2744" stroke="#C9D3E3" strokeWidth={4} />
          {Array.from({ length: 8 }).map((_, i) => <rect key={i} x={cx - 150 + i * 38} y={cy - 150} width={18} height={50} rx={4} fill="#2B3D63" />)}
          <circle cx={cx + 140} cy={cy + 130} r={10} fill={C.grid} opacity={0.5 + 0.5 * Math.abs(Math.sin(f * 0.2))} />
          <g transform={`rotate(${flip} ${cx} ${cy + 20})`}>
            <path d={`M${cx - 80} ${cy + 20} H ${cx + 60}`} stroke={C.ac} strokeWidth={10} strokeLinecap="round" />
            <path d={`M${cx + 40} ${cy - 5} L ${cx + 80} ${cy + 20} L ${cx + 40} ${cy + 45}`} stroke={C.ac} strokeWidth={10} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </g>
          <text x={cx} y={cy + 115} textAnchor="middle" fontFamily="Space Grotesk" fontWeight={700} fontSize={34} fill={C.ink} letterSpacing={6}>INVERTER</text>
        </g>
      </svg>
      <Flow seed="dcin" color={C.dc} size={8} count={10} speed={0.014} pts={[[120, cy], [cx - 190, cy]]} />
      <div style={{ position: "absolute", left: 130, top: cy + 60, fontFamily: FONT_HEAD, color: C.dc, fontSize: 32, fontWeight: 700 }}>DC in</div>
      <div style={{ position: "absolute", right: 110, top: cy + 150, fontFamily: FONT_HEAD, color: C.ac, fontSize: 32, fontWeight: 700, opacity: acDraw }}>AC out</div>
      {/* 50 Hz badge */}
      <div style={{ position: "absolute", left: cx, top: cy + 210, transform: "translateX(-50%)", opacity: ease(f, [tFifty - 5, tFifty + 10], [0, 1]),
        fontFamily: FONT_HEAD, color: C.ink, textAlign: "center" }}>
        <div style={{ fontSize: 72, fontWeight: 700, color: C.ac }}>{hz} Hz</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 24, opacity: 0.8 }}>direction flips 50 times every second</div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 6. TRANSFORMER ----------------
const Coil: React.FC<{ x: number; y: number; turns: number; h: number; color: string; glow: number }> = ({ x, y, turns, h, color, glow }) => (
  <g>
    {Array.from({ length: turns }).map((_, i) => {
      const yy = y - h / 2 + (i + 0.5) * (h / turns);
      return <ellipse key={i} cx={x} cy={yy} rx={62} ry={Math.max(5, h / turns / 2.4)} fill="none" stroke={color} strokeWidth={Math.max(4, 90 / turns)}
        strokeOpacity={0.55 + 0.45 * glow} />;
    })}
  </g>
);

export const Transformer: React.FC<SceneProps> = ({ s, n, total }) => {
  const f = useCurrentFrame();
  const tRaise = wordFrame(s, /raises/);
  const tHundreds = wordFrame(s, /hundred/, 30, 0);
  const tThousand = wordFrame(s, /thousand/);
  const tLoss = wordFrame(s, /loss/);
  const cx = 820, cy = 560;
  const on = ease(f, [0, 30], [0, 1]);
  const volts = Math.round(ease(f, [tHundreds, tThousand + 30], [400, 132000]) / 100) * 100;
  const pulse = (Math.sin(f * 0.35) + 1) / 2;
  const current = ease(f, [tHundreds, tThousand + 30], [1, 0.02]);
  return (
    <AbsoluteFill>
      <Blueprint />
      <SceneTag n={n} total={total} label="Step-up transformer" />
      <StepTracker active={4} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }} opacity={on}>
        {/* iron core */}
        <rect x={cx - 260} y={cy - 230} width={520} height={460} rx={24} fill="none" stroke="#6F7C93" strokeWidth={46} />
        <Coil x={cx - 260} y={cy} turns={5} h={300} color={C.ac} glow={pulse} />
        <Coil x={cx + 260} y={cy} turns={16} h={360} color={C.grid} glow={1 - pulse} />
      </svg>
      <Flow seed="tin" color={C.ac} size={8} count={8} speed={0.012} wiggle={10} pts={[[90, cy], [cx - 330, cy]]} />
      <Flow seed="tout" color={C.grid} size={6} count={14} speed={0.02} on={ease(f, [tRaise, tRaise + 20], [0, 1])} pts={[[cx + 330, cy], [1840, cy]]} />
      <div style={{ position: "absolute", left: cx - 260, top: cy + 260, transform: "translateX(-50%)", fontFamily: FONT_HEAD, color: C.ac, textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>Few turns</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 22, color: C.ink, opacity: 0.8 }}>~400 V in</div>
      </div>
      <div style={{ position: "absolute", left: cx + 260, top: cy + 260, transform: "translateX(-50%)", fontFamily: FONT_HEAD, color: C.grid, textAlign: "center" }}>
        <div style={{ fontSize: 30, fontWeight: 700 }}>Many turns</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 22, color: C.ink, opacity: 0.8 }}>high voltage out</div>
      </div>
      {/* voltage meter */}
      <div style={{ position: "absolute", right: 110, top: 230, width: 520, fontFamily: FONT_HEAD, color: C.ink, opacity: ease(f, [tRaise, tRaise + 15], [0, 1]) }}>
        <div style={{ fontFamily: FONT_BODY, fontSize: 22, opacity: 0.75, letterSpacing: 2 }}>VOLTAGE</div>
        <div style={{ fontSize: 92, fontWeight: 700, color: volts > 100000 ? C.grid : C.ink }}>{volts.toLocaleString("en-IN")} V</div>
        <div style={{ height: 14, background: "rgba(255,255,255,0.12)", borderRadius: 7, marginTop: 8 }}>
          <div style={{ height: 14, width: `${(volts / 132000) * 100}%`, background: C.grid, borderRadius: 7 }} />
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 22, opacity: 0.75, letterSpacing: 2, marginTop: 30 }}>CURRENT → HEAT LOSS IN WIRES</div>
        <div style={{ height: 14, background: "rgba(255,255,255,0.12)", borderRadius: 7, marginTop: 10 }}>
          <div style={{ height: 14, width: `${current * 100}%`, background: mixColor("#FF6B5B", "#FFB547", 1 - current), borderRadius: 7 }} />
        </div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 24, marginTop: 18, opacity: ease(f, [tLoss - 10, tLoss + 10], [0, 1]) }}>
          Higher voltage → lower current → <b style={{ color: C.grid }}>far less energy lost</b>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 7. GRID + CITY AT DUSK ----------------
const Tower: React.FC<{ x: number; base: number; h: number; col: string }> = ({ x, base, h, col }) => {
  const w = h * 0.34;
  return (
    <g stroke={col} strokeWidth={Math.max(1.5, h / 90)} fill="none">
      <path d={`M${x - w / 2} ${base} L${x - w * 0.12} ${base - h} L${x + w * 0.12} ${base - h} L${x + w / 2} ${base}`} />
      {Array.from({ length: 5 }).map((_, i) => {
        const y1 = base - (h * i) / 5, y2 = base - (h * (i + 1)) / 5;
        const a = lerp(w / 2, w * 0.12, i / 5), b = lerp(w / 2, w * 0.12, (i + 1) / 5);
        return <path key={i} d={`M${x - a} ${y1} L${x + b} ${y2} M${x + a} ${y1} L${x - b} ${y2}`} />;
      })}
      <path d={`M${x - w * 0.9} ${base - h * 0.82} H ${x + w * 0.9} M${x - w * 0.7} ${base - h * 0.62} H ${x + w * 0.7}`} />
    </g>
  );
};

export const Grid: React.FC<SceneProps> = ({ s, n, total }) => {
  const f = useCurrentFrame();
  const d = s.durationFrames;
  const tEvening = wordFrame(s, /evening/);
  const tCity = wordFrame(s, /city/);
  const tSun = wordFrame(s, /sun\.?$/);
  const dusk = ease(f, [tEvening - 30, tCity + 30], [0, 1]);
  const night = ease(f, [tCity, d], [0, 1]);
  const base = 800;
  const towers = [{ x: 180, h: 420 }, { x: 640, h: 330 }, { x: 1000, h: 260 }, { x: 1280, h: 210 }];
  const col = mixColor("#3B4A63", "#1B2233", dusk);
  const wires: Pt[][] = [0.82, 0.62].map((k) =>
    towers.flatMap((t, i) => {
      const y = base - t.h * k;
      if (i === 0) return [[t.x, y] as Pt];
      const p = towers[i - 1];
      const py = base - p.h * k;
      const mx = (p.x + t.x) / 2;
      return [[mx, (py + y) / 2 + 26] as Pt, [t.x, y] as Pt];
    }).concat([[1480, base - 180] as Pt]),
  );
  const buildings = Array.from({ length: 16 }).map((_, i) => ({
    x: 1440 + i * 30 + random("bx" + i) * 10,
    w: 40 + random("bw" + i) * 40,
    h: 120 + random("bh" + i) * 300,
  }));
  return (
    <AbsoluteFill>
      <Sky from="day" to="dusk" t={dusk} />
      <AbsoluteFill style={{ opacity: night }}><Sky from="night" /></AbsoluteFill>
      <Sun x={340} y={lerp(220, 760, dusk)} r={56} glow={1 - night} />
      <svg width={W} height={H} style={{ position: "absolute", inset: 0 }}>
        <path d={`M0 ${base} C 500 ${base - 30}, 1100 ${base + 10}, 1920 ${base - 10} L1920 1080 L0 1080 Z`} fill={mixColor("#6E8E5A", "#1A2130", dusk)} />
        {buildings.map((b, i) => {
          const bx = b.x, by = base - b.h;
          const winLit = ease(f, [tCity - 10 + i * 4, tCity + 30 + i * 4], [0, 1]);
          return (
            <g key={i}>
              <rect x={bx} y={by} width={b.w} height={b.h} fill={mixColor("#8796B0", "#141A2B", dusk)} />
              {Array.from({ length: Math.floor(b.h / 26) }).map((_, r) =>
                Array.from({ length: Math.floor(b.w / 16) }).map((_, c) => {
                  const lit = random(`w${i}-${r}-${c}`) < 0.7 && random(`o${i}-${r}-${c}`) < winLit * 1.1;
                  return <rect key={`${r}-${c}`} x={bx + 5 + c * 16} y={by + 8 + r * 26} width={8} height={12} fill={lit ? "#FFD57A" : "rgba(255,255,255,0.08)"} />;
                }),
              )}
            </g>
          );
        })}
        {towers.map((t, i) => <Tower key={i} x={t.x} base={base} h={t.h} col={col} />)}
        {wires.map((w, i) => <path key={i} d={polyD(w)} stroke={col} strokeWidth={3} fill="none" />)}
      </svg>
      {wires.map((w, i) => <Flow key={i} seed={"wire" + i} pts={w} color={C.grid} size={5} count={10} speed={0.01} on={ease(f, [10, 40], [0, 1])} />)}
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at 85% 70%, rgba(255,200,110,${0.25 * night}) 0%, rgba(0,0,0,0) 45%)` }} />
      <Vignette />
      <SceneTag n={n} total={total} label="Across the grid" />
      <StepTracker active={5} />
      <div style={{ position: "absolute", left: 1460, top: 250, fontFamily: FONT_HEAD, color: C.ink, opacity: ease(f, [tSun - 20, tSun], [0, 1]) }}>
        <div style={{ fontSize: 52, fontWeight: 700 }}>Powered by the <span style={{ color: C.sun }}>sun</span></div>
      </div>
    </AbsoluteFill>
  );
};

// ---------------- 8. RECAP ----------------
const Icon: React.FC<{ kind: number; color: string }> = ({ kind, color }) => (
  <svg width={140} height={140} viewBox="0 0 140 140">
    {kind === 0 && (<g><circle cx={70} cy={70} r={30} fill={color} />{Array.from({ length: 8 }).map((_, i) => <line key={i} x1={70} y1={22} x2={70} y2={8} stroke={color} strokeWidth={7} strokeLinecap="round" transform={`rotate(${i * 45} 70 70)`} />)}</g>)}
    {kind === 1 && (<g><rect x={20} y={35} width={100} height={70} rx={6} fill="none" stroke={color} strokeWidth={7} /><path d="M53 35 V105 M87 35 V105 M20 70 H120" stroke={color} strokeWidth={5} /></g>)}
    {kind === 2 && (<g><rect x={25} y={25} width={90} height={90} rx={16} fill="none" stroke={color} strokeWidth={7} /><path d="M40 70 Q 55 45 70 70 T 100 70" stroke={color} strokeWidth={7} fill="none" /></g>)}
    {kind === 3 && (<g><rect x={22} y={30} width={96} height={80} rx={10} fill="none" stroke={color} strokeWidth={7} />{[0, 1, 2].map((i) => <ellipse key={i} cx={45} cy={52 + i * 18} rx={14} ry={6} fill="none" stroke={color} strokeWidth={5} />)}{[0, 1, 2, 3, 4].map((i) => <ellipse key={"b" + i} cx={95} cy={46 + i * 12} rx={14} ry={4} fill="none" stroke={color} strokeWidth={4} />)}</g>)}
    {kind === 4 && (<g stroke={color} strokeWidth={6} fill="none"><path d="M45 120 L62 25 H78 L95 120 M52 85 H88 M57 55 H83 M30 40 H110" /></g>)}
  </svg>
);

export const Recap: React.FC<SceneProps> = ({ s }) => {
  const f = useCurrentFrame();
  const d = s.durationFrames;
  const labels = ["Sunlight", "Solar cells", "Inverter", "Transformer", "Grid"];
  const res = [/Sunlight/, /Solar/, /Inverter/, /Transformer/, /Grid/];
  const times = res.map((r) => wordFrame(s, r));
  const tEnd = wordFrame(s, /That's/);
  const colors = [C.sun, C.panelHi, C.ac, C.grid, C.grid];
  const final = ease(f, [tEnd, tEnd + 20], [0, 1]);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 40%, #16284D 0%, ${C.navy} 75%)` }}>
      <div style={{ position: "absolute", top: 330 - final * 90, left: 0, right: 0, display: "flex", justifyContent: "center", alignItems: "center", gap: 18 }}>
        {labels.map((l, i) => {
          const o = ease(f, [times[i] - 6, times[i] + 10], [0, 1]);
          const active = f >= times[i] && (i === 4 ? f < tEnd : f < times[i + 1]);
          return (
            <React.Fragment key={l}>
              {i > 0 && (
                <svg width={70} height={20} style={{ opacity: o }}>
                  <line x1={0} y1={10} x2={60 * o} y2={10} stroke="rgba(255,255,255,0.5)" strokeWidth={4} strokeLinecap="round" />
                  <path d="M52 2 L64 10 L52 18" stroke="rgba(255,255,255,0.5)" strokeWidth={4} fill="none" opacity={o} />
                </svg>
              )}
              <div style={{ opacity: o, transform: `translateY(${(1 - o) * 30}px) scale(${active ? 1.08 : 1})`, textAlign: "center",
                padding: "18px 12px 20px", borderRadius: 26, width: 230,
                background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)", border: `2px solid ${active ? colors[i] : "rgba(255,255,255,0.08)"}` }}>
                <Icon kind={i} color={colors[i]} />
                <div style={{ fontFamily: FONT_HEAD, fontSize: 30, fontWeight: 700, color: C.ink, marginTop: 6 }}>{l}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 640, width: "100%", textAlign: "center", opacity: final, fontFamily: FONT_HEAD, color: C.ink,
        transform: `translateY(${(1 - final) * 30}px)` }}>
        <div style={{ fontSize: 84, fontWeight: 700 }}>From <span style={{ color: C.sun }}>sunlight</span> to city lights</div>
        <div style={{ fontFamily: FONT_BODY, fontSize: 26, opacity: ease(f, [tEnd + 40, tEnd + 60], [0, 0.7]), marginTop: 22 }}>
          Rendered entirely in code · React + SVG (Remotion) · narration: neural TTS
        </div>
      </div>
      {f > d ? null : null}
    </AbsoluteFill>
  );
};
