import { queryOptions, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api-client.ts";
import type { ClientResponse } from "hono/client";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type Method = "id" | "uid" | "un";

/** 检查响应状态码，非 2xx 抛出错误以触发 TanStack Query 的 error 状态 */
async function unwrap<T extends Record<string, unknown> | Record<string, unknown>[]>(res: ClientResponse<T, ContentfulStatusCode, "json">): Promise<T> {
	if (!res.ok) {
		let message = `请求失败 (${res.status})`;
		try {
			const json = await res.json();
			if (!Array.isArray(json) && (json.message || json.error)) {
				message = String(json.message || json.error);
			}
		} catch {
			// 非 JSON 响应体
		}
		throw new Error(message);
	}
	return res.json() as Promise<T>;
}

// ── queryOptions 工厂（供路由 loader 使用） ──

export const condenseProfileOptions = (method: Method, id: string) =>
	queryOptions({
		queryKey: ["condenseProfile", method, id] as const,
		queryFn: () =>
			api.user.condenseProfile
				.$get({ query: { method, id } })
				.then(unwrap),
		enabled: !!method && !!id,
	});

export const userInfoOptions = (method: Method, id: string) =>
	queryOptions({
		queryKey: ["userInfo", method, id] as const,
		queryFn: () =>
			api.user.info.$get({ query: { method, id } }).then(unwrap),
		enabled: !!method && !!id,
	});

export const profileOptions = (method: Method, id: string) =>
	queryOptions({
		queryKey: ["profile", method, id] as const,
		queryFn: () =>
			api.user.profile.$get({ query: { method, id } }).then(unwrap),
		enabled: !!method && !!id,
	});

export const userPostsOptions = (method: Method, id: string, page: number) =>
	queryOptions({
		queryKey: ["userPosts", method, id, page] as const,
		queryFn: () =>
			api.user.posts
				.$get({ query: { method, id, page: String(page) } })
				.then(unwrap),
		enabled: !!method && !!id,
	});

export const followOptions = (method: Method, id: string) =>
	queryOptions({
		queryKey: ["follow", method, id] as const,
		queryFn: () =>
			api.user.follow
				.$get({ query: { method, id, page: "ALL" } })
				.then(unwrap),
		enabled: !!method && !!id,
	});

export const fansOptions = (method: Method, id: string) =>
	queryOptions({
		queryKey: ["fans", method, id] as const,
		queryFn: () =>
			api.user.fan
				.$get({ query: { method, id, page: "ALL" } })
				.then(unwrap),
		enabled: !!method && !!id,
	});

export const likeForumsOptions = (method: Method, id: string) =>
	queryOptions({
		queryKey: ["likeForum", method, id] as const,
		queryFn: () =>
			api.user.likeForum
				.$get({ query: { method, id } })
				.then(unwrap),
		enabled: !!method && !!id,
	});

// ── React Query hooks（供组件直接使用） ──

export const useCondenseProfile = (method: Method, id: string) =>
	useQuery(condenseProfileOptions(method, id));

export const useUserInfo = (method: Method, id: string) =>
	useQuery(userInfoOptions(method, id));

export const useProfile = (method: Method, id: string) =>
	useQuery(profileOptions(method, id));

export const useUserPosts = (method: Method, id: string, page: number) =>
	useQuery(userPostsOptions(method, id, page));

export const useFollow = (method: Method, id: string) =>
	useQuery(followOptions(method, id));

export const useFans = (method: Method, id: string) =>
	useQuery(fansOptions(method, id));

export const useLikeForums = (method: Method, id: string) =>
	useQuery(likeForumsOptions(method, id));

// ── 发帖分析：批量加载 infinite query ──

export function usePostsBatchInfinite(method: Method, id: string) {
	return useInfiniteQuery({
		queryKey: ["postsBatch", method, id] as const,
		queryFn: async ({ pageParam }) => {
			const res = await api.user.postsBatch.$get({
				query: {
					method,
					id,
					fromP: String(pageParam[0]),
					toP: String(pageParam[1]),
				},
			});
			return unwrap(res);
		},
		initialPageParam: [1, 10] as [number, number],
		getNextPageParam: (lastPage, _allPages, lastParam) => {
			if (!Array.isArray(lastPage) || lastPage.length === 0) return undefined;
			return [lastParam[0] + 10, lastParam[1] + 10] as [number, number];
		},
		enabled: !!method && !!id,
	});
}
