import { createFileRoute } from "@tanstack/react-router";
import { Timeline } from "@primer/react";
import {
	BookIcon,
	BrowserIcon,
	CodeSquareIcon,
	GitCommitIcon,
	GraphIcon,
	LinkExternalIcon,
	MailIcon,
	MarkGithubIcon,
	PackageIcon,
	RepoIcon,
	ServerIcon,
	StackIcon,
	HomeIcon,
	IssueOpenedIcon,
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
	{ name: "Octicons", url: "https://primer.style/octicons/" },
	{ name: "VChart", url: "https://visactor.io/vchart" },
	{ name: "Drizzle ORM", url: "https://orm.drizzle.team" },
] as const;

const STACK_STORIES = [
	{
		title: "Primer React 组件库",
		desc: "UI 采用 GitHub 出品的 Primer React，整体会自然偏向 GitHub 风格，组件一致性和可维护性都更好。",
		icon: MarkGithubIcon,
	},
	{
		title: "VChart 图表库",
		desc: "图表目前选用了字节的 VChart。最初是想试试这套方案，但用下来类型推导没预期顺手，关系图能力也不够，不然原本想做互关关系网络图。",
		icon: GraphIcon,
	},
	{
		title: "Octicons 图标体系",
		desc: "图标统一使用 Primer Octicons，和 Primer 组件的视觉语言一致，页面风格更统一。",
		icon: CodeSquareIcon,
	},
	{
		title: "分层架构",
		desc: "路由和请求缓存由 TanStack Router/Query 管理，服务端基于 Hono + Effect，Web、Server、SDK 能独立迭代。",
		icon: StackIcon,
	},
] as const;

const FEATURES = [
	{ title: "用户资料查询", desc: "通过用户名、ID 或 UID 查询完整个人资料" },
	{ title: "发言记录查询", desc: "浏览用户历史发帖，支持分页与结构化查看" },
	{ title: "发帖数据分析", desc: "按时间、贴吧、互动等维度做可视化分析" },
	{ title: "发言搜索", desc: "支持按贴吧、时间范围和关键字筛选发言数据" },
	{ title: "关系数据查询", desc: "查看关注、粉丝、关注贴吧等关系信息" },
	{ title: "导出能力", desc: "支持 Json/Excel 导出，便于二次分析与归档" },
] as const;

const USE_CASES = [
	{
		title: "吧务运营",
		desc: "查看用户活跃轨迹与行为分布，辅助判断内容管理策略。",
	},
	{
		title: "内容创作",
		desc: "快速复盘主题讨论热度，定位高互动时间段与内容方向。",
	},
	{
		title: "数据归档",
		desc: "导出帖子与关系数据，用于长期观察或离线整理分析。",
	},
	{
		title: "开发接入",
		desc: "可基于 API 与 SDK 进行二次开发，构建自己的贴吧工具链。",
	},
] as const;

const INSTALL_GUIDE = [
	{
		title: "网页端一键安装",
		desc: "打开「设置 -> 关于」，点击“安装到主屏幕”按钮。支持安装提示的浏览器会直接弹出安装面板。",
	},
	{
		title: "苹果手机安装方式",
		desc: "请使用 Safari 打开本站，点击底部“分享”按钮，选择“添加到主屏幕”。",
	},
	{
		title: "安装后的使用方式",
		desc: "安装完成后会以独立应用打开，可直接从手机桌面进入，体验与普通 App 更接近。",
	},
] as const;

const CHANGELOG = [
	{
		version: "v3.0.0",
		summary: "v3 系列首发版本，完成核心能力整合。",
		items: [
			"支持PWA能力，支持安装到首页。",
			"提供用户资料、发帖分析、发言搜索、关系查询与导出等核心功能。",
		],
	},
	{
		version: "v3.1.0",
		summary: "当前版本，聚焦首屏体验和输入规则一致性。",
		items: [
			"首页轮播图资源迁移到 CDN，并提前 dns-prefetch。",
			"UID 查询规则更新为支持 8 位到 10 位数字，兼容更多历史账号。",
			"导出页与查询表单的 UID 提示文案和校验逻辑已保持一致。",
		],
	},
] as const;

const RESOURCE_LINKS = [
	{
		title: "项目主仓库",
		desc: "查看整体代码结构、变更记录与使用说明",
		url: "https://github.com/Dilettante258/tieba-toolbox",
		icon: RepoIcon,
	},
	{
		title: "问题反馈（Issues）",
		desc: "提交 Bug、功能建议或讨论改进方案",
		url: "https://github.com/Dilettante258/tieba-toolbox/issues",
		icon: IssueOpenedIcon,
	},
	{
		title: "SDK 文档站点",
		desc: "查看 tieba.js 的接口文档和接入说明",
		url: "http://sdk.eztb.org/",
		icon: BookIcon,
	},
] as const;

const AUTHOR_LINKS = [
	{
		title: "作者主页",
		desc: "访问作者站点，了解更多项目与动态",
		url: "https://kairi.cc/zh",
		icon: HomeIcon,
	},
	{
		title: "邮件询问",
		desc: "联系邮箱：support@eztb.org",
		url: "mailto:support@eztb.org",
		icon: MailIcon,
	},
] as const;

