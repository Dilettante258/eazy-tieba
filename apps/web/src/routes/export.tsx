import { useState, useRef, useEffect, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import {
	Button,
	Checkbox,
	FormControl,
	IconButton,
	Label,
	ProgressBar,
	Spinner,
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
import { QueryForm } from "../components/QueryForm.tsx";
import { userSearchSchema } from "../lib/search-schemas.ts";
import type { Method } from "../hooks/queries.ts";
import { api } from "../lib/api-client.ts";
import {
	downloadFile,
	toCsv,
	POST_COLUMNS,
	FOLLOW_COLUMNS,
	FAN_COLUMNS,
	FORUM_COLUMNS,
} from "../lib/export.ts";
import styles from "./page.module.css";

// ── 类型定义 ──

type ExportDataType = "profile" | "posts" | "follow" | "fan" | "likeForum";

const DATA_TYPE_LABELS: Record<ExportDataType, string> = {
	profile: "用户资料",
	posts: "发帖记录",
	follow: "关注列表",
	fan: "粉丝列表",
	likeForum: "关注贴吧",
};

interface ExportTask {
	id: string;
	dataType: ExportDataType;
	label: string;
	userId: string;
	method: Method;
	format: "json" | "csv";
	status: "pending" | "running" | "done" | "error";
	current: number;
	total: number;
	result?: unknown;
	error?: string;
	pageFrom?: number;
	pageTo?: number;
}

// ── API 请求工具 ──

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

async function fetchPostsBatch(
	method: Method,
	id: string,
	fromP: number,
	toP: number,
) {
	const res = await api.user.postsBatch.$get({
		query: { method, id, fromP: String(fromP), toP: String(toP) },
	});
	return unwrapRes<unknown[]>(res as unknown as Response);
}

// ── 导出页面组件 ──

function ExportPage() {
	const { method, id } = Route.useSearch();
	const [tasks, setTasks] = useState<ExportTask[]>([]);
	const runningRef = useRef(false);

	// 表单状态
	const [selected, setSelected] = useState<Record<ExportDataType, boolean>>({
		profile: false,
		posts: true,
		follow: false,
		fan: false,
		likeForum: false,
	});
	const [format, setFormat] = useState<"json" | "csv">("json");
	const [pageFrom, setPageFrom] = useState("1");
	const [pageTo, setPageTo] = useState("20");

	const toggleSelected = (dt: ExportDataType) =>
		setSelected((s) => ({ ...s, [dt]: !s[dt] }));

	// 加入导出队列
	const addToQueue = useCallback(() => {
		if (!method || !id) return;
		const newTasks: ExportTask[] = [];
		for (const dt of Object.keys(selected) as ExportDataType[]) {
			if (!selected[dt]) continue;
			newTasks.push({
				id: crypto.randomUUID(),
				dataType: dt,
				label: DATA_TYPE_LABELS[dt],
				userId: id,
				method,
				format,
				status: "pending",
				current: 0,
				total:
					dt === "posts"
						? Math.ceil(
								(Number(pageTo) - Number(pageFrom) + 1) / 10,
							)
						: 1,
				pageFrom: dt === "posts" ? Number(pageFrom) : undefined,
				pageTo: dt === "posts" ? Number(pageTo) : undefined,
			});
		}
		setTasks((prev) => [...prev, ...newTasks]);
	}, [method, id, selected, format, pageFrom, pageTo]);

	// 更新单个任务
	const updateTask = useCallback(
		(taskId: string, patch: Partial<ExportTask>) =>
			setTasks((prev) =>
				prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
			),
		[],
	);

	// 移除任务
	const removeTask = useCallback(
		(taskId: string) =>
			setTasks((prev) => prev.filter((t) => t.id !== taskId)),
		[],
	);

	// 下载任务结果
	const downloadTask = useCallback((task: ExportTask) => {
		if (!task.result) return;
		const ext = task.format;
		const filename = `${task.dataType}_${task.userId}.${ext}`;

		if (ext === "csv") {
			let csv = "";
			const data = task.result;
			switch (task.dataType) {
				case "posts":
					csv = toCsv(
						data as Parameters<
							typeof toCsv<
								(typeof POST_COLUMNS)[0] extends {
									accessor: (r: infer R) => unknown;
								}
									? R
									: never
							>
						>[0],
						POST_COLUMNS,
					);
					break;
				case "follow": {
					const followData = data as { follow_list?: unknown[] };
					csv = toCsv(
						(followData.follow_list ?? []) as Parameters<
							typeof toCsv<
								(typeof FOLLOW_COLUMNS)[0] extends {
									accessor: (r: infer R) => unknown;
								}
									? R
									: never
							>
						>[0],
						FOLLOW_COLUMNS,
					);
					break;
				}
				case "fan": {
					const fanData = data as { user_list?: unknown[] };
					csv = toCsv(
						(fanData.user_list ?? []) as Parameters<
							typeof toCsv<
								(typeof FAN_COLUMNS)[0] extends {
									accessor: (r: infer R) => unknown;
								}
									? R
									: never
							>
						>[0],
						FAN_COLUMNS,
					);
					break;
				}
				case "likeForum": {
					const forumData = data as { list?: unknown[] };
					csv = toCsv(
						(forumData.list ?? []) as Parameters<
							typeof toCsv<
								(typeof FORUM_COLUMNS)[0] extends {
									accessor: (r: infer R) => unknown;
								}
									? R
									: never
							>
						>[0],
						FORUM_COLUMNS,
					);
					break;
				}
				default:
					csv = JSON.stringify(data, null, 2);
			}
			downloadFile(csv, filename, "csv");
		} else {
			downloadFile(task.result, filename, "json");
		}
	}, []);

	// 队列执行器
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
				const { method: m, userId: uid, dataType } = pending;

				switch (dataType) {
					case "profile":
						result = await fetchProfile(m, uid);
						updateTask(taskId, { current: 1 });
						break;
					case "follow":
						result = await fetchFollow(m, uid);
						updateTask(taskId, { current: 1 });
						break;
					case "fan":
						result = await fetchFan(m, uid);
						updateTask(taskId, { current: 1 });
						break;
					case "likeForum":
						result = await fetchLikeForum(m, uid);
						updateTask(taskId, { current: 1 });
						break;
					case "posts": {
						const from = pending.pageFrom ?? 1;
						const to = pending.pageTo ?? 20;
						const allPosts: unknown[] = [];
						const batchSize = 10;
						let batch = 0;
						for (let p = from; p <= to; p += batchSize) {
							const batchEnd = Math.min(p + batchSize - 1, to);
							const data = await fetchPostsBatch(
								m,
								uid,
								p,
								batchEnd,
							);
							if (Array.isArray(data)) allPosts.push(...data);
							batch++;
							updateTask(taskId, { current: batch });
							// 空数据说明没有更多页了
							if (!Array.isArray(data) || data.length === 0)
								break;
						}
						result = allPosts;
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

	const hasSelection = Object.values(selected).some(Boolean);
	const hasId = !!method && !!id;

	return (
		<div>
			<h2 className={styles.heading}>数据导出</h2>
			<QueryForm />

			{/* 导出选项 */}
			<div className={styles.exportCard}>
				<h3 className={styles.exportCardTitle}>选择要导出的数据</h3>

				<div className={styles.exportCheckboxes}>
					{(Object.keys(DATA_TYPE_LABELS) as ExportDataType[]).map(
						(dt) => (
							<div key={dt} className={styles.exportCheckboxRow}>
								<FormControl>
									<Checkbox
										checked={selected[dt]}
										onChange={() => toggleSelected(dt)}
									/>
									<FormControl.Label>
										{DATA_TYPE_LABELS[dt]}
									</FormControl.Label>
								</FormControl>
								{dt === "posts" && selected.posts && (
									<div className={styles.exportPageRange}>
										<TextInput
											size="small"
											type="number"
											min={1}
											value={pageFrom}
											onChange={(e) =>
												setPageFrom(e.target.value)
											}
											className={styles.exportPageInput}
										/>
										<span>~</span>
										<TextInput
											size="small"
											type="number"
											min={1}
											value={pageTo}
											onChange={(e) =>
												setPageTo(e.target.value)
											}
											className={styles.exportPageInput}
										/>
										<span className={styles.exportPageUnit}>
											页
										</span>
									</div>
								)}
							</div>
						),
					)}
				</div>

				<div className={styles.exportActions}>
					<div className={styles.exportFormatToggle}>
						<span className={styles.exportFormatLabel}>格式:</span>
						<Button
							size="small"
							variant={
								format === "json" ? "primary" : "default"
							}
							onClick={() => setFormat("json")}
						>
							JSON
						</Button>
						<Button
							size="small"
							variant={format === "csv" ? "primary" : "default"}
							onClick={() => setFormat("csv")}
						>
							CSV
						</Button>
					</div>
					<Button
						variant="primary"
						leadingVisual={PlusIcon}
						disabled={!hasSelection || !hasId}
						onClick={addToQueue}
					>
						加入导出队列
					</Button>
				</div>
			</div>

			{/* 导出队列 */}
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
								renderCell: (row) => (
									<Label>{row.label}</Label>
								),
							},
							{
								header: "用户",
								field: "userId",
								renderCell: (row) => (
									<span
										className={styles.exportCellMuted}
									>
										{row.userId}
									</span>
								),
							},
							{
								header: "格式",
								id: "format",
								renderCell: (row) => (
									<Label variant="secondary" size="small">
										{row.format.toUpperCase()}
									</Label>
								),
								width: "auto",
							},
							{
								header: "进度",
								id: "progress",
								renderCell: (row) => (
									<TaskProgress task={row} />
								),
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
												onClick={() =>
													downloadTask(row)
												}
											/>
										)}
										<IconButton
											aria-label="移除"
											icon={TrashIcon}
											size="small"
											variant="invisible"
											onClick={() =>
												removeTask(row.id)
											}
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

function VisuallyHidden({ children }: { children: React.ReactNode }) {
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
		case "running":
			if (task.total > 1) {
				return (
					<div className={styles.exportProgressBar}>
						<ProgressBar
							progress={(task.current / task.total) * 100}
							className={styles.exportProgressBarInner}
						/>
						<span className={styles.exportProgressText}>
							{task.current}/{task.total}
						</span>
					</div>
				);
			}
			return <Spinner size="small" />;
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
