import {
	Outlet,
	Link,
	createRootRouteWithContext,
	useNavigate,
	useRouterState,
} from "@tanstack/react-router";
import { ActionList, ActionMenu, PageLayout } from "@primer/react";
import {
	DownloadIcon,
	GearIcon,
	MarkGithubIcon,
	MoonIcon,
	StarIcon,
	SunIcon,
	ThreeBarsIcon,
} from "@primer/octicons-react";
import { useColorMode } from "../lib/color-mode.tsx";
import { usePwaInstall } from "../lib/pwa-install.ts";
import { useSettingsStore } from "../lib/settings-store.ts";
import { SettingsDialog } from "../components/SettingsDialog.tsx";
import type { RouterContext } from "../lib/router-context.ts";
import styles from "../components/AppLayout.module.css";

const NAV_ITEMS = [
	{ label: "首页", to: "/" },
	{ label: "关于", to: "/about" },
	{ label: "用户资料", to: "/profile" },
	{ label: "用户帖子", to: "/userpost" },
	{ label: "发帖分析", to: "/postanalysis" },
	{ label: "贴吧分析", to: "/forumpost" },
	{ label: "发言搜索", to: "/postsearch" },
	{ label: "关注", to: "/follow" },
	{ label: "粉丝", to: "/fan" },
	{ label: "关注的吧", to: "/likeforum" },
	{ label: "导出数据", to: "/export" },
] as const;

// 根据导航栏顺序判断滑动方向
const NAV_ORDER = new Map<string, number>(
	NAV_ITEMS.map((item, i) => [item.to, i]),
);

const viewTransitionSlide = {
	types: ({
		fromLocation,
		toLocation,
	}: {
		fromLocation?: { pathname: string };
		toLocation: { pathname: string };
	}) => {
		// 涉及首页时跳过动画
		if (fromLocation?.pathname === "/" || toLocation.pathname === "/")
			return false;
		const from = NAV_ORDER.get(fromLocation?.pathname ?? "/") ?? -1;
		const to = NAV_ORDER.get(toLocation.pathname) ?? -1;
		return to >= from ? ["slide-left"] : ["slide-right"];
	},
};

function ThemeToggle() {
	const { isDark, toggleColorMode } = useColorMode();
	return (
		<button
			type="button"
			className={styles.themeBtn}
			aria-label="切换主题"
			onClick={toggleColorMode}
		>
			{isDark ? <SunIcon size={16} /> : <MoonIcon size={16} />}
		</button>
	);
}

function InstallAppButton() {
	const { canInstall, installed, install } = usePwaInstall();

	if (!canInstall || installed) return null;

	return (
		<button
			type="button"
			className={styles.installBtn}
			onClick={async () => {
				await install();
			}}
		>
			<DownloadIcon size={14} />
			<span className={styles.installLabel}>安装应用</span>
		</button>
	);
}

function MobileNav() {
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return (
		<ActionMenu>
			<ActionMenu.Anchor>
				<button type="button" className={styles.menuBtn}>
					<ThreeBarsIcon size={16} />
				</button>
			</ActionMenu.Anchor>
			<ActionMenu.Overlay>
				<ActionList>
					{NAV_ITEMS.map((item) => (
						<ActionList.LinkItem
							key={item.to}
							href={item.to}
							active={pathname === item.to}
							onClick={(e) => {
								e.preventDefault();
								navigate({
									to: item.to,
									viewTransition: viewTransitionSlide,
								});
							}}
						>
							{item.label}
						</ActionList.LinkItem>
					))}
				</ActionList>
			</ActionMenu.Overlay>
		</ActionMenu>
	);
}

function RootLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isHome = pathname === "/";

	return (
		<>
			<SettingsDialog />
			<nav className={styles.navbar} data-transparent={isHome || undefined}>
				<Link
					className={styles.logo}
					to="/"
					viewTransition={viewTransitionSlide}
				>
					<span className={styles.logoAccent}>ez</span>tb
				</Link>

				<MobileNav />

				<ul className={styles.navLinks}>
					{NAV_ITEMS.map((item) => (
						<li key={item.to}>
							<Link
								className={styles.navLink}
								to={item.to}
								data-active={pathname === item.to || undefined}
								viewTransition={viewTransitionSlide}
							>
								{item.label}
							</Link>
						</li>
					))}
				</ul>

				<div className={styles.spacer} />

				<div className={styles.actions}>
					<InstallAppButton />
					<a
						className={styles.githubLink}
						href="https://github.com/Dilettante258/tieba-toolbox"
						target="_blank"
						rel="noopener noreferrer"
						aria-label="GitHub"
					>
						<MarkGithubIcon size={16} />
						<StarIcon size={12} />
						<span>70</span>
					</a>
					<button
						type="button"
						className={styles.themeBtn}
						aria-label="设置"
						onClick={useSettingsStore.getState().openSettings}
					>
						<GearIcon size={16} />
					</button>
					<ThemeToggle />
				</div>
			</nav>

			{isHome ? (
				<div style={{ viewTransitionName: "main-content" }}>
					<Outlet />
				</div>
			) : (
				<PageLayout>
					<PageLayout.Content>
						<div style={{ viewTransitionName: "main-content" }}>
							<Outlet />
						</div>
					</PageLayout.Content>
				</PageLayout>
			)}
		</>
	);
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});
