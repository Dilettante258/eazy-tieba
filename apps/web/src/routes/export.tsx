import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import {
	Button,
	Checkbox,
	FormControl,
	IconButton,
	Label,
	ProgressBar,
	Select,
	TextInput,
} from "@primer/react";
import { Table, DataTable } from "@primer/react/experimental";
import {
	CheckCircleIcon,
	DownloadIcon,
	PlusIcon,
	TrashIcon,
	XCircleIcon,
} from "@primer/octicons-react";
import { userSearchSchema } from "../lib/search-schemas.ts";
import type { Method } from "../hooks/queries.ts";
import { api } from "../lib/api-client.ts";
import {
	downloadFile,
	mapRowsByColumns,
	POST_COLUMNS,
	FOLLOW_COLUMNS,
	FAN_COLUMNS,
	FORUM_COLUMNS,
	THREAD_COLUMNS,
	THREAD_DETAIL_COLUMNS,
	THREAD_COMMENT_COLUMNS,
	THREAD_POST_COLUMNS,
	THREAD_USER_COLUMNS,
	FORUM_THREAD_POST_COLUMNS,
	FORUM_THREAD_COMMENT_COLUMNS,
} from "../lib/export.ts";
import styles from "./page.module.css";

type ExportDataType =
	| "profile"
	| "posts"
	| "follow"
	| "fan"
	| "likeForum"
	| "forumThreads"
	| "threadPosts";
type ExportFormat = "json" | "xlsx";
type ExportContentScope = "all" | "basic";

const USER_TYPES: ExportDataType[] = [
	"profile",
	"posts",
	"follow",
	"fan",
	"likeForum",
];
const FORUM_TYPES: ExportDataType[] = ["forumThreads"];
const THREAD_TYPES: ExportDataType[] = ["threadPosts"];
const USER_METHOD_OPTIONS: Array<{ value: Method; label: string; hint: string }> = [
	{ value: "uid", label: "贴吧 UID", hint: "10 位数字" },
	{ value: "un", label: "用户名", hint: "请输入用户名" },
	{ value: "id", label: "用户 ID", hint: "纯数字" },
];

const DATA_TYPE_LABELS: Record<ExportDataType, string> = {
	profile: "用户资料",
	posts: "发帖记录",
	follow: "关注列表",
	fan: "粉丝列表",
	likeForum: "关注贴吧",
	forumThreads: "贴吧帖子列表",
	threadPosts: "单帖所有回复",
};

const DATA_TYPE_HINTS: Record<ExportDataType, string> = {
	profile: "导出用户基础资料与概览字段。",
	posts: "按页抓取用户发帖，支持实时进度。",
	follow: "导出用户关注列表。",
	fan: "导出用户粉丝列表。",
	likeForum: "导出用户关注贴吧。",
	forumThreads: "按吧名导出帖子列表，可选深度抓取内容。",
	threadPosts: "导出单帖全部楼层，可包含楼中楼。",
};

const DATA_TYPE_GUIDE: Record<
	ExportDataType,
	{ title: string; summary: string; points: string[] }
> = {
	profile: {
		title: "用户资料导出",
		summary: "适用于快速归档用户基础信息。",
		points: [
			"先在左侧输入用户标识（UID / 用户名 / 用户ID）",
			"点击加入队列后立即执行，无分页等待",
			"完成后可在队列中选择 JSON / Excel 下载",
		],
	},
	posts: {
		title: "用户发帖导出",
		summary: "按页抓取用户发帖并实时显示进度。",
		points: [
			"用户标识必填，页码范围建议从 1 开始",
			"默认自动补全吧名，保证导出字段完整",
			"SSE 会按页推送进度，完成后可下载",
		],
	},
	follow: {
		title: "关注列表导出",
		summary: "一次性抓取全部关注用户。",
		points: ["只需要输入用户标识", "无需分页配置", "适合做关注关系备份"],
	},
	fan: {
		title: "粉丝列表导出",
		summary: "一次性抓取全部粉丝。",
		points: [
			"只需要输入用户标识",
			"结果包含粉丝基础信息",
			"完成后可在队列中选择 JSON / Excel 下载",
		],
	},
	likeForum: {
		title: "关注贴吧导出",
		summary: "导出用户关注的贴吧列表。",
		points: [
			"只需要输入用户标识",
			"用于兴趣分布分析很方便",
			"完成后可在队列中选择 JSON / Excel 下载",
		],
	},
	forumThreads: {
		title: "贴吧帖子导出",
		summary: "按吧名批量导出帖子列表，支持深度抓取。",
		points: [
			"输入吧名和扫描帖子数（最多 300）",
			"深度选择“全部”时会逐帖抓取内容并推送进度",
			"建议先用较小帖子数测试参数",
		],
	},
	threadPosts: {
		title: "单帖回复导出",
		summary: "导出指定 tid 的全部楼层与可选楼中楼。",
		points: [
			"输入帖子 tid 即可开始",
			"开启“包含楼中楼”会增加抓取耗时",
			"SSE 按页推送进度直到完成",
		],
	},
};

