import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { Banner, Spinner } from "@primer/react";
import { api } from "../../lib/api-client.ts";
import { useDbAnalyzeCrossForums, unwrap } from "../../hooks/queries.ts";
import { ForumTagsPanel } from "../../components/DbAnalyze/ForumTagsPanel.tsx";
import {
	IntersectionTable,
	type IntersectionUser,
} from "../../components/DbAnalyze/IntersectionTable.tsx";
import { UserPostsDrawer } from "../../components/DbAnalyze/UserPostsDrawer.tsx";
import { DeleteUserModal } from "../../components/DbAnalyze/DeleteUserModal.tsx";
import moduleStyles from "../../components/ForumPostAnalysis/ForumPostAnalysis.module.css";

// ── 工具 ──

function useDebounced<T>(value: T, delay: number): T {
	const [debounced, setDebounced] = useState(value);
	useEffect(() => {
		const t = setTimeout(() => setDebounced(value), delay);
		return () => clearTimeout(t);
	}, [value, delay]);
	return debounced;
}

// ── 查询 ──

const PAGE_LIMIT = 50;

function useIntersection(forumIds: string[]) {
	const key = forumIds.join(",");
	return useInfiniteQuery({
		queryKey: ["db-analyze", "intersection", key] as const,
		enabled: forumIds.length > 0,
		queryFn: async ({ pageParam }) => {
			const res = await api["db-analyze"].intersection.$get({
				query: {
					forums: key,
					page: String(pageParam),
					limit: String(PAGE_LIMIT),
				},
			});
			return unwrap(res);
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

function ExplorePage() {
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [drawerUser, setDrawerUser] = useState<IntersectionUser | null>(null);
	const [deletingUser, setDeletingUser] = useState<IntersectionUser | null>(null);

	const forumsQuery = useDbAnalyzeCrossForums();
	const forums = forumsQuery.data?.forums ?? [];

	const selectedForumIds = useMemo(
		() => Array.from(selectedIds),
		[selectedIds],
	);

	const selectedForums = useMemo(
		() => forums.filter((f) => selectedIds.has(f.id)),
		[forums, selectedIds],
	);

	const toggleForum = useCallback((id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}, []);

	const intersectionQuery = useIntersection(selectedForumIds);

	// 重叠用户数：debounce 400ms 避免频繁请求
	const debouncedKey = useDebounced(selectedForumIds.join(","), 400);
	const overlapQuery = useQuery({
		queryKey: ["db-analyze", "forum-overlap", debouncedKey] as const,
		enabled: debouncedKey.length > 0,
		queryFn: async () => {
			const res = await api["db-analyze"]["forum-overlap"].$get({
				query: { forums: debouncedKey },
			});
			return unwrap(res);
		},
		staleTime: 5 * 60 * 1000,
		placeholderData: (prev) => prev,
	});

	const overlapCounts = useMemo(() => {
		if (!overlapQuery.data || selectedIds.size === 0) return undefined;
		const map = new Map<string, number>();
		for (const o of overlapQuery.data.overlaps) {
			map.set(o.id, o.overlapCount);
		}
		return map;
	}, [overlapQuery.data, selectedIds.size]);

	const allUsers = useMemo(
		() => intersectionQuery.data?.pages.flatMap((p) => p.users) ?? [],
		[intersectionQuery.data],
	);

	const forumNameMap = useMemo(() => {
		const m = new Map<string, string>();
		for (const f of forums) {
			if (f.name) m.set(f.id, f.name);
		}
		return m;
	}, [forums]);

	const total = intersectionQuery.data?.pages[0]?.total ?? 0;

	return (
		<div>
			{/* 吧选择器 */}
			<div className={moduleStyles.chartModule}>
				<div className={moduleStyles.chartModuleHeader}>
					<div>
						<h3 className={moduleStyles.chartTitle}>选择目标吧</h3>
						<p className={moduleStyles.chartDescription}>
							选中多个吧后，下方显示同时在这些吧发言过的用户
							{selectedIds.size > 0 && (
								<>
									{" "}
									（已选 <strong>{selectedIds.size}</strong> 个）
								</>
							)}
						</p>
					</div>
					{selectedIds.size > 0 && (
						<button
							type="button"
							style={{
								background: "none",
								border: "none",
								cursor: "pointer",
								fontSize: "0.8125rem",
								color: "var(--fgColor-muted)",
							}}
							onClick={() => setSelectedIds(new Set())}
						>
							清空选择
						</button>
					)}
				</div>

				{forumsQuery.error ? (
					<Banner
						variant="critical"
						title="加载吧列表失败"
						description={forumsQuery.error.message}
					/>
				) : (
					<ForumTagsPanel
						forums={forums}
						selectedIds={selectedIds}
						loading={forumsQuery.isPending}
						overlapCounts={overlapCounts}
						overlapLoading={overlapQuery.isFetching}
						onToggle={toggleForum}
					/>
				)}
			</div>

			{/* 交集用户列表 */}
			{selectedIds.size > 0 && (
				<div
					className={moduleStyles.chartModule}
					style={{ marginTop: "1.5rem" }}
				>
					<div className={moduleStyles.chartModuleHeader}>
						<div>
							<h3 className={moduleStyles.chartTitle}>交集用户</h3>
							<p className={moduleStyles.chartDescription}>
								{selectedIds.size === 1
									? "在选中吧发言过的用户"
									: <>同时在 <strong>{selectedIds.size}</strong> 个吧发言过的用户</>}
								，共{" "}
								{intersectionQuery.isPending ? "—" : total.toLocaleString()}{" "}
								人，按总发言量降序
							</p>
						</div>
					</div>

					{intersectionQuery.isPending ? (
						<div
							style={{
								display: "flex",
								justifyContent: "center",
								padding: "2rem",
							}}
						>
							<Spinner />
						</div>
					) : intersectionQuery.error ? (
						<Banner
							variant="critical"
							title="加载失败"
							description={intersectionQuery.error.message}
						/>
					) : (
						<IntersectionTable
							users={allUsers}
							selectedForums={selectedForums}
							forumNameMap={forumNameMap}
							total={total}
							hasNextPage={intersectionQuery.hasNextPage}
							loading={intersectionQuery.isFetchingNextPage}
							onLoadMore={() => intersectionQuery.fetchNextPage()}
							onViewPosts={setDrawerUser}
							onDeleteUser={setDeletingUser}
						/>
					)}
				</div>
			)}

			{/* 用户发言抽屉 */}
			{drawerUser && (
				<UserPostsDrawer
					user={drawerUser}
					selectedForums={selectedForums}
					onClose={() => setDrawerUser(null)}
				/>
			)}

			{/* 删除确认弹窗 */}
			<DeleteUserModal
				authorId={deletingUser?.authorId ?? null}
				displayName={
					deletingUser
						? (deletingUser.nameShow ?? deletingUser.name ?? deletingUser.authorId)
						: ""
				}
				onClose={() => setDeletingUser(null)}
			/>
		</div>
	);
}

export const Route = createFileRoute("/dbanalyze/explore")({
	component: ExplorePage,
});
