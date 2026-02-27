"use client";

import type { CSSProperties } from "react";

type StarPoint = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  delay: number;
  duration: number;
  blur: number;
  driftX: number;
  driftY: number;
  grow: number;
};

type ConstellationStar = {
  x: number;
  y: number;
  size: number;
  alpha: number;
  delay: number;
  period: number;
  twinkle: number;
  scatterX: number;
  scatterY: number;
  exitX: number;
  exitY: number;
};

type NebulaBlob = {
  x: number;
  y: number;
  width: number;
  height: number;
  alpha: number;
  hueShift: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
};

const CONFIG = {
  seed: 1471,
  starCount: 360,
  brightCount: 56,
  dustCount: 320,
  nebulaCount: 12,
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

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-6);
  const v = Math.max(rand(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleSpiralPoint(rand: () => number): { x: number; y: number } {
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

function createSpiralDrift(
  x: number,
  y: number,
  rand: () => number,
  radialRange: [number, number],
  tangentialRatio = 0.42,
) {
  const dx = x - 50;
  const dy = y - 50;
  const dist = Math.max(Math.hypot(dx, dy), 0.8);
  const nx = dx / dist;
  const ny = dy / dist;
  const tx = -ny;
  const ty = nx;
  const radialMag = radialRange[0] + rand() * (radialRange[1] - radialRange[0]);
  const tangentMag = radialMag * tangentialRatio;
  return {
    driftX: nx * radialMag + tx * tangentMag,
    driftY: ny * radialMag + ty * tangentMag,
  };
}

function computeGrowth(driftX: number, driftY: number, min: number, max: number) {
  const magnitude = Math.hypot(driftX, driftY);
  const normalized = clamp((magnitude - min) / (max - min), 0, 1);
  return 0.72 + normalized * 1.48;
}

function buildEthereumConstellationPoints() {
  const apex = [0, -1] as const;
  const upperLeft = [-0.58, -0.15] as const;
  const upperRight = [0.58, -0.15] as const;
  const center = [0, 0] as const;
  const lowerLeft = [-0.58, 0.15] as const;
  const lowerRight = [0.58, 0.15] as const;
  const bottom = [0, 1] as const;

  const segments: readonly (readonly [readonly [number, number], readonly [number, number], number])[] = [
    [apex, upperLeft, 5],
    [apex, upperRight, 5],
    [upperLeft, center, 4],
    [upperRight, center, 4],
    [center, lowerLeft, 4],
    [center, lowerRight, 4],
    [lowerLeft, bottom, 5],
    [lowerRight, bottom, 5],
  ];

  const dedupe = new Map<string, { x: number; y: number }>();

  for (const [start, end, steps] of segments) {
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

function createEthereumConstellation(seed: number): ConstellationStar[] {
  const rand = seededRandom(seed * 97 + 13);
  const points = buildEthereumConstellationPoints();
  return points.map((point) => {
    const x = 50 + point.x * 17.8 + (rand() - 0.5) * 0.8;
    const y = 50 + point.y * 24.4 + (rand() - 0.5) * 0.8;
    const scatterAngle = rand() * Math.PI * 2;
    const scatterRadius = 180 + rand() * 420;
    const scatterX = Math.cos(scatterAngle) * scatterRadius;
    const scatterY = Math.sin(scatterAngle) * scatterRadius;
    const exitAngle = scatterAngle + (rand() - 0.5) * 1.6;
    const exitRadius = 140 + rand() * 340;
    return {
      x,
      y,
      size: 1.8 + rand() * 2.6,
      alpha: 0.58 + rand() * 0.34,
      delay: rand() * 10,
      period: 56 + rand() * 12,
      twinkle: 2.4 + rand() * 3.4,
      scatterX,
      scatterY,
      exitX: Math.cos(exitAngle) * exitRadius,
      exitY: Math.sin(exitAngle) * exitRadius,
    };
  });
}

function createNebula(seed: number, count: number): NebulaBlob[] {
  const rand = seededRandom(seed * 11 + 73);
  return Array.from({ length: count }, () => {
    const x = 4 + rand() * 92;
    const y = 6 + rand() * 88;
    const drift = createSpiralDrift(x, y, rand, [70, 180], 0.52);
    return {
      x,
      y,
      width: 24 + rand() * 44,
      height: 18 + rand() * 38,
      alpha: 0.11 + rand() * 0.24,
      hueShift: -48 + rand() * 104,
      delay: rand() * 8,
      duration: 16 + rand() * 24,
      driftX: drift.driftX,
      driftY: drift.driftY,
    };
  });
}

function createStars(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    const drift = createSpiralDrift(sampled.x, sampled.y, rand, [38, 122], 0.56);
    return {
      x: clamp(sampled.x, 1, 99),
      y: clamp(sampled.y, 1, 99),
      size: 0.5 + rand() * 1.8,
      alpha: 0.2 + rand() * 0.64,
      delay: rand() * 8,
      duration: 3 + rand() * 8,
      blur: rand() * 1,
      driftX: drift.driftX,
      driftY: drift.driftY,
      grow: computeGrowth(drift.driftX, drift.driftY, 40, 132),
    };
  });
}

function createBrightStars(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed * 17 + 19);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    const x = clamp(sampled.x + gaussian(rand) * 2.8, 1.5, 98.5);
    const y = clamp(sampled.y + gaussian(rand) * 2.8, 1.5, 98.5);
    const drift = createSpiralDrift(x, y, rand, [62, 180], 0.6);
    return {
      x,
      y,
      size: 2 + rand() * 2.8,
      alpha: 0.55 + rand() * 0.4,
      delay: rand() * 8,
      duration: 3.6 + rand() * 6,
      blur: rand() * 0.7,
      driftX: drift.driftX,
      driftY: drift.driftY,
      grow: computeGrowth(drift.driftX, drift.driftY, 62, 188) * 1.1,
    };
  });
}

