import type { UPSelectorStore } from "../../lib/store.ts";
import { useUPSelectorStore } from "../../lib/store.ts";
import styles from "./PostAnalysis.module.css";

export function YearSelector({
	yearRange,
	setSelectedYear,
}: {
	yearRange: number[];
	setSelectedYear: UPSelectorStore["setSelectedYear"];
}) {
	const selectedYear = useUPSelectorStore((state) => state.selectedYear);

	function handleClick(event: React.MouseEvent<HTMLElement>) {
		const target = event.target;
		if (target instanceof HTMLLIElement) {
			setSelectedYear(
				target.innerText === "所有"
					? "ALL"
					: Number.parseInt(target.innerText),
			);
		}
	}

	return (
		<div className={styles.yearSelect}>
			<ul onClickCapture={handleClick} className={styles.yearList}>
				<li
					key="ALL"
					className={styles.yearItem}
					data-selected={selectedYear === "ALL"}
				>
					所有
				</li>
				{yearRange.map((year) => (
					<li
						key={year}
						className={styles.yearItem}
						data-selected={year === selectedYear}
					>
						{year}
					</li>
				))}
			</ul>
		</div>
	);
}
