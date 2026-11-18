export const BACKEND_ENDPOINTS = {
	local: "http://localhost:8000",
	domestic: "https://zwrcjbwbskoa.sealosbja.site",
	foreign: "https://cf.eztb.org",
} as const;

export const PRODUCTION_BACKEND = "domestic";
export const BACKUP_BACKEND = "foreign";

const isLocalWeb =
	typeof window !== "undefined" &&
	["localhost", "127.0.0.1"].includes(window.location.hostname);

/** 近期发言使用独立 API，避免影响保留在 8000 端口的旧后端。 */
export const RECENT_POSTS_BACKEND =
	import.meta.env.VITE_RECENT_POSTS_API_URL ??
	(isLocalWeb ? "http://localhost:8001" : BACKEND_ENDPOINTS.domestic);

export type BackendNode = keyof typeof BACKEND_ENDPOINTS;
export type BackendPreference = "auto" | BackendNode;

export const BACKEND_NODE_LABELS: Record<BackendNode, string> = {
	local: "本地节点（开发）",
	domestic: "北京节点（生产）",
	foreign: "CF Worker（备用）",
};

export const BACKEND_PREFERENCE_LABELS: Record<BackendPreference, string> = {
	auto: "自动（优先北京节点，故障自动切换）",
	local: "本地节点（开发）",
	domestic: "北京节点（生产）",
	foreign: "CF Worker（备用）",
};

export const BACKEND_PREFERENCE_OPTIONS = [
	"auto",
	"domestic",
	"foreign",
	"local",
] as const satisfies readonly BackendPreference[];

export function isBackendPreference(
	value: unknown,
): value is BackendPreference {
	return (
		typeof value === "string" &&
		["auto", "local", "domestic", "foreign"].includes(value)
	);
}
