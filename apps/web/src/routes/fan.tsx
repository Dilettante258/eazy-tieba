import { createFileRoute } from "@tanstack/react-router";
import { zodSearchValidator } from "@tanstack/router-zod-adapter";
import { Banner, Spinner } from "@primer/react";
import { Blankslate } from "@primer/react/experimental";
import { LinkExternalIcon, PeopleIcon } from "@primer/octicons-react";
import { useQuery } from "@tanstack/react-query";
import { QueryForm } from "../components/QueryForm.tsx";
import { fansOptions } from "../hooks/queries.ts";
import { userSearchSchema } from "../lib/search-schemas.ts";
import { portraitUrl } from "../lib/portrait.ts";
import { ConcurrentImage } from "../components/ConcurrentImage.tsx";
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
					<Blankslate.Description>该用户还没有粉丝</Blankslate.Description>
				</Blankslate>
			)}

			{list.length > 0 && (
				<>
					<p className={styles.listCount}>
						共有 <strong>{list.length}</strong> 位粉丝
					</p>
					<div className={styles.userGrid}>
						{list.map((user, i) => {
							const homeUrl = user.portrait
								? tiebaHomeUrl(user.portrait)
								: undefined;
							return (
								<a
									key={user.id || i}
									href={homeUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.userCard}
								>
									{user.portrait && (
										<ConcurrentImage
											src={portraitUrl(user.portrait)}
											alt={user.name_show || user.name}
											referrerPolicy="no-referrer"
											className={styles.userAvatar}
											width={44}
											height={44}
										/>
									)}
									<div className={styles.userCardBody}>
										<div className={styles.userCardNameRow}>
											<span className={styles.userCardName}>
												{user.name_show || user.name}
											</span>
											<LinkExternalIcon
												size={12}
												className={styles.userCardExtIcon}
											/>
										</div>
										{user.name &&
											user.name_show &&
											user.name !== user.name_show && (
												<span className={styles.userCardUsername}>
													@{user.name}
												</span>
											)}
									</div>
								</a>
							);
						})}
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
