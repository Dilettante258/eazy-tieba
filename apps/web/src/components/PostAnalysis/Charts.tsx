import { useMemo, useCallback, forwardRef } from "react";
import type { ISpec } from "@visactor/vchart";
import { registerMosaicChart, registerWordCloudChart } from "@visactor/vchart";
import { useColorMode } from "../../lib/color-mode.tsx";
import { getChartColors } from "../../lib/chart-colors.ts";
import { ChartWrapper, type ChartWrapperHandle } from "./ChartWrapper.tsx";

registerMosaicChart();
registerWordCloudChart();

const dateFmt = new Intl.DateTimeFormat("zh-CN", {
	month: "long",
	day: "numeric",
});

// ── 贴吧分布饼图 ──

interface BaChartProps {
	data: Array<{ name: string; value: number }>;
	style?: React.CSSProperties;
	onForumClick?: (forumName: string) => void;
}

export const BaChart = forwardRef<ChartWrapperHandle, BaChartProps>(
	function BaChart({ data, style, onForumClick }, ref) {
		const { isDark } = useColorMode();
		const { palette } = getChartColors(isDark);

		if (data.length === 0) return <div style={style} />;

		const spec = useMemo<ISpec>(
			() => ({
				type: "pie",
				data: [{ id: "forum", values: data }],
				categoryField: "name",
				valueField: "value",
				outerRadius: 0.8,
				color: palette,
				legends: { visible: true, orient: "left" },
				tooltip: {
					trigger: "hover",
					mark: {
						content: [
							{
								key: (datum) => (datum ? `${datum["name"]}吧` : ""),
								value: (datum) => {
									if (!datum) return "";
									const v = datum["value"] as number;
									const sum = data.reduce((s, d) => s + d.value, 0);
									return `${v} 帖 (${((v / sum) * 100).toFixed(1)}%)`;
								},
							},
						],
					},
				},
			}),
			[data, palette],
		);

		const handleClick = useCallback(
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(e: any) => {
				const name = e?.datum?.name as string | undefined;
				if (name && onForumClick) onForumClick(name);
			},
			[onForumClick],
		);

		return (
			<ChartWrapper ref={ref} spec={spec} style={style} onClick={handleClick} />
		);
	},
);

// ── 散点图共用的轴配置工厂 ──

function makeScatterAxes(currentYear: number) {
	const formatMonth = (v: number) => `${new Date(v).getMonth() + 1}月`;
	return [
		{
			orient: "bottom" as const,
			type: "linear" as const,
			range: {
				min: new Date(currentYear, 0, 1).getTime(),
				max: new Date(currentYear, 11, 31).getTime(),
			},
			label: { formatMethod: formatMonth },
		},
		{
			orient: "left" as const,
			type: "linear" as const,
			range: { min: 0, max: 24 },
			title: { visible: true, text: "小时" },
		},
	];
}

// ── 发帖时间基础散点图 ──

interface ScatterChartProps {
	data: Array<{ date: number; hour: number }>;
	style?: React.CSSProperties;
}

export const ScatterChart = forwardRef<ChartWrapperHandle, ScatterChartProps>(
	function ScatterChart({ data, style }, ref) {
		const { isDark } = useColorMode();
		const { scatter } = getChartColors(isDark);
		const currentYear = new Date().getFullYear();

		if (data.length === 0) return <div style={style} />;

		const spec = useMemo<ISpec>(
			() => ({
				type: "common",
				data: [{ id: "time", values: data }],
				series: [
					{
						type: "scatter",
						xField: "date",
						yField: "hour",
						point: {
							style: { fill: scatter, fillOpacity: 0.35 },
							state: { hover: { scaleX: 1.2, scaleY: 1.2 } },
						},
					},
				],
				axes: makeScatterAxes(currentYear),
				tooltip: {
					mark: {
						content: [
							{
								key: "日期",
								value: (datum) =>
									datum ? dateFmt.format(datum["date"] as number) : "",
							},
							{
								key: "时间",
								value: (datum) => (datum ? `${datum["hour"]}:00` : ""),
							},
						],
					},
				},
				crosshair: {
					xField: {
						visible: true,
						line: { visible: true, type: "line" },
					},
					yField: {
						visible: true,
						line: { visible: true, type: "line" },
					},
				},
			}),
			[data, currentYear, scatter],
		);

		return <ChartWrapper ref={ref} spec={spec} style={style} />;
	},
);

