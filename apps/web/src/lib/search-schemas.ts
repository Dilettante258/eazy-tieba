import { z } from "zod";

/** 通用用户查询搜索参数 */
export const userSearchSchema = z.object({
	method: z.enum(["un", "id", "uid"]).catch("un"),
	id: z.string().catch(""),
});

/** 用户帖子页面搜索参数（增加分页） */
export const userPostSearchSchema = userSearchSchema.extend({
	page: z.number().int().positive().catch(1),
});

export type UserSearch = z.infer<typeof userSearchSchema>;
export type UserPostSearch = z.infer<typeof userPostSearchSchema>;
