import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  boqProjects,
  boqItems,
  suppliers,
  quotations,
  projectFiles,
  costAnalysis,
  boqTemplates,
  boqTemplateItems,
  exportHistory,
  InsertBoqProject,
  InsertBoqItem,
  InsertSupplier,
  InsertQuotation,
  InsertProjectFile,
  InsertCostAnalysis,
  InsertBoqTemplate,
  InsertBoqTemplateItem,
  InsertExportHistory,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// BOQ Projects
export async function getUserProjects(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boqProjects).where(eq(boqProjects.userId, userId));
}

export async function createBoqProject(project: InsertBoqProject) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(boqProjects).values(project);
  return result;
}

export async function getBoqProject(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(boqProjects).where(eq(boqProjects.id, projectId)).limit(1);
  return result[0] || null;
}

// BOQ Items
export async function getProjectItems(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boqItems).where(eq(boqItems.projectId, projectId));
}

export async function createBoqItem(item: InsertBoqItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(boqItems).values(item);
}

// Suppliers
export async function getProjectSuppliers(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(suppliers).where(eq(suppliers.projectId, projectId));
}

export async function createSupplier(supplier: InsertSupplier) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(suppliers).values(supplier);
}

// Quotations
export async function getItemQuotations(itemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(quotations).where(eq(quotations.itemId, itemId));
}

export async function createQuotation(quotation: InsertQuotation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(quotations).values(quotation);
}

// Project Files
export async function getProjectFiles(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projectFiles).where(eq(projectFiles.projectId, projectId));
}

export async function createProjectFile(file: InsertProjectFile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(projectFiles).values(file);
}

// Cost Analysis
export async function getProjectCostAnalysis(projectId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(costAnalysis).where(eq(costAnalysis.projectId, projectId)).limit(1);
  return result[0] || null;
}

export async function createCostAnalysis(analysis: InsertCostAnalysis) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(costAnalysis).values(analysis);
}


// Analytics helpers
export async function getProjectAnalyticsData(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const project = await getBoqProject(projectId);
    const items = await getProjectItems(projectId);
    const analysis = await getProjectCostAnalysis(projectId);

    if (!project || !items || items.length === 0) {
      return null;
    }

    return {
      project,
      items,
      analysis,
    };
  } catch (error) {
    console.error("[Database] Failed to get analytics data:", error);
    return null;
  }
}

export async function calculateProjectCosts(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const items = await getProjectItems(projectId);
    if (!items || items.length === 0) return null;

    let totalCost = 0;
    let materialCost = 0;
    let laborCost = 0;
    let equipmentCost = 0;

    items.forEach((item) => {
      const itemTotal = item.totalPrice || 0;
      totalCost += itemTotal;

      if (item.category === 'Materials' || item.category === 'مواد') {
        materialCost += itemTotal;
      } else if (item.category === 'Labor' || item.category === 'عمالة') {
        laborCost += itemTotal;
      } else if (item.category === 'Equipment' || item.category === 'معدات') {
        equipmentCost += itemTotal;
      }
    });

    return {
      totalCost,
      materialCost,
      laborCost,
      equipmentCost,
      itemCount: items.length,
    };
  } catch (error) {
    console.error("[Database] Failed to calculate costs:", error);
    return null;
  }
}

export async function getCostByCategory(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const items = await getProjectItems(projectId);
    if (!items || items.length === 0) return [];

    const categoryMap = new Map<string, { total: number; count: number; prices: number[] }>();

    items.forEach((item) => {
      const category = item.category || 'Other';
      const existing = categoryMap.get(category) || { total: 0, count: 0, prices: [] };
      existing.total += item.totalPrice || 0;
      existing.count += 1;
      existing.prices.push(item.unitPrice || 0);
      categoryMap.set(category, existing);
    });

    const totalCost = Array.from(categoryMap.values()).reduce((sum, cat) => sum + cat.total, 0);

    return Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalCost: data.total,
      percentage: totalCost > 0 ? (data.total / totalCost) * 100 : 0,
      itemCount: data.count,
      averageUnitPrice: data.count > 0 ? data.prices.reduce((a, b) => a + b, 0) / data.count : 0,
    }));
  } catch (error) {
    console.error("[Database] Failed to get cost by category:", error);
    return [];
  }
}


