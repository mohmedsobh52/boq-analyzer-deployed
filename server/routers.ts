import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";
import { COOKIE_NAME } from "../shared/const";

export const appRouter = router({
  auth: router({
    me: protectedProcedure.query(({ ctx }) => ctx.user),
    logout: protectedProcedure.mutation(async ({ ctx }) => {
      ctx.res.clearCookie(COOKIE_NAME);
      return { success: true };
    }),
  }),

  projects: router({
    list: protectedProcedure.query(({ ctx }) => db.getUserProjects(ctx.user.id)),
    recent: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const projects = await db.getUserProjects(ctx.user.id);
        return projects
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
          .slice(0, input?.limit || 5);
      }),
    create: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          description: z.string().optional(),
          currency: z.string().optional(),
        })
      )
      .mutation(({ ctx, input }) =>
        db.createBoqProject({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          currency: input.currency || "USD",
        })
      ),
    detail: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getBoqProject(input.projectId)),
    items: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectItems(input.projectId)),
    files: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectFiles(input.projectId)),
    summary: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        const project = await db.getBoqProject(input.projectId);
        const items = await db.getProjectItems(input.projectId);
        const totalItems = items.length;
        const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const totalCost = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
        return { project, totalItems, totalQuantity, totalCost };
      }),
    addItems: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          items: z.array(
            z.object({
              itemCode: z.string(),
              description: z.string(),
              unit: z.string(),
              quantity: z.number(),
              unitPrice: z.number(),
              category: z.string().optional(),
              wbsCode: z.string().optional(),
              notes: z.string().optional(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        const items = input.items.map((item) => ({
          ...item,
          projectId: input.projectId,
          totalPrice: item.quantity * item.unitPrice,
        }));
        return db.addBoqItems(items);
      }),
    deleteItem: protectedProcedure
      .input(z.object({ itemId: z.number() }))
      .mutation(({ input }) => db.deleteBoqItem(input.itemId)),
    updateItem: protectedProcedure
      .input(
        z.object({
          itemId: z.number(),
          quantity: z.number().optional(),
          unitPrice: z.number().optional(),
          description: z.string().optional(),
          category: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.updateBoqItem(input.itemId, input)),
  }),

  analytics: router({
    projectStats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectAnalyticsData(input.projectId)),
    costBreakdown: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getCostByCategory(input.projectId)),
    projectCosts: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.calculateProjectCosts(input.projectId)),
    costByCategory: protectedProcedure
      .query(({ ctx }) => db.getAllCostByCategory(ctx.user.id)),
    costs: protectedProcedure
      .query(({ ctx }) => db.getAllProjectCosts(ctx.user.id)),
    projectData: protectedProcedure
      .query(({ ctx }) => db.getAllProjectAnalyticsData(ctx.user.id)),
  }),

  suppliers: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectSuppliers(input.projectId)),
    create: protectedProcedure
      .input(
        z.object({
          projectId: z.number(),
          name: z.string(),
          email: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.createSupplier(input)),
    update: protectedProcedure
      .input(
        z.object({
          supplierId: z.number(),
          name: z.string().optional(),
          email: z.string().optional(),
          phone: z.string().optional(),
          address: z.string().optional(),
          notes: z.string().optional(),
        })
      )
      .mutation(({ input }) => db.updateSupplier(input.supplierId, input)),
    delete: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .mutation(({ input }) => db.deleteSupplier(input.supplierId)),
    quotations: protectedProcedure
      .input(z.object({ supplierId: z.number() }))
      .query(({ input }) => db.getSupplierQuotations(input.supplierId)),
  }),

  costHistory: router({
    record: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        estimatedCost: z.number(),
        actualCost: z.number().optional(),
        period: z.string().optional(),
        itemId: z.number().optional(),
      }))
      .mutation(({ input }) => db.recordCostHistory(input.projectId, input.estimatedCost, input.actualCost, input.period, input.itemId)),
    getHistory: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectCostHistory(input.projectId)),
    getTrends: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectTrendData(input.projectId)),
    forecast: protectedProcedure
      .input(z.object({ projectId: z.number(), periods: z.number().optional() }))
      .query(({ input }) => db.generateProjectForecast(input.projectId, input.periods || 3)),
  }),

  milestones: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(({ input }) => db.getProjectMilestones(input.projectId)),
    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        name: z.string(),
        description: z.string().optional(),
        plannedStartDate: z.date().optional(),
        plannedEndDate: z.date().optional(),
        plannedCost: z.number().optional(),
      }))
      .mutation(({ input }) => db.createProjectMilestone(input.projectId, input.name, input.description, input.plannedStartDate, input.plannedEndDate, input.plannedCost)),
    updateProgress: protectedProcedure
      .input(z.object({
        milestoneId: z.number(),
        actualStartDate: z.date().optional(),
        actualEndDate: z.date().optional(),
        actualCost: z.number().optional(),
        status: z.string().optional(),
      }))
      .mutation(({ input }) => db.updateMilestoneProgress(input.milestoneId, input.actualStartDate, input.actualEndDate, input.actualCost, input.status)),
  }),

  items: router({
    analyzeItems: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          itemCode: z.string(),
          description: z.string(),
          unit: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          totalPrice: z.number(),
          category: z.string().optional(),
        })),
        projectName: z.string().optional(),
        language: z.enum(['en', 'ar']).optional(),
      }))
      .mutation(async ({ input }) => {
        const itemsText = input.items
          .map((item: any) => `${item.itemCode}: ${item.description} - ${item.quantity} ${item.unit} @ ${item.unitPrice} = ${item.totalPrice}`)
          .join('\n');
        
        const isArabic = input.language === 'ar';
        const systemPrompt = isArabic
          ? 'أنت خبير متخصص في تحليل جداول الكميات والأسعار (BOQ). قم بتحليل البنود المقدمة واقترح تحسينات في الأسعار والكميات والتصنيفات.'
          : 'You are a BOQ (Bill of Quantities) analysis expert. Analyze the provided items and suggest optimizations for pricing, quantities, and categorization.';
        
        const userPrompt = isArabic
          ? `يرجى تحليل بنود جدول الكميات التالي والتوصية بتحسينات:\n\nاسم المشروع: ${input.projectName || 'بدون اسم'}\n\nالبنود:\n${itemsText}`
          : `Please analyze these BOQ items and provide suggestions:\n\nProject: ${input.projectName || 'Unnamed'}\n\nItems:\n${itemsText}`;
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ]
        });
        
        return {
          analysis: response.choices[0]?.message.content || 'No analysis available',
          itemsCount: input.items.length,
          totalCost: input.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0),
        };
      }),
    suggestRate: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          itemCode: z.string(),
          description: z.string(),
          unit: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          category: z.string().optional(),
        })),
        projectContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const itemsList = input.items
          .map((item, idx) => `${idx + 1}. [${item.itemCode}] ${item.description} - Unit: ${item.unit}, Qty: ${item.quantity}, Current Price: $${item.unitPrice}${item.category ? ` (${item.category})` : ''}`)
          .join('\n');
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert construction cost analyst. Analyze the provided BOQ items and suggest optimized pricing based on market rates, quantities, and categories. Provide specific recommendations for each item with justification.'
            },
            {
              role: 'user',
              content: `Please analyze these BOQ items and suggest optimized pricing:\n\n${itemsList}${input.projectContext ? `\n\nProject Context: ${input.projectContext}` : ''}\n\nFor each item, provide:\n1. Suggested price\n2. Justification\n3. Potential savings or cost optimization\n4. Market rate comparison`
            }
          ]
        });
        
        return {
          analysis: response.choices[0]?.message.content || 'No analysis available',
          itemsAnalyzed: input.items.length,
          timestamp: new Date(),
        };
      }),
  }),

  templates: router({
    list: publicProcedure.query(() => db.getAllTemplates()),
    detail: publicProcedure
      .input(z.object({ templateId: z.number() }))
      .query(({ input }) => db.getTemplateById(input.templateId)),
    items: publicProcedure
      .input(z.object({ templateId: z.number() }))
      .query(({ input }) => db.getTemplateItems(input.templateId)),
    getWithItems: publicProcedure
      .input(z.object({ templateId: z.number() }))
      .query(async ({ input }) => {
        const template = await db.getTemplateById(input.templateId);
        const items = await db.getTemplateItems(input.templateId);
        return { template, items };
      }),
  }),

  exportHistory: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return db.getExportHistory(ctx.user.id, input?.limit || 20);
      }),
    add: protectedProcedure
      .input(
        z.object({
          fileName: z.string(),
          fileFormat: z.enum(['pdf', 'excel']),
          fileSize: z.number().optional(),
          exportType: z.string(),
          status: z.enum(['success', 'failed']).optional(),
          errorMessage: z.string().optional(),
          projectId: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.addExportHistory({
          userId: ctx.user.id,
          fileName: input.fileName,
          fileFormat: input.fileFormat,
          fileSize: input.fileSize || 0,
          exportType: input.exportType,
          status: input.status || 'success',
          errorMessage: input.errorMessage,
          projectId: input.projectId,
        });
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteExportHistory(input.id);
        return { success: true };
      }),
    clear: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.clearExportHistory(ctx.user.id);
        return { success: true };
      }),
  }),

  system: router({
    notifyOwner: protectedProcedure
      .input(z.object({ title: z.string(), content: z.string() }))
      .mutation(async ({ input }) => {
        const { notifyOwner } = await import("./_core/notification");
        return notifyOwner(input);
      }),
    analyzeItems: protectedProcedure
      .input(z.object({ items: z.array(z.any()) }))
      .mutation(async ({ input }) => {
        const itemsText = input.items
          .map((item: any) => `${item.code}: ${item.description} - ${item.quantity} ${item.unit} @ ${item.unitPrice}`)
          .join('\n');
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a BOQ (Bill of Quantities) analysis expert. Analyze the provided items and suggest optimizations for pricing, quantities, and categorization.'
            },
            {
              role: 'user',
              content: `Please analyze these BOQ items and provide suggestions:\n${itemsText}`
            }
          ]
        });
        
        return response.choices[0]?.message.content || 'No analysis available';
      }),
    analyzeItem: protectedProcedure
      .input(z.object({
        code: z.string(),
        description: z.string(),
        unit: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        category: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const totalPrice = input.quantity * input.unitPrice;
        const itemText = `Item Code: ${input.code}\nDescription: ${input.description}\nUnit: ${input.unit}\nQuantity: ${input.quantity}\nUnit Price: ${input.unitPrice}\nTotal: ${totalPrice}${input.category ? `\nCategory: ${input.category}` : ''}`;
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are a BOQ analysis expert. Provide detailed analysis for a single BOQ item.'
            },
            {
              role: 'user',
              content: `Please analyze this BOQ item:\n${itemText}`
            }
          ]
        });
        
        return response.choices[0]?.message.content || 'No analysis available';
       }),
    suggestRate: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          itemCode: z.string(),
          description: z.string(),
          unit: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          category: z.string().optional(),
        })),
        projectContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const itemsList = input.items
          .map((item, idx) => `${idx + 1}. [${item.itemCode}] ${item.description} - Unit: ${item.unit}, Qty: ${item.quantity}, Current Price: $${item.unitPrice}${item.category ? ` (${item.category})` : ''}`)
          .join('\n');
        
        const response = await invokeLLM({
          messages: [
            {
              role: 'system',
              content: 'You are an expert construction cost analyst. Analyze the provided BOQ items and suggest optimized pricing based on market rates, quantities, and categories. Provide specific recommendations for each item with justification.'
            },
            {
              role: 'user',
              content: `Please analyze these BOQ items and suggest optimized pricing:\n\n${itemsList}${input.projectContext ? `\n\nProject Context: ${input.projectContext}` : ''}\n\nFor each item, provide:\n1. Suggested price\n2. Justification\n3. Potential savings or cost optimization\n4. Market rate comparison`
            }
          ]
        });
        
        return {
          analysis: response.choices[0]?.message.content || 'No analysis available',
          itemsAnalyzed: input.items.length,
          timestamp: new Date(),
        };
      }),
  }),
});
export type AppRouter = typeof appRouter;
