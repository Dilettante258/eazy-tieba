export interface AnalysisForum {
	id: string;
	name: string;
	firstClass: string;
	secondClass: string;
	crossUserCount: number;
	typeIds: string[];
}

export interface AnalysisForumType {
	id: string;
	name: string;
	source: "official" | "custom";
	level: "first" | "second" | "custom";
	parentId: string | null;
	forumIds: string[];
	updatedAt: string | null;
}

export interface AnalysisCatalog {
	forums: AnalysisForum[];
	types: AnalysisForumType[];
}

export interface CrossTypeUser {
	authorId: string;
	name: string | null;
	nameShow: string | null;
	typeIds: string[];
	typeCount: number;
	forumIds: string[];
	forumCount: number;
	activityCount: number;
	matchCount: number;
	previews: string[];
	latestMatchAt: string | null;
}

export interface AnalysisRequest {
	typeIds: string[];
	forumIds: string[];
	keywords: string[];
	matchMode: "any" | "all";
}

export interface AnalysisUtterance {
	id: string;
	kind: "thread" | "post" | "subpost";
	forumId: string;
	forumName: string | null;
	threadId: string;
	threadTitle: string | null;
	content: string;
	createTime: string | null;
	floor: number;
	agreeNum: number;
}

export async function readJson<T>(response: {
	ok: boolean;
	status: number;
	json: () => Promise<unknown>;
}): Promise<T> {
	const body = await response.json();
	if (!response.ok) {
		const value = body as { error?: unknown; message?: unknown };
		throw new Error(
			String(value.error ?? value.message ?? `请求失败 (${response.status})`),
		);
	}
	return body as T;
}
