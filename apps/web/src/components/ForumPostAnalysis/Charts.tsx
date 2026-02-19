import { useMemo, useEffect, useState, forwardRef } from "react";
import type { ISpec } from "@visactor/vchart";
import { useColorMode } from "../../lib/color-mode.tsx";
import { getChartColors } from "../../lib/chart-colors.ts";
import { ensureChinaMapRegistered } from "../../lib/china-geo.ts";
import {
	ChartWrapper,
	type ChartWrapperHandle,
} from "../PostAnalysis/ChartWrapper.tsx";

const HOUR_WINDOW_MS = 72 * 60 * 60 * 1000;

function formatMonthDay(ts: number): string {
	const d = new Date(ts);
	return `${d.getMonth() + 1}月${d.getDate()}日`;
}

function formatDayHour(ts: number): string {
	const d = new Date(ts);
	return `${formatMonthDay(ts)} ${String(d.getHours()).padStart(2, "0")}时`;
}

function formatAxisDayHour(ts: number): string {
	const d = new Date(ts);
	return `${d.getDate()}日${String(d.getHours()).padStart(2, "0")}时`;
}

// ── IP 属地地图 ──

interface IpMapChartProps {
	data: Array<{ name: string; value: number; topUsers: string[] }>;
	style?: React.CSSProperties;
}

export const IpMapChart = forwardRef<ChartWrapperHandle, IpMapChartProps>(
	function IpMapChart({ data, style }, ref) {
		const { isDark } = useColorMode();
		const { palette } = getChartColors(isDark);

		// 动态加载地图 SVG
		const [mapReady, setMapReady] = useState(false);
		useEffect(() => {
			ensureChinaMapRegistered().then(() => setMapReady(true));
		}, []);

		const spec = useMemo<ISpec>(
			() => ({
				type: "pictogram",
				padding: { top: 0, bottom: 0, left: 0, right: 0 },
				data: [{ id: "ip", values: data }],
				nameField: "name",
				valueField: "value",
				svg: "chinamap",
				pictogram: {
					style: {
						fill: {
							scale: "color",
							field: "value",
						},
					},
					state: {
						hover: {
							lineWidth: 2,
							stroke: isDark ? "#fff" : "#333",
						},
						hover_reverse: {
							opacity: 0.7,
						},
					},
				},
				scales: [
					{
						id: "color",
						type: "linear",
						domain: [0, Math.max(...data.map((d) => d.value), 1)],
						range: [isDark ? "#1a2332" : "#e6f0ff", palette[0]],
					},
				],
				tooltip: {
					trigger: "hover",
					mark: {
						title: {
							// pictogram 的 datum 是 SVG 元素对象，实际数据在 datum.data
							value: (datum) =>
								datum?.data?.value != null ? String(datum.data.name) : "",
						},
						content: [
							{
								key: "发帖数",
								value: (datum) =>
									datum?.data?.value != null ? `${datum.data.value} 人` : "",
								hasShape: false,
							},
						],
						updateContent: (prev) => {
							if (!prev?.length) return prev;
							// biome-ignore lint/suspicious/noExplicitAny: VChart pictogram tooltip datum
							const d = (prev[0] as any).datum;
							const users: string[] | undefined = d?.data?.topUsers;
							if (users) {
								for (const u of users) {
									prev.push({ key: u, value: "", hasShape: false });
								}
							}
							return prev;
						},
					},
				},
				legends: [
					{
						visible: true,
						type: "color",
						orient: "bottom",
						field: "value",
						position: "middle",
					},
				],
			}),
			[data, palette, isDark],
		);

		if (!mapReady || data.length === 0) return <div style={style} />;
		return <ChartWrapper ref={ref} spec={spec} style={style} />;
	},
);

// ── 等级分布柱状图 ──

interface LevelChartProps {
	data: Array<{ name: string; value: number }>;
	style?: React.CSSProperties;
}

export const LevelChart = forwardRef<ChartWrapperHandle, LevelChartProps>(
	function LevelChart({ data, style }, ref) {
		const { isDark } = useColorMode();
		const { palette } = getChartColors(isDark);

		const spec = useMemo<ISpec>(
			() => ({
				type: "bar",
				data: [{ id: "level", values: data }],
				xField: "name",
				yField: "value",
				color: [palette[0]],
				label: {
					visible: true,
					position: "top",
					style: { fontSize: 10 },
				},
				tooltip: {
					trigger: "hover",
					mark: {
						content: [
							{
								key: (datum) => (datum ? String(datum.name) : ""),
								value: (datum) => (datum ? `${datum.value} 人` : ""),
							},
						],
					},
				},
			}),
			[data, palette],
		);

		if (data.length === 0) return <div style={style} />;
		return <ChartWrapper ref={ref} spec={spec} style={style} />;
	},
);

// ── 发帖时间分布（堆叠散点图） ──

