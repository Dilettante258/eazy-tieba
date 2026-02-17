import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { Banner, Label, Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { BookIcon, CheckCircleIcon, LinkExternalIcon } from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import { QueryForm } from "../components/QueryForm.tsx";
import { likeForumsOptions } from "../hooks/queries.ts";
import { userSearchSchema } from "../lib/search-schemas.ts";
import styles from "./page.module.css";

function LikeForumPage() {
	const { method, id } = Route.useSearch();
	const { data, isLoading, error } = useQuery(
		likeForumsOptions(method, id),
	);

	const list = data ?? [];

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

			{data && list.length === 0 && (
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
							const forumUrl = `https://tieba.baidu.com/f?kw=${encodeURIComponent(forum.forum_name)}`;
							const signed = forum.is_sign === "1";
							return (
								<a
									key={forum.forum_id || i}
									href={forumUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.forumCard}
								>
									<div className={styles.forumHeader}>
										<h4 className={styles.forumName}>
											{forum.forum_name}吧
										</h4>
										<LinkExternalIcon size={14} className={styles.forumExternalIcon} />
									</div>
									<div className={styles.forumMeta}>
										{forum.level_id && (
											<Label variant="accent">
												Lv.{forum.level_id}
											</Label>
										)}
										{forum.level_name && (
											<span className={styles.forumExp}>
												{forum.level_name}
											</span>
										)}
										{signed && (
											<span className={styles.forumSigned}>
												<CheckCircleIcon size={12} />
												已签到
											</span>
										)}
									</div>
									{forum.cur_score && (
										<span className={styles.forumExp}>
											经验值: {forum.cur_score}
										</span>
									)}
								</a>
							);
						})}
					</div>
				</>
			)}
		</div>
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
