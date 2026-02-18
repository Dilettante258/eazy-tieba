import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { Banner, Label, Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { BookIcon, LinkExternalIcon, AlertIcon } from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import { QueryForm } from "../components/QueryForm.tsx";
import { likeForumsOptions } from "../hooks/queries.ts";
import { userSearchSchema } from "../lib/search-schemas.ts";
import { ConcurrentImage } from "../components/ConcurrentImage.tsx";
import styles from "./page.module.css";

function LikeForumPage() {
	const { method, id } = Route.useSearch();
	const { data, isLoading, error } = useQuery(
		likeForumsOptions(method, id),
	);

	const list = data?.list ?? [];
	const hidden = data?.hidden ?? null;

	return (
		<div>
			<h2 className={styles.heading}>关注的吧</h2>
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

			{data && list.length === 0 && !hidden && (
				<Blankslate border>
					<Blankslate.Visual>
						<BookIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>暂无关注的吧</Blankslate.Heading>
					<Blankslate.Description>
						该用户还没有关注任何贴吧
					</Blankslate.Description>
				</Blankslate>
			)}

			{list.length > 0 && (
				<>
					<p className={styles.listCount}>
						共关注 <strong>{list.length}</strong> 个贴吧
					</p>
					<div className={styles.forumGrid}>
						{list.map((forum, i) => {
							const forumUrl = `https://tieba.baidu.com/f?kw=${encodeURIComponent(forum.name)}`;
							return (
								<a
									key={forum.id || i}
									href={forumUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.forumCard}
								>
									<div className={styles.forumHeader}>
										{forum.avatar && (
											<ConcurrentImage
												src={forum.avatar}
												alt=""
												referrerPolicy="no-referrer"
												className={styles.forumAvatar}
												width={36}
												height={36}
											/>
										)}
										<div className={styles.forumHeaderText}>
											<h4 className={styles.forumName}>
												{forum.name}吧
												<LinkExternalIcon size={12} className={styles.forumExternalIcon} />
											</h4>
											<div className={styles.forumMeta}>
												{forum.level_id && (
													<Label variant="accent" size="small">
														Lv.{forum.level_id}
													</Label>
												)}
												{forum.level_name && (
													<span className={styles.forumExp}>
														{forum.level_name}
													</span>
												)}
												{forum.cur_score && (
													<span className={styles.forumExp}>
														{forum.cur_score}/{forum.levelup_score}
													</span>
												)}
											</div>
										</div>
									</div>
									{forum.slogan && (
										<p className={styles.forumSlogan}>{forum.slogan}</p>
									)}
								</a>
							);
						})}
					</div>
				</>
			)}

			{/* 用户隐藏了关注贴吧，展示从 profile + panel 恢复的部分信息 */}
			{hidden && <HiddenForums grade={hidden.grade} plain={hidden.plain} />}
		</div>
	);
}

function HiddenForums({
	grade,
	plain,
}: { grade: Record<string, { forum_list: string[] }>; plain: string[] }) {
	const gradeEntries = Object.entries(grade);
	const hasData = gradeEntries.length > 0 || plain.length > 0;

	if (!hasData) {
		return (
			<Blankslate border>
				<Blankslate.Visual>
					<BookIcon size={24} />
				</Blankslate.Visual>
				<Blankslate.Heading>暂无关注的吧</Blankslate.Heading>
				<Blankslate.Description>
					该用户隐藏了关注贴吧，且无法获取到任何信息
				</Blankslate.Description>
			</Blankslate>
		);
	}

	return (
		<>
			<Banner
				variant="warning"
				title="该用户隐藏了关注贴吧"
				description="以下为从其他接口恢复的部分关注信息，可能不完整。"
			/>
			<div className={styles.hiddenForumSection}>
				{gradeEntries.map(([level, { forum_list }]) => (
					<div key={level}>
						<p className={styles.hiddenForumGradeTitle}>
							<AlertIcon size={14} />
							吧内等级 <strong>{level}</strong> 级（{forum_list.length} 个）
						</p>
						<div className={styles.hiddenForumList}>
							{forum_list.map((name) => (
								<a
									key={name}
									href={`https://tieba.baidu.com/f?kw=${encodeURIComponent(name)}`}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.hiddenForumChip}
								>
									{name}吧
									<LinkExternalIcon size={12} className={styles.forumExternalIcon} />
								</a>
							))}
						</div>
					</div>
				))}
				{plain.length > 0 && (
					<div>
						<p className={styles.hiddenForumGradeTitle}>
							其他关注的贴吧（{plain.length} 个）
						</p>
						<div className={styles.hiddenForumList}>
							{plain.map((name) => (
								<a
									key={name}
									href={`https://tieba.baidu.com/f?kw=${encodeURIComponent(name)}`}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.hiddenForumChip}
								>
									{name}吧
									<LinkExternalIcon size={12} className={styles.forumExternalIcon} />
								</a>
							))}
						</div>
					</div>
				)}
			</div>
		</>
	);
}

export const Route = createFileRoute("/likeforum")({
	validateSearch: zodSearchValidator({ schema: userSearchSchema }),
	loaderDeps: ({ search }) => ({ method: search.method, id: search.id }),
	loader: ({ context: { queryClient }, deps: { method, id } }) => {
		if (method && id) {
			void queryClient.prefetchQuery(likeForumsOptions(method, id));
		}
	},
	component: LikeForumPage,
});
