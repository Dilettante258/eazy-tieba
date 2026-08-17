import "./instrument.ts";
import "@primer/primitives/dist/css/functional/themes/light.css";
import "@primer/primitives/dist/css/functional/themes/dark.css";
import "@primer/primitives/dist/css/base/motion/motion.css";
import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, router } from "./App.tsx";
import { isStandaloneMode } from "./lib/pwa-install.ts";
import { useSettingsStore } from "./lib/settings-store.ts";
import {
	recordFirstUse,
	startExternalLinkTelemetry,
	startSettingsTelemetry,
} from "./lib/telemetry.ts";
import "./styles/globals.css";

if (import.meta.env.VITE_SENTRY_DSN) {
	Sentry.addIntegration(Sentry.tanstackRouterBrowserTracingIntegration(router));

	const { activeBackend, backendPreference } = useSettingsStore.getState();
	Sentry.setTag("activeBackend", activeBackend);
	Sentry.setTag("backendPreference", backendPreference);
	Sentry.setTag("pwa", isStandaloneMode());

	type NetworkInformation = {
		effectiveType?: string;
		type?: string;
		downlink?: number;
		rtt?: number;
	};
	const conn = (navigator as Navigator & { connection?: NetworkInformation })
		.connection;
	if (conn) {
		Sentry.setContext("network", {
			effectiveType: conn.effectiveType,
			type: conn.type,
			downlink: conn.downlink,
			rtt: conn.rtt,
		});
	}

	useSettingsStore.subscribe((state) => {
		Sentry.setTag("activeBackend", state.activeBackend);
		Sentry.setTag("backendPreference", state.backendPreference);
	});
	recordFirstUse();
	startSettingsTelemetry();
	startExternalLinkTelemetry();
}

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Root element not found");

const sentryRootOptions = import.meta.env.VITE_SENTRY_DSN
	? {
			onUncaughtError: Sentry.reactErrorHandler(),
			onCaughtError: Sentry.reactErrorHandler(),
			onRecoverableError: Sentry.reactErrorHandler(),
		}
	: undefined;

createRoot(rootElement, sentryRootOptions).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		void navigator.serviceWorker.register("/sw.js");
	});
}
