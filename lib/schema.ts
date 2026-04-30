import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  heygenApiKey: text("heygen_api_key"),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const generations = sqliteTable("generations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  mode: text("mode").notNull(),
  avatarId: text("avatar_id"),
  audioAssetId: text("audio_asset_id"),
  videoId: text("video_id"),
  videoUrl: text("video_url"),
  status: text("status").notNull().default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});
