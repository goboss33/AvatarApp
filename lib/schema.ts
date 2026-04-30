import { pgTable, varchar, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email").notNull().unique(),
  password: varchar("password").notNull(),
  name: varchar("name"),
  createdAt: timestamp("created_at").notNull(),
});

export const settings = pgTable("settings", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  heygenApiKey: varchar("heygen_api_key"),
  updatedAt: timestamp("updated_at").notNull(),
});

export const generations = pgTable("generations", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  mode: varchar("mode").notNull(),
  avatarId: varchar("avatar_id"),
  audioAssetId: varchar("audio_asset_id"),
  videoId: varchar("video_id"),
  videoUrl: varchar("video_url"),
  status: varchar("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull(),
  completedAt: timestamp("completed_at"),
});