// File Upload Helpers
export async function uploadBoqFile(
  projectId: number,
  fileName: string,
  fileKey: string,
  fileUrl: string,
  fileType: string,
  fileSize: number,
  uploadedBy: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(projectFiles).values({
      projectId,
      fileName,
      fileKey,
      fileUrl,
      fileType,
      fileSize,
      uploadedBy,
    });

    return result;
  } catch (error) {
    console.error("[Database] Failed to upload file:", error);
    throw error;
  }
}

export async function createProjectWithItems(
  project: InsertBoqProject,
  items: InsertBoqItem[]
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    // Create project
    const projectResult = await db.insert(boqProjects).values(project);
    const projectId = (projectResult as any).insertId || projectResult[0];

    if (!projectId) {
      throw new Error("Failed to create project");
    }

    // Create BOQ items
    if (items && items.length > 0) {
      const itemsWithProjectId: InsertBoqItem[] = items.map((item) => ({
        ...item,
        projectId: projectId as number,
      }));

      await db.insert(boqItems).values(itemsWithProjectId);
    }

    return projectId;
  } catch (error) {
    console.error("[Database] Failed to create project with items:", error);
    throw error;
  }
}

export async function updateProjectCost(projectId: number, totalCost: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    await db.update(boqProjects).set({ totalCost }).where(eq(boqProjects.id, projectId));
  } catch (error) {
    console.error("[Database] Failed to update project cost:", error);
    throw error;
  }
}

export async function getProjectWithItems(projectId: number) {
  const db = await getDb();
  if (!db) return null;

  try {
    const project = await getBoqProject(projectId);
    if (!project) return null;

    const items = await getProjectItems(projectId);
    const files = await getProjectFiles(projectId);

    return {
      project,
      items,
      files,
    };
  } catch (error) {
    console.error("[Database] Failed to get project with items:", error);
    return null;
  }
}



// Additional helper functions
export async function addBoqItems(items: InsertBoqItem[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    return db.insert(boqItems).values(items);
  } catch (error) {
    console.error("[Database] Failed to add BOQ items:", error);
    throw error;
  }
}

export async function deleteBoqItem(itemId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    return db.delete(boqItems).where(eq(boqItems.id, itemId));
  } catch (error) {
    console.error("[Database] Failed to delete BOQ item:", error);
    throw error;
  }
}

export async function updateBoqItem(itemId: number, data: Partial<InsertBoqItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    return db.update(boqItems).set(data).where(eq(boqItems.id, itemId));
  } catch (error) {
    console.error("[Database] Failed to update BOQ item:", error);
    throw error;
  }
}

export async function updateSupplier(supplierId: number, data: Partial<InsertSupplier>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    return db.update(suppliers).set(data).where(eq(suppliers.id, supplierId));
  } catch (error) {
    console.error("[Database] Failed to update supplier:", error);
    throw error;
  }
}

export async function deleteSupplier(supplierId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    return db.delete(suppliers).where(eq(suppliers.id, supplierId));
  } catch (error) {
    console.error("[Database] Failed to delete supplier:", error);
    throw error;
  }
}

export async function getSupplierQuotations(supplierId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return db.select().from(quotations).where(eq(quotations.supplierId, supplierId));
  } catch (error) {
    console.error("[Database] Failed to get supplier quotations:", error);
    return [];
  }
}

export async function getProjectQuotations(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    return db.select().from(quotations).where(eq(quotations.projectId, projectId));
  } catch (error) {
    console.error("[Database] Failed to get project quotations:", error);
    return [];
  }
}

// Cost History Functions
export async function recordCostHistory(
  projectId: number,
  estimatedCost: number,
  actualCost?: number,
  period?: string,
  itemId?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const variance = actualCost ? actualCost - estimatedCost : null;
    const variancePercent = actualCost && estimatedCost > 0 
      ? Math.round((variance! / estimatedCost) * 100) 
      : null;

    const result = await db.insert(costHistory).values({
      projectId,
      itemId,
      estimatedCost,
      actualCost,
      variance,
      variancePercent,
      period,
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to record cost history:", error);
    throw error;
  }
}

export async function getProjectCostHistory(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(costHistory)
      .where(eq(costHistory.projectId, projectId))
      .orderBy(costHistory.recordDate);
    return result;
  } catch (error) {
    console.error("[Database] Failed to get cost history:", error);
    return [];
  }
}

