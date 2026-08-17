import type { AppType } from "@tieba/api";
import { hc } from "hono/client";
import { resolveApiBaseUrl } from "./backend.ts";
import { BACKEND_ENDPOINTS } from "./backend-config.ts";
import {
	clearDbAnalyzeToken,
	DB_ANALYZE_AUTH_EXPIRED_EVENT,
	getDbAnalyzeToken,
} from "./db-analyze-auth.ts";

function remapUrl(input: RequestInfo | URL, targetBase: string): string {
	const original =
		typeof input === "string"
			? new URL(input, BACKEND_ENDPOINTS.domestic)
			: input instanceof URL
				? new URL(input.toString())
				: new URL(input.url);
	const target = new URL(targetBase);
	original.protocol = target.protocol;
	original.host = target.host;
	return original.toString();
}

export const api = hc<AppType>(BACKEND_ENDPOINTS.domestic, {
	fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
		const base = await resolveApiBaseUrl();
		const remapped = remapUrl(input, base);
		let request =
			input instanceof Request
				? new Request(remapped, input)
				: new Request(remapped, init);
		if (input instanceof Request && init) {
			request = new Request(request, init);
		}
		const isDbAnalyzeRequest = new URL(remapped).pathname.startsWith(
			"/db-analyze/",
		);
		const isSessionRequest = new URL(remapped).pathname.endsWith(
			"/auth/session",
		);
		const token = isDbAnalyzeRequest ? getDbAnalyzeToken() : null;
		if (token) {
			const headers = new Headers(request.headers);
			headers.set("Authorization", `Bearer ${token}`);
			request = new Request(request, { headers });
		}
		const response = await fetch(request);
		if (isDbAnalyzeRequest && response.status === 401) {
			clearDbAnalyzeToken();
			if (!isSessionRequest) {
				window.dispatchEvent(new Event(DB_ANALYZE_AUTH_EXPIRED_EVENT));
			}
		}
		return response;
	},
});
