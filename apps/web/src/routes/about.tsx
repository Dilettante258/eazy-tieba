import { createFileRoute } from "@tanstack/react-router";
import {
	LinkExternalIcon,
	MarkGithubIcon,
	HeartIcon,
} from "@primer/octicons-react";
import styles from "./page.module.css";

const TECH_STACK = [
	{ name: "React 19", url: "https://react.dev" },
	{ name: "Vite", url: "https://vite.dev" },
	{ name: "Hono", url: "https://hono.dev" },
	{ name: "Effect", url: "https://effect.website" },
	{ name: "TanStack Router", url: "https://tanstack.com/router" },
	{ name: "TanStack Query", url: "https://tanstack.com/query" },
	{ name: "Primer React", url: "https://primer.style/react" },
	{ name: "VChart", url: "https://visactor.io/vchart" },
	{ name: "Drizzle ORM", url: "https://orm.drizzle.team" },
] as const;

const FEATURES = [
	{ title: "用户资料查询", desc: "通过用户名、ID 或 UID 查询完整个人资料" },
	{ title: "发言记录查询", desc: "浏览用户的历史发帖，支持分页翻阅" },
	{ title: "发帖数据分析", desc: "可视化分析发帖时间、活跃贴吧等维度" },
	{ title: "关注 / 粉丝查询", desc: "查看用户的关注列表与粉丝列表" },
	{ title: "关注贴吧查询", desc: "查看用户关注了哪些贴吧，支持隐藏贴吧恢复" },
] as const;

function AboutPage() {
	return (
		<div>
			<h2 className={styles.heading}>关于 eztb</h2>

			{/* 项目简介 */}
			<div className={styles.aboutSection}>
				<p className={styles.aboutLead}>
					<strong>eztb</strong>（easy tieba）是一个开源的百度贴吧工具箱，
					提供用户资料查询、发帖分析、关注/粉丝查询等实用功能，
					帮助你更高效地了解贴吧用户的活动轨迹。
				</p>
			</div>

			{/* 功能列表 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>主要功能</h3>
				<div className={styles.aboutFeatureGrid}>
					{FEATURES.map((f) => (
						<div key={f.title} className={styles.aboutFeatureItem}>
							<h4 className={styles.aboutFeatureName}>{f.title}</h4>
							<p className={styles.aboutFeatureDesc}>{f.desc}</p>
						</div>
					))}
				</div>
			</div>

			{/* 技术栈 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>技术栈</h3>
				<div className={styles.aboutTechList}>
					{TECH_STACK.map((t) => (
						<a
							key={t.name}
							href={t.url}
							target="_blank"
							rel="noopener noreferrer"
							className={styles.aboutTechChip}
						>
							{t.name}
							<LinkExternalIcon size={12} />
						</a>
					))}
				</div>
			</div>

			{/* 链接 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>链接</h3>
				<div className={styles.aboutLinkRow}>
					<a
						className={styles.aboutLinkCard}
						href="https://github.com/Dilettante258/tieba-toolbox"
						target="_blank"
						rel="noopener noreferrer"
					>
						<MarkGithubIcon size={20} />
						<div>
							<strong>GitHub 仓库</strong>
							<span>查看源代码、提交 Issue 或参与贡献</span>
						</div>
						<LinkExternalIcon size={14} className={styles.aboutLinkExtIcon} />
					</a>
				</div>
			</div>

			{/* 致谢 */}
			<p className={styles.aboutFootnote}>
				<HeartIcon size={14} />
				感谢所有贡献者和用户的支持
			</p>
		</div>
	);
}

export const Route = createFileRoute("/about")({
	component: AboutPage,
});
