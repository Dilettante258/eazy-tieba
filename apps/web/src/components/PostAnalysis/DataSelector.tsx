import { useState, useMemo } from "react";
import { Button, FormControl, SelectPanel } from "@primer/react";
import type { SelectPanelItemInput } from "@primer/react";
import { TriangleDownIcon } from "@primer/octicons-react";
import { useUPSelectorStore } from "../../lib/store.ts";
import type { UPSelectorStore } from "../../lib/store.ts";
import styles from "./PostAnalysis.module.css";

interface DataSelectorProps {
	yearRange: number[];
	forumDistribution: Array<{ name: string; value: number }>;
	setSelectedYear: UPSelectorStore["setSelectedYear"];
	setSelectedForums: UPSelectorStore["setSelectedForums"];
	clearForumFilter: UPSelectorStore["clearForumFilter"];
}

export function DataSelector({
	yearRange,
	forumDistribution,
	setSelectedYear,
	setSelectedForums,
	clearForumFilter,
}: DataSelectorProps) {
	const selectedYear = useUPSelectorStore((s) => s.selectedYear);
	const selectedForums = useUPSelectorStore((s) => s.selectedForums);

	const [yearOpen, setYearOpen] = useState(false);
	const [yearFilter, setYearFilter] = useState("");
	const [forumOpen, setForumOpen] = useState(false);
	const [forumFilter, setForumFilter] = useState("");

	// ── 年份选项 ──────
	const yearItems = useMemo(
		() => [
			{ id: "ALL", text: "所有年份" },
			...yearRange.map((y) => ({ id: String(y), text: `${y}年` })),
		],
		[yearRange],
	);

	const filteredYearItems = useMemo(
		() =>
			yearFilter
				? yearItems.filter((item) => item.text.includes(yearFilter))
				: yearItems,
		[yearItems, yearFilter],
	);

	const selectedYearItem = useMemo(
		() => yearItems.find((item) => item.id === String(selectedYear)),
		[yearItems, selectedYear],
	);

	// ── 贴吧选项（多选） ──────
	const forumItems = useMemo(
		() =>
			forumDistribution.map((f) => ({
				id: f.name,
				text: `${f.name}吧`,
				description: `${f.value} 帖`,
				descriptionVariant: "inline" as const,
			})),
		[forumDistribution],
	);

	const filteredForumItems = useMemo(
		() =>
			forumFilter
				? forumItems.filter((item) => item.text.includes(forumFilter))
				: forumItems,
		[forumItems, forumFilter],
	);

	const selectedForumItems = useMemo(
		() =>
			forumItems.filter((item) => selectedForums.includes(item.id as string)),
		[forumItems, selectedForums],
	);

	// 贴吧按钮文字
	const forumAnchorText =
		selectedForums.length === 0
			? "选择贴吧"
			: selectedForums.length === 1
				? `${selectedForums[0]}吧`
				: `${selectedForums.length} 个吧`;

	return (
		<div className={styles.dataSelector}>
			<FormControl>
				<FormControl.Label>年份筛选</FormControl.Label>
				<SelectPanel
					title="选择年份"
					placeholder="搜索年份…"
					renderAnchor={({ children, ...anchorProps }) => (
						<Button
							{...anchorProps}
							size="small"
							trailingAction={TriangleDownIcon}
						>
							{children ?? selectedYearItem?.text ?? "选择年份"}
						</Button>
					)}
					open={yearOpen}
					onOpenChange={(open) => {
						setYearOpen(open);
						if (!open) setYearFilter("");
					}}
					items={filteredYearItems}
					selected={selectedYearItem}
					onSelectedChange={(selected: SelectPanelItemInput | undefined) => {
						if (!selected) return;
						setSelectedYear(
							selected.id === "ALL" ? "ALL" : Number(selected.id),
						);
						setYearOpen(false);
					}}
					onFilterChange={(value) => setYearFilter(value)}
				/>
			</FormControl>
			{forumItems.length > 0 && (
				<FormControl>
					<FormControl.Label>贴吧筛选</FormControl.Label>
					<SelectPanel
						title="选择贴吧"
						placeholder="筛选贴吧…"
						renderAnchor={({ children, ...anchorProps }) => (
							<Button
								{...anchorProps}
								size="small"
								trailingAction={TriangleDownIcon}
							>
								{children ?? forumAnchorText}
							</Button>
						)}
						open={forumOpen}
						onOpenChange={(open) => {
							setForumOpen(open);
							if (!open) setForumFilter("");
						}}
						items={filteredForumItems}
						selected={selectedForumItems}
						onSelectedChange={(selected: SelectPanelItemInput[]) => {
							setSelectedForums(selected.map((item) => item.id as string));
						}}
						onFilterChange={(value) => setForumFilter(value)}
						secondaryAction={
							<Button
								size="small"
								block
								onClick={() => {
									clearForumFilter();
									setForumOpen(false);
								}}
							>
								清空选择
							</Button>
						}
					/>
				</FormControl>
			)}
		</div>
	);
}