interface TimeScatterChartProps {
	data: {
		mode: "hour" | "day";
		data: Array<{ time: number; type: string; value: number }>;
	};
	style?: React.CSSProperties;
}

export const TimeScatterChart = forwardRef<
	ChartWrapperHandle,
	TimeScatterChartProps
>(function TimeScatterChart({ data, style }, ref) {
	const { isDark } = useColorMode();

	const spec = useMemo<ISpec>(() => {
		const { mode, data: rawData } = data;
		// 参考官网示例：每条点值固定为 ±1，由 stack 自动堆叠
		const sortedRaw = [...rawData].sort(
			(a, b) => a.time - b.time || a.type.localeCompare(b.type),
		);
		const countByKey = new Map<string, number>();
		for (const item of sortedRaw) {
			const key = `${item.time}|${item.type}`;
			const delta = Math.max(Math.abs(item.value), 1);
			countByKey.set(key, (countByKey.get(key) ?? 0) + delta);
		}
		const chartData: Array<{
			time: number;
			type: string;
			count: number;
			value: number;
		}> = [];
		for (const item of sortedRaw) {
			const key = `${item.time}|${item.type}`;
			const delta = Math.max(Math.abs(item.value), 1);
			const total = countByKey.get(key) ?? delta;
			const sign = item.type === "主题贴" ? -1 : 1;
			for (let i = 0; i < delta; i++) {
				chartData.push({
					time: item.time,
					type: item.type,
					count: total,
					value: sign,
				});
			}
		}

		const bottomAxis: Record<string, unknown> = {
			orient: "bottom",
			type: "linear",
			domainLine: {
				onZero: true,
				style: { stroke: isDark ? "#adbac7" : "#212121" },
			},
			title: {
				visible: true,
				text: mode === "hour" ? "时间 →" : "日期 →",
			},
		};
		if (mode === "hour") {
			const now = new Date();
			now.setMinutes(0, 0, 0);
			const max = now.getTime();
			const minDataTime =
				chartData.length > 0
					? Math.min(...chartData.map((d) => d.time))
					: max - HOUR_WINDOW_MS;
			bottomAxis.range = {
				min: Math.min(max - HOUR_WINDOW_MS, minDataTime),
				max,
			};
			bottomAxis.label = {
				formatMethod: (v: string) => formatAxisDayHour(Number(v)),
			};
		} else {
			bottomAxis.label = {
				formatMethod: (v: string) => formatMonthDay(Number(v)),
			};
		}

		return {
			type: "common",
			data: [{ id: "time", values: chartData }],
			series: [
				{
					type: "scatter",
					xField: "time",
					yField: "value",
					seriesField: "type",
					stack: true,
					point: {
						style: {
							size: 3.5,
							fillOpacity: 0.8,
						},
					},
				},
			],
			axes: [
				bottomAxis,
				{
					orient: "left",
					domainLine: { visible: false },
					title: { visible: true, text: "← 主题贴 · 回复 →" },
					grid: { style: { lineDash: [0] } },
					label: {
						formatMethod: (v: string) => `${Math.abs(Number(v))}`,
					},
				},
			],
			tooltip: {
				mark: {
					title: {
						value: (datum: Record<string, unknown> | undefined) => {
							if (!datum) return "";
							const ts = Number(datum["time"]);
							return mode === "hour" ? formatDayHour(ts) : formatMonthDay(ts);
						},
					},
					content: [
						{
							key: "类型",
							value: (datum: Record<string, unknown> | undefined) =>
								datum ? String(datum["type"]) : "",
						},
						{
							key: "数量",
							value: (datum: Record<string, unknown> | undefined) =>
								datum ? `${datum["count"]} 条` : "",
						},
					],
				},
			},
		};
	}, [data, isDark]);

	if (data.data.length === 0) return <div style={style} />;
	return <ChartWrapper ref={ref} spec={spec} style={style} />;
});

// ── 活跃用户排行（水平柱状图） ──

interface TopUsersChartProps {
	data: Array<{ name: string; value: number }>;
	style?: React.CSSProperties;
}

export const TopUsersChart = forwardRef<ChartWrapperHandle, TopUsersChartProps>(
	function TopUsersChart({ data, style }, ref) {
		const { isDark } = useColorMode();
		const { palette } = getChartColors(isDark);
		const sortedData = useMemo(
			() => [...data].sort((a, b) => b.value - a.value),
			[data],
		);

		const spec = useMemo<ISpec>(
			() => ({
				type: "bar",
				data: [{ id: "users", values: sortedData }],
				direction: "horizontal",
				xField: "value",
				yField: "name",
				color: [palette[0]],
				axes: [
					{
						orient: "bottom",
						type: "linear",
						title: { visible: true, text: "发帖数" },
					},
					{
						orient: "left",
						type: "band",
						domainLine: { visible: false },
						label: {
							visible: true,
							autoHide: false,
							autoLimit: false,
						},
					},
				],
				label: {
					visible: true,
					position: "right",
					style: { fontSize: 10 },
				},

				tooltip: {
					trigger: "hover",
					mark: {
						content: [
							{
								key: (datum) => (datum ? String(datum.name) : ""),
								value: (datum) => (datum ? `${datum.value} 帖` : ""),
							},
						],
					},
				},
			}),
			[palette, sortedData],
		);

		if (data.length === 0) return <div style={style} />;
		return <ChartWrapper ref={ref} spec={spec} style={style} />;
	},
);

