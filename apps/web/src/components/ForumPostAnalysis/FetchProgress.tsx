import { ProgressBar, Spinner } from "@primer/react";
import type { ForumAnalysisState } from "../../hooks/use-forum-analysis.ts";
import styles from "./ForumPostAnalysis.module.css";

interface FetchProgressProps {
	phase: ForumAnalysisState["phase"];
	threadCount: number;
	postsFetched: number;
}

export function FetchProgress({
	phase,
	threadCount,
	postsFetched,
}: FetchProgressProps) {
	if (phase === "threads") {
		return (
			<div className={styles.progress}>
				<Spinner size="small" />
				<span>正在获取帖子列表…</span>
			</div>
		);
	}

	if (phase === "posts" && threadCount > 0) {
		const pct = Math.round((postsFetched / threadCount) * 100);
		return (
			<div className={styles.progress}>
				<span>
					正在分析帖子内容 {postsFetched}/{threadCount}
				</span>
				<ProgressBar
					progress={pct}
					aria-label="分析进度"
					className={styles.progressBar}
				/>
			</div>
		);
	}

	return null;
}
