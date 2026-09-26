CREATE TABLE `incompatibilities` (
	`course_code` text NOT NULL,
	`incompatible_code` text NOT NULL,
	PRIMARY KEY(`course_code`, `incompatible_code`),
	FOREIGN KEY (`course_code`) REFERENCES `courses`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `unit_clauses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`course_code` text NOT NULL,
	`group` integer NOT NULL,
	`min_units` integer NOT NULL,
	`subjects` text,
	`levels` text,
	`exclude` text,
	FOREIGN KEY (`course_code`) REFERENCES `courses`(`code`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `courses` ADD `units` integer DEFAULT 6 NOT NULL;--> statement-breakpoint
ALTER TABLE `courses` ADD `unchecked` text;--> statement-breakpoint
ALTER TABLE `prerequisite_groups` ADD `or_enrolled` integer DEFAULT false NOT NULL;