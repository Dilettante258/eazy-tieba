import {
	ArrowRightIcon,
	ArrowUpRightIcon,
	SparkleIcon,
} from "@primer/octicons-react";
import { Link } from "@tanstack/react-router";
import styles from "./Brand.module.css";

export function Brand() {
	return (
		<div className={styles.section}>
			<Link className={styles.news} to="/profile">
				<div className={styles.newsTip}>
					<SparkleIcon size={16} />
					了解最近更新！
					<ArrowRightIcon size={16} />
				</div>
			</Link>

			<div className={styles.textContainer}>
				<span>eztb</span>
				<span>贴吧</span>
				<span>工具箱</span>
				<br />
				<span>为</span>
				<span>更</span>
				<span>方便</span>
				<span>调查</span>
				<span>成分</span>
				<span>而生</span>
			</div>

			<div>
				<p className={styles.description}>
					现代化UI，便捷的操作，丰富的功能，为你带来最好的体验
				</p>
			</div>

			<div className={styles.btnContainer}>
				<Link className={styles.btnSolid} to="/profile">
					关于本项目
					<ArrowRightIcon size={16} />
				</Link>
				<a
					className={styles.btnBordered}
					href="https://github.com/Dilettante258/tieba-toolbox"
					target="_blank"
					rel="noopener noreferrer"
				>
					GitHub
					<ArrowUpRightIcon size={16} />
				</a>
			</div>
		</div>
	);
}
