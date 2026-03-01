"use client";

import type { CSSProperties } from "react";

type SpiralParticle = {
  angle0: number;
  angle1: number;
  radius0: number;
  radius1: number;
  size: number;
  alpha: number;
  delay: number;
  duration: number;
  blur: number;
  grow: number;
  spin: number;
  hasCross: boolean;
  crossLen: number;
  crossAlpha: number;
};

type NebulaParticle = {
  dx: number;
  dy: number;
  width: number;
  height: number;
  alpha: number;
  delay: number;
  duration: number;
  rotate: number;
  hueA: number;
  hueB: number;
  hueC: number;
  grain: number;
  soft: number;
};

type ConstellationStar = {
  angleOff: number;
  angleW1: number;
  angleW2: number;
  angleHit: number;
  angleExit: number;
  radiusOff: number;
  radiusW1: number;
  radiusW2: number;
  radiusHit: number;
  radiusExit: number;
  size: number;
  alpha: number;
  delay: number;
  period: number;
};

const CONFIG = {
  seed: 1471,
  starCount: 360,
  brightCount: 56,
  dustCount: 320,
  nebulaCount: 9,
};

function seededRandom(seed: number) {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 48271) % 2147483647;
    return value / 2147483647;
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function sampleSpiralPoint(rand: () => number): { x: number; y: number } {
  if (rand() < 0.36) {
    const coreT = rand() * Math.PI * 2;
    const coreR = Math.pow(rand(), 1.8) * 16;
    return {
      x: 50 + Math.cos(coreT) * coreR + (rand() - 0.5) * 2.2,
      y: 50 + Math.sin(coreT) * coreR + (rand() - 0.5) * 2.2,
    };
  }

  const turns = 3.2;
  const t = Math.pow(rand(), 0.68) * Math.PI * 2 * turns;
  const r = 5 + Math.pow(rand(), 0.78) * 45;
  const arm = rand() < 0.5 ? 0 : Math.PI;
  const jitter = (rand() - 0.5) * 12;
  return {
    x: 50 + Math.cos(t + arm) * r + jitter,
    y: 50 + Math.sin(t + arm) * r + (rand() - 0.5) * 10,
  };
}

function toPolar(x: number, y: number) {
  const dx = x - 50;
  const dy = y - 50;
  const dist = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { dist, angle };
}

const ETHEREUM_VERTICES = {
  apex: [0, -0.99],
  shoulderLeft: [-0.96, -0.02],
  shoulderRight: [0.96, -0.02],
  innerTop: [0, -0.28],
  waistLeft: [-0.96, 0.11],
  waistRight: [0.96, 0.11],
  innerBottom: [0, 0.35],
  bottom: [0, 0.99],
} as const;

type EthereumVertex = keyof typeof ETHEREUM_VERTICES;

const ETHEREUM_SEGMENTS: readonly (readonly [EthereumVertex, EthereumVertex, number])[] = [
  ["apex", "shoulderLeft", 2],
  ["apex", "shoulderRight", 2],
  ["apex", "innerTop", 1],
  ["innerTop", "shoulderLeft", 1],
  ["innerTop", "shoulderRight", 1],
  ["innerTop", "innerBottom", 2],
  ["waistLeft", "innerBottom", 1],
  ["waistRight", "innerBottom", 1],
  ["waistLeft", "bottom", 2],
  ["waistRight", "bottom", 2],
  ["innerBottom", "bottom", 2],
];

const ETHEREUM_CONSTELLATION_SCALE = {
  x: 19.4,
  y: 27.2,
};

function buildEthereumConstellationPoints() {
  const dedupe = new Map<string, { x: number; y: number }>();
  for (const [from, to, steps] of ETHEREUM_SEGMENTS) {
    const start = ETHEREUM_VERTICES[from];
    const end = ETHEREUM_VERTICES[to];
    for (let i = 0; i <= steps; i += 1) {
      const t = i / steps;
      const nx = start[0] + (end[0] - start[0]) * t;
      const ny = start[1] + (end[1] - start[1]) * t;
      const key = `${nx.toFixed(4)}:${ny.toFixed(4)}`;
      if (!dedupe.has(key)) dedupe.set(key, { x: nx, y: ny });
    }
  }

  return [...dedupe.values()];
}

