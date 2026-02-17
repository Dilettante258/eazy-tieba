import { VChart } from "@visactor/vchart";
import { useEffect } from "react";
import { useColorMode } from "./color-mode.tsx";

/** 监听暗色模式变化，全局切换 VChart 主题 */
export function useVChartThemeSync() {
	const { isDark } = useColorMode();
	useEffect(() => {
		VChart.ThemeManager.setCurrentTheme(isDark ? "dark" : "light");
	}, [isDark]);
}