export async function getProjectTrendData(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const history = await getProjectCostHistory(projectId);
    
    // Group by period and calculate trend
    const trendMap = new Map<string, { estimated: number; actual: number; count: number }>();
    
    history.forEach(record => {
      if (record.period) {
        const existing = trendMap.get(record.period) || { estimated: 0, actual: 0, count: 0 };
        existing.estimated += record.estimatedCost;
        existing.actual += record.actualCost || 0;
        existing.count += 1;
        trendMap.set(record.period, existing);
      }
    });

    // Convert to array and calculate forecast
    const trends = Array.from(trendMap.entries()).map(([period, data]) => ({
      period,
      estimated: data.estimated,
      actual: data.actual,
      forecast: data.actual || data.estimated,
      variance: (data.actual || 0) - data.estimated,
    }));

    return trends;
  } catch (error) {
    console.error("[Database] Failed to get trend data:", error);
    return [];
  }
}

// Forecasting Functions
export async function generateProjectForecast(projectId: number, forecastPeriods: number = 3) {
  const db = await getDb();
  if (!db) return [];

  try {
    const history = await getProjectCostHistory(projectId);
    
    if (history.length === 0) {
      return [];
    }

    // Get actual costs for forecasting
    const actualCosts = history
      .filter(h => h.actualCost !== null && h.actualCost !== undefined)
      .map(h => h.actualCost as number);

    if (actualCosts.length === 0) {
      return [];
    }

    // Simple exponential smoothing forecast
    const forecast: { period: string; forecast: number; confidence: number }[] = [];
    const alpha = 0.3; // Smoothing factor
    let smoothed = actualCosts[0];

    for (let i = 1; i < actualCosts.length; i++) {
      smoothed = alpha * actualCosts[i] + (1 - alpha) * smoothed;
    }

    // Generate forecast for future periods
    let forecastValue = smoothed;
    for (let i = 0; i < forecastPeriods; i++) {
      const confidence = Math.max(0.5, 0.95 - (i * 0.1)); // Decreasing confidence
      forecast.push({
        period: `Month ${i + 1}`,
        forecast: Math.round(forecastValue),
        confidence,
      });
      // Add slight growth trend
      forecastValue = forecastValue * 1.02;
    }

    return forecast;
  } catch (error) {
    console.error("[Database] Failed to generate forecast:", error);
    return [];
  }
}

// Project Milestone Functions
export async function createProjectMilestone(
  projectId: number,
  name: string,
  description?: string,
  plannedStartDate?: Date,
  plannedEndDate?: Date,
  plannedCost?: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const result = await db.insert(projectMilestones).values({
      projectId,
      name,
      description,
      plannedStartDate,
      plannedEndDate,
      plannedCost,
    });
    return result;
  } catch (error) {
    console.error("[Database] Failed to create milestone:", error);
    throw error;
  }
}

export async function getProjectMilestones(projectId: number) {
  const db = await getDb();
  if (!db) return [];

  try {
    const result = await db
      .select()
      .from(projectMilestones)
      .where(eq(projectMilestones.projectId, projectId));
    return result;
  } catch (error) {
    console.error("[Database] Failed to get milestones:", error);
    return [];
  }
}

export async function updateMilestoneProgress(
  milestoneId: number,
  actualStartDate?: Date,
  actualEndDate?: Date,
  actualCost?: number,
  status?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    const updateData: any = {};
    if (actualStartDate) updateData.actualStartDate = actualStartDate;
    if (actualEndDate) updateData.actualEndDate = actualEndDate;
    if (actualCost) updateData.actualCost = actualCost;
    if (status) updateData.status = status;

    await db
      .update(projectMilestones)
      .set(updateData)
      .where(eq(projectMilestones.id, milestoneId));
  } catch (error) {
    console.error("[Database] Failed to update milestone:", error);
    throw error;
  }
}

// Import new tables
import { costHistory, projectMilestones } from "../drizzle/schema";


// BOQ Templates
export async function getAllTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boqTemplates).where(eq(boqTemplates.isPublic, 1));
}

export async function getTemplateById(templateId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(boqTemplates).where(eq(boqTemplates.id, templateId)).limit(1);
  return result[0] || null;
}

export async function getTemplateItems(templateId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(boqTemplateItems).where(eq(boqTemplateItems.templateId, templateId));
}

export async function createTemplate(template: InsertBoqTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(boqTemplates).values(template);
}

export async function createTemplateItem(item: InsertBoqTemplateItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(boqTemplateItems).values(item);
}

