/**
 * CSS Custom Highlight API 工具函数
 *
 * 在指定容器内的所有文本节点中查找匹配的关键词，
 * 并通过 CSS Custom Highlight API 进行高亮标记。
 */

/** 可用的高亮颜色，对应 Primer 功能色 */
export const HIGHLIGHT_COLORS = [
	"accent",
	"success",
	"attention",
	"severe",
	"danger",
	"done",
	"sponsors",
] as const;

export type HighlightColor = (typeof HIGHLIGHT_COLORS)[number];

/** 颜色中文标签 */
export const HIGHLIGHT_COLOR_LABELS: Record<HighlightColor, string> = {
	accent: "蓝色",
	success: "绿色",
	attention: "黄色",
	severe: "橙色",
	danger: "红色",
	done: "紫色",
	sponsors: "粉色",
};

/** 在容器内高亮所有匹配的搜索词（单色） */
export function applyHighlight(
	name: string,
	container: HTMLElement | null,
	terms: string[],
) {
	if (!("highlights" in CSS)) return;
	CSS.highlights.delete(name);
	if (!container || terms.length === 0) return;

	// 过滤空字符串
	const validTerms = terms.filter(Boolean);
	if (validTerms.length === 0) return;

	const highlight = new Highlight();
	const walker = document.createTreeWalker(
		container,
		NodeFilter.SHOW_TEXT,
	);
	let node: Text | null;
	while ((node = walker.nextNode() as Text | null)) {
		const text = node.textContent ?? "";
		for (const term of validTerms) {
			let idx = text.indexOf(term);
			while (idx !== -1) {
				const range = new Range();
				range.setStart(node, idx);
				range.setEnd(node, idx + term.length);
				highlight.add(range);
				idx = text.indexOf(term, idx + term.length);
			}
		}
	}

	if (highlight.size > 0) {
		CSS.highlights.set(name, highlight);
	}
}

/** 在容器内按颜色分组高亮关键词（多色） */
export function applyColoredHighlights(
	prefix: string,
	container: HTMLElement | null,
	items: Array<{ term: string; color: HighlightColor }>,
) {
	if (!("highlights" in CSS)) return;

	// 清除所有颜色变体
	for (const color of HIGHLIGHT_COLORS) {
		CSS.highlights.delete(`${prefix}-${color}`);
	}

	if (!container || items.length === 0) return;

	// 按颜色分组
	const groups = new Map<HighlightColor, string[]>();
	for (const { term, color } of items) {
		if (!term) continue;
		const arr = groups.get(color) ?? [];
		arr.push(term);
		groups.set(color, arr);
	}

	if (groups.size === 0) return;

	// 遍历一次 DOM 树，收集各颜色的 Range
	const highlights = new Map<HighlightColor, Highlight>();
	const walker = document.createTreeWalker(
		container,
		NodeFilter.SHOW_TEXT,
	);
	let node: Text | null;
	while ((node = walker.nextNode() as Text | null)) {
		const text = node.textContent ?? "";
		for (const [color, terms] of groups) {
			for (const term of terms) {
				let idx = text.indexOf(term);
				while (idx !== -1) {
					const range = new Range();
					range.setStart(node, idx);
					range.setEnd(node, idx + term.length);
					if (!highlights.has(color))
						highlights.set(color, new Highlight());
					highlights.get(color)!.add(range);
					idx = text.indexOf(term, idx + term.length);
				}
			}
		}
	}

	for (const [color, highlight] of highlights) {
		if (highlight.size > 0) {
			CSS.highlights.set(`${prefix}-${color}`, highlight);
		}
	}
}

/** 清除指定名称的高亮 */
export function clearHighlight(name: string) {
	if ("highlights" in CSS) {
		CSS.highlights.delete(name);
	}
}

/** 清除多色高亮的所有颜色变体 */
export function clearColoredHighlights(prefix: string) {
	if (!("highlights" in CSS)) return;
	for (const color of HIGHLIGHT_COLORS) {
		CSS.highlights.delete(`${prefix}-${color}`);
	}
}
