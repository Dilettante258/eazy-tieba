import { useCallback, useRef, useState } from "react";
import { resolveApiUrl } from "../lib/backend.ts";

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
		userCount: number;
	}>;
	levelDistribution: Array<{ name: string; value: number }>;
	timeDistribution: {
		mode: "hour" | "day";
		data: Array<{ time: number; type: string; value: number }>;
	};
	topUsers: Array<{ name: string; value: number; portrait: string }>;
	threadHeat: Array<{
		title: string;
		tid: string;
		author: string;
		replyNum: number;
		viewNum: number;
		agreeNum: number;
	}>;
	topLikedPosts: Array<{
		tid: string;
		title: string;
		floor: number;
		author: string;
		content: string;
		agreeNum: number;
	}>;
	topRepliedReplies: Array<{
		tid: string;
		title: string;
		floor: number;
		author: string;
		content: string;
		subPostNumber: number;
	}>;
	hotUsers: Array<{
		name: string;
		portrait: string;
		threadCount: number;
		replyCount: number;
		totalAgrees: number;
		score: number;
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

// ── Hook ──────────────────────────────────────────────

export function useForumAnalysis() {
	const [state, setState] = useState<ForumAnalysisState>(INITIAL_STATE);
	const esRef = useRef<EventSource | null>(null);
	const runIdRef = useRef(0);

	const start = useCallback(
		(
			fname: string,
			sort: number,
			count: number,
			depth: string,
			weights?: { thread: number; reply: number; agree: number },
		) => {
			runIdRef.current += 1;
			const runId = runIdRef.current;

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
			if (weights) {
				params.set("tw", String(weights.thread));
				params.set("rw", String(weights.reply));
				params.set("aw", String(weights.agree));
			}
			void resolveApiUrl("/forum/analyze")
				.then((url) => {
					if (runIdRef.current !== runId) return;
					const es = new EventSource(`${url}?${params}`);
					esRef.current = es;

					es.onmessage = (e) => {
						if (runIdRef.current !== runId) return;
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
						if (runIdRef.current !== runId) return;
						setState((s) => {
							// 如果已经 done 了就忽略
							if (s.status === "done") return s;
							return { ...s, status: "error", error: "连接中断" };
						});
						es.close();
					};
				})
				.catch(() => {
					if (runIdRef.current !== runId) return;
					setState((s) => ({
						...s,
						status: "error",
						error: "节点检测失败或不可用",
					}));
				});
		},
		[],
	);

	const reset = useCallback(() => {
		runIdRef.current += 1;
		esRef.current?.close();
		setState(INITIAL_STATE);
	}, []);

	return { ...state, start, reset };
}
