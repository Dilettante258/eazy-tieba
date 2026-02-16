import type { AppType } from "@tieba/api";
import { hc } from "hono/client";

export const api = hc<AppType>(
	import.meta.env.VITE_API_URL || "http://localhost:8000",
);
