import { PencilIcon, PlusIcon, TrashIcon, XIcon } from "@primer/octicons-react";
import { Button, TextInput } from "@primer/react";
import { useMemo, useState } from "react";
import { api } from "../../lib/api-client.ts";
import type { AnalysisForum, AnalysisForumType } from "./analysis-types.ts";
import { readJson } from "./analysis-types.ts";
import styles from "./DbAnalyze.module.css";

interface Props {
	forums: AnalysisForum[];
	types: AnalysisForumType[];
	onChanged: () => Promise<unknown> | unknown;
	compact?: boolean;
}

export function ForumGroupManager({
	forums,
	types,
	onChanged,
	compact,
}: Props) {
	const groups = types.filter((type) => type.source === "custom");
	const [editing, setEditing] = useState<AnalysisForumType | "new" | null>(
		null,
	);
	const [name, setName] = useState("");
	const [memberIds, setMemberIds] = useState<Set<string>>(new Set());
	const [filter, setFilter] = useState("");
	const [saving, setSaving] = useState(false);
	const [deletingId, setDeletingId] = useState<string | null>(null);
	const [error, setError] = useState("");

	const filteredForums = useMemo(() => {
		const q = filter.trim().toLocaleLowerCase();
		if (!q) return forums;
		return forums.filter((forum) =>
			`${forum.name} ${forum.firstClass} ${forum.secondClass}`
				.toLocaleLowerCase()
				.includes(q),
		);
	}, [filter, forums]);

	function openEditor(group: AnalysisForumType | "new") {
		setEditing(group);
		setName(group === "new" ? "" : group.name);
		setMemberIds(new Set(group === "new" ? [] : group.forumIds));
		setFilter("");
		setError("");
	}

	async function save() {
		if (!name.trim() || memberIds.size === 0) {
			setError("请输入名称并至少选择一个吧");
			return;
		}
		setSaving(true);
		setError("");
		try {
			if (editing === "new") {
				await api["db-analyze"]["forum-groups"]
					.$post({ json: { name: name.trim(), forumIds: [...memberIds] } })
					.then((response) => readJson(response));
			} else if (editing) {
				await api["db-analyze"]["forum-groups"][":id"]
					.$put({
						param: { id: editing.id.replace("custom:", "") },
						json: {
							name: name.trim(),
							forumIds: [...memberIds],
							...(editing.updatedAt && {
								expectedUpdatedAt: editing.updatedAt,
							}),
						},
					})
					.then((response) => readJson(response));
			}
			await onChanged();
			setEditing(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setSaving(false);
		}
	}

	async function remove(group: AnalysisForumType) {
		if (!window.confirm(`确认删除自定义类型“${group.name}”？`)) return;
		setDeletingId(group.id);
		setError("");
		try {
			await api["db-analyze"]["forum-groups"][":id"]
				.$delete({ param: { id: group.id.replace("custom:", "") } })
				.then((response) => readJson(response));
			await onChanged();
		} catch (err) {
			setError(err instanceof Error ? err.message : String(err));
		} finally {
			setDeletingId(null);
		}
	}

	return (
		<div className={compact ? styles.groupManagerCompact : styles.groupManager}>
			<div className={styles.groupManagerHeader}>
				<div>
					<strong>自定义吧类型</strong>
					{!compact && <p>一个吧可以加入多个自定义类型。</p>}
				</div>
				<Button
					size="small"
					leadingVisual={PlusIcon}
					disabled={saving || deletingId !== null}
					onClick={() => openEditor("new")}
				>
					新建类型
				</Button>
			</div>
			{groups.length > 0 ? (
				<div className={styles.groupList}>
					{groups.map((group) => (
						<div key={group.id} className={styles.groupRow}>
							<span>
								<strong>{group.name}</strong> · {group.forumIds.length} 个吧
							</span>
							<div>
								<Button
									aria-label="编辑"
									size="small"
									variant="invisible"
									disabled={saving || deletingId !== null}
									onClick={() => openEditor(group)}
								>
									<PencilIcon />
								</Button>
								<Button
									aria-label="删除"
									size="small"
									variant="invisible"
									disabled={saving || deletingId !== null}
									loading={deletingId === group.id}
									loadingAnnouncement={`正在删除自定义类型${group.name}`}
									onClick={() => remove(group)}
								>
									<TrashIcon />
								</Button>
							</div>
						</div>
					))}
				</div>
			) : !compact ? (
				<p className={styles.emptyHint}>尚未创建自定义类型。</p>
			) : null}
			{error && !editing && <p className={styles.modalError}>{error}</p>}

			{editing && (
				<div className={styles.modalOverlay}>
					<button
						type="button"
						className={styles.overlayDismiss}
						aria-label="关闭类型编辑"
						onClick={() => setEditing(null)}
					/>
					<div
						className={`${styles.modalPanel} ${styles.groupEditor}`}
						role="dialog"
						aria-modal="true"
					>
						<div className={styles.modalHeader}>
							<span className={styles.modalTitle}>
								{editing === "new" ? "新建" : "编辑"}自定义类型
							</span>
							<Button
								aria-label="关闭"
								size="small"
								variant="invisible"
								onClick={() => setEditing(null)}
							>
								<XIcon />
							</Button>
						</div>
						<div className={styles.modalBody}>
							<label className={styles.fieldLabel} htmlFor="forum-group-name">
								类型名称
							</label>
							<TextInput
								id="forum-group-name"
								block
								value={name}
								maxLength={40}
								onChange={(event) => setName(event.target.value)}
								placeholder="例如：重点地区"
							/>
							<label className={styles.fieldLabel} htmlFor="forum-group-filter">
								成员贴吧（已选 {memberIds.size}）
							</label>
							<TextInput
								id="forum-group-filter"
								block
								value={filter}
								onChange={(event) => setFilter(event.target.value)}
								placeholder="搜索吧名或官方分类"
							/>
							<div className={styles.memberPicker}>
								{filteredForums.map((forum) => (
									<label key={forum.id} className={styles.memberOption}>
										<input
											type="checkbox"
											checked={memberIds.has(forum.id)}
											onChange={() =>
												setMemberIds((previous) => {
													const next = new Set(previous);
													if (next.has(forum.id)) next.delete(forum.id);
													else next.add(forum.id);
													return next;
												})
											}
										/>
										<span>
											{forum.name}
											<small>
												{forum.firstClass} / {forum.secondClass}
											</small>
										</span>
									</label>
								))}
							</div>
							{error && <p className={styles.modalError}>{error}</p>}
						</div>
						<div className={styles.modalFooter}>
							<Button disabled={saving} onClick={() => setEditing(null)}>
								取消
							</Button>
							<Button
								variant="primary"
								disabled={saving}
								loading={saving}
								loadingAnnouncement="正在保存自定义类型"
								onClick={save}
							>
								保存
							</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