interface ExportTask {
	id: string;
	dataType: ExportDataType;
	label: string;
	format: ExportFormat;
	contentScope: ExportContentScope;
	status: "pending" | "running" | "done" | "error";
	current: number;
	total: number;
	sourceLabel: string;
	result?: unknown;
	error?: string;
	method?: Method;
	userId?: string;
	pageFrom?: number;
	pageTo?: number;
	needForumName?: boolean;
	fname?: string;
	sort?: string;
	count?: number;
	depth?: "first" | "all";
	maxPages?: number;
	tid?: string;
	withComments?: boolean;
}

async function unwrapRes<T>(res: Response): Promise<T> {
	if (!res.ok) throw new Error(`请求失败 (${res.status})`);
	return res.json() as Promise<T>;
}

async function fetchProfile(method: Method, id: string) {
	const res = await api.user.condenseProfile.$get({ query: { method, id } });
	return unwrapRes<Record<string, unknown>>(res as unknown as Response);
}

async function fetchFollow(method: Method, id: string) {
	const res = await api.user.follow.$get({
		query: { method, id, page: "ALL" },
	});
	return unwrapRes<Record<string, unknown>>(res as unknown as Response);
}

async function fetchFan(method: Method, id: string) {
	const res = await api.user.fan.$get({
		query: { method, id, page: "ALL" },
	});
	return unwrapRes<Record<string, unknown>>(res as unknown as Response);
}

async function fetchLikeForum(method: Method, id: string) {
	const res = await api.user.likeForum.$get({ query: { method, id } });
	return unwrapRes<Record<string, unknown>>(res as unknown as Response);
}

function buildSseUrl(path: string, query: Record<string, string>) {
	const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
	const url = new URL(path, base);
	for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
	return url.toString();
}

