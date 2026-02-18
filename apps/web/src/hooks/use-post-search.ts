import { useCallback, useRef, useState } from "react";

// ── 搜索结果类型（与后端一致） ──────────────────────────

export interface SearchResultPost {
	tid: string;
	threadTitle: string;
	pid: string;
	floor: number;
	content: string;
	authorName: string;
	authorPortrait: string;
	time: number;
}

// ── Hook 状态 ──────────────────────────────────────────

export interface PostSearchState {
	status: "idle" | "loading" | "done" | "error";
	phase: "" | "threads" | "searching";
	threadCount: number;
	threadsSearched: number;
	results: SearchResultPost[];
	error?: string;
}

const INITIAL_STATE: PostSearchState = {
	status: "idle",
	phase: "",
	threadCount: 0,
	threadsSearched: 0,
	results: [],
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8000";

// ── Hook ──────────────────────────────────────────────

export function usePostSearch() {
	const [state, setState] = useState<PostSearchState>(INITIAL_STATE);
	const esRef = useRef<EventSource | null>(null);

	const start = useCallback(
		(params: {
			fname: string;
			/** "type:value" 格式的逗号分隔字符串 */
			users: string;
			/** 逗号分隔的关键词 */
			keywords: string;
			sort: number;
			count: number;
			depth: string;
		}) => {
			esRef.current?.close();

			setState({
				status: "loading",
				phase: "threads",
				threadCount: 0,
				threadsSearched: 0,
				results: [],
			});

			const qs = new URLSearchParams({
				fname: params.fname,
				users: params.users,
				keywords: params.keywords,
				sort: String(params.sort),
				count: String(params.count),
				depth: params.depth,
			});
			const es = new EventSource(`${API_BASE}/forum/search?${qs}`);
			esRef.current = es;

			es.onmessage = (e) => {
				try {
					const msg = JSON.parse(e.data);
					switch (msg.type) {
						case "threads":
							setState((s) => ({
								...s,
								phase: "searching",
								threadCount: msg.count,
							}));
							break;
						case "progress":
							setState((s) => ({
								...s,
								threadsSearched: s.threadsSearched + 1,
							}));
							break;
						case "match":
							setState((s) => ({
								...s,
								results: [...s.results, ...msg.posts],
							}));
							break;
						case "done":
							setState((s) => ({
								...s,
								status: "done",
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
