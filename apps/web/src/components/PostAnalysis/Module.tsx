import type { HTMLAttributes, PropsWithChildren } from "react";
import styles from "./PostAnalysis.module.css";

/** 可复用的卡片容器，支持标题、描述和可选的隐藏功能 */
function Module({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={`${styles.module} ${className ?? ""}`}>{children}</div>
	);
}

function Title(props: PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>) {
	return (
		<h3 className={styles.moduleTitle} {...props}>
			{props.children}
		</h3>
	);
}

function Description(
	props: PropsWithChildren<HTMLAttributes<HTMLParagraphElement>>,
) {
	return (
		<p className={styles.moduleDescription} {...props}>
			{props.children}
		</p>
	);
}

Module.Title = Title;
Module.Description = Description;

export { Module };
