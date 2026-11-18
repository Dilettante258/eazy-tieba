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
	SegmentedControl,
	Spinner,
	Textarea,
	TextInput,
} from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { useEffect, useMemo, useState } from "react";
import { QueryForm } from "../components/QueryForm.tsx";
import {
	forumLevelsToolOptions,
	forumPostsToolOptions,
	legacyForumLevelsToolOptions,
} from "../hooks/queries.ts";
import { portraitUrl } from "../lib/portrait.ts";
import { toolsSearchSchema } from "../lib/search-schemas.ts";
import styles from "./tools.module.css";

const TOOL_MODES = [
	{ value: "posts-old", label: "吧内发言" },
	{ value: "posts-new", label: "吧内发言（新）" },
	{ value: "levels", label: "指定吧等级" },
	{ value: "levels-legacy", label: "全部吧等级" },
] as const;

const GAME_PRESET =
	"原神内鬼,原神,米哈游,星穹铁道,星穹铁道内鬼,尘白禁区,千年之旅,有男偷玩,二游笑话,明日方舟,明日方舟dl,快乐雪花,拂晓胜利之刻,heavenburnsred,碧蓝航线,异色格,赤色中轴,少女前线,少女前线2,碧蓝航线避风港,ml游戏,蔚蓝档案,碧蓝档案,鸣潮,鸣潮内鬼,旧鸣潮内鬼,新鸣潮内鬼,灵魂潮汐,无期迷途,碧蓝档案吐槽";

type ToolMode = (typeof TOOL_MODES)[number]["value"];
type SortDirection = "asc" | "desc";

function UserSummary({
	user,
}: {
	user: { nickname: string; portrait: string } | undefined;
}) {
	if (!user) return null;
	return (
		<div className={styles.userSummary}>
			{user.portrait && (
				<Avatar
					src={portraitUrl(user.portrait)}
					size={48}
					alt={user.nickname}
				/>
			)}
			<div>
				<strong>{user.nickname || "未知用户"}</strong>
				<p>以下结果已统一到同一贴吧用户身份。</p>
			</div>
		</div>
	);
}

function LoadingOrError({
	loading,
	error,
}: {
	loading: boolean;
	error: unknown;
}) {
	if (loading) {
		return (
			<div className={styles.center}>
				<Spinner size="large" />
			</div>
		);
	}
	if (error) {
		return (
			<Banner
				variant="critical"
				title="查询失败"
				description={error instanceof Error ? error.message : String(error)}
			/>
		);
	}
	return null;
}

