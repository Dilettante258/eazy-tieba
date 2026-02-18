import { useState, useEffect, useRef, type ImgHTMLAttributes } from "react";
import { imagePool } from "../lib/image-pool.ts";

interface ConcurrentImageProps
	extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src"> {
	/** 图片地址 */
	src: string;
	/** 进入视口前的占位宽高（用于避免布局偏移） */
	width?: number;
	height?: number;
}

/**
 * 带并发限制和懒加载的 <img> 替代组件。
 * - 仅当元素进入视口时才开始加载
 * - 通过全局 imagePool 控制同时发起的图片请求数
 */
export function ConcurrentImage({
	src,
	width,
	height,
	style,
	onLoad,
	onError,
	...rest
}: ConcurrentImageProps) {
	const ref = useRef<HTMLImageElement>(null);
	const [activeSrc, setActiveSrc] = useState<string | undefined>();
	const releaseRef = useRef<(() => void) | null>(null);

	useEffect(() => {
		const el = ref.current;
		if (!el) return;

		let cancelled = false;

		const observer = new IntersectionObserver(
			([entry]) => {
				if (!entry.isIntersecting) return;
				observer.disconnect();

				imagePool.acquire().then((releaseFn) => {
					if (cancelled) {
						releaseFn();
						return;
					}
					releaseRef.current = releaseFn;
					setActiveSrc(src);
				});
			},
			{ rootMargin: "200px" },
		);

		observer.observe(el);

		return () => {
			cancelled = true;
			observer.disconnect();
			// 组件卸载时释放槽位（如果图片还没加载完）
			if (releaseRef.current) {
				releaseRef.current();
				releaseRef.current = null;
			}
		};
	}, [src]);

	const handleComplete = () => {
		if (releaseRef.current) {
			releaseRef.current();
			releaseRef.current = null;
		}
	};

	return (
		<img
			ref={ref}
			src={activeSrc}
			width={width}
			height={height}
			style={{
				...style,
				...(activeSrc
					? {}
					: { background: "var(--bgColor-muted, #f6f8fa)" }),
			}}
			onLoad={(e) => {
				handleComplete();
				onLoad?.(e);
			}}
			onError={(e) => {
				handleComplete();
				onError?.(e);
			}}
			{...rest}
		/>
	);
}
