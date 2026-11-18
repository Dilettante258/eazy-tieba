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
	Label,
	Spinner,
	TextInput,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { useEffect, useState } from "react";
import { QueryForm } from "../components/QueryForm.tsx";
import { recentPostsOptions } from "../hooks/queries.ts";
import { portraitUrl } from "../lib/portrait.ts";
import { toolsSearchSchema } from "../lib/search-schemas.ts";
import styles from "./tools.module.css";

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
	dateStyle: "short",
	timeStyle: "short",
});

function ToolsPage() {
	const search = Route.useSearch();
	const navigate = useNavigate();
	const [fname, setFname] = useState(search.fname);
	useEffect(() => setFname(search.fname), [search.fname]);

	const postsQuery = useQuery(
		recentPostsOptions(search.method, search.id, search.page, search.fname),
	);

	const submitForum = (event: React.SubmitEvent) => {
		event.preventDefault();
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
				输入贴吧 UID、用户名或昵称、用户
				ID，查询该用户跨贴吧的近期回复；也可按贴吧筛选。
			</p>
			<QueryForm />

			<form className={styles.toolForm} onSubmit={submitForum}>
				<FormControl className={styles.grow}>
					<FormControl.Label>贴吧名（可选）</FormControl.Label>
					<TextInput
						block
						value={fname}
						onChange={(event) => setFname(event.target.value)}
						placeholder="留空查询全部贴吧；填写时不要带末尾的“吧”字"
					/>
				</FormControl>
				<Button type="submit" variant="primary" disabled={!search.id}>
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

			{!!postsQuery.data?.hidePost && (
				<Banner
					variant="warning"
					title="隐藏发言兼容提示"
					description="协议返回了隐藏标记；当前仍能读取到部分近期发言。该字段语义可能随百度接口调整而变化。"
				/>
			)}

			{postsQuery.data && postsQuery.data.posts.length === 0 && (
				<Blankslate border>
					<Blankslate.Visual>
						<NoteIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>暂无近期发言</Blankslate.Heading>
					<Blankslate.Description>
						{search.fname
							? "该用户近期可能未在此吧回复，或匹配记录超出了本次扫描范围。"
							: "该用户近期没有可显示的回复。"}
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
							<div className={styles.postMeta}>
								{post.fname && <Label variant="accent">{post.fname}吧</Label>}
								{post.createTime && (
									<time
										dateTime={new Date(post.createTime * 1000).toISOString()}
									>
										{dateFormat.format(new Date(post.createTime * 1000))}
									</time>
								)}
								<a
									className={styles.externalLink}
									href={post.href}
									target="_blank"
									rel="noopener noreferrer"
								>
									<LinkExternalIcon size={14} /> 查看原帖
								</a>
							</div>
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
				数据来自百度公开接口，仅供学习研究，请勿用于骚扰或人肉。
			</footer>
		</div>
	);
}

export const Route = createFileRoute("/tools")({
	validateSearch: zodSearchValidator({ schema: toolsSearchSchema }),
	component: ToolsPage,
});