export async function seedTemplates(templates: any[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  try {
    for (const template of templates) {
      const templateResult = await db.insert(boqTemplates).values({
        name: template.name,
        description: template.description,
        category: template.category,
        isPublic: 1,
        createdBy: 1,
      });

      const templateId = (templateResult as any).insertId || (templateResult as any)[0];

      if (template.items && template.items.length > 0) {
        const itemsWithTemplateId = template.items.map((item: any) => ({
          ...item,
          templateId: templateId as number,
        }));

        await db.insert(boqTemplateItems).values(itemsWithTemplateId);
      }
    }

    return { success: true, message: "Templates seeded successfully" };
  } catch (error) {
    console.error("[Database] Failed to seed templates:", error);
    throw error;
  }
}


// Analytics functions for all user projects
export async function getAllCostByCategory(userId: number) {
  try {
    const projects = await getUserProjects(userId);
    const allCategories = new Map<string, { total: number; count: number; prices: number[] }>();

    for (const project of projects) {
      const items = await getProjectItems(project.id);
      if (!items) continue;

      items.forEach((item) => {
        const category = item.category || 'Other';
        const existing = allCategories.get(category) || { total: 0, count: 0, prices: [] };
        existing.total += item.totalPrice || 0;
        existing.count += 1;
        existing.prices.push(item.unitPrice || 0);
        allCategories.set(category, existing);
      });
    }

    const totalCost = Array.from(allCategories.values()).reduce((sum, cat) => sum + cat.total, 0);

    return Array.from(allCategories.entries()).map(([category, data]) => ({
      category,
      totalCost: data.total,
      percentage: totalCost > 0 ? (data.total / totalCost) * 100 : 0,
      itemCount: data.count,
      averageUnitPrice: data.count > 0 ? data.prices.reduce((a, b) => a + b, 0) / data.count : 0,
    }));
  } catch (error) {
    console.error('Error getting all cost by category:', error);
    return [];
  }
}

export async function getAllProjectCosts(userId: number) {
  try {
    const projects = await getUserProjects(userId);
    const projectCosts = [];
    
    for (const project of projects) {
      const items = await getProjectItems(project.id);
      projectCosts.push({
        projectId: project.id,
        projectName: project.name,
        totalCost: project.totalCost || 0,
        itemCount: items?.length || 0,
        currency: project.currency || 'USD',
      });
    }
    
    return projectCosts;
  } catch (error) {
    console.error('Error getting all project costs:', error);
    return [];
  }
}

export async function getAllProjectAnalyticsData(userId: number) {
  try {
    const projects = await getUserProjects(userId);
    const analyticsData = [];

    for (const project of projects) {
      const items = await getProjectItems(project.id);
      const totalCost = items?.reduce((sum, item) => sum + (item.totalPrice || 0), 0) || 0;
      const itemCount = items?.length || 0;

      analyticsData.push({
        projectId: project.id,
        projectName: project.name,
        totalCost,
        itemCount,
        averageItemCost: itemCount > 0 ? totalCost / itemCount : 0,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      });
    }

    return analyticsData;
  } catch (error) {
    console.error('Error getting all project analytics data:', error);
    return [];
  }
}


// Export History functions
export async function addExportHistory(data: InsertExportHistory): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot add export history: database not available");
    return;
  }

  try {
    await db.insert(exportHistory).values(data);
  } catch (error) {
    console.error('Error adding export history:', error);
  }
}

export async function getExportHistory(userId: number, limit: number = 20): Promise<any[]> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get export history: database not available");
    return [];
  }

  try {
    const history = await db
      .select()
      .from(exportHistory)
      .where(eq(exportHistory.userId, userId))
      .orderBy((table) => [table.createdAt])
      .limit(limit);

    return history.reverse(); // Most recent first
  } catch (error) {
    console.error('Error getting export history:', error);
    return [];
  }
}

export async function deleteExportHistory(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete export history: database not available");
    return;
  }

  try {
    await db.delete(exportHistory).where(eq(exportHistory.id, id));
  } catch (error) {
    console.error('Error deleting export history:', error);
  }
}

export async function clearExportHistory(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot clear export history: database not available");
    return;
  }

  try {
    await db.delete(exportHistory).where(eq(exportHistory.userId, userId));
  } catch (error) {
    console.error('Error clearing export history:', error);
  }
}
