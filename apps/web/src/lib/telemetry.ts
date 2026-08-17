import * as Sentry from "@sentry/react";
import { useSettingsStore } from "./settings-store.ts";

type TelemetryAttributes = Record<string, string | number | boolean>;
type SettingsState = ReturnType<typeof useSettingsStore.getState>;
const FIRST_USE_REPORTED_KEY = "eztb.telemetry.first-use.v1";

const PRIMITIVE_SETTING_KEYS = [
	"forumTopUsersCount",
	"forumMergeHighLevels",
	"maxImageConcurrency",
	"hideHomeHero",
	"backendPreference",
	"themePreference",
] as const satisfies readonly (keyof SettingsState)[];

const RECORD_SETTING_KEYS = [
	"panelVisibility",
	"forumPanelVisibility",
	"hotUserWeights",
] as const satisfies readonly (keyof SettingsState)[];

const LIST_SETTING_KEYS = [
	"blockedForums",
	"highlightedForums",
	"highlightedUsers",
	"highlightedKeywords",
	"blockedWordCloudKeywords",
	"wordCloudCustomKeywords",
] as const satisfies readonly (keyof SettingsState)[];

interface SettingChange {
	key: string;
	before?: string | number | boolean;
	after?: string | number | boolean;
	beforeCount?: number;
	afterCount?: number;
	operation?: "add" | "remove" | "replace";
}

function trackUserAction(
	message: string,
	action: string,
	attributes: TelemetryAttributes = {},
) {
	if (!Sentry.getClient()) return false;

	const data = { "eztb.action": action, ...attributes };
	Sentry.logger.info(message, data);
	Sentry.addBreadcrumb({
		category: "user.action",
		level: "info",
		message,
		data,
	});
	return true;
}

/** 每个浏览器存储空间只上报一次；使用新 key 可覆盖所有现有用户。 */
export function recordFirstUse() {
	if (localStorage.getItem(FIRST_USE_REPORTED_KEY)) return false;

	const recorded = trackUserAction("App first use", "app.first_use");
	if (recorded) localStorage.setItem(FIRST_USE_REPORTED_KEY, "1");
	return recorded;
}

export function recordPwaInstalled(
	source: "appinstalled" | "install_prompt" | "standalone",
) {
	return trackUserAction("PWA installed", "pwa.installed", {
		"eztb.pwa.source": source,
	});
}

export function recordPwaInstallPrompt(
	outcome: "accepted" | "dismissed",
	platform: string,
) {
	trackUserAction("PWA install prompt completed", "pwa.install_prompt", {
		"eztb.pwa.outcome": outcome,
		"eztb.pwa.platform": platform || "unknown",
	});
}

function getRecordChanges(
	settingKey: string,
	current: Record<string, unknown>,
	previous: Record<string, unknown>,
) {
	const changes: SettingChange[] = [];
	for (const key of new Set([
		...Object.keys(previous),
		...Object.keys(current),
	])) {
		const before = previous[key];
		const after = current[key];
		if (before === after) continue;
		if (
			(typeof before === "boolean" || typeof before === "number") &&
			(typeof after === "boolean" || typeof after === "number")
		) {
			changes.push({ key: `${settingKey}.${key}`, before, after });
		}
	}
	return changes;
}

function getSettingsChanges(current: SettingsState, previous: SettingsState) {
	const changes: SettingChange[] = [];

	for (const key of PRIMITIVE_SETTING_KEYS) {
		const before = previous[key];
		const after = current[key];
		if (before !== after) {
			changes.push({ key, before, after });
		}
	}

	for (const key of RECORD_SETTING_KEYS) {
		if (current[key] !== previous[key]) {
			changes.push(
				...getRecordChanges(
					key,
					current[key] as Record<string, unknown>,
					previous[key] as Record<string, unknown>,
				),
			);
		}
	}

	for (const key of LIST_SETTING_KEYS) {
		const before = previous[key];
		const after = current[key];
		if (
			before === after ||
			(before.length === after.length &&
				before.every((value, index) => value === after[index]))
		) {
			continue;
		}
		changes.push({
			key,
			before: JSON.stringify(before),
			after: JSON.stringify(after),
			beforeCount: before.length,
			afterCount: after.length,
			operation:
				after.length > before.length
					? "add"
					: after.length < before.length
						? "remove"
						: "replace",
		});
	}

	return changes;
}

export function startSettingsTelemetry() {
	return useSettingsStore.subscribe((current, previous) => {
		const changes = getSettingsChanges(current, previous);
		if (changes.length === 0) return;

		trackUserAction("Settings updated", "settings.updated", {
			"eztb.settings.change_count": changes.length,
			"eztb.settings.changed_keys": changes
				.map((change) => change.key)
				.join(","),
			"eztb.settings.changes": JSON.stringify(changes),
		});
	});
}

export function startExternalLinkTelemetry() {
	function handleClick(event: MouseEvent) {
		if (!(event.target instanceof Element)) return;
		const anchor = event.target.closest<HTMLAnchorElement>("a[href]");
		if (!anchor) return;

		let url: URL;
		try {
			url = new URL(anchor.href, window.location.href);
		} catch {
			return;
		}
		if (
			(url.protocol !== "http:" && url.protocol !== "https:") ||
			url.origin === window.location.origin
		) {
			return;
		}

		trackUserAction("External link clicked", "external_link.clicked", {
			"ui.component_name": "ExternalLink",
			"url.domain": url.hostname,
			"url.full": `${url.origin}${url.pathname}`,
			"eztb.source_path": window.location.pathname,
		});
	}

	document.addEventListener("click", handleClick, { capture: true });
	return () =>
		document.removeEventListener("click", handleClick, { capture: true });
}
