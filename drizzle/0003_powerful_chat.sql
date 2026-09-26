CREATE TABLE `subject_areas` (
	`code` text PRIMARY KEY NOT NULL,
	`description` text NOT NULL
);
--> statement-breakpoint
-- Older boots re-seeded without a uniqueness guard; collapse any duplicates first.
DELETE FROM `prerequisite_groups` WHERE `id` NOT IN (SELECT min(`id`) FROM `prerequisite_groups` GROUP BY `course_code`, `group`, `required_code`);
--> statement-breakpoint
CREATE UNIQUE INDEX `prerequisite_groups_unique` ON `prerequisite_groups` (`course_code`,`group`,`required_code`);