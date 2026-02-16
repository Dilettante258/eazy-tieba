import {
	boolean,
	char,
	date,
	integer,
	pgTable,
	smallint,
	text,
	timestamp,
	varchar,
} from "drizzle-orm/pg-core";

export const userPostTable = pgTable("userPost", {
	uid: char({ length: 10 }).notNull(),
	forumId: integer().notNull(),
	forumName: varchar({ length: 32 }).notNull(),
	title: varchar({ length: 48 }).notNull(),
	threadId: varchar({ length: 12 }).notNull(),
	postId: varchar({ length: 12 }).primaryKey().notNull(),
	createTime: timestamp({ mode: "string" }).notNull(),
	affiliated: boolean().notNull(),
	content: text().notNull(),
	replyTo: varchar({ length: 32 }),
	pgRecordTime: date().defaultNow().notNull(),
});

export const postTable = pgTable("post", {
	forumId: integer().notNull(),
	postId: varchar({ length: 12 }).notNull(),
	id: varchar({ length: 12 }).primaryKey().notNull(),
	floor: integer().notNull(),
	time: timestamp().notNull(),
	content: text(),
	subPostNumber: smallint(),
	authorId: varchar({ length: 14 }).notNull(),
	ipAddress: varchar({ length: 8 }),
	agreeNum: smallint(),
	disagreeNum: smallint(),
	pgRecordTime: date().defaultNow().notNull(),
});

export const subPostTable = pgTable("subPost", {
	postId: varchar({ length: 12 }).notNull(),
	id: varchar({ length: 12 }).primaryKey().notNull(),
	time: timestamp().notNull(),
	content: text().notNull(),
	authorId: varchar({ length: 14 }).notNull(),
	otherId: varchar({ length: 14 }),
	otherName: varchar({ length: 16 }),
	pgRecordTime: date().defaultNow().notNull(),
});

export const forumKeyTable = pgTable("forumKey", {
	id: integer().primaryKey().notNull(),
	name: varchar({ length: 32 }).notNull(),
});

export const forumMemberTable = pgTable("forumMember", {
	forumId: integer().notNull(),
	portrait: varchar({ length: 36 }).notNull(),
	username: varchar({ length: 32 }),
	nickname: varchar({ length: 32 }).notNull(),
});
