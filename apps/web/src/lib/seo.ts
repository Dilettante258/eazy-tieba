import { useEffect } from "react";

interface RouteSeoMeta {
	title: string;
	description: string;
	h1: string;
	noindex?: boolean;
}

const BRAND_NAME = "eztb贴吧工具箱";
const TITLE_SUFFIX = ` | ${BRAND_NAME}`;
const DEFAULT_PATH = "/";
const DEFAULT_DESCRIPTION =
	"eztb 是开源的百度贴吧工具箱，提供用户资料查询、发帖分析、贴吧分析、发言搜索与数据导出。";
const DEFAULT_H1 = "eztb贴吧工具箱：百度贴吧数据查询与分析平台";
const DEFAULT_KEYWORDS =
	"贴吧工具箱,百度贴吧,贴吧分析,用户资料查询,帖子导出,eztb";
const DEFAULT_OG_IMAGE = "/favicon512.png";
const INDEX_ROBOTS =
	"index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex,nofollow";

const FALLBACK_SITE_URL = "https://www.eztb.org";

const ROUTE_SEO: Record<string, RouteSeoMeta> = {
	"/": {
		title: "百度贴吧数据查询分析工具",
		description:
			"为贴吧数据查询与分析设计的开源工具箱，覆盖用户资料、发帖轨迹、关系网络与结构化导出能力。",
		h1: "eztb贴吧工具箱：百度贴吧数据查询与分析平台",
	},
	"/about": {
		title: "关于eztb贴吧工具箱项目与使用说明",
		description:
			"了解 eztb 的功能定位、技术栈、开源仓库、安装方式与版本规划，快速掌握项目使用方向。",
		h1: "关于eztb贴吧工具箱项目",
	},
	"/profile": {
		title: "贴吧用户资料查询工具",
		description:
			"支持按 UID、用户名或 ID 查询贴吧用户资料，快速查看基本信息、等级、吧务与账号状态数据。",
		h1: "贴吧用户资料查询",
	},
	"/userpost": {
		title: "贴吧用户帖子查询工具",
		description:
			"按用户维度查看发帖记录，支持分页浏览、关键词高亮、时间筛选与重点帖子快速定位。",
		h1: "贴吧用户帖子查询",
	},
	"/postanalysis": {
		title: "贴吧用户发帖分析工具",
		description:
			"对用户发帖进行可视化分析，覆盖时间分布、贴吧分布、词云、互动指标与活跃趋势等核心维度。",
		h1: "贴吧用户发帖分析",
	},
	"/forumpost": {
		title: "贴吧吧内帖子分析工具",
		description:
			"按吧维度分析帖子与用户行为，提供 IP 分布、热度排行、词云统计与时间趋势图表。",
		h1: "贴吧吧内帖子分析",
	},
	"/postsearch": {
		title: "贴吧发言关键词搜索工具",
		description:
			"按贴吧、用户与关键词组合检索发言内容，支持批量筛选、上下文预览与结构化结果查看。",
		h1: "贴吧发言关键词搜索",
	},
	"/follow": {
		title: "贴吧用户关注列表查询",
		description:
			"查询贴吧用户关注列表与基础画像信息，快速查看关注关系并辅助分析社交连接。",
		h1: "贴吧用户关注列表查询",
	},
	"/fan": {
		title: "贴吧用户粉丝列表查询",
		description:
			"查询贴吧用户粉丝列表与互动线索，辅助分析用户影响力变化与关系网络结构。",
		h1: "贴吧用户粉丝列表查询",
	},
	"/likeforum": {
		title: "贴吧关注吧列表查询",
		description:
			"查看用户关注的贴吧与等级信息，便于分析兴趣分布、活跃圈层与内容偏好方向。",
		h1: "贴吧关注吧列表查询",
	},
	"/export": {
		title: "贴吧数据导出工具（JSON/Excel）",
		description:
			"支持用户、贴吧与帖子数据导出，提供 JSON 与 Excel 格式，便于归档、共享与二次分析。",
		h1: "贴吧数据导出工具",
	},
};

