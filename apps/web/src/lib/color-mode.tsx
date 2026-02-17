import {
	createContext,
	useContext,
	useEffect,
	useState,
	type ReactNode,
} from "react";

type ColorMode = "day" | "night";

const STORAGE_KEY = "color-mode";

/** 读取持久化的主题偏好，若无则跟随系统 */
function getInitialMode(): ColorMode {
	const saved = localStorage.getItem(STORAGE_KEY);
	if (saved === "day" || saved === "night") return saved;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "night"
		: "day";
}

const ColorModeContext = createContext<{
	colorMode: ColorMode;
	isDark: boolean;
	toggleColorMode: () => void;
} | null>(null);

export function ColorModeProvider({ children }: { children: ReactNode }) {
	const [colorMode, setColorMode] = useState<ColorMode>(getInitialMode);

	const toggleColorMode = () => {
		setColorMode((prev) => {
			const next = prev === "day" ? "night" : "day";
			localStorage.setItem(STORAGE_KEY, next);
			return next;
		});
	};

	/* 无持久化偏好时，跟随系统主题变化 */
	useEffect(() => {
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => {
			if (!localStorage.getItem(STORAGE_KEY)) {
				setColorMode(e.matches ? "night" : "day");
			}
		};
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, []);

	return (
		<ColorModeContext.Provider
			value={{ colorMode, isDark: colorMode === "night", toggleColorMode }}
		>
			{children}
		</ColorModeContext.Provider>
	);
}

export function useColorMode() {
	const ctx = useContext(ColorModeContext);
	if (!ctx)
		throw new Error("useColorMode must be used within ColorModeProvider");
	return ctx;
}
