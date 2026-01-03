CREATE TABLE `risk_assessments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100) NOT NULL,
	`probability` int NOT NULL,
	`impact` int NOT NULL,
	`riskScore` int NOT NULL,
	`riskLevel` varchar(50) NOT NULL,
	`mitigationPlan` text,
	`riskOwner` varchar(255),
	`status` enum('open','mitigated','closed') NOT NULL DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `risk_assessments_id` PRIMARY KEY(`id`)
);
