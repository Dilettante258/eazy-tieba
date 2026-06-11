import { createFileRoute } from "@tanstack/react-router";
import { Banner, Spinner, SegmentedControl } from "@primer/react";
import { useMemo, useRef, useState } from "react";
import { useQuery, useInfiniteQuery, queryOptions } from "@tanstack/react-query";
import { api } from "../../lib/api-client.ts";
import { useVChartThemeSync } from "../../lib/vchart-theme.ts";
import { StatCard } from "../../components/DbAnalyze/StatCard.tsx";
import { DistChart } from "../../components/DbAnalyze/DistChart.tsx";
import { TopUsersTable } from "../../components/DbAnalyze/TopUsersTable.tsx";
import type { ChartWrapperHandle } from "../../components/PostAnalysis/ChartWrapper.tsx";
import moduleStyles from "../../components/ForumPostAnalysis/ForumPostAnalysis.module.css";
import styles from "../dbanalyze.module.css";

// ── 查询 ──

const statsOptions = queryOptions({
	queryKey: ["db-analyze", "stats"] as const,
	queryFn: async () => {
		const res = await api["db-analyze"].stats.$get({ query: {} });
		if (!res.ok) throw new Error(`请求失败 (${res.status})`);
		return res.json();
	},
	staleTime: 5 * 60 * 1000,
});

const PAGE_LIMIT = 50;

function useTopUsers(minForums: number) {
	return useInfiniteQuery({
		queryKey: ["db-analyze", "top-users", minForums] as const,
		queryFn: async ({ pageParam }) => {
			const res = await api["db-analyze"]["top-users"].$get({
				query: {
					minForums: String(minForums),
					page: String(pageParam),
					limit: String(PAGE_LIMIT),
				},
			});
			if (!res.ok) throw new Error(`请求失败 (${res.status})`);
			return res.json();
		},
		initialPageParam: 1,
		getNextPageParam: (lastPage, allPages) => {
			const loaded = allPages.reduce((s, p) => s + p.users.length, 0);
			return loaded < lastPage.total ? allPages.length + 1 : undefined;
		},
		staleTime: 5 * 60 * 1000,
	});
}

// ── 页面 ──

const MIN_FORUMS_OPTIONS = [2, 3, 5, 10] as const;

function DbAnalyzeStats() {
	useVChartThemeSync();
	const chartRef = useRef<ChartWrapperHandle>(null);
	const [minForums, setMinForums] =
		useState<(typeof MIN_FORUMS_OPTIONS)[number]>(2);

	const statsQuery = useQuery(statsOptions);
	const usersQuery = useTopUsers(minForums);

	const allUsers = useMemo(
		() => usersQuery.data?.pages.flatMap((p) => p.users) ?? [],
		[usersQuery.data],
	);

	const total = usersQuery.data?.pages[0]?.total ?? 0;

	return (
		<div>
			{/* 统计卡片 */}
			{statsQuery.isPending && (
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "0.5rem",
						marginBottom: "1rem",
					}}
				>
					<Spinner size="small" />
					<span style={{ color: "var(--fgColor-muted)", fontSize: "0.875rem" }}>
						加载统计数据…
					</span>
				</div>
			)}
			{statsQuery.error && (
				<Banner
					variant="critical"
					title="加载失败"
					description={statsQuery.error.message}
				/>
			)}
			{statsQuery.data && (
				<div className={styles.statsRow}>
					<StatCard
						label="总发言用户数"
						value={statsQuery.data.totalActiveUsers.toLocaleString()}
					/>
					<StatCard
						label="跨吧发言用户（≥2个吧）"
						value={statsQuery.data.crossForumUsers.toLocaleString()}
					/>
					<StatCard
						label="跨吧用户占比"
						value={`${statsQuery.data.crossForumPercent}%`}
					/>
				</div>
			)}

			{/* 分布图 */}
			{statsQuery.data && (
				<div
					className={moduleStyles.chartModule}
					style={{ marginTop: "1.5rem" }}
				>
					<div className={moduleStyles.chartModuleHeader}>
						<div>
							<h3 className={moduleStyles.chartTitle}>用户发言吧数分布</h3>
							<p className={moduleStyles.chartDescription}>
								横轴：发言覆盖的吧数；纵轴：对应用户数
							</p>
						</div>
					</div>
					<DistChart
						ref={chartRef}
						data={statsQuery.data.distribution}
						style={{ height: "300px" }}
					/>
				</div>
			)}

			{/* 跨吧用户表格 */}
			<div
				className={moduleStyles.chartModule}
				style={{ marginTop: "1.5rem" }}
			>
				<div className={moduleStyles.chartModuleHeader}>
					<div>
						<h3 className={moduleStyles.chartTitle}>跨吧用户排行</h3>
						<p className={moduleStyles.chartDescription}>
							按发言吧数降序，共{" "}
							{total > 0 ? total.toLocaleString() : "—"} 人
						</p>
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
						<span
							style={{ fontSize: "0.8125rem", color: "var(--fgColor-muted)" }}
						>
							最少吧数
						</span>
						<SegmentedControl
							size="small"
							onChange={(i) => setMinForums(MIN_FORUMS_OPTIONS[i])}
						>
							{MIN_FORUMS_OPTIONS.map((n) => (
								<SegmentedControl.Button key={n} selected={minForums === n}>
									{`${n}+`}
								</SegmentedControl.Button>
							))}
						</SegmentedControl>
					</div>
				</div>

				{usersQuery.isPending ? (
					<div
						style={{
							display: "flex",
							justifyContent: "center",
							padding: "2rem",
						}}
					>
						<Spinner />
					</div>
				) : usersQuery.error ? (
					<Banner
						variant="critical"
						title="加载失败"
						description={usersQuery.error.message}
					/>
				) : (
					<TopUsersTable
						users={allUsers}
						total={total}
						hasNextPage={usersQuery.hasNextPage}
						loading={usersQuery.isFetchingNextPage}
						onLoadMore={() => usersQuery.fetchNextPage()}
					/>
				)}
			</div>
		</div>
	);
}

export const Route = createFileRoute("/dbanalyze/")({
	component: DbAnalyzeStats,
});
