import { BaseStyles, ThemeProvider } from "@primer/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { ColorModeProvider, useColorMode } from "./lib/color-mode.tsx";
import { routeTree } from "./routeTree.gen.ts";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			staleTime: 60 * 1000,
			retry: 1,
		},
	},
});

const router = createRouter({
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

	return (
		<ThemeProvider colorMode={colorMode}>
			<BaseStyles>
				<QueryClientProvider client={queryClient}>
					<RouterProvider router={router} />
				</QueryClientProvider>
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
