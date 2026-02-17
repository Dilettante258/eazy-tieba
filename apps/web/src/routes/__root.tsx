import {
	Outlet,
	Link,
	createRootRouteWithContext,
	useRouterState,
} from "@tanstack/react-router";
import { PageLayout } from "@primer/react";
import {
	GearIcon,
	MarkGithubIcon,
	MoonIcon,
	StarIcon,
	SunIcon,
} from "@primer/octicons-react";
import { useColorMode } from "../lib/color-mode.tsx";
import { useSettingsStore } from "../lib/settings-store.ts";
import { SettingsDialog } from "../components/SettingsDialog.tsx";
import type { RouterContext } from "../lib/router-context.ts";
import styles from "../components/AppLayout.module.css";

const NAV_ITEMS = [
	{ label: "首页", to: "/" },
	{ label: "用户资料", to: "/profile" },
	{ label: "用户帖子", to: "/userpost" },
	{ label: "发帖分析", to: "/postanalysis" },
	{ label: "关注", to: "/follow" },
	{ label: "粉丝", to: "/fan" },
	{ label: "关注的吧", to: "/likeforum" },
] as const;

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

function RootLayout() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const isHome = pathname === "/";

	return (
		<>
			<SettingsDialog />
			<nav
				className={styles.navbar}
				data-transparent={isHome || undefined}
			>
				<Link className={styles.logo} to="/">
					<span className={styles.logoAccent}>ez</span>tb
				</Link>

				<ul className={styles.navLinks}>
					{NAV_ITEMS.map((item) => (
						<li key={item.to}>
							<Link
								className={styles.navLink}
								to={item.to}
								data-active={pathname === item.to || undefined}
							>
								{item.label}
							</Link>
						</li>
					))}
				</ul>

				<div className={styles.spacer} />

				<div className={styles.actions}>
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
				<Outlet />
			) : (
				<PageLayout>
					<PageLayout.Content>
						<Outlet />
					</PageLayout.Content>
				</PageLayout>
			)}
		</>
	);
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: RootLayout,
});
