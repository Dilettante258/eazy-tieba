import { useCallback, useRef, useState } from "react";

// ── 聚合结果类型（与后端一致） ──────────────────────────

export interface ForumAnalysisResult {
	meta: {
		fname: string;
		threadCount: number;
		postCount: number;
		uniqueUsers: number;
	};
	ipDistribution: Array<{
		name: string;
		value: number;
		topUsers: string[];
	}>;
	levelDistribution: Array<{ name: string; value: number }>;
	timeDistribution: Array<{ date: number; hour: number }>;
	topUsers: Array<{ name: string; value: number; portrait: string }>;
	threadHeat: Array<{
		title: string;
		tid: string;
		author: string;
		replyNum: number;
		viewNum: number;
		agreeNum: number;
	}>;
	wordCloud: Array<{ name: string; value: number }>;
	ipChangedUsers: Array<{
		name: string;
		portrait: string;
		ips: string[];
		postCount: number;
	}>;
}

// ── Hook 状态 ──────────────────────────────────────────

export interface ForumAnalysisState {
	status: "idle" | "loading" | "done" | "error";
	phase: "" | "threads" | "posts";
	threadCount: number;
	postsFetched: number;
	data: ForumAnalysisResult | null;
	error?: string;
}

const INITIAL_STATE: ForumAnalysisState = {
	status: "idle",
	phase: "",
	threadCount: 0,
	postsFetched: 0,
	data: null,
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Hook ──────────────────────────────────────────────

export function useForumAnalysis() {
	const [state, setState] = useState<ForumAnalysisState>(INITIAL_STATE);
	const esRef = useRef<EventSource | null>(null);

	const start = useCallback(
		(fname: string, sort: number, count: number, depth: string) => {
			// 关闭之前的连接
			esRef.current?.close();

			setState({
				status: "loading",
				phase: "threads",
				threadCount: 0,
				postsFetched: 0,
				data: null,
			});

			const params = new URLSearchParams({
				fname,
				sort: String(sort),
				count: String(count),
				depth,
			});
			const es = new EventSource(`${API_BASE}/forum/analyze?${params}`);
			esRef.current = es;

			es.onmessage = (e) => {
				try {
					const msg = JSON.parse(e.data);
					switch (msg.type) {
						case "threads":
							setState((s) => ({
								...s,
								phase: "posts",
								threadCount: msg.count,
							}));
							break;
						case "post":
							setState((s) => ({
								...s,
								postsFetched: s.postsFetched + 1,
							}));
							break;
						case "done":
							setState((s) => ({
								...s,
								status: "done",
								data: msg.data,
							}));
							es.close();
							break;
						case "error":
							setState((s) => ({
								...s,
								status: "error",
								error: msg.message,
							}));
							es.close();
							break;
					}
				} catch {
					// 忽略解析错误
				}
			};

			es.onerror = () => {
				setState((s) => {
					// 如果已经 done 了就忽略
					if (s.status === "done") return s;
					return { ...s, status: "error", error: "连接中断" };
				});
				es.close();
			};
		},
		[],
	);

	const reset = useCallback(() => {
		esRef.current?.close();
		setState(INITIAL_STATE);
	}, []);

	return { ...state, start, reset };
}
