import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	publicDir: "public",
	plugins: [
		tanstackRouter({
			target: "react",
			autoCodeSplitting: true,
			routesDirectory: resolve(__dirname, "./src/routes"),
			generatedRouteTree: resolve(__dirname, "./src/routeTree.gen.ts"),
		}),
		react(),
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
});
