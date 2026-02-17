import { Avatar, Button, SkeletonBox } from "@primer/react";
import { portraitUrl } from "../../lib/portrait.ts";
import styles from "./PostAnalysis.module.css";

interface ProfileData {
	user?: {
		name: string;
		nameShow: string;
		portrait: string;
		fansNum: number;
		concernNum: number;
		postNum: number;
		sex: number;
		ipAddress: string;
	};
	antiStat?: {
		blockStat: number;
	};
}

interface DataIndicatorProps {
	/** 用户资料 */
	profile: ProfileData | undefined;
	/** 资料是否加载中 */
	profileLoading: boolean;
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
	profile,
	profileLoading,
	pageParams,
	totalCount,
	lastBatchCount,
	lastBatchTimeRange,
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	status,
}: DataIndicatorProps) {
	const user = profile?.user;
	const displayName = user?.nameShow || user?.name;
	const avatarUrl = user?.portrait ? portraitUrl(user.portrait) : "";
	const blocked = (profile?.antiStat?.blockStat ?? 0) > 0;

	const pageFrom = pageParams[0]?.[0] ?? 1;
	const pageTo = pageParams[pageParams.length - 1]?.[1] ?? 10;

	return (
		<div className={styles.dataIndicator}>
			{/* 用户简介 */}
			<div className={styles.userProfile}>
				{profileLoading ? (
					<>
						<SkeletonBox
							height="40px"
							width="40px"
							className={styles.avatarSkeleton}
						/>
						<div className={styles.userProfileInfo}>
							<SkeletonBox height="1rem" width="5rem" />
							<SkeletonBox height="0.75rem" width="9rem" />
						</div>
					</>
				) : displayName ? (
					<>
						<Avatar
							src={avatarUrl}
							size={40}
							alt={displayName}
							square
						/>
						<div className={styles.userProfileInfo}>
							<span className={styles.userName}>
								{displayName}
								{blocked && " · 已封禁"}
							</span>
							<span className={styles.userStats}>
								{[
									`发帖 ${user?.postNum ?? 0}`,
									`关注 ${user?.concernNum ?? 0}`,
									`粉丝 ${user?.fansNum ?? 0}`,
								].join(" · ")}
							</span>
						</div>
					</>
				) : null}
			</div>

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
		</div>
	);
}
