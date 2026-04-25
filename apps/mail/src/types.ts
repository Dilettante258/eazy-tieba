import { z } from "zod";

export const exportMailTargetSummarySchema = z.object({
	forumName: z.string().min(1),
	status: z.string().min(1),
	pagesScanned: z.number().int().nonnegative(),
	threadsFound: z.number().int().nonnegative(),
	threadsStored: z.number().int().nonnegative(),
});

export const exportMailEventSchema = z.object({
	jobId: z.string().uuid(),
	jobKey: z.string().min(1),
	jobName: z.string().min(1),
	eventType: z.enum(["started", "progress", "completed", "failed"]),
	status: z.string().min(1),
	recipients: z.array(z.string().email()).min(1),
	summary: z.object({
		forumsTotal: z.number().int().nonnegative(),
		forumsDone: z.number().int().nonnegative(),
		threadsFound: z.number().int().nonnegative(),
		threadsStored: z.number().int().nonnegative(),
		postsStored: z.number().int().nonnegative(),
		subPostsStored: z.number().int().nonnegative(),
	}),
	targets: z.array(exportMailTargetSummarySchema).optional(),
	errorMessage: z.string().min(1).optional(),
	occurredAt: z.string().datetime(),
});

export type ExportMailEvent = z.infer<typeof exportMailEventSchema>;
