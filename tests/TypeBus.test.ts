
import { TypeBus, createCommand, createQuery, createEventHandler } from '../src';

describe('TypeBus', () => {
  let bus: TypeBus;

  beforeEach(() => {
    bus = new TypeBus({ enableLogging: false });
  });

  afterEach(() => {
    bus.clear();
  });

  describe('Command Execution', () => {
    it('should register and execute commands', async () => {
      const CreateUser = createCommand(
        bus,
        'User.CreateUser',
        async (_data, aggregateId) => {
          expect(aggregateId).toBe('user-123');
          return { userId: aggregateId, events: ['User.Created'] };
        }
      );

      const result = await CreateUser.execute(
        { name: 'John Doe', email: 'john@example.com', password: 'password123' },
        'user-123'
      );

      expect(result.userId).toBe('user-123');
      expect(result.events).toContain('User.Created');
    });

    it('should execute commands through bus directly', async () => {
      createCommand(
        bus,
        'User.CreateUser',
        async (_data, aggregateId) => {
          return { userId: aggregateId, events: ['User.Created'] };
        }
      );

      const result = await bus.executeCommand(
        'User.CreateUser',
        { name: 'Jane Doe', email: 'jane@example.com', password: 'password123' },
        'user-456'
      );

      expect(result.userId).toBe('user-456');
    });

    it('should throw error for unregistered command', async () => {
      await expect(
        bus.executeCommand(
          'NonExistent.Command' as any,
          {},
          'test-id'
        )
      ).rejects.toThrow('No handler registered for command: NonExistent.Command');
    });

    it('should handle command errors properly', async () => {
      createCommand(
        bus,
        'User.CreateUser',
        async () => {
          throw new Error('Validation failed');
        }
      );

      await expect(
        bus.executeCommand(
          'User.CreateUser',
          { name: '', email: '', password: '' },
          'user-error'
        )
      ).rejects.toThrow('Validation failed');
    });
  });

  describe('Query Execution', () => {
    it('should register and execute queries', async () => {
      const GetUser = createQuery(
        bus,
        'User.GetUser',
        async (params) => {
          expect(params.userId).toBe('user-123');
          return {
            id: params.userId,
            name: 'John Doe',
            email: 'john@example.com',
            createdAt: new Date(),
            lastLoginAt: new Date()
          };
        }
      );

      const result = await GetUser.execute({ userId: 'user-123' });

      expect(result.id).toBe('user-123');
      expect(result.name).toBe('John Doe');
    });

    it('should execute queries through bus directly', async () => {
      createQuery(
        bus,
        'User.GetUser',
        async (params) => {
          return {
            id: params.userId,
            name: 'Test User',
            email: 'test@example.com',
            createdAt: new Date(),
            lastLoginAt: new Date()
          };
        }
      );

      const result = await bus.executeQuery('User.GetUser', { userId: 'user-789' });

      expect(result.id).toBe('user-789');
      expect(result.name).toBe('Test User');
    });

    it('should throw error for unregistered query', async () => {
      await expect(
        bus.executeQuery('NonExistent.Query' as any, {})
      ).rejects.toThrow('No handler registered for query: NonExistent.Query');
    });
  });

  describe('Event Publishing', () => {
    it('should register and publish events', async () => {
      const eventHandler = jest.fn();
      
      createEventHandler(
        bus,
        'User.Created',
        async (_data, aggregateId, version) => {
          eventHandler(_data, aggregateId, version);
        }
      );

      await bus.publishEvent(
        'User.Created',
        { name: 'John Doe', email: 'john@example.com' },
        'user-123',
        1
      );

      expect(eventHandler).toHaveBeenCalledWith(
        { name: 'John Doe', email: 'john@example.com' },
        'user-123',
        1
      );
    });

    it('should handle multiple event handlers', async () => {
      const handler1 = jest.fn();
      const handler2 = jest.fn();

      createEventHandler(bus, 'User.Created', async (_data) => handler1(_data));
      createEventHandler(bus, 'User.Created', async (_data) => handler2(_data));

      await bus.publishEvent(
        'User.Created',
        { name: 'John Doe', email: 'john@example.com' },
        'user-123',
        1
      );

      expect(handler1).toHaveBeenCalled();
      expect(handler2).toHaveBeenCalled();
    });

    it('should not throw for events without handlers', async () => {
      await expect(
        bus.publishEvent(
          'NonExistent.Event' as any,
          {},
          'test-id',
          1
        )
      ).resolves.not.toThrow();
    });
  });

  describe('Middleware', () => {
    it('should execute middleware in correct order', async () => {
      const execution: string[] = [];

      bus.use({
        async execute(message, next) {
          execution.push('middleware1-before');
          const result = await next(message);
          execution.push('middleware1-after');
          return result;
        }
      });

      bus.use({
        async execute(message, next) {
          execution.push('middleware2-before');
          const result = await next(message);
          execution.push('middleware2-after');
          return result;
        }
      });

      createCommand(
        bus,
        'User.CreateUser',
        async () => {
          execution.push('handler');
          return { userId: 'test', events: [] };
        }
      );

      await bus.executeCommand(
        'User.CreateUser',
        { name: 'Test', email: 'test@example.com', password: 'password' },
        'test-id'
      );

      expect(execution).toEqual([
        'middleware1-before',
        'middleware2-before',
        'handler',
        'middleware2-after',
        'middleware1-after'
      ]);
    });
  });

  describe('Statistics and Utilities', () => {
    it('should provide correct stats', () => {
      createCommand(bus, 'User.CreateUser', async () => ({ userId: '', events: [] }));
      createQuery(bus, 'User.GetUser', async () => ({ id: '', name: '', email: '', createdAt: new Date(), lastLoginAt: new Date() }));
      createEventHandler(bus, 'User.Created', async () => {});

      const stats = bus.getStats();

      expect(stats.commandHandlers).toBe(1);
      expect(stats.queryHandlers).toBe(1);
      expect(stats.eventHandlers).toBe(1);
    });

    it('should list registered handlers', () => {
      createCommand(bus, 'User.CreateUser', async () => ({ userId: '', events: [] }));
      createQuery(bus, 'User.GetUser', async () => ({ id: '', name: '', email: '', createdAt: new Date(), lastLoginAt: new Date() }));

      const handlers = bus.getRegisteredHandlers();

      expect(handlers.commands).toContain('User.CreateUser');
      expect(handlers.queries).toContain('User.GetUser');
    });

    it('should clear all handlers', () => {
      createCommand(bus, 'User.CreateUser', async () => ({ userId: '', events: [] }));
      createQuery(bus, 'User.GetUser', async () => ({ id: '', name: '', email: '', createdAt: new Date(), lastLoginAt: new Date() }));

      bus.clear();

      const stats = bus.getStats();
      expect(stats.commandHandlers).toBe(0);
      expect(stats.queryHandlers).toBe(0);
      expect(stats.eventHandlers).toBe(0);
    });
  });

  describe('Type Safety', () => {
    it('should maintain type safety at runtime', async () => {
      const CreateUser = createCommand(
        bus,
        'User.CreateUser',
        async (_data, aggregateId) => {

          expect(typeof _data.name).toBe('string');
          expect(typeof _data.email).toBe('string');
          expect(typeof _data.password).toBe('string');
          expect(typeof aggregateId).toBe('string');

          return { userId: aggregateId, events: ['User.Created'] };
        }
      );

      const result = await CreateUser.execute(
        {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123'
        },
        'user-123'
      );


      expect(typeof result.userId).toBe('string');
      expect(Array.isArray(result.events)).toBe(true);
    });
  });
});
