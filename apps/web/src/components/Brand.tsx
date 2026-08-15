import {
	ArrowRightIcon,
	ArrowUpRightIcon,
	CheckCircleIcon,
	SparkleIcon,
} from "@primer/octicons-react";
import { Link } from "@tanstack/react-router";
import styles from "./Brand.module.css";

export function Brand() {
	return (
		<div className={styles.section}>
			<Link className={styles.news} to="/about">
				<div className={styles.newsTip}>
					<SparkleIcon size={16} />
					了解最近更新！
					<ArrowRightIcon size={16} />
				</div>
			</Link>

			<h1 className={styles.textContainer}>
				<span>eztb</span>
				<span>贴吧</span>
				<span>工具箱</span>
				<br />
				<span className={styles.accent}>查询{" · "}</span>
				<span className={styles.accent}>分析{" · "}</span>
				<span className={styles.accent}>导出</span>
				<span>,</span>
				<span>一站</span>
				<span>完成</span>
			</h1>

			<div>
				<p className={styles.description}>
					便捷操作、现代化界面、丰富功能，让查询与分析一步到位。
				</p>
			</div>

			<div className={styles.btnContainer}>
				<Link className={styles.btnSolid} to="/about" viewTransition>
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

			<ul className={styles.trustRow}>
				<li>
					<CheckCircleIcon size={14} />
					免费开源
				</li>
				<li>
					<CheckCircleIcon size={14} />
					可安装为应用
				</li>
				<li>
					<CheckCircleIcon size={14} />
					数据一键导出
				</li>
			</ul>
		</div>
	);
}
