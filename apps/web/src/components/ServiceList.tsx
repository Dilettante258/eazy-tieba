import {
	ZapIcon,
	SearchIcon,
	ToolsIcon,
	PeopleIcon,
	ListUnorderedIcon,
	PersonAddIcon,
	MentionIcon,
	OrganizationIcon,
	IdBadgeIcon,
	GraphIcon,
	DownloadIcon,
} from "@primer/octicons-react";
import { Link } from "@tanstack/react-router";
import styles from "./ServiceList.module.css";

function DotsBg({ fill, id }: { fill: string; id: string }) {
	return (
		<svg
			className={styles.dotsBg}
			style={{ fill }}
			width="100%"
			height="100%"
			xmlns="http://www.w3.org/2000/svg"
		>
			<defs>
				<pattern
					id={id}
					patternUnits="userSpaceOnUse"
					width="60"
					height="60"
					patternTransform="scale(0.4) rotate(0)"
				>
					<rect x="0" y="0" width="100%" height="100%" fill="transparent" />
					<path
						d="M 4.95 2.7 a 2.25 2.25 90 0 1 -2.25 2.25 a 2.25 2.25 90 0 1 -2.25 -2.25 a 2.25 2.25 90 0 1 2.25 -2.25 a 2.25 2.25 90 0 1 2.25 2.25"
						strokeWidth="1"
						stroke="none"
						fill="inherit"
					/>
				</pattern>
			</defs>
			<rect
				width="800%"
				height="400%"
				transform="translate(15,20)"
				fill={`url(#${id})`}
			/>
		</svg>
	);
}

// ── 统计区域 ──

const STATS = [
	{ icon: ZapIcon, value: "350+", label: "人次日均访问量", color: "#1d8ae7" },
	{
		icon: SearchIcon,
		value: "1st",
		label: "Bing、百度、谷歌等搜索排行第一",
		color: "#f76b15",
	},
	{
		icon: ToolsIcon,
		value: "9+",
		label: "核心功能并持续更新中",
		color: "#e75054",
	},
	{
		icon: PeopleIcon,
		value: "10000+",
		label: "累计独立使用者",
		color: "#d6409f",
	},
];

