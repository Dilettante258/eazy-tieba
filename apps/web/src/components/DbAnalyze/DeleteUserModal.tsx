import { useRef } from "react";
import { Button, Spinner } from "@primer/react";
import { AlertIcon } from "@primer/octicons-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api-client.ts";
import styles from "./DbAnalyze.module.css";

interface DeleteUserModalProps {
	authorId: string | null; // null = hidden
	displayName: string;
	onClose: () => void;
}

export function DeleteUserModal({
	authorId,
	displayName,
	onClose,
}: DeleteUserModalProps) {
	const queryClient = useQueryClient();
	const overlayRef = useRef<HTMLDivElement>(null);

	const mutation = useMutation({
		mutationFn: async (id: string) => {
			const res = await api["db-analyze"].user.$delete({
				query: { authorId: id },
			});
			if (!res.ok) throw new Error(`删除失败 (${res.status})`);
			return res.json();
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["db-analyze"] });
			onClose();
		},
	});

	if (!authorId) return null;

	return (
		<div
			ref={overlayRef}
			className={styles.modalOverlay}
			onClick={(e) => {
				if (e.target === overlayRef.current && !mutation.isPending) onClose();
			}}
		>
			<div className={styles.modalPanel} role="dialog" aria-modal="true">
				<div className={styles.modalHeader}>
					<AlertIcon size={16} className={styles.modalDangerIcon} />
					<span className={styles.modalTitle}>删除用户数据</span>
				</div>
				<div className={styles.modalBody}>
					<p>
						确定要删除用户{" "}
						<strong>{displayName}</strong>（ID: {authorId}）的所有发言记录和用户信息吗？
					</p>
					<p className={styles.modalHint}>
						将删除该用户的帖子、楼中楼、主题帖和用户档案，操作不可撤销。
					</p>
					{mutation.error && (
						<p className={styles.modalError}>{(mutation.error as Error).message}</p>
					)}
				</div>
				<div className={styles.modalFooter}>
					<Button
						variant="default"
						onClick={onClose}
						disabled={mutation.isPending}
					>
						取消
					</Button>
					<Button
						variant="danger"
						onClick={() => mutation.mutate(authorId)}
						disabled={mutation.isPending}
					>
						{mutation.isPending ? (
							<>
								<Spinner size="small" />
								<span>删除中…</span>
							</>
						) : (
							"确认删除"
						)}
					</Button>
				</div>
			</div>
		</div>
	);
}
