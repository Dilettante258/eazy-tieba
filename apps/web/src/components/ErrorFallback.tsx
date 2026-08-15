import { AlertIcon, SyncIcon } from "@primer/octicons-react";
import { Button } from "@primer/react";
import styles from "./ErrorFallback.module.css";

interface ErrorFallbackProps {
	error: Error;
	resetError: () => void;
}

export function ErrorFallback({ error, resetError }: ErrorFallbackProps) {
	return (
		<div className={styles.container}>
			<span className={styles.icon}>
				<AlertIcon size={40} />
			</span>
			<h2 className={styles.title}>页面遇到了问题</h2>
			<p className={styles.desc}>
				发生了意外错误，错误信息已自动上报。请尝试重试或刷新页面。
			</p>
			{error.message && (
				<pre className={styles.errorMessage}>{error.message}</pre>
			)}
			<div className={styles.actions}>
				<Button leadingVisual={SyncIcon} onClick={resetError}>
					重试
				</Button>
				<Button onClick={() => window.location.reload()}>刷新页面</Button>
			</div>
		</div>
	);
}
