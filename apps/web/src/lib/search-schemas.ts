import { z } from "zod";

/** 通用用户查询搜索参数 */
export const userSearchSchema = z.object({
	method: z.enum(["uid", "un", "id"]).catch("uid"),
	id: z.string().catch(""),
});

/** 用户帖子页面搜索参数（增加分页） */
export const userPostSearchSchema = userSearchSchema.extend({
	page: z.number().int().positive().catch(1),
});

/** 贴吧帖子分析搜索参数 */
export const forumPostSearchSchema = z.object({
	fname: z.string().catch(""),
	sort: z.number().int().catch(1),
	count: z.number().int().positive().catch(50),
	depth: z.enum(["first", "all"]).catch("first"),
});

/** 发言搜索页面搜索参数（仅 URL 基本参数，搜索条件为表单局部状态） */
export const postSearchSchema = z.object({
	fname: z.string().catch(""),
	sort: z.number().int().catch(1),
	count: z.number().int().positive().catch(100),
	depth: z.enum(["first", "all"]).catch("first"),
});

export type UserSearch = z.infer<typeof userSearchSchema>;
export type UserPostSearch = z.infer<typeof userPostSearchSchema>;
export type ForumPostSearch = z.infer<typeof forumPostSearchSchema>;
export type PostSearch = z.infer<typeof postSearchSchema>;
