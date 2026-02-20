import { create } from "zustand";

export interface UPSelectorStore {
	prevChange: "year" | "date" | "forum";
	lastChange: "year" | "date" | "forum";
	selectedDate: string;
	selectedYear: number | "ALL";
	selectedForums: string[];
	setSelectedDate: (value: string) => void;
	setSelectedYear: (value: UPSelectorStore["selectedYear"]) => void;
	setSelectedForums: (value: string[]) => void;
	clearForumFilter: () => void;
}

export const useUPSelectorStore = create<UPSelectorStore>((set) => ({
	prevChange: "year",
	lastChange: "year",
	selectedDate: "",
	selectedYear: new Date().getFullYear(),
	selectedForums: [],
	setSelectedDate: (value) => set({ selectedDate: value, lastChange: "date" }),
	setSelectedYear: (value) => set({ selectedYear: value, lastChange: "year" }),
	setSelectedForums: (value) =>
		set((state) => ({
			...state,
			selectedForums: value,
			prevChange: state.lastChange,
			lastChange: "forum",
		})),
	clearForumFilter: () => set({ selectedForums: [], lastChange: "year" }),
}));
