import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// BOQ Projects table
export const boqProjects = mysqlTable("boq_projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "active", "completed", "archived"]).default("draft").notNull(),
  totalCost: int("totalCost").default(0),
  currency: varchar("currency", { length: 10 }).default("USD").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BoqProject = typeof boqProjects.$inferSelect;
export type InsertBoqProject = typeof boqProjects.$inferInsert;

// BOQ Items table
export const boqItems = mysqlTable("boq_items", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  itemCode: varchar("itemCode", { length: 100 }).notNull(),
  description: text("description").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(),
  totalPrice: int("totalPrice").notNull(),
  wbsCode: varchar("wbsCode", { length: 100 }),
  category: varchar("category", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BoqItem = typeof boqItems.$inferSelect;
export type InsertBoqItem = typeof boqItems.$inferInsert;

// Suppliers table
export const suppliers = mysqlTable("suppliers", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = typeof suppliers.$inferInsert;

// Quotations table
export const quotations = mysqlTable("quotations", {
  id: int("id").autoincrement().primaryKey(),
  supplierId: int("supplierId").notNull(),
  projectId: int("projectId").notNull(),
  itemId: int("itemId").notNull(),
  quotedPrice: int("quotedPrice").notNull(),
  leadTime: varchar("leadTime", { length: 100 }),
  terms: text("terms"),
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Quotation = typeof quotations.$inferSelect;
export type InsertQuotation = typeof quotations.$inferInsert;

// Project Files table
export const projectFiles = mysqlTable("project_files", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileType: varchar("fileType", { length: 50 }).notNull(),
  fileSize: int("fileSize"),
  uploadedBy: int("uploadedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProjectFile = typeof projectFiles.$inferSelect;
export type InsertProjectFile = typeof projectFiles.$inferInsert;

// Cost Analysis table
export const costAnalysis = mysqlTable("cost_analysis", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  totalMaterialCost: int("totalMaterialCost").default(0),
  totalLaborCost: int("totalLaborCost").default(0),
  totalEquipmentCost: int("totalEquipmentCost").default(0),
  contingency: int("contingency").default(0),
  profitMargin: int("profitMargin").default(0),
  finalCost: int("finalCost").default(0),
  analysisDate: timestamp("analysisDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostAnalysis = typeof costAnalysis.$inferSelect;
export type InsertCostAnalysis = typeof costAnalysis.$inferInsert;

// Cost History table - for tracking estimated vs actual costs over time
export const costHistory = mysqlTable("cost_history", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  itemId: int("itemId"),
  estimatedCost: int("estimatedCost").notNull(),
  actualCost: int("actualCost"),
  variance: int("variance"),
  variancePercent: int("variancePercent"),
  period: varchar("period", { length: 50 }),
  recordDate: timestamp("recordDate").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CostHistory = typeof costHistory.$inferSelect;
export type InsertCostHistory = typeof costHistory.$inferInsert;

// Project Milestones table - for tracking project progress and costs
export const projectMilestones = mysqlTable("project_milestones", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  plannedStartDate: timestamp("plannedStartDate"),
  plannedEndDate: timestamp("plannedEndDate"),
  actualStartDate: timestamp("actualStartDate"),
  actualEndDate: timestamp("actualEndDate"),
  plannedCost: int("plannedCost"),
  actualCost: int("actualCost"),
  status: mysqlEnum("status", ["planned", "in_progress", "completed", "delayed"]).default("planned").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProjectMilestone = typeof projectMilestones.$inferSelect;
export type InsertProjectMilestone = typeof projectMilestones.$inferInsert;

// Risk Assessment table - for tracking project risks
export const riskAssessments = mysqlTable("risk_assessments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // Technical, Financial, Schedule, Resource, External
  probability: int("probability").notNull(), // 1-5 scale
  impact: int("impact").notNull(), // 1-5 scale
  riskScore: int("riskScore").notNull(), // probability * impact
  riskLevel: varchar("riskLevel", { length: 50 }).notNull(), // Critical, High, Medium, Low
  mitigationPlan: text("mitigationPlan"),
  riskOwner: varchar("riskOwner", { length: 255 }),
  status: mysqlEnum("status", ["open", "mitigated", "closed"]).default("open").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RiskAssessment = typeof riskAssessments.$inferSelect;
export type InsertRiskAssessment = typeof riskAssessments.$inferInsert;


// BOQ Templates table - for storing pre-built templates
export const boqTemplates = mysqlTable("boq_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(), // Concrete, Steel, Labor, Equipment, etc.
  isPublic: int("isPublic").default(1).notNull(), // 1 = public, 0 = private
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BoqTemplate = typeof boqTemplates.$inferSelect;
export type InsertBoqTemplate = typeof boqTemplates.$inferInsert;

// BOQ Template Items table - for storing items within templates
export const boqTemplateItems = mysqlTable("boq_template_items", {
  id: int("id").autoincrement().primaryKey(),
  templateId: int("templateId").notNull(),
  itemCode: varchar("itemCode", { length: 100 }).notNull(),
  description: text("description").notNull(),
  unit: varchar("unit", { length: 50 }).notNull(),
  quantity: int("quantity").notNull(),
  unitPrice: int("unitPrice").notNull(),
  category: varchar("category", { length: 100 }),
  wbsCode: varchar("wbsCode", { length: 100 }),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BoqTemplateItem = typeof boqTemplateItems.$inferSelect;
export type InsertBoqTemplateItem = typeof boqTemplateItems.$inferInsert;


// Export History table - for tracking export activities
export const exportHistory = mysqlTable("export_history", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  projectId: int("projectId"),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileFormat: mysqlEnum("fileFormat", ["pdf", "excel"]).notNull(),
  fileSize: int("fileSize").default(0), // in bytes
  exportType: varchar("exportType", { length: 100 }).notNull(), // e.g., "analytics", "boq", "risk"
  status: mysqlEnum("status", ["success", "failed"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  downloadUrl: text("downloadUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ExportHistory = typeof exportHistory.$inferSelect;
export type InsertExportHistory = typeof exportHistory.$inferInsert;
