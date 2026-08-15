/**
 * 更新日志数据（按时间从旧到新排列）。
 * 关于页的「更新日志」时间线和首页的更新提示弹窗共用这份数据。
 * 发布新版本时在末尾追加条目即可，UpdateNotice 会自动向未看过的设备弹出提示。
 */

export interface ChangelogEntry {
	version: string;
	summary: string;
	items: readonly string[];
}

export const CHANGELOG: readonly ChangelogEntry[] = [
	{
		version: "v3.0.0",
		summary: "v3 系列首发版本，完成核心能力整合。",
		items: [
			"支持PWA能力，支持安装到首页。",
			"提供用户资料、发帖分析、发言搜索、关系查询与导出等核心功能。",
		],
	},
	{
		version: "v3.1.0",
		summary: "聚焦首屏体验和输入规则一致性。",
		items: [
			"首页轮播图资源迁移到 CDN，并提前 dns-prefetch。",
			"UID 查询规则更新为支持 8 位到 10 位数字，兼容更多历史账号。",
			"导出页与查询表单的 UID 提示文案和校验逻辑已保持一致。",
		],
	},
	{
		version: "v3.2.0",
		summary: "增强词云与全局设置能力。",
		items: [
			"全局设置新增「词云自定义关键词」，可补充分词器未能识别的专有词汇。",
			"词云屏蔽关键词从贴吧分析设置迁移至全局设置，统一管理入口。",
		],
	},
	{
		version: "v3.3.0",
		summary: "新增错误追踪",
		items: [
			"接入 Sentry 错误追踪，提升稳定性。",
		],
	},
	{
		version: "v3.4.0",
		summary: "当前版本，首页视觉焕新与更新提示。",
		items: [
			"首页 Hero 区域全新设计：极光网格背景、渐变标题与悬浮卡片。",
			"全局设置新增「隐藏首页 Hero 区域」开关。",
			"新增版本更新提示：设备未看过最新更新内容时自动弹出。",
		],
	},
] as const;

/** 最新版本号（CHANGELOG 末尾条目） */
export const LATEST_CHANGELOG_VERSION =
	CHANGELOG[CHANGELOG.length - 1].version;

/**
 * 返回设备尚未看过的版本条目（从新到旧），最多 limit 条。
 * lastSeen 为 null（新设备）或找不到时，返回最近的 limit 条。
 */
export function getUnseenReleases(
	lastSeen: string | null,
	limit = 2,
): ChangelogEntry[] {
	const idx = lastSeen
		? CHANGELOG.findIndex((entry) => entry.version === lastSeen)
		: -1;
	return CHANGELOG.slice(idx + 1)
		.reverse()
		.slice(0, limit);
}
