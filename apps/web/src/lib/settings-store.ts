import { create } from "zustand";
import { persist } from "zustand/middleware";
import { imagePool } from "./image-pool.ts";
import { HIGHLIGHT_COLORS, type HighlightColor } from "./highlight.ts";
import {
	isBackendPreference,
	type BackendNode,
	type BackendPreference,
} from "./backend-config.ts";

export type SettingsTab =
	| "postanalysis"
	| "forumanalysis"
	| "userpost"
	| "global"
	| "about";

/** 带颜色的标记项 */
export interface HighlightedForum {
	name: string;
	color: HighlightColor;
}

export interface HighlightedUser {
	name: string;
	color: HighlightColor;
}

export interface HighlightedKeyword {
	keyword: string;
	color: HighlightColor;
}

/** 发帖分析页面中可控制显隐的面板 */
export type PanelId =
	| "heatmap"
	| "postList"
	| "pieChart"
	| "scatterChart"
	| "flowChart"
	| "wordCloud";

export const PANEL_LABELS: Record<PanelId, string> = {
	heatmap: "发帖热力图",
	postList: "帖子列表",
	pieChart: "贴吧分布饼图",
	scatterChart: "发帖时间散点图",
	flowChart: "年份×贴吧分布",
	wordCloud: "高频词云",
};

/** 贴吧分析页面中可控制显隐的面板 */
export type ForumPanelId =
	| "ipMap"
	| "topUsers"
	| "threadHeat"
	| "wordCloud"
	| "levelChart"
	| "timeScatter"
	| "ipChanged"
	| "topLikedPosts"
	| "topRepliedThreads"
	| "hotUsers";

export const FORUM_PANEL_LABELS: Record<ForumPanelId, string> = {
	ipMap: "IP 属地分布",
	topUsers: "活跃用户排行",
	threadHeat: "帖子热度分布",
	wordCloud: "高频词云",
	levelChart: "用户等级分布",
	timeScatter: "发帖时间分布",
	ipChanged: "IP 属地变动用户",
	topLikedPosts: "点赞最多的帖子",
	topRepliedThreads: "回复最多的帖子",
	hotUsers: "热门吧友",
};

interface SettingsStore {
	// Dialog 控制（不持久化）
	settingsOpen: boolean;
	openSettings: () => void;
	closeSettings: () => void;

	// 当前选中的设置页（持久化）
	settingsTab: SettingsTab;
	setSettingsTab: (tab: SettingsTab) => void;

	// 面板显隐控制（持久化）
	panelVisibility: Record<PanelId, boolean>;
	togglePanel: (id: PanelId) => void;

	// 屏蔽贴吧管理（持久化）
	blockedForums: string[];
	addBlockedForum: (name: string) => void;
	removeBlockedForum: (name: string) => void;

	// 标记贴吧（持久化）
	highlightedForums: HighlightedForum[];
	addHighlightedForum: (name: string, color: HighlightColor) => void;
	removeHighlightedForum: (name: string) => void;

	// 标记用户（持久化）
	highlightedUsers: HighlightedUser[];
	addHighlightedUser: (name: string, color: HighlightColor) => void;
	removeHighlightedUser: (name: string) => void;

	// 高亮关键词（持久化）
	highlightedKeywords: HighlightedKeyword[];
	addHighlightedKeyword: (keyword: string, color: HighlightColor) => void;
	removeHighlightedKeyword: (keyword: string) => void;

	// ── 贴吧分析设置（持久化） ──

	// 面板显隐
	forumPanelVisibility: Record<ForumPanelId, boolean>;
	toggleForumPanel: (id: ForumPanelId) => void;

	// 词云屏蔽关键词
	blockedWordCloudKeywords: string[];
	addBlockedWordCloudKeyword: (keyword: string) => void;
	removeBlockedWordCloudKeyword: (keyword: string) => void;

	// 活跃用户 Top N（5–30）
	forumTopUsersCount: number;
	setForumTopUsersCount: (n: number) => void;

