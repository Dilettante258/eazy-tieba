import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { Avatar, Banner, Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { LinkExternalIcon, PeopleIcon } from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import { QueryForm } from "../components/QueryForm.tsx";
import { followOptions } from "../hooks/queries.ts";
import { userSearchSchema } from "../lib/search-schemas.ts";
import { portraitUrl } from "../lib/portrait.ts";
import styles from "./page.module.css";

function tiebaHomeUrl(portrait: string) {
	return `https://tieba.baidu.com/home/main?id=${portrait}`;
}

function FollowPage() {
	const { method, id } = Route.useSearch();
	const { data, isLoading, error } = useQuery(followOptions(method, id));

	const list = data?.follow_list ?? [];

	return (
		<div>
			<h2 className={styles.heading}>关注列表</h2>
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
						<PeopleIcon size={24} />
					</Blankslate.Visual>
					<Blankslate.Heading>暂无关注数据</Blankslate.Heading>
					<Blankslate.Description>
						该用户还没有关注其他人
					</Blankslate.Description>
				</Blankslate>
			)}

			{list.length > 0 && (
				<>
					<p className={styles.listCount}>
						共关注 <strong>{list.length}</strong> 人
					</p>
					<div className={styles.userList}>
						{list.map((user, i) => (
							<div
								key={user.id || i}
								className={styles.userItem}
							>
								{user.portrait && (
									<a
										href={tiebaHomeUrl(user.portrait)}
										target="_blank"
										rel="noopener noreferrer"
									>
										<Avatar
											src={portraitUrl(user.portrait)}
											size={40}
											alt={user.name_show || user.name}
										/>
									</a>
								)}
								<div className={styles.userInfo}>
									<div className={styles.userNameRow}>
										<a
											href={tiebaHomeUrl(user.portrait)}
											target="_blank"
											rel="noopener noreferrer"
											className={styles.userName}
										>
											{user.name_show || user.name}
										</a>
										<a
											href={tiebaHomeUrl(user.portrait)}
											target="_blank"
											rel="noopener noreferrer"
											className={styles.userExternalLink}
											aria-label="查看贴吧主页"
										>
											<LinkExternalIcon size={14} />
										</a>
									</div>
									{user.intro && (
										<p className={styles.userIntro}>
											{user.intro}
										</p>
									)}
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}

export const Route = createFileRoute("/follow")({
	validateSearch: zodSearchValidator({ schema: userSearchSchema }),
	loaderDeps: ({ search }) => ({ method: search.method, id: search.id }),
	loader: ({ context: { queryClient }, deps: { method, id } }) => {
		if (method && id) {
			void queryClient.prefetchQuery(followOptions(method, id));
		}
	},
	component: FollowPage,
});
