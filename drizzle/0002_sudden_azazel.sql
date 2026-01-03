CREATE TABLE `cost_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`itemId` int,
	`estimatedCost` int NOT NULL,
	`actualCost` int,
	`variance` int,
	`variancePercent` int,
	`period` varchar(50),
	`recordDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `cost_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `project_milestones` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`plannedStartDate` timestamp,
	`plannedEndDate` timestamp,
	`actualStartDate` timestamp,
	`actualEndDate` timestamp,
	`plannedCost` int,
	`actualCost` int,
	`status` enum('planned','in_progress','completed','delayed') NOT NULL DEFAULT 'planned',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `project_milestones_id` PRIMARY KEY(`id`)
);
