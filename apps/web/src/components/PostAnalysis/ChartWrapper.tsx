import {
	useRef,
	useState,
	useCallback,
	forwardRef,
	useImperativeHandle,
} from "react";
import { ActionBar, Dialog, Button, Link } from "@primer/react";
import {
	DownloadIcon,
	PencilIcon,
	ListUnorderedIcon,
} from "@primer/octicons-react";
import { VChart } from "@visactor/react-vchart";
import type { IVChart, ISpec } from "@visactor/vchart";
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

export const ChartWrapper = forwardRef<ChartWrapperHandle, ChartWrapperProps>(
	function ChartWrapper({ spec, style, onClick }, ref) {
		const chartRef = useRef<IVChart>(null);
		const [editOpen, setEditOpen] = useState(false);
		const [editText, setEditText] = useState("");

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

		return (
			<>
				<VChart ref={chartRef} spec={spec} style={style} onClick={onClick} />
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
