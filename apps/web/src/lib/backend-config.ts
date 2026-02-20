export const BACKEND_ENDPOINTS = {
	local: "http://localhost:8000",
	domestic: "https://zwrcjbwbskoa.sealosbja.site",
	foreign: "https://cf.eztb.org",
} as const;

export const PRODUCTION_BACKEND = "domestic";
export const BACKUP_BACKEND = "foreign";

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