// ── 帖子热度气泡图 ──

interface ThreadHeatChartProps {
	data: Array<{
		title: string;
		author: string;
		replyNum: number;
		viewNum: number;
		agreeNum: number;
	}>;
	style?: React.CSSProperties;
}

export const ThreadHeatChart = forwardRef<
	ChartWrapperHandle,
	ThreadHeatChartProps
>(function ThreadHeatChart({ data, style }, ref) {
	const { isDark } = useColorMode();
	const { scatter } = getChartColors(isDark);

	// 计算热度阈值：按 replyNum+viewNum 降序取前 N 个打标签
	const labelSet = useMemo(() => {
		const n = Math.min(Math.max(Math.round(data.length * 0.1), 3), 8);
		const sorted = [...data]
			.sort((a, b) => b.replyNum + b.viewNum - (a.replyNum + a.viewNum))
			.slice(0, n);
		return new Set(sorted.map((d) => d.title));
	}, [data]);

	const spec = useMemo<ISpec>(
		() => ({
			type: "common",
			data: [{ id: "heat", values: data }],
			series: [
				{
					type: "scatter",
					xField: "viewNum",
					yField: "replyNum",
					sizeField: "agreeNum",
					size: {
						type: "linear",
						range: [4, 30],
					},
					point: {
						style: {
							fill: scatter,
							fillOpacity: 0.6,
							stroke: scatter,
							lineWidth: 1,
						},
					},
					label: {
						visible: true,
						position: "top",
						style: {
							fontSize: 10,
							fill: isDark ? "#adbac7" : "#57606a",
						},
						formatMethod: (_: unknown, datum: Record<string, unknown>) => {
							if (!datum || !labelSet.has(datum.title as string)) return "";
							const title = String(datum.title);
							const author = datum.author ? `@${datum.author}` : "";
							const truncated =
								title.length > 12 ? `${title.slice(0, 12)}…` : title;
							return author ? `${truncated} ${author}` : truncated;
						},
					},
				},
			],
			axes: [
				{
					orient: "bottom",
					type: "linear",
					title: { visible: true, text: "浏览数" },
				},
				{
					orient: "left",
					type: "linear",
					title: { visible: true, text: "回复数" },
				},
			],
			tooltip: {
				trigger: "hover",
				mark: {
					title: {
						value: (datum) => (datum ? String(datum.title).slice(0, 30) : ""),
					},
					content: [
						{
							key: "作者",
							value: (datum) => {
								console.log(datum);
								return datum ? String(datum.author) : "";
							},
						},
						{
							key: "浏览",
							value: (datum) => (datum ? String(datum.viewNum) : ""),
						},
						{
							key: "回复",
							value: (datum) => (datum ? String(datum.replyNum) : ""),
						},
						{
							key: "点赞",
							value: (datum) => (datum ? String(datum.agreeNum) : ""),
						},
					],
				},
			},
		}),
		[data, scatter, isDark, labelSet],
	);

	if (data.length === 0) return <div style={style} />;
	return <ChartWrapper ref={ref} spec={spec} style={style} />;
});

// ── 词云图 ──

interface WordCloudChartProps {
	data: Array<{ name: string; value: number }>;
	style?: React.CSSProperties;
}

export const WordCloudChart = forwardRef<
	ChartWrapperHandle,
	WordCloudChartProps
>(function WordCloudChart({ data, style }, ref) {
	const spec = useMemo<ISpec>(
		() => ({
			type: "wordCloud",
			maskShape: "rect",
			nameField: "name",
			valueField: "value",
			seriesField: "name",
			fontSizeRange: [10, 56],
			fontWeightRange: [400, 700],
			rotateAngles: [0],
			padding: 1,
			wordCloudConfig: {
				drawOutOfBound: "ellipsis",
				layoutMode: "ensureMapping",
				zoomToFit: {
					enlarge: true,
					fontSizeLimitMax: 72,
					shrink: true,
					fontSizeLimitMin: 6,
				},
			},
			tooltip: {
				trigger: "hover",
				mark: {
					content: [
						{
							key: (datum) => (datum ? String(datum.name) : ""),
							value: (datum) => (datum ? `${datum.value} 次` : ""),
						},
					],
				},
			},
			data: [{ id: "wordCloud", values: data }],
		}),
		[data],
	);

	if (data.length === 0) return <div style={style} />;
	return <ChartWrapper ref={ref} spec={spec} style={style} />;
});
