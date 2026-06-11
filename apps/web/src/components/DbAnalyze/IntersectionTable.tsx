import { useRouter } from "@tanstack/react-router";
import { Button, Spinner } from "@primer/react";
import { PersonIcon, GraphIcon, TrashIcon } from "@primer/octicons-react";
import type { CrossForum } from "./ForumTagsPanel.tsx";
import styles from "./DbAnalyze.module.css";

export interface IntersectionUser {
	authorId: string;
	name: string | null;
	nameShow: string | null;
	totalPosts: number;
	forumPosts: Record<string, number>;
	allForumIds: string[];
}

interface IntersectionTableProps {
	users: IntersectionUser[];
	selectedForums: CrossForum[];
	/** 全量吧名映射，用于展示非选中吧的名称 */
	forumNameMap: Map<string, string>;
	total: number;
	hasNextPage: boolean;
	loading: boolean;
	onLoadMore: () => void;
	onViewPosts: (user: IntersectionUser) => void;
	onDeleteUser?: (user: IntersectionUser) => void;
}

export function IntersectionTable({
	users,
	selectedForums,
	forumNameMap,
	total,
	hasNextPage,
	loading,
	onLoadMore,
	onViewPosts,
	onDeleteUser,
}: IntersectionTableProps) {
	const router = useRouter();

	return (
		<div>
			<table className={styles.intersectionTable}>
				<thead>
					<tr>
						<th>#</th>
						<th>用户</th>
						<th>总发言</th>
						<th>操作</th>
					</tr>
				</thead>
				<tbody>
					{users.map((u, i) => {
						const selectedSet = new Set(selectedForums.map((f) => f.id));
						const activeForums = selectedForums.filter(
							(f) => (u.forumPosts[f.id] ?? 0) > 0,
						);
						// 其他活跃吧：不在选中列表里但用户也发言过的
						const otherForumIds = u.allForumIds.filter((id) => !selectedSet.has(id));
						return (
							<tr key={u.authorId}>
								<td
									style={{
										color: "var(--fgColor-muted)",
										fontSize: "0.75rem",
									}}
								>
									{i + 1}
								</td>
								<td>
									<div style={{ fontWeight: 500 }}>
										{u.nameShow || u.name || "—"}
									</div>
									<div
										style={{
											color: "var(--fgColor-muted)",
											fontSize: "0.6875rem",
										}}
									>
										{u.authorId}
									</div>
									{(activeForums.length > 0 || otherForumIds.length > 0) && (
										<div className={styles.activeForumsList}>
											{activeForums.map((f) => (
												<span key={f.id} className={styles.activeForum}>
													{f.name ?? f.id}
													<span className={styles.activeForumCount}>
														{u.forumPosts[f.id]}
													</span>
												</span>
											))}
											{otherForumIds.map((id) => (
												<span key={id} className={styles.otherForum}>
													{forumNameMap.get(id) ?? id}
												</span>
											))}
										</div>
									)}
								</td>
								<td style={{ textAlign: "right", fontWeight: 600 }}>
									{u.totalPosts.toLocaleString()}
								</td>
								<td>
									<div className={styles.userActions}>
										<Button
											size="small"
											variant="default"
											onClick={() => onViewPosts(u)}
										>
											查看发言
										</Button>
										<Button
											size="small"
											variant="invisible"
											leadingVisual={PersonIcon}
											onClick={() => {
												const href = router.buildLocation({ to: "/userpost", search: { method: "id", id: u.authorId } }).href;
												window.open(href, "_blank");
											}}
										>
											用户帖子
										</Button>
										<Button
											size="small"
											variant="invisible"
											leadingVisual={GraphIcon}
											onClick={() => {
												const href = router.buildLocation({ to: "/postanalysis", search: { method: "id", id: u.authorId } }).href;
												window.open(href, "_blank");
											}}
										>
											发帖分析
										</Button>
										{onDeleteUser && (
											<Button
												size="small"
												variant="invisible"
												leadingVisual={TrashIcon}
												style={{ color: "var(--color-danger-fg, #cf222e)" }}
												onClick={() => onDeleteUser(u)}
											>
												删除
											</Button>
										)}
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>

			{hasNextPage && (
				<div style={{ textAlign: "center", marginTop: "1rem" }}>
					<Button variant="default" onClick={onLoadMore} disabled={loading}>
						{loading ? (
							<Spinner size="small" />
						) : (
							`加载更多（已显示 ${users.length.toLocaleString()} / ${total.toLocaleString()}）`
						)}
					</Button>
				</div>
			)}

			{users.length === 0 && (
				<div
					style={{
						padding: "2rem",
						textAlign: "center",
						color: "var(--fgColor-muted)",
						fontSize: "0.875rem",
					}}
				>
					未找到在选中吧中发过言的用户
				</div>
			)}
		</div>
	);
}
