import { createFileRoute } from "@tanstack/react-router";
import { Brand } from "../components/Brand.tsx";
import { Carousel } from "../components/Carousel.tsx";
import { ServiceList } from "../components/ServiceList.tsx";
import styles from "./Home.module.css";

/** Hero 区域的装饰性几何图形（统一冷暖配色） */
function HeroBg() {
  return (
    <svg
      className={styles.heroBg}
      viewBox="0 0 1440 560"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <filter id="heroBlur">
          <feGaussianBlur stdDeviation="40" />
        </filter>
        <filter id="heroBlurLight">
          <feGaussianBlur stdDeviation="20" />
        </filter>
      </defs>

      {/* 大圆 — 左上，冷蓝 */}
      <circle
        cx="100"
        cy="80"
        r="320"
        fill="rgba(75, 156, 255, 0.36)"
        filter="url(#heroBlur)"
      />
      {/* 大圆 — 右下，深海蓝 */}
      <circle
        cx="1350"
        cy="450"
        r="300"
        fill="rgba(30, 128, 219, 0.28)"
        filter="url(#heroBlur)"
      />
      {/* 中圆 — 上方，青色提亮 */}
      <circle
        cx="750"
        cy="60"
        r="220"
        fill="rgba(58, 226, 255, 0.2)"
        filter="url(#heroBlur)"
      />
      {/* 菱形 — 右上 */}
      <rect
        x="1000"
        y="-20"
        width="260"
        height="260"
        rx="30"
        fill="rgba(232, 247, 255, 0.12)"
        transform="rotate(45 1130 110)"
        filter="url(#heroBlurLight)"
      />
      {/* 小圆 — 左下，青绿 */}
      <circle
        cx="350"
        cy="480"
        r="160"
        fill="rgba(34, 181, 224, 0.2)"
        filter="url(#heroBlur)"
      />
      {/* 装饰环 — 中右 */}
      <circle
        cx="1100"
        cy="200"
        r="100"
        fill="none"
        stroke="rgba(217, 238, 255, 0.22)"
        strokeWidth="3"
      />
      {/* 小菱形 — 左中 */}
      <rect
        x="200"
        y="280"
        width="80"
        height="80"
        rx="8"
        fill="rgba(217, 238, 255, 0.12)"
        transform="rotate(45 240 320)"
      />
    </svg>
  );
}

function HomePage() {
  return (
    <div className={styles.landing}>
      <div className={styles.heroWrap}>
        <HeroBg />
        <section className={styles.heading}>
          <Brand />
          <Carousel />
        </section>
      </div>
      <ServiceList />
    </div>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
