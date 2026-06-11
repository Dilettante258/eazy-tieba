import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Banner, Button, Spinner } from "@primer/react";
import { SearchIcon, TrashIcon } from "@primer/octicons-react";
import { api } from "../../lib/api-client.ts";
import { DeleteUserModal } from "../../components/DbAnalyze/DeleteUserModal.tsx";
import styles from "../../components/DbAnalyze/DbAnalyze.module.css";

interface UserResult {
	id: string;
	name: string | null;
	nameShow: string | null;
	postCount: number;
}

interface DeletingUser {
	id: string;
	displayName: string;
}

function ManagePage() {
	const [input, setInput] = useState("");
	const [query, setQuery] = useState("");
	const [deletingUser, setDeletingUser] = useState<DeletingUser | null>(null);

	const searchQuery = useQuery({
		queryKey: ["db-analyze", "users", query] as const,
		enabled: query.length > 0,
		queryFn: async () => {
			const res = await api["db-analyze"].users.$get({
				query: { q: query, limit: "50" },
			});
			if (!res.ok) throw new Error(`请求失败 (${res.status})`);
			return res.json();
		},
		staleTime: 30 * 1000,
	});

	const users: UserResult[] = searchQuery.data?.users ?? [];

	function handleSearch() {
		const q = input.trim();
		if (q) setQuery(q);
	}

	return (
		<div>
			<p style={{ color: "var(--fgColor-muted)", fontSize: "0.875rem", marginBottom: "1.25rem" }}>
				搜索用户后可删除机器人账号的所有发言记录（帖子、楼中楼、主题帖、用户档案）。
			</p>

			{/* 搜索栏 */}
			<div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
				<input
					type="text"
					value={input}
					placeholder="用户名或用户 ID"
					style={{
						flex: 1,
						padding: "0.375rem 0.75rem",
						border: "1px solid var(--borderColor-default, #d0d7de)",
						borderRadius: 6,
						fontSize: "0.875rem",
						background: "var(--bgColor-default)",
						color: "var(--fgColor-default)",
						outline: "none",
					}}
					onChange={(e) => setInput(e.target.value)}
					onKeyDown={(e) => e.key === "Enter" && handleSearch()}
				/>
				<Button leadingVisual={SearchIcon} onClick={handleSearch}>
					搜索
				</Button>
			</div>

			{/* 结果 */}
			{searchQuery.isPending && query && (
				<div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
					<Spinner />
				</div>
			)}

			{searchQuery.error && (
				<Banner
					variant="critical"
					title="搜索失败"
					description={(searchQuery.error as Error).message}
				/>
			)}

			{searchQuery.data && users.length === 0 && (
				<p style={{ color: "var(--fgColor-muted)", fontSize: "0.875rem" }}>
					未找到匹配用户。
				</p>
			)}

			{users.length > 0 && (
				<table className={styles.intersectionTable}>
					<thead>
						<tr>
							<th>用户</th>
							<th style={{ textAlign: "right" }}>发言数</th>
							<th>操作</th>
						</tr>
					</thead>
					<tbody>
						{users.map((u) => (
							<tr key={u.id}>
								<td>
									<div style={{ fontWeight: 500 }}>{u.nameShow || u.name || "—"}</div>
									<div style={{ color: "var(--fgColor-muted)", fontSize: "0.6875rem" }}>
										{u.id}
									</div>
								</td>
								<td style={{ textAlign: "right", fontWeight: 600 }}>
									{u.postCount.toLocaleString()}
								</td>
								<td>
									<Button
										size="small"
										variant="invisible"
										leadingVisual={TrashIcon}
										style={{ color: "var(--color-danger-fg, #cf222e)" }}
										onClick={() =>
											setDeletingUser({
												id: u.id,
												displayName: u.nameShow ?? u.name ?? u.id,
											})
										}
									>
										删除
									</Button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}

			<DeleteUserModal
				authorId={deletingUser?.id ?? null}
				displayName={deletingUser?.displayName ?? ""}
				onClose={() => setDeletingUser(null)}
			/>
		</div>
	);
}

export const Route = createFileRoute("/dbanalyze/manage")({
	component: ManagePage,
});
