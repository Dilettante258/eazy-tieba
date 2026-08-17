import { BaseStyles, ThemeProvider } from "@primer/react";
import * as Sentry from "@sentry/react";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { useEffect } from "react";
import { ErrorFallback } from "./components/ErrorFallback.tsx";
import { ensureBackendReady } from "./lib/backend.ts";
import { ColorModeProvider, useColorMode } from "./lib/color-mode.tsx";
import { useSettingsStore } from "./lib/settings-store.ts";
import { routeTree } from "./routeTree.gen.ts";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 600 * 1000,
			retry: 1,
		},
	},
});

// This code is only for TypeScript
declare global {
	interface Window {
		__TANSTACK_QUERY_CLIENT__: import("@tanstack/react-query").QueryClient;
	}
}

// This code is for all users
window.__TANSTACK_QUERY_CLIENT__ = queryClient;

persistQueryClient({
	queryClient,
	persister: createAsyncStoragePersister({ storage: localStorage }),
	maxAge: 24 * 60 * 60 * 1000,
	dehydrateOptions: {
		shouldDehydrateQuery: (query) => query.queryKey[0] === "gh-stars",
	},
});

export const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

/**
 * 内层组件：读取 colorMode 传给 Primer ThemeProvider。
 * 始终传入 "day" | "night"（而非 "auto"），
 * 这样 data-color-mode 会被设为 "light" | "dark"，
 * 自定义 CSS 的 [data-color-mode="dark"] 选择器才能正确命中。
 */
function AppShell() {
	const { colorMode } = useColorMode();
	const backendPreference = useSettingsStore((s) => s.backendPreference);

	// biome-ignore lint/correctness/useExhaustiveDependencies: recheck only when the selected backend changes
	useEffect(() => {
		void ensureBackendReady(true);
	}, [backendPreference]);

	return (
		<ThemeProvider colorMode={colorMode}>
			<BaseStyles className="appContent">
				<Sentry.ErrorBoundary
					fallback={({ error, resetError }) => (
						<ErrorFallback error={error as Error} resetError={resetError} />
					)}
				>
					<QueryClientProvider client={queryClient}>
						<RouterProvider router={router} />
					</QueryClientProvider>
				</Sentry.ErrorBoundary>
			</BaseStyles>
		</ThemeProvider>
	);
}

export function App() {
	return (
		<ColorModeProvider>
			<AppShell />
		</ColorModeProvider>
	);
}
