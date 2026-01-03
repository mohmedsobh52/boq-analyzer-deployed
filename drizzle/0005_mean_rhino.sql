CREATE TABLE `export_history` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`projectId` int,
	`fileName` varchar(255) NOT NULL,
	`fileFormat` enum('pdf','excel') NOT NULL,
	`fileSize` int DEFAULT 0,
	`exportType` varchar(100) NOT NULL,
	`status` enum('success','failed') NOT NULL DEFAULT 'success',
	`errorMessage` text,
	`downloadUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `export_history_id` PRIMARY KEY(`id`)
);
