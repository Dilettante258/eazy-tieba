import { useState, useCallback, useTransition } from "react";
import {
	ActionList,
	ActionMenu,
	Dialog,
	NavList,
	ToggleSwitch,
	Button,
	Select,
	TextInput,
	Flash,
	Text,
} from "@primer/react";
import {
	GearIcon,
	GlobeIcon,
	GraphIcon,
	InfoIcon,
	NoteIcon,
	TrashIcon,
	XIcon,
} from "@primer/octicons-react";
import { useQueryClient } from "@tanstack/react-query";
import {
	useSettingsStore,
	PANEL_LABELS,
	FORUM_PANEL_LABELS,
	type SettingsTab,
	type PanelId,
	type ForumPanelId,
} from "../lib/settings-store.ts";
import {
	HIGHLIGHT_COLORS,
	HIGHLIGHT_COLOR_LABELS,
	type HighlightColor,
} from "../lib/highlight.ts";
import {
	BACKEND_NODE_LABELS,
	BACKEND_PREFERENCE_LABELS,
	BACKEND_PREFERENCE_OPTIONS,
	isBackendPreference,
} from "../lib/backend-config.ts";
import { ensureBackendReady } from "../lib/backend.ts";
import styles from "./SettingsDialog.module.css";

const TABS: Array<{
	id: SettingsTab;
	label: string;
	icon: React.ReactNode;
}> = [
	{ id: "postanalysis", label: "发帖分析", icon: <GearIcon /> },
	{ id: "forumanalysis", label: "贴吧分析", icon: <GraphIcon /> },
	{ id: "userpost", label: "用户帖子", icon: <NoteIcon /> },
	{ id: "global", label: "全局", icon: <GlobeIcon /> },
	{ id: "about", label: "关于", icon: <InfoIcon /> },
];

const PANEL_IDS = Object.keys(PANEL_LABELS) as PanelId[];
const FORUM_PANEL_IDS = Object.keys(FORUM_PANEL_LABELS) as ForumPanelId[];

// ── 共用组件 ──

/** 颜色圆点指示器 */
function ColorDot({ color }: { color: HighlightColor }) {
	return (
		<span
			className={styles.colorDot}
			style={{ backgroundColor: `var(--bgColor-${color}-emphasis)` }}
		/>
	);
}

/** 颜色选择下拉菜单（ActionMenu，轻量，不会溢出） */
function ColorPickerMenu({
	selected,
	onChange,
	side = "outside-bottom",
}: {
	selected: HighlightColor;
	onChange: (color: HighlightColor) => void;
	side?: "outside-bottom" | "outside-top";
}) {
	return (
		<ActionMenu>
			<ActionMenu.Button
				size="small"
				leadingVisual={() => <ColorDot color={selected} />}
			>
				{HIGHLIGHT_COLOR_LABELS[selected]}
			</ActionMenu.Button>
			<ActionMenu.Overlay side={side}>
				<ActionList selectionVariant="single">
					{HIGHLIGHT_COLORS.map((c) => (
						<ActionList.Item
							key={c}
							selected={selected === c}
							onSelect={() => onChange(c)}
						>
							<ActionList.LeadingVisual>
								<ColorDot color={c} />
							</ActionList.LeadingVisual>
							{HIGHLIGHT_COLOR_LABELS[c]}
						</ActionList.Item>
					))}
				</ActionList>
			</ActionMenu.Overlay>
		</ActionMenu>
	);
}

// ── 发帖分析设置 ──

