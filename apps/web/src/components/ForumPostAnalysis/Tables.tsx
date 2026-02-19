import { useMemo, useState } from "react";
import styles from "./ForumPostAnalysis.module.css";

const TIEBA_THREAD = "https://tieba.baidu.com/p/";
const TIEBA_PROFILE = "https://tieba.baidu.com/home/main?id=";

// ── IP 属地变动用户 ──

interface IpChangedUsersTableProps {
	data: Array<{
		name: string;
		portrait: string;
		ips: string[];
		postCount: number;
	}>;
}

export function IpChangedUsersTable({ data }: IpChangedUsersTableProps) {
	return (
		<div className={styles.chartModule}>
			<h3 className={styles.chartTitle}>IP 属地变动用户</h3>
			<p className={styles.chartDescription}>
				以下用户在不同帖子中使用了不同 IP 属地
			</p>
			{data.length === 0 ? (
				<p className={styles.chartDescription}>暂无数据</p>
			) : (
				<div className={styles.tableScroll}>
					<table className={styles.rankTable}>
						<thead>
							<tr>
								<th>用户</th>
								<th>IP 属地</th>
								<th>发帖数</th>
							</tr>
						</thead>
						<tbody>
							{data.map((u) => (
								<tr key={u.name}>
									<td>
										{u.portrait ? (
											<a
												className={styles.link}
												href={`${TIEBA_PROFILE}${u.portrait}`}
												target="_blank"
												rel="noreferrer"
											>
												{u.name}
											</a>
										) : (
											u.name
										)}
									</td>
									<td>{u.ips.join("、")}</td>
									<td>{u.postCount}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// ── 点赞最多的帖子 / 回复 ──

interface TopLikedPostsTableProps {
	data: Array<{
		tid: string;
		title: string;
		floor: number;
		author: string;
		content: string;
		agreeNum: number;
	}>;
}

export function TopLikedPostsTable({ data }: TopLikedPostsTableProps) {
	const [mode, setMode] = useState<"thread" | "reply">("thread");

	const filtered = useMemo(
		() =>
			data
				.filter((p) => (mode === "thread" ? p.floor === 1 : p.floor > 1))
				.slice(0, 20),
		[data, mode],
	);

	return (
		<div className={styles.chartModule}>
			<div className={styles.tableHeader}>
				<div>
					<h3 className={styles.chartTitle}>
						点赞最多的{mode === "thread" ? "帖子" : "回复"}
					</h3>
					<p className={styles.chartDescription}>
						按点赞数排序的{mode === "thread" ? "主题贴" : "回复"}
					</p>
				</div>
				<button
					type="button"
					className={styles.toggleBtn}
					onClick={() => setMode((m) => (m === "thread" ? "reply" : "thread"))}
				>
					切换{mode === "thread" ? "回复" : "帖子"}
				</button>
			</div>
			{filtered.length === 0 ? (
				<p className={styles.chartDescription}>暂无数据</p>
			) : (
				<div className={styles.tableScroll}>
					<table className={styles.rankTable}>
						<thead>
							<tr>
								<th>#</th>
								<th>内容</th>
								<th>作者</th>
								<th>楼层</th>
								<th>点赞</th>
							</tr>
						</thead>
						<tbody>
							{filtered.map((p, i) => (
								<tr key={`${p.tid}-${p.floor}`}>
									<td>{i + 1}</td>
									<td>
										<div className={styles.contentCell}>
											<a
												className={`${styles.threadTitle} ${styles.link}`}
												href={`${TIEBA_THREAD}${p.tid}`}
												target="_blank"
												rel="noreferrer"
											>
												{p.title}
											</a>
											{p.content && (
												<span className={styles.contentExcerpt}>
													{p.content.length > 40
														? `${p.content.slice(0, 40)}…`
														: p.content}
												</span>
											)}
										</div>
									</td>
									<td>{p.author}</td>
									<td>{p.floor}L</td>
									<td>{p.agreeNum}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// ── 回复最多的帖子 / 回复 ──

interface TopRepliedThreadsTableProps {
	threadData: Array<{
		title: string;
		tid: string;
		author: string;
		replyNum: number;
		viewNum: number;
	}>;
	replyData: Array<{
		tid: string;
		title: string;
		floor: number;
		author: string;
		content: string;
		subPostNumber: number;
	}>;
}

export function TopRepliedThreadsTable({
	threadData,
	replyData,
}: TopRepliedThreadsTableProps) {
	const [mode, setMode] = useState<"thread" | "reply">("thread");

	return (
		<div className={styles.chartModule}>
			<div className={styles.tableHeader}>
				<div>
					<h3 className={styles.chartTitle}>
						回复最多的{mode === "thread" ? "帖子" : "回复"}
					</h3>
					<p className={styles.chartDescription}>
						{mode === "thread"
							? "按回复数排序的主题贴"
							: "按楼中楼数排序的回复"}
					</p>
				</div>
				<button
					type="button"
					className={styles.toggleBtn}
					onClick={() => setMode((m) => (m === "thread" ? "reply" : "thread"))}
				>
					切换{mode === "thread" ? "回复" : "帖子"}
				</button>
			</div>
			{mode === "thread" ? (
				threadData.length === 0 ? (
					<p className={styles.chartDescription}>暂无数据</p>
				) : (
					<div className={styles.tableScroll}>
						<table className={styles.rankTable}>
							<thead>
								<tr>
									<th>#</th>
									<th>标题</th>
									<th>作者</th>
									<th>回复</th>
									<th>浏览</th>
								</tr>
							</thead>
							<tbody>
								{threadData.map((t, i) => (
									<tr key={t.tid}>
										<td>{i + 1}</td>
										<td>
											<a
												className={styles.link}
												href={`${TIEBA_THREAD}${t.tid}`}
												target="_blank"
												rel="noreferrer"
											>
												{t.title.length > 30
													? `${t.title.slice(0, 30)}…`
													: t.title}
											</a>
										</td>
										<td>{t.author}</td>
										<td>{t.replyNum}</td>
										<td>{t.viewNum}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)
			) : replyData.length === 0 ? (
				<p className={styles.chartDescription}>暂无数据</p>
			) : (
				<div className={styles.tableScroll}>
					<table className={styles.rankTable}>
						<thead>
							<tr>
								<th>#</th>
								<th>内容</th>
								<th>作者</th>
								<th>楼层</th>
								<th>楼中楼</th>
							</tr>
						</thead>
						<tbody>
							{replyData.map((p, i) => (
								<tr key={`${p.tid}-${p.floor}`}>
									<td>{i + 1}</td>
									<td>
										<div className={styles.contentCell}>
											<a
												className={`${styles.threadTitle} ${styles.link}`}
												href={`${TIEBA_THREAD}${p.tid}`}
												target="_blank"
												rel="noreferrer"
											>
												{p.title}
											</a>
											{p.content && (
												<span className={styles.contentExcerpt}>
													{p.content.length > 40
														? `${p.content.slice(0, 40)}…`
														: p.content}
												</span>
											)}
										</div>
									</td>
									<td>{p.author}</td>
									<td>{p.floor}L</td>
									<td>{p.subPostNumber}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}

// ── 热门吧友 ──

interface HotUsersTableProps {
	data: Array<{
		name: string;
		portrait: string;
		threadCount: number;
		replyCount: number;
		totalAgrees: number;
		score: number;
	}>;
}

export function HotUsersTable({ data }: HotUsersTableProps) {
	return (
		<div className={styles.chartModule}>
			<h3 className={styles.chartTitle}>热门吧友</h3>
			<p className={styles.chartDescription}>
				综合发帖、回复、点赞的用户排名
			</p>
			{data.length === 0 ? (
				<p className={styles.chartDescription}>暂无数据</p>
			) : (
				<div className={styles.tableScroll}>
					<table className={styles.rankTable}>
						<thead>
							<tr>
								<th>#</th>
								<th>用户</th>
								<th>主题贴</th>
								<th>回复</th>
								<th>获赞</th>
								<th>热度</th>
							</tr>
						</thead>
						<tbody>
							{data.map((u, i) => (
								<tr key={u.name}>
									<td>{i + 1}</td>
									<td>
										{u.portrait ? (
											<a
												className={styles.link}
												href={`${TIEBA_PROFILE}${u.portrait}`}
												target="_blank"
												rel="noreferrer"
											>
												{u.name}
											</a>
										) : (
											u.name
										)}
									</td>
									<td>{u.threadCount}</td>
									<td>{u.replyCount}</td>
									<td>{u.totalAgrees}</td>
									<td>{u.score}</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	);
}
