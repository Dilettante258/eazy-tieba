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

function formatDateTime(value: string | Date | null): string {
	if (!value) return "\u6682\u65e0";
	const date = value instanceof Date ? value : new Date(value);
	return date.toLocaleString("zh-CN", { hour12: false });
}

function formatDuration(seconds: number | null): string {
	if (seconds === null) return "\u6682\u65e0\u6cd5\u4f30\u7b97";
	if (seconds <= 0) return "\u5373\u5c06\u5b8c\u6210";

	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	const remainingSeconds = seconds % 60;
	const parts: string[] = [];

	if (hours > 0) parts.push(`${hours}\u5c0f\u65f6`);
	if (minutes > 0) parts.push(`${minutes}\u5206\u949f`);
	if (hours === 0 && remainingSeconds > 0) {
		parts.push(`${remainingSeconds}\u79d2`);
	}

	return parts.join("") || `${seconds}\u79d2`;
}

function estimateSourceLabel(event: ExportMailEvent): string {
	switch (event.estimate.basedOn) {
		case "history":
			return `\u57fa\u4e8e\u5386\u53f2\u8bb0\u5f55\uff08${event.estimate.historySampleSize}\u6b21\uff09`;
		case "progress":
			return "\u57fa\u4e8e\u5f53\u524d\u8fdb\u5ea6";
		case "blended":
			return `\u57fa\u4e8e\u5386\u53f2\u8bb0\u5f55\u4e0e\u5f53\u524d\u8fdb\u5ea6\uff08${event.estimate.historySampleSize}\u6b21\u5386\u53f2\uff09`;
		case "insufficient_data":
			return "\u6570\u636e\u4e0d\u8db3";
	}
}

function headingForEvent(event: ExportMailEvent): string {
	switch (event.eventType) {
		case "started":
			return "\u5bfc\u51fa\u4efb\u52a1\u5df2\u542f\u52a8";
		case "progress":
			return "\u5bfc\u51fa\u4efb\u52a1\u8fdb\u5ea6\u66f4\u65b0";
		case "completed":
			return "\u5bfc\u51fa\u4efb\u52a1\u5df2\u5b8c\u6210";
		case "failed":
			return "\u5bfc\u51fa\u4efb\u52a1\u6267\u884c\u5931\u8d25";
	}
}

function introForEvent(event: ExportMailEvent): string {
	switch (event.eventType) {
		case "started":
			return "\u4efb\u52a1\u5df2\u5f00\u59cb\u6267\u884c\uff0c\u4e0b\u9762\u662f\u5f53\u524d\u7684\u521d\u59cb\u6982\u8981\u4e0e\u65f6\u95f4\u9884\u4f30\u3002";
		case "progress":
			return "\u4efb\u52a1\u4ecd\u5728\u8fd0\u884c\u4e2d\uff0c\u8fd9\u662f\u4e00\u5c01\u6309\u95f4\u9694\u53d1\u9001\u7684\u8fdb\u5ea6\u901a\u77e5\u3002";
		case "completed":
			return "\u4efb\u52a1\u5df2\u7ecf\u7ed3\u675f\u5e76\u5b8c\u6210\u5168\u90e8\u5904\u7406\uff0c\u4e0b\u9762\u662f\u6700\u7ec8\u7ed3\u679c\u3002";
		case "failed":
			return "\u4efb\u52a1\u6267\u884c\u8fc7\u7a0b\u4e2d\u51fa\u73b0\u9519\u8bef\uff0c\u4e0b\u9762\u662f\u5931\u8d25\u65f6\u7684\u8fd0\u884c\u6982\u8981\u3002";
	}
}

