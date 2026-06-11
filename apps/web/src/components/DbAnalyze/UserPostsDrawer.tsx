import { useState, useMemo, useEffect } from "react";
import { Button, Spinner } from "@primer/react";
import { XIcon } from "@primer/octicons-react";
import { useDbAnalyzeUserPostsInfinite } from "../../hooks/queries.ts";
import type { CrossForum } from "./ForumTagsPanel.tsx";
import type { IntersectionUser } from "./IntersectionTable.tsx";
import styles from "./DbAnalyze.module.css";

interface Post {
	id: string;
	type: "post" | "subpost";
	forumId: string;
	forumName: string | null;
	threadId: string;
	threadTitle: string | null;
	content: string | null;
	createTime: string;
	floor: number;
	agreeNum: number;
	ipAddress: string | null;
}

function formatTime(t: string | null) {
	if (!t) return "—";
	try {
		return new Date(t).toLocaleString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	} catch {
		return t;
	}
}

function PostCard({ post }: { post: Post }) {
	return (
		<div className={styles.postCard}>
			<div className={styles.postMeta}>
				<span
					className={`${styles.postBadge} ${
						post.type === "post" ? styles.badgePost : styles.badgeSubpost
					}`}
				>
					{post.type === "post" ? "主帖" : "楼中楼"}
				</span>
				<span className={styles.postForum}>{post.forumName ?? post.forumId}</span>
				{post.threadTitle && (
					<span className={styles.postThread} title={post.threadTitle}>
						· {post.threadTitle}
					</span>
				)}
			</div>
			<div className={styles.postContent}>{post.content || "（无内容）"}</div>
			<div className={styles.postFooter}>
				<span>{formatTime(post.createTime)}</span>
				{post.type === "post" && post.floor > 0 && (
					<span>第 {post.floor} 楼</span>
				)}
				{post.agreeNum > 0 && <span>👍 {post.agreeNum}</span>}
				{post.ipAddress && (
					<span>IP: {post.ipAddress}</span>
				)}
			</div>
		</div>
	);
}

interface UserPostsDrawerProps {
	user: IntersectionUser;
	selectedForums: CrossForum[];
	onClose: () => void;
}

export function UserPostsDrawer({
	user,
	selectedForums,
	onClose,
}: UserPostsDrawerProps) {
	useEffect(() => {
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = prev;
		};
	}, []);

	const [activeForumId, setActiveForumId] = useState<string | null>(null);

	const postsQuery = useDbAnalyzeUserPostsInfinite(
		user.authorId,
		activeForumId ?? undefined,
	);

	const allPosts = useMemo(
		() => postsQuery.data?.pages.flatMap((p) => p.posts) ?? [],
		[postsQuery.data],
	);

	const total = postsQuery.data?.pages[0]?.total ?? 0;

	const displayName =
		user.nameShow || user.name || user.authorId;

	return (
		<div className={styles.drawerOverlay} onClick={onClose}>
			<div className={styles.drawerPanel} onClick={(e) => e.stopPropagation()}>
				<div className={styles.drawerHeader}>
					<span className={styles.drawerTitle}>
						{displayName} 的发言记录
					</span>
					<Button
						aria-label="关闭"
						variant="invisible"
						size="small"
						onClick={onClose}
					>
						<XIcon />
					</Button>
				</div>

				<div className={styles.drawerBody}>
					{/* 吧过滤器 */}
					{selectedForums.length > 1 && (
						<div className={styles.forumFilter}>
							<button
								type="button"
								className={`${styles.filterChip} ${activeForumId === null ? styles.filterChipActive : ""}`}
								onClick={() => setActiveForumId(null)}
							>
								全部
							</button>
							{selectedForums.map((f) => (
								<button
									key={f.id}
									type="button"
									className={`${styles.filterChip} ${activeForumId === f.id ? styles.filterChipActive : ""}`}
									onClick={() =>
										setActiveForumId(activeForumId === f.id ? null : f.id)
									}
								>
									{f.name ?? f.id}
									<span style={{ opacity: 0.7, marginLeft: "0.25rem" }}>
										{user.forumPosts[f.id] ?? 0}
									</span>
								</button>
							))}
						</div>
					)}

					{/* 总数提示 */}
					{!postsQuery.isPending && (
						<p
							style={{
								fontSize: "0.8125rem",
								color: "var(--fgColor-muted)",
								marginBottom: "0.75rem",
							}}
						>
							共 {total.toLocaleString()} 条发言
						</p>
					)}

					{/* 发言列表 */}
					{postsQuery.isPending ? (
						<div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
							<Spinner />
						</div>
					) : postsQuery.isError ? (
						<div style={{ color: "var(--fgColor-danger)", fontSize: "0.875rem" }}>
							加载失败：{postsQuery.error.message}
						</div>
					) : (
						<>
							{allPosts.map((p) => (
								<PostCard key={`${p.type}-${p.id}`} post={p as Post} />
							))}

							{postsQuery.hasNextPage && (
								<div style={{ textAlign: "center", marginTop: "0.75rem" }}>
									<Button
										variant="default"
										size="small"
										onClick={() => postsQuery.fetchNextPage()}
										disabled={postsQuery.isFetchingNextPage}
									>
										{postsQuery.isFetchingNextPage ? (
											<Spinner size="small" />
										) : (
											`加载更多（已显示 ${allPosts.length} / ${total}）`
										)}
									</Button>
								</div>
							)}

							{allPosts.length === 0 && (
								<div
									style={{
										padding: "2rem",
										textAlign: "center",
										color: "var(--fgColor-muted)",
										fontSize: "0.875rem",
									}}
								>
									暂无发言记录
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
