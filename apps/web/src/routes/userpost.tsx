import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { Banner, Button, Label, Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import {
	ArrowRightIcon,
	ChevronLeftIcon,
	LinkExternalIcon,
	NoteIcon,
} from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { QueryForm } from "../components/QueryForm.tsx";
import {
	applyColoredHighlights,
	clearColoredHighlights,
} from "../lib/highlight.ts";
import { userPostsOptions } from "../hooks/queries.ts";
import { userPostSearchSchema } from "../lib/search-schemas.ts";
import { useSettingsStore } from "../lib/settings-store.ts";
import styles from "./page.module.css";

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
	dateStyle: "short",
	timeStyle: "short",
});

function UserPostPage() {
	const { method, id, page } = Route.useSearch();
	const navigate = useNavigate();
	const [isPending, startTransition] = useTransition();
	const [isInfoBannerShown, setIsInfoBannerShown] = useState(true);
	const { data, isLoading, error } = useQuery(
		userPostsOptions(method, id, page),
	);

	const posts = data ?? [];
	const listRef = useRef<HTMLDivElement>(null);
	const prevPageRef = useRef(page);

	// 标记高亮设置
	const highlightedForums = useSettingsStore((s) => s.highlightedForums);
	const highlightedUsers = useSettingsStore((s) => s.highlightedUsers);
	const highlightedKeywords = useSettingsStore((s) => s.highlightedKeywords);
	const openSettings = useSettingsStore((s) => s.openSettings);
	const setSettingsTab = useSettingsStore((s) => s.setSettingsTab);
	const forumMap = new Map(highlightedForums.map((f) => [f.name, f.color]));
	const userMap = new Map(highlightedUsers.map((u) => [u.name, u.color]));
	const hasQuery = !!id;

	const goToPage = (p: number) =>
		startTransition(() => {
			navigate({ to: "/userpost", search: { method, id, page: p } });
		});

	const openUserPostSettings = () => {
		setSettingsTab("userpost");
		openSettings();
	};

	// 翻页后自动滚动：如果列表底部在视口底部附近，滚回列表顶部
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (prevPageRef.current === page) return;
		prevPageRef.current = page;
		const el = listRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		// 如果列表顶部已在视口上方（已滚过列表顶部）
		if (rect.top < 0) {
			el.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	}, [page, data]);

	// 关键词高亮（CSS Custom Highlight API — 多色）
	const runKeywordHighlight = useCallback(() => {
		applyColoredHighlights(
			"keyword-highlight",
			listRef.current,
			highlightedKeywords.map((k) => ({ term: k.keyword, color: k.color })),
		);
	}, [highlightedKeywords]);

	useEffect(() => {
		runKeywordHighlight();
		return () => clearColoredHighlights("keyword-highlight");
	}, [runKeywordHighlight, data]);

	return (
		<div>
			<h2 className={styles.heading}>用户帖子</h2>
			<QueryForm />

			{!hasQuery && isInfoBannerShown && (
				<Banner
					className={styles.infoBanner}
					aria-label="Userpost hint"
					variant="info"
					title="使用提示"
					description={
						<span>
							可在设置{" > "}
							用户帖子中配置高亮规则：遇到指定贴吧、回复特定人物，或发言包含特定关键词时自动高亮。
							{/** biome-ignore lint/a11y/useValidAnchor: <explanation> */}
							<a
								href="#open-userpost-settings"
								onClick={(e) => {
									e.preventDefault();
									openUserPostSettings();
								}}
							>
								打开设置
							</a>
							<br />
							输入框可直接识别百度贴吧的分享链接
						</span>
					}
					onDismiss={() => {
						setIsInfoBannerShown(false);
					}}
				/>
			)}

			{/* 仅首次加载显示 Spinner */}
			{!data && isLoading && (
				<div className={styles.center}>
					<Spinner size="large" />
				</div>
			)}

			{error && (
				<Banner
					variant="critical"
					title="查询失败"
					description={error instanceof Error ? error.message : String(error)}
				/>
			)}

			{data && posts.length === 0 && (
				<Blankslate border>
					<Blankslate.Visual>
						<NoteIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>暂无帖子数据</Blankslate.Heading>
					<Blankslate.Description>
						该用户还没有发布过帖子
					</Blankslate.Description>
				</Blankslate>
			)}

			{posts.length > 0 && (
				<div
					ref={listRef}
					className={styles.postList}
					data-pending={isPending || undefined}
				>
					{posts.map((post, i) => {
						const threadUrl = `https://tieba.baidu.com/p/${post.threadId}?fid=${post.forumId}&pid=${post.postId}&cid=${post.cid}#${post.postId}`;
						const forumUrl = `https://tieba.baidu.com/f?kw=${encodeURIComponent(post.forumName)}`;
						const time = post.createTime
							? dateFormat.format(new Date(post.createTime * 1000))
							: "";
						// 贴吧标记优先，其次用户标记
						const highlightColor =
							forumMap.get(post.forumName) ??
							(post.replyTo ? userMap.get(post.replyTo) : undefined);

						return (
							<div
								key={`${post.threadId}-${post.cid}-${i}`}
								className={styles.postItem}
								data-highlight-color={highlightColor}
							>
								<div className={styles.postHeader}>
									<a
										href={threadUrl}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.postTitleLink}
									>
										<h4 className={styles.postTitle}>
											{post.title || "无标题"}
										</h4>
									</a>
								</div>
								{post.content && (
									<p className={styles.postContent}>
										{post.replyTo && (
											<span className={styles.postReplyTo}>
												回复 {post.replyTo}：
											</span>
										)}
										{post.content}
									</p>
								)}
								<div className={styles.postFooter}>
									{time && <span className={styles.postTime}>{time}</span>}
									{post.forumName && (
										<a
											href={forumUrl}
											target="_blank"
											rel="noopener noreferrer"
											className={styles.postForumLink}
										>
											<Label variant="accent">{post.forumName}吧</Label>
										</a>
									)}
									{post.affiliated && <Label variant="attention">楼中楼</Label>}
									<a
										href={threadUrl}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.postLink}
									>
										<LinkExternalIcon size={12} />
										<span>查看原帖</span>
									</a>
								</div>
							</div>
						);
					})}
				</div>
			)}

			{data && (
				<>
					{posts.length < 28 && (
						<p className={styles.paginationHint}>
							本页仅 {posts.length} 条，可能没有下一页了。
						</p>
					)}
					<div className={styles.paginationWrap}>
						<Button
							variant="invisible"
							leadingVisual={ChevronLeftIcon}
							disabled={page <= 1}
							onClick={() => goToPage(page - 1)}
						>
							上一页
						</Button>
						<span>第 {page} 页</span>
						<Button
							variant="invisible"
							trailingVisual={ArrowRightIcon}
							disabled={posts.length < 29}
							onClick={() => goToPage(page + 1)}
						>
							下一页
						</Button>
					</div>
				</>
			)}
		</div>
	);
}

export const Route = createFileRoute("/userpost")({
	validateSearch: zodSearchValidator({ schema: userPostSearchSchema }),
	loaderDeps: ({ search }) => ({
		method: search.method,
		id: search.id,
		page: search.page,
	}),
	loader: ({ context: { queryClient }, deps: { method, id, page } }) => {
		if (method && id) {
			void queryClient.prefetchQuery(userPostsOptions(method, id, page));
		}
	},
	component: UserPostPage,
});