function SummaryTable({ event }: { event: ExportMailEvent }) {
	return (
		<table style={metricGridStyle}>
			<tbody>
				<tr>
					<td style={cellStyle}>\u4efb\u52a1\u540d\u79f0</td>
					<td style={cellStyle}>{event.jobName}</td>
					<td style={cellStyle}>\u4efb\u52a1\u72b6\u6001</td>
					<td style={cellStyle}>{event.status}</td>
				</tr>
				<tr>
					<td style={cellStyle}>\u8d34\u5427\u8fdb\u5ea6</td>
					<td style={cellStyle}>
						{event.summary.forumsDone}/{event.summary.forumsTotal}
					</td>
					<td style={cellStyle}>\u5df2\u53d1\u73b0\u4e3b\u9898</td>
					<td style={cellStyle}>{event.summary.threadsFound}</td>
				</tr>
				<tr>
					<td style={cellStyle}>\u5df2\u5b58\u50a8\u4e3b\u9898</td>
					<td style={cellStyle}>{event.summary.threadsStored}</td>
					<td style={cellStyle}>\u5df2\u5b58\u50a8\u697c\u5c42</td>
					<td style={cellStyle}>{event.summary.postsStored}</td>
				</tr>
				<tr>
					<td style={cellStyle}>\u5df2\u5b58\u50a8\u697c\u4e2d\u697c</td>
					<td style={cellStyle}>{event.summary.subPostsStored}</td>
					<td style={cellStyle}>\u53d1\u751f\u65f6\u95f4</td>
					<td style={cellStyle}>{formatDateTime(event.occurredAt)}</td>
				</tr>
			</tbody>
		</table>
	);
}

function EstimateTable({ event }: { event: ExportMailEvent }) {
	return (
		<table style={metricGridStyle}>
			<tbody>
				<tr>
					<td style={cellStyle}>\u5269\u4f59\u4efb\u52a1\u6570</td>
					<td style={cellStyle}>{event.estimate.remainingTasks}</td>
					<td style={cellStyle}>\u5269\u4f59\u8d34\u5427\u6570</td>
					<td style={cellStyle}>{event.estimate.remainingForums}</td>
				</tr>
				<tr>
					<td style={cellStyle}>\u5269\u4f59\u5217\u8868\u9875\u4efb\u52a1</td>
					<td style={cellStyle}>{event.estimate.remainingForumPageTasks}</td>
					<td style={cellStyle}>\u5269\u4f59\u4e3b\u9898\u4efb\u52a1</td>
					<td style={cellStyle}>{event.estimate.remainingThreadTasks}</td>
				</tr>
				<tr>
					<td style={cellStyle}>\u5df2\u8fd0\u884c\u65f6\u957f</td>
					<td style={cellStyle}>{formatDuration(event.estimate.elapsedSeconds)}</td>
					<td style={cellStyle}>\u9884\u8ba1\u5269\u4f59\u65f6\u95f4</td>
					<td style={cellStyle}>
						{formatDuration(event.estimate.estimatedRemainingSeconds)}
					</td>
				</tr>
				<tr>
					<td style={cellStyle}>\u9884\u8ba1\u7ed3\u675f\u65f6\u95f4</td>
					<td style={cellStyle}>
						{formatDateTime(event.estimate.estimatedCompletionAt)}
					</td>
					<td style={cellStyle}>\u4f30\u7b97\u4f9d\u636e</td>
					<td style={cellStyle}>{estimateSourceLabel(event)}</td>
				</tr>
			</tbody>
		</table>
	);
}

function TargetTable({ event }: { event: ExportMailEvent }) {
	if (!event.targets || event.targets.length === 0) return null;

	return (
		<>
			<h2 style={sectionTitleStyle}>\u76ee\u6807\u6458\u8981</h2>
			<table style={targetTableStyle}>
				<thead>
					<tr>
						<th style={cellStyle}>\u8d34\u5427</th>
						<th style={cellStyle}>\u72b6\u6001</th>
						<th style={cellStyle}>\u5df2\u626b\u9875\u6570</th>
						<th style={cellStyle}>\u5df2\u53d1\u73b0\u4e3b\u9898</th>
						<th style={cellStyle}>\u5df2\u5b58\u50a8\u4e3b\u9898</th>
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
			<h2 style={sectionTitleStyle}>\u9519\u8bef\u4fe1\u606f</h2>
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
					<p style={{ ...mutedStyle, marginTop: 0 }}>jobKey: {event.jobKey}</p>
					<h1 style={{ margin: "0 0 12px", fontSize: "24px" }}>
						{headingForEvent(event)}
					</h1>
					<p style={mutedStyle}>{introForEvent(event)}</p>
					<h2 style={sectionTitleStyle}>\u4efb\u52a1\u6458\u8981</h2>
					<SummaryTable event={event} />
					<h2 style={sectionTitleStyle}>\u65f6\u95f4\u9884\u4f30</h2>
					<EstimateTable event={event} />
					<TargetTable event={event} />
					<ErrorBlock event={event} />
					<p style={{ ...mutedStyle, marginTop: "24px" }}>
						\u8fd9\u5c01\u90ae\u4ef6\u7531 eazy-tieba export \u901a\u77e5\u670d\u52a1\u81ea\u52a8\u53d1\u9001\u3002
					</p>
				</div>
			</body>
		</html>
	);
}

