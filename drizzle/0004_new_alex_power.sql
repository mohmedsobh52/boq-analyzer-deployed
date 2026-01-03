CREATE TABLE `boq_template_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`itemCode` varchar(100) NOT NULL,
	`description` text NOT NULL,
	`unit` varchar(50) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` int NOT NULL,
	`category` varchar(100),
	`wbsCode` varchar(100),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boq_template_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `boq_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`isPublic` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `boq_templates_id` PRIMARY KEY(`id`)
);
