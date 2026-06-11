import { forwardRef, useMemo } from "react";
import { useColorMode } from "../../lib/color-mode.tsx";
import { getChartColors } from "../../lib/chart-colors.ts";
import type { ISpec } from "../../lib/vchart-runtime.ts";
import {
	ChartWrapper,
	type ChartWrapperHandle,
} from "../PostAnalysis/ChartWrapper.tsx";

interface DistChartProps {
	data: Array<{ forumCount: number; userCount: number }>;
	style?: React.CSSProperties;
}

export const DistChart = forwardRef<ChartWrapperHandle, DistChartProps>(
	function DistChart({ data, style }, ref) {
		const { isDark } = useColorMode();
		const { palette } = getChartColors(isDark);

		const chartData = useMemo(() => {
			const merged: Array<{ name: string; value: number }> = [];
			let over20 = 0;
			for (const d of data) {
				if (d.forumCount <= 20) {
					merged.push({ name: String(d.forumCount), value: d.userCount });
				} else {
					over20 += d.userCount;
				}
			}
			if (over20 > 0) merged.push({ name: "20+", value: over20 });
			return merged;
		}, [data]);

		const spec = useMemo<ISpec>(
			() => ({
				type: "bar",
				data: [{ id: "dist", values: chartData }],
				xField: "name",
				yField: "value",
				color: [palette[0]],
				axes: [
					{ orient: "bottom", title: { visible: true, text: "发言吧数" } },
					{ orient: "left", title: { visible: true, text: "用户数" } },
				],
				label: {
					visible: true,
					position: "top",
					style: { fontSize: 10 },
					// biome-ignore lint/suspicious/noExplicitAny: VChart label 回调
					formatMethod: (v: any) =>
						v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v),
				},
				tooltip: {
					trigger: "hover",
					mark: {
						content: [
							{
								// biome-ignore lint/suspicious/noExplicitAny: VChart datum 类型不固定
								key: (datum: any) => (datum ? `${datum.name} 个吧` : ""),
								// biome-ignore lint/suspicious/noExplicitAny: VChart datum 类型不固定
								value: (datum: any) =>
									datum ? `${datum.value.toLocaleString()} 人` : "",
							},
						],
					},
				},
			}),
			[chartData, palette],
		);

		if (chartData.length === 0) return <div style={style} />;
		return <ChartWrapper ref={ref} spec={spec} style={style} />;
	},
);
