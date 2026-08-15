import { RocketIcon } from "@primer/octicons-react";
import { Dialog } from "@primer/react";
import { Link } from "@tanstack/react-router";
import { useCallback } from "react";
import {
	getUnseenReleases,
	LATEST_CHANGELOG_VERSION,
} from "../lib/changelog.ts";
import { useSettingsStore } from "../lib/settings-store.ts";
import styles from "./UpdateNotice.module.css";

/**
 * 版本更新提示弹窗。
 * 本设备没看过最新版本的更新内容时自动弹出，展示最近尚未看过的版本
 * （最多两个）。关闭即视为已读，之后不会再对同一版本弹出。
 */
export function UpdateNotice() {
	const lastSeen = useSettingsStore((s) => s.lastSeenChangelogVersion);
	const markChangelogSeen = useSettingsStore((s) => s.markChangelogSeen);

	const dismiss = useCallback(() => {
		markChangelogSeen(LATEST_CHANGELOG_VERSION);
	}, [markChangelogSeen]);

	if (lastSeen === LATEST_CHANGELOG_VERSION) return null;

	const unseen = getUnseenReleases(lastSeen);
	if (unseen.length === 0) return null;

	return (
		<Dialog
			title={
				<span className={styles.title}>
					<RocketIcon size={16} />
					有新的更新内容
				</span>
			}
			subtitle={`eztb 已更新至 ${LATEST_CHANGELOG_VERSION}`}
			onClose={dismiss}
			width="medium"
			position={{ narrow: "bottom", regular: "center" }}
			className={styles.dialog}
			footerButtons={[
				{
					buttonType: "primary",
					content: "我知道了",
					onClick: dismiss,
				},
			]}
		>
			<div className={styles.body}>
				{unseen.map((entry) => (
					<section key={entry.version} className={styles.release}>
						<h4 className={styles.version}>{entry.version}</h4>
						<p className={styles.summary}>{entry.summary}</p>
						<ul className={styles.list}>
							{entry.items.map((item) => (
								<li key={item}>{item}</li>
							))}
						</ul>
					</section>
				))}
				<p className={styles.moreLink}>
					<Link to="/about" onClick={dismiss}>
						查看完整更新日志 →
					</Link>
				</p>
			</div>
		</Dialog>
	);
}

export default UpdateNotice;
