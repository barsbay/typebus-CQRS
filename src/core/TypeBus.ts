// core/TypeBus.ts - Главный класс библиотеки TypeBus-CQRS
import {
  IMessageBus,
  IMessageHandler,
  IMiddleware,
  IMessage,
  CommandType,
  QueryType,
  EventType,
  CommandData,
  CommandResult,
  QueryParams,
  QueryResult,
  EventData,
  TypeBusConfig
} from '../types';
import { MessageFactory } from './MessageFactory';

/**
 * Main class of the TypeBus-CQRS library. Implements the IMessageBus interface.
 * Handles registration and execution of commands, queries, and events with middleware support.
 * @implements {IMessageBus}
 */
export class TypeBus implements IMessageBus {
  private commandHandlers = new Map<CommandType, IMessageHandler>();
  private queryHandlers = new Map<QueryType, IMessageHandler>();
  private eventHandlers = new Map<EventType, IMessageHandler[]>();
  private middlewares: IMiddleware[] = [];
  private messageFactory = new MessageFactory();
  private config: Required<TypeBusConfig>;

  /**
   * Creates a new TypeBus instance.
   * @param {TypeBusConfig} [config]
   */
  constructor(config: TypeBusConfig = {}) {
    this.config = {
      enableMetrics: true,
      enableLogging: true,
      logLevel: 'info',
      maxMiddleware: 10,
      commandTimeout: 30000, // 30 seconds
      queryTimeout: 10000,   // 10 seconds
      ...config
    };
  }

  // ================================================================================
  // Middleware Management
  // ================================================================================

  /**
   * Registers a middleware to the bus.
   * @param {IMiddleware} middleware
   */
  use(middleware: IMiddleware): void {
    if (this.middlewares.length >= this.config.maxMiddleware) {
      throw new Error(`Maximum number of middleware (${this.config.maxMiddleware}) exceeded`);
    }
    this.middlewares.push(middleware);
  }

  // ================================================================================
  // Handler Registration
  // ================================================================================

  /**
   * Registers a command handler for a specific command type.
   * @template T
   * @param {T} commandType
   * @param {IMessageHandler<any, CommandResult<T>>} handler
   */
  registerCommandHandler<T extends CommandType>(
    commandType: T,
    handler: IMessageHandler<any, CommandResult<T>>
  ): void {
    if (this.commandHandlers.has(commandType)) {
      throw new Error(`Command handler for '${commandType}' already registered`);
    }
    this.commandHandlers.set(commandType, handler);
    
    if (this.config.enableLogging && this.config.logLevel === 'debug') {
      console.log(`📝 Registered command handler: ${commandType}`);
    }
  }

  /**
   * Registers a query handler for a specific query type.
   * @template T
   * @param {T} queryType
   * @param {IMessageHandler<any, QueryResult<T>>} handler
   */
  registerQueryHandler<T extends QueryType>(
    queryType: T,
    handler: IMessageHandler<any, QueryResult<T>>
  ): void {
    if (this.queryHandlers.has(queryType)) {
      throw new Error(`Query handler for '${queryType}' already registered`);
    }
    this.queryHandlers.set(queryType, handler);
    
    if (this.config.enableLogging && this.config.logLevel === 'debug') {
      console.log(`📖 Registered query handler: ${queryType}`);
    }
  }

  /**
   * Registers an event handler for a specific event type.
   * @template T
   * @param {T} eventType
   * @param {IMessageHandler<any, void>} handler
   */
  registerEventHandler<T extends EventType>(
    eventType: T,
    handler: IMessageHandler<any, void>
  ): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
    
