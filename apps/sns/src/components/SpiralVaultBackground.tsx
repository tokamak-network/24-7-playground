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
};

type NebulaBlob = {
  angle0: number;
  angle1: number;
  radius0: number;
  radius1: number;
  width: number;
  height: number;
  alpha: number;
  hueShift: number;
  delay: number;
  duration: number;
};

type ConstellationStar = {
  angleOff: number;
  angleHit: number;
  angleExit: number;
  radiusOff: number;
  radiusHit: number;
  radiusExit: number;
  size: number;
  alpha: number;
  delay: number;
  period: number;
  twinkle: number;
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

function toPolar(x: number, y: number) {
  const dx = x - 50;
  const dy = y - 50;
  const dist = Math.hypot(dx, dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { dist, angle };
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

function createNebula(seed: number, count: number): NebulaBlob[] {
  const rand = seededRandom(seed * 11 + 73);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    const polar = toPolar(sampled.x, sampled.y);
    const radius0 = 2 + polar.dist * 0.26;
    const radius1 = radius0 + 6 + rand() * 12;
    const spin = 84 + rand() * 94;
    return {
      angle0: polar.angle,
      angle1: polar.angle + spin,
      radius0,
      radius1,
      width: 24 + rand() * 44,
      height: 18 + rand() * 38,
      alpha: 0.1 + rand() * 0.22,
      hueShift: -48 + rand() * 104,
      delay: rand() * 8,
      duration: 18 + rand() * 22,
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
      type === "dust" ? 3.2 + rand() * 8.2 : type === "star" ? 4.8 + rand() * 11.4 : 6.4 + rand() * 14.2;
    const radius1 = radius0 + radialTravelBase * (0.82 + sizeNorm * 0.72) * (0.88 + grow * 0.16);

    const spinBase = type === "dust" ? 210 : type === "star" ? 180 : 145;
    const spin = (spinBase + rand() * 88) * (1.1 - sizeNorm * 0.45) * (0.92 + grow * 0.08);

    const durationBase = type === "dust" ? 10 + rand() * 10 : type === "star" ? 6 + rand() * 8 : 4.6 + rand() * 6;

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
    };
  });
}

function createEthereumConstellation(seed: number): ConstellationStar[] {
  const rand = seededRandom(seed * 97 + 13);
  const points = buildEthereumConstellationPoints();
  const sharedPeriod = 58 + rand() * 8;
  const sharedDelay = rand() * 1.2;

  return points.map((point) => {
    const x = 50 + point.x * 17.8 + (rand() - 0.5) * 0.7;
    const y = 50 + point.y * 24.6 + (rand() - 0.5) * 0.7;
    const hitPolar = toPolar(x, y);

    const angleOff = hitPolar.angle - (138 + rand() * 88);
    const radiusOff = clamp(hitPolar.dist * 0.12, 1.8, 6.6);

    const angleExit = hitPolar.angle + (84 + rand() * 62);
    const radiusExit = 1.6 + hitPolar.dist * 0.34 + 8 + rand() * 16;

    return {
      angleOff,
      angleHit: hitPolar.angle,
      angleExit,
      radiusOff,
      radiusHit: 1.6 + hitPolar.dist * 0.34,
      radiusExit,
      size: 1.9 + rand() * 2.4,
      alpha: 0.72 + rand() * 0.24,
      delay: sharedDelay + rand() * 0.12,
      period: sharedPeriod,
      twinkle: 2.3 + rand() * 3,
    };
  });
}

function toStyle(values: Record<string, string | number>) {
  return values as CSSProperties;
}

const NEBULA = createNebula(CONFIG.seed, CONFIG.nebulaCount);
const DUST = createSpiralParticles(CONFIG.seed * 29 + 31, CONFIG.dustCount, "dust");
const STARS = createSpiralParticles(CONFIG.seed, CONFIG.starCount, "star");
const BRIGHT = createSpiralParticles(CONFIG.seed * 17 + 19, CONFIG.brightCount, "bright");
const CONSTELLATION = createEthereumConstellation(CONFIG.seed);
const CONSTELLATION_TIMING = {
  period: CONSTELLATION[0]?.period ?? 62,
  delay: CONSTELLATION[0]?.delay ?? 0,
};

export function SpiralVaultBackground() {
  return (
    <div className="spiral-vault-bg" aria-hidden="true">
      <div className="spiral-vault-bg__veil" />
      <div className="spiral-vault-bg__grain" />

      {NEBULA.map((blob, idx) => (
        <span
          key={`sv-nebula-${idx}`}
          className="spiral-vault-nebula"
          style={toStyle({
            "--angle0": `${blob.angle0.toFixed(3)}deg`,
            "--angle1": `${blob.angle1.toFixed(3)}deg`,
            "--radius0": `${blob.radius0.toFixed(3)}vmax`,
            "--radius1": `${blob.radius1.toFixed(3)}vmax`,
            "--w": `${blob.width}%`,
            "--h": `${blob.height}%`,
            "--alpha": blob.alpha.toFixed(3),
            "--hue-shift": `${blob.hueShift.toFixed(3)}deg`,
            "--delay": `${blob.delay.toFixed(3)}s`,
            "--duration": `${blob.duration.toFixed(3)}s`,
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
          className="spiral-vault-star"
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

      {BRIGHT.map((point, idx) => (
        <span
          key={`sv-bright-${idx}`}
          className="spiral-vault-bright"
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

      {CONSTELLATION.map((point, idx) => (
        <span
          key={`sv-constellation-${idx}`}
          className="spiral-vault-constellation-star"
          style={toStyle({
            "--angle-off": `${point.angleOff.toFixed(3)}deg`,
            "--angle-hit": `${point.angleHit.toFixed(3)}deg`,
            "--angle-exit": `${point.angleExit.toFixed(3)}deg`,
            "--radius-off": `${point.radiusOff.toFixed(3)}vmax`,
            "--radius-hit": `${point.radiusHit.toFixed(3)}vmax`,
            "--radius-exit": `${point.radiusExit.toFixed(3)}vmax`,
            "--size": `${point.size.toFixed(3)}px`,
            "--alpha": point.alpha.toFixed(3),
            "--delay": `${point.delay.toFixed(3)}s`,
            "--period": `${point.period.toFixed(3)}s`,
            "--twinkle": `${point.twinkle.toFixed(3)}s`,
          })}
        />
      ))}

      <svg
        className="spiral-vault-constellation-glyph"
        viewBox="-60 -95 120 190"
        role="presentation"
        focusable="false"
        style={toStyle({
          "--period": `${CONSTELLATION_TIMING.period.toFixed(3)}s`,
          "--delay": `${CONSTELLATION_TIMING.delay.toFixed(3)}s`,
        })}
      >
        <path d="M 0 -86 L -42 -14 L 0 0 L 42 -14 Z" />
        <path d="M 0 0 L -42 14 L 0 86 L 42 14 Z" />
      </svg>
    </div>
  );
}
