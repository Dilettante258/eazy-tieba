import styles from "./DbAnalyze.module.css";

export function StatCard({ label, value }: { label: string; value: string }) {
	return (
		<div className={styles.statCard}>
			<span className={styles.statValue}>{value}</span>
			<span className={styles.statLabel}>{label}</span>
		</div>
	);
}
