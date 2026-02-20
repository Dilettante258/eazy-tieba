import { VChart } from "@visactor/vchart/esm/core";
import { registerBarChart } from "@visactor/vchart/esm/chart/bar";
import { registerCommonChart } from "@visactor/vchart/esm/chart/common";
import { registerMosaicChart } from "@visactor/vchart/esm/chart/mosaic";
import { registerPieChart } from "@visactor/vchart/esm/chart/pie";
import { registerPictogramChart } from "@visactor/vchart/esm/chart/pictogram";
import { registerSankeyChart } from "@visactor/vchart/esm/chart/sankey";
import { registerScatterChart } from "@visactor/vchart/esm/chart/scatter";
import { registerWordCloudChart } from "@visactor/vchart/esm/chart/word-cloud";
import {
	registerCartesianBandAxis,
	registerCartesianLinearAxis,
} from "@visactor/vchart/esm/component/axis/cartesian";
import { registerCartesianCrossHair } from "@visactor/vchart/esm/component/crosshair/cartesian";
import { registerLabel } from "@visactor/vchart/esm/component/label";
import { registerContinuousLegend } from "@visactor/vchart/esm/component/legend/continuous";
import { registerDiscreteLegend } from "@visactor/vchart/esm/component/legend/discrete";
import { registerTooltip } from "@visactor/vchart/esm/component/tooltip";
import { registerBrowserEnv } from "@visactor/vchart/esm/env/env";
import { registerCanvasTooltipHandler } from "@visactor/vchart/esm/plugin/components/tooltip-handler/canvas-tooltip-handler";

let initialized = false;

export function ensureVChartRuntimeRegistered() {
	if (initialized) return;

	VChart.useRegisters([
		registerBrowserEnv,
		registerCanvasTooltipHandler,
		registerBarChart,
		registerCommonChart,
		registerMosaicChart,
		registerPieChart,
		registerPictogramChart,
		registerSankeyChart,
		registerScatterChart,
		registerWordCloudChart,
		registerCartesianBandAxis,
		registerCartesianLinearAxis,
		registerCartesianCrossHair,
		registerLabel,
		registerContinuousLegend,
		registerDiscreteLegend,
		registerTooltip,
	]);

	initialized = true;
}

export { VChart };
export type { ISpec, IVChart } from "@visactor/vchart/esm/core";
