import { LinkExternalIcon, XIcon } from "@primer/octicons-react";
import { Button, Spinner } from "@primer/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../lib/api-client.ts";
import type {
	AnalysisRequest,
	AnalysisUtterance,
	CrossTypeUser,
} from "./analysis-types.ts";
import { readJson } from "./analysis-types.ts";
import styles from "./DbAnalyze.module.css";

function HighlightedText({
	text,
	keywords,
}: {
	text: string;
	keywords: string[];
}) {
	if (keywords.length === 0) return <>{text || "（无内容）"}</>;
	const escaped = keywords
		.filter(Boolean)
		.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	if (escaped.length === 0) return <>{text || "（无内容）"}</>;
	const re = new RegExp(`(${escaped.join("|")})`, "gi");
	let cursor = 0;
	return (
		<>
			{(text || "（无内容）").split(re).map((part) => {
				const key = `${cursor}-${part}`;
				cursor += part.length;
				return keywords.some(
					(keyword) => keyword.toLocaleLowerCase() === part.toLocaleLowerCase(),
				) ? (
					<mark key={key}>{part}</mark>
				) : (
					<span key={key}>{part}</span>
				);
			})}
		</>
	);
}

function postUrl(post: AnalysisUtterance) {
	if (post.kind === "thread")
		return `https://tieba.baidu.com/p/${post.threadId}`;
	return `https://tieba.baidu.com/p/${post.threadId}?pid=${post.id}#${post.id}`;
}

function formatTime(value: string | null) {
	return value ? new Date(value).toLocaleString("zh-CN") : "时间未知";
}

export function AnalysisUtterancesDrawer({
	user,
	request,
	onClose,
}: {
	user: CrossTypeUser;
	request: AnalysisRequest;
	onClose: () => void;
}) {

	const contentDom = useState(()=> document.querySelector('div.appContent'))[0] ?? document.body

	useEffect(() => {
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previous;
		};
	}, []);

	const query = useInfiniteQuery({
		queryKey: [
			"db-analyze",
			"cross-type-utterances",
			request,
			user.authorId,
		] as const,
		queryFn: async ({ pageParam }) =>
			api["db-analyze"]["cross-type-analysis"].utterances
				.$post({
					json: {
						...request,
						keywords: [],
						authorId: user.authorId,
						page: pageParam,
						limit: 50,
					},
				})
				.then((response) =>
					readJson<{ total: number; posts: AnalysisUtterance[] }>(response),
				),
		initialPageParam: 1,
		getNextPageParam: (last, pages) => {
			const loaded = pages.reduce((sum, page) => sum + page.posts.length, 0);
			return loaded < last.total ? pages.length + 1 : undefined;
		},
	});

	const posts = useMemo(
		() => query.data?.pages.flatMap((page) => page.posts) ?? [],
		[query.data],
	);
	const total = query.data?.pages[0]?.total ?? 0;
	const displayName = user.nameShow || user.name || user.authorId;

	if (typeof document === "undefined") return null;

	return createPortal(
		<div className={styles.drawerOverlay}>
			<button
				type="button"
				className={styles.overlayDismiss}
				aria-label="关闭发言详情"
				onClick={onClose}
			/>
			<div className={styles.drawerPanel} role="dialog" aria-modal="true">
				<div className={styles.drawerHeader}>
					<div>
						<div className={styles.drawerTitle}>{displayName} 的全部发言</div>
						<small className={styles.drawerSubtitle}>
							共 {total.toLocaleString()} 条
						</small>
					</div>
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
					{query.isPending ? (
						<div className={styles.centerLoading}>
							<Spinner />
						</div>
					) : query.error ? (
						<p className={styles.modalError}>{query.error.message}</p>
					) : posts.length === 0 ? (
						<p className={styles.emptyHint}>没有匹配的发言。</p>
					) : (
						<>
							{posts.map((post) => (
								<article
									key={`${post.kind}-${post.id}`}
									className={styles.postCard}
								>
									<div className={styles.postMeta}>
										<span
											className={`${styles.postBadge} ${post.kind === "subpost" ? styles.badgeSubpost : styles.badgePost}`}
										>
											{post.kind === "thread"
												? "主帖"
												: post.kind === "post"
													? "回复"
													: "楼中楼"}
										</span>
										<span className={styles.postForum}>
											{post.forumName ?? post.forumId}
										</span>
										{post.threadTitle && (
											<span className={styles.postThread}>
												·{" "}
												<HighlightedText
													text={post.threadTitle}
													keywords={request.keywords}
												/>
											</span>
										)}
									</div>
									<div className={styles.postContent}>
										<HighlightedText
											text={post.content}
											keywords={request.keywords}
										/>
									</div>
									<div className={styles.postFooter}>
										<span>{formatTime(post.createTime)}</span>
										{post.floor > 0 && <span>第 {post.floor} 楼</span>}
										{post.agreeNum > 0 && <span>👍 {post.agreeNum}</span>}
										<a href={postUrl(post)} target="_blank" rel="noreferrer">
											查看原帖 <LinkExternalIcon size={12} />
										</a>
									</div>
								</article>
							))}
							{query.hasNextPage && (
								<div className={styles.loadMore}>
									<Button
										disabled={query.isFetchingNextPage}
										onClick={() => query.fetchNextPage()}
									>
										{query.isFetchingNextPage ? (
											<Spinner size="small" />
										) : (
											`加载更多（${posts.length} / ${total}）`
										)}
									</Button>
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</div>,
		contentDom,
	);
}