function PanelVisibilitySection() {
	const panelVisibility = useSettingsStore((s) => s.panelVisibility);
	const togglePanel = useSettingsStore((s) => s.togglePanel);
	const [isPending, startTransition] = useTransition();

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>面板显隐控制</h4>
			<p className={styles.sectionDesc}>控制发帖分析页面中各面板的显示与隐藏</p>
			<div
				className={styles.toggleList}
				style={{ opacity: isPending ? 0.6 : 1 }}
			>
				{PANEL_IDS.map((id) => {
					const labelId = `panel-label-${id}`;
					return (
						<div key={id} className={styles.toggleRow}>
							<Text id={labelId} className={styles.toggleLabel}>
								{PANEL_LABELS[id]}
							</Text>
							<ToggleSwitch
								size="small"
								checked={panelVisibility[id]}
								onClick={() => startTransition(() => togglePanel(id))}
								aria-labelledby={labelId}
							/>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function BlockedForumsSection() {
	const blockedForums = useSettingsStore((s) => s.blockedForums);
	const addBlockedForum = useSettingsStore((s) => s.addBlockedForum);
	const removeBlockedForum = useSettingsStore((s) => s.removeBlockedForum);
	const [input, setInput] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleAdd = useCallback(() => {
		const name = input.trim();
		if (!name) return;
		startTransition(() => addBlockedForum(name));
		setInput("");
	}, [input, addBlockedForum, startTransition]);

	const handleRemove = useCallback(
		(name: string) => {
			startTransition(() => removeBlockedForum(name));
		},
		[removeBlockedForum, startTransition],
	);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>屏蔽贴吧管理</h4>
			<p className={styles.sectionDesc}>
				添加需要屏蔽的贴吧名，被屏蔽的贴吧将从分析数据中过滤
			</p>
			<div className={styles.addRow}>
				<TextInput
					size="small"
					placeholder="输入贴吧名..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAdd();
					}}
					className={styles.addInput}
				/>
				<Button size="small" onClick={handleAdd}>
					添加
				</Button>
			</div>
			{blockedForums.length === 0 ? (
				<p className={styles.emptyHint}>暂无屏蔽贴吧</p>
			) : (
				<ul className={styles.tagList} style={{ opacity: isPending ? 0.6 : 1 }}>
					{blockedForums.map((name) => (
						<li key={name} className={styles.tag}>
							<span>{name}吧</span>
							<button
								type="button"
								className={styles.tagRemove}
								aria-label={`移除 ${name}`}
								onClick={() => handleRemove(name)}
							>
								<XIcon size={12} />
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function CacheManagementSection() {
	const queryClient = useQueryClient();
	const [cleared, setCleared] = useState(false);
	const [isPending, startTransition] = useTransition();

	const cacheSize = queryClient.getQueryCache().getAll().length;

	const handleClear = useCallback(() => {
		startTransition(() => {
			queryClient.clear();
			setCleared(true);
			setTimeout(() => setCleared(false), 2000);
		});
	}, [queryClient, startTransition]);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>缓存管理</h4>
			<p className={styles.sectionDesc}>
				管理 TanStack Query 查询缓存，清除后将重新请求数据
			</p>
			<div className={styles.cacheInfo}>
				<Text className={styles.cacheLabel}>当前缓存条目：{cacheSize} 条</Text>
				<Button
					size="small"
					variant="danger"
					leadingVisual={TrashIcon}
					onClick={handleClear}
					disabled={cacheSize === 0 || isPending}
				>
					{isPending ? "清除中..." : "清除所有缓存"}
				</Button>
			</div>
			{cleared && (
				<Flash variant="success" className={styles.flash}>
					缓存已清除
				</Flash>
			)}
		</section>
	);
}

function PostAnalysisSettings() {
	return (
		<div className={styles.settingsPanel}>
			<h3 className={styles.panelTitle}>发帖分析设置</h3>
			<PanelVisibilitySection />
			<BlockedForumsSection />
			<CacheManagementSection />
		</div>
	);
}

// ── 用户帖子设置 ──

function HighlightedForumsSection() {
	const highlightedForums = useSettingsStore((s) => s.highlightedForums);
	const addHighlightedForum = useSettingsStore((s) => s.addHighlightedForum);
	const removeHighlightedForum = useSettingsStore(
		(s) => s.removeHighlightedForum,
	);
	const [input, setInput] = useState("");
	const [selectedColor, setSelectedColor] = useState<HighlightColor>("accent");
	const [isPending, startTransition] = useTransition();

	const handleAdd = useCallback(() => {
		const name = input.trim();
		if (!name) return;
		startTransition(() => addHighlightedForum(name, selectedColor));
		setInput("");
	}, [input, selectedColor, addHighlightedForum, startTransition]);

	const handleRemove = useCallback(
		(name: string) => {
			startTransition(() => removeHighlightedForum(name));
		},
		[removeHighlightedForum, startTransition],
	);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>标记贴吧</h4>
			<p className={styles.sectionDesc}>标记的贴吧在用户帖子列表中会高亮显示</p>
			<div className={styles.addRow}>
				<TextInput
					size="small"
					placeholder="输入贴吧名..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAdd();
					}}
					className={styles.addInput}
				/>
				<ColorPickerMenu selected={selectedColor} onChange={setSelectedColor} />
				<Button size="small" onClick={handleAdd}>
					添加
				</Button>
			</div>
			{highlightedForums.length === 0 ? (
				<p className={styles.emptyHint}>暂无标记贴吧</p>
			) : (
				<ul className={styles.tagList} style={{ opacity: isPending ? 0.6 : 1 }}>
					{highlightedForums.map(({ name, color }) => (
						<li key={name} className={styles.tag}>
							<ColorDot color={color} />
							<span>{name}吧</span>
							<button
								type="button"
								className={styles.tagRemove}
								aria-label={`移除 ${name}`}
								onClick={() => handleRemove(name)}
							>
								<XIcon size={12} />
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function HighlightedUsersSection() {
	const highlightedUsers = useSettingsStore((s) => s.highlightedUsers);
	const addHighlightedUser = useSettingsStore((s) => s.addHighlightedUser);
	const removeHighlightedUser = useSettingsStore(
		(s) => s.removeHighlightedUser,
	);
	const [input, setInput] = useState("");
	const [selectedColor, setSelectedColor] = useState<HighlightColor>("accent");
	const [isPending, startTransition] = useTransition();

	const handleAdd = useCallback(() => {
		const name = input.trim();
		if (!name) return;
		startTransition(() => addHighlightedUser(name, selectedColor));
		setInput("");
	}, [input, selectedColor, addHighlightedUser, startTransition]);

	const handleRemove = useCallback(
		(name: string) => {
			startTransition(() => removeHighlightedUser(name));
		},
		[removeHighlightedUser, startTransition],
	);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>标记用户</h4>
			<p className={styles.sectionDesc}>
				当帖子回复了标记的用户时，该帖子会高亮显示
			</p>
			<div className={styles.addRow}>
				<TextInput
					size="small"
					placeholder="输入用户名..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAdd();
					}}
					className={styles.addInput}
				/>
				<ColorPickerMenu selected={selectedColor} onChange={setSelectedColor} />
				<Button size="small" onClick={handleAdd}>
					添加
				</Button>
			</div>
			{highlightedUsers.length === 0 ? (
				<p className={styles.emptyHint}>暂无标记用户</p>
			) : (
				<ul className={styles.tagList} style={{ opacity: isPending ? 0.6 : 1 }}>
					{highlightedUsers.map(({ name, color }) => (
						<li key={name} className={styles.tag}>
							<ColorDot color={color} />
							<span>{name}</span>
							<button
								type="button"
								className={styles.tagRemove}
								aria-label={`移除 ${name}`}
								onClick={() => handleRemove(name)}
							>
								<XIcon size={12} />
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function HighlightedKeywordsSection() {
	const highlightedKeywords = useSettingsStore((s) => s.highlightedKeywords);
	const addHighlightedKeyword = useSettingsStore(
		(s) => s.addHighlightedKeyword,
	);
	const removeHighlightedKeyword = useSettingsStore(
		(s) => s.removeHighlightedKeyword,
	);
	const [input, setInput] = useState("");
	const [selectedColor, setSelectedColor] =
		useState<HighlightColor>("attention");
	const [isPending, startTransition] = useTransition();

	const handleAdd = useCallback(() => {
		const keyword = input.trim();
		if (!keyword) return;
		startTransition(() => addHighlightedKeyword(keyword, selectedColor));
		setInput("");
	}, [input, selectedColor, addHighlightedKeyword, startTransition]);

	const handleRemove = useCallback(
		(keyword: string) => {
			startTransition(() => removeHighlightedKeyword(keyword));
		},
		[removeHighlightedKeyword, startTransition],
	);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>高亮关键词</h4>
			<p className={styles.sectionDesc}>
				帖子内容中包含的关键词会以对应颜色高亮显示
			</p>
			<div className={styles.addRow}>
				<TextInput
					size="small"
					placeholder="输入关键词..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAdd();
					}}
					className={styles.addInput}
				/>
				<ColorPickerMenu
					selected={selectedColor}
					onChange={setSelectedColor}
					side="outside-top"
				/>
				<Button size="small" onClick={handleAdd}>
					添加
				</Button>
			</div>
			{highlightedKeywords.length === 0 ? (
				<p className={styles.emptyHint}>暂无高亮关键词</p>
			) : (
				<ul className={styles.tagList} style={{ opacity: isPending ? 0.6 : 1 }}>
					{highlightedKeywords.map(({ keyword, color }) => (
						<li key={keyword} className={styles.tag}>
							<ColorDot color={color} />
							<span>{keyword}</span>
							<button
								type="button"
								className={styles.tagRemove}
								aria-label={`移除 ${keyword}`}
								onClick={() => handleRemove(keyword)}
							>
								<XIcon size={12} />
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function UserPostSettings() {
	return (
		<div className={styles.settingsPanel}>
			<h3 className={styles.panelTitle}>用户帖子设置</h3>
			<HighlightedForumsSection />
			<HighlightedUsersSection />
			<HighlightedKeywordsSection />
		</div>
	);
}

// ── 贴吧分析设置 ──

function ForumPanelVisibilitySection() {
	const panelVisibility = useSettingsStore((s) => s.forumPanelVisibility);
	const togglePanel = useSettingsStore((s) => s.toggleForumPanel);
	const [isPending, startTransition] = useTransition();

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>面板显隐控制</h4>
			<p className={styles.sectionDesc}>控制贴吧分析页面中各面板的显示与隐藏</p>
			<div
				className={styles.toggleList}
				style={{ opacity: isPending ? 0.6 : 1 }}
			>
				{FORUM_PANEL_IDS.map((id) => {
					const labelId = `forum-panel-label-${id}`;
					return (
						<div key={id} className={styles.toggleRow}>
							<Text id={labelId} className={styles.toggleLabel}>
								{FORUM_PANEL_LABELS[id]}
							</Text>
							<ToggleSwitch
								size="small"
								checked={panelVisibility[id]}
								onClick={() => startTransition(() => togglePanel(id))}
								aria-labelledby={labelId}
							/>
						</div>
					);
				})}
			</div>
		</section>
	);
}

function BlockedWordCloudSection() {
	const keywords = useSettingsStore((s) => s.blockedWordCloudKeywords);
	const addKeyword = useSettingsStore((s) => s.addBlockedWordCloudKeyword);
	const removeKeyword = useSettingsStore(
		(s) => s.removeBlockedWordCloudKeyword,
	);
	const [input, setInput] = useState("");
	const [isPending, startTransition] = useTransition();

	const handleAdd = useCallback(() => {
		const kw = input.trim();
		if (!kw) return;
		startTransition(() => addKeyword(kw));
		setInput("");
	}, [input, addKeyword, startTransition]);

	const handleRemove = useCallback(
		(kw: string) => {
			startTransition(() => removeKeyword(kw));
		},
		[removeKeyword, startTransition],
	);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>词云屏蔽关键词</h4>
			<p className={styles.sectionDesc}>
				被屏蔽的关键词将从所有词云图中过滤（发帖分析、贴吧分析），后端已提前过滤常见停用词（单字虚词、标点等）
			</p>
			<div className={styles.addRow}>
				<TextInput
					size="small"
					placeholder="输入关键词..."
					value={input}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleAdd();
					}}
					className={styles.addInput}
				/>
				<Button size="small" onClick={handleAdd}>
					添加
				</Button>
			</div>
			{keywords.length === 0 ? (
				<p className={styles.emptyHint}>暂无屏蔽关键词</p>
			) : (
				<ul className={styles.tagList} style={{ opacity: isPending ? 0.6 : 1 }}>
					{keywords.map((kw) => (
						<li key={kw} className={styles.tag}>
							<span>{kw}</span>
							<button
								type="button"
								className={styles.tagRemove}
								aria-label={`移除 ${kw}`}
								onClick={() => handleRemove(kw)}
							>
								<XIcon size={12} />
							</button>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}

function ForumTopUsersSection() {
	const count = useSettingsStore((s) => s.forumTopUsersCount);
	const setCount = useSettingsStore((s) => s.setForumTopUsersCount);
	const [localValue, setLocalValue] = useState(String(count));

	const handleConfirm = useCallback(() => {
		const n = Number(localValue) || 30;
		setCount(n);
		setLocalValue(String(Math.max(5, Math.min(30, n))));
	}, [localValue, setCount]);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>活跃用户显示人数</h4>
			<p className={styles.sectionDesc}>
				设置活跃用户排行榜显示的人数（5–30），按 Enter 确认
			</p>
			<div className={styles.addRow}>
				<TextInput
					size="small"
					type="number"
					min={5}
					max={30}
					value={localValue}
					onChange={(e) => setLocalValue(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter") handleConfirm();
					}}
					onBlur={handleConfirm}
					className={styles.addInput}
					aria-label="显示人数"
				/>
				<Text className={styles.cacheLabel}>（默认 30）</Text>
			</div>
		</section>
	);
}

function ForumLevelMergeSection() {
	const merged = useSettingsStore((s) => s.forumMergeHighLevels);
	const toggle = useSettingsStore((s) => s.toggleForumMergeHighLevels);
	const [isPending, startTransition] = useTransition();
	const labelId = "forum-merge-level-label";

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>等级分布合并高等级</h4>
			<p className={styles.sectionDesc}>
				开启后将 12 级以上的用户合并为「Lv.12+」显示
			</p>
			<div
				className={styles.toggleRow}
				style={{ opacity: isPending ? 0.6 : 1 }}
			>
				<Text id={labelId} className={styles.toggleLabel}>
					合并 Lv.12 以上
				</Text>
				<ToggleSwitch
					size="small"
					checked={merged}
					onClick={() => startTransition(() => toggle())}
					aria-labelledby={labelId}
				/>
			</div>
		</section>
	);
}

function HotUserWeightsSection() {
	const weights = useSettingsStore((s) => s.hotUserWeights);
	const setWeights = useSettingsStore((s) => s.setHotUserWeights);
	const [local, setLocal] = useState(weights);

	const handleBlur = useCallback(() => {
		const clamped = {
			thread: Math.max(0, local.thread),
			reply: Math.max(0, local.reply),
			agree: Math.max(0, local.agree),
		};
		setLocal(clamped);
		setWeights(clamped);
	}, [local, setWeights]);

	const handleKey = useCallback(
		(e: React.KeyboardEvent) => {
			if (e.key === "Enter") handleBlur();
		},
		[handleBlur],
	);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>热门吧友权重</h4>
			<p className={styles.sectionDesc}>
				热度分 = 主题贴×权重 + 回复×权重 + 获赞×权重，按 Enter 或失焦确认
			</p>
			<div className={styles.weightsRow}>
				<span className={styles.weightItem}>
					主题贴
					<TextInput
						size="small"
						type="number"
						min={0}
						step={0.5}
						value={String(local.thread)}
						onChange={(e) =>
							setLocal((p) => ({ ...p, thread: Number(e.target.value) || 0 }))
						}
						onBlur={handleBlur}
						onKeyDown={handleKey}
						className={styles.weightInput}
						aria-label="主题贴权重"
					/>
				</span>
				<span className={styles.weightItem}>
					回复
					<TextInput
						size="small"
						type="number"
						min={0}
						step={0.5}
						value={String(local.reply)}
						onChange={(e) =>
							setLocal((p) => ({ ...p, reply: Number(e.target.value) || 0 }))
						}
						onBlur={handleBlur}
						onKeyDown={handleKey}
						className={styles.weightInput}
						aria-label="回复权重"
					/>
				</span>
				<span className={styles.weightItem}>
					获赞
					<TextInput
						size="small"
						type="number"
						min={0}
						step={0.1}
						value={String(local.agree)}
						onChange={(e) =>
							setLocal((p) => ({ ...p, agree: Number(e.target.value) || 0 }))
						}
						onBlur={handleBlur}
						onKeyDown={handleKey}
						className={styles.weightInput}
						aria-label="获赞权重"
					/>
				</span>
			</div>
		</section>
	);
}

function ForumAnalysisSettings() {
	return (
		<div className={styles.settingsPanel}>
			<h3 className={styles.panelTitle}>贴吧分析设置</h3>
			<ForumPanelVisibilitySection />
			<ForumTopUsersSection />
			<ForumLevelMergeSection />
			<HotUserWeightsSection />
		</div>
	);
}

// ── 全局设置 ──

function ImageConcurrencySection() {
	const maxImageConcurrency = useSettingsStore((s) => s.maxImageConcurrency);
	const setMaxImageConcurrency = useSettingsStore(
		(s) => s.setMaxImageConcurrency,
	);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>外链图片并发数</h4>
			<p className={styles.sectionDesc}>
				限制同时加载的外部图片数量（如头像），降低此值可减少被目标服务器限流的概率
			</p>
			<div className={styles.addRow}>
				<TextInput
					size="small"
					type="number"
					min={1}
					max={100}
					value={String(maxImageConcurrency)}
					onChange={(e) => setMaxImageConcurrency(Number(e.target.value) || 20)}
					className={styles.addInput}
					aria-label="最大并发数"
				/>
				<Text className={styles.cacheLabel}>（默认 20，范围 1–100）</Text>
			</div>
		</section>
	);
}

function BackendNodeSection() {
	const backendPreference = useSettingsStore((s) => s.backendPreference);
	const setBackendPreference = useSettingsStore((s) => s.setBackendPreference);
	const activeBackend = useSettingsStore((s) => s.activeBackend);
	const backendChecking = useSettingsStore((s) => s.backendChecking);
	const backendProbeMessage = useSettingsStore((s) => s.backendProbeMessage);
	const backendProbeAt = useSettingsStore((s) => s.backendProbeAt);
	const [isPending, startTransition] = useTransition();

	const runProbe = useCallback(() => {
		void ensureBackendReady(true);
	}, []);

	return (
		<section className={styles.section}>
			<h4 className={styles.sectionTitle}>后端节点</h4>
			<p className={styles.sectionDesc}>
				选择请求使用的后端节点。自动/生产模式会优先检测北京生产节点，不可用时自动切换到
				CF 备用节点
			</p>
			<div className={styles.addRow} style={{ opacity: isPending ? 0.7 : 1 }}>
				<Select
					size="small"
					value={backendPreference}
					onChange={(e) => {
						const value = e.target.value;
						if (!isBackendPreference(value)) return;
						startTransition(() => {
							setBackendPreference(value);
						});
						void ensureBackendReady(true);
					}}
					className={styles.addInput}
					aria-label="后端节点偏好"
				>
					{BACKEND_PREFERENCE_OPTIONS.map((item) => (
						<Select.Option key={item} value={item}>
							{BACKEND_PREFERENCE_LABELS[item]}
						</Select.Option>
					))}
				</Select>
				<Button size="small" onClick={runProbe} disabled={backendChecking}>
					{backendChecking ? "检测中..." : "重新检测"}
				</Button>
			</div>
			<p className={styles.cacheLabel}>
				当前节点：{BACKEND_NODE_LABELS[activeBackend]} ·
				{backendProbeAt
					? ` 上次检测 ${new Date(backendProbeAt).toLocaleTimeString()}`
					: " 尚未检测"}
			</p>
			<p className={styles.sectionDesc} style={{ marginBottom: 0 }}>
				{backendProbeMessage}
			</p>
		</section>
	);
}

function GlobalSettings() {
	return (
		<div className={styles.settingsPanel}>
			<h3 className={styles.panelTitle}>全局设置</h3>
			<BackendNodeSection />
			<ImageConcurrencySection />
			<BlockedWordCloudSection />
			<section className={styles.section}>
				<h4 className={styles.sectionTitle}>其他</h4>
				<p className={styles.sectionDesc}>
					自定义 BDUSS、查询历史记录等功能即将推出
				</p>
			</section>
		</div>
	);
}

// ── 关于 ──

function AboutSettings() {
	return (
		<div className={styles.aboutSection}>
			<h3>关于 eztb</h3>
			<p>版本：v3.0.0-dev</p>
			<p>
				GitHub：
				<a
					href="https://github.com/Dilettante258/tieba-toolbox"
					target="_blank"
					rel="noopener noreferrer"
				>
					Dilettante258/tieba-toolbox
				</a>
			</p>
			<p>一个贴吧工具箱，用于查看和分析贴吧用户数据。</p>
		</div>
	);
}

// ── 主 Dialog ──

const PANELS: Record<SettingsTab, React.ComponentType> = {
	postanalysis: PostAnalysisSettings,
	forumanalysis: ForumAnalysisSettings,
	userpost: UserPostSettings,
	global: GlobalSettings,
	about: AboutSettings,
};

export function SettingsDialog() {
	const { settingsOpen, closeSettings, settingsTab, setSettingsTab } =
		useSettingsStore();

	if (!settingsOpen) return null;

	const Panel = PANELS[settingsTab];

	return (
		<Dialog title="设置" onClose={() => closeSettings()} width="xlarge">
			<div className={styles.splitLayout}>
				<nav className={styles.sidebar}>
					<NavList>
						{TABS.map((tab) => (
							<NavList.Item
								key={tab.id}
								aria-current={settingsTab === tab.id ? "page" : undefined}
								onClick={() => setSettingsTab(tab.id)}
							>
								<NavList.LeadingVisual>{tab.icon}</NavList.LeadingVisual>
								{tab.label}
							</NavList.Item>
						))}
					</NavList>
				</nav>
				<div className={styles.content}>
					<Panel />
				</div>
			</div>
		</Dialog>
	);
}
