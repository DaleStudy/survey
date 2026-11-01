CREATE TABLE `responses` (
	`id` text PRIMARY KEY NOT NULL,
	`year` integer NOT NULL,
	`answers` text NOT NULL,
	`ref` text,
	`created_at` text NOT NULL
);
