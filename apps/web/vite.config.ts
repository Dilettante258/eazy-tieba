import { resolve } from "node:path";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
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
	server: {
		port: 5173,
	},
});
