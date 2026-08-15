import "@primer/primitives/dist/css/functional/themes/light.css";
import "@primer/primitives/dist/css/functional/themes/dark.css";
import "@primer/primitives/dist/css/base/motion/motion.css";
import * as Sentry from "@sentry/react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App, router } from "./App.tsx";
import { isStandaloneMode } from "./lib/pwa-install.ts";
import { useSettingsStore } from "./lib/settings-store.ts";
import "./styles/globals.css";


if (import.meta.env.VITE_SENTRY_DSN) {
	Sentry.init({
		debug: !import.meta.env.PROD,
		dsn: import.meta.env.VITE_SENTRY_DSN,
		release: __APP_VERSION__,
		environment: import.meta.env.MODE,
		integrations: [
			Sentry.browserTracingIntegration(),
			Sentry.tanstackRouterBrowserTracingIntegration(router),
			Sentry.httpClientIntegration(),
		],
		tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
		tracePropagationTargets: [
			"localhost",
			/^https:\/\/zwrcjbwbskoa\.sealosbja\.site/,
			/^https:\/\/cf\.eztb\.org/,
		],
		enableLogs: true,
		sendDefaultPii: true,
		beforeSendTransaction(event) {
			event.spans = event.spans?.filter(
				(span) => !span.op?.startsWith("resource."),
			);
			return event;
		},
	});

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
}

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<App />
	</StrictMode>,
);

if (import.meta.env.PROD && "serviceWorker" in navigator) {
	window.addEventListener("load", () => {
		void navigator.serviceWorker.register("/sw.js");
	});
}
