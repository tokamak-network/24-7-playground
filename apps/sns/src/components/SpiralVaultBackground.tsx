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

function createNebula(seed: number, count: number): NebulaBlob[] {
  const rand = seededRandom(seed * 11 + 73);
  return Array.from({ length: count }, () => ({
    x: 4 + rand() * 92,
    y: 6 + rand() * 88,
    width: 24 + rand() * 44,
    height: 18 + rand() * 38,
    alpha: 0.11 + rand() * 0.24,
    hueShift: -48 + rand() * 104,
    delay: rand() * 8,
    duration: 16 + rand() * 24,
  }));
}

function createStars(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    return {
      x: clamp(sampled.x, 1, 99),
      y: clamp(sampled.y, 1, 99),
      size: 0.5 + rand() * 1.8,
      alpha: 0.2 + rand() * 0.64,
      delay: rand() * 8,
      duration: 3 + rand() * 8,
      blur: rand() * 1,
    };
  });
}

function createBrightStars(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed * 17 + 19);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    return {
      x: clamp(sampled.x + gaussian(rand) * 2.8, 1.5, 98.5),
      y: clamp(sampled.y + gaussian(rand) * 2.8, 1.5, 98.5),
      size: 2 + rand() * 2.8,
      alpha: 0.55 + rand() * 0.4,
      delay: rand() * 8,
      duration: 3.6 + rand() * 6,
      blur: rand() * 0.7,
    };
  });
}

function createDust(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed * 29 + 31);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    return {
      x: clamp(sampled.x + gaussian(rand) * 6, 0.6, 99.4),
      y: clamp(sampled.y + gaussian(rand) * 6, 0.6, 99.4),
      size: 0.25 + rand() * 0.62,
      alpha: 0.1 + rand() * 0.24,
      delay: rand() * 9,
      duration: 7 + rand() * 10,
      blur: rand() * 1.2,
    };
  });
}

function toStyle(
  values: Record<
    "--x" | "--y" | "--size" | "--alpha" | "--delay" | "--duration" | "--blur",
    string | number
  >,
) {
  return values as CSSProperties;
}

function toNebulaStyle(
  values: Record<
    "--x" | "--y" | "--w" | "--h" | "--alpha" | "--hue-shift" | "--delay" | "--duration",
    string | number
  >,
) {
  return values as CSSProperties;
}

const NEBULA = createNebula(CONFIG.seed, CONFIG.nebulaCount);
const DUST = createDust(CONFIG.seed, CONFIG.dustCount);
const STARS = createStars(CONFIG.seed, CONFIG.starCount);
const BRIGHT = createBrightStars(CONFIG.seed, CONFIG.brightCount);

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
          })}
        />
      ))}
    </div>
  );
}
