import { create } from "zustand";
import type {
	AnalysisForumType,
	AnalysisRequest,
	CrossTypeUser,
} from "../components/DbAnalyze/analysis-types.ts";

type MatchMode = AnalysisRequest["matchMode"];

interface DbAnalyzeExploreState {
	selectedTypeIds: Set<string>;
	selectedForumIds: Set<string>;
	keywords: string[];
	matchMode: MatchMode;
	request: AnalysisRequest | null;
	drawerUser: CrossTypeUser | null;
	validationError: string;
	toggleType: (type: AnalysisForumType) => void;
	setSelectedForumIds: (ids: Set<string>) => void;
	setKeywords: (keywords: string[]) => void;
	setMatchMode: (mode: MatchMode) => void;
	setDrawerUser: (user: CrossTypeUser | null) => void;
	submitAnalysis: (types: AnalysisForumType[]) => void;
	reset: () => void;
}

export const useDbAnalyzeExploreStore = create<DbAnalyzeExploreState>()(
	(set, get) => ({
		selectedTypeIds: new Set(),
		selectedForumIds: new Set(),
		keywords: [],
		matchMode: "any",
		request: null,
		drawerUser: null,
		validationError: "",
		toggleType: (type) =>
			set((state) => {
				const selectedTypeIds = new Set(state.selectedTypeIds);
				const selectedForumIds = new Set(state.selectedForumIds);
				if (selectedTypeIds.has(type.id)) {
					selectedTypeIds.delete(type.id);
				} else {
					selectedTypeIds.add(type.id);
					for (const forumId of type.forumIds) selectedForumIds.add(forumId);
				}
				return { selectedTypeIds, selectedForumIds };
			}),
		setSelectedForumIds: (selectedForumIds) =>
			set({ selectedForumIds: new Set(selectedForumIds) }),
		setKeywords: (keywords) => set({ keywords }),
		setMatchMode: (matchMode) => set({ matchMode }),
		setDrawerUser: (drawerUser) => set({ drawerUser }),
		reset: () =>
			set({
				selectedTypeIds: new Set(),
				selectedForumIds: new Set(),
				keywords: [],
				matchMode: "any",
				request: null,
				drawerUser: null,
				validationError: "",
			}),
		submitAnalysis: (types) => {
			const state = get();
			if (state.selectedTypeIds.size < 2) {
				set({ validationError: "请至少选择两个吧类型" });
				return;
			}
			if (state.selectedForumIds.size === 0) {
				set({ validationError: "请至少选择一个贴吧" });
				return;
			}

			const typeMap = new Map(types.map((type) => [type.id, type]));
			const coveredTypeCount = [...state.selectedTypeIds].filter((id) =>
				typeMap
					.get(id)
					?.forumIds.some((forumId) => state.selectedForumIds.has(forumId)),
			).length;
			if (coveredTypeCount < 2) {
				set({
					validationError: "当前分析范围必须实际覆盖至少两个所选类型",
				});
				return;
			}

			set({
				validationError: "",
				request: {
					typeIds: [...state.selectedTypeIds],
					forumIds: [...state.selectedForumIds],
					keywords: [...state.keywords],
					matchMode: state.matchMode,
				},
			});
		},
	}),
);
