import type { AppType } from "@tieba/api";
import { hc } from "hono/client";
import { RECENT_POSTS_BACKEND } from "./backend-config.ts";

/** 仅供近期发言功能使用；其他页面继续使用原 API Client。 */
export const recentPostsApi = hc<AppType>(RECENT_POSTS_BACKEND);
