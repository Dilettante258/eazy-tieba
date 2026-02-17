// ── Primer 数据可视化调色板 ──
// 来源：@primer/primitives data visualization tokens
// 顺序按色相区分度排列，确保相邻类别视觉可辨

const light = {
	palette: [
		"#006edb", // blue
		// "#df0c24", // red
		"#30a147", // green
		"#894ceb", // purple
		"#eb670f", // orange
		"#179b9b", // teal
		"#ce2c85", // pink
		"#b88700", // yellow
		"#9d615c", // auburn
		"#808fa3", // gray
	],
	scatter: "#006edb",
};

const dark = {
	palette: [
		"#0576ff", // blue
		// "#eb3342", // red
		"#2f6f37", // green
		"#975bf1", // purple
		"#984b10", // orange
		"#106c70", // teal
		"#d34591", // pink
		"#895906", // yellow
		"#a86f6b", // auburn
		"#576270", // gray
	],
	scatter: "#0576ff",
};

/** 根据当前主题获取图表配色。 */
export function getChartColors(isDark: boolean) {
	return isDark ? dark : light;
}