// ── 按贴吧分类的散点图 ──

interface ForumScatterChartProps {
	data: Array<{ date: number; hour: number; forumName: string }>;
	/** 需要单独展示的贴吧名列表，其余归入"其他" */
	topForums: string[];
	style?: React.CSSProperties;
}

const SCATTER_SHAPES = [
	"circle",
	"square",
	"triangle",
	"diamond",
	"cross",
	"star",
];

export const ForumScatterChart = forwardRef<
	ChartWrapperHandle,
	ForumScatterChartProps
>(function ForumScatterChart({ data, topForums, style }, ref) {
	const { isDark } = useColorMode();
	const { palette } = getChartColors(isDark);
	const currentYear = new Date().getFullYear();

	const cleanedData = useMemo(() => {
		const topSet = new Set(topForums);
		return data.map((d) => ({
			...d,
			forumName: topSet.has(d.forumName) ? d.forumName : "其他",
		}));
	}, [data, topForums]);

	if (cleanedData.length === 0) return <div style={style} />;

	const spec = useMemo<ISpec>(
		() => ({
			type: "common",
			data: [{ id: "time", values: cleanedData }],
			series: [
				{
					type: "scatter",
					xField: "date",
					yField: "hour",
					seriesField: "forumName",
					shapeField: "forumName",
					shape: {
						type: "ordinal",
						range: SCATTER_SHAPES,
					},
					point: {
						style: { fillOpacity: 0.5 },
						state: { hover: { scaleX: 1.2, scaleY: 1.2 } },
					},
				},
			],
			color: palette,
			axes: makeScatterAxes(currentYear),
			legends: [{ visible: true, orient: "bottom" }],
			tooltip: {
				mark: {
					title: {
						value: (datum) => (datum ? `${datum["forumName"]}吧` : ""),
					},
					content: [
						{
							key: "日期",
							value: (datum) =>
								datum ? dateFmt.format(datum["date"] as number) : "",
						},
						{
							key: "时间",
							value: (datum) => (datum ? `${datum["hour"]}:00` : ""),
						},
					],
				},
			},
			crosshair: {
				xField: {
					visible: true,
					line: { visible: true, type: "line" },
				},
				yField: {
					visible: true,
					line: { visible: true, type: "line" },
				},
			},
		}),
		[cleanedData, currentYear, palette],
	);

	return <ChartWrapper ref={ref} spec={spec} style={style} />;
});

// ── 年份-贴吧桑基图 ──

interface SankeyChartProps {
	data: {
		nodes: Array<{ name: string }>;
		links: Array<{ source: string; target: string; value: number }>;
	};
	style?: React.CSSProperties;
}