function StatsSection() {
	return (
		<div className={styles.statsSection}>
			<DotsBg fill="#CDCED6" id="dots-stats" />
			<div className={styles.content}>
				<h2 className={styles.sectionTitle}>一个饱受欢迎的工具箱</h2>
				<div className={styles.statsGrid}>
					{STATS.map((s) => (
						<div key={s.label} className={styles.statItem}>
							<div className={styles.statIcon}>
								<s.icon size={28} fill={s.color} />
							</div>
							<div className={styles.statValue}>{s.value}</div>
							<div className={styles.statLabel}>{s.label}</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}

// ── 工具列表区域 ──

const TOOLS = [
	{
		icon: ListUnorderedIcon,
		title: "发言查询",
		description: "查询用户发言",
		href: "/userpost",
	},
	{
		icon: PersonAddIcon,
		title: "关注查询",
		description: "查询用户关注了哪些用户",
		href: "/follow",
	},
	{
		icon: MentionIcon,
		title: "粉丝查询",
		description: "查询用户的粉丝",
		href: "/fan",
	},
	{
		icon: OrganizationIcon,
		title: "关注贴吧查询",
		description: "查询用户关注了哪些贴吧",
		href: "/likeforum",
	},
	{
		icon: IdBadgeIcon,
		title: "个人资料查询",
		description: "查询用户个人资料",
		href: "/profile",
	},
	{
		icon: GraphIcon,
		title: "用户发帖分析",
		description: "对用户历史发言进行数据分析",
		href: "/postanalysis",
	},
	{
		icon: ToolsIcon,
		title: "贴吧分析",
		description: "分析贴吧内帖子与用户活跃分布",
		href: "/forumpost",
	},
	{
		icon: SearchIcon,
		title: "发言搜索",
		description: "按用户与关键词检索贴吧发言",
		href: "/postsearch",
	},
	{
		icon: DownloadIcon,
		title: "数据导出",
		description: "导出为 JSON 或 XLSX 格式",
		href: "/export",
	},
];

function ToolsSection() {
	return (
		<div className={styles.toolsSection}>
			<DotsBg fill="#5A6169" id="dots-tools" />
			<div className={styles.content}>
				<h2 className={styles.toolsSectionTitle}>功能列表</h2>
				<div className={styles.toolsGrid}>
					{TOOLS.map((t) => (
						<Link
							key={t.title}
							className={styles.toolItem}
							to={t.href}
							viewTransition={{ types: ["slide-left"] }}
						>
							<t.icon size={128} className={styles.toolBgIcon} />
							<div className={styles.toolItemContent}>
								<t.icon size={32} className={styles.toolIcon} />
								<h3>{t.title}</h3>
								<p>{t.description}</p>
							</div>
						</Link>
					))}
				</div>
			</div>
		</div>
	);
}

// ── 页脚 ──

const FOOTER_NAV = [
	{ label: "用户资料", to: "/profile" },
	{ label: "发言查询", to: "/userpost" },
	{ label: "发帖分析", to: "/postanalysis" },
	{ label: "贴吧分析", to: "/forumpost" },
	{ label: "发言搜索", to: "/postsearch" },
	{ label: "关注查询", to: "/follow" },
	{ label: "粉丝查询", to: "/fan" },
	{ label: "关注贴吧", to: "/likeforum" },
	{ label: "导出数据", to: "/export" },
] as const;

const FOOTER_OPEN_SOURCE = [
	{
		label: "Web（tieba-toolbox）",
		href: "https://github.com/Dilettante258/tieba-toolbox/tree/v3/apps/web",
	},
	{
		label: "Server（Tieba-API-SCF）",
		href: "https://github.com/Dilettante258/Tieba-API-SCF",
	},
	{
		label: "SDK（tieba.js）",
		href: "https://github.com/Dilettante258/tieba.js",
	},
] as const;

function FooterSection() {
	return (
		<footer className={styles.footer}>
			<div className={styles.footerInner}>
				<div className={styles.footerTop}>
					<div className={styles.footerBrand}>
						<span className={styles.footerLogo}>
							<span className={styles.footerLogoAccent}>ez</span>tb
						</span>
						<p className={styles.footerDesc}>
							开源的百度贴吧工具箱，为更方便调查成分而生。
						</p>
						<div className={styles.footerBadges}>
							<span className={styles.footerBadge}>Web</span>
							<span className={styles.footerBadge}>Server</span>
							<span className={styles.footerBadge}>SDK</span>
						</div>
					</div>

					<div className={styles.footerLinks}>
						<div className={styles.footerCol}>
							<h4 className={styles.footerColTitle}>功能</h4>
							{FOOTER_NAV.map((item) => (
								<Link
									key={item.to}
									className={styles.footerLink}
									to={item.to}
									viewTransition={{ types: ["slide-left"] }}
								>
									{item.label}
								</Link>
							))}
						</div>
						<div className={styles.footerCol}>
							<h4 className={styles.footerColTitle}>开源</h4>
							{FOOTER_OPEN_SOURCE.map((item) => (
								<a
									key={item.href}
									className={styles.footerLink}
									href={item.href}
									target="_blank"
									rel="noopener noreferrer"
								>
									{item.label}
								</a>
							))}
						</div>
						<div className={styles.footerCol}>
							<h4 className={styles.footerColTitle}>联系</h4>
							<a
								className={styles.footerLink}
								href="https://kairi.cc/zh"
								target="_blank"
								rel="noopener noreferrer"
							>
								作者主页
							</a>
							<a className={styles.footerLink} href="mailto:noreply@eztb.org">
								noreply@eztb.org
							</a>
							<a
								className={styles.footerLink}
								href="https://github.com/Dilettante258/tieba-toolbox"
								target="_blank"
								rel="noopener noreferrer"
							>
								项目仓库
							</a>
							<Link
								className={styles.footerLink}
								to="/about"
								viewTransition={{ types: ["slide-left"] }}
							>
								关于
							</Link>
						</div>
					</div>
				</div>

				<div className={styles.footerBottom}>
					<span>© 2024–2026 eztb</span>
					<span className={styles.footerDot}>·</span>
					<a
						className={styles.footerBottomLink}
						href="https://kairi.cc/zh"
						target="_blank"
						rel="noopener noreferrer"
					>
						kairi.cc
					</a>
					<span className={styles.footerDot}>·</span>
					<a className={styles.footerBottomLink} href="mailto:noreply@eztb.org">
						noreply@eztb.org
					</a>
					<span className={styles.footerDot}>·</span>
					<span>Powered by React 19 + Hono</span>
				</div>
			</div>
		</footer>
	);
}

export function ServiceList() {
	return (
		<div className={styles.container}>
			<StatsSection />
			<ToolsSection />
			<FooterSection />
		</div>
	);
}