export function subjectForExportMail(event: ExportMailEvent): string {
	switch (event.eventType) {
		case "started":
			return `[\u5bfc\u51fa] \u5df2\u542f\u52a8\uff1a${event.jobName}`;
		case "progress":
			return `[\u5bfc\u51fa] \u8fdb\u5ea6\u66f4\u65b0\uff1a${event.jobName} (${event.summary.forumsDone}/${event.summary.forumsTotal})`;
		case "completed":
			return `[\u5bfc\u51fa] \u5df2\u5b8c\u6210\uff1a${event.jobName}`;
		case "failed":
			return `[\u5bfc\u51fa] \u5df2\u5931\u8d25\uff1a${event.jobName}`;
	}
}

function renderText(event: ExportMailEvent): string {
	const lines = [
		headingForEvent(event),
		`\u4efb\u52a1\u540d\u79f0: ${event.jobName}`,
		`\u4efb\u52a1\u72b6\u6001: ${event.status}`,
		`jobKey: ${event.jobKey}`,
		`\u53d1\u751f\u65f6\u95f4: ${formatDateTime(event.occurredAt)}`,
		"",
		formatCount("\u8d34\u5427\u8fdb\u5ea6", event.summary.forumsDone) +
			` / ${event.summary.forumsTotal}`,
		formatCount("\u5df2\u53d1\u73b0\u4e3b\u9898", event.summary.threadsFound),
		formatCount("\u5df2\u5b58\u50a8\u4e3b\u9898", event.summary.threadsStored),
		formatCount("\u5df2\u5b58\u50a8\u697c\u5c42", event.summary.postsStored),
		formatCount("\u5df2\u5b58\u50a8\u697c\u4e2d\u697c", event.summary.subPostsStored),
		"",
		`\u5269\u4f59\u4efb\u52a1\u6570: ${event.estimate.remainingTasks}`,
		`\u5269\u4f59\u8d34\u5427\u6570: ${event.estimate.remainingForums}`,
		`\u5269\u4f59\u5217\u8868\u9875\u4efb\u52a1: ${event.estimate.remainingForumPageTasks}`,
		`\u5269\u4f59\u4e3b\u9898\u4efb\u52a1: ${event.estimate.remainingThreadTasks}`,
		`\u5df2\u8fd0\u884c\u65f6\u957f: ${formatDuration(event.estimate.elapsedSeconds)}`,
		`\u9884\u8ba1\u5269\u4f59\u65f6\u95f4: ${formatDuration(event.estimate.estimatedRemainingSeconds)}`,
		`\u9884\u8ba1\u7ed3\u675f\u65f6\u95f4: ${formatDateTime(event.estimate.estimatedCompletionAt)}`,
		`\u4f30\u7b97\u4f9d\u636e: ${estimateSourceLabel(event)}`,
	];

	if (event.targets && event.targets.length > 0) {
		lines.push("", "\u76ee\u6807\u6458\u8981:");
		for (const target of event.targets) {
			lines.push(
				`- ${target.forumName}: \u72b6\u6001=${target.status}, \u5df2\u626b\u9875\u6570=${target.pagesScanned}, \u5df2\u53d1\u73b0\u4e3b\u9898=${target.threadsFound}, \u5df2\u5b58\u50a8\u4e3b\u9898=${target.threadsStored}`,
			);
		}
	}

	if (event.errorMessage) {
		lines.push("", "\u9519\u8bef\u4fe1\u606f:", event.errorMessage);
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
