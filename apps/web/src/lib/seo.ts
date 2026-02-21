import { useEffect } from "react";

interface RouteSeoMeta {
	title: string;
	description: string;
	noindex?: boolean;
}

const BRAND_NAME = "eztb贴吧工具箱";
const TITLE_SUFFIX = ` | ${BRAND_NAME}`;
const DEFAULT_PATH = "/";
const DEFAULT_DESCRIPTION =
	"开源的百度贴吧工具箱，支持用户查询、发帖分析、贴吧分析与数据导出。";
const DEFAULT_KEYWORDS =
	"贴吧工具箱,百度贴吧,贴吧分析,用户资料查询,帖子导出,eztb";
const DEFAULT_OG_IMAGE = "/favicon512.png";
const INDEX_ROBOTS =
	"index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
const NOINDEX_ROBOTS = "noindex,nofollow";

const FALLBACK_SITE_URL = "https://www.eztb.org";

const ROUTE_SEO: Record<string, RouteSeoMeta> = {
	"/": {
		title: "eztb - 贴吧工具箱",
		description:
			"为贴吧数据查询与分析设计的开源工具箱，提供用户资料、发帖轨迹、关系数据与导出能力。",
	},
	"/about": {
		title: "关于 eztb",
		description:
			"了解 eztb 的功能定位、技术栈、开源仓库与安装方式，快速掌握贴吧工具箱的使用方向。",
	},
	"/profile": {
		title: "用户资料查询",
		description:
			"支持按 UID、用户名或 ID 查询贴吧用户资料，快速查看基本信息、等级与吧务数据。",
	},
	"/userpost": {
		title: "用户帖子查询",
		description:
			"按用户维度查看发帖记录，支持分页浏览、关键词高亮与快速定位重点帖子。",
	},
	"/postanalysis": {
		title: "发帖分析",
		description:
			"对用户发帖进行可视化分析，覆盖时间分布、贴吧分布、词云与活跃度等核心维度。",
	},
	"/forumpost": {
		title: "贴吧分析",
		description:
			"按吧维度分析帖子与用户行为，提供 IP 分布、热度排行、词云与时间趋势图表。",
	},
	"/postsearch": {
		title: "发言搜索",
		description:
			"按贴吧、用户与关键词组合检索发言内容，支持批量筛选与结构化结果查看。",
	},
	"/follow": {
		title: "关注列表查询",
		description: "查询贴吧用户关注列表，快速查看关注关系与基础资料。",
	},
	"/fan": {
		title: "粉丝列表查询",
		description: "查询贴吧用户粉丝列表，辅助分析用户影响力与关系网络。",
	},
	"/likeforum": {
		title: "关注贴吧查询",
		description: "查看用户关注的贴吧与等级信息，便于分析兴趣分布与活跃圈层。",
	},
	"/export": {
		title: "数据导出",
		description:
			"支持用户、贴吧与帖子数据导出，提供 JSON / Excel 格式，便于归档与二次分析。",
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
			title: "eztb - 贴吧工具箱",
			description: DEFAULT_DESCRIPTION,
		}
	);
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
		const ogImage = buildAbsoluteUrl(siteUrl, DEFAULT_OG_IMAGE);

		document.title = pageTitle;

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
