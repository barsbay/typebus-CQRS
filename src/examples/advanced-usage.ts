/**
 * Advanced usage example with fluent API and batch operations
 * examples/advanced-usage.ts
 */
// @ts-nocheck
import { createTypeBus, createFluentBuilder } from '../index';

/**
 * Helper to create a fluent builder for the given bus instance.
 * @param {any} bus - The TypeBus instance
 * @returns {ReturnType<typeof createFluentBuilder>}
 */
function fluent(bus: any) {
  return createFluentBuilder(bus);
}

/**
 * Advanced usage example for TypeBus: demonstrates fluent API and batch operations.
 * @async
 * @returns {Promise<void>}
 */
async function advancedExample() {
  const bus = createTypeBus({
    enableLogging: true,
    logLevel: 'debug'
  });
  const userCommands = fluent(bus)
    .command('User.CreateUser')
    .handle(async (data, aggregateId) => {
      return { userId: aggregateId, events: ['User.Created'] };
    });
  const userQueries = fluent(bus)
    .query('User.GetUser')
    .handle(async params => {
      return {
        id: params.userId,
        name: 'John Doe',
        email: 'john@example.com',
        createdAt: new Date(),
        lastLoginAt: new Date()
      };
    });
  const userEvents = fluent(bus)
    .event('User.Created')
    .handle(async (data, aggregateId, version) => {
      // Example event handler logic
    });
  const orderHandlers = fluent(bus)
    .batch()
    .addCommand('createOrder', 'Order.CreateOrder', async (data, aggregateId) => {
      return { orderId: aggregateId, status: 'created' };
    })
    .addQuery('getOrder', 'Order.GetOrder', async params => {
      return {
        id: params.orderId,
        userId: 'user-001',
        status: 'created',
        items: [{ productId: 'prod-1', quantity: 2, price: 29.99 }],
        totalAmount: 59.98,
        createdAt: new Date()
      };
    })
    .addEventHandler('orderCreated', 'Order.Created', async (data, aggregateId) => {
      // Example event handler logic
    })
    .build();
  try {
    const createResult = await userCommands.execute(
      {
        name: 'Charlie Brown',
        email: 'charlie@example.com',
        password: 'securepass123'
      },
      'user-003'
    );
    const user = await userQueries.execute({ userId: 'user-003' });
    const orderResult = await orderHandlers.createOrder.execute(
      {
        userId: 'user-003',
        items: [
          { productId: 'prod-1', quantity: 2, price: 29.99 },
          { productId: 'prod-2', quantity: 1, price: 49.99 }
        ],
        totalAmount: 109.97
      },
      'order-001'
    );
    const order = await orderHandlers.getOrder.execute({ orderId: 'order-001' });
    const userId = 'user-004';
    const orderId = 'order-002';
    await userCommands.execute(
      {
        name: 'Diana Prince',
        email: 'diana@example.com',
        password: 'wonderwoman123'
      },
      userId
    );
    await orderHandlers.createOrder.execute(
      {
        userId,
        items: [{ productId: 'welcome-pack', quantity: 1, price: 0 }],
        totalAmount: 0
      },
      orderId
    );
    bus.getStats();
    bus.getRegisteredHandlers();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('Error in advanced example:', err);
  }
}

if (require.main === module) {
  advancedExample().catch(console.error);
}

export { advancedExample };
