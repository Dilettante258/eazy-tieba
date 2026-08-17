import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
} from "react";
import { type ThemePreference, useSettingsStore } from "./settings-store.ts";

type ColorMode = "day" | "night";
const SESSION_KEY = "color-mode-session";

function getSessionMode(): ColorMode | null {
	const mode = sessionStorage.getItem(SESSION_KEY);
	return mode === "day" || mode === "night" ? mode : null;
}

function getSystemMode(): ColorMode {
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "night"
		: "day";
}

function resolvePreference(preference: ThemePreference): ColorMode {
	return preference === "system" ? getSystemMode() : preference;
}

const ColorModeContext = createContext<{
	colorMode: ColorMode;
	isDark: boolean;
	toggleColorMode: () => void;
} | null>(null);

export function ColorModeProvider({ children }: { children: ReactNode }) {
	const themePreference = useSettingsStore((state) => state.themePreference);
	const previousPreference = useRef(themePreference);
	const [colorMode, setColorMode] = useState<ColorMode>(
		() => getSessionMode() ?? resolvePreference(themePreference),
	);

	/* 设置页偏好发生变化时，清除当前 session 的临时覆盖。 */
	useLayoutEffect(() => {
		if (previousPreference.current === themePreference) return;
		previousPreference.current = themePreference;
		sessionStorage.removeItem(SESSION_KEY);
		setColorMode(resolvePreference(themePreference));
	}, [themePreference]);

	/* 让 Primer 的主题 token 直接定义在 html 上，而不是仅存在于内部 div。 */
	useLayoutEffect(() => {
		const root = document.documentElement;
		root.dataset.colorMode = colorMode === "night" ? "dark" : "light";
		root.dataset.lightTheme = "light";
		root.dataset.darkTheme = "dark";
	}, [colorMode]);

	const toggleColorMode = () => {
		setColorMode((prev) => {
			const next = prev === "day" ? "night" : "day";
			sessionStorage.setItem(SESSION_KEY, next);
			return next;
		});
	};

	/* 长期偏好为“跟随系统”时，响应系统主题变化。 */
	useEffect(() => {
		if (themePreference !== "system") return;
		const mql = window.matchMedia("(prefers-color-scheme: dark)");
		const handler = (e: MediaQueryListEvent) => {
			if (!getSessionMode()) setColorMode(e.matches ? "night" : "day");
		};
		mql.addEventListener("change", handler);
		return () => mql.removeEventListener("change", handler);
	}, [themePreference]);

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
