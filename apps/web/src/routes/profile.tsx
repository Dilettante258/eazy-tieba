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
	const sexLabel = data?.sex === 1 ? "男" : data?.sex === 2 ? "女" : undefined;

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
							<Avatar src={avatarUrl} size={96} alt={displayName} square />
						)}
						<div className={styles.cardHeaderInfo}>
							<h3 className={styles.name}>{displayName}</h3>
							{data.intro && <p className={styles.intro}>{data.intro}</p>}
							<div className={styles.labels}>
								{sexLabel && (
									<Label variant={data.sex === 1 ? "accent" : "done"}>
										{sexLabel}
									</Label>
								)}
								{data.tbAge && <Label>吧龄 {data.tbAge} 年</Label>}
								{data.userGrowth != null && data.userGrowth > 0 && (
									<Label variant="attention">
										成长等级 Lv.{data.userGrowth}
									</Label>
								)}
								{data.levelId != null && data.levelId > 0 && (
									<Label>等级 Lv.{data.levelId}</Label>
								)}
								{data.tbVip && <Label variant="sponsors">贴吧 VIP</Label>}
								{data.godData && <Label variant="severe">{data.godData}</Label>}
								{data.ipAddress && (
									<Label variant="accent">IP 属地: {data.ipAddress}</Label>
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
						<StatItem label="关注贴吧" value={data.myLikeNum} />
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
									value={new Date(data.ageTimestamp * 1000).toLocaleString(
										"zh-CN",
									)}
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
										value={new Date(
											data.vip.expireTime * 1000,
										).toLocaleDateString("zh-CN")}
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

					{/* 等级头衔 */}
					{data.gradeInfo && data.gradeInfo.length > 0 && (
						<div className={styles.section}>
							<h4 className={styles.sectionTitle}>等级头衔</h4>
							<div className={styles.managerList}>
								{data.gradeInfo.map((item) => (
									<div key={item.level} className={styles.managerItem}>
										<span className={styles.managerRole}>Lv.{item.level}</span>
										<div className={styles.managerForums}>
											{item.forums.map((forum) => (
												<Label key={forum}>{forum}吧</Label>
											))}
										</div>
									</div>
								))}
							</div>
						</div>
					)}

					{/* 常逛的吧 */}
					{data.likeForum && data.likeForum.length > 0 && (
						<div className={styles.section}>
							<h4 className={styles.sectionTitle}>常逛的吧</h4>
							<div className={styles.managerForums}>
								{data.likeForum.map((f) => (
									<Label key={f.id}>{f.name}吧</Label>
								))}
							</div>
						</div>
					)}

					{/* 最近主题贴 */}
					{data.recentPosts && data.recentPosts.length > 0 && (
						<div className={styles.section}>
							<h4 className={styles.sectionTitle}>最近主题贴</h4>
							<div className={styles.recentPosts}>
								{data.recentPosts.map((p) => (
									<a
										key={p.threadId}
										className={styles.recentPostItem}
										href={`https://tieba.baidu.com/p/${p.threadId}`}
										target="_blank"
										rel="noopener noreferrer"
									>
										<span className={styles.recentPostTitle}>
											{p.title || "（无标题）"}
										</span>
										<span className={styles.recentPostMeta}>
											<Label size="small">{p.forumName}吧</Label>
											<span>回复 {p.replyNum}</span>
											{p.agreeNum > 0 && <span>赞 {p.agreeNum}</span>}
											<span>
												{new Date(p.createTime * 1000).toLocaleDateString(
													"zh-CN",
												)}
											</span>
										</span>
									</a>
								))}
							</div>
						</div>
					)}

					{/* 隐私设置 */}
					{data.privacy && (
						<div className={styles.section}>
							<h4 className={styles.sectionTitle}>隐私设置</h4>
							<div className={styles.infoGrid}>
								<InfoRow
									label="动态可见"
									value={data.privacy.post === 0 ? "公开" : "隐藏"}
								/>
								<InfoRow
									label="关注贴吧可见"
									value={data.privacy.like !== 0 ? "公开" : "隐藏"}
								/>
								<InfoRow
									label="关注/粉丝可见"
									value={data.privacy.friend !== 0 ? "公开" : "隐藏"}
								/>
							</div>
						</div>
					)}
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
	if (value == null || value === "" || value === 0 || value === "0")
		return null;
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