export const SankeyChart = forwardRef<ChartWrapperHandle, SankeyChartProps>(
	function SankeyChart({ data, style }, ref) {
		const { isDark } = useColorMode();
		const { palette } = getChartColors(isDark);

		if (data.links.length === 0) return <div style={style} />;

		const spec = useMemo<ISpec>(
			() => ({
				type: "sankey",
				data: [
					{
						id: "sankey",
						// biome-ignore lint/suspicious/noExplicitAny: 桑基图 values 为 {nodes,links} 对象，与通用 Datum[] 类型不兼容
						values: [{ nodes: data.nodes, links: data.links }] as any,
					},
				],
				categoryField: "name",
				valueField: "value",
				sourceField: "source",
				targetField: "target",
				nodeKey: (datum: { name: string }) => datum.name,

				nodeAlign: "justify",
				nodeGap: 8,
				nodeWidth: 10,
				minNodeHeight: 4,

				color: palette,
				emphasis: { effect: "adjacency" },

				label: {
					visible: true,
					style: { fontSize: 10 },
				},

				node: {
					state: {
						hover: {
							stroke: isDark ? "#e6edf3" : "#333333",
						},
						selected: {
							fillOpacity: 1,
							stroke: isDark ? "#e6edf3" : "#333333",
							lineWidth: 1,
						},
					},
				},

				link: {
					style: { curvature: 0.5 },
					state: {
						hover: { fillOpacity: 0.6 },
						selected: {
							fillOpacity: 0.6,
							stroke: isDark ? "#e6edf3" : "#333333",
							lineWidth: 1,
						},
					},
				},

				tooltip: {
					mark: {
						title: {
							value: (datum) => {
								if (!datum) return "";
								// link tooltip: 年份 → 贴吧
								if (datum["source"] && datum["target"])
									return `${datum["source"]} → ${datum["target"]}吧`;
								// node tooltip: 节点名
								return String(datum["name"] ?? "");
							},
						},
						content: [
							{
								key: "帖子数",
								value: (datum) =>
									datum
										? String(datum["value"] ?? datum["node_value"] ?? "")
										: "",
							},
						],
					},
				},
			}),
			[data, isDark, palette],
		);

		return <ChartWrapper ref={ref} spec={spec} style={style} />;
	},
);

// ── 年份×贴吧马赛克图 ──

interface MosaicChartProps {
	data: {
		links: Array<{ source: string; target: string; value: number }>;
	};
	style?: React.CSSProperties;
}

export const MosaicChart = forwardRef<ChartWrapperHandle, MosaicChartProps>(
	function MosaicChart({ data, style }, ref) {
		const { isDark } = useColorMode();
		const { palette } = getChartColors(isDark);

		// 将 sankey links 转为马赛克图扁平数据：{ year, forum, count }
		const mosaicData = useMemo(
			() =>
				data.links.map((l) => ({
					year: l.source,
					forum: l.target,
					count: l.value,
				})),
			[data.links],
		);

		if (mosaicData.length === 0) return <div style={style} />;

		// biome-ignore lint/suspicious/noExplicitAny: 马赛克图为动态注册类型，ISpec 不含其 axes 定义
		const spec = useMemo<any>(
			() => ({
				type: "mosaic",
				data: [{ id: "mosaic", values: mosaicData }],
				xField: "year",
				yField: "count",
				seriesField: "forum",
				percent: true,
				color: palette,
				legends: { visible: true, orient: "bottom" },
				label: [
					{
						visible: true,
						position: "bottom",
						style: {
							fill: isDark ? "#8b949e" : "#333",
							fontSize: 10,
						},
						filterByGroup: { field: "year", type: "min" },
						overlap: false,
						formatMethod: (_value: unknown, datum: Record<string, unknown>) =>
							datum["year"] as string,
					},
					{
						visible: true,
						position: "center",
						smartInvert: true,
						style: { fontSize: 10 },
					},
				],
				axes: [
					{
						orient: "left",
						label: {
							formatMethod: (val: string) =>
								`${(Number(val) * 100).toFixed(0)}%`,
						},
					},
					{
						orient: "bottom",
						label: { visible: false },
					},
				],
				tooltip: {
					mark: {
						title: {
							value: (datum: Record<string, unknown> | undefined) =>
								datum ? `${datum["year"]}年 · ${datum["forum"]}吧` : "",
						},
						content: [
							{
								key: "帖子数",
								value: (datum: Record<string, unknown> | undefined) =>
									datum ? `${datum["count"]}` : "",
							},
						],
					},
				},
			}),
			[mosaicData, isDark, palette],
		);

		return <ChartWrapper ref={ref} spec={spec} style={style} />;
	},
);

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
