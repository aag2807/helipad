CREATE TABLE `email_configurations` (
	`id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'smtp' NOT NULL,
	`smtp_host` text,
	`smtp_port` integer,
	`smtp_secure` integer DEFAULT true,
	`smtp_user` text,
	`smtp_password` text,
	`from_email` text NOT NULL,
	`from_name` text NOT NULL,
	`resend_api_key` text,
	`is_active` integer DEFAULT true NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
ALTER TABLE `bookings` ADD `passengers` integer DEFAULT 1 NOT NULL;