	// 等级分布合并高等级（12 级以上归为 12+）
	forumMergeHighLevels: boolean;
	toggleForumMergeHighLevels: () => void;

	// 热门吧友权重（持久化）
	hotUserWeights: { thread: number; reply: number; agree: number };
	setHotUserWeights: (weights: {
		thread: number;
		reply: number;
		agree: number;
	}) => void;

	// 外链图片并发数（持久化）
	maxImageConcurrency: number;
	setMaxImageConcurrency: (n: number) => void;

	// 后端节点偏好（持久化）
	backendPreference: BackendPreference;
	setBackendPreference: (preference: BackendPreference) => void;

	// 当前生效节点（运行时）
	activeBackend: BackendNode;
	backendChecking: boolean;
	backendProbeMessage: string;
	backendProbeAt: number | null;
}

const DEFAULT_VISIBILITY: Record<PanelId, boolean> = {
	heatmap: true,
	postList: true,
	pieChart: true,
	scatterChart: true,
	flowChart: true,
	wordCloud: true,
};

const DEFAULT_FORUM_VISIBILITY: Record<ForumPanelId, boolean> = {
	ipMap: true,
	topUsers: true,
	threadHeat: true,
	wordCloud: true,
	levelChart: true,
	timeScatter: true,
	ipChanged: true,
	topLikedPosts: true,
	topRepliedThreads: true,
	hotUsers: true,
};

/** 迁移辅助：将 string[] 转为带默认颜色的对象数组 */
function migrateStringArray<T>(
	arr: unknown,
	toObj: (s: string) => T,
): T[] | undefined {
	if (Array.isArray(arr) && arr.length > 0 && typeof arr[0] === "string") {
		return (arr as string[]).map(toObj);
	}
	return undefined;
}

