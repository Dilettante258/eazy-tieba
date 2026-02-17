import { Dialog, NavList } from "@primer/react";
import { GearIcon, GlobeIcon, InfoIcon } from "@primer/octicons-react";
import { useSettingsStore, type SettingsTab } from "../lib/settings-store.ts";
import styles from "./SettingsDialog.module.css";

const TABS: Array<{
	id: SettingsTab;
	label: string;
	icon: React.ReactNode;
}> = [
	{ id: "postanalysis", label: "发帖分析", icon: <GearIcon /> },
	{ id: "global", label: "全局", icon: <GlobeIcon /> },
	{ id: "about", label: "关于", icon: <InfoIcon /> },
];

function PostAnalysisSettings() {
	return (
		<div className={styles.placeholder}>
			<h3>发帖分析设置</h3>
			<p>面板显隐控制（即将推出）</p>
			<p>屏蔽贴吧管理（即将推出）</p>
			<p>缓存管理（即将推出）</p>
		</div>
	);
}

function GlobalSettings() {
	return (
		<div className={styles.placeholder}>
			<h3>全局设置</h3>
			<p>自定义 BDUSS（即将推出）</p>
			<p>查询历史记录（即将推出）</p>
		</div>
	);
}

function AboutSettings() {
	return (
		<div className={styles.aboutSection}>
			<h3>关于 eztb</h3>
			<p>版本：v3.0.0-dev</p>
			<p>
				GitHub：
				<a
					href="https://github.com/Dilettante258/tieba-toolbox"
					target="_blank"
					rel="noopener noreferrer"
				>
					Dilettante258/tieba-toolbox
				</a>
			</p>
			<p>一个贴吧工具箱，用于查看和分析贴吧用户数据。</p>
		</div>
	);
}

const PANELS: Record<SettingsTab, React.ComponentType> = {
	postanalysis: PostAnalysisSettings,
	global: GlobalSettings,
	about: AboutSettings,
};

export function SettingsDialog() {
	const { settingsOpen, closeSettings, settingsTab, setSettingsTab } =
		useSettingsStore();

	if (!settingsOpen) return null;

	const Panel = PANELS[settingsTab];

	return (
		<Dialog
			title="设置"
			onClose={() => closeSettings()}
			width="xlarge"
		>
			<div className={styles.splitLayout}>
				<nav className={styles.sidebar}>
					<NavList>
						{TABS.map((tab) => (
							<NavList.Item
								key={tab.id}
								aria-current={
									settingsTab === tab.id
										? "page"
										: undefined
								}
								onClick={() => setSettingsTab(tab.id)}
							>
								<NavList.LeadingVisual>
									{tab.icon}
								</NavList.LeadingVisual>
								{tab.label}
							</NavList.Item>
						))}
					</NavList>
				</nav>
				<div className={styles.content}>
					<Panel />
				</div>
			</div>
		</Dialog>
	);
}
