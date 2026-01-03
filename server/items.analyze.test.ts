import { describe, it, expect } from 'vitest';
import { appRouter } from './routers';
import type { TrpcContext } from './_core/context';

type AuthenticatedUser = NonNullable<TrpcContext['user']>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: 'test-user-1',
    email: 'test@example.com',
    name: 'Test User',
    loginMethod: 'manus',
    role: 'user',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: 'https',
      headers: {},
    } as TrpcContext['req'],
    res: {} as TrpcContext['res'],
  };
}

describe('Items Analysis', () => {

  it('should analyze BOQ items successfully', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const items = [
      {
        itemCode: 'ITEM-001',
        description: 'Concrete Foundation',
        unit: 'm3',
        quantity: 50,
        unitPrice: 150,
        totalPrice: 7500,
        category: 'Concrete',
      },
      {
        itemCode: 'ITEM-002',
        description: 'Steel Reinforcement',
        unit: 'ton',
        quantity: 10,
        unitPrice: 800,
        totalPrice: 8000,
        category: 'Steel',
      },
      {
        itemCode: 'ITEM-003',
        description: 'Brick Work',
        unit: 'm2',
        quantity: 200,
        unitPrice: 50,
        totalPrice: 10000,
        category: 'Masonry',
      },
    ];

    const result = await caller.items.analyzeItems({
      items,
      projectName: 'Test Project',
      language: 'en',
    });

    expect(result).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(typeof result.analysis).toBe('string');
    expect(result.itemsCount).toBe(3);
    expect(result.totalCost).toBe(25500);
  });

  it('should handle Arabic language analysis', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const items = [
      {
        itemCode: 'ITEM-001',
        description: 'أساس خرساني',
        unit: 'm3',
        quantity: 50,
        unitPrice: 150,
        totalPrice: 7500,
        category: 'خرسانة',
      },
    ];

    const result = await caller.items.analyzeItems({
      items,
      projectName: 'مشروع اختبار',
      language: 'ar',
    });

    expect(result).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(result.itemsCount).toBe(1);
    expect(result.totalCost).toBe(7500);
  });

  it('should calculate correct total cost', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const items = [
      {
        itemCode: 'ITEM-001',
        description: 'Item 1',
        unit: 'EA',
        quantity: 100,
        unitPrice: 25,
        totalPrice: 2500,
      },
      {
        itemCode: 'ITEM-002',
        description: 'Item 2',
        unit: 'EA',
        quantity: 50,
        unitPrice: 40,
        totalPrice: 2000,
      },
    ];

    const result = await caller.items.analyzeItems({
      items,
      projectName: 'Cost Test',
      language: 'en',
    });

    expect(result.totalCost).toBe(4500);
    expect(result.itemsCount).toBe(2);
  });

  it('should handle empty items array', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const result = await caller.items.analyzeItems({
      items: [],
      projectName: 'Empty Test',
      language: 'en',
    });

    expect(result).toBeDefined();
    expect(result.itemsCount).toBe(0);
    expect(result.totalCost).toBe(0);
  });

  it('should handle large quantities', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const items = [
      {
        itemCode: 'ITEM-001',
        description: 'Bulk Material',
        unit: 'kg',
        quantity: 10000,
        unitPrice: 5,
        totalPrice: 50000,
      },
    ];

    const result = await caller.items.analyzeItems({
      items,
      projectName: 'Bulk Test',
      language: 'en',
    });

    expect(result.totalCost).toBe(50000);
    expect(result.itemsCount).toBe(1);
  });

  it('should handle decimal prices', async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const items = [
      {
        itemCode: 'ITEM-001',
        description: 'Precision Item',
        unit: 'EA',
        quantity: 100,
        unitPrice: 25.75,
        totalPrice: 2575,
      },
    ];

    const result = await caller.items.analyzeItems({
      items,
      projectName: 'Decimal Test',
      language: 'en',
    });

    expect(result.totalCost).toBe(2575);
  });
});
