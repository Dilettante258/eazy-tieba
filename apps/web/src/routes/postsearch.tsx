import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import {
	Banner,
	Button,
	FormControl,
	ProgressBar,
	SegmentedControl,
	Spinner,
	TextInput,
} from "@primer/react";
import {
	LinkExternalIcon,
	PlusIcon,
	SearchIcon,
	XIcon,
} from "@primer/octicons-react";
import {
	useCallback,
	useDeferredValue,
	useEffect,
	useRef,
	useState,
} from "react";
import { useQueries } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { postSearchSchema } from "../lib/search-schemas.ts";
import {
	usePostSearch,
	type SearchResultPost,
} from "../hooks/use-post-search.ts";
import { userInfoOptions } from "../hooks/queries.ts";
import { portraitUrl } from "../lib/portrait.ts";
import { applyHighlight, clearHighlight } from "../lib/highlight.ts";
import styles from "./postsearch.module.css";

// ── 时间格式化 ──

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
	dateStyle: "short",
	timeStyle: "short",
});

// ── 用户条件类型 ──

type UserIdType = "uid" | "un" | "id";
const USER_TYPE_LABELS: Record<UserIdType, string> = {
	uid: "UID",
	un: "用户名",
	id: "ID",
};

interface UserTag {
	type: UserIdType;
	value: string;
}

// ── 用户信息预览 ──

function UserTagList({
	tags,
	onRemove,
}: {
	tags: UserTag[];
	onRemove: (idx: number) => void;
}) {
	const queries = useQueries({
		queries: tags.map((tag) => userInfoOptions(tag.type, tag.value)),
	});

	return (
		<ul className={styles.userTagList}>
			{tags.map((tag, i) => {
				const { data, isLoading, isError, error } = queries[i];
				const displayName =
					data && (data.show_nickname || data.name_show || data.name);
				const avatar = data?.portrait ? portraitUrl(data.portrait) : null;

				return (
					<li
						key={`${tag.type}-${tag.value}`}
						className={`${styles.userCard} ${isError ? styles.userCardError : ""}`}
						title={isError ? (error instanceof Error ? error.message : "查询失败") : undefined}
					>
						{isLoading ? (
							<Spinner size="small" />
						) : avatar ? (
							<img
								src={avatar}
								alt=""
								className={styles.userAvatar}
							/>
						) : (
							<div className={styles.userAvatarPlaceholder} />
						)}
						<div className={styles.userCardInfo}>
							<span className={styles.userCardName}>
								{displayName || tag.value}
							</span>
							<span className={isError ? styles.userCardError_text : styles.userCardId}>
								{isError
									? (error instanceof Error ? error.message : "查询失败")
									: `${USER_TYPE_LABELS[tag.type]}: ${tag.value}`}
							</span>
						</div>
						<button
							type="button"
							className={styles.tagRemove}
							aria-label={`移除 ${tag.value}`}
							onClick={() => onRemove(i)}
						>
							<XIcon size={14} />
						</button>
					</li>
				);
			})}
		</ul>
	);
}

// ── 查询表单 ──

interface SearchFormProps {
	onSubmit: (params: {
		fname: string;
		users: string;
		keywords: string;
		sort: number;
		count: number;
		depth: "first" | "all";
	}) => void;
	loading: boolean;
}

