import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import Sitemap from "vite-plugin-sitemap";

const SEO_ROUTES = [
	"/about",
	"/profile",
	"/userpost",
	"/postanalysis",
	"/forumpost",
	"/postsearch",
	"/follow",
	"/fan",
	"/likeforum",
	"/export",
] as const;

function normalizeSiteUrl(input?: string) {
	const value = (input ?? "").trim();
	if (!value) return "https://www.eztb.org";
	return value.replace(/\/+$/, "");
}

export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const hostname = normalizeSiteUrl(env.VITE_SITE_URL);

	return {
		publicDir: "public",
		plugins: [
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
				routesDirectory: resolve(__dirname, "./src/routes"),
				generatedRouteTree: resolve(__dirname, "./src/routeTree.gen.ts"),
			}),
			react(),
			Sitemap({
				hostname,
				dynamicRoutes: [...SEO_ROUTES],
				changefreq: 'monthly',
				robots: [{ userAgent: "*", allow: "/" }],
			}),
		],
		resolve: {
			alias: {
				"@": resolve(__dirname, "./src"),
			},
		},
		build: {
			rollupOptions: {
				output: {
					manualChunks(id) {
						const normalized = id.replaceAll("\\", "/");

						if (normalized.includes("/packages/sdk/")) {
							return "sdk";
						}

						if (!normalized.includes("/node_modules/")) {
							return;
						}

						if (normalized.includes("/exceljs/")) {
							return "exceljs";
						}
						if (
							normalized.includes("/@visactor/react-vchart/") ||
							normalized.includes("/@visactor/vchart/")
						) {
							return "visactor";
						}
						if (normalized.includes("/@primer/")) {
							return "primer";
						}
						if (normalized.includes("/@tanstack/")) {
							return "tanstack";
						}
						if (
							normalized.includes("/react/") ||
							normalized.includes("/react-dom/") ||
							normalized.includes("/scheduler/")
						) {
							return "react-vendor";
						}
						if (
							normalized.includes("/zustand/") ||
							normalized.includes("/zod/") ||
							normalized.includes("/clsx/")
						) {
							return "utils";
						}
					},
				},
			},
		},
		server: {
			port: 5173,
		},
	};
});
