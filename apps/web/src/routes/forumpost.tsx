import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import {
	AnchoredOverlay,
	Banner,
	Button,
	SegmentedControl,
	TextInput,
} from "@primer/react";
import { SearchIcon } from "@primer/octicons-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { MAINLAND_PROVINCES, HMT_NAMES } from "../lib/china-geo.ts";
import { forumPostSearchSchema } from "../lib/search-schemas.ts";
import { useForumAnalysis } from "../hooks/use-forum-analysis.ts";
import { useVChartThemeSync } from "../lib/vchart-theme.ts";
import { useSettingsStore } from "../lib/settings-store.ts";
import {
	FetchProgress,
	IpMapChart,
	LevelChart,
	TimeScatterChart,
	TopUsersChart,
	ThreadHeatChart,
	WordCloudChart,
} from "../components/ForumPostAnalysis/index.ts";
import {
	ChartActionBar,
	type ChartWrapperHandle,
} from "../components/PostAnalysis/ChartWrapper.tsx";
import styles from "./forumpost.module.css";
import moduleStyles from "../components/ForumPostAnalysis/ForumPostAnalysis.module.css";

// ── 查询表单 ──

interface ForumQueryFormProps {
	onSubmit: (
		fname: string,
		sort: number,
		count: number,
		depth: "first" | "all",
	) => void;
	loading: boolean;
}

function ForumQueryForm({ onSubmit, loading }: ForumQueryFormProps) {
	const { fname, sort, count, depth } = Route.useSearch();
	const [localFname, setLocalFname] = useState(fname);
	const [localSort, setLocalSort] = useState(sort);
	const [localCount, setLocalCount] = useState(String(count));
	const [localDepth, setLocalDepth] = useState<"first" | "all">(depth);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const trimmed = localFname.trim();
			if (!trimmed) return;
			const n = Math.min(Math.max(Number(localCount) || 50, 1), 300);
			onSubmit(trimmed, localSort, n, localDepth);
		},
		[localFname, localSort, localCount, localDepth, onSubmit],
	);

	return (
		<form className={styles.queryForm} onSubmit={handleSubmit}>
			<div className={styles.formField}>
				<span className={styles.formLabel}>贴吧名称</span>
				<TextInput
					className={styles.fnameInput}
					leadingVisual={SearchIcon}
					placeholder="输入贴吧名"
					value={localFname}
					onChange={(e) => setLocalFname(e.target.value)}
					size="medium"
				/>
			</div>

			<div className={styles.formField}>
				<span className={styles.formLabel}>排序</span>
				<SegmentedControl
					size="small"
					onChange={(i) => setLocalSort(i === 0 ? 1 : 0)}
				>
					<SegmentedControl.Button selected={localSort === 1}>
						最新回复
					</SegmentedControl.Button>
					<SegmentedControl.Button selected={localSort === 0}>
						最新发帖
					</SegmentedControl.Button>
				</SegmentedControl>
			</div>

			<div className={styles.formField}>
				<span className={styles.formLabel}>帖子数</span>
				<TextInput
					className={styles.countInput}
					type="number"
					min={1}
					max={300}
					value={localCount}
					onChange={(e) => setLocalCount(e.target.value)}
					size="medium"
				/>
			</div>

			<div className={styles.formField}>
				<span className={styles.formLabel}>抓取深度</span>
				<SegmentedControl
					size="small"
					onChange={(i) => setLocalDepth(i === 0 ? "first" : "all")}
				>
					<SegmentedControl.Button selected={localDepth === "first"}>
						仅首页
					</SegmentedControl.Button>
					<SegmentedControl.Button selected={localDepth === "all"}>
						全部(≤5页)
					</SegmentedControl.Button>
				</SegmentedControl>
			</div>

			<Button type="submit" variant="primary" disabled={loading}>
				开始分析
			</Button>
		</form>
	);
}

// ── 图表模块（带标题） ──

function ChartModule({
	title,
	description,
	chartRef,
	name,
	className,
	overlay,
	children,
}: {
	title: string;
	description?: React.ReactNode;
	chartRef: React.RefObject<ChartWrapperHandle | null>;
	name: string;
	className?: string;
	overlay?: boolean;
	children: React.ReactNode;
}) {
	return (
		<div
			className={`${moduleStyles.chartModule} ${overlay ? moduleStyles.chartModuleOverlay : ""} ${className ?? ""}`}
		>
			<div className={moduleStyles.chartModuleHeader}>
				<div>
					<h3 className={moduleStyles.chartTitle}>{title}</h3>
					{description && (
						<p className={moduleStyles.chartDescription}>{description}</p>
					)}
				</div>
				<ChartActionBar chartRef={chartRef} name={name} />
			</div>
			{children}
		</div>
	);
}

