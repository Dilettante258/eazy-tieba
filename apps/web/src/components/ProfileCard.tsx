import { Avatar, Label } from "@primer/react";
import { SkeletonAvatar, SkeletonText } from "@primer/react/experimental";
import { AlertIcon } from "@primer/octicons-react";
import { Component, Suspense, type ReactNode } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { profileOptions } from "../hooks/queries.ts";
import type { Method } from "../hooks/queries.ts";
import { portraitUrl } from "../lib/portrait.ts";
import styles from "./ProfileCard.module.css";

// ── 内部：数据组件（会 suspend） ──

function ProfileCardContent({ method, id }: { method: Method; id: string }) {
	const { data } = useSuspenseQuery(profileOptions(method, id));

	const user = data?.user;
	if (!user || (!user.name && !user.nameShow)) return null;

	const avatarUrl = user.portrait ? portraitUrl(user.portrait) : undefined;
	const displayName = user.nameShow || user.name || "";
	const sexLabel = user.sex === 1 ? "男" : user.sex === 2 ? "女" : undefined;

	return (
		<div className={styles.card}>
			{avatarUrl && <Avatar src={avatarUrl} size={48} alt={displayName} />}
			<div className={styles.info}>
				<span className={styles.name}>{displayName}</span>
				<div className={styles.meta}>
					{user.name && <Label size="small">{user.name}</Label>}
					{sexLabel && <span>{sexLabel}</span>}
					{user.ipAddress && <span>IP {user.ipAddress}</span>}
				</div>
				<div className={styles.meta}>
					{user.postNum !== 0 && <span>发帖 {user.postNum}</span>}
					{user.fansNum !== 0 && <span>粉丝 {user.fansNum}</span>}
					{user.concernNum !== 0 && <span>关注 {user.concernNum}</span>}
					{user.tbAge && <span>吧龄 {user.tbAge}</span>}
				</div>
			</div>
		</div>
	);
}

// ── 骨架屏 ──

function ProfileCardSkeleton() {
	return (
		<div className={styles.card} aria-busy="true">
			<SkeletonAvatar size={48} />
			<div className={styles.info}>
				<SkeletonText size="bodyLarge" maxWidth="8rem" />
				<SkeletonText size="bodySmall" maxWidth="14rem" lines={2} />
			</div>
		</div>
	);
}

// ── 错误边界 ──

interface ErrorBoundaryState {
	error: Error | null;
}

class ProfileErrorBoundary extends Component<
	{ children: ReactNode },
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error) {
		return { error };
	}

	render() {
		if (this.state.error) {
			return (
				<div className={styles.error}>
					<AlertIcon size={16} />
					<span>未能获取用户信息，请检查输入是否正确</span>
				</div>
			);
		}
		return this.props.children;
	}
}

// ── 导出组件 ──

export function ProfileCard({ method, id }: { method: Method; id: string }) {
	return (
		<ProfileErrorBoundary key={`${method}:${id}`}>
			<Suspense fallback={<ProfileCardSkeleton />}>
				<ProfileCardContent method={method} id={id} />
			</Suspense>
		</ProfileErrorBoundary>
	);
}