function normalizeSiteUrl(input?: string | null) {
	const value = (input ?? "").trim();
	if (!value) return FALLBACK_SITE_URL;
	return value.replace(/\/+$/, "");
}

function resolveSiteUrl() {
	const rawEnv = (import.meta.env.VITE_SITE_URL as string | undefined)?.trim();
	if (rawEnv) return normalizeSiteUrl(rawEnv);
	if (typeof window !== "undefined" && window.location.origin) {
		return normalizeSiteUrl(window.location.origin);
	}
	return FALLBACK_SITE_URL;
}

function upsertMetaByName(name: string, content: string) {
	let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
	if (!tag) {
		tag = document.createElement("meta");
		tag.setAttribute("name", name);
		document.head.appendChild(tag);
	}
	tag.setAttribute("content", content);
}

function upsertMetaByProperty(property: string, content: string) {
	let tag = document.head.querySelector<HTMLMetaElement>(
		`meta[property="${property}"]`,
	);
	if (!tag) {
		tag = document.createElement("meta");
		tag.setAttribute("property", property);
		document.head.appendChild(tag);
	}
	tag.setAttribute("content", content);
}

function upsertCanonical(href: string) {
	let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
	if (!tag) {
		tag = document.createElement("link");
		tag.setAttribute("rel", "canonical");
		document.head.appendChild(tag);
	}
	tag.setAttribute("href", href);
}

function buildAbsoluteUrl(siteUrl: string, path: string) {
	return new URL(path || DEFAULT_PATH, `${siteUrl}/`).toString();
}

function resolveRouteSeo(pathname: string): RouteSeoMeta {
	return (
		ROUTE_SEO[pathname] ?? {
			title: "百度贴吧数据查询分析工具",
			description: DEFAULT_DESCRIPTION,
			h1: DEFAULT_H1,
		}
	);
}

function upsertPageHeading(heading: string) {
	let tag = document.body.querySelector<HTMLHeadingElement>("h1#app-page-h1");
	if (!tag) {
		tag = document.createElement("h1");
		tag.id = "app-page-h1";
		tag.className = "seo-only-h1";
		document.body.prepend(tag);
	}
	tag.textContent = heading;
}

export function useRouteSeo(pathname: string) {
	useEffect(() => {
		if (typeof document === "undefined") return;

		const siteUrl = resolveSiteUrl();
		const seo = resolveRouteSeo(pathname);
		const canonicalUrl = buildAbsoluteUrl(siteUrl, pathname);
		const pageTitle = seo.title.includes("贴吧工具箱")
			? seo.title
			: `${seo.title}${TITLE_SUFFIX}`;
		const pageHeading = seo.h1 || DEFAULT_H1;
		const ogImage = buildAbsoluteUrl(siteUrl, DEFAULT_OG_IMAGE);

		document.title = pageTitle;
		upsertPageHeading(pageHeading);

		upsertCanonical(canonicalUrl);
		upsertMetaByName("description", seo.description);
		upsertMetaByName("keywords", DEFAULT_KEYWORDS);
		upsertMetaByName("robots", seo.noindex ? NOINDEX_ROBOTS : INDEX_ROBOTS);
		upsertMetaByName("twitter:card", "summary_large_image");
		upsertMetaByName("twitter:title", pageTitle);
		upsertMetaByName("twitter:description", seo.description);
		upsertMetaByName("twitter:image", ogImage);

		upsertMetaByProperty("og:type", "website");
		upsertMetaByProperty("og:site_name", BRAND_NAME);
		upsertMetaByProperty("og:locale", "zh_CN");
		upsertMetaByProperty("og:title", pageTitle);
		upsertMetaByProperty("og:description", seo.description);
		upsertMetaByProperty("og:url", canonicalUrl);
		upsertMetaByProperty("og:image", ogImage);
	}, [pathname]);
}
