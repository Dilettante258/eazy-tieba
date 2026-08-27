import {
	ArrowLeftIcon,
	ArrowRightIcon,
	PlusIcon,
	SearchIcon,
	SyncIcon,
	XIcon,
} from "@primer/octicons-react";
import {
	Banner,
	Button,
	SegmentedControl,
	Spinner,
	TextInput,
} from "@primer/react";
import {
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { AnalysisUtterancesDrawer } from "../../components/DbAnalyze/AnalysisUtterancesDrawer.tsx";
import type {
	AnalysisCatalog,
	AnalysisForum,
	AnalysisForumType,
	AnalysisRequest,
	CrossTypeUser,
} from "../../components/DbAnalyze/analysis-types.ts";
import { readJson } from "../../components/DbAnalyze/analysis-types.ts";
import styles from "../../components/DbAnalyze/DbAnalyze.module.css";
import { ForumGroupManager } from "../../components/DbAnalyze/ForumGroupManager.tsx";
import moduleStyles from "../../components/ForumPostAnalysis/ForumPostAnalysis.module.css";
import { unwrap } from "../../hooks/queries.ts";
import { api } from "../../lib/api-client.ts";
import { useDbAnalyzeExploreStore } from "../../lib/db-analyze-explore-store.ts";

const PAGE_LIMIT = 50;

function TypeSelector({
	types,
	selectedIds,
	onToggle,
}: {
	types: AnalysisForumType[];
	selectedIds: Set<string>;
	onToggle: (type: AnalysisForumType) => void;
}) {
	const [filter, setFilter] = useState("");
	const { customTypes, officialBranches } = useMemo(() => {
		const query = filter.trim().toLocaleLowerCase();
		const matches = (type: AnalysisForumType) =>
			!query || type.name.toLocaleLowerCase().includes(query);
		const customTypes = types.filter(
			(type) => type.source === "custom" && matches(type),
		);
		const officialBranches = types
			.filter((type) => type.level === "first")
			.map((parent) => {
				const children = types.filter(
					(type) =>
						type.level === "second" &&
						type.parentId === parent.id &&
						(matches(parent) || matches(type)),
				);
				return { parent, children };
			})
			.filter(({ parent, children }) => matches(parent) || children.length > 0);
		return { customTypes, officialBranches };
	}, [filter, types]);
	const renderGroup = (title: string, items: AnalysisForumType[]) =>
		items.length > 0 && (
			<div className={styles.typeGroup}>
				<div className={styles.typeGroupTitle}>{title}</div>
				<div className={styles.typeChips}>
					{items.map((type) => (
						<button
							key={type.id}
							type="button"
							className={`${styles.typeChip} ${selectedIds.has(type.id) ? styles.typeChipSelected : ""}`}
							onClick={() => onToggle(type)}
						>
							{type.name}
							<span>{type.forumIds.length}</span>
						</button>
					))}
				</div>
			</div>
		);
	return (
		<div className={styles.typeSelector}>
			<TextInput
				block
				leadingVisual={SearchIcon}
				value={filter}
				onChange={(event) => setFilter(event.target.value)}
				placeholder="搜索官方或自定义类型"
			/>
			<div className={styles.typeSelectorBody}>
				{renderGroup("自定义类型", customTypes)}
				{officialBranches.length > 0 && (
					<div className={styles.typeGroup}>
						<div className={styles.typeGroupTitle}>官方分类树</div>
						{officialBranches.map(({ parent, children }) => (
							<div key={parent.id} className={styles.officialTypeBranch}>
								<button
									type="button"
									className={`${styles.typeChip} ${styles.officialParentChip} ${selectedIds.has(parent.id) ? styles.typeChipSelected : ""}`}
									onClick={() => onToggle(parent)}
								>
									{parent.name}
									<span>{parent.forumIds.length}</span>
								</button>
								<div className={styles.typeChips}>
									{children.map((type) => (
										<button
											key={type.id}
											type="button"
											className={`${styles.typeChip} ${selectedIds.has(type.id) ? styles.typeChipSelected : ""}`}
											onClick={() => onToggle(type)}
										>
											{type.name}
											<span>{type.forumIds.length}</span>
										</button>
									))}
								</div>
							</div>
						))}
					</div>
				)}
			</div>
		</div>
	);
}

function ForumTransfer({
	forums,
	selectedIds,
	onChange,
}: {
	forums: AnalysisForum[];
	selectedIds: Set<string>;
	onChange: (next: Set<string>) => void;
}) {
	const [filter, setFilter] = useState("");
	const [checkedAvailable, setCheckedAvailable] = useState<Set<string>>(
		new Set(),
	);
	const [checkedSelected, setCheckedSelected] = useState<Set<string>>(
		new Set(),
	);
	const filtered = useMemo(() => {
		const query = filter.trim().toLocaleLowerCase();
		return forums.filter(
			(forum) =>
				!query ||
				`${forum.name} ${forum.firstClass} ${forum.secondClass}`
					.toLocaleLowerCase()
					.includes(query),
		);
	}, [filter, forums]);
	const available = filtered.filter((forum) => !selectedIds.has(forum.id));
	const selected = filtered.filter((forum) => selectedIds.has(forum.id));

	function toggleChecked(
		id: string,
		setter: React.Dispatch<React.SetStateAction<Set<string>>>,
	) {
		setter((previous) => {
			const next = new Set(previous);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	}
	function move(ids: Set<string>, intoSelection: boolean) {
		const next = new Set(selectedIds);
		for (const id of ids) intoSelection ? next.add(id) : next.delete(id);
		onChange(next);
		if (intoSelection) setCheckedAvailable(new Set());
		else setCheckedSelected(new Set());
	}
	const list = (
		items: AnalysisForum[],
		checked: Set<string>,
		setter: React.Dispatch<React.SetStateAction<Set<string>>>,
	) => (
		<div className={styles.transferList}>
			{items.map((forum) => (
				<label key={forum.id} className={styles.transferItem}>
					<input
						type="checkbox"
						checked={checked.has(forum.id)}
						onChange={() => toggleChecked(forum.id, setter)}
					/>
					<span>
						<strong>{forum.name}</strong>
						<small>
							{forum.firstClass} / {forum.secondClass} ·{" "}
							{forum.crossUserCount.toLocaleString()} 跨吧用户
						</small>
					</span>
				</label>
			))}
			{items.length === 0 && <p className={styles.emptyHint}>没有匹配的贴吧</p>}
		</div>
	);
	return (
		<div>
			<TextInput
				block
				leadingVisual={SearchIcon}
				value={filter}
				onChange={(event) => setFilter(event.target.value)}
				placeholder="搜索吧名或分类"
			/>
			<div className={styles.transferGrid}>
				<div className={styles.transferColumn}>
					<div className={styles.transferHeader}>
						<strong>可选贴吧</strong>
						<span>{available.length}</span>
					</div>
					{list(available, checkedAvailable, setCheckedAvailable)}
				</div>
				<div className={styles.transferActions}>
					<Button
						aria-label="加入"
						disabled={checkedAvailable.size === 0}
						onClick={() => move(checkedAvailable, true)}
					>
						<ArrowRightIcon />
					</Button>
					<Button
						aria-label="移除"
						disabled={checkedSelected.size === 0}
						onClick={() => move(checkedSelected, false)}
					>
						<ArrowLeftIcon />
					</Button>
				</div>
				<div className={styles.transferColumn}>
					<div className={styles.transferHeader}>
						<strong>分析范围</strong>
						<span>{selectedIds.size}</span>
					</div>
					{list(selected, checkedSelected, setCheckedSelected)}
				</div>
			</div>
		</div>
	);
}

function KeywordInput({
	keywords,
	onChange,
}: {
	keywords: string[];
	onChange: (next: string[]) => void;
}) {
	const [input, setInput] = useState("");
	function add() {
		const values = input
			.split(/[,，]/)
			.map((value) => value.trim())
			.filter(Boolean);
		if (values.length === 0) return;
		onChange([...new Set([...keywords, ...values])].slice(0, 10));
		setInput("");
	}
	return (
		<div>
			<div className={styles.keywordInputRow}>
				<TextInput
					block
					value={input}
					onChange={(event) => setInput(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							add();
						}
					}}
					placeholder="例如：招聘、招工、日结（回车添加）"
				/>
				<Button leadingVisual={PlusIcon} onClick={add} disabled={!input.trim()}>
					添加
				</Button>
			</div>
			<div className={styles.keywordChips}>
				{keywords.map((keyword) => (
					<span key={keyword} className={styles.keywordChip}>
						{keyword}
						<button
							type="button"
							onClick={() =>
								onChange(keywords.filter((item) => item !== keyword))
							}
						>
							<XIcon size={12} />
						</button>
					</span>
				))}
				{keywords.length === 0 && (
					<span className={styles.emptyHint}>不填写时展示全部跨类型用户。</span>
				)}
			</div>
		</div>
	);
}

function ResultsTable({
	users,
	total,
	request,
	typeMap,
	forumMap,
	loadingMore,
	hasNextPage,
	onLoadMore,
	onOpen,
}: {
	users: CrossTypeUser[];
	total: number;
	request: AnalysisRequest;
	typeMap: Map<string, AnalysisForumType>;
	forumMap: Map<string, AnalysisForum>;
	loadingMore: boolean;
	hasNextPage: boolean;
	onLoadMore: () => void;
	onOpen: (user: CrossTypeUser) => void;
}) {
	const router = useRouter();
	return (
		<div>
			<div className={styles.tableScroll}>
				<table className={styles.intersectionTable}>
					<thead>
						<tr>
							<th>用户</th>
							<th>覆盖类型</th>
							<th>涉及贴吧</th>
							<th style={{ textAlign: "right" }}>
								{request.keywords.length ? "命中 / 发言" : "发言"}
							</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{users.map((user) => (
							<tr key={user.authorId}>
								<td>
									<strong>{user.nameShow || user.name || "—"}</strong>
									<small className={styles.blockMeta}>{user.authorId}</small>
									{user.previews[0] && (
										<span className={styles.previewSnippet}>
											{user.previews[0]}
										</span>
									)}
								</td>
								<td>
									<div className={styles.resultTags}>
										{user.typeIds.map((id) => (
											<span key={id}>{typeMap.get(id)?.name ?? id}</span>
										))}
									</div>
								</td>
								<td>
									<div className={styles.resultTags}>
										{user.forumIds.slice(0, 8).map((id) => (
											<span key={id}>{forumMap.get(id)?.name ?? id}</span>
										))}
										{user.forumIds.length > 8 && (
											<span>+{user.forumIds.length - 8}</span>
										)}
									</div>
								</td>
								<td style={{ textAlign: "right" }}>
									<strong>
										{request.keywords.length
											? `${user.matchCount.toLocaleString()} / `
											: ""}
										{user.activityCount.toLocaleString()}
									</strong>
									{user.latestMatchAt && (
										<small className={styles.blockMeta}>
											{new Date(user.latestMatchAt).toLocaleDateString("zh-CN")}
										</small>
									)}
								</td>
								<td>
									<div className={styles.userActions}>
										<Button size="small" onClick={() => onOpen(user)}>
											查看发言
										</Button>
										<Button
											size="small"
											variant="invisible"
											onClick={() =>
												window.open(
													router.buildLocation({
														to: "/postanalysis",
														search: { method: "id", id: user.authorId },
													}).href,
													"_blank",
												)
											}
										>
											发帖分析
										</Button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{users.length === 0 && (
				<p className={styles.emptyResult}>没有找到满足条件的用户。</p>
			)}
			{hasNextPage && (
				<div className={styles.loadMore}>
					<Button
						disabled={loadingMore}
						loading={loadingMore}
						loadingAnnouncement="正在加载更多分析结果"
						onClick={onLoadMore}
					>
						加载更多（{users.length.toLocaleString()} / {total.toLocaleString()}
						）
					</Button>
				</div>
			)}
		</div>
	);
}

function ExplorePage() {
	const queryClient = useQueryClient();
	const catalogQuery = useQuery({
		queryKey: ["db-analyze", "forum-catalog"],
		queryFn: () =>
			api["db-analyze"]["forum-catalog"]
				.$get()
				.then(unwrap) as Promise<AnalysisCatalog>,
		staleTime: 5 * 60 * 1000,
	});
	const indexQuery = useQuery({
		queryKey: ["db-analyze", "analysis-index"],
		queryFn: () => api["db-analyze"]["analysis-index"].$get().then(unwrap),
		refetchInterval: (query) =>
			query.state.data?.status === "refreshing" ? 3000 : false,
	});
	const refreshMutation = useMutation({
		mutationFn: () =>
			api["db-analyze"]["analysis-index"].refresh.$post().then(unwrap),
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ["db-analyze"] });
		},
	});
	const catalog = catalogQuery.data;
	const {
		selectedTypeIds,
		selectedForumIds,
		keywords,
		matchMode,
		request,
		drawerUser,
		validationError,
		toggleType,
		setSelectedForumIds,
		setKeywords,
		setMatchMode,
		setDrawerUser,
		submitAnalysis,
	} = useDbAnalyzeExploreStore(
		useShallow((state) => ({
			selectedTypeIds: state.selectedTypeIds,
			selectedForumIds: state.selectedForumIds,
			keywords: state.keywords,
			matchMode: state.matchMode,
			request: state.request,
			drawerUser: state.drawerUser,
			validationError: state.validationError,
			toggleType: state.toggleType,
			setSelectedForumIds: state.setSelectedForumIds,
			setKeywords: state.setKeywords,
			setMatchMode: state.setMatchMode,
			setDrawerUser: state.setDrawerUser,
			submitAnalysis: state.submitAnalysis,
		})),
	);
	const analysisQuery = useInfiniteQuery({
		queryKey: ["db-analyze", "cross-type-analysis", request] as const,
		enabled: request !== null,
		queryFn: async ({ pageParam }) => {
			if (!request) throw new Error("尚未提交分析条件");
			return api["db-analyze"]["cross-type-analysis"]
				.$post({ json: { ...request, page: pageParam, limit: PAGE_LIMIT } })
				.then((response) =>
					readJson<{ total: number; users: CrossTypeUser[] }>(response),
				);
		},
		initialPageParam: 1,
		getNextPageParam: (last, pages) =>
			pages.reduce((sum, page) => sum + page.users.length, 0) < last.total
				? pages.length + 1
				: undefined,
	});
	const users = useMemo(
		() => analysisQuery.data?.pages.flatMap((page) => page.users) ?? [],
		[analysisQuery.data],
	);
	const total = analysisQuery.data?.pages[0]?.total ?? 0;
	const typeMap = useMemo(
		() => new Map(catalog?.types.map((type) => [type.id, type]) ?? []),
		[catalog],
	);
	const forumMap = useMemo(
		() => new Map(catalog?.forums.map((forum) => [forum.id, forum]) ?? []),
		[catalog],
	);
	const analysisLoading =
		request !== null &&
		analysisQuery.isFetching &&
		!analysisQuery.isFetchingNextPage;
	const indexRefreshing =
		refreshMutation.isPending || indexQuery.data?.status === "refreshing";

	if (catalogQuery.isPending)
		return (
			<div className={styles.centerLoading}>
				<Spinner /> 加载分析目录…
			</div>
		);
	if (catalogQuery.error)
		return (
			<Banner
				variant="critical"
				title="加载分析目录失败"
				description={catalogQuery.error.message}
			/>
		);
	if (!catalog) return null;
	return (
		<div>
			<div className={styles.indexStatus}>
				<div>
					<strong>分析数据</strong>
					<span>
						{indexQuery.data?.status === "refreshing"
							? "正在刷新…"
							: indexQuery.data?.refreshedAt
								? `上次刷新：${new Date(indexQuery.data.refreshedAt).toLocaleString("zh-CN")}`
								: "尚未记录刷新时间"}
					</span>
					{indexQuery.data?.errorMessage && (
						<span className={styles.statusError}>
							{indexQuery.data.errorMessage}
						</span>
					)}
				</div>
				<Button
					size="small"
					leadingVisual={SyncIcon}
					loading={indexRefreshing}
					loadingAnnouncement="正在刷新分析数据"
					disabled={indexRefreshing}
					onClick={() => refreshMutation.mutate()}
				>
					立即刷新
				</Button>
			</div>
			{refreshMutation.error && (
				<Banner
					variant="critical"
					title="刷新失败"
					description={refreshMutation.error.message}
				/>
			)}
			<div className={moduleStyles.chartModule}>
				<div className={moduleStyles.chartModuleHeader}>
					<div>
						<h3 className={moduleStyles.chartTitle}>1. 选择吧类型</h3>
						<p className={moduleStyles.chartDescription}>
							同一吧的多个标签分别计入类型覆盖；选择类型时会自动加入其贴吧。
						</p>
					</div>
					<span className={styles.selectionBadge}>
						已选 {selectedTypeIds.size} 种
					</span>
				</div>
				<TypeSelector
					types={catalog.types}
					selectedIds={selectedTypeIds}
					onToggle={toggleType}
				/>
				<ForumGroupManager
					compact
					forums={catalog.forums}
					types={catalog.types}
					onChanged={() => catalogQuery.refetch()}
				/>
			</div>
			<div className={moduleStyles.chartModule} style={{ marginTop: "1.5rem" }}>
				<div className={moduleStyles.chartModuleHeader}>
					<div>
						<h3 className={moduleStyles.chartTitle}>2. 微调贴吧范围</h3>
						<p className={moduleStyles.chartDescription}>
							可排除自动加入的吧，也可从完整目录补充其他吧。
						</p>
					</div>
					<span className={styles.selectionBadge}>
						已选 {selectedForumIds.size} 个
					</span>
				</div>
				<ForumTransfer
					forums={catalog.forums}
					selectedIds={selectedForumIds}
					onChange={setSelectedForumIds}
				/>
			</div>
			<div className={moduleStyles.chartModule} style={{ marginTop: "1.5rem" }}>
				<div className={moduleStyles.chartModuleHeader}>
					<div>
						<h3 className={moduleStyles.chartTitle}>3. 设置言论性质</h3>
						<p className={moduleStyles.chartDescription}>
							最多 10 个关键词；不填写时仍可探索跨类型用户。
						</p>
					</div>
					<SegmentedControl
						aria-label="关键词匹配方式"
						size="small"
						onChange={(index) => setMatchMode(index === 0 ? "any" : "all")}
					>
						<SegmentedControl.Button selected={matchMode === "any"}>
							任一关键词
						</SegmentedControl.Button>
						<SegmentedControl.Button selected={matchMode === "all"}>
							全部关键词
						</SegmentedControl.Button>
					</SegmentedControl>
				</div>
				<KeywordInput keywords={keywords} onChange={setKeywords} />
				{validationError && (
					<p className={styles.validationError}>{validationError}</p>
				)}
				<div className={styles.analyzeAction}>
					<Button
						variant="primary"
						size="large"
						loading={analysisLoading}
						loadingAnnouncement="正在分析跨类型用户与发言"
						onClick={() => submitAnalysis(catalog.types)}
					>
						开始分析
					</Button>
				</div>
			</div>
			{request && (
				<div
					className={moduleStyles.chartModule}
					style={{ marginTop: "1.5rem" }}
				>
					<div className={moduleStyles.chartModuleHeader}>
						<div>
							<h3 className={moduleStyles.chartTitle}>跨类型用户与发言</h3>
							<p className={moduleStyles.chartDescription}>
								{analysisQuery.isPending
									? "正在分析…"
									: `共 ${total.toLocaleString()} 人覆盖至少两个所选类型`}
							</p>
						</div>
					</div>
					{analysisQuery.isPending ? (
						<div className={styles.centerLoading}>
							<Spinner />
						</div>
					) : analysisQuery.error ? (
						<Banner
							variant="critical"
							title="分析失败"
							description={analysisQuery.error.message}
						/>
					) : (
						<ResultsTable
							users={users as CrossTypeUser[]}
							total={total}
							request={request}
							typeMap={typeMap}
							forumMap={forumMap}
							loadingMore={analysisQuery.isFetchingNextPage}
							hasNextPage={Boolean(analysisQuery.hasNextPage)}
							onLoadMore={() => analysisQuery.fetchNextPage()}
							onOpen={setDrawerUser}
						/>
					)}
				</div>
			)}
			{drawerUser && request && (
				<AnalysisUtterancesDrawer
					user={drawerUser}
					request={request}
					onClose={() => setDrawerUser(null)}
				/>
			)}
		</div>
	);
}

export const Route = createFileRoute("/dbanalyze/explore")({
	component: ExplorePage,
});
