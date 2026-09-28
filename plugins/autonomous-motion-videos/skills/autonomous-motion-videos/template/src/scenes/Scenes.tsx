import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C, FONT_BODY, FONT_HEAD } from "../theme";
import { Blueprint, KenBurns, Particles, SceneTag, StepTracker, Vignette, ease } from "../components/common";
import { HeroIcon } from "../components/Icons";
import { SceneProps, cueFrames, wordFrame } from "./types";

// ---------------- TITLE ----------------
export const TitleScene: React.FC<SceneProps> = ({ s, brand }) => {
  const f = useCurrentFrame();
  const words = (s.title ?? "").split(" ");
  const push = ease(f, [0, s.durationFrames], [1, 1.06]);
  return (
    <AbsoluteFill>
      {s.image ? <KenBurns src={s.image} dur={s.durationFrames} /> : <Blueprint grid={false} />}
      {s.image && <AbsoluteFill style={{ background: "rgba(6,12,24,0.45)" }} />}
      <AbsoluteFill style={{ transform: `scale(${push})` }}><Particles count={55} /></AbsoluteFill>
      <Vignette />
      <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center", fontFamily: FONT_HEAD, color: C.ink }}>
        {brand && <div style={{ fontSize: 28, letterSpacing: 10, fontWeight: 500, opacity: ease(f, [8, 28], [0, 0.85]) }}>{brand.toUpperCase()}</div>}
        <div style={{ fontSize: 112, fontWeight: 700, lineHeight: 1.05, marginTop: 18, padding: "0 120px" }}>
          {words.map((w, i) => {
            const t = ease(f, [14 + i * 5, 38 + i * 5], [0, 1]);
            return (
              <span key={i} style={{ display: "inline-block", marginRight: 26, opacity: t, transform: `translateY(${(1 - t) * 50}px)`,
                color: i === words.length - 1 ? C.accent : C.ink }}>{w}</span>
            );
          })}
        </div>
        {s.subtitle && <div style={{ fontFamily: FONT_BODY, fontSize: 36, marginTop: 26, opacity: ease(f, [60, 85], [0, 0.9]) }}>{s.subtitle}</div>}
        <div style={{ margin: "34px auto 0", height: 5, width: 220 * ease(f, [50, 80], [0, 1]), background: C.accent, borderRadius: 3 }} />
      </div>
    </AbsoluteFill>
  );
};

// ---------------- POINT ----------------
export const PointScene: React.FC<SceneProps> = ({ s, all }) => {
  const f = useCurrentFrame();
  const points = all.filter((x) => (x.type ?? "point") === "point");
  const idx = points.findIndex((x) => x.id === s.id);
  const bullets = s.bullets ?? [];
  const cues = cueFrames(s, bullets);
  const iconIn = ease(f, [10, 40], [0, 1]);
  return (
    <AbsoluteFill>
      {s.image ? <KenBurns src={s.image} dur={s.durationFrames} /> : <Blueprint />}
      {s.image && <AbsoluteFill style={{ background: "linear-gradient(90deg, rgba(6,12,24,0.85) 0%, rgba(6,12,24,0.35) 70%)" }} />}
      <Particles count={25} color={C.blue} seed={s.id} />
      <SceneTag n={idx + 1} total={points.length} label={s.title ?? s.id} />
      {points.length > 1 && <StepTracker steps={points.map((p) => p.title ?? p.id)} active={idx} />}
      {!s.image && (
        <div style={{ position: "absolute", right: 170, top: 250 }}>
          <HeroIcon name={s.icon} size={560} appear={iconIn} />
        </div>
      )}
      <div style={{ position: "absolute", left: 80, top: 300, width: 900, fontFamily: FONT_BODY, color: C.ink }}>
        {bullets.map((b, i) => {
          const o = ease(f, [cues[i], cues[i] + 14], [0, 1]);
          const active = f >= cues[i] && (i === bullets.length - 1 || f < cues[i + 1]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 22, marginBottom: 34, opacity: o, transform: `translateX(${(1 - o) * -40}px)` }}>
              <div style={{ width: 54, height: 54, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? C.accent : "rgba(255,255,255,0.1)", color: active ? "#1A1405" : C.ink, fontFamily: FONT_HEAD, fontWeight: 700, fontSize: 28 }}>
                {i + 1}
              </div>
              <div style={{ fontSize: 42, fontWeight: 600, color: active ? C.ink : "rgba(244,247,251,0.82)" }}>{b}</div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ---------------- OUTRO ----------------
export const OutroScene: React.FC<SceneProps> = ({ s, all }) => {
  const f = useCurrentFrame();
  const points = all.filter((x) => (x.type ?? "point") === "point");
  const lastWordT = s.words.length ? s.words[s.words.length - 1].t : 0;
  const finalAt = s.voiceOffsetFrames + Math.round(lastWordT * 30) - 10;
  const fin = ease(f, [finalAt, finalAt + 20], [0, 1]);
  return (
    <AbsoluteFill>
      <Blueprint grid={false} />
      <Particles count={45} />
      <div style={{ position: "absolute", top: 300 - fin * 60, width: "100%", display: "flex", justifyContent: "center", gap: 22 }}>
        {points.map((p, i) => {
          const firstWord = (p.title ?? p.id).split(" ")[0];
          const at = wordFrame(s, new RegExp(firstWord, "i"));
          const o = ease(f, [at - 6, at + 10], [0, 1]);
          return (
            <div key={p.id} style={{ opacity: Math.max(o, 0.15), transform: `translateY(${(1 - o) * 20}px)`, textAlign: "center", width: 300,
              padding: "18px 14px 22px", borderRadius: 26, background: "rgba(255,255,255,0.06)", border: `2px solid ${o > 0.5 ? C.accent : "rgba(255,255,255,0.1)"}` }}>
              <HeroIcon name={p.icon} size={140} />
              <div style={{ fontFamily: FONT_HEAD, fontSize: 30, fontWeight: 700, color: C.ink }}>{p.title ?? p.id}</div>
            </div>
          );
        })}
      </div>
      <div style={{ position: "absolute", top: 640, width: "100%", textAlign: "center", fontFamily: FONT_HEAD, color: C.ink,
        opacity: fin, transform: `translateY(${(1 - fin) * 30}px)` }}>
        <div style={{ fontSize: 80, fontWeight: 700 }}>{s.title}</div>
        {s.cta && <div style={{ fontFamily: FONT_BODY, fontSize: 32, marginTop: 18, color: C.accent }}>{s.cta}</div>}
      </div>
    </AbsoluteFill>
  );
};
