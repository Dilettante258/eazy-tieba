import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { Avatar, Banner, Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { LinkExternalIcon, PeopleIcon } from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import { QueryForm } from "../components/QueryForm.tsx";
import { fansOptions } from "../hooks/queries.ts";
import { userSearchSchema } from "../lib/search-schemas.ts";
import { portraitUrl } from "../lib/portrait.ts";
import styles from "./page.module.css";

function tiebaHomeUrl(portrait: string) {
	return `https://tieba.baidu.com/home/main?id=${portrait}`;
}

function FanPage() {
	const { method, id } = Route.useSearch();
	const { data, isLoading, error } = useQuery(fansOptions(method, id));

	const list = data?.user_list ?? [];

	return (
		<div>
			<h2 className={styles.heading}>粉丝列表</h2>
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
					<Blankslate.Heading>暂无粉丝数据</Blankslate.Heading>
					<Blankslate.Description>
						该用户还没有粉丝
					</Blankslate.Description>
				</Blankslate>
			)}

			{list.length > 0 && (
				<>
					<p className={styles.listCount}>
						共有 <strong>{list.length}</strong> 位粉丝
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
								</div>
							</div>
						))}
					</div>
				</>
			)}
		</div>
	);
}

export const Route = createFileRoute("/fan")({
	validateSearch: zodSearchValidator({ schema: userSearchSchema }),
	loaderDeps: ({ search }) => ({ method: search.method, id: search.id }),
	loader: ({ context: { queryClient }, deps: { method, id } }) => {
		if (method && id) {
			void queryClient.prefetchQuery(fansOptions(method, id));
		}
	},
	component: FanPage,
});
