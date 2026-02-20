// ── 数据导出工具 ──

/** CSV 列定义 */
export interface CsvColumn<T> {
	header: string;
	accessor: (row: T) => string | number;
}

/** 将对象数组映射为表格行（键为列头） */
export function mapRowsByColumns<T>(
	rows: T[],
	columns: CsvColumn<T>[],
): Array<Record<string, string | number>> {
	return rows.map((row) =>
		Object.fromEntries(
			columns.map((column) => [column.header, column.accessor(row)]),
		),
	);
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
	content: string | object | ArrayBuffer | Uint8Array,
	filename: string,
	type: "json" | "csv" | "xlsx",
): void {
	const text =
		typeof content === "string" ? content : JSON.stringify(content, null, 2);
	const mime =
		type === "csv"
			? "text/csv;charset=utf-8"
			: type === "xlsx"
				? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
				: "application/json";
	const blobData: string | ArrayBuffer | Uint8Array =
		type === "xlsx"
			? content instanceof ArrayBuffer
				? content
				: content instanceof Uint8Array
					? (() => {
							const bytes = new Uint8Array(content.byteLength);
							bytes.set(content);
							return bytes;
						})()
					: new ArrayBuffer(0)
			: text;
	const blob = new Blob([blobData as unknown as BlobPart], { type: mime });
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

export const THREAD_COLUMNS: CsvColumn<{
	tid: string;
	title: string;
	authorName: string;
	replyNum: number;
	viewNum: number;
	createTime: number;
}>[] = [
	{ header: "帖子ID", accessor: (r) => r.tid },
	{ header: "标题", accessor: (r) => r.title },
	{ header: "作者", accessor: (r) => r.authorName },
	{ header: "回复数", accessor: (r) => r.replyNum },
	{ header: "浏览数", accessor: (r) => r.viewNum },
	{ header: "创建时间", accessor: (r) => formatTime(r.createTime) },
];

export const THREAD_DETAIL_COLUMNS: CsvColumn<{
	tid: string;
	title: string;
	authorName: string;
	replyNum: number;
	viewNum: number;
	createTime: number;
	content: string;
}>[] = [
	{ header: "帖子ID", accessor: (r) => r.tid },
	{ header: "标题", accessor: (r) => r.title },
	{ header: "作者", accessor: (r) => r.authorName },
	{ header: "回复数", accessor: (r) => r.replyNum },
	{ header: "浏览数", accessor: (r) => r.viewNum },
	{ header: "创建时间", accessor: (r) => formatTime(r.createTime) },
	{ header: "首贴内容", accessor: (r) => r.content },
];

export const THREAD_POST_COLUMNS: CsvColumn<{
	pid?: string;
	floor: number;
	authorId?: string;
	authorName: string;
	content: string;
	agreeNum: number;
	time: number;
}>[] = [
	{ header: "楼层ID", accessor: (r) => r.pid ?? "" },
	{ header: "楼层", accessor: (r) => r.floor },
	{ header: "作者ID", accessor: (r) => r.authorId ?? "" },
	{ header: "作者", accessor: (r) => r.authorName },
	{ header: "内容", accessor: (r) => r.content },
	{ header: "点赞数", accessor: (r) => r.agreeNum },
	{ header: "时间", accessor: (r) => formatTime(r.time) },
];

export const THREAD_COMMENT_COLUMNS: CsvColumn<{
	parentPid: string;
	parentFloor: number;
	pid: string;
	floor: number;
	authorId: string;
	authorName: string;
	content: string;
	agreeNum: number;
	time: number;
}>[] = [
	{ header: "所属楼层ID", accessor: (r) => r.parentPid },
	{ header: "所属楼层", accessor: (r) => r.parentFloor },
	{ header: "楼中楼ID", accessor: (r) => r.pid },
	{ header: "楼中楼层", accessor: (r) => r.floor },
	{ header: "作者ID", accessor: (r) => r.authorId },
	{ header: "作者", accessor: (r) => r.authorName },
	{ header: "内容", accessor: (r) => r.content },
	{ header: "点赞数", accessor: (r) => r.agreeNum },
	{ header: "时间", accessor: (r) => formatTime(r.time) },
];

export const THREAD_USER_COLUMNS: CsvColumn<{
	id: string;
	name: string;
	nameShow: string;
	portrait: string;
	levelId: number;
	ipAddress: string;
}>[] = [
	{ header: "用户ID", accessor: (r) => r.id },
	{ header: "用户名", accessor: (r) => r.name },
	{ header: "昵称", accessor: (r) => r.nameShow },
	{ header: "头像", accessor: (r) => r.portrait },
	{ header: "等级", accessor: (r) => r.levelId },
	{ header: "IP", accessor: (r) => r.ipAddress },
];

export const FORUM_THREAD_POST_COLUMNS: CsvColumn<{
	threadTid: string;
	threadTitle: string;
	pid: string;
	floor: number;
	authorId: string;
	authorName: string;
	content: string;
	agreeNum: number;
	time: number;
}>[] = [
	{ header: "所属帖子ID", accessor: (r) => r.threadTid },
	{ header: "所属帖子标题", accessor: (r) => r.threadTitle },
	{ header: "楼层ID", accessor: (r) => r.pid },
	{ header: "楼层", accessor: (r) => r.floor },
	{ header: "作者ID", accessor: (r) => r.authorId },
	{ header: "作者", accessor: (r) => r.authorName },
	{ header: "内容", accessor: (r) => r.content },
	{ header: "点赞数", accessor: (r) => r.agreeNum },
	{ header: "时间", accessor: (r) => formatTime(r.time) },
];

export const FORUM_THREAD_COMMENT_COLUMNS: CsvColumn<{
	threadTid: string;
	parentPid: string;
	parentFloor: number;
	pid: string;
	floor: number;
	authorId: string;
	authorName: string;
	content: string;
	agreeNum: number;
	time: number;
}>[] = [
	{ header: "所属帖子ID", accessor: (r) => r.threadTid },
	{ header: "所属楼层ID", accessor: (r) => r.parentPid },
	{ header: "所属楼层", accessor: (r) => r.parentFloor },
	{ header: "楼中楼ID", accessor: (r) => r.pid },
	{ header: "楼中楼层", accessor: (r) => r.floor },
	{ header: "作者ID", accessor: (r) => r.authorId },
	{ header: "作者", accessor: (r) => r.authorName },
	{ header: "内容", accessor: (r) => r.content },
	{ header: "点赞数", accessor: (r) => r.agreeNum },
	{ header: "时间", accessor: (r) => formatTime(r.time) },
];
