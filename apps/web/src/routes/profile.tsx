import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { Avatar, Banner, Label, Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { PersonIcon } from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import { QueryForm } from "../components/QueryForm.tsx";
import { condenseProfileOptions } from "../hooks/queries.ts";
import { userSearchSchema } from "../lib/search-schemas.ts";
import { portraitUrl } from "../lib/portrait.ts";
import styles from "./page.module.css";

function ProfilePage() {
	const { method, id } = Route.useSearch();
	const { data, isLoading, error } = useQuery(
		condenseProfileOptions(method, id),
	);

	const avatarUrl = data?.portrait ? portraitUrl(data.portrait) : "";
	const displayName = data?.nickname || data?.name || "未知";
	const sexLabel = data?.sex === 1 ? "男" : data?.sex === 0 ? "女" : undefined;

	return (
		<div>
			<h2 className={styles.heading}>用户资料</h2>
			<QueryForm />

			{isLoading && (
				<div className={styles.center}>
					<Spinner size="large" />
				</div>
			)}

			{error && (
				<Banner
					variant="critical"
					title="查询失败"
					description={error instanceof Error ? error.message : String(error)}
				/>
			)}

			{data && !data.name && !data.nickname && (
				<Blankslate border>
					<Blankslate.Visual>
						<PersonIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>未找到用户信息</Blankslate.Heading>
					<Blankslate.Description>
						请检查输入是否正确后重试
					</Blankslate.Description>
				</Blankslate>
			)}

			{data && (data.name || data.nickname) && (
				<div className={styles.card}>
					{/* 头部：头像 + 名称 + 标签 */}
					<div className={styles.cardHeader}>
						{avatarUrl && (
							<Avatar
								src={avatarUrl}
								size={96}
								alt={displayName}
								square
							/>
						)}
						<div className={styles.cardHeaderInfo}>
							<h3 className={styles.name}>{displayName}</h3>
							{data.intro && (
								<p className={styles.intro}>{data.intro}</p>
							)}
							<div className={styles.labels}>
								{sexLabel && (
									<Label variant={data.sex === 1 ? "accent" : "done"}>
										{sexLabel}
									</Label>
								)}
								{data.tbAge && (
									<Label>吧龄 {data.tbAge} 年</Label>
								)}
								{data.userGrowth != null && data.userGrowth > 0 && (
									<Label variant="attention">
										成长等级 Lv.{data.userGrowth}
									</Label>
								)}
								{data.tbVip && (
									<Label variant="sponsors">VIP</Label>
								)}
								{data.godData && (
									<Label variant="severe">{data.godData}</Label>
								)}
								{data.ipAddress && (
									<Label variant="accent">
										IP 属地: {data.ipAddress}
									</Label>
								)}
							</div>
						</div>
					</div>

					{/* 统计数据 */}
					<div className={styles.statsRow}>
						<StatItem label="发帖" value={data.postNum} />
						<StatItem label="关注" value={data.follow} />
						<StatItem label="粉丝" value={data.fan} />
						<StatItem label="获赞" value={data.totalAgreeNum} />
						<StatItem label="发出的赞" value={data.myLikeNum} />
					</div>

					{/* 基本信息 */}
					<div className={styles.section}>
						<h4 className={styles.sectionTitle}>基本信息</h4>
						<div className={styles.infoGrid}>
							<InfoRow label="用户名" value={data.name} />
							<InfoRow label="昵称" value={data.nickname} />
							<InfoRow label="百度ID" value={data.id} />
							<InfoRow label="主页UID" value={data.uid} />
							<InfoRow label="性别" value={sexLabel ?? "未知"} />
							{data.ageTimestamp != null && data.ageTimestamp > 0 && (
								<InfoRow
									label="头像上传时间"
									value={new Date(data.ageTimestamp * 1000).toLocaleString("zh-CN")}
								/>
							)}
						</div>
					</div>

					{/* 会员信息 */}
					<div className={styles.section}>
						<h4 className={styles.sectionTitle}>会员信息</h4>
						{data.vip && data.vip.level !== "0" ? (
							<div className={styles.infoGrid}>
								<InfoRow label="会员等级" value={`Lv.${data.vip.level}`} />
								<InfoRow
									label="会员状态"
									value={data.vip.status === "1" ? "已开通" : "已过期"}
								/>
								{data.vip.expireTime > 0 && (
									<InfoRow
										label="到期时间"
										value={new Date(data.vip.expireTime * 1000).toLocaleDateString("zh-CN")}
									/>
								)}
							</div>
						) : (
							<p className={styles.emptyHint}>暂无会员信息</p>
						)}
					</div>

					{/* 吧务信息 */}
					<div className={styles.section}>
						<h4 className={styles.sectionTitle}>吧务信息</h4>
						{data.managerInfo && data.managerInfo.length > 0 ? (
							<div className={styles.managerList}>
								{data.managerInfo.map((item) => (
									<div key={item.role} className={styles.managerItem}>
										<span className={styles.managerRole}>{item.role}</span>
										<div className={styles.managerForums}>
											{item.forums.map((forum) => (
												<Label key={forum}>{forum}吧</Label>
											))}
										</div>
									</div>
								))}
							</div>
						) : (
							<p className={styles.emptyHint}>暂无吧务信息</p>
						)}
					</div>
				</div>
			)}
		</div>
	);
}

function StatItem({
	label,
	value,
}: {
	label: string;
	value: string | number | undefined | null;
}) {
	if (value == null || value === "" || value === 0 || value === "0") return null;
	return (
		<div className={styles.statItem}>
			<p className={styles.statValue}>{String(value)}</p>
			<span className={styles.statLabel}>{label}</span>
		</div>
	);
}

function InfoRow({
	label,
	value,
}: {
	label: string;
	value: string | number | undefined | null;
}) {
	if (value == null || value === "") return null;
	return (
		<div className={styles.infoRow}>
			<span className={styles.infoLabel}>{label}</span>
			<span className={styles.infoValue}>{String(value)}</span>
		</div>
	);
}

export const Route = createFileRoute("/profile")({
	validateSearch: zodSearchValidator({ schema: userSearchSchema }),
	loaderDeps: ({ search }) => ({ method: search.method, id: search.id }),
	loader: ({ context: { queryClient }, deps: { method, id } }) => {
		if (method && id) {
			void queryClient.prefetchQuery(condenseProfileOptions(method, id));
		}
	},
	component: ProfilePage,
});
