import { useCallback, useEffect, useState } from "react";
import { recordPwaInstalled, recordPwaInstallPrompt } from "./telemetry.ts";

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

type InstallOutcome = "accepted" | "dismissed" | "unavailable";

interface PwaInstallState {
	installed: boolean;
	canInstall: boolean;
}

let initialized = false;
let deferredPrompt: BeforeInstallPromptEvent | null = null;
let installed = false;
const subscribers = new Set<() => void>();
const INSTALL_RECORDED_KEY = "eztb-pwa-install-recorded";

function emit() {
	for (const notify of subscribers) notify();
}

function recordInstallation(
	source: "appinstalled" | "install_prompt" | "standalone",
) {
	try {
		if (localStorage.getItem(INSTALL_RECORDED_KEY) === "true") return;
		if (recordPwaInstalled(source)) {
			localStorage.setItem(INSTALL_RECORDED_KEY, "true");
		}
	} catch {
		recordPwaInstalled(source);
	}
}

export function isStandaloneMode() {
	if (typeof window === "undefined") return false;
	const iosStandalone = (
		window.navigator as Navigator & { standalone?: boolean }
	).standalone;
	return (
		window.matchMedia("(display-mode: standalone)").matches ||
		iosStandalone === true
	);
}

function ensureInitialized() {
	if (initialized || typeof window === "undefined") return;
	initialized = true;
	installed = isStandaloneMode();
	if (installed) recordInstallation("standalone");

	window.addEventListener("beforeinstallprompt", (event) => {
		event.preventDefault();
		deferredPrompt = event as BeforeInstallPromptEvent;
		emit();
	});

	window.addEventListener("appinstalled", () => {
		installed = true;
		deferredPrompt = null;
		recordInstallation("appinstalled");
		emit();
	});

	const media = window.matchMedia("(display-mode: standalone)");
	media.addEventListener("change", () => {
		installed = isStandaloneMode();
		if (installed) {
			deferredPrompt = null;
			recordInstallation("standalone");
		}
		emit();
	});
}

function getState(): PwaInstallState {
	ensureInitialized();
	return {
		installed,
		canInstall: Boolean(deferredPrompt) && !installed,
	};
}

async function promptInstall(): Promise<InstallOutcome> {
	ensureInitialized();
	if (!deferredPrompt) return "unavailable";

	const currentPrompt = deferredPrompt;
	await currentPrompt.prompt();
	const result = await currentPrompt.userChoice;
	recordPwaInstallPrompt(result.outcome, result.platform);

	deferredPrompt = null;
	if (result.outcome === "accepted") {
		installed = true;
		recordInstallation("install_prompt");
	}
	emit();
	return result.outcome;
}

function subscribe(listener: () => void) {
	ensureInitialized();
	subscribers.add(listener);
	return () => {
		subscribers.delete(listener);
	};
}

export function usePwaInstall() {
	const [state, setState] = useState<PwaInstallState>(() => getState());

	useEffect(() => {
		return subscribe(() => setState(getState()));
	}, []);

	const install = useCallback(async () => {
		return promptInstall();
	}, []);

	return {
		...state,
		install,
	};
}
