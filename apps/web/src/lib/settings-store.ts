import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SettingsTab = "postanalysis" | "global" | "about";

interface SettingsStore {
	// Dialog 控制（不持久化）
	settingsOpen: boolean;
	openSettings: () => void;
	closeSettings: () => void;

	// 当前选中的设置页（持久化）
	settingsTab: SettingsTab;
	setSettingsTab: (tab: SettingsTab) => void;
}

export const useSettingsStore = create<SettingsStore>()(
	persist(
		(set) => ({
			settingsOpen: false,
			openSettings: () => set({ settingsOpen: true }),
			closeSettings: () => set({ settingsOpen: false }),

			settingsTab: "postanalysis",
			setSettingsTab: (tab) => set({ settingsTab: tab }),
		}),
		{
			name: "tieba-settings",
			// 只持久化 tab 选择，不持久化 dialog 开关
			partialize: (state) => ({ settingsTab: state.settingsTab }),
		},
	),
);
