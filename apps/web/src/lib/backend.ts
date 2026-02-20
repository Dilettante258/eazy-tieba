import {
	BACKEND_ENDPOINTS,
	BACKUP_BACKEND,
	PRODUCTION_BACKEND,
	type BackendNode,
	type BackendPreference,
} from "./backend-config.ts";
import { useSettingsStore } from "./settings-store.ts";

const HEALTH_PATH = "/health";
const HEALTH_TIMEOUT_MS = 3000;

let inflightProbe: Promise<BackendNode> | null = null;

function buildUrl(base: string, path: string): string {
	return new URL(path, `${base.replace(/\/+$/, "")}/`).toString();
}

async function checkBackend(node: BackendNode): Promise<boolean> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);
	try {
		const res = await fetch(buildUrl(BACKEND_ENDPOINTS[node], HEALTH_PATH), {
			method: "GET",
			cache: "no-store",
			signal: controller.signal,
		});
		return res.ok;
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}

async function selectBackend(preference: BackendPreference): Promise<{
	node: BackendNode;
	message: string;
}> {
	if (preference === "local") {
		return {
			node: "local",
			message: "已固定使用本地节点（开发环境）",
		};
	}
	if (preference === "foreign") {
		return {
			node: "foreign",
			message: "已固定使用 CF Worker 备用节点",
		};
	}

	const productionOK = await checkBackend(PRODUCTION_BACKEND);
	if (productionOK) {
		return {
			node: PRODUCTION_BACKEND,
			message: "生产节点可用，正在使用北京节点",
		};
	}

	const backupOK = await checkBackend(BACKUP_BACKEND);
	if (backupOK) {
		return {
			node: BACKUP_BACKEND,
			message: "生产节点不可用，已自动切换到备用节点",
		};
	}

	return {
		node: BACKUP_BACKEND,
		message: "生产与备用节点均不可用，已保留备用节点配置",
	};
}

function applyProbeResult({
	node,
	message,
}: {
	node: BackendNode;
	message: string;
}) {
	useSettingsStore.setState({
		activeBackend: node,
		backendChecking: false,
		backendProbeMessage: message,
		backendProbeAt: Date.now(),
	});
}

function applyProbeError() {
	useSettingsStore.setState({
		activeBackend: BACKUP_BACKEND,
		backendChecking: false,
		backendProbeMessage: "节点检测失败，已切换到备用节点",
		backendProbeAt: Date.now(),
	});
}

export async function ensureBackendReady(force = false): Promise<BackendNode> {
	const state = useSettingsStore.getState();
	if (!force && state.backendProbeAt && !state.backendChecking) {
		return state.activeBackend;
	}
	if (inflightProbe) {
		return inflightProbe;
	}

	useSettingsStore.setState({
		backendChecking: true,
		backendProbeMessage: "正在检测节点可用性...",
	});

	inflightProbe = (async () => {
		const preference = useSettingsStore.getState().backendPreference;
		const result = await selectBackend(preference);
		applyProbeResult(result);
		return result.node;
	})().catch((error) => {
		console.error("backend probe failed:", error);
		applyProbeError();
		return BACKUP_BACKEND;
	});

	try {
		return await inflightProbe;
	} finally {
		inflightProbe = null;
	}
}

export function getApiBaseUrl(): string {
	const node = useSettingsStore.getState().activeBackend;
	return BACKEND_ENDPOINTS[node];
}

export async function resolveApiBaseUrl(): Promise<string> {
	const node = await ensureBackendReady();
	return BACKEND_ENDPOINTS[node];
}

export function buildApiUrl(path: string): string {
	return buildUrl(getApiBaseUrl(), path);
}

export async function resolveApiUrl(path: string): Promise<string> {
	const base = await resolveApiBaseUrl();
	return buildUrl(base, path);
}
