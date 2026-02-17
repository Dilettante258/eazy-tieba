import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import {
	Banner,
	Button,
	Spinner,
	TextInput,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
	GraphIcon,
	SearchIcon,
	SortAscIcon,
	SortDescIcon,
} from "@primer/octicons-react";
import { useMemo, useState, useCallback, useRef } from "react";
import { QueryForm } from "../components/QueryForm.tsx";
import {
	usePostsBatchInfinite,
	useProfile,
} from "../hooks/queries.ts";
import { userSearchSchema } from "../lib/search-schemas.ts";
import {
	UserPostClass,
	type UserPost,
} from "../lib/user-post.ts";
import { useUPSelectorStore } from "../lib/store.ts";
import { useVChartThemeSync } from "../lib/vchart-theme.ts";
import {
	Module,
	PostActivityCalendar,
	BaChart,
	ScatterChart,
	ForumScatterChart,
	SankeyChart,
	MosaicChart,
	ChartActionBar,
	type ChartWrapperHandle,
	DataIndicator,
	DataSelector,
	PostListVirtualized,
} from "../components/PostAnalysis/index.ts";
import styles from "./postanalysis.module.css";

// ── 帖子列表模块 ──

interface PostListModuleProps {
	data: UserPost[];
	listDescription: string;
}

function PostListModule({ data, listDescription }: PostListModuleProps) {
	const [search, setSearch] = useState("");
	const [asc, setAsc] = useState(true);

	return (
		<Module className={styles.listSection}>
			<div className={styles.listHeader}>
				<div className={styles.listHeaderInfo}>
					<Module.Title>发帖列表</Module.Title>
					<Module.Description>{listDescription}</Module.Description>
				</div>
				<div className={styles.listControls}>
					<TextInput
						leadingVisual={SearchIcon}
						placeholder="搜索帖子..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						size="small"
					/>
					<Button
						size="small"
						variant="invisible"
						onClick={() => setAsc(!asc)}
						aria-label="切换排序"
					>
						{asc ? (
							<SortAscIcon size={16} />
						) : (
							<SortDescIcon size={16} />
						)}
					</Button>
				</div>
			</div>
			<PostListVirtualized data={data} search={search} asc={asc} />
		</Module>
	);
}

// ── 贴吧分布饼图模块 ──

interface PieChartModuleProps {
	data: Array<{ name: string; value: number }>;
	yearRangeStr: string;
}

function PieChartModule({ data, yearRangeStr }: PieChartModuleProps) {
	const chartRef = useRef<ChartWrapperHandle>(null);
	const setSelectedForums = useUPSelectorStore((s) => s.setSelectedForums);

	const handleForumClick = useCallback(
		(forumName: string) => {
			const current = useUPSelectorStore.getState().selectedForums;
			const next = current.includes(forumName)
				? current.filter((f) => f !== forumName)
				: [...current, forumName];
			setSelectedForums(next);
		},
		[setSelectedForums],
	);

	return (
		<Module>
			<div className={styles.moduleHeader}>
				<div>
					<Module.Title>发帖所在吧分布</Module.Title>
					<Module.Description>{yearRangeStr}</Module.Description>
				</div>
				<ChartActionBar chartRef={chartRef} name="发帖所在吧分布" />
			</div>
			<BaChart
				ref={chartRef}
				data={data}
				style={{ height: "300px" }}
				onForumClick={handleForumClick}
			/>
		</Module>
	);
}

// ── 发帖时间散点图模块 ──

interface ScatterChartModuleProps {
	timeDistribution: Array<{ date: number; hour: number; forumName: string }>;
	topForumNames: string[];
	yearRangeStr: string;
}

function ScatterChartModule({
	timeDistribution,
	topForumNames,
	yearRangeStr,
}: ScatterChartModuleProps) {
	const chartRef = useRef<ChartWrapperHandle>(null);
	const [mode, setMode] = useState<"basic" | "forum">("basic");

	return (
		<Module>
			<div className={styles.moduleHeader}>
				<div>
					<Module.Title>发帖时间分布</Module.Title>
					<Module.Description>{yearRangeStr}</Module.Description>
				</div>
				<ChartActionBar
					chartRef={chartRef}
					name="发帖时间分布"
					menuItems={[
						{ label: "基础散点", onClick: () => setMode("basic") },
						{ label: "按吧分类", onClick: () => setMode("forum") },
					]}
				/>
			</div>
			{mode === "basic" ? (
				<ScatterChart
					ref={chartRef}
					data={timeDistribution}
					style={{ height: "300px" }}
				/>
			) : (
				<ForumScatterChart
					ref={chartRef}
					data={timeDistribution}
					topForums={topForumNames}
					style={{ height: "300px" }}
				/>
			)}
		</Module>
	);
}