function createNebulaParticles(seed: number, count: number): NebulaParticle[] {
  const rand = seededRandom(seed * 61 + 23);

  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2;
    const dist = 24 + rand() * 46;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const palettePick = rand();

    const hueA =
      palettePick < 0.4
        ? 190 + rand() * 24
        : palettePick < 0.75
          ? 220 + rand() * 36
          : 18 + rand() * 24;
    const hueB =
      palettePick < 0.4
        ? 220 + rand() * 32
        : palettePick < 0.75
          ? 248 + rand() * 34
          : 196 + rand() * 26;
    const hueC =
      palettePick < 0.4
        ? 178 + rand() * 24
        : palettePick < 0.75
          ? 268 + rand() * 24
          : 272 + rand() * 22;

    return {
      dx,
      dy,
      width: 12 + rand() * 20,
      height: 8 + rand() * 16,
      alpha: 0.12 + rand() * 0.16,
      delay: rand() * 18,
      duration: 68 + rand() * 56,
      rotate: -24 + rand() * 48,
      hueA,
      hueB,
      hueC,
      grain: 0.06 + rand() * 0.1,
      soft: 0.46 + rand() * 0.34,
    };
  });
}

function createSpiralParticles(
  seed: number,
  count: number,
  type: "dust" | "star" | "bright",
): SpiralParticle[] {
  const rand = seededRandom(seed);

  const sizeRange =
    type === "dust" ? ([0.25, 0.78] as const) : type === "star" ? ([0.5, 2.3] as const) : ([2.1, 4.4] as const);

  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    const polar = toPolar(sampled.x, sampled.y);

    const size = sizeRange[0] + rand() * (sizeRange[1] - sizeRange[0]);
    const sizeNorm = clamp((size - sizeRange[0]) / (sizeRange[1] - sizeRange[0]), 0, 1);

    const radius0 = 1.6 + polar.dist * 0.34;
    const grow = 0.72 + sizeNorm * 1.14 + clamp(polar.dist / 70, 0, 1) * 0.28;
    const speed = 0.72 + sizeNorm * 1.18 + grow * 0.22;

    const radialTravelBase =
      type === "dust" ? 10 + rand() * 20 : type === "star" ? 16 + rand() * 30 : 24 + rand() * 36;
    const edgeBoost = 1 + clamp((polar.dist - 18) / 42, 0, 1) * 0.9;
    const radius1 = radius0 + radialTravelBase * (0.9 + sizeNorm * 0.85) * (0.9 + grow * 0.2) * edgeBoost;

    const spinBase = type === "dust" ? 210 : type === "star" ? 180 : 145;
    const spin = (spinBase + rand() * 88) * (1.1 - sizeNorm * 0.45) * (0.92 + grow * 0.08);

    const durationBase = type === "dust" ? 10 + rand() * 10 : type === "star" ? 6 + rand() * 8 : 4.6 + rand() * 6;
    const hasCross = type !== "dust" && rand() < (type === "star" ? 0.18 : 0.42);
    const crossLen = size * (type === "star" ? 3.2 : 3.8);
    const crossAlpha = (type === "star" ? 0.22 : 0.3) + sizeNorm * (type === "star" ? 0.22 : 0.26);

    return {
      angle0: polar.angle,
      angle1: polar.angle + spin,
      radius0,
      radius1,
      size,
      alpha: type === "dust" ? 0.1 + rand() * 0.24 : type === "star" ? 0.22 + rand() * 0.62 : 0.58 + rand() * 0.34,
      delay: rand() * 10,
      duration: durationBase / speed,
      blur: type === "dust" ? rand() * 1.2 : type === "star" ? rand() * 0.96 : rand() * 0.66,
      grow,
      spin,
      hasCross,
      crossLen,
      crossAlpha,
    };
  });
}

