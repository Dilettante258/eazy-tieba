import { Spinner } from "@primer/react";
import { ChevronDownIcon, ChevronUpIcon } from "@primer/octicons-react";
import { useState } from "react";
import styles from "./DbAnalyze.module.css";

export interface CrossForum {
	id: string;
	name: string | null;
	crossUserCount: number;
}

interface ForumTagsPanelProps {
	forums: CrossForum[];
	selectedIds: Set<string>;
	loading?: boolean;
	overlapCounts?: Map<string, number>;
	overlapLoading?: boolean;
	onToggle: (id: string) => void;
}

export function ForumTagsPanel({
	forums,
	selectedIds,
	loading,
	overlapCounts,
	overlapLoading,
	onToggle,
}: ForumTagsPanelProps) {
	const [isOpen, setIsOpen] = useState(true);

	return (
		<div className={styles.tagsPanelOuter}>
			<button
				type="button"
				className={styles.tagsPanelHeader}
				onClick={() => setIsOpen((v) => !v)}
			>
				<span className={styles.tagsPanelTitle}>目标吧选择</span>
				{selectedIds.size > 0 && (
					<span className={styles.tagsPanelBadge}>{selectedIds.size} 个已选</span>
				)}
				{overlapLoading && (
					<span className={styles.tagsPanelHint}>
						<Spinner size="small" />
						<span>计算重叠中…</span>
					</span>
				)}
				<span className={styles.tagsPanelToggle}>
					{isOpen ? <ChevronUpIcon size={14} /> : <ChevronDownIcon size={14} />}
				</span>
			</button>

			{isOpen && (
				<div className={styles.tagsPanel}>
					{loading ? (
						<>
							<Spinner size="small" />
							<span
								style={{ color: "var(--fgColor-muted)", fontSize: "0.875rem" }}
							>
								加载吧列表…
							</span>
						</>
					) : forums.length === 0 ? (
						<span style={{ color: "var(--fgColor-muted)", fontSize: "0.875rem" }}>
							暂无数据
						</span>
					) : (
						forums.map((f) => {
							const selected = selectedIds.has(f.id);
							const overlapCount = overlapCounts?.get(f.id) ?? 0;
							const showOverlap = !selected && overlapCounts !== undefined;
							const dimmed = showOverlap && overlapCount === 0;
							return (
								<button
									key={f.id}
									type="button"
									className={`${styles.tag} ${selected ? styles.tagSelected : ""} ${dimmed ? styles.tagDimmed : ""}`}
									onClick={() => onToggle(f.id)}
								>
									{f.name ?? f.id}
									<span className={`${styles.tagCount} ${showOverlap ? styles.tagCountOverlap : ""}`}>
										{showOverlap ? overlapCount.toLocaleString() : f.crossUserCount}
									</span>
								</button>
							);
						})
					)}
				</div>
			)}
		</div>
	);
}
