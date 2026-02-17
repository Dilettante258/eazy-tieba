import { useRef, useMemo, useDeferredValue, useEffect, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Label } from "@primer/react";
import { LinkExternalIcon } from "@primer/octicons-react";
import type { UserPost } from "../../lib/user-post.ts";
import styles from "./PostAnalysis.module.css";

const dateFormat = new Intl.DateTimeFormat("zh-CN", {
	dateStyle: "short",
	timeStyle: "short",
});

/** 在容器内所有文本节点中高亮搜索词（CSS Custom Highlight API） */
function applySearchHighlight(container: HTMLElement | null, search: string) {
	if (!("highlights" in CSS)) return;
	CSS.highlights.delete("search-highlight");
	if (!container || !search) return;

	const highlight = new Highlight();
	const walker = document.createTreeWalker(
		container,
		NodeFilter.SHOW_TEXT,
	);
	let node: Text | null;
	while ((node = walker.nextNode() as Text | null)) {
		const text = node.textContent ?? "";
		let idx = text.indexOf(search);
		while (idx !== -1) {
			const range = new Range();
			range.setStart(node, idx);
			range.setEnd(node, idx + search.length);
			highlight.add(range);
			idx = text.indexOf(search, idx + search.length);
		}
	}

	if (highlight.size > 0) {
		CSS.highlights.set("search-highlight", highlight);
	}
}

interface PostListProps {
	data: UserPost[];
	search: string;
	asc: boolean;
}

export function PostListVirtualized({ data, search, asc }: PostListProps) {
	const parentRef = useRef<HTMLDivElement>(null);

	// 延迟搜索值：输入框保持即时响应，过滤和高亮以低优先级更新
	const deferredSearch = useDeferredValue(search);

	const filteredData = useMemo(() => {
		const list =
			deferredSearch === ""
				? data
				: data.filter(
						(item) =>
							item.content.includes(deferredSearch) ||
							item.title.includes(deferredSearch),
					);
		return asc ? list : [...list].reverse();
	}, [data, deferredSearch, asc]);

	const rowVirtualizer = useVirtualizer({
		count: filteredData.length,
		getScrollElement: () => parentRef.current,
		estimateSize: () => 120,
		overscan: 5,
	});

	// 虚拟列表中的可见项
	const virtualItems = rowVirtualizer.getVirtualItems();

	// 搜索词变化或可见项变化时重新高亮
	const runHighlight = useCallback(() => {
		applySearchHighlight(parentRef.current, deferredSearch);
	}, [deferredSearch]);

	// 渲染后高亮 + 清理
	useEffect(() => {
		runHighlight();
		return () => {
			if ("highlights" in CSS) CSS.highlights.delete("search-highlight");
		};
	}, [runHighlight, virtualItems]);

	// 滚动时重新高亮（虚拟化项在滚动中会挂载/卸载）
	useEffect(() => {
		const el = parentRef.current;
		if (!el || !deferredSearch) return;
		el.addEventListener("scroll", runHighlight);
		return () => el.removeEventListener("scroll", runHighlight);
	}, [deferredSearch, runHighlight]);

	return (
		<div ref={parentRef} className={styles.virtualList}>
			<div
				style={{
					height: `${rowVirtualizer.getTotalSize()}px`,
					width: "100%",
					position: "relative",
				}}
			>
				{virtualItems.map((virtualRow) => {
					const post = filteredData[virtualRow.index];
					const forumUrl = `https://tieba.baidu.com/f?kw=${encodeURIComponent(post.forumName)}`;
					const threadUrl = `https://tieba.baidu.com/p/${post.threadId}?fid=${post.forumId}&pid=${post.cid}&cid=${post.cid}#${post.cid}`;

					return (
						<div
							key={virtualRow.index}
							className={
								virtualRow.index % 2
									? styles.listItemOdd
									: styles.listItemEven
							}
							style={{
								position: "absolute",
								top: 0,
								left: 0,
								width: "100%",
								height: `${virtualRow.size}px`,
								transform: `translateY(${virtualRow.start}px)`,
							}}
						>
							<p className={styles.postInfo}>
								在
								<a
									href={forumUrl}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.forumLink}
								>
									{post.forumName}吧
								</a>
								回复
								<a
									href={`https://tieba.baidu.com/p/${post.threadId}`}
									target="_blank"
									rel="noopener noreferrer"
									className={styles.threadLink}
								>
									{post.title}
								</a>
								：
							</p>
							<p className={styles.postContentText}>
								{post.replyTo && (
									<>
										回复
										<span className={styles.replyTarget}>
											{post.replyTo}
										</span>
										：
									</>
								)}
								{post.content}
							</p>
							<div className={styles.postItemFooter}>
								<div className={styles.postItemTags}>
									{post.affiliated && (
										<Label variant="attention" size="small">
											楼中楼
										</Label>
									)}
								</div>
								<div className={styles.postItemMeta}>
									<a
										href={threadUrl}
										target="_blank"
										rel="noopener noreferrer"
										className={styles.postItemLink}
									>
										<LinkExternalIcon size={12} />
										链接
									</a>
									<span className={styles.postItemTime}>
										{dateFormat.format(new Date(post.createTime * 1000))}
									</span>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
