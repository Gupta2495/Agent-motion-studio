import React from "react";
import { random, useCurrentFrame } from "remotion";
import { C } from "../theme";

/** Big animated illustrative icons for point scenes. Add your own by extending the switch. */
export const HeroIcon: React.FC<{ name?: string; size?: number; appear?: number }> = ({ name = "spark", size = 520, appear = 1 }) => {
  const f = useCurrentFrame();
  const glow = (col: string) => <circle cx={200} cy={200} r={170} fill={col} opacity={0.08 + 0.04 * Math.sin(f * 0.08)} />;
  let body: React.ReactNode;
  switch (name) {
    case "sun":
      body = (
        <g>
          {glow(C.accent)}
          <g transform={`rotate(${f * 0.6} 200 200)`}>
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={200} y1={70} x2={200} y2={i % 2 ? 40 : 20} stroke={C.accent} strokeWidth={10} strokeLinecap="round" transform={`rotate(${i * 30} 200 200)`} />
            ))}
          </g>
          <circle cx={200} cy={200} r={95} fill={C.accent} />
          <circle cx={200} cy={200} r={68} fill="#FFF3C4" opacity={0.85} />
        </g>
      );
      break;
    case "cloud":
      body = (
        <g transform={`translate(${Math.sin(f * 0.04) * 14} 0)`}>
          {glow(C.blue)}
          <path d="M110 250 a60 60 0 0 1 20-116 a80 80 0 0 1 150 18 a55 55 0 0 1 10 98 z" fill="#E8F1FB" />
          <path d="M110 250 h180" stroke="#C9D8EA" strokeWidth={6} />
        </g>
      );
      break;
    case "rain":
      body = (
        <g>
          {glow(C.blue)}
          <path d="M100 190 a55 55 0 0 1 18-104 a74 74 0 0 1 138 16 a50 50 0 0 1 8 88 z" fill="#C9D6E6" />
          {Array.from({ length: 14 }).map((_, i) => {
            const x = 110 + random("rx" + i) * 180;
            const y = 200 + ((f * 6 + random("ry" + i) * 200) % 170);
            return <line key={i} x1={x} y1={y} x2={x - 6} y2={y + 26} stroke={C.blue} strokeWidth={6} strokeLinecap="round" opacity={1 - (y - 200) / 190} />;
          })}
        </g>
      );
      break;
    case "bolt":
      body = (
        <g>
          {glow(C.accent)}
          <path d="M220 40 L120 220 H195 L170 360 L290 160 H210 Z" fill={C.accent} opacity={0.75 + 0.25 * Math.abs(Math.sin(f * 0.2))} />
        </g>
      );
      break;
    case "gear":
      body = (
        <g transform={`rotate(${f * 0.8} 200 200)`}>
          {glow(C.green)}
          {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={186} y={52} width={28} height={50} rx={6} fill={C.green} transform={`rotate(${i * 36} 200 200)`} />)}
          <circle cx={200} cy={200} r={110} fill={C.green} />
          <circle cx={200} cy={200} r={46} fill={C.bg2} />
        </g>
      );
      break;
    case "drop":
      body = (
        <g transform={`translate(0 ${Math.sin(f * 0.07) * 10})`}>
          {glow(C.blue)}
          <path d="M200 60 C 260 150, 300 200, 300 250 a100 100 0 0 1 -200 0 C100 200, 140 150, 200 60 z" fill={C.blue} />
          <path d="M160 250 a40 40 0 0 0 40 40" stroke="#E8F7FF" strokeWidth={10} fill="none" strokeLinecap="round" />
        </g>
      );
      break;
    case "leaf":
      body = (
        <g transform={`rotate(${Math.sin(f * 0.05) * 6} 200 320)`}>
          {glow(C.green)}
          <path d="M200 330 C 90 280, 90 120, 290 70 C 320 200, 280 300, 200 330 z" fill={C.green} />
          <path d="M200 330 C 220 240, 250 160, 290 70" stroke={C.bg2} strokeWidth={8} fill="none" />
        </g>
      );
      break;
    default: // "spark"
      body = (
        <g>
          {glow(C.accent)}
          {[0, 1, 2].map((i) => {
            const r = ((f * 1.2 + i * 50) % 150) + 40;
            return <circle key={i} cx={200} cy={200} r={r} fill="none" stroke={C.accent} strokeWidth={6} opacity={1 - r / 190} />;
          })}
          <circle cx={200} cy={200} r={40} fill={C.accent} />
        </g>
      );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 400 400" style={{ opacity: appear, transform: `scale(${0.85 + 0.15 * appear})` }}>
      {body}
    </svg>
  );
};
