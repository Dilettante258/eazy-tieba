import { Button, FormControl, SkeletonBox } from "@primer/react";
import styles from "./PostAnalysis.module.css";

interface DataIndicatorProps {
	/** 页码参数列表 */
	pageParams: Array<[number, number]>;
	/** 总数据条数 */
	totalCount: number;
	/** 最近一批新增条数 */
	lastBatchCount: number;
	/** 最近一批的时间范围 */
	lastBatchTimeRange: string;
	/** 是否还有更多数据 */
	hasNextPage: boolean;
	/** 是否正在加载 */
	isFetchingNextPage: boolean;
	/** 加载更多回调 */
	fetchNextPage: () => void;
	/** 加载状态 */
	status: "pending" | "error" | "success";
	/** 错误信息 */
	error: Error | null;
}

export function DataIndicator({
	pageParams,
	totalCount,
	lastBatchCount,
	lastBatchTimeRange,
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	status,
}: DataIndicatorProps) {
	const pageFrom = pageParams[0]?.[0] ?? 1;
	const pageTo = pageParams[pageParams.length - 1]?.[1] ?? 10;

	return (
		<div className={styles.dataIndicator}>
			{/* 数据范围 */}
			{status === "success" && (
				<dl className={styles.dataList}>
					<dt>已加载数据</dt>
					<dd>
						{totalCount} 帖（第 {pageFrom}–{pageTo} 页）
					</dd>
					<dt>最新一批</dt>
					<dd>+{lastBatchCount} 帖</dd>
					{lastBatchTimeRange && (
						<>
							<dt>时间跨度</dt>
							<dd>{lastBatchTimeRange}</dd>
						</>
					)}
				</dl>
			)}
			{status === "pending" && (
				<div className={styles.dataListSkeleton}>
					<SkeletonBox height="0.875rem" width="60%" />
					<SkeletonBox height="0.875rem" width="45%" />
				</div>
			)}
			{status === "error" && (
				<p className={styles.errorText}>加载失败，请重试</p>
			)}

			{/* 加载更多 */}
			<FormControl>
				<FormControl.Label>数据加载</FormControl.Label>
				<Button
					size="small"
					block
					onClick={() => fetchNextPage()}
					disabled={!hasNextPage || isFetchingNextPage}
				>
					{isFetchingNextPage
						? "正在加载..."
						: hasNextPage
							? "加载更多"
							: "已加载全部"}
				</Button>
				<FormControl.Caption>加载更多页数据以扩大分析范围</FormControl.Caption>
			</FormControl>
		</div>
	);
}
