import {
	ArrowRightIcon,
	ChevronLeftIcon,
	LinkExternalIcon,
	NoteIcon,
} from "@primer/octicons-react";
import {
	Avatar,
	Banner,
	Button,
	FormControl,
	Spinner,
	TextInput,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { useEffect, useState } from "react";
import { QueryForm } from "../components/QueryForm.tsx";
import { forumPostsToolOptions } from "../hooks/queries.ts";
import { portraitUrl } from "../lib/portrait.ts";
import { toolsSearchSchema } from "../lib/search-schemas.ts";
import styles from "./tools.module.css";

function ToolsPage() {
	const search = Route.useSearch();
	const navigate = useNavigate();
	const [fname, setFname] = useState(search.fname);
	useEffect(() => setFname(search.fname), [search.fname]);

	const postsQuery = useQuery(
		forumPostsToolOptions(search.method, search.id, search.fname, search.page),
	);

	const submitForum = (event: React.SubmitEvent) => {
		event.preventDefault();
		if (!fname.trim()) return;
		void navigate({
			to: "/tools",
			search: (previous: typeof search) => ({
				...previous,
				fname: fname.trim(),
				page: 1,
			}),
		});
	};

	return (
		<div className={styles.page}>
			<h2 className={styles.heading}>用户发言查询</h2>
			<p className={styles.intro}>
				输入贴吧 UID、用户名或昵称、用户 ID，查询该用户在指定贴吧的楼层回复。
			</p>
			<QueryForm />

			<form className={styles.toolForm} onSubmit={submitForum}>
				<FormControl className={styles.grow}>
					<FormControl.Label>贴吧名</FormControl.Label>
					<TextInput
						block
						value={fname}
						onChange={(event) => setFname(event.target.value)}
						placeholder="例如：原神（不要输入末尾的“吧”字）"
					/>
				</FormControl>
				<Button
					type="submit"
					variant="primary"
					disabled={!search.id || !fname.trim()}
				>
					查询发言
				</Button>
			</form>

			{postsQuery.isLoading && (
				<div className={styles.center}>
					<Spinner size="large" />
				</div>
			)}
			{postsQuery.error && (
				<Banner
					variant="critical"
					title="查询失败"
					description={
						postsQuery.error instanceof Error
							? postsQuery.error.message
							: String(postsQuery.error)
					}
				/>
			)}

			{postsQuery.data?.user && (
				<div className={styles.userSummary}>
					{postsQuery.data.user.portrait && (
						<Avatar
							src={portraitUrl(postsQuery.data.user.portrait)}
							size={48}
							alt={postsQuery.data.user.nickname}
						/>
					)}
					<div>
						<strong>{postsQuery.data.user.nickname || "未知用户"}</strong>
						<p>查询结果已关联到该贴吧用户身份。</p>
					</div>
				</div>
			)}

			{postsQuery.data && postsQuery.data.posts.length === 0 && (
				<Blankslate border>
					<Blankslate.Visual>
						<NoteIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>未找到吧内发言</Blankslate.Heading>
					<Blankslate.Description>
						该用户可能未在此吧回复，或匹配记录超出了本次扫描范围。
					</Blankslate.Description>
				</Blankslate>
			)}

			{postsQuery.data && postsQuery.data.posts.length > 0 && (
				<div className={styles.postList}>
					{postsQuery.data.posts.map((post) => (
						<article className={styles.postItem} key={post.href}>
							<a href={post.href} target="_blank" rel="noopener noreferrer">
								<h3>{post.title || "无标题"}</h3>
							</a>
							<p>{post.content || "（无文本内容）"}</p>
							<a
								className={styles.externalLink}
								href={post.href}
								target="_blank"
								rel="noopener noreferrer"
							>
								<LinkExternalIcon size={14} /> 查看原帖
							</a>
						</article>
					))}
				</div>
			)}

			{postsQuery.data && (
				<div className={styles.pagination}>
					<Button
						leadingVisual={ChevronLeftIcon}
						disabled={search.page <= 1}
						onClick={() =>
							void navigate({
								to: "/tools",
								search: (previous: typeof search) => ({
									...previous,
									page: search.page - 1,
								}),
							})
						}
					>
						上一页
					</Button>
					<span>第 {search.page} 页</span>
					<Button
						trailingVisual={ArrowRightIcon}
						disabled={postsQuery.data.hasNext === 0}
						onClick={() =>
							void navigate({
								to: "/tools",
								search: (previous: typeof search) => ({
									...previous,
									page: search.page + 1,
								}),
							})
						}
					>
						下一页
					</Button>
				</div>
			)}

			<footer className={styles.notice}>
				数据来自百度公开接口，仅供学习研究，请勿用于骚扰、人肉或批量采集。
			</footer>
		</div>
	);
}

export const Route = createFileRoute("/tools")({
	validateSearch: zodSearchValidator({ schema: toolsSearchSchema }),
	component: ToolsPage,
});
