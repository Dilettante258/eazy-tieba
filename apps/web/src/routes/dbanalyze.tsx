import { Button, FormControl, Spinner, TextInput } from "@primer/react";
import { useQueryClient } from "@tanstack/react-query";
import {
	createFileRoute,
	Link,
	Outlet,
	useMatchRoute,
} from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import { api } from "../lib/api-client.ts";
import {
	clearDbAnalyzeToken,
	DB_ANALYZE_AUTH_EXPIRED_EVENT,
	getDbAnalyzeToken,
	setDbAnalyzeToken,
} from "../lib/db-analyze-auth.ts";
import { useDbAnalyzeExploreStore } from "../lib/db-analyze-explore-store.ts";
import styles from "./dbanalyze.module.css";

type AuthState = "checking" | "locked" | "unlocked";

function DbAnalyzeLogin({
	message,
	onAuthenticated,
}: {
	message: string;
	onAuthenticated: () => void;
}) {
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState("");

	async function handleSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!password || submitting) return;
		setSubmitting(true);
		setError("");
		try {
			setDbAnalyzeToken(password);
			const response = await api["db-analyze"].auth.session.$get();
			if (!response.ok) {
				const body = (await response.json()) as { error?: string };
				throw new Error(body.error || `验证失败 (${response.status})`);
			}
			onAuthenticated();
		} catch (caught) {
			clearDbAnalyzeToken();
			setError(caught instanceof Error ? caught.message : "登录失败");
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<div className={styles.authPage}>
			<form className={styles.authCard} onSubmit={handleSubmit}>
				<h2>数据库分析</h2>
				<p>此页面受密码保护，请输入访问密码。</p>
				<FormControl required>
					<FormControl.Label>密码</FormControl.Label>
					<TextInput
						autoFocus
						autoComplete="current-password"
						block
						type="password"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
					/>
				</FormControl>
				{error || message ? (
					<p className={styles.authError} role="alert">
						{error || message}
					</p>
				) : null}
				<Button
					block
					disabled={!password || submitting}
					loading={submitting}
					loadingAnnouncement="正在验证数据库分析密码"
					type="submit"
					variant="primary"
				>
					进入
				</Button>
			</form>
		</div>
	);
}

function DbAnalyzeLayout() {
	const queryClient = useQueryClient();
	const [authState, setAuthState] = useState<AuthState>("checking");
	const [authMessage, setAuthMessage] = useState("");
	const matchRoute = useMatchRoute();
	const isExplore = Boolean(matchRoute({ to: "/dbanalyze/explore" }));
	const isManage = Boolean(matchRoute({ to: "/dbanalyze/manage" }));

	useEffect(() => {
		let active = true;
		async function restoreSession() {
			if (!getDbAnalyzeToken()) {
				setAuthState("locked");
				return;
			}
			try {
				const response = await api["db-analyze"].auth.session.$get();
				if (!response.ok) clearDbAnalyzeToken();
				if (active) setAuthState(response.ok ? "unlocked" : "locked");
			} catch {
				if (active) {
					setAuthMessage("暂时无法连接服务，请稍后重试");
					setAuthState("locked");
				}
			}
		}
		function handleExpired() {
			setAuthMessage("登录已失效，请重新输入密码");
			setAuthState("locked");
			queryClient.removeQueries({ queryKey: ["db-analyze"] });
			useDbAnalyzeExploreStore.getState().reset();
		}
		void restoreSession();
		window.addEventListener(DB_ANALYZE_AUTH_EXPIRED_EVENT, handleExpired);
		return () => {
			active = false;
			window.removeEventListener(DB_ANALYZE_AUTH_EXPIRED_EVENT, handleExpired);
		};
	}, [queryClient]);

	if (authState === "checking") {
		return (
			<div className={styles.authLoading}>
				<Spinner size="medium" />
				<span>正在验证访问权限…</span>
			</div>
		);
	}
	if (authState === "locked") {
		return (
			<DbAnalyzeLogin
				message={authMessage}
				onAuthenticated={() => {
					setAuthMessage("");
					setAuthState("unlocked");
				}}
			/>
		);
	}

	return (
		<div>
			<div className={styles.titleRow}>
				<h2>数据库分析</h2>
				<Button
					size="small"
					onClick={() => {
						clearDbAnalyzeToken();
						queryClient.removeQueries({ queryKey: ["db-analyze"] });
						useDbAnalyzeExploreStore.getState().reset();
						setAuthMessage("");
						setAuthState("locked");
					}}
				>
					退出
				</Button>
			</div>
			{authMessage ? <p className={styles.authError}>{authMessage}</p> : null}
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
