import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const parents = sqliteTable(
  "parents",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    passwordSalt: text("password_salt").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (table) => [uniqueIndex("parents_username_idx").on(table.username)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    parentId: text("parent_id").notNull(),
    expiresAt: integer("expires_at").notNull(),
    createdAt: integer("created_at").notNull(),
  },
);

export const children = sqliteTable(
  "children",
  {
    id: text("id").primaryKey(),
    parentId: text("parent_id").notNull(),
    profileJson: text("profile_json").notNull(),
    cycle: integer("cycle").notNull().default(1),
    calendarToken: text("calendar_token").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("children_calendar_token_idx").on(table.calendarToken),
  ],
);

export const checkins = sqliteTable(
  "checkins",
  {
    childId: text("child_id").notNull(),
    cycle: integer("cycle").notNull(),
    feedbackJson: text("feedback_json").notNull(),
    weeklyNote: text("weekly_note").notNull().default(""),
    childMood: text("child_mood").notNull().default("轻松"),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("checkins_child_cycle_idx").on(table.childId, table.cycle),
  ],
);