function runSseTask<T>(
	path: string,
	query: Record<string, string>,
	onEvent: (payload: Record<string, unknown>) => void,
) {
	return new Promise<T>((resolve, reject) => {
		const es = new EventSource(buildSseUrl(path, query));
		let done = false;

		es.onmessage = (evt) => {
			try {
				const payload = JSON.parse(evt.data) as Record<string, unknown>;
				onEvent(payload);
				if (payload.type === "done") {
					done = true;
					es.close();
					resolve(payload.data as T);
					return;
				}
				if (payload.type === "error") {
					done = true;
					es.close();
					reject(new Error(String(payload.message || "导出失败")));
				}
			} catch {
				done = true;
				es.close();
				reject(new Error("SSE 消息解析失败"));
			}
		};

		es.onerror = () => {
			if (done) return;
			es.close();
			reject(new Error("SSE 连接中断"));
		};
	});
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flattenRecord(
	input: Record<string, unknown>,
	prefix = "",
): Record<string, string | number | boolean> {
	const output: Record<string, string | number | boolean> = {};

	for (const [key, value] of Object.entries(input)) {
		const path = prefix ? `${prefix}.${key}` : key;
		if (
			typeof value === "string" ||
			typeof value === "number" ||
			typeof value === "boolean"
		) {
			output[path] = value;
			continue;
		}
		if (value == null) {
			output[path] = "";
			continue;
		}
		if (Array.isArray(value)) {
			output[path] = JSON.stringify(value);
			continue;
		}
		if (isRecord(value)) {
			Object.assign(output, flattenRecord(value, path));
			continue;
		}
		output[path] = String(value);
	}

	return output;
}

function toFlatRows(
	data: unknown,
): Array<Record<string, string | number | boolean>> {
	if (Array.isArray(data)) {
		return data.filter((row) => isRecord(row)).map((row) => flattenRecord(row));
	}
	if (isRecord(data)) return [flattenRecord(data)];
	if (data == null) return [];
	return [{ value: String(data) }];
}

function taskParams(task: ExportTask): string {
	switch (task.dataType) {
		case "posts":
			return `页码 ${task.pageFrom ?? 1}~${task.pageTo ?? 1}`;
		case "forumThreads":
			return `${task.count ?? 50} 条 · ${
				task.depth === "all"
					? `抓楼层${task.maxPages ? `（最多 ${task.maxPages} 页）` : ""}`
					: "仅首贴"
			}`;
		case "threadPosts":
			return task.withComments ? "包含楼中楼" : "不含楼中楼";
		default:
			return "默认参数";
	}
}

type RowFromColumns<T extends Array<{ accessor: (row: any) => unknown }>> =
	T[number] extends { accessor: (row: infer R) => unknown } ? R : never;

type ExportSheet = {
	name: string;
	rows: Array<Record<string, string | number | boolean>>;
};

type ThreadCommentRow = RowFromColumns<typeof THREAD_COMMENT_COLUMNS>;
type ThreadPostRow = RowFromColumns<typeof THREAD_POST_COLUMNS> & {
	pid?: string;
	authorId?: string;
	comments?: Array<{
		pid?: string;
		floor?: number;
		authorId?: string;
		authorName?: string;
		content?: string;
		agreeNum?: number;
		time?: number;
	}>;
};
type ThreadUserRow = RowFromColumns<typeof THREAD_USER_COLUMNS>;
type ForumThreadPostRow = RowFromColumns<typeof FORUM_THREAD_POST_COLUMNS>;
type ForumThreadCommentRow = RowFromColumns<typeof FORUM_THREAD_COMMENT_COLUMNS>;

function splitThreadPostRows(posts: ThreadPostRow[]) {
	const comments: ThreadCommentRow[] = [];
	const postRows = posts.map((post) => {
		for (const comment of post.comments ?? []) {
			comments.push({
				parentPid: post.pid ?? "",
				parentFloor: post.floor,
				pid: String(comment.pid ?? ""),
				floor: Number(comment.floor ?? 0),
				authorId: String(comment.authorId ?? ""),
				authorName: String(comment.authorName ?? ""),
				content: String(comment.content ?? ""),
				agreeNum: Number(comment.agreeNum ?? 0),
				time: Number(comment.time ?? 0),
			});
		}
		const { comments: _comments, ...postWithoutComments } = post;
		return postWithoutComments;
	});
	return { postRows, comments };
}

function buildThreadUsers(
	postRows: Array<{ authorId?: string; authorName: string }>,
	comments: Array<{ authorId: string; authorName: string }>,
	users?: ThreadUserRow[],
): ThreadUserRow[] {
	if (users && users.length > 0) return users;
	const map = new Map<string, ThreadUserRow>();
	for (const row of postRows) {
		if (!row.authorId) continue;
		if (!map.has(row.authorId)) {
			map.set(row.authorId, {
				id: row.authorId,
				name: "",
				nameShow: row.authorName,
				portrait: "",
				levelId: 0,
				ipAddress: "",
			});
		}
	}
	for (const row of comments) {
		if (!row.authorId) continue;
		if (!map.has(row.authorId)) {
			map.set(row.authorId, {
				id: row.authorId,
				name: "",
				nameShow: row.authorName,
				portrait: "",
				levelId: 0,
				ipAddress: "",
			});
		}
	}
	return Array.from(map.values());
}

function parseForumThreadsPayload(data: unknown): {
	threads: Array<Record<string, unknown>>;
	users: ThreadUserRow[];
} {
	if (Array.isArray(data)) {
		return {
			threads: data.filter((row): row is Record<string, unknown> => isRecord(row)),
			users: [],
		};
	}
	if (!isRecord(data)) return { threads: [], users: [] };
	const threadsRaw = Array.isArray(data.threads) ? data.threads : [];
	const usersRaw = Array.isArray(data.users) ? data.users : [];
	const users = usersRaw
		.filter((row): row is Record<string, unknown> => isRecord(row))
		.map((row) => ({
			id: String(row.id ?? ""),
			name: String(row.name ?? ""),
			nameShow: String(row.nameShow ?? row.name_show ?? ""),
			portrait: String(row.portrait ?? ""),
			levelId: Number(row.levelId ?? 0),
			ipAddress: String(row.ipAddress ?? ""),
		}))
		.filter((row) => row.id);
	return {
		threads: threadsRaw.filter((row): row is Record<string, unknown> => isRecord(row)),
		users,
	};
}

function buildExportRows(task: ExportTask): ExportSheet[] {
	const data = task.result;
	if (!data) return [];

	if (task.contentScope === "basic") {
		switch (task.dataType) {
			case "posts":
				return [
					{
						name: "posts",
						rows: mapRowsByColumns(
							data as RowFromColumns<typeof POST_COLUMNS>[],
							POST_COLUMNS,
						),
					},
				];
			case "follow": {
				const rows =
					(data as { follow_list?: RowFromColumns<typeof FOLLOW_COLUMNS>[] })
						.follow_list ?? [];
				return [
					{
						name: "follow_list",
						rows: mapRowsByColumns(rows, FOLLOW_COLUMNS),
					},
				];
			}
			case "fan": {
				const rows =
					(data as { user_list?: RowFromColumns<typeof FAN_COLUMNS>[] })
						.user_list ?? [];
				return [{ name: "fans", rows: mapRowsByColumns(rows, FAN_COLUMNS) }];
			}
			case "likeForum": {
				const rows =
					(data as { list?: RowFromColumns<typeof FORUM_COLUMNS>[] }).list ??
					[];
				return [
					{ name: "forums", rows: mapRowsByColumns(rows, FORUM_COLUMNS) },
				];
			}
			case "forumThreads":
				{
					const payload = parseForumThreadsPayload(data);
					const rows = payload.threads as RowFromColumns<typeof THREAD_COLUMNS>[];
					return [
						{
							name: "threads",
							rows: mapRowsByColumns(rows, THREAD_COLUMNS),
						},
					];
				}
			case "threadPosts": {
				const rows =
					(
						data as {
							posts?: ThreadPostRow[];
							users?: ThreadUserRow[];
						}
					).posts ?? [];
				const { postRows, comments } = splitThreadPostRows(rows);
				const users = buildThreadUsers(
					postRows,
					comments,
					(data as { users?: ThreadUserRow[] }).users,
				);
				return [
					{
						name: "posts",
						rows: mapRowsByColumns(postRows, THREAD_POST_COLUMNS),
					},
					...(comments.length > 0
						? [
								{
									name: "comments",
									rows: mapRowsByColumns(comments, THREAD_COMMENT_COLUMNS),
								},
							]
						: []),
					...(users.length > 0
						? [
								{
									name: "users",
									rows: mapRowsByColumns(users, THREAD_USER_COLUMNS),
								},
							]
						: []),
				];
			}
		}
	}

	switch (task.dataType) {
		case "follow":
			return [
				{
					name: "follow_list",
					rows: toFlatRows(
						(data as { follow_list?: unknown[] }).follow_list ?? [],
					),
				},
			];
		case "fan":
			return [
				{
					name: "fans",
					rows: toFlatRows((data as { user_list?: unknown[] }).user_list ?? []),
				},
			];
		case "likeForum": {
			const payload = data as { list?: unknown[]; hidden?: unknown };
			return [
				{ name: "forums", rows: toFlatRows(payload.list ?? []) },
				...(payload.hidden
					? [{ name: "hidden", rows: toFlatRows(payload.hidden) }]
					: []),
			];
		}
		case "threadPosts": {
			const payload = data as {
				thread?: unknown;
				posts?: ThreadPostRow[];
				users?: ThreadUserRow[];
			};
			const { postRows, comments } = splitThreadPostRows(payload.posts ?? []);
			const users = buildThreadUsers(postRows, comments, payload.users);
			return [
				{ name: "thread", rows: toFlatRows(payload.thread ?? {}) },
				{ name: "posts", rows: toFlatRows(postRows) },
				...(comments.length > 0
					? [{ name: "comments", rows: toFlatRows(comments) }]
					: []),
				...(users.length > 0
					? [{ name: "users", rows: toFlatRows(users) }]
					: []),
			];
		}
		case "forumThreads": {
			const payload = parseForumThreadsPayload(data);
			const threads = payload.threads;
			const threadRows = threads.map((thread) => ({
				tid: String(thread.tid ?? ""),
				title: String(thread.title ?? ""),
				authorName: String(thread.authorName ?? ""),
				replyNum: Number(thread.replyNum ?? 0),
				viewNum: Number(thread.viewNum ?? 0),
				createTime: Number(thread.createTime ?? 0),
				content: String(thread.content ?? ""),
			}));

			const threadPosts: ForumThreadPostRow[] = [];
			const threadComments: ForumThreadCommentRow[] = [];
			for (const thread of threads) {
				const posts = Array.isArray(thread.posts) ? thread.posts : [];
				for (const post of posts) {
					if (!isRecord(post)) continue;
					threadPosts.push({
						threadTid: String(thread.tid ?? ""),
						threadTitle: String(thread.title ?? ""),
						pid: String(post.pid ?? ""),
						floor: Number(post.floor ?? 0),
						authorId: String(post.authorId ?? ""),
						authorName: String(post.authorName ?? ""),
						content: String(post.content ?? ""),
						agreeNum: Number(post.agreeNum ?? 0),
						time: Number(post.time ?? 0),
					});

					const comments = Array.isArray(post.comments) ? post.comments : [];
					for (const comment of comments) {
						if (!isRecord(comment)) continue;
						threadComments.push({
							threadTid: String(thread.tid ?? ""),
							parentPid: String(post.pid ?? ""),
							parentFloor: Number(post.floor ?? 0),
							pid: String(comment.pid ?? ""),
							floor: Number(comment.floor ?? 0),
							authorId: String(comment.authorId ?? ""),
							authorName: String(comment.authorName ?? ""),
							content: String(comment.content ?? ""),
							agreeNum: Number(comment.agreeNum ?? 0),
							time: Number(comment.time ?? 0),
						});
					}
				}
			}
			const users = buildThreadUsers(
				threadPosts.map((post) => ({
					authorId: post.authorId,
					authorName: post.authorName,
				})),
				threadComments.map((comment) => ({
					authorId: comment.authorId,
					authorName: comment.authorName,
				})),
				payload.users,
			);

			return [
				{
					name: "threads",
					rows: mapRowsByColumns(
						threadRows as RowFromColumns<typeof THREAD_DETAIL_COLUMNS>[],
						THREAD_DETAIL_COLUMNS,
					),
				},
				...(threadPosts.length > 0
					? [
							{
								name: "posts",
								rows: mapRowsByColumns(threadPosts, FORUM_THREAD_POST_COLUMNS),
							},
						]
					: []),
				...(threadComments.length > 0
					? [
							{
								name: "comments",
								rows: mapRowsByColumns(
									threadComments,
									FORUM_THREAD_COMMENT_COLUMNS,
								),
							},
						]
					: []),
				...(users.length > 0
					? [
							{
								name: "users",
								rows: mapRowsByColumns(users, THREAD_USER_COLUMNS),
							},
						]
					: []),
			];
		}
		default:
			return [{ name: task.dataType, rows: toFlatRows(data) }];
	}
}

function ExportPage() {
	const search = Route.useSearch();
	const [tasks, setTasks] = useState<ExportTask[]>([]);
	const runningRef = useRef(false);
	const [userMethod, setUserMethod] = useState<Method>(() => search.method);
	const [userId, setUserId] = useState(() => search.id);

	const [dataType, setDataType] = useState<ExportDataType>("posts");

	const [pageFrom, setPageFrom] = useState("1");
	const [pageTo, setPageTo] = useState("20");

	const [fname, setFname] = useState("");
	const [sort, setSort] = useState("1");
	const [count, setCount] = useState("50");
	const [depth, setDepth] = useState<"first" | "all">("first");
	const [forumWithComments, setForumWithComments] = useState(false);
	const [forumMaxPages, setForumMaxPages] = useState("5");

	const [tid, setTid] = useState("");
	const [threadWithComments, setThreadWithComments] = useState(false);

	const updateTask = useCallback(
		(taskId: string, patch: Partial<ExportTask>) =>
			setTasks((prev) =>
				prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
			),
		[],
	);

	const removeTask = useCallback(
		(taskId: string) => setTasks((prev) => prev.filter((t) => t.id !== taskId)),
		[],
	);

	const canAdd = useMemo(() => {
		if (USER_TYPES.includes(dataType)) return userId.trim().length > 0;
		if (dataType === "forumThreads") return fname.trim().length > 0;
		if (dataType === "threadPosts") return tid.trim().length > 0;
		return false;
	}, [dataType, userId, fname, tid]);

	const addToQueue = useCallback(() => {
		if (!canAdd) return;
		const task: ExportTask = {
			id: crypto.randomUUID(),
			dataType,
			label: DATA_TYPE_LABELS[dataType],
			format: "xlsx",
			contentScope: "all",
			status: "pending",
			current: 0,
			total: 1,
			sourceLabel: "",
		};

		if (USER_TYPES.includes(dataType)) {
			task.method = userMethod;
			task.userId = userId.trim();
			task.sourceLabel = userId.trim();
			if (dataType === "posts") {
				const from = Math.max(1, Number(pageFrom) || 1);
				const to = Math.max(from, Number(pageTo) || from);
				task.pageFrom = from;
				task.pageTo = to;
				task.needForumName = true;
				task.total = to - from + 1;
			}
		}

		if (dataType === "forumThreads") {
			task.fname = fname.trim();
			task.sort = sort;
			task.count = Math.min(Math.max(Number(count) || 50, 1), 300);
			task.depth = depth;
			task.withComments = depth === "all" ? forumWithComments : false;
			task.maxPages =
				depth === "all"
					? Math.min(Math.max(Number(forumMaxPages) || 5, 1), 20)
					: undefined;
			task.sourceLabel = task.fname;
			task.total = depth === "all" ? task.count : 1;
		}

		if (dataType === "threadPosts") {
			task.tid = tid.trim();
			task.withComments = threadWithComments;
			task.sourceLabel = `tid:${task.tid}`;
		}

		setTasks((prev) => [...prev, task]);
	}, [
		canAdd,
		dataType,
		userMethod,
		userId,
		pageFrom,
		pageTo,
		fname,
		sort,
		count,
		depth,
		forumWithComments,
		forumMaxPages,
		tid,
		threadWithComments,
	]);

	const downloadTask = useCallback(
		async (task: ExportTask) => {
			if (!task.result) return;
			const source = task.userId || task.fname || task.tid || "data";

			if (task.format === "json") {
				downloadFile(task.result, `${task.dataType}_${source}.json`, "json");
				return;
			}

			try {
				const { Workbook } = await import("exceljs");
				const workbook = new Workbook();
				const sheets = buildExportRows(task);

				for (const sheet of sheets) {
					const rows = sheet.rows;
					const worksheet = workbook.addWorksheet(
						sheet.name.slice(0, 31) || "sheet1",
					);
					if (rows.length === 0) {
						worksheet.addRow(["无数据"]);
						continue;
					}
					const headers = Array.from(
						new Set(rows.flatMap((row) => Object.keys(row))),
					);
					worksheet.addRow(headers);
					for (const row of rows) {
						worksheet.addRow(headers.map((header) => row[header] ?? ""));
					}
					worksheet.columns = headers.map((header) => ({
						key: header,
						width: Math.min(Math.max(header.length + 2, 12), 48),
					}));
				}

				const buffer = await workbook.xlsx.writeBuffer();
				downloadFile(
					buffer as ArrayBuffer | Uint8Array,
					`${task.dataType}_${source}.xlsx`,
					"xlsx",
				);
			} catch (err) {
				updateTask(task.id, {
					status: "error",
					error: err instanceof Error ? err.message : String(err),
				});
			}
		},
		[updateTask],
	);

	useEffect(() => {
		if (runningRef.current) return;
		const pending = tasks.find((t) => t.status === "pending");
		if (!pending) return;

		runningRef.current = true;
		const taskId = pending.id;
		updateTask(taskId, { status: "running" });

		(async () => {
			try {
				let result: unknown;

				switch (pending.dataType) {
					case "profile": {
						result = await fetchProfile(pending.method!, pending.userId!);
						updateTask(taskId, { current: 1, total: 1 });
						break;
					}
					case "follow": {
						result = await fetchFollow(pending.method!, pending.userId!);
						updateTask(taskId, { current: 1, total: 1 });
						break;
					}
					case "fan": {
						result = await fetchFan(pending.method!, pending.userId!);
						updateTask(taskId, { current: 1, total: 1 });
						break;
					}
					case "likeForum": {
						result = await fetchLikeForum(pending.method!, pending.userId!);
						updateTask(taskId, { current: 1, total: 1 });
						break;
					}
					case "posts": {
						result = await runSseTask<unknown[]>(
							"/export/userPosts",
							{
								method: pending.method!,
								id: pending.userId!,
								fromP: String(pending.pageFrom ?? 1),
								toP: String(pending.pageTo ?? pending.pageFrom ?? 1),
								needForumName: String(pending.needForumName ?? true),
							},
							(payload) => {
								if (payload.type === "progress") {
									updateTask(taskId, {
										current: Number(payload.page ?? 0),
										total: Number(payload.total ?? 1),
									});
								}
							},
						);
						break;
					}
					case "forumThreads": {
						result = await runSseTask<unknown[]>(
							"/export/forumThreads",
							{
								fname: pending.fname!,
								sort: pending.sort ?? "1",
								count: String(pending.count ?? 50),
								depth: pending.depth ?? "first",
								withComments: String(pending.withComments ?? false),
								maxPages: String(pending.maxPages ?? 5),
							},
							(payload) => {
								if (payload.type === "threads") {
									const total = Number(payload.count ?? 0);
									updateTask(taskId, {
										current: pending.depth === "all" ? 0 : total,
										total: pending.depth === "all" ? total : total || 1,
									});
								}
								if (payload.type === "post") {
									updateTask(taskId, {
										current: Number(payload.current ?? 0),
										total: Number(payload.total ?? 1),
									});
								}
							},
						);
						break;
					}
					case "threadPosts": {
						result = await runSseTask<{ thread: unknown; posts: unknown[] }>(
							"/export/threadPosts",
							{
								tid: pending.tid!,
								withComments: String(pending.withComments ?? false),
							},
							(payload) => {
								if (payload.type === "progress") {
									updateTask(taskId, {
										current: Number(payload.page ?? 0),
										total: Number(payload.total ?? 1),
									});
								}
							},
						);
						break;
					}
				}

				updateTask(taskId, { status: "done", result });
			} catch (err) {
				updateTask(taskId, {
					status: "error",
					error: err instanceof Error ? err.message : String(err),
				});
			} finally {
				runningRef.current = false;
			}
		})();
	}, [tasks, updateTask]);

	return (
		<div>
			<h2 className={styles.heading}>数据导出</h2>

			<div className={styles.exportWorkbench}>
				<div className={styles.exportCard}>
					<h3 className={styles.exportCardTitle}>导出任务配置</h3>

					<div className={styles.exportTypePanel}>
						<FormControl required>
							<FormControl.Label>导出类型</FormControl.Label>
							<Select
								className={styles.exportSelect}
								value={dataType}
								onChange={(e) => setDataType(e.target.value as ExportDataType)}
							>
								<Select.OptGroup label="用户数据">
									{USER_TYPES.map((dt) => (
										<Select.Option key={dt} value={dt}>
											{DATA_TYPE_LABELS[dt]}
										</Select.Option>
									))}
								</Select.OptGroup>
								<Select.OptGroup label="贴吧数据">
									{FORUM_TYPES.map((dt) => (
										<Select.Option key={dt} value={dt}>
											{DATA_TYPE_LABELS[dt]}
										</Select.Option>
									))}
								</Select.OptGroup>
								<Select.OptGroup label="帖子数据">
									{THREAD_TYPES.map((dt) => (
										<Select.Option key={dt} value={dt}>
											{DATA_TYPE_LABELS[dt]}
										</Select.Option>
									))}
								</Select.OptGroup>
							</Select>
							<FormControl.Caption>{DATA_TYPE_HINTS[dataType]}</FormControl.Caption>
						</FormControl>
					</div>

					<div className={styles.exportFormSection}>
						{USER_TYPES.includes(dataType) && (
							<div className={styles.exportIdentityBlock}>
								<div className={styles.exportSubTitle}>用户标识</div>
								<div className={styles.exportCheckboxes}>
									<div className={styles.exportCheckboxRow}>
										<FormControl required>
											<FormControl.Label>查询方式</FormControl.Label>
											<Select
												className={styles.exportSelect}
												value={userMethod}
												onChange={(e) =>
													setUserMethod(e.target.value as Method)
												}
											>
												{USER_METHOD_OPTIONS.map((option) => (
													<Select.Option
														key={option.value}
														value={option.value}
													>
														{option.label}
													</Select.Option>
												))}
											</Select>
										</FormControl>
									</div>
									<div className={styles.exportCheckboxRow}>
										<FormControl required>
											<FormControl.Label>标识值</FormControl.Label>
											<TextInput
												value={userId}
												onChange={(e) => setUserId(e.target.value)}
												placeholder="请输入用户标识"
												block
											/>
											<FormControl.Caption>
												{
													USER_METHOD_OPTIONS.find(
														(option) => option.value === userMethod,
													)?.hint
												}
											</FormControl.Caption>
										</FormControl>
									</div>
								</div>
							</div>
						)}

						<div className={styles.exportCheckboxes}>
							{dataType === "posts" && (
								<div className={styles.exportCheckboxRow}>
									<FormControl required>
										<FormControl.Label>页码范围</FormControl.Label>
										<div className={styles.exportPageRange}>
											<TextInput
												size="small"
												type="number"
												min={1}
												value={pageFrom}
												onChange={(e) => setPageFrom(e.target.value)}
												className={styles.exportPageInput}
											/>
											<span>~</span>
											<TextInput
												size="small"
												type="number"
												min={1}
												value={pageTo}
												onChange={(e) => setPageTo(e.target.value)}
												className={styles.exportPageInput}
											/>
											<span className={styles.exportPageUnit}>页</span>
										</div>
										<FormControl.Caption>
											从第 1 页开始，结束页需大于等于起始页
										</FormControl.Caption>
									</FormControl>
								</div>
							)}

							{dataType === "forumThreads" && (
								<>
									<div className={styles.exportCheckboxRow}>
										<FormControl required>
											<FormControl.Label>贴吧名</FormControl.Label>
											<TextInput
												value={fname}
												onChange={(e) => setFname(e.target.value)}
												placeholder="例如：原神"
												block
											/>
											<FormControl.Caption>用于定位要导出的目标贴吧</FormControl.Caption>
										</FormControl>
									</div>
									<div className={styles.exportCheckboxRow}>
										<FormControl>
											<FormControl.Label>帖子数</FormControl.Label>
											<TextInput
												type="number"
												min={1}
												max={300}
												value={count}
												onChange={(e) => setCount(e.target.value)}
												className={styles.exportPageInput}
											/>
											<FormControl.Caption>范围 1-300</FormControl.Caption>
										</FormControl>
									</div>
									<div className={styles.exportCheckboxRow}>
										<FormControl>
											<FormControl.Label>排序</FormControl.Label>
											<Select
												className={styles.exportSelect}
												value={sort}
												onChange={(e) => setSort(e.target.value)}
											>
												<Select.Option value="1">按最新</Select.Option>
												<Select.Option value="2">按发帖时间</Select.Option>
												<Select.Option value="3">按回复时间</Select.Option>
											</Select>
											<FormControl.Caption>影响抓取线程列表的顺序</FormControl.Caption>
										</FormControl>
									</div>
									<div className={styles.exportCheckboxRow}>
										<FormControl>
											<FormControl.Label>深度</FormControl.Label>
											<Select
												className={styles.exportSelect}
												value={depth}
												onChange={(e) =>
													setDepth(e.target.value as "first" | "all")
												}
											>
												<Select.Option value="first">仅首贴</Select.Option>
												<Select.Option value="all">抓取楼层内容</Select.Option>
											</Select>
											<FormControl.Caption>
												仅首贴更快；抓楼层可导出回复与楼中楼
											</FormControl.Caption>
										</FormControl>
									</div>
									{depth === "all" && (
										<>
											<div className={styles.exportCheckboxRow}>
												<FormControl>
													<Checkbox
														checked={forumWithComments}
														onChange={(e) =>
															setForumWithComments(e.target.checked)
														}
													/>
													<FormControl.Label>
														包含楼中楼
													</FormControl.Label>
												</FormControl>
											</div>
											<div className={styles.exportCheckboxRow}>
												<FormControl required>
													<FormControl.Label>最大页面数</FormControl.Label>
													<TextInput
														type="number"
														min={1}
														max={20}
														value={forumMaxPages}
														onChange={(e) =>
															setForumMaxPages(e.target.value)
														}
														className={styles.exportPageInput}
													/>
													<FormControl.Caption>范围 1-20，默认 5</FormControl.Caption>
												</FormControl>
											</div>
										</>
									)}
								</>
							)}

							{dataType === "threadPosts" && (
								<>
									<div className={styles.exportCheckboxRow}>
										<FormControl required>
											<FormControl.Label>帖子 ID</FormControl.Label>
											<TextInput
												value={tid}
												onChange={(e) => setTid(e.target.value)}
												placeholder="请输入 tid"
												block
											/>
										</FormControl>
									</div>
									<div className={styles.exportCheckboxRow}>
										<FormControl>
											<Checkbox
												checked={threadWithComments}
												onChange={(e) =>
													setThreadWithComments(e.target.checked)
												}
											/>
											<FormControl.Label>包含楼中楼</FormControl.Label>
										</FormControl>
									</div>
								</>
							)}
						</div>
					</div>

					<div className={styles.exportActions}>
						<span className={styles.exportFormatLabel}>
							任务完成后在队列表格中选择导出格式和字段范围
						</span>
						<Button
							variant="primary"
							leadingVisual={PlusIcon}
							disabled={!canAdd}
							onClick={addToQueue}
						>
							加入导出队列
						</Button>
					</div>
				</div>

				<aside className={styles.exportGuideCard}>
					<h3 className={styles.exportGuideTitle}>使用说明</h3>
					<h4 className={styles.exportGuideSubTitle}>
						{DATA_TYPE_GUIDE[dataType].title}
					</h4>
					<p className={styles.exportGuideSummary}>
						{DATA_TYPE_GUIDE[dataType].summary}
					</p>
					<div className={styles.exportGuideList}>
						{DATA_TYPE_GUIDE[dataType].points.map((point) => (
							<p key={point} className={styles.exportGuideItem}>
								{point}
							</p>
						))}
					</div>
				</aside>
			</div>

			{tasks.length > 0 && (
				<Table.Container>
					<Table.Title as="h3" id="export-queue">
						导出队列
					</Table.Title>
					<DataTable
						aria-labelledby="export-queue"
						data={tasks}
						columns={[
							{
								header: "数据类型",
								field: "label",
								rowHeader: true,
								renderCell: (row) => <Label>{row.label}</Label>,
							},
							{
								header: "目标",
								field: "sourceLabel",
								renderCell: (row) => (
									<span className={styles.exportCellMuted}>
										{row.sourceLabel}
									</span>
								),
							},
							{
								header: "参数",
								id: "params",
								renderCell: (row) => (
									<span className={styles.exportCellMuted}>
										{taskParams(row)}
									</span>
								),
							},
							{
								header: "格式",
								id: "format",
								renderCell: (row) => (
									<div className={styles.exportFormatToggle}>
										<Button
											size="small"
											variant={row.format === "json" ? "primary" : "default"}
											disabled={row.status !== "done"}
											onClick={() => updateTask(row.id, { format: "json" })}
										>
											JSON
										</Button>
										<Button
											size="small"
											variant={row.format === "xlsx" ? "primary" : "default"}
											disabled={row.status !== "done"}
											onClick={() => updateTask(row.id, { format: "xlsx" })}
										>
											Excel
										</Button>
									</div>
								),
								width: "auto",
							},
							{
								header: "导出内容",
								id: "contentScope",
								renderCell: (row) => (
									<Select
										className={styles.exportSelect}
										value={row.contentScope}
										disabled={row.status !== "done"}
										onChange={(e) =>
											updateTask(row.id, {
												contentScope: e.target.value as ExportContentScope,
											})
										}
									>
										<Select.Option value="all">全部字段</Select.Option>
										<Select.Option value="basic">常用字段</Select.Option>
									</Select>
								),
							},
							{
								header: "进度",
								id: "progress",
								renderCell: (row) => <TaskProgress task={row} />,
								width: "growCollapse",
							},
							{
								id: "actions",
								header: () => <VisuallyHidden>操作</VisuallyHidden>,
								renderCell: (row) => (
									<div className={styles.exportCellActions}>
										{row.status === "done" && (
											<IconButton
												aria-label="下载"
												icon={DownloadIcon}
												size="small"
												variant="invisible"
												onClick={() => void downloadTask(row)}
											/>
										)}
										<IconButton
											aria-label="移除"
											icon={TrashIcon}
											size="small"
											variant="invisible"
											onClick={() => removeTask(row.id)}
										/>
									</div>
								),
								width: "auto",
							},
						]}
					/>
				</Table.Container>
			)}
		</div>
	);
}

function VisuallyHidden({ children }: { children: ReactNode }) {
	return (
		<span
			style={{
				clipPath: "inset(50%)",
				height: "1px",
				overflow: "hidden",
				position: "absolute",
				whiteSpace: "nowrap",
				width: "1px",
			}}
		>
			{children}
		</span>
	);
}

function TaskProgress({ task }: { task: ExportTask }) {
	switch (task.status) {
		case "pending":
			return <span className={styles.exportCellMuted}>等待中...</span>;
		case "running": {
			const total = Math.max(task.total, 1);
			const current = Math.min(Math.max(task.current, 0), total);
			return (
				<div className={styles.exportProgressBar}>
					<ProgressBar
						progress={(current / total) * 100}
						className={styles.exportProgressBarInner}
					/>
					<span className={styles.exportProgressText}>
						{task.total > 1 ? `${current}/${total}` : "执行中"}
					</span>
				</div>
			);
		}
		case "done":
			return (
				<span className={styles.exportStatusDone}>
					<CheckCircleIcon size={14} />
					完成
				</span>
			);
		case "error":
			return (
				<span className={styles.exportStatusError} title={task.error}>
					<XCircleIcon size={14} />
					失败
				</span>
			);
	}
}

export const Route = createFileRoute("/export")({
	validateSearch: zodSearchValidator({ schema: userSearchSchema }),
	component: ExportPage,
});
