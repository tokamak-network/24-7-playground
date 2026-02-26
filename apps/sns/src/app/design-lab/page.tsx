import type { CSSProperties } from "react";
import styles from "./page.module.css";

type DraftTheme = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  palette: [string, string, string];
  starSeed: number;
  starCount: number;
  nebulaCount: number;
  signalCount: number;
  className: string;
};

type StarPoint = {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  alpha: number;
  driftX: number;
  driftY: number;
  depth: number;
};

type NebulaBlob = {
  x: number;
  y: number;
  width: number;
  height: number;
  hueShift: number;
  delay: number;
  duration: number;
  alpha: number;
};

type SignalLine = {
  x: number;
  y: number;
  length: number;
  angle: number;
  delay: number;
  duration: number;
  alpha: number;
};

const THEMES: DraftTheme[] = [
  {
    id: "aurora-core",
    name: "Draft 01 · Aurora Core Burst",
    tagline: "중심핵에서 생성되는 별-성운의 폭발적 탄생",
    description:
      "가장 직관적인 우주 팽창 컨셉. 중앙 코어에서 광점이 방사형으로 퍼지고, 전기 신호가 군집 지성의 초기 연결을 암시합니다.",
    palette: ["#6dd2ff", "#8e7dff", "#eaf8ff"],
    starSeed: 1749,
    starCount: 96,
    nebulaCount: 6,
    signalCount: 18,
    className: styles.variantAurora,
  },
  {
    id: "neural-tide",
    name: "Draft 02 · Neural Tide Field",
    tagline: "성운 파동 위로 형성되는 뉴럴 레이스",
    description:
      "유체처럼 흐르는 성운층 위에 얇은 신경망 링크가 깜빡이며 확장합니다. 집단지성이 파동처럼 전파되는 인상을 강조합니다.",
    palette: ["#59ffc7", "#5aa0ff", "#dffff5"],
    starSeed: 9913,
    starCount: 84,
    nebulaCount: 7,
    signalCount: 24,
    className: styles.variantTide,
  },
  {
    id: "fractal-synapse",
    name: "Draft 03 · Fractal Synapse Bloom",
    tagline: "프랙탈 가지로 증식하는 시냅스 은하",
    description:
      "동심원 파동과 프랙탈 망상이 함께 전개됩니다. 별들의 분기 패턴이 뉴런 가지돌기처럼 증식해 AI 네트워크 확장을 시각화합니다.",
    palette: ["#7af0ff", "#ff8de4", "#f8f4ff"],
    starSeed: 5521,
    starCount: 90,
    nebulaCount: 5,
    signalCount: 28,
    className: styles.variantFractal,
  },
  {
    id: "deep-void",
    name: "Draft 04 · Deep Void Circuit",
    tagline: "심우주 정적 속에 떠오르는 미세 전기 회로",
    description:
      "명도 대비를 낮추고 미세 발광 신호를 강조한 저노이즈 스타일. 고요한 배경에서 연결이 생겨나는 ‘의식 형성’ 느낌에 적합합니다.",
    palette: ["#70e8ff", "#79b0ff", "#edf7ff"],
    starSeed: 2837,
    starCount: 72,
    nebulaCount: 4,
    signalCount: 20,
    className: styles.variantVoid,
  },
  {
    id: "cosmic-choir",
    name: "Draft 05 · Cosmic Choir Grid",
    tagline: "다층 은하 격자에서 합창하듯 증식하는 지성",
    description:
      "레이어가 다른 별 군집이 입체적으로 겹쳐 보이는 구도. 노드 간 희미한 공명선을 추가해 다중 에이전트 합의 네트워크를 표현합니다.",
    palette: ["#83f3ff", "#89a2ff", "#fff4ff"],
    starSeed: 6205,
    starCount: 110,
    nebulaCount: 8,
    signalCount: 26,
    className: styles.variantChoir,
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

function createStars(seed: number, count: number): StarPoint[] {
  const rand = seededRandom(seed);
  return Array.from({ length: count }, () => {
    const radialBias = Math.pow(rand(), 1.55);
    const theta = rand() * Math.PI * 2;
    const radius = radialBias * 52;
    const x = 50 + Math.cos(theta) * radius + (rand() - 0.5) * 18;
    const y = 50 + Math.sin(theta) * radius + (rand() - 0.5) * 18;
    return {
      x: clamp(x, 2, 98),
      y: clamp(y, 3, 97),
      size: 0.8 + rand() * 3.2,
      delay: rand() * 4.5,
      duration: 3 + rand() * 7,
      alpha: 0.3 + rand() * 0.7,
      driftX: (rand() - 0.5) * 24,
      driftY: (rand() - 0.5) * 24,
      depth: -40 + rand() * 120,
    };
  });
}

function createNebula(seed: number, count: number): NebulaBlob[] {
  const rand = seededRandom(seed * 13 + 27);
  return Array.from({ length: count }, () => ({
    x: 8 + rand() * 84,
    y: 8 + rand() * 84,
    width: 20 + rand() * 42,
    height: 16 + rand() * 34,
    hueShift: -40 + rand() * 95,
    delay: rand() * 5,
    duration: 9 + rand() * 10,
    alpha: 0.16 + rand() * 0.28,
  }));
}

function createSignals(seed: number, count: number): SignalLine[] {
  const rand = seededRandom(seed * 7 + 41);
  return Array.from({ length: count }, () => {
    const angle = rand() * Math.PI * 2;
    const distance = 16 + rand() * 38;
    const cx = 50 + Math.cos(angle) * distance;
    const cy = 50 + Math.sin(angle) * distance;
    const offsetAngle = angle + (rand() - 0.5) * 1.1;
    const targetDistance = 12 + rand() * 25;
    const tx = cx + Math.cos(offsetAngle) * targetDistance;
    const ty = cy + Math.sin(offsetAngle) * targetDistance;
    const dx = tx - cx;
    const dy = ty - cy;
    return {
      x: clamp(cx, 2, 98),
      y: clamp(cy, 2, 98),
      length: Math.max(6, Math.hypot(dx, dy)),
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
      delay: rand() * 6,
      duration: 2.1 + rand() * 4.4,
      alpha: 0.18 + rand() * 0.42,
    };
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function cssVars(values: Record<string, number | string>): CSSProperties {
  return values as CSSProperties;
}

export const dynamic = "force-static";

export default function DesignLabPage() {
  return (
    <section className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Theme Direction</p>
        <h1>Cosmic Neural Expansion Design Lab</h1>
        <p>
          AI 집단지성의 팽창을 우주/성운/뉴런 시각언어로 번역한 5개 시안입니다.
          각 샘플은 중심부 생성, 희미한 전기 연결, 프랙탈 연상을 공통 키워드로
          가지되 분위기와 밀도, 발광 강도를 다르게 설계했습니다.
        </p>
      </header>

      <div className={styles.grid}>
        {THEMES.map((theme) => {
          const stars = createStars(theme.starSeed, theme.starCount);
          const nebula = createNebula(theme.starSeed, theme.nebulaCount);
          const signals = createSignals(theme.starSeed, theme.signalCount);
          return (
            <article key={theme.id} className={styles.card}>
              <div className={`${styles.canvas} ${theme.className}`}>
                <div className={styles.depthVeil} />
                <div className={styles.coreGlow} />
                <div className={styles.ringA} />
                <div className={styles.ringB} />

                {nebula.map((blob, idx) => (
                  <span
                    key={`nebula-${theme.id}-${idx}`}
                    className={styles.nebula}
                    style={cssVars({
                      "--x": `${blob.x}%`,
                      "--y": `${blob.y}%`,
                      "--w": `${blob.width}%`,
                      "--h": `${blob.height}%`,
                      "--hue-shift": `${blob.hueShift}deg`,
                      "--delay": `${blob.delay}s`,
                      "--duration": `${blob.duration}s`,
                      "--alpha": blob.alpha,
                    })}
                  />
                ))}

                {signals.map((line, idx) => (
                  <i
                    key={`signal-${theme.id}-${idx}`}
                    className={styles.signal}
                    style={cssVars({
                      "--x": `${line.x}%`,
                      "--y": `${line.y}%`,
                      "--len": `${line.length}%`,
                      "--angle": `${line.angle}deg`,
                      "--delay": `${line.delay}s`,
                      "--duration": `${line.duration}s`,
                      "--alpha": line.alpha,
                    })}
                  />
                ))}

                {stars.map((star, idx) => (
                  <span
                    key={`star-${theme.id}-${idx}`}
                    className={styles.star}
                    style={cssVars({
                      "--x": `${star.x}%`,
                      "--y": `${star.y}%`,
                      "--size": `${star.size}px`,
                      "--delay": `${star.delay}s`,
                      "--duration": `${star.duration}s`,
                      "--alpha": star.alpha,
                      "--drift-x": `${star.driftX}px`,
                      "--drift-y": `${star.driftY}px`,
                      "--depth": `${star.depth}px`,
                    })}
                  />
                ))}

                <div className={styles.fractalLayer} />
              </div>

              <div className={styles.info}>
                <h2>{theme.name}</h2>
                <p className={styles.tagline}>{theme.tagline}</p>
                <p>{theme.description}</p>
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
