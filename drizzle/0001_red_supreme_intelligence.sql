CREATE TABLE `password_reset_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`created_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `password_reset_tokens_token_unique` ON `password_reset_tokens` (`token`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_email_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text,
	`booking_id` text,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`sent_at` integer,
	`error` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_email_logs`("id", "user_id", "booking_id", "type", "status", "sent_at", "error") SELECT "id", "user_id", "booking_id", "type", "status", "sent_at", "error" FROM `email_logs`;--> statement-breakpoint
DROP TABLE `email_logs`;--> statement-breakpoint
ALTER TABLE `__new_email_logs` RENAME TO `email_logs`;--> statement-breakpoint
PRAGMA foreign_keys=ON;