    if (this.config.enableLogging && this.config.logLevel === 'debug') {
      const count = this.eventHandlers.get(eventType)!.length;
      console.log(`📢 Registered event handler: ${eventType} (${count} total)`);
    }
  }

  // ================================================================================
  // Message Execution
  // ================================================================================

  /**
   * Executes a command message.
   * @template T
   * @param {T} type
   * @param {CommandData<T>} data
   * @param {string} aggregateId
   * @param {Record<string, any>} [metadata]
   * @returns {Promise<CommandResult<T>>}
   */
  async executeCommand<T extends CommandType>(
    type: T,
    data: CommandData<T>,
    aggregateId: string,
    metadata?: Record<string, any>
  ): Promise<CommandResult<T>> {
    const command = this.messageFactory.createCommand(type, data, aggregateId, metadata);
    const handler = this.commandHandlers.get(type);
    
    if (!handler) {
      throw new Error(`No handler registered for command: ${type}`);
    }

    return await this.executeWithMiddleware(
      command, 
      handler,
      this.config.commandTimeout
    ) as CommandResult<T>;
  }

  /**
   * Executes a query message.
   * @template T
   * @param {T} type
   * @param {QueryParams<T>} params
   * @param {Record<string, any>} [metadata]
   * @returns {Promise<QueryResult<T>>}
   */
  async executeQuery<T extends QueryType>(
    type: T,
    params: QueryParams<T>,
    metadata?: Record<string, any>
  ): Promise<QueryResult<T>> {
    const query = this.messageFactory.createQuery(type, params, metadata);
    const handler = this.queryHandlers.get(type);
    
    if (!handler) {
      throw new Error(`No handler registered for query: ${type}`);
    }

    return await this.executeWithMiddleware(
      query, 
      handler,
      this.config.queryTimeout
    ) as QueryResult<T>;
  }

  /**
   * Publishes an event message to all registered handlers.
   * @template T
   * @param {T} type
   * @param {EventData<T>} data
   * @param {string} aggregateId
   * @param {number} version
   * @param {Record<string, any>} [metadata]
   * @returns {Promise<void>}
   */
  async publishEvent<T extends EventType>(
    type: T,
    data: EventData<T>,
    aggregateId: string,
    version: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event = this.messageFactory.createEvent(type, data, aggregateId, version, metadata);
    const handlers = this.eventHandlers.get(type) || [];

    if (handlers.length === 0 && this.config.enableLogging) {
      console.warn(`⚠️ No handlers registered for event: ${type}`);
    }

    // Выполняем все обработчики событий параллельно
    await Promise.all(
      handlers.map(handler => 
        this.executeWithMiddleware(event, handler, this.config.commandTimeout)
      )
    );
  }

  // ================================================================================
  // Private Methods
  // ================================================================================

  private async executeWithMiddleware<T extends IMessage, R>(
    message: T,
    handler: IMessageHandler<T, R>,
    timeout: number
  ): Promise<R> {
    let index = 0;
    
    const dispatch = async (msg: T): Promise<R> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        return await middleware.execute(msg, dispatch);
      }
      return await handler.handle(msg);
    };

    // Применяем таймаут
    return await this.withTimeout(dispatch(message), timeout, message.type);
  }

  /**
   * Executes a promise with a timeout. If the promise does not resolve within the specified time, throws an error.
   * Ensures the timeout is cleared to avoid open handles.
   * @template T
   * @param {Promise<T>} promise - The promise to execute
   * @param {number} timeoutMs - Timeout in milliseconds
   * @param {string} operationType - Operation type for error message
   * @returns {Promise<T>}
   */
  private async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    operationType: string
  ): Promise<T> {
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        reject(new Error(`Operation '${operationType}' timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    // Clear the timer after any operation completes
    return Promise.race([promise, timeoutPromise]).then(
      (result) => {
        clearTimeout(timer);
        return result;
      },
      (err) => {
        clearTimeout(timer);
        throw err;
      }
    );
  }

  // ================================================================================
  // Utility Methods
  // ================================================================================

  /**
   * Removes all handlers and middleware from the bus.
   */
  clear(): void {
    this.commandHandlers.clear();
    this.queryHandlers.clear();
    this.eventHandlers.clear();
    this.middlewares.length = 0;
    
    if (this.config.enableLogging) {
      console.log('🧹 TypeBus cleared');
    }
  }

  /**
   * Returns statistics about the current bus state.
   * @returns {object}
   */
  getStats() {
    return {
      commandHandlers: this.commandHandlers.size,
      queryHandlers: this.queryHandlers.size,
      eventHandlers: Array.from(this.eventHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      middleware: this.middlewares.length,
      config: this.config
    };
  }

  /**
   * Returns a list of all registered handler types (for debugging).
   * @returns {object}
   */
  getRegisteredHandlers() {
    return {
      commands: Array.from(this.commandHandlers.keys()),
      queries: Array.from(this.queryHandlers.keys()),
      events: Array.from(this.eventHandlers.keys())
    };
  }
}
