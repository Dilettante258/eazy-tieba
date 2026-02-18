// ── 用户发帖分析数据处理 ──

// ── 中文分词（词云用） ──

const segmenter = new Intl.Segmenter("zh", { granularity: "word" });

const STOP_WORDS = new Set([
	"的", "了", "是", "在", "我", "有", "和", "就", "不", "人",
	"都", "一", "一个", "上", "也", "很", "到", "说", "要", "去",
	"你", "会", "着", "没有", "看", "好", "自己", "这", "他", "她",
	"吗", "那", "它", "被", "从", "把", "让", "用", "对", "为",
	"这个", "那个", "什么", "怎么", "可以", "没", "能", "但", "而",
	"与", "或", "如", "因为", "所以", "但是", "如果", "虽然", "还是",
	"已经", "还", "又", "再", "才", "只", "啊", "吧", "呢", "嗯",
	"哦", "哈", "哈哈", "真的", "知道", "觉得", "然后", "这样",
]);

/** 对文本分词并累加词频 */
function countWords(text: string, counts: Map<string, number>) {
	for (const { segment, isWordLike } of segmenter.segment(text)) {
		if (!isWordLike) continue;
		const word = segment.trim();
		if (word.length <= 1 || STOP_WORDS.has(word)) continue;
		if (/^\d+$/.test(word)) continue;
		counts.set(word, (counts.get(word) ?? 0) + 1);
	}
}

/** 展平后的用户发帖记录（与 SDK UserPost 对齐） */
export interface UserPost {
	forumId: number;
	forumName: string;
	title: string;
	threadId: string;
	postId: string;
	/** 内容级别的帖子 ID，用于精确定位链接 */
	cid: string;
	/** 发帖时间（unix 秒） */
	createTime: number;
	/** 是否是楼中楼回复 */
	affiliated: boolean;
	/** 回复文本内容 */
	content: string;
	/** 楼中楼中回复的目标 */
	replyTo?: string;
}

/** 将 unix 秒转为 Date */
function toDate(ts: number): Date {
	return new Date(ts * 1000);
}

// ── 数据分析工具类 ──

interface CleanDataOptions {
	/** 累计占比阈值，默认 0.9 */
	threshold?: number;
	/** 最大显示条目数，默认 10 */
	maxItems?: number;
	/** 剩余项的名称，默认 "其他" */
	othersName?: string;
}

