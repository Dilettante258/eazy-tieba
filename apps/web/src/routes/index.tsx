import { createFileRoute } from "@tanstack/react-router";
import { Brand } from "../components/Brand.tsx";
import { Carousel } from "../components/Carousel.tsx";
import { ServiceList } from "../components/ServiceList.tsx";
import { useSettingsStore } from "../lib/settings-store.ts";
import styles from "./Home.module.css";

/** Hero 区域的装饰背景：精细网格 + 极光光晕 + 浮动饰件 */
function HeroBg() {
	return (
		<svg
			className={styles.heroBg}
			viewBox="0 0 1440 640"
			preserveAspectRatio="xMidYMid slice"
			aria-hidden="true"
		>
			<defs>
				<filter id="heroSoft" x="-60%" y="-60%" width="220%" height="220%">
					<feGaussianBlur stdDeviation="70" />
				</filter>
				<pattern
					id="heroGrid"
					width="56"
					height="56"
					patternUnits="userSpaceOnUse"
				>
					<path
						d="M56 0H0v56"
						fill="none"
						stroke="rgba(148, 210, 255, 0.1)"
						strokeWidth="1"
					/>
				</pattern>
				{/* 网格从左上向四周淡出，避免满铺显得呆板 */}
				<radialGradient id="heroGridFade" cx="30%" cy="15%" r="85%">
					<stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
					<stop offset="55%" stopColor="#fff" stopOpacity="0.3" />
					<stop offset="100%" stopColor="#fff" stopOpacity="0" />
				</radialGradient>
				<mask id="heroGridMask">
					<rect width="1440" height="640" fill="url(#heroGridFade)" />
				</mask>
			</defs>

			{/* 网格 */}
			<rect
				width="1440"
				height="640"
				fill="url(#heroGrid)"
				mask="url(#heroGridMask)"
			/>

			{/* 极光光晕 — 左上青、右下蓝、顶部提亮 */}
			<ellipse
				cx="140"
				cy="10"
				rx="430"
				ry="230"
				fill="rgba(56, 189, 248, 0.28)"
				filter="url(#heroSoft)"
			/>
			<ellipse
				cx="1290"
				cy="610"
				rx="480"
				ry="250"
				fill="rgba(37, 99, 235, 0.36)"
				filter="url(#heroSoft)"
			/>
			<ellipse
				cx="860"
				cy="-90"
				rx="320"
				ry="170"
				fill="rgba(34, 211, 238, 0.14)"
				filter="url(#heroSoft)"
			/>

			{/* 浮动装饰环 */}
			<circle
				className={styles.floatSlow}
				cx="1160"
				cy="140"
				r="92"
				fill="none"
				stroke="rgba(186, 230, 253, 0.2)"
				strokeWidth="1.5"
			/>
			<circle
				className={styles.floatSlower}
				cx="90"
				cy="440"
				r="46"
				fill="none"
				stroke="rgba(186, 230, 253, 0.15)"
				strokeWidth="1.5"
			/>

			{/* 十字星闪烁 */}
			<path
				className={styles.twinkle}
				d="M1268 84l4 12 12 4-12 4-4 12-4-12-12-4 12-4z"
				fill="rgba(224, 242, 254, 0.55)"
			/>
			<path
				className={`${styles.twinkle} ${styles.twinkleDelay}`}
				d="M424 128l3 9 9 3-9 3-3 9-3-9-9-3 9-3z"
				fill="rgba(224, 242, 254, 0.4)"
			/>
		</svg>
	);
}

function HomePage() {
	const hideHomeHero = useSettingsStore((s) => s.hideHomeHero);

	return (
		<div className={styles.landing}>
			{!hideHomeHero && (
				<div className={styles.heroWrap}>
					<HeroBg />
					<section className={styles.heading}>
						<Brand />
						<Carousel />
					</section>
				</div>
			)}
			<ServiceList />
		</div>
	);
}

export const Route = createFileRoute("/")({
	component: HomePage,
});