function createDust(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed * 29 + 31);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    const x = clamp(sampled.x + gaussian(rand) * 6, 0.6, 99.4);
    const y = clamp(sampled.y + gaussian(rand) * 6, 0.6, 99.4);
    const drift = createSpiralDrift(x, y, rand, [28, 114], 0.45);
    return {
      x,
      y,
      size: 0.25 + rand() * 0.62,
      alpha: 0.1 + rand() * 0.24,
      delay: rand() * 9,
      duration: 7 + rand() * 10,
      blur: rand() * 1.2,
      driftX: drift.driftX,
      driftY: drift.driftY,
      grow: computeGrowth(drift.driftX, drift.driftY, 26, 114) * 0.72,
    };
  });
}

function toStyle(
  values: Record<string, string | number>,
) {
  return values as CSSProperties;
}

function toNebulaStyle(
  values: Record<string, string | number>,
) {
  return values as CSSProperties;
}

const NEBULA = createNebula(CONFIG.seed, CONFIG.nebulaCount);
const DUST = createDust(CONFIG.seed, CONFIG.dustCount);
const STARS = createStars(CONFIG.seed, CONFIG.starCount);
const BRIGHT = createBrightStars(CONFIG.seed, CONFIG.brightCount);
const CONSTELLATION = createEthereumConstellation(CONFIG.seed);

export function SpiralVaultBackground() {
  return (
    <div className="spiral-vault-bg" aria-hidden="true">
      <div className="spiral-vault-bg__veil" />
      <div className="spiral-vault-bg__grain" />

      {NEBULA.map((blob, idx) => (
        <span
          key={`sv-nebula-${idx}`}
          className="spiral-vault-nebula"
          style={toNebulaStyle({
            "--x": `${blob.x}%`,
            "--y": `${blob.y}%`,
            "--w": `${blob.width}%`,
            "--h": `${blob.height}%`,
            "--alpha": blob.alpha,
            "--hue-shift": `${blob.hueShift}deg`,
            "--delay": `${blob.delay}s`,
            "--duration": `${blob.duration}s`,
            "--drift-x": `${blob.driftX.toFixed(2)}px`,
            "--drift-y": `${blob.driftY.toFixed(2)}px`,
          })}
        />
      ))}

      {DUST.map((point, idx) => (
        <span
          key={`sv-dust-${idx}`}
          className="spiral-vault-dust"
          style={toStyle({
            "--x": `${point.x}%`,
            "--y": `${point.y}%`,
            "--size": `${point.size}px`,
            "--alpha": point.alpha,
            "--delay": `${point.delay}s`,
            "--duration": `${point.duration}s`,
            "--blur": `${point.blur}px`,
            "--drift-x": `${point.driftX.toFixed(2)}px`,
            "--drift-y": `${point.driftY.toFixed(2)}px`,
            "--grow": point.grow.toFixed(3),
          })}
        />
      ))}

      {STARS.map((point, idx) => (
        <span
          key={`sv-star-${idx}`}
          className="spiral-vault-star"
          style={toStyle({
            "--x": `${point.x}%`,
            "--y": `${point.y}%`,
            "--size": `${point.size}px`,
            "--alpha": point.alpha,
            "--delay": `${point.delay}s`,
            "--duration": `${point.duration}s`,
            "--blur": `${point.blur}px`,
            "--drift-x": `${point.driftX.toFixed(2)}px`,
            "--drift-y": `${point.driftY.toFixed(2)}px`,
            "--grow": point.grow.toFixed(3),
          })}
        />
      ))}

      {BRIGHT.map((point, idx) => (
        <span
          key={`sv-bright-${idx}`}
          className="spiral-vault-bright"
          style={toStyle({
            "--x": `${point.x}%`,
            "--y": `${point.y}%`,
            "--size": `${point.size}px`,
            "--alpha": point.alpha,
            "--delay": `${point.delay}s`,
            "--duration": `${point.duration}s`,
            "--blur": `${point.blur}px`,
            "--drift-x": `${point.driftX.toFixed(2)}px`,
            "--drift-y": `${point.driftY.toFixed(2)}px`,
            "--grow": point.grow.toFixed(3),
          })}
        />
      ))}

      {CONSTELLATION.map((point, idx) => (
        <span
          key={`sv-constellation-${idx}`}
          className="spiral-vault-constellation-star"
          style={toStyle({
            "--x": `${point.x}%`,
            "--y": `${point.y}%`,
            "--size": `${point.size}px`,
            "--alpha": point.alpha.toFixed(3),
            "--delay": `${point.delay.toFixed(2)}s`,
            "--period": `${point.period.toFixed(2)}s`,
            "--twinkle": `${point.twinkle.toFixed(2)}s`,
            "--scatter-x": `${point.scatterX.toFixed(2)}px`,
            "--scatter-y": `${point.scatterY.toFixed(2)}px`,
            "--exit-x": `${point.exitX.toFixed(2)}px`,
            "--exit-y": `${point.exitY.toFixed(2)}px`,
          })}
        />
      ))}
    </div>
  );
}