export class UserPostClass {
	private upData: UserPost[] = [];
	public readonly dividerMap: Record<string, number>;
	private static dateFormat = new Intl.DateTimeFormat("zh-CN", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	constructor(data: UserPost[]) {
		this.upData = data.sort((a, b) => b.createTime - a.createTime);
		this.dividerMap = this.getDivider();
	}

	get data() {
		return this.upData;
	}

	/** 按年份建立索引映射，用于 O(1) 定位某年数据的起止下标 */
	private getDivider(): Record<string, number> {
		if (this.upData.length === 0) return {};
		const earliestYear = toDate(
			this.upData[this.upData.length - 1].createTime,
		).getFullYear();
		const nowYear = new Date().getFullYear();
		const yearList = Array.from(
			{ length: nowYear - earliestYear + 1 },
			(_, i) => i + earliestYear,
		).reverse();

		const entries: [string, number][] = [[String(yearList[0]), 0]];
		let lastIdx = 0;

		for (const year of yearList.slice(0, -1)) {
			let count = lastIdx;
			for (const post of this.upData.slice(lastIdx)) {
				if (toDate(post.createTime).getFullYear() !== year) {
					entries.push([String(year - 1), count]);
					lastIdx = count;
					break;
				}
				count += 1;
			}
		}

		return Object.fromEntries(entries);
	}

	/** 获取指定年份的帖子列表 */
	public getPostListFromYear(year: number | "ALL"): UserPost[] {
		if (year === "ALL") return this.upData;
		const start = this.dividerMap[String(year)];
		if (start === undefined) return [];
		const end = this.dividerMap[String(year - 1)] ?? this.upData.length;
		return this.upData.slice(start, end);
	}

	/** 获取指定日期的帖子列表 */
	public getPostListFromDay(
		date: ConstructorParameters<typeof Date>[0],
	): UserPost[] {
		const time = new Date(date);
		const postList = this.getPostListFromYear(time.getFullYear());
		const result: UserPost[] = [];
		for (const post of postList) {
			const postTime = toDate(post.createTime);
			if (
				postTime.getMonth() === time.getMonth() &&
				postTime.getDate() === time.getDate()
			) {
				result.push(post);
			} else if (postTime.getMonth() < time.getMonth()) {
				break; // 倒序排列，后面不会再有匹配
			}
		}
		return result;
	}

	/** 转换为热力图数据 */
	public postList2HeatMap(
		year: number | "ALL",
	): Array<{ date: string; count: number; level: number }> {
		const temp: Record<string, number> = {};
		const postList =
			year === "ALL" ? this.upData : this.getPostListFromYear(year);
		for (const post of postList) {
			const postDate = UserPostClass.dateFormat
				.format(toDate(post.createTime))
				.replaceAll("/", "-");
			temp[postDate] = (temp[postDate] ?? 0) + 1;
		}

		const result: Array<{ date: string; count: number; level: number }> = [];
		for (const [date, count] of Object.entries(temp)) {
			let level = 0;
			if (count >= 8) level = 4;
			else if (count >= 5) level = 3;
			else if (count >= 3) level = 2;
			else if (count >= 1) level = 1;
			result.push({ date, count, level });
		}

		// 确保单年模式下有完整的日期范围
		if (year !== "ALL") {
			if (!(`${year}-01-01` in temp))
				result.unshift({ date: `${year}-01-01`, count: 0, level: 0 });
			if (!(`${year}-12-31` in temp))
				result.push({ date: `${year}-12-31`, count: 0, level: 0 });
		}

		return result.sort(
			(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
		);
	}

	/** 获取贴吧分布数据（饼图） */
	public getForumDistribution(
		year: number | "ALL",
		cleanData?: CleanDataOptions,
	): Array<{ name: string; value: number }> {
		const temp: Record<string, number> = {};
		const postList =
			year === "ALL" ? this.upData : this.getPostListFromYear(year);
		for (const post of postList) {
			temp[post.forumName] = (temp[post.forumName] ?? 0) + 1;
		}

		let result = Object.entries(temp)
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value);

		if (cleanData) {
			const {
				threshold = 0.9,
				maxItems = 10,
				othersName = "其他",
			} = cleanData;
			const total = result.reduce((sum, item) => sum + item.value, 0);
			let currentSum = 0;
			const filtered: typeof result = [];
			let othersValue = 0;

			for (let i = 0; i < result.length; i++) {
				if (i < maxItems && currentSum / total < threshold) {
					filtered.push(result[i]);
					currentSum += result[i].value;
				} else {
					othersValue += result[i].value;
				}
			}
			if (othersValue > 0) {
				filtered.push({ name: othersName, value: othersValue });
			}
			result = filtered;
		}

		return result;
	}

	/** 获取发帖时间分布（散点图） */
	public getTimeDistribution(
		year: number | "ALL",
	): Array<{ date: number; hour: number; forumName: string }> {
		const postList =
			year === "ALL" ? this.upData : this.getPostListFromYear(year);
		const currentYear = new Date().getFullYear();
		return postList.map((post) => {
			const postTime = toDate(post.createTime);
			// 统一归到当前年以便在同一轴上显示
			postTime.setFullYear(currentYear);
			return {
				date: postTime.getTime(),
				hour: postTime.getHours(),
				forumName: post.forumName,
			};
		});
	}

	/** 获取桑基图数据（年份→贴吧） */
	public getSankeyData(cleanData?: CleanDataOptions): {
		nodes: Array<{ name: string }>;
		links: Array<{ source: string; target: string; value: number }>;
	} {
		const yearForumMap = new Map<string, Map<string, number>>();
		const yearSet = new Set<string>();
		const forumSet = new Set<string>();

		for (const post of this.upData) {
			const year = toDate(post.createTime).getFullYear().toString();
			yearSet.add(year);
			forumSet.add(post.forumName);
			if (!yearForumMap.has(year)) yearForumMap.set(year, new Map());
			const forumMap = yearForumMap.get(year)!;
			forumMap.set(post.forumName, (forumMap.get(post.forumName) ?? 0) + 1);
		}

		const nodes = [
			...Array.from(yearSet).map((name) => ({ name })),
			...Array.from(forumSet).map((name) => ({ name })),
		];
		const links: Array<{ source: string; target: string; value: number }> = [];
		for (const [year, forumMap] of yearForumMap) {
			for (const [forum, count] of forumMap) {
				links.push({ source: year, target: forum, value: count });
			}
		}

		if (!cleanData) return { nodes, links };

		// 数据清洗：只保留占比高的贴吧
		const {
			threshold = 0.9,
			maxItems = 10,
			othersName = "其他",
		} = cleanData;
		const forumTotalMap = new Map<string, number>();
		for (const link of links) {
			forumTotalMap.set(
				link.target,
				(forumTotalMap.get(link.target) ?? 0) + link.value,
			);
		}

		const total = this.upData.length;
		const sortedForums = Array.from(forumTotalMap.entries()).sort(
			(a, b) => b[1] - a[1],
		);
		const keptForums = new Set<string>();
		let currentSum = 0;
		for (let i = 0; i < sortedForums.length; i++) {
			if (i < maxItems && currentSum / total < threshold) {
				keptForums.add(sortedForums[i][0]);
				currentSum += sortedForums[i][1];
			}
		}

		const filteredLinks: typeof links = [];
		const othersMap = new Map<string, number>();
		for (const link of links) {
			if (keptForums.has(link.target)) {
				if (link.value > 0) filteredLinks.push(link);
			} else {
				const key = link.source;
				othersMap.set(key, (othersMap.get(key) ?? 0) + link.value);
			}
		}

		if (othersMap.size > 0) {
			for (const [source, value] of othersMap) {
				if (value > 0) {
					filteredLinks.push({ source, target: othersName, value });
				}
			}
		}

		const usedNodes = new Set<string>();
		for (const link of filteredLinks) {
			usedNodes.add(link.source);
			usedNodes.add(link.target);
		}
		// 添加 "其他" 节点（如果有）
		if (othersMap.size > 0) usedNodes.add(othersName);
		const filteredNodes = [
			...nodes.filter((n) => usedNodes.has(n.name)),
			...(othersMap.size > 0 ? [{ name: othersName }] : []),
		];

		return {
			nodes: filteredNodes.filter(
				(n, i, arr) => arr.findIndex((x) => x.name === n.name) === i,
			),
			links: filteredLinks,
		};
	}

	/** 获取词云数据（对帖子标题 + 回复内容分词统计） */
	public getWordCloud(
		year: number | "ALL",
		maxWords = 400,
	): Array<{ name: string; value: number }> {
		const postList =
			year === "ALL" ? this.upData : this.getPostListFromYear(year);
		const counts = new Map<string, number>();
		for (const post of postList) {
			if (post.title) countWords(post.title, counts);
			if (post.content) countWords(post.content, counts);
		}
		return [...counts.entries()]
			.map(([name, value]) => ({ name, value }))
			.sort((a, b) => b.value - a.value)
			.slice(0, maxWords);
	}
}
