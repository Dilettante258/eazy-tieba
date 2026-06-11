import { createFileRoute, Outlet, Link, useMatchRoute } from "@tanstack/react-router";
import styles from "./dbanalyze.module.css";

function DbAnalyzeLayout() {
	const matchRoute = useMatchRoute();
	const isExplore = Boolean(matchRoute({ to: "/dbanalyze/explore" }));
	const isManage = Boolean(matchRoute({ to: "/dbanalyze/manage" }));

	return (
		<div>
			<h2 style={{ marginBottom: "1rem" }}>数据库分析</h2>
			<div className={styles.tabNav}>
				<Link
					to="/dbanalyze"
					className={`${styles.tabItem} ${!isExplore && !isManage ? styles.tabActive : ""}`}
				>
					统计
				</Link>
				<Link
					to="/dbanalyze/explore"
					className={`${styles.tabItem} ${isExplore ? styles.tabActive : ""}`}
				>
					分析
				</Link>
				<Link
					to="/dbanalyze/manage"
					className={`${styles.tabItem} ${isManage ? styles.tabActive : ""}`}
				>
					管理
				</Link>
			</div>
			<Outlet />
		</div>
	);
}

export const Route = createFileRoute("/dbanalyze")({
	component: DbAnalyzeLayout,
});
