import { useCallback, useEffect, useReducer, useRef } from "react";
import styles from "./Carousel.module.css";

type CarouselState = {
	direction: "left" | "right";
	value: number;
};

function reducer(
	state: CarouselState,
	action: { type: string },
): CarouselState {
	switch (action.type) {
		case "left":
			return { direction: "left", value: (state.value - 1 + 3) % 3 };
		case "right":
			return { direction: "right", value: (state.value + 1) % 3 };
	}
	throw Error(`Unknown action: ${action.type}`);
}

const CARDS = [
	{ className: styles.card1, label: "便捷查询" },
	{ className: styles.card2, label: "数据分析" },
	{ className: styles.card3, label: "开源免费" },
];

export function Carousel() {
	const [state, dispatch] = useReducer(reducer, {
		direction: "right",
		value: 0,
	});

	const startXRef = useRef(0);
	const isDraggingRef = useRef(false);

	const handlePointerDown = useCallback((e: React.PointerEvent) => {
		startXRef.current = e.clientX;
		isDraggingRef.current = true;
	}, []);

	const handlePointerUp = useCallback((e: React.PointerEvent) => {
		if (!isDraggingRef.current) return;
		isDraggingRef.current = false;
		const diff = e.clientX - startXRef.current;
		if (Math.abs(diff) > 50) {
			dispatch({ type: diff > 0 ? "left" : "right" });
		}
	}, []);

	// 自动轮播
	useEffect(() => {
		const timer = setInterval(() => {
			dispatch({ type: "right" });
		}, 4000);
		return () => clearInterval(timer);
	}, []);

	const animClass =
		state.direction === "right" ? styles.slideRight : styles.slideLeft;
	const current = CARDS[state.value];

	return (
		<div className={styles.container}>
			<div
				className={styles.cardWrapper}
				onPointerDown={handlePointerDown}
				onPointerUp={handlePointerUp}
				style={{ touchAction: "pan-y" }}
			>
				<div
					key={state.value}
					className={`${current.className} ${animClass}`}
				>
					<span className={styles.cardLabel}>{current.label}</span>
				</div>
			</div>

			<div className={styles.processBar}>
				{[0, 1, 2].map((i) => (
					<button
						key={i}
						type="button"
						className={styles.dot}
						data-active={state.value === i}
						onClick={() => {
							if (i !== state.value) {
								dispatch({
									type: i > state.value ? "right" : "left",
								});
							}
						}}
					/>
				))}
			</div>
		</div>
	);
}
