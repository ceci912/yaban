CREATE TABLE `checkins` (
	`child_id` text NOT NULL,
	`cycle` integer NOT NULL,
	`feedback_json` text NOT NULL,
	`weekly_note` text DEFAULT '' NOT NULL,
	`child_mood` text DEFAULT '轻松' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `checkins_child_cycle_idx` ON `checkins` (`child_id`,`cycle`);--> statement-breakpoint
CREATE TABLE `children` (
	`id` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`profile_json` text NOT NULL,
	`cycle` integer DEFAULT 1 NOT NULL,
	`calendar_token` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `children_calendar_token_idx` ON `children` (`calendar_token`);--> statement-breakpoint
CREATE TABLE `parents` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`password_salt` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `parents_username_idx` ON `parents` (`username`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`parent_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL
);