function ToolsPage() {
	const search = Route.useSearch();
	const navigate = useNavigate();
	const [fname, setFname] = useState(search.fname);
	const [fnameList, setFnameList] = useState(search.fnameList);
	const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
	const [levelWindow, setLevelWindow] = useState({ key: "", count: 100 });
	const isPosts = search.tool === "posts-old" || search.tool === "posts-new";
	const levelWindowKey = `${search.method}:${search.id}:${search.tool}`;
	const visibleLevelCount =
		levelWindow.key === levelWindowKey ? levelWindow.count : 100;

	useEffect(() => setFname(search.fname), [search.fname]);
	useEffect(() => setFnameList(search.fnameList), [search.fnameList]);

	const postsQuery = useQuery(
		forumPostsToolOptions(
			search.tool === "posts-new" ? "new" : "old",
			search.method,
			search.id,
			search.fname,
			search.page,
			isPosts,
		),
	);
	const levelsQuery = useQuery(
		forumLevelsToolOptions(
			search.method,
			search.id,
			search.fnameList,
			search.tool === "levels",
		),
	);
	const legacyLevelsQuery = useQuery(
		legacyForumLevelsToolOptions(
			search.method,
			search.id,
			search.tool === "levels-legacy",
		),
	);

	const activeQuery = isPosts
		? postsQuery
		: search.tool === "levels"
			? levelsQuery
			: legacyLevelsQuery;
	const levels = useMemo(() => {
		const data =
			search.tool === "levels" ? levelsQuery.data : legacyLevelsQuery.data;
		const values = (data?.result ?? []).map((item) => ({
			fname: item.fname,
			level: item.level,
			exp: "exp" in item && typeof item.exp === "number" ? item.exp : undefined,
		}));
		return [...values].sort((left, right) => {
			const difference = left.level - right.level;
			return sortDirection === "asc" ? difference : -difference;
		});
	}, [legacyLevelsQuery.data, levelsQuery.data, search.tool, sortDirection]);
	const user = isPosts
		? postsQuery.data?.user
		: search.tool === "levels"
			? levelsQuery.data?.user
			: legacyLevelsQuery.data?.user;
	const visibleLevels = levels.slice(0, visibleLevelCount);

	const changeTool = (tool: ToolMode) => {
		void navigate({
			to: "/tools",
			search: (previous: typeof search) => ({ ...previous, tool, page: 1 }),
		});
	};

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

	const submitForums = (event: React.SubmitEvent) => {
		event.preventDefault();
		if (!fnameList.trim()) return;
		void navigate({
			to: "/tools",
			search: (previous: typeof search) => ({
				...previous,
				fnameList: fnameList.trim(),
			}),
		});
	};

	return (
		<div className={styles.page}>
			<h2 className={styles.heading}>贴吧工具</h2>
			<p className={styles.intro}>
				使用贴吧 UID、用户名或昵称、用户 ID
				查询；系统会先关联为同一用户再执行工具。
			</p>
			<QueryForm />

			<div className={styles.modePicker}>
				<SegmentedControl
					aria-label="选择工具"
					onChange={(index) => changeTool(TOOL_MODES[index].value)}
				>
					{TOOL_MODES.map((mode) => (
						<SegmentedControl.Button
							key={mode.value}
							selected={search.tool === mode.value}
						>
							{mode.label}
						</SegmentedControl.Button>
					))}
				</SegmentedControl>
			</div>

			{isPosts && (
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
						查询
					</Button>
				</form>
			)}

			{search.tool === "levels" && (
				<form className={styles.levelForm} onSubmit={submitForums}>
					<FormControl>
						<FormControl.Label>贴吧列表</FormControl.Label>
						<Textarea
							block
							rows={4}
							value={fnameList}
							onChange={(event) => setFnameList(event.target.value)}
							placeholder="使用英文逗号分隔，例如：原神,星穹铁道,明日方舟"
						/>
						<FormControl.Caption>单次最多查询 50 个贴吧</FormControl.Caption>
					</FormControl>
					<div className={styles.formActions}>
						<Button type="button" onClick={() => setFnameList(GAME_PRESET)}>
							填入“二游大战”预设
						</Button>
						<Button
							type="submit"
							variant="primary"
							disabled={!search.id || !fnameList.trim()}
						>
							查询等级
						</Button>
					</div>
				</form>
			)}

			{search.tool === "levels-legacy" && !search.id && (
				<Banner
					variant="info"
					title="请选择用户"
					description="输入任一用户标识后，将自动查询该用户公开面板中的全部贴吧等级。"
				/>
			)}

			<LoadingOrError
				loading={activeQuery.isLoading}
				error={activeQuery.error}
			/>
			<UserSummary user={user} />

			{isPosts && postsQuery.data && postsQuery.data.posts.length === 0 && (
				<Blankslate border>
					<Blankslate.Visual>
						<NoteIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>未找到吧内发言</Blankslate.Heading>
					<Blankslate.Description>
						该用户可能未在此吧发言，或匹配记录超出了本次扫描范围。
					</Blankslate.Description>
				</Blankslate>
			)}

			{isPosts && postsQuery.data && postsQuery.data.posts.length > 0 && (
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

			{isPosts && postsQuery.data && (
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
						disabled={
							"hasNext" in postsQuery.data
								? postsQuery.data.hasNext === 0
								: postsQuery.data.posts.length < 20
						}
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

			{!isPosts && levels.length === 0 && activeQuery.data && (
				<Blankslate border>
					<Blankslate.Visual>
						<NoteIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>暂无等级数据</Blankslate.Heading>
					<Blankslate.Description>
						该用户可能没有参与这些贴吧，或没有公开等级记录。
					</Blankslate.Description>
				</Blankslate>
			)}

			{!isPosts && levels.length > 0 && (
				<div className={styles.tableWrap}>
					<table className={styles.table}>
						<thead>
							<tr>
								<th scope="col">吧名</th>
								<th scope="col">
									<button
										type="button"
										onClick={() =>
											setSortDirection((current) =>
												current === "desc" ? "asc" : "desc",
											)
										}
									>
										等级 {sortDirection === "desc" ? "↓" : "↑"}
									</button>
								</th>
								{search.tool === "levels" && <th scope="col">经验</th>}
							</tr>
						</thead>
						<tbody>
							{visibleLevels.map((item) => (
								<tr key={item.fname}>
									<td>{item.fname}吧</td>
									<td>{item.level}</td>
									{search.tool === "levels" && <td>{item.exp ?? "-"}</td>}
								</tr>
							))}
						</tbody>
					</table>
					{visibleLevelCount < levels.length && (
						<div className={styles.loadMore}>
							<Button
								onClick={() =>
									setLevelWindow({
										key: levelWindowKey,
										count: visibleLevelCount + 100,
									})
								}
							>
								再显示 100 条（剩余 {levels.length - visibleLevelCount} 条）
							</Button>
						</div>
					)}
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