function createEthereumConstellation(seed: number): ConstellationStar[] {
  const rand = seededRandom(seed * 97 + 13);
  const points = buildEthereumConstellationPoints();
  const sharedPeriod = 56 + rand() * 9;
  const sharedDelay = rand() * 2.8;

  return points.map((point) => {
    const x = 50 + point.x * ETHEREUM_CONSTELLATION_SCALE.x + (rand() - 0.5) * 0.16;
    const y = 50 + point.y * ETHEREUM_CONSTELLATION_SCALE.y + (rand() - 0.5) * 0.16;
    const hitPolar = toPolar(x, y);
    const sampled = sampleSpiralPoint(rand);
    const startPolar = toPolar(sampled.x, sampled.y);

    const angleOff = startPolar.angle;
    const radiusOff = 1.5 + startPolar.dist * 0.32;

    const angleW1 = angleOff + (72 + rand() * 108);
    const radiusW1 = radiusOff + 7 + rand() * 10;

    const angleW2 = angleW1 + (58 + rand() * 90);
    const radiusW2 = radiusW1 + 7 + rand() * 12;

    const angleHit = hitPolar.angle + (rand() - 0.5) * 4.8;
    const radiusHit = 1.6 + hitPolar.dist * 0.34;

    const angleExit = angleHit + (44 + rand() * 70);
    const radiusExit = radiusHit + 8 + rand() * 16;

    return {
      angleOff,
      angleW1,
      angleW2,
      angleHit,
      angleExit,
      radiusOff,
      radiusW1,
      radiusW2,
      radiusHit,
      radiusExit,
      size: 1.2 + rand() * 1.8,
      alpha: 0.58 + rand() * 0.22,
      delay: sharedDelay + rand() * 0.6,
      period: sharedPeriod,
    };
  });
}

function toStyle(values: Record<string, string | number>) {
  return values as CSSProperties;
}

const DUST = createSpiralParticles(CONFIG.seed * 29 + 31, CONFIG.dustCount, "dust");
const STARS = createSpiralParticles(CONFIG.seed, CONFIG.starCount, "star");
const BRIGHT = createSpiralParticles(CONFIG.seed * 17 + 19, CONFIG.brightCount, "bright");
const NEBULA = createNebulaParticles(CONFIG.seed, CONFIG.nebulaCount);
const CONSTELLATION = createEthereumConstellation(CONFIG.seed);

