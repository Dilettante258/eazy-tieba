import {
	useRef,
	useState,
	useCallback,
	forwardRef,
	useImperativeHandle,
	useEffect,
	useMemo,
} from "react";
import { ActionBar, Dialog, Button, Link } from "@primer/react";
import {
	DownloadIcon,
	PencilIcon,
	ListUnorderedIcon,
} from "@primer/octicons-react";
import type { ISpec, IVChart } from "../../lib/vchart-runtime.ts";
import styles from "./PostAnalysis.module.css";

// ── ChartWrapper handle ──

export interface ChartWrapperHandle {
	/** 导出图表为图片 */
	exportImg: (name?: string) => void;
	/** 打开 Spec 编辑器 */
	openSpecEditor: () => void;
}

interface ChartWrapperProps {
	spec: ISpec;
	style?: React.CSSProperties;
	// biome-ignore lint/suspicious/noExplicitAny: VChart 事件回调参数类型不固定
	onClick?: (e: any) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
	return !!value && typeof value === "object";
}

function hasClickTrigger(trigger: unknown): boolean {
	if (trigger === "click") return true;
	if (!Array.isArray(trigger)) return false;
	return trigger.some((item) => item === "click");
}

function usePreferClickTooltip(): boolean {
	const [preferClickTooltip, setPreferClickTooltip] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const media = window.matchMedia("(hover: none), (pointer: coarse)");
		const update = () => {
			const hasTouchPoints =
				typeof navigator !== "undefined" && navigator.maxTouchPoints > 0;
			setPreferClickTooltip(media.matches || hasTouchPoints);
		};
		update();
		if (typeof media.addEventListener === "function") {
			media.addEventListener("change", update);
			return () => media.removeEventListener("change", update);
		}
		media.addListener(update);
		return () => media.removeListener(update);
	}, []);

	return preferClickTooltip;
}

export const ChartWrapper = forwardRef<ChartWrapperHandle, ChartWrapperProps>(
	function ChartWrapper({ spec, style, onClick }, ref) {
		const chartRef = useRef<IVChart>(null);
		const [editOpen, setEditOpen] = useState(false);
		const [editText, setEditText] = useState("");
		const preferClickTooltip = usePreferClickTooltip();
		const [VChartComponent, setVChartComponent] = useState<
			(typeof import("@visactor/react-vchart/esm/VChartSimple"))["VChartSimple"] | null
		>(null);
		const [VChartConstructor, setVChartConstructor] = useState<
			(typeof import("../../lib/vchart-runtime.ts"))["VChart"] | null
		>(null);

		useEffect(() => {
			let alive = true;

			void Promise.all([
				import("@visactor/react-vchart/esm/VChartSimple"),
				import("../../lib/vchart-runtime.ts"),
			]).then(([reactVChart, runtime]) => {
				runtime.ensureVChartRuntimeRegistered();
				if (!alive) return;
				setVChartComponent(() => reactVChart.VChartSimple);
				setVChartConstructor(() => runtime.VChart);
			});

			return () => {
				alive = false;
			};
		}, []);

		useImperativeHandle(ref, () => ({
			exportImg: (name?: string) => {
				chartRef.current?.exportImg(name);
			},
			openSpecEditor: () => {
				const currentSpec = chartRef.current?.getSpec?.() ?? spec;
				setEditText(JSON.stringify(currentSpec, null, 2));
				setEditOpen(true);
			},
		}));

		// 应用编辑：调用 updateSpec 而非 React 状态
		const handleApply = useCallback(() => {
			try {
				const parsed = JSON.parse(editText);
				chartRef.current?.updateSpec(parsed);
				setEditOpen(false);
			} catch {
				// JSON 解析失败，不关闭
			}
		}, [editText]);
		const resolvedSpec = useMemo<ISpec>(() => {
			if (!preferClickTooltip) return spec;
			const specObject: Record<string, unknown> = isRecord(spec) ? spec : {};
			const tooltipObject = isRecord(specObject.tooltip) ? specObject.tooltip : {};
			if (tooltipObject.visible === false) return spec;
			if (tooltipObject.trigger === "none") return spec;
			if (hasClickTrigger(tooltipObject.trigger)) return spec;
			return {
				...specObject,
				tooltip: {
					...tooltipObject,
					trigger: "click",
					triggerOff: "click",
				},
			} as ISpec;
		}, [preferClickTooltip, spec]);

		if (!VChartComponent || !VChartConstructor) {
			return <div style={style} />;
		}

		return (
			<>
				<VChartComponent
					ref={chartRef}
					vchartConstructor={VChartConstructor}
					spec={resolvedSpec}
					style={style}
					onClick={onClick}
				/>
				{editOpen && (
					<Dialog
						title="编辑图表配置"
						onClose={() => setEditOpen(false)}
						width="xlarge"
					>
						<Dialog.Body>
							<p className={styles.specHint}>
								直接编辑 VChart Spec JSON，点击「应用」实时更新图表。
								<Link
									href="https://www.visactor.io/vchart/option"
									target="_blank"
									rel="noopener noreferrer"
									inline
								>
									查看 VChart 配置文档
								</Link>
							</p>
							<textarea
								className={styles.specEditor}
								value={editText}
								onChange={(e) => setEditText(e.target.value)}
								rows={24}
								spellCheck={false}
							/>
						</Dialog.Body>
						<Dialog.Footer>
							<Button variant="primary" onClick={handleApply}>
								应用
							</Button>
						</Dialog.Footer>
					</Dialog>
				)}
			</>
		);
	},
);

// ── ChartActionBar ──

export interface ChartMenuItem {
	label: string;
	onClick: () => void;
}

interface ChartActionBarProps {
	chartRef: React.RefObject<ChartWrapperHandle | null>;
	/** 导出图片的文件名 */
	name?: string;
	/** 图表模式切换菜单项 */
	menuItems?: ChartMenuItem[];
	/** 菜单按钮的 aria-label */
	menuLabel?: string;
}

/** 图表操作栏，放置在 moduleHeader 中 */
export function ChartActionBar({
	chartRef,
	name,
	menuItems,
	menuLabel = "切换图表类型",
}: ChartActionBarProps) {
	return (
		<ActionBar
			size="small"
			aria-label="图表操作"
			className={styles.chartActionBar}
		>
			{menuItems && menuItems.length > 0 && (
				<ActionBar.Menu
					icon={ListUnorderedIcon}
					aria-label={menuLabel}
					items={menuItems.map((item) => ({
						label: item.label,
						onClick: item.onClick,
					}))}
				/>
			)}
			<ActionBar.IconButton
				icon={DownloadIcon}
				aria-label="保存为图片"
				onClick={() => chartRef.current?.exportImg(name)}
			/>
			<ActionBar.IconButton
				icon={PencilIcon}
				aria-label="编辑配置"
				onClick={() => chartRef.current?.openSpecEditor()}
			/>
		</ActionBar>
	);
}