// ── 年份×贴吧分布模块 ──

interface FlowChartModuleProps {
	sankeyData: {
		nodes: Array<{ name: string }>;
		links: Array<{ source: string; target: string; value: number }>;
	};
	yearRange: number[];
}

function FlowChartModule({ sankeyData, yearRange }: FlowChartModuleProps) {
	const chartRef = useRef<ChartWrapperHandle>(null);
	const [mode, setMode] = useState<"sankey" | "mosaic">("sankey");

	const description =
		yearRange.length > 0
			? `从${yearRange[yearRange.length - 1]}年到${yearRange[0]}年`
			: "";

	return (
		<Module>
			<div className={styles.moduleHeader}>
				<div>
					<Module.Title>年份×贴吧分布</Module.Title>
					<Module.Description>{description}</Module.Description>
				</div>
				<ChartActionBar
					chartRef={chartRef}
					name="年份×贴吧分布"
					menuItems={[
						{ label: "桑基图", onClick: () => setMode("sankey") },
						{ label: "马赛克图", onClick: () => setMode("mosaic") },
					]}
				/>
			</div>
			{mode === "sankey" ? (
				<SankeyChart
					ref={chartRef}
					data={sankeyData}
					style={{ height: "300px" }}
				/>
			) : (
				<MosaicChart
					ref={chartRef}
					data={sankeyData}
					style={{ height: "300px" }}
				/>
			)}
		</Module>
	);
}

// ── 主页面 ──

