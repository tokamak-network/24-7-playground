import type { CSSProperties } from "react";
import styles from "./page.module.css";

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

const SPIRAL_VAULT = {
  id: "spiral-vault",
  name: "Spiral Vault",
  tagline: "은하 중심에서 나선으로 쏟아지는 빽빽한 별",
  description:
    "이제부터 디자인 베이스라인은 Spiral Vault 단일안입니다. 중심부에서 생성된 별이 나선형으로 확산되고, 다층 성운이 밤하늘 깊이를 형성합니다.",
  palette: ["#8de2ff", "#96a3ff", "#f6f8ff"] as const,
  seed: 1471,
  starCount: 310,
  brightCount: 42,
  dustCount: 210,
  nebulaCount: 8,
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

function cssVars(values: Record<string, number | string>): CSSProperties {
  return values as CSSProperties;
}

function gaussian(rand: () => number) {
  const u = Math.max(rand(), 1e-6);
  const v = Math.max(rand(), 1e-6);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sampleSpiralPoint(rand: () => number): { x: number; y: number } {
  const turns = 2.8;
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
    x: 8 + rand() * 84,
    y: 10 + rand() * 80,
    width: 28 + rand() * 42,
    height: 20 + rand() * 36,
    alpha: 0.14 + rand() * 0.26,
    hueShift: -45 + rand() * 100,
    delay: rand() * 6,
    duration: 12 + rand() * 16,
  }));
}

function createStars(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    return {
      x: clamp(sampled.x, 1.5, 98.5),
      y: clamp(sampled.y, 1.5, 98.5),
      size: 0.6 + rand() * 1.9,
      alpha: 0.2 + rand() * 0.7,
      delay: rand() * 6,
      duration: 2.6 + rand() * 6,
      blur: rand() * 0.8,
    };
  });
}

function createBrightStars(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed * 17 + 19);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    return {
      x: clamp(sampled.x + gaussian(rand) * 2.4, 2, 98),
      y: clamp(sampled.y + gaussian(rand) * 2.4, 2, 98),
      size: 2.2 + rand() * 2.6,
      alpha: 0.55 + rand() * 0.4,
      delay: rand() * 6,
      duration: 3.4 + rand() * 5,
      blur: rand() * 0.6,
    };
  });
}

function createDust(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed * 29 + 31);
  return Array.from({ length: count }, () => {
    const sampled = sampleSpiralPoint(rand);
    return {
      x: clamp(sampled.x + gaussian(rand) * 5.2, 0.8, 99.2),
      y: clamp(sampled.y + gaussian(rand) * 5.2, 0.8, 99.2),
      size: 0.3 + rand() * 0.65,
      alpha: 0.12 + rand() * 0.28,
      delay: rand() * 7,
      duration: 6 + rand() * 9,
      blur: rand() * 1.1,
    };
  });
}

export const dynamic = "force-static";

export default function DesignLabPage() {
  const stars = createStars(SPIRAL_VAULT.seed, SPIRAL_VAULT.starCount);
  const brightStars = createBrightStars(SPIRAL_VAULT.seed, SPIRAL_VAULT.brightCount);
  const dust = createDust(SPIRAL_VAULT.seed, SPIRAL_VAULT.dustCount);
  const nebula = createNebula(SPIRAL_VAULT.seed, SPIRAL_VAULT.nebulaCount);

  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Theme Baseline</p>
        <h1>Spiral Vault</h1>
        <p>
          나머지 디자인 시안은 제거했고, 앞으로는 이 Spiral Vault 기준안에서만
          디자인을 확장합니다. 현재 버전은 별/성운 밀도와 나선형 생성감을
          기준 텍스처로 고정한 상태입니다.
        </p>
      </header>

      <article className={styles.card}>
        <div className={`${styles.canvas} ${styles.variantSpiral}`}>
          <div className={styles.skyGlow} />
          <div className={styles.skyNoise} />
          <div className={styles.deepField} />

          {nebula.map((blob, idx) => (
            <span
              key={`nebula-${idx}`}
              className={styles.nebula}
              style={cssVars({
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

          {dust.map((point, idx) => (
            <span
              key={`dust-${idx}`}
              className={styles.dust}
              style={cssVars({
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

          {stars.map((point, idx) => (
            <span
              key={`star-${idx}`}
              className={styles.star}
              style={cssVars({
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

          {brightStars.map((point, idx) => (
            <span
              key={`bright-${idx}`}
              className={styles.brightStar}
              style={cssVars({
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

        <div className={styles.info}>
          <h2>{SPIRAL_VAULT.name}</h2>
          <p className={styles.tagline}>{SPIRAL_VAULT.tagline}</p>
          <p>{SPIRAL_VAULT.description}</p>
          <div className={styles.metrics}>
            <span>Stars {SPIRAL_VAULT.starCount}</span>
            <span>Bright {SPIRAL_VAULT.brightCount}</span>
            <span>Nebula {SPIRAL_VAULT.nebulaCount}</span>
          </div>
          <div className={styles.palette}>
            {SPIRAL_VAULT.palette.map((color) => (
              <span key={color} style={{ backgroundColor: color }} />
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