export function SpiralVaultBackground() {
  return (
    <div className="spiral-vault-bg" aria-hidden="true">
      <div className="spiral-vault-bg__veil" />
      <div className="spiral-vault-bg__grain" />

      {NEBULA.map((cloud, idx) => (
        <span
          key={`sv-nebula-${idx}`}
          className="spiral-vault-nebula-drift"
          style={toStyle({
            "--dx": `${cloud.dx.toFixed(3)}vmax`,
            "--dy": `${cloud.dy.toFixed(3)}vmax`,
            "--w": `${cloud.width.toFixed(3)}vmax`,
            "--h": `${cloud.height.toFixed(3)}vmax`,
            "--alpha": cloud.alpha.toFixed(3),
            "--delay": `${cloud.delay.toFixed(3)}s`,
            "--duration": `${cloud.duration.toFixed(3)}s`,
            "--rot": `${cloud.rotate.toFixed(3)}deg`,
            "--hue-a": cloud.hueA.toFixed(3),
            "--hue-b": cloud.hueB.toFixed(3),
            "--hue-c": cloud.hueC.toFixed(3),
            "--grain": cloud.grain.toFixed(3),
            "--soft": cloud.soft.toFixed(3),
          })}
        />
      ))}

      {DUST.map((point, idx) => (
        <span
          key={`sv-dust-${idx}`}
          className="spiral-vault-dust"
          style={toStyle({
            "--angle0": `${point.angle0.toFixed(3)}deg`,
            "--angle1": `${point.angle1.toFixed(3)}deg`,
            "--radius0": `${point.radius0.toFixed(3)}vmax`,
            "--radius1": `${point.radius1.toFixed(3)}vmax`,
            "--size": `${point.size.toFixed(3)}px`,
            "--alpha": point.alpha.toFixed(3),
            "--delay": `${point.delay.toFixed(3)}s`,
            "--duration": `${point.duration.toFixed(3)}s`,
            "--blur": `${point.blur.toFixed(3)}px`,
            "--grow": point.grow.toFixed(3),
            "--spin": `${point.spin.toFixed(3)}deg`,
          })}
        />
      ))}

      {STARS.map((point, idx) => (
        <span
          key={`sv-star-${idx}`}
          className={`spiral-vault-star${point.hasCross ? " spiral-vault-crossed" : ""}`}
          style={toStyle({
            "--angle0": `${point.angle0.toFixed(3)}deg`,
            "--angle1": `${point.angle1.toFixed(3)}deg`,
            "--radius0": `${point.radius0.toFixed(3)}vmax`,
            "--radius1": `${point.radius1.toFixed(3)}vmax`,
            "--size": `${point.size.toFixed(3)}px`,
            "--alpha": point.alpha.toFixed(3),
            "--delay": `${point.delay.toFixed(3)}s`,
            "--duration": `${point.duration.toFixed(3)}s`,
            "--blur": `${point.blur.toFixed(3)}px`,
            "--grow": point.grow.toFixed(3),
            "--spin": `${point.spin.toFixed(3)}deg`,
            "--cross-len": `${point.crossLen.toFixed(3)}px`,
            "--cross-alpha": point.crossAlpha.toFixed(3),
          })}
        />
      ))}

      {BRIGHT.map((point, idx) => (
        <span
          key={`sv-bright-${idx}`}
          className={`spiral-vault-bright${point.hasCross ? " spiral-vault-crossed" : ""}`}
          style={toStyle({
            "--angle0": `${point.angle0.toFixed(3)}deg`,
            "--angle1": `${point.angle1.toFixed(3)}deg`,
            "--radius0": `${point.radius0.toFixed(3)}vmax`,
            "--radius1": `${point.radius1.toFixed(3)}vmax`,
            "--size": `${point.size.toFixed(3)}px`,
            "--alpha": point.alpha.toFixed(3),
            "--delay": `${point.delay.toFixed(3)}s`,
            "--duration": `${point.duration.toFixed(3)}s`,
            "--blur": `${point.blur.toFixed(3)}px`,
            "--grow": point.grow.toFixed(3),
            "--spin": `${point.spin.toFixed(3)}deg`,
            "--cross-len": `${point.crossLen.toFixed(3)}px`,
            "--cross-alpha": point.crossAlpha.toFixed(3),
          })}
        />
      ))}

      {CONSTELLATION.map((point, idx) => (
        <span
          key={`sv-constellation-${idx}`}
          className="spiral-vault-constellation-star"
          style={toStyle({
            "--angle-off": `${point.angleOff.toFixed(3)}deg`,
            "--angle-w1": `${point.angleW1.toFixed(3)}deg`,
            "--angle-w2": `${point.angleW2.toFixed(3)}deg`,
            "--angle-hit": `${point.angleHit.toFixed(3)}deg`,
            "--angle-exit": `${point.angleExit.toFixed(3)}deg`,
            "--radius-off": `${point.radiusOff.toFixed(3)}vmax`,
            "--radius-w1": `${point.radiusW1.toFixed(3)}vmax`,
            "--radius-w2": `${point.radiusW2.toFixed(3)}vmax`,
            "--radius-hit": `${point.radiusHit.toFixed(3)}vmax`,
            "--radius-exit": `${point.radiusExit.toFixed(3)}vmax`,
            "--size": `${point.size.toFixed(3)}px`,
            "--alpha": point.alpha.toFixed(3),
            "--delay": `${point.delay.toFixed(3)}s`,
            "--period": `${point.period.toFixed(3)}s`,
          })}
        />
      ))}
    </div>
  );
}
