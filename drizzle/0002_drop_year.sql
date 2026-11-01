PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_responses` (
	`id` text PRIMARY KEY NOT NULL,
	`edition` text NOT NULL,
	`answers` text NOT NULL,
	`ref` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_responses`("id", "edition", "answers", "ref", "created_at") SELECT "id", "edition", "answers", "ref", "created_at" FROM `responses`;--> statement-breakpoint
DROP TABLE `responses`;--> statement-breakpoint
ALTER TABLE `__new_responses` RENAME TO `responses`;--> statement-breakpoint
PRAGMA foreign_keys=ON;