const GITHUB_MODULES = [
	{
		title: "网页端（apps/web）",
		desc: "React + TanStack Router + Primer React 的前端应用",
		url: "https://github.com/Dilettante258/tieba-toolbox/tree/v3/apps/web",
		icon: BrowserIcon,
	},
	{
		title: "服务器端（apps/api）",
		desc: "Hono + Effect 的 API 服务，提供统一数据能力",
		url: "https://github.com/Dilettante258/Tieba-API-SCF",
		icon: ServerIcon,
	},
	{
		title: "SDK（tieba.js）",
		desc: "贴吧请求封装与类型定义，可独立集成到其他项目",
		url: "https://github.com/Dilettante258/tieba.js",
		icon: PackageIcon,
	},
] as const;

function AboutPage() {
	return (
		<div>
			<h2 className={styles.heading}>关于 eztb</h2>

			{/* 项目简介 */}
			<div className={styles.aboutSection}>
				<p className={styles.aboutLead}>
					<strong>eztb</strong>（easy tieba）是一个开源的百度贴吧工具箱，
					聚焦「查询、分析、导出」三类核心能力，帮助你更高效地理解贴吧用户与内容数据。
				</p>
				<p className={styles.aboutSubLead}>
					便捷操作、现代化界面、丰富功能，让查询与分析一步到位。
				</p>
			</div>

			{/* 安装到桌面 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>如何安装到桌面</h3>
				<ol className={styles.aboutInstallList}>
					{INSTALL_GUIDE.map((item) => (
						<li key={item.title} className={styles.aboutInstallItem}>
							<strong>{item.title}：</strong>
							{item.desc}
						</li>
					))}
				</ol>
			</div>

			{/* 更新日志 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>更新日志</h3>
				<Timeline className={styles.aboutTimeline} clipSidebar={false}>
					{CHANGELOG.map((item) => (
						<Timeline.Item key={item.version}>
							<Timeline.Badge>
								<GitCommitIcon aria-label="Commit" />
							</Timeline.Badge>
							<Timeline.Body>
								<div className={styles.aboutTimelineBody}>
									<p className={styles.aboutTimelineTitle}>{item.version}</p>
									<p className={styles.aboutTimelineSummary}>{item.summary}</p>
									<ul className={styles.aboutBulletList}>
										{item.items.map((point) => (
											<li key={point} className={styles.aboutBulletItem}>
												{point}
											</li>
										))}
									</ul>
								</div>
							</Timeline.Body>
						</Timeline.Item>
					))}
				</Timeline>
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

			{/* 适用场景 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>适用场景</h3>
				<div className={styles.aboutFeatureGrid}>
					{USE_CASES.map((item) => (
						<div key={item.title} className={styles.aboutFeatureItem}>
							<h4 className={styles.aboutFeatureName}>{item.title}</h4>
							<p className={styles.aboutFeatureDesc}>{item.desc}</p>
						</div>
					))}
				</div>
			</div>

			{/* 技术栈 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>技术栈与取舍</h3>
				<div className={styles.aboutStackGrid}>
					{STACK_STORIES.map((item) => {
						const Icon = item.icon;
						return (
							<div key={item.title} className={styles.aboutStackCard}>
								<Icon size={18} className={styles.aboutStackIcon} />
								<div>
									<h4 className={styles.aboutStackTitle}>{item.title}</h4>
									<p className={styles.aboutStackDesc}>{item.desc}</p>
								</div>
							</div>
						);
					})}
				</div>
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

			{/* 文档与反馈 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>文档与反馈</h3>
				<div className={styles.aboutLinkRow}>
					{RESOURCE_LINKS.map((item) => {
						const Icon = item.icon;
						return (
							<a
								key={item.title}
								className={styles.aboutLinkCard}
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Icon size={20} className={styles.aboutLinkIcon} />
								<div className={styles.aboutLinkText}>
									<strong>{item.title}</strong>
									<span>{item.desc}</span>
								</div>
								<LinkExternalIcon
									size={14}
									className={styles.aboutLinkExtIcon}
								/>
							</a>
						);
					})}
				</div>
			</div>

			{/* 作者与联系 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>作者与联系</h3>
				<div className={styles.aboutContactList}>
					{AUTHOR_LINKS.map((item) => {
						const Icon = item.icon;
						const isExternal = item.url.startsWith("http");
						return (
							<a
								key={item.title}
								className={styles.aboutContactItem}
								href={item.url}
								target={isExternal ? "_blank" : undefined}
								rel={isExternal ? "noopener noreferrer" : undefined}
							>
								<div className={styles.aboutContactMain}>
									<Icon size={16} className={styles.aboutContactIcon} />
									<strong>{item.title}</strong>
								</div>
								<span className={styles.aboutContactDesc}>{item.desc}</span>
								{isExternal && (
									<LinkExternalIcon
										size={14}
										className={styles.aboutContactExtIcon}
									/>
								)}
							</a>
						);
					})}
				</div>
			</div>

			{/* 底部 GitHub 单列 */}
			<div className={styles.aboutSection}>
				<h3 className={styles.aboutSectionTitle}>GitHub 开源仓库</h3>
				<div className={styles.aboutLinkRow}>
					{GITHUB_MODULES.map((item) => {
						const Icon = item.icon;
						return (
							<a
								key={item.title}
								className={styles.aboutLinkCard}
								href={item.url}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Icon size={20} className={styles.aboutLinkIcon} />
								<div className={styles.aboutLinkText}>
									<strong>{item.title}</strong>
									<span>{item.desc}</span>
								</div>
								<LinkExternalIcon
									size={14}
									className={styles.aboutLinkExtIcon}
								/>
							</a>
						);
					})}
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
