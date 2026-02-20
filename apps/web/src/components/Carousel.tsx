import { useEffect, useRef } from "react";
import styles from "./Carousel.module.css";

const AUTO_SCROLL_INTERVAL = 4000;

export function Carousel() {
	const ref = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let paused = false;
		const pause = () => {
			paused = true;
		};
		const resume = () => {
			paused = false;
		};

		const timer = setInterval(() => {
			if (paused) return;
			const maxScroll = el.scrollWidth - el.clientWidth;
			if (el.scrollLeft >= maxScroll - 2) {
				el.scrollTo({ left: 0, behavior: "smooth" });
				return;
			}
			el.scrollBy({ left: el.clientWidth, behavior: "smooth" });
		}, AUTO_SCROLL_INTERVAL);

		el.addEventListener("pointerenter", pause);
		el.addEventListener("pointerleave", resume);
		el.addEventListener("focusin", pause);
		el.addEventListener("focusout", resume);
		el.addEventListener("touchstart", pause, { passive: true });
		el.addEventListener("touchend", resume, { passive: true });

		return () => {
			clearInterval(timer);
			el.removeEventListener("pointerenter", pause);
			el.removeEventListener("pointerleave", resume);
			el.removeEventListener("focusin", pause);
			el.removeEventListener("focusout", resume);
			el.removeEventListener("touchstart", pause);
			el.removeEventListener("touchend", resume);
		};
	}, []);

	return (
		<div className={styles.carouselShell}>
			<button
				type="button"
				className={`${styles.arrow} ${styles.arrowLeft}`}
				aria-label="上一张"
				onClick={() =>
					ref.current?.scrollBy({
						left: -(ref.current?.clientWidth ?? 0),
						behavior: "smooth",
					})
				}
			>
				‹
			</button>
			<div ref={ref} className={styles.carousel}>
				<div className={`${styles.slide} ${styles.slide1}`}>
					<div className={styles.slideContent}>
						<span className={styles.cardLabel}>便捷查询</span>
					</div>
				</div>
				<div className={`${styles.slide} ${styles.slide2}`}>
					<div className={styles.slideContent}>
						<span className={styles.cardLabel}>数据分析</span>
					</div>
				</div>
				<div className={`${styles.slide} ${styles.slide3}`}>
					<div className={styles.slideContent}>
						<span className={styles.cardLabel}>开源免费</span>
					</div>
				</div>
			</div>
			<button
				type="button"
				className={`${styles.arrow} ${styles.arrowRight}`}
				aria-label="下一张"
				onClick={() =>
					ref.current?.scrollBy({
						left: ref.current?.clientWidth ?? 0,
						behavior: "smooth",
					})
				}
			>
				›
			</button>
		</div>
	);
}