function PostAnalysisPage() {
	useVChartThemeSync();
	const { method, id } = Route.useSearch();
	const {
		data,
		error,
		fetchNextPage,
		hasNextPage,
		isFetching,
		isFetchingNextPage,
		status,
	} = usePostsBatchInfinite(method, id);

	const { data: profile, isLoading: profileLoading } = useProfile(
		method,
		id,
	);

	// Zustand 状态
	const year = useUPSelectorStore((s) => s.selectedYear);
	const date = useUPSelectorStore((s) => s.selectedDate);
	const forums = useUPSelectorStore((s) => s.selectedForums);
	const lastChange = useUPSelectorStore((s) => s.lastChange);
	const prevChange = useUPSelectorStore((s) => s.prevChange);
	const setSelectedDate = useUPSelectorStore((s) => s.setSelectedDate);
	const setSelectedYear = useUPSelectorStore((s) => s.setSelectedYear);
	const setSelectedForums = useUPSelectorStore((s) => s.setSelectedForums);
	const clearForumFilter = useUPSelectorStore((s) => s.clearForumFilter);

	// 转换并构建分析实例
	const pageCount = data?.pages.length ?? 0;

	const allPosts = useMemo(() => {
		if (!data) return [];
		return data.pages.flat();
	}, [pageCount, data]);

	const up = useMemo(() => {
		if (allPosts.length === 0) return null;
		return new UserPostClass(allPosts);
	}, [allPosts]);

	// 年份范围
	const { yearRange, yearRangeStr } = useMemo(() => {
		const yearRange = Object.keys(up?.dividerMap ?? {}).map(Number);
		return {
			yearRange,
			yearRangeStr:
				year === "ALL"
					? yearRange.length > 0
						? `从${yearRange[yearRange.length - 1]}年到${yearRange[0]}年`
						: ""
					: `${year}年的记录`,
		};
	}, [up, year]);

	// 贴吧分布（饼图 + 过滤用）
	const forumDistribution = useMemo(
		() =>
			up?.getForumDistribution(year, {
				threshold: 0.96,
				maxItems: 5,
				othersName: "其他贴吧",
			}) ?? [],
		[up, year],
	);

	// 散点图用的 top 贴吧名列表（排除"其他贴吧"）
	const topForumNames = useMemo(
		() =>
			forumDistribution
				.map((d) => d.name)
				.filter((name) => name !== "其他贴吧"),
		[forumDistribution],
	);

	// 发帖时间分布数据（两个散点图共用）
	const timeDistribution = useMemo(
		() => up?.getTimeDistribution(year) ?? [],
		[up, year],
	);

	// 桑基图数据
	const sankeyData = useMemo(
		() =>
			up?.getSankeyData({
				threshold: 0.9,
				maxItems: 10,
				othersName: "其他",
			}) ?? { nodes: [], links: [] },
		[up],
	);

	// 根据最后操作类型过滤帖子列表
	const filteredPosts = useMemo((): UserPost[] => {
		if (!up) return [];
		switch (lastChange) {
			case "year":
				return up.getPostListFromYear(year);
			case "date":
				return up.getPostListFromDay(date);
			case "forum": {
				if (forums.length === 0) return up.getPostListFromYear(year);
				const knownNames = forumDistribution.map((d) => d.name);
				return up.getPostListFromYear(year).filter((post) => {
					if (forums.includes(post.forumName)) return true;
					if (
						forums.includes("其他贴吧") &&
						!knownNames.includes(post.forumName)
					)
						return true;
					return false;
				});
			}
		}
	}, [up, lastChange, year, date, forums, forumDistribution]);

	// 热力图点击事件
	const calendarEventHandlers = useMemo(
		() => ({
			onClick:
				() =>
				(activity: { date: string }) => {
					setSelectedDate(activity.date);
				},
		}),
		[setSelectedDate],
	);

	// 帖子列表描述文案
	const listDescription = useMemo(() => {
		const forumStr =
			forums.length === 0
				? ""
				: forums.length === 1
					? `${forums[0]}吧`
					: `${forums.length}个吧`;
		switch (lastChange) {
			case "year":
				return yearRangeStr;
			case "date":
				return `${date}的发帖`;
			case "forum":
				return prevChange === "date"
					? `${date}的${forumStr}发帖`
					: `${year === "ALL" ? "所有" : `${year}年`}的${forumStr}发帖`;
		}
	}, [lastChange, yearRangeStr, date, forums, prevChange, year]);

	// DataIndicator 数据
	const lastBatchTimeRange = useMemo(() => {
		const lastPage = data?.pages.at(-1);
		if (!lastPage || lastPage.length === 0) return "";
		const last = lastPage[lastPage.length - 1];
		const first = lastPage[0];
		if (!last?.createTime || !first?.createTime) return "";
		const fmt = (ts: number) =>
			new Date(ts * 1000).toLocaleDateString("zh-CN");
		return `${fmt(last.createTime)}到${fmt(first.createTime)}`;
	}, [data]);

	const hasData = up && allPosts.length > 0;

	return (
		<div>
			<h2 className={styles.heading}>用户发帖分析</h2>
			<QueryForm />

			{isFetching && !isFetchingNextPage && !hasData && (
				<div className={styles.center}>
					<Spinner size="large" />
				</div>
			)}

			{error && !hasData && (
				<Banner
					variant="critical"
					title="查询失败"
					description={
						error instanceof Error ? error.message : String(error)
					}
				/>
			)}

			{status === "success" && allPosts.length === 0 && (
				<Blankslate border>
					<Blankslate.Visual>
						<GraphIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>暂无帖子数据</Blankslate.Heading>
					<Blankslate.Description>
						该用户还没有发布过帖子
					</Blankslate.Description>
				</Blankslate>
			)}

			{hasData && (
				<>
					{/* 顶部区域：热力图 + 数据控制器 + 年份选择 */}
					<div className={styles.calendarRow}>
						<Module>
							<Module.Title>发帖热力图</Module.Title>
							<Module.Description>{yearRangeStr}</Module.Description>
							<PostActivityCalendar
								data={up.postList2HeatMap(year)}
								eventHandlers={calendarEventHandlers}
							/>
						</Module>
						<Module>
							<Module.Title>数据控制器</Module.Title>
							<DataIndicator
								profile={profile}
								profileLoading={profileLoading}
								pageParams={
									(data?.pageParams as Array<[number, number]>) ?? []
								}
								totalCount={allPosts.length}
								lastBatchCount={data?.pages.at(-1)?.length ?? 0}
								lastBatchTimeRange={lastBatchTimeRange}
								hasNextPage={hasNextPage}
								isFetchingNextPage={isFetchingNextPage}
								fetchNextPage={fetchNextPage}
								status={status}
								error={error}
							/>
							<DataSelector
								yearRange={yearRange}
								forumDistribution={forumDistribution}
								setSelectedYear={setSelectedYear}
								setSelectedForums={setSelectedForums}
								clearForumFilter={clearForumFilter}
							/>
						</Module>
					</div>

					{/* 帖子列表 */}
					<PostListModule
						data={filteredPosts}
						listDescription={listDescription}
					/>

					{/* 图表区域 */}
					<div className={styles.chartRow}>
						<PieChartModule
							data={forumDistribution}
							yearRangeStr={yearRangeStr}
						/>
						<ScatterChartModule
							timeDistribution={timeDistribution}
							topForumNames={topForumNames}
							yearRangeStr={yearRangeStr}
						/>
						<FlowChartModule
							sankeyData={sankeyData}
							yearRange={yearRange}
						/>
					</div>
				</>
			)}
		</div>
	);
}

export const Route = createFileRoute("/postanalysis")({
	validateSearch: zodSearchValidator({ schema: userSearchSchema }),
	component: PostAnalysisPage,
});