function SearchForm({ onSubmit, loading }: SearchFormProps) {
	const { fname, sort, count, depth } = Route.useSearch();

	// 基本参数
	const [localFname, setLocalFname] = useState(fname);
	const [localSort, setLocalSort] = useState(sort);
	const [localCount, setLocalCount] = useState(String(count));
	const [localDepth, setLocalDepth] = useState<"first" | "all">(depth);

	// 用户条件
	const [userType, setUserType] = useState<UserIdType>("uid");
	const [userInput, setUserInput] = useState("");
	const [userTags, setUserTags] = useState<UserTag[]>([]);

	// 关键词条件
	const [kwInput, setKwInput] = useState("");
	const [kwTags, setKwTags] = useState<string[]>([]);

	const handleAddUser = useCallback(() => {
		const val = userInput.trim();
		if (!val) return;
		// 去重
		if (userTags.some((t) => t.type === userType && t.value === val)) return;
		setUserTags((prev) => [...prev, { type: userType, value: val }]);
		setUserInput("");
	}, [userInput, userType, userTags]);

	const handleRemoveUser = useCallback((idx: number) => {
		setUserTags((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	const handleAddKw = useCallback(() => {
		const val = kwInput.trim();
		if (!val) return;
		if (kwTags.includes(val)) return;
		setKwTags((prev) => [...prev, val]);
		setKwInput("");
	}, [kwInput, kwTags]);

	const handleRemoveKw = useCallback((idx: number) => {
		setKwTags((prev) => prev.filter((_, i) => i !== idx));
	}, []);

	const handleSubmit = useCallback(
		(e: React.FormEvent) => {
			e.preventDefault();
			const trimmedFname = localFname.trim();
			if (!trimmedFname) return;
			if (userTags.length === 0 && kwTags.length === 0) return;
			const n = Math.min(Math.max(Number(localCount) || 100, 1), 300);
			onSubmit({
				fname: trimmedFname,
				users: userTags.map((t) => `${t.type}:${t.value}`).join(","),
				keywords: kwTags.join(","),
				sort: localSort,
				count: n,
				depth: localDepth,
			});
		},
		[localFname, localSort, localCount, localDepth, userTags, kwTags, onSubmit],
	);

	return (
		<form className={styles.queryForm} onSubmit={handleSubmit}>
			{/* 第一行：贴吧名 + 排序 + 帖数 + 深度 */}
			<div className={styles.formRow}>
				<FormControl>
					<FormControl.Label>贴吧名称</FormControl.Label>
					<TextInput
						className={styles.fnameInput}
						leadingVisual={SearchIcon}
						placeholder="输入贴吧名"
						value={localFname}
						onChange={(e) => setLocalFname(e.target.value)}
						size="medium"
					/>
				</FormControl>

				<FormControl>
					<FormControl.Label>扫描帖数</FormControl.Label>
					<TextInput
						className={styles.countInput}
						type="number"
						min={1}
						max={300}
						value={localCount}
						placeholder="最多 300"
						onChange={(e) => setLocalCount(e.target.value)}
						size="medium"
					/>
				</FormControl>

				<FormControl>
					<FormControl.Label>排序</FormControl.Label>
					<SegmentedControl
						size="small"
						onChange={(i) => setLocalSort(i === 0 ? 1 : 0)}
					>
						<SegmentedControl.Button selected={localSort === 1}>
							最新回复
						</SegmentedControl.Button>
						<SegmentedControl.Button selected={localSort === 0}>
							最新发帖
						</SegmentedControl.Button>
					</SegmentedControl>
				</FormControl>

				<FormControl>
					<FormControl.Label>抓取深度</FormControl.Label>
					<SegmentedControl
						size="small"
						onChange={(i) => setLocalDepth(i === 0 ? "first" : "all")}
					>
						<SegmentedControl.Button selected={localDepth === "first"}>
							仅首页
						</SegmentedControl.Button>
						<SegmentedControl.Button selected={localDepth === "all"}>
							全部(≤10页)
						</SegmentedControl.Button>
					</SegmentedControl>
				</FormControl>
			</div>

			{/* 第二行：搜索条件 */}
			<div className={styles.conditionSection}>
				{/* 用户条件 */}
				<FormControl>
					<FormControl.Label>筛选用户</FormControl.Label>
					<div className={styles.addRow}>
						<SegmentedControl
							size="small"
							onChange={(i) => {
								const types: UserIdType[] = ["uid", "un", "id"];
								setUserType(types[i]);
							}}
						>
							{(["uid", "un", "id"] as const).map((t) => (
								<SegmentedControl.Button key={t} selected={userType === t}>
									{USER_TYPE_LABELS[t]}
								</SegmentedControl.Button>
							))}
						</SegmentedControl>
						<TextInput
							className={styles.conditionInput}
							placeholder={`输入${USER_TYPE_LABELS[userType]}`}
							value={userInput}
							onChange={(e) => setUserInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddUser();
								}
							}}
							size="medium"
						/>
						<Button
							type="button"
							size="medium"
							leadingVisual={PlusIcon}
							onClick={handleAddUser}
						>
							加入
						</Button>
					</div>
					{userTags.length > 0 && (
						<UserTagList tags={userTags} onRemove={handleRemoveUser} />
					)}
					<FormControl.Caption>
						选择标识类型，输入值后点击加入，支持添加多个用户
					</FormControl.Caption>
				</FormControl>

				{/* 关键词条件 */}
				<FormControl>
					<FormControl.Label>筛选关键词</FormControl.Label>
					<div className={styles.addRow}>
						<TextInput
							className={styles.conditionInput}
							placeholder="输入关键词"
							value={kwInput}
							onChange={(e) => setKwInput(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") {
									e.preventDefault();
									handleAddKw();
								}
							}}
							size="medium"
						/>
						<Button
							type="button"
							size="medium"
							leadingVisual={PlusIcon}
							onClick={handleAddKw}
						>
							加入
						</Button>
					</div>
					{kwTags.length > 0 && (
						<ul className={styles.tagList}>
							{kwTags.map((kw, i) => (
								<li key={kw} className={styles.tag}>
									<span>{kw}</span>
									<button
										type="button"
										className={styles.tagRemove}
										aria-label={`移除 ${kw}`}
										onClick={() => handleRemoveKw(i)}
									>
										<XIcon size={12} />
									</button>
								</li>
							))}
						</ul>
					)}
					<FormControl.Caption>
						匹配帖子标题和回复内容，支持添加多个关键词
					</FormControl.Caption>
				</FormControl>
			</div>

			<Button type="submit" variant="primary" disabled={loading}>
				开始搜索
			</Button>
		</form>
	);
}

// ── 搜索进度 ──

function SearchProgress({
	phase,
	threadCount,
	threadsSearched,
	resultCount,
}: {
	phase: string;
	threadCount: number;
	threadsSearched: number;
	resultCount: number;
}) {
	if (phase === "threads") {
		return (
			<div className={styles.progress}>
				<Spinner size="small" />
				<span>正在获取帖子列表…</span>
			</div>
		);
	}

	if (phase === "searching" && threadCount > 0) {
		const pct = Math.round((threadsSearched / threadCount) * 100);
		return (
			<div className={styles.progress}>
				<span>
					正在搜索 {threadsSearched}/{threadCount}，已找到{" "}
					<strong>{resultCount}</strong> 条结果
				</span>
				<ProgressBar
					progress={pct}
					aria-label="搜索进度"
					className={styles.progressBar}
				/>
			</div>
		);
	}

	return null;
}

// ── 搜索结果列表（虚拟滚动） ──

function SearchResultList({
	results,
	keywords,
}: {
	results: SearchResultPost[];
	keywords: string[];
}) {
	const parentRef = useRef<HTMLDivElement>(null);
	const deferredKeywords = useDeferredValue(keywords);

	const rowVirtualizer = useVirtualizer({
		count: results.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 100,
		overscan: 5,
	});

	const virtualItems = rowVirtualizer.getVirtualItems();

	// 关键词高亮
	const runHighlight = useCallback(() => {
		applyHighlight("search-highlight", parentRef.current, deferredKeywords);
	}, [deferredKeywords]);

	useEffect(() => {
		runHighlight();
		return () => clearHighlight("search-highlight");
	}, [runHighlight]);

	useEffect(() => {
		const el = parentRef.current;
		if (!el || deferredKeywords.length === 0) return;
		el.addEventListener("scroll", runHighlight);
		return () => el.removeEventListener("scroll", runHighlight);
	}, [deferredKeywords, runHighlight]);

	if (results.length === 0) {
		return (
			<div className={styles.emptyState}>
				<span>暂无匹配结果</span>
			</div>
		);
	}

	return (
		<div ref={parentRef} className={styles.virtualList}>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{virtualItems.map((virtualRow) => {
					const post = results[virtualRow.index];
					const threadUrl = `https://tieba.baidu.com/p/${post.tid}`;
					const postUrl = `${threadUrl}?pid=${post.pid}&cid=${post.pid}#${post.pid}`;

					return (
						<div
							key={virtualRow.index}
							className={
								virtualRow.index % 2 ? styles.listItemOdd : styles.listItemEven
							}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<p className={styles.postHeader}>
								<span className={styles.authorName}>{post.authorName}</span>
								<span>回复</span>
								<a
									href={threadUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.threadLink}
								>
									{post.threadTitle}
								</a>
							</p>
							<p className={styles.postContent}>{post.content}</p>
							<div className={styles.postFooter}>
								<span className={styles.postFloor}>{post.floor}楼</span>
								<div className={styles.postMeta}>
									<a
										href={postUrl}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.postLink}
									>
										<LinkExternalIcon size={12} />
										链接
									</a>
									<span className={styles.postTime}>
										{dateFormat.format(new Date(post.time * 1000))}
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ── 页面组件 ──

function PostSearchPage() {
	const { status, phase, threadCount, threadsSearched, results, error, start } =
		usePostSearch();

	// 记录搜索时的关键词用于高亮
	const [activeKeywords, setActiveKeywords] = useState<string[]>([]);

	const handleSubmit = useCallback(
		(params: {
			fname: string;
			users: string;
			keywords: string;
			sort: number;
			count: number;
			depth: "first" | "all";
		}) => {
			setActiveKeywords(
				params.keywords
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean),
			);
			start(params);
		},
		[start],
	);

	return (
		<div>
			<div className={styles.topSection}>
				<div className={styles.formSide}>
					<h2 className={styles.heading}>发言搜索</h2>
					<SearchForm onSubmit={handleSubmit} loading={status === "loading"} />
				</div>
				<aside className={styles.guideSide}>
					<h3 className={styles.guideTitle}>使用说明</h3>
					<dl className={styles.guideList}>
						<dt>基本流程</dt>
						<dd>输入贴吧名称，添加筛选用户或关键词条件，点击开始搜索。程序会批量抓取该吧帖子并逐帖过滤匹配内容。</dd>
						<dt>筛选用户</dt>
						<dd>
							选择用户标识类型后输入对应值，点击「加入」添加。支持三种标识：
							<strong>UID</strong>（贴吧用户 ID）、
							<strong>用户名</strong>、
							<strong>ID</strong>（百度用户 portrait）。可同时添加多个用户。
						</dd>
						<dt>筛选关键词</dt>
						<dd>输入关键词后点击「加入」，匹配帖子标题和回复正文内容。支持添加多个关键词，结果中会高亮显示。</dd>
						<dt>匹配逻辑</dt>
						<dd>用户条件与关键词条件之间为<strong>或（OR）</strong>关系——命中任一条件的发言都会被返回。</dd>
						<dt>扫描帖数</dt>
						<dd>指定要扫描的帖子数量，最多 300 个。数量越多耗时越长。</dd>
						<dt>抓取深度</dt>
						<dd>「仅首页」只看每个帖子的第一页回复；「全部」会抓取最多 10 页回复，覆盖更全但速度较慢。</dd>
					</dl>
				</aside>
			</div>

			{/* 加载进度 */}
			{status === "loading" && (
				<SearchProgress
					phase={phase}
					threadCount={threadCount}
					threadsSearched={threadsSearched}
					resultCount={results.length}
				/>
			)}

			{/* 错误 */}
			{error && (
				<Banner variant="critical" title="搜索失败" description={error} />
			)}

			{/* 统计信息 */}
			{status === "done" && (
				<p className={styles.statsBar}>
					扫描了 <span className={styles.statsValue}>{threadCount}</span>{" "}
					个帖子，找到{" "}
					<span className={styles.statsValue}>{results.length}</span> 条匹配结果
				</p>
			)}

			{/* 结果列表 */}
			{(status === "done" || results.length > 0) && (
				<SearchResultList results={results} keywords={activeKeywords} />
			)}
		</div>
	);
}

export const Route = createFileRoute("/postsearch")({
	validateSearch: zodSearchValidator({ schema: postSearchSchema }),
	component: PostSearchPage,
});
