import { registerPictogramChart, VChart } from "@visactor/vchart";

// 注册象形图图表类型（1.x 版本）
registerPictogramChart();

let registered = false;

/** 动态加载并注册中国地图 SVG（首次调用时加载） */
export async function ensureChinaMapRegistered() {
	if (registered) return;
	const { default: svgText } = await import("./chinamap.svg?raw");
	VChart.registerSVG("chinamap", svgText);
	registered = true;
}

/** 大陆 31 个省级行政区（与贴吧 IP 属地返回的简称一致） */
export const MAINLAND_PROVINCES = new Set([
	"北京",
	"天津",
	"河北",
	"山西",
	"内蒙古",
	"辽宁",
	"吉林",
	"黑龙江",
	"上海",
	"江苏",
	"浙江",
	"安徽",
	"福建",
	"江西",
	"山东",
	"河南",
	"湖北",
	"湖南",
	"广东",
	"广西",
	"海南",
	"重庆",
	"四川",
	"贵州",
	"云南",
	"西藏",
	"陕西",
	"甘肃",
	"青海",
	"宁夏",
	"新疆",
]);

/** 港澳台名称（贴吧返回 "中国香港" 等） */
export const HMT_NAMES = new Set(["中国香港", "中国台湾", "中国澳门"]);
