import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { Banner, Button, Label, Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { LinkExternalIcon, NoteIcon } from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import { QueryForm } from "../components/QueryForm.tsx";
import { userPostsOptions } from "../hooks/queries.ts";
import { userPostSearchSchema } from "../lib/search-schemas.ts";
import styles from "./page.module.css";

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
	dateStyle: "short",
	timeStyle: "short",
});

function UserPostPage() {
	const { method, id, page } = Route.useSearch();
	const navigate = useNavigate();
	const { data, isLoading, error } = useQuery(
		userPostsOptions(method, id, page),
	);

	const posts = data ?? [];

	const goToPage = (p: number) =>
		navigate({ to: "/userpost", search: { method, id, page: p } });

	return (
		<div>
			<h2 className={styles.heading}>用户帖子</h2>
			<QueryForm />

			{isLoading && (
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
				<div className={styles.postList}>
					{posts.map((post, i) => {
						const threadUrl = `https://tieba.baidu.com/p/${post.threadId}?fid=${post.forumId}&pid=${post.postId}&cid=${post.cid}#${post.postId}`;
						const forumUrl = `https://tieba.baidu.com/f?kw=${encodeURIComponent(post.forumName)}`;
						const time = post.createTime
							? dateFormat.format(new Date(post.createTime * 1000))
							: "";

						return (
							<div
								key={`${post.threadId}-${post.cid}-${i}`}
								className={styles.postItem}
							>
								<div className={styles.postHeader}>
									{post.forumName && (
										<a
											href={forumUrl}
											target="_blank"
											rel="noopener noreferrer"
											className={styles.postForumLink}
										>
											<Label variant="accent">
												{post.forumName}吧
											</Label>
										</a>
									)}
									{post.affiliated && (
										<Label variant="attention">楼中楼</Label>
									)}
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
									{time && (
										<span className={styles.postTime}>
											{time}
										</span>
									)}
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
				<div className={styles.paginationWrap}>
					<Button
						disabled={page <= 1}
						onClick={() => goToPage(page - 1)}
					>
						上一页
					</Button>
					<span>第 {page} 页</span>
					<Button
						disabled={posts.length === 0}
						onClick={() => goToPage(page + 1)}
					>
						下一页
					</Button>
				</div>
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
