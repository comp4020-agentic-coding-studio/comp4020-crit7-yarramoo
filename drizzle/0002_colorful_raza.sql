CREATE TABLE `completed_courses` (
	`username` text NOT NULL,
	`code` text NOT NULL,
	`passed` integer DEFAULT true NOT NULL,
	PRIMARY KEY(`username`, `code`),
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`code`) REFERENCES `courses`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`code` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`terms` text NOT NULL,
	`requires_permission` integer DEFAULT false NOT NULL,
	`prereq_note` text
);
--> statement-breakpoint
CREATE TABLE `enrolments` (
	`username` text NOT NULL,
	`course_code` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	PRIMARY KEY(`username`, `course_code`),
	FOREIGN KEY (`username`) REFERENCES `users`(`username`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`course_code`) REFERENCES `courses`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `prerequisite_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_code` text NOT NULL,
	`group` integer NOT NULL,
	`required_code` text NOT NULL,
	FOREIGN KEY (`course_code`) REFERENCES `courses`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `users` (
	`username` text PRIMARY KEY NOT NULL,
	`password` text NOT NULL,
	`failed_attempts` integer DEFAULT 0 NOT NULL
);