export const useSettingsStore = create<SettingsStore>()(
	persist(
		(set) => ({
			settingsOpen: false,
			openSettings: () => set({ settingsOpen: true }),
			closeSettings: () => set({ settingsOpen: false }),

			settingsTab: "postanalysis",
			setSettingsTab: (tab) => set({ settingsTab: tab }),

			panelVisibility: { ...DEFAULT_VISIBILITY },
			togglePanel: (id) =>
				set((s) => ({
					panelVisibility: {
						...s.panelVisibility,
						[id]: !s.panelVisibility[id],
					},
				})),

			blockedForums: [],
			addBlockedForum: (name) =>
				set((s) => ({
					blockedForums: s.blockedForums.includes(name)
						? s.blockedForums
						: [...s.blockedForums, name],
				})),
			removeBlockedForum: (name) =>
				set((s) => ({
					blockedForums: s.blockedForums.filter((f) => f !== name),
				})),

			highlightedForums: [],
			addHighlightedForum: (name, color) =>
				set((s) => ({
					highlightedForums: s.highlightedForums.some((f) => f.name === name)
						? s.highlightedForums
						: [...s.highlightedForums, { name, color }],
				})),
			removeHighlightedForum: (name) =>
				set((s) => ({
					highlightedForums: s.highlightedForums.filter((f) => f.name !== name),
				})),

			highlightedUsers: [],
			addHighlightedUser: (name, color) =>
				set((s) => ({
					highlightedUsers: s.highlightedUsers.some((u) => u.name === name)
						? s.highlightedUsers
						: [...s.highlightedUsers, { name, color }],
				})),
			removeHighlightedUser: (name) =>
				set((s) => ({
					highlightedUsers: s.highlightedUsers.filter((u) => u.name !== name),
				})),

			highlightedKeywords: [],
			addHighlightedKeyword: (keyword, color) =>
				set((s) => ({
					highlightedKeywords: s.highlightedKeywords.some(
						(k) => k.keyword === keyword,
					)
						? s.highlightedKeywords
						: [...s.highlightedKeywords, { keyword, color }],
				})),
			removeHighlightedKeyword: (keyword) =>
				set((s) => ({
					highlightedKeywords: s.highlightedKeywords.filter(
						(k) => k.keyword !== keyword,
					),
				})),

			forumPanelVisibility: { ...DEFAULT_FORUM_VISIBILITY },
			toggleForumPanel: (id) =>
				set((s) => ({
					forumPanelVisibility: {
						...s.forumPanelVisibility,
						[id]: !s.forumPanelVisibility[id],
					},
				})),

			blockedWordCloudKeywords: [],
			addBlockedWordCloudKeyword: (keyword) =>
				set((s) => ({
					blockedWordCloudKeywords: s.blockedWordCloudKeywords.includes(keyword)
						? s.blockedWordCloudKeywords
						: [...s.blockedWordCloudKeywords, keyword],
				})),
			removeBlockedWordCloudKeyword: (keyword) =>
				set((s) => ({
					blockedWordCloudKeywords: s.blockedWordCloudKeywords.filter(
						(k) => k !== keyword,
					),
				})),

			forumTopUsersCount: 30,
			setForumTopUsersCount: (n) =>
				set({ forumTopUsersCount: Math.max(5, Math.min(30, n)) }),

			forumMergeHighLevels: true,
			toggleForumMergeHighLevels: () =>
				set((s) => ({ forumMergeHighLevels: !s.forumMergeHighLevels })),

			hotUserWeights: { thread: 5, reply: 1, agree: 0.5 },
			setHotUserWeights: (weights) => set({ hotUserWeights: weights }),

			maxImageConcurrency: 20,
			setMaxImageConcurrency: (n) => {
				const clamped = Math.max(1, Math.min(100, n));
				imagePool.setLimit(clamped);
				set({ maxImageConcurrency: clamped });
			},

			backendPreference: "auto",
			setBackendPreference: (preference) =>
				set({ backendPreference: preference }),
			activeBackend: "domestic",
			backendChecking: false,
			backendProbeMessage: "尚未检测生产节点",
			backendProbeAt: null,
		}),
		{
			name: "tieba-settings",
			version: 3,
			partialize: (state) => ({
				settingsTab: state.settingsTab,
				panelVisibility: state.panelVisibility,
				blockedForums: state.blockedForums,
				highlightedForums: state.highlightedForums,
				highlightedUsers: state.highlightedUsers,
				highlightedKeywords: state.highlightedKeywords,
				forumPanelVisibility: state.forumPanelVisibility,
				blockedWordCloudKeywords: state.blockedWordCloudKeywords,
				forumTopUsersCount: state.forumTopUsersCount,
				forumMergeHighLevels: state.forumMergeHighLevels,
				hotUserWeights: state.hotUserWeights,
				maxImageConcurrency: state.maxImageConcurrency,
				backendPreference: state.backendPreference,
			}),
			migrate: (persisted, version) => {
				const state = persisted as Record<string, unknown>;
				const defaultColor = HIGHLIGHT_COLORS[0]; // "accent"

				// v0 / v1 → v2：string[] → 对象数组
				if (version < 2) {
					const forums = migrateStringArray(
						state.highlightedForums,
						(name) => ({ name, color: defaultColor }),
					);
					if (forums) state.highlightedForums = forums;

					const users = migrateStringArray(state.highlightedUsers, (name) => ({
						name,
						color: defaultColor,
					}));
					if (users) state.highlightedUsers = users;
				}

				// v0 → v2：关键词也是 string[]
				if (version === 0) {
					const keywords = migrateStringArray(
						state.highlightedKeywords,
						(keyword) => ({ keyword, color: defaultColor }),
					);
					if (keywords) state.highlightedKeywords = keywords;
				}

				if (version < 3 && !isBackendPreference(state.backendPreference)) {
					state.backendPreference = "auto";
				}

				return persisted as SettingsStore;
			},
			onRehydrateStorage: () => (state) => {
				if (state?.maxImageConcurrency) {
					imagePool.setLimit(state.maxImageConcurrency);
				}
			},
		},
	),
);
