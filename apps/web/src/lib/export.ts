// ── 数据导出工具 ──

/** CSV 列定义 */
export interface CsvColumn<T> {
	header: string;
	accessor: (row: T) => string | number;
}

/** 将字段值转义为 CSV 安全字符串 */
function escapeCsv(value: string | number): string {
	const str = String(value);
	if (str.includes(",") || str.includes('"') || str.includes("\n")) {
		return `"${str.replace(/"/g, '""')}"`;
	}
	return str;
}

/** 通用 CSV 生成 */
export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
	const header = columns.map((c) => escapeCsv(c.header)).join(",");
	const lines = rows.map((row) =>
		columns.map((c) => escapeCsv(c.accessor(row))).join(","),
	);
	// BOM 前缀确保 Excel 正确识别 UTF-8
	return `\uFEFF${header}\n${lines.join("\n")}`;
}

/** 将 unix 秒时间戳转为可读日期 */
function formatTime(ts: number): string {
	return new Date(ts * 1000).toLocaleString("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});
}

/** 触发浏览器文件下载 */
export function downloadFile(
	content: string | object,
	filename: string,
	type: "json" | "csv",
): void {
	const text =
		typeof content === "string" ? content : JSON.stringify(content, null, 2);
	const mime = type === "csv" ? "text/csv;charset=utf-8" : "application/json";
	const blob = new Blob([text], { type: mime });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

// ── 各数据类型的 CSV 列映射 ──

export const POST_COLUMNS: CsvColumn<{
	forumName: string;
	title: string;
	content: string;
	createTime: number;
	threadId: string;
	postId: string;
	affiliated: boolean;
	replyTo?: string;
}>[] = [
	{ header: "贴吧", accessor: (r) => r.forumName },
	{ header: "标题", accessor: (r) => r.title },
	{ header: "内容", accessor: (r) => r.content },
	{ header: "时间", accessor: (r) => formatTime(r.createTime) },
	{ header: "帖子ID", accessor: (r) => r.threadId },
	{ header: "回复ID", accessor: (r) => r.postId },
	{ header: "楼中楼", accessor: (r) => (r.affiliated ? "是" : "否") },
	{ header: "回复对象", accessor: (r) => r.replyTo ?? "" },
];

export const FOLLOW_COLUMNS: CsvColumn<{
	id: number;
	name?: string;
	name_show: string;
	intro: string;
}>[] = [
	{ header: "ID", accessor: (r) => r.id },
	{ header: "用户名", accessor: (r) => r.name ?? "" },
	{ header: "昵称", accessor: (r) => r.name_show },
	{ header: "简介", accessor: (r) => r.intro },
];

export const FAN_COLUMNS: CsvColumn<{
	id: string;
	name: string;
	name_show: string;
	intro: string;
}>[] = [
	{ header: "ID", accessor: (r) => r.id },
	{ header: "用户名", accessor: (r) => r.name },
	{ header: "昵称", accessor: (r) => r.name_show },
	{ header: "简介", accessor: (r) => r.intro },
];

export const FORUM_COLUMNS: CsvColumn<{
	id: string;
	name: string;
	level_id: string;
	level_name: string;
	cur_score: string;
}>[] = [
	{ header: "贴吧ID", accessor: (r) => r.id },
	{ header: "贴吧名", accessor: (r) => r.name },
	{ header: "等级", accessor: (r) => r.level_id },
	{ header: "等级名", accessor: (r) => r.level_name },
	{ header: "经验值", accessor: (r) => r.cur_score },
];