// ── IP 属地描述（含境外 Overlay） ──

function IpDescription({
	data,
}: {
	data: Array<{ name: string; value: number; topUsers: string[] }>;
}) {
	const [open, setOpen] = useState(false);
	const { overseas, total } = useMemo(() => {
		const ov: typeof data = [];
		for (const d of data) {
			if (!MAINLAND_PROVINCES.has(d.name) && d.name !== "未知") {
				ov.push(d);
			}
		}
		return { overseas: ov, total: data.length };
	}, [data]);

	if (overseas.length === 0) return <>共 {total} 个地区</>;

	return (
		<>
			共 {total} 个地区，含{" "}
			<AnchoredOverlay
				open={open}
				onOpen={() => setOpen(true)}
				onClose={() => setOpen(false)}
				renderAnchor={(props) => (
					<Button
						{...props}
						as="span"
						size="small"
						variant="invisible"
						className={moduleStyles.overseasTrigger}
					>
						{overseas.length} 个境外
					</Button>
				)}
				width="small"
				className={moduleStyles.overseasListWarp}
			>
				<div className={moduleStyles.overseasList}>
					{overseas.map((r) => (
						<div key={r.name} className={moduleStyles.overseasItem}>
							<div>
								<span>{HMT_NAMES.has(r.name) ? `🇨🇳 ${r.name}` : r.name}</span>
								<span className={moduleStyles.overseasCount}>
									{" "}
									{r.value} 人
								</span>
								{r.topUsers.length > 0 && (
									<div className={moduleStyles.overseasUsers}>
										{r.topUsers.join("、")}
									</div>
								)}
							</div>
						</div>
					))}
				</div>
			</AnchoredOverlay>
		</>
	);
}

// ── IP 变动用户表格 ──

