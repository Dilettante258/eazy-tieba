import { renderToStaticMarkup } from "react-dom/server";
import type { ExportMailEvent } from "./types";

const pageStyle = {
	fontFamily:
		'-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
	backgroundColor: "#f5f7fb",
	color: "#111827",
	margin: 0,
	padding: "24px 0",
};

const cardStyle = {
	maxWidth: "720px",
	margin: "0 auto",
	backgroundColor: "#ffffff",
	border: "1px solid #e5e7eb",
	borderRadius: "8px",
	padding: "24px",
};

const mutedStyle = {
	color: "#6b7280",
	fontSize: "14px",
	lineHeight: "22px",
};

const sectionTitleStyle = {
	fontSize: "16px",
	margin: "24px 0 12px",
};

const metricGridStyle = {
	width: "100%",
	borderCollapse: "collapse" as const,
	fontSize: "14px",
};

const cellStyle = {
	border: "1px solid #e5e7eb",
	padding: "10px 12px",
	textAlign: "left" as const,
};

const targetTableStyle = {
	width: "100%",
	borderCollapse: "collapse" as const,
	fontSize: "13px",
};

function formatCount(label: string, value: number): string {
	return `${label}: ${value}`;
}

function headingForEvent(event: ExportMailEvent): string {
	switch (event.eventType) {
		case "started":
			return "导出任务已启动";
		case "progress":
			return "导出任务进度更新";
		case "completed":
			return "导出任务已完成";
		case "failed":
			return "导出任务执行失败";
	}
}

function introForEvent(event: ExportMailEvent): string {
	switch (event.eventType) {
		case "started":
			return "任务已经开始执行，下面是当前的初始摘要。";
		case "progress":
			return "任务仍在运行中，这是一封按间隔发送的进度通知。";
		case "completed":
			return "任务已经结束并完成全部处理，下面是最终摘要。";
		case "failed":
			return "任务执行过程中出现错误，下面是失败时刻的任务摘要。";
	}
}

function SummaryTable({ event }: { event: ExportMailEvent }) {
	return (
		<table style={metricGridStyle}>
			<tbody>
				<tr>
					<td style={cellStyle}>任务名称</td>
					<td style={cellStyle}>{event.jobName}</td>
					<td style={cellStyle}>任务状态</td>
					<td style={cellStyle}>{event.status}</td>
				</tr>
				<tr>
					<td style={cellStyle}>贴吧进度</td>
					<td style={cellStyle}>
						{event.summary.forumsDone}/{event.summary.forumsTotal}
					</td>
					<td style={cellStyle}>已发现主题</td>
					<td style={cellStyle}>{event.summary.threadsFound}</td>
				</tr>
				<tr>
					<td style={cellStyle}>已存储主题</td>
					<td style={cellStyle}>{event.summary.threadsStored}</td>
					<td style={cellStyle}>已存储楼层</td>
					<td style={cellStyle}>{event.summary.postsStored}</td>
				</tr>
				<tr>
					<td style={cellStyle}>已存储楼中楼</td>
					<td style={cellStyle}>{event.summary.subPostsStored}</td>
					<td style={cellStyle}>发生时间</td>
					<td style={cellStyle}>{new Date(event.occurredAt).toLocaleString()}</td>
				</tr>
			</tbody>
		</table>
	);
}

function TargetTable({ event }: { event: ExportMailEvent }) {
	if (!event.targets || event.targets.length === 0) return null;

	return (
		<>
			<h2 style={sectionTitleStyle}>目标摘要</h2>
			<table style={targetTableStyle}>
				<thead>
					<tr>
						<th style={cellStyle}>贴吧</th>
						<th style={cellStyle}>状态</th>
						<th style={cellStyle}>已扫页数</th>
						<th style={cellStyle}>已发现主题</th>
						<th style={cellStyle}>已存储主题</th>
					</tr>
				</thead>
				<tbody>
					{event.targets.map((target) => (
						<tr key={target.forumName}>
							<td style={cellStyle}>{target.forumName}</td>
							<td style={cellStyle}>{target.status}</td>
							<td style={cellStyle}>{target.pagesScanned}</td>
							<td style={cellStyle}>{target.threadsFound}</td>
							<td style={cellStyle}>{target.threadsStored}</td>
						</tr>
					))}
				</tbody>
			</table>
		</>
	);
}

function ErrorBlock({ event }: { event: ExportMailEvent }) {
	if (!event.errorMessage) return null;

	return (
		<>
			<h2 style={sectionTitleStyle}>错误信息</h2>
			<pre
				style={{
					backgroundColor: "#fff1f2",
					border: "1px solid #fecdd3",
					borderRadius: "8px",
					padding: "12px",
					whiteSpace: "pre-wrap",
					fontSize: "13px",
					lineHeight: "20px",
					color: "#9f1239",
				}}
			>
				{event.errorMessage}
			</pre>
		</>
	);
}

function ExportMailPage({ event }: { event: ExportMailEvent }) {
	return (
		<html lang="zh-CN">
			<body style={pageStyle}>
				<div style={cardStyle}>
					<p style={{ ...mutedStyle, marginTop: 0 }}>
						jobKey: {event.jobKey}
					</p>
					<h1 style={{ margin: "0 0 12px", fontSize: "24px" }}>
						{headingForEvent(event)}
					</h1>
					<p style={mutedStyle}>{introForEvent(event)}</p>
					<h2 style={sectionTitleStyle}>任务摘要</h2>
					<SummaryTable event={event} />
					<TargetTable event={event} />
					<ErrorBlock event={event} />
					<p style={{ ...mutedStyle, marginTop: "24px" }}>
						这封邮件由 eazy-tieba export 通知服务自动发送。
					</p>
				</div>
			</body>
		</html>
	);
}

export function subjectForExportMail(event: ExportMailEvent): string {
	switch (event.eventType) {
		case "started":
			return `[Export] Started: ${event.jobName}`;
		case "progress":
			return `[Export] Progress: ${event.jobName} (${event.summary.forumsDone}/${event.summary.forumsTotal})`;
		case "completed":
			return `[Export] Completed: ${event.jobName}`;
		case "failed":
			return `[Export] Failed: ${event.jobName}`;
	}
}

function renderText(event: ExportMailEvent): string {
	const lines = [
		headingForEvent(event),
		`任务名称: ${event.jobName}`,
		`任务状态: ${event.status}`,
		`jobKey: ${event.jobKey}`,
		`发生时间: ${new Date(event.occurredAt).toLocaleString()}`,
		"",
		formatCount("贴吧进度", event.summary.forumsDone) +
			` / ${event.summary.forumsTotal}`,
		formatCount("已发现主题", event.summary.threadsFound),
		formatCount("已存储主题", event.summary.threadsStored),
		formatCount("已存储楼层", event.summary.postsStored),
		formatCount("已存储楼中楼", event.summary.subPostsStored),
	];

	if (event.targets && event.targets.length > 0) {
		lines.push("", "目标摘要:");
		for (const target of event.targets) {
			lines.push(
				`- ${target.forumName}: 状态=${target.status}, 已扫页数=${target.pagesScanned}, 已发现主题=${target.threadsFound}, 已存储主题=${target.threadsStored}`,
			);
		}
	}

	if (event.errorMessage) {
		lines.push("", "错误信息:", event.errorMessage);
	}

	return lines.join("\n");
}

export function renderExportMail(event: ExportMailEvent): {
	html: string;
	text: string;
} {
	return {
		html: `<!DOCTYPE html>${renderToStaticMarkup(
			<ExportMailPage event={event} />,
		)}`,
		text: renderText(event),
	};
}
