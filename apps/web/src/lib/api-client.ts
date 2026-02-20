import type { AppType } from "@tieba/api";
import { hc } from "hono/client";
import { BACKEND_ENDPOINTS } from "./backend-config.ts";
import { resolveApiBaseUrl } from "./backend.ts";

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
		if (input instanceof Request) {
			return fetch(new Request(remapped, input), init);
		}
		return fetch(remapped, init);
	},
});