function IpChangedUsersTable({
	users,
}: {
	users: Array<{ name: string; portrait: string; ips: string[]; postCount: number }>;
}) {
	return (
		<div className={moduleStyles.chartModule}>
			<h3 className={moduleStyles.chartTitle}>IP 属地变动用户</h3>
			<p className={moduleStyles.chartDescription}>
				以下用户在不同帖子中使用了不同 IP 属地
			</p>
			{users.length === 0 ? (
				<p className={moduleStyles.chartDescription}>暂无数据</p>
			) : (
				<table className={styles.ipChangeTable}>
					<thead>
						<tr>
							<th>用户</th>
							<th>IP 属地</th>
							<th>发帖数</th>
						</tr>
					</thead>
					<tbody>
						{users.map((u) => (
							<tr key={u.name}>
								<td>{u.name}</td>
								<td>{u.ips.join("、")}</td>
								<td>{u.postCount}</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
}

// ── 页面组件 ──

function ForumPostPage() {
	useVChartThemeSync();

	const { status, phase, threadCount, postsFetched, data, error, start } =
		useForumAnalysis();

	const panels = useSettingsStore((s) => s.forumPanelVisibility);
	const topUsersCount = useSettingsStore((s) => s.forumTopUsersCount);
	const mergeHighLevels = useSettingsStore((s) => s.forumMergeHighLevels);
	const blockedWords = useSettingsStore((s) => s.blockedWordCloudKeywords);

	const ipMapRef = useRef<ChartWrapperHandle>(null);
	const levelRef = useRef<ChartWrapperHandle>(null);
	const timeRef = useRef<ChartWrapperHandle>(null);
	const usersRef = useRef<ChartWrapperHandle>(null);
	const heatRef = useRef<ChartWrapperHandle>(null);
	const wordCloudRef = useRef<ChartWrapperHandle>(null);

	const handleSubmit = useCallback(
		(fname: string, sort: number, count: number, depth: "first" | "all") => {
			start(fname, sort, count, depth);
		},
		[start],
	);

	// 根据设置处理数据
	const topUsersData = useMemo(
		() => data?.topUsers.slice(0, topUsersCount),
		[data, topUsersCount],
	);

	const levelData = useMemo(() => {
		if (!data) return undefined;
		if (!mergeHighLevels) return data.levelDistribution;
		// 合并 Lv.12 以上为 Lv.12+
		const merged = new Map<string, number>();
		for (const d of data.levelDistribution) {
			const lvNum = Number.parseInt(d.name.replace("Lv.", ""), 10);
			const key = lvNum >= 12 ? "Lv.12+" : d.name;
			merged.set(key, (merged.get(key) ?? 0) + d.value);
		}
		return [...merged.entries()].map(([name, value]) => ({ name, value }));
	}, [data, mergeHighLevels]);

	const wordCloudData = useMemo(() => {
		if (!data || blockedWords.length === 0) return data?.wordCloud;
		const blocked = new Set(blockedWords);
		return data.wordCloud.filter((d) => !blocked.has(d.name));
	}, [data, blockedWords]);

	return (
		<div>
			<h2 className={styles.heading}>贴吧分析</h2>
			<ForumQueryForm onSubmit={handleSubmit} loading={status === "loading"} />

			{/* 加载进度 */}
			{status === "loading" && (
				<FetchProgress
					phase={phase}
					threadCount={threadCount}
					postsFetched={postsFetched}
				/>
			)}

			{/* 错误 */}
			{error && (
				<Banner variant="critical" title="分析失败" description={error} />
			)}

			{/* 结果 */}
			{data && (
				<>
					{/* 统计概览 */}
					<div className={styles.metaBar}>
						<div className={styles.metaItem}>
							<span className={styles.metaValue}>{data.meta.threadCount}</span>
							<span>帖子</span>
						</div>
						<div className={styles.metaItem}>
							<span className={styles.metaValue}>{data.meta.postCount}</span>
							<span>回复</span>
						</div>
						<div className={styles.metaItem}>
							<span className={styles.metaValue}>{data.meta.uniqueUsers}</span>
							<span>用户</span>
						</div>
					</div>

					{/* 图表网格 */}
					<div className={styles.chartGrid}>
						{panels.ipMap && (
							<ChartModule
								title="IP 属地分布"
								description={<IpDescription data={data.ipDistribution} />}
								chartRef={ipMapRef}
								name="IP属地分布"
								overlay
							>
								<IpMapChart
									ref={ipMapRef}
									data={data.ipDistribution}
									style={{ height: "473px" }}
								/>
							</ChartModule>
						)}

						{panels.topUsers && topUsersData && (
							<ChartModule
								title={`活跃用户 Top ${topUsersCount}`}
								chartRef={usersRef}
								name="活跃用户排行"
							>
								<TopUsersChart
									ref={usersRef}
									data={topUsersData}
									style={{ height: "400px" }}
								/>
							</ChartModule>
						)}

						{panels.threadHeat && (
							<ChartModule
								title="帖子热度分布"
								description="x=浏览数 y=回复数 大小=点赞数"
								chartRef={heatRef}
								name="帖子热度分布"
							>
								<ThreadHeatChart
									ref={heatRef}
									data={data.threadHeat}
									style={{ height: "300px" }}
								/>
							</ChartModule>
						)}

						{panels.wordCloud && wordCloudData && (
							<ChartModule
								title="高频词云"
								chartRef={wordCloudRef}
								name="高频词云"
							>
								<WordCloudChart
									ref={wordCloudRef}
									data={wordCloudData}
									style={{ height: "300px" }}
								/>
							</ChartModule>
						)}

						{panels.levelChart && levelData && (
							<ChartModule
								title="用户等级分布"
								chartRef={levelRef}
								name="用户等级分布"
							>
								<LevelChart
									ref={levelRef}
									data={levelData}
									style={{ height: "300px" }}
								/>
							</ChartModule>
						)}

						{panels.timeScatter && (
							<ChartModule
								title="发帖时间分布"
								chartRef={timeRef}
								name="发帖时间分布"
							>
								<TimeScatterChart
									ref={timeRef}
									data={data.timeDistribution}
									style={{ height: "300px" }}
								/>
							</ChartModule>
						)}
					</div>
				</>
			)}

			{/* IP 变动用户列表 */}
			{data && panels.ipChanged && (
				<IpChangedUsersTable users={data.ipChangedUsers} />
			)}
		</div>
	);
}

export const Route = createFileRoute("/forumpost")({
	validateSearch: zodSearchValidator({ schema: forumPostSearchSchema }),
	component: ForumPostPage,
});
