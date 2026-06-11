import { Button, Spinner } from "@primer/react";
import moduleStyles from "../ForumPostAnalysis/ForumPostAnalysis.module.css";

export interface TopUser {
	authorId: string;
	name: string | null;
	nameShow: string | null;
	forumCount: number;
	forumIds: string[];
}

interface TopUsersTableProps {
	users: TopUser[];
	total: number;
	hasNextPage: boolean;
	loading: boolean;
	onLoadMore: () => void;
}

export function TopUsersTable({
	users,
	total,
	hasNextPage,
	loading,
	onLoadMore,
}: TopUsersTableProps) {
	return (
		<div>
			<table className={moduleStyles.rankTable}>
				<thead>
					<tr>
						<th>#</th>
						<th>用户</th>
						<th>用户 ID</th>
						<th>发言吧数</th>
						<th>吧 IDs（前 10）</th>
					</tr>
				</thead>
				<tbody>
					{users.map((u, i) => (
						<tr key={u.authorId}>
							<td>{i + 1}</td>
							<td>{u.nameShow || u.name || "—"}</td>
							<td
								style={{ color: "var(--fgColor-muted)", fontSize: "0.75rem" }}
							>
								{u.authorId}
							</td>
							<td style={{ fontWeight: 600 }}>{u.forumCount}</td>
							<td
								style={{
									color: "var(--fgColor-muted)",
									fontSize: "0.75rem",
									maxWidth: "300px",
									overflow: "hidden",
									textOverflow: "ellipsis",
								}}
							>
								{u.forumIds.slice(0, 10).join(", ")}
								{u.forumIds.length > 10 ? "…" : ""}
							</td>
						</tr>
					))}
				</tbody>
			</table>

			{hasNextPage && (
				<div style={{ textAlign: "center", marginTop: "1rem" }}>
					<Button variant="default" onClick={onLoadMore} disabled={loading}>
						{loading ? (
							<Spinner size="small" />
						) : (
							`加载更多（已显示 ${users.length.toLocaleString()} / ${total.toLocaleString()}）`
						)}
					</Button>
				</div>
			)}
		</div>
	);
}
