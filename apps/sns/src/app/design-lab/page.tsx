import type { CSSProperties } from "react";
import styles from "./page.module.css";

type Distribution = "spiral" | "band" | "cluster" | "rift" | "halo";

type DraftTheme = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  palette: [string, string, string];
  seed: number;
  starCount: number;
  brightCount: number;
  dustCount: number;
  nebulaCount: number;
  distribution: Distribution;
  className: string;
};

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

const THEMES: DraftTheme[] = [
  {
    id: "spiral-vault",
    name: "Draft 01 · Spiral Vault",
    tagline: "은하 중심에서 나선으로 쏟아지는 빽빽한 별",
    description:
      "성운층 안에서 별들이 나선 군집으로 분포합니다. 한눈에 '우주가 차 있다'는 밀도감을 먼저 전달하는 시안입니다.",
    palette: ["#8de2ff", "#96a3ff", "#f6f8ff"],
    seed: 1471,
    starCount: 310,
    brightCount: 42,
    dustCount: 210,
    nebulaCount: 8,
    distribution: "spiral",
    className: styles.variantSpiral,
  },
  {
    id: "nebula-river",
    name: "Draft 02 · Nebula River",
    tagline: "밤하늘을 가로지르는 성운 강과 촘촘한 별 띠",
    description:
      "성운 강이 화면 대각선을 지배하고, 별이 은하대처럼 길게 형성됩니다. 관측 사진 같은 깊은 밤하늘 인상에 집중했습니다.",
    palette: ["#99ffd8", "#7ba8ff", "#f4fff9"],
    seed: 9413,
    starCount: 280,
    brightCount: 34,
    dustCount: 220,
    nebulaCount: 9,
    distribution: "band",
    className: styles.variantRiver,
  },
  {
    id: "cluster-garden",
    name: "Draft 03 · Cluster Garden",
    tagline: "여러 성단이 동시 형성된 성운 정원",
    description:
      "독립된 성단 군집이 다중 초점으로 배치됩니다. 성운이 성단 주변을 감싸며 3D 공간에 점들이 흩뿌려진 느낌을 강화합니다.",
    palette: ["#8cf4ff", "#f4a6ff", "#fff6ff"],
    seed: 5257,
    starCount: 300,
    brightCount: 38,
    dustCount: 200,
    nebulaCount: 7,
    distribution: "cluster",
    className: styles.variantCluster,
  },
  {
    id: "dark-rift",
    name: "Draft 04 · Dark Rift",
    tagline: "암흑 균열 주변으로 압축된 별 구름",
    description:
      "중앙 다크 리프트를 비우고 양옆에 별과 성운을 조밀하게 모았습니다. 대비를 통해 더 넓고 깊은 심우주를 연출합니다.",
    palette: ["#94d8ff", "#8db0ff", "#f0f6ff"],
    seed: 2821,
    starCount: 270,
    brightCount: 30,
    dustCount: 210,
    nebulaCount: 6,
    distribution: "rift",
    className: styles.variantRift,
  },
  {
    id: "halo-chorus",
    name: "Draft 05 · Halo Chorus",
    tagline: "거대 헤일로 고리 위에 포화된 별 성운 합창",
    description:
      "원형 중력권(헤일로) 주변에 별 밀도가 높고 내부에 성운이 응축됩니다. 집단지성의 다중 레이어 확장감을 강조합니다.",
    palette: ["#9ff1ff", "#9d9dff", "#fff3ff"],
    seed: 6099,
    starCount: 320,
    brightCount: 44,
    dustCount: 230,
    nebulaCount: 8,
    distribution: "halo",
    className: styles.variantHalo,
  },
];

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

function sampleByDistribution(
  distribution: Distribution,
  rand: () => number,
): { x: number; y: number } {
  if (distribution === "spiral") {
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

  if (distribution === "band") {
    const x = rand() * 100;
    const slope = 0.42;
    const centerY = 50 + (x - 50) * slope;
    const y = centerY + gaussian(rand) * 8;
    return { x, y };
  }

  if (distribution === "cluster") {
    const centers = [
      [28, 34],
      [62, 42],
      [50, 66],
      [74, 70],
    ] as const;
    const chosen = centers[Math.floor(rand() * centers.length)] || centers[0];
    return {
      x: chosen[0] + gaussian(rand) * 8,
      y: chosen[1] + gaussian(rand) * 8,
    };
  }

  if (distribution === "rift") {
    const side = rand() < 0.5 ? -1 : 1;
    const x = 50 + side * (12 + Math.pow(rand(), 0.6) * 40) + gaussian(rand) * 3.5;
    const y = 50 + gaussian(rand) * 22;
    return { x, y };
  }

  const angle = rand() * Math.PI * 2;
  const ring = 18 + Math.pow(rand(), 0.74) * 38;
  return {
    x: 50 + Math.cos(angle) * ring + gaussian(rand) * 4.5,
    y: 50 + Math.sin(angle) * ring + gaussian(rand) * 4.5,
  };
}

function createStars(theme: DraftTheme): StarPoint[] {
  const rand = seededRandom(theme.seed);
  return Array.from({ length: theme.starCount }, () => {
    const sampled = sampleByDistribution(theme.distribution, rand);
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

function createBrightStars(theme: DraftTheme): StarPoint[] {
  const rand = seededRandom(theme.seed * 17 + 19);
  return Array.from({ length: theme.brightCount }, () => {
    const sampled = sampleByDistribution(theme.distribution, rand);
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

function createDust(theme: DraftTheme): StarPoint[] {
  const rand = seededRandom(theme.seed * 29 + 31);
  return Array.from({ length: theme.dustCount }, () => {
    const sampled = sampleByDistribution(theme.distribution, rand);
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
  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Theme Direction · Phase 1</p>
        <h1>Dense Night Sky: Stars + Nebula First</h1>
        <p>
          피드백 반영: 우선 “밤하늘에 별과 성운이 빼곡한 느낌”을 명확히 보여주도록
          시안을 재구성했습니다. 이번 버전은 연결선/인터랙션보다 별 분포 밀도와
          성운 볼륨 표현을 최우선으로 맞췄습니다.
        </p>
      </header>

      <div className={styles.grid}>
        {THEMES.map((theme) => {
          const stars = createStars(theme);
          const brightStars = createBrightStars(theme);
          const dust = createDust(theme);
          const nebula = createNebula(theme.seed, theme.nebulaCount);

          return (
            <article key={theme.id} className={styles.card}>
              <div className={`${styles.canvas} ${theme.className}`}>
                <div className={styles.skyGlow} />
                <div className={styles.skyNoise} />
                <div className={styles.deepField} />

                {nebula.map((blob, idx) => (
                  <span
                    key={`nebula-${theme.id}-${idx}`}
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
                    key={`dust-${theme.id}-${idx}`}
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
                    key={`star-${theme.id}-${idx}`}
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
                    key={`bright-${theme.id}-${idx}`}
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
                <h2>{theme.name}</h2>
                <p className={styles.tagline}>{theme.tagline}</p>
                <p>{theme.description}</p>
                <div className={styles.metrics}>
                  <span>Stars {theme.starCount}</span>
                  <span>Bright {theme.brightCount}</span>
                  <span>Nebula {theme.nebulaCount}</span>
                </div>
                <div className={styles.palette}>
                  {theme.palette.map((color) => (
                    <span key={`${theme.id}-${color}`} style={{ backgroundColor: color }} />
                  ))}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
