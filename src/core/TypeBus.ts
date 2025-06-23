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
 * @template TCommandMap - Command map type
 * @template TQueryMap - Query map type
 * @template TEventMap - Event map type
 * @implements {IMessageBus<TCommandMap, TQueryMap, TEventMap>}
 */
export class TypeBus<
  TCommandMap extends Record<string, any> = any,
  TQueryMap extends Record<string, any> = any,
  TEventMap extends Record<string, any> = any
> implements IMessageBus<TCommandMap, TQueryMap, TEventMap> {
  private commandHandlers = new Map<string, IMessageHandler>();
  private queryHandlers = new Map<string, IMessageHandler>();
  private eventHandlers = new Map<string, IMessageHandler[]>();
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
   * @param {IMessageHandler<any, CommandResult<TCommandMap, T>>} handler
   */
  registerCommandHandler<T extends CommandType<TCommandMap>>(
    commandType: T,
    handler: IMessageHandler<any, CommandResult<TCommandMap, T>>
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
   * @param {IMessageHandler<any, QueryResult<TQueryMap, T>>} handler
   */
  registerQueryHandler<T extends QueryType<TQueryMap>>(
    queryType: T,
    handler: IMessageHandler<any, QueryResult<TQueryMap, T>>
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
  registerEventHandler<T extends EventType<TEventMap>>(
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
   * @param {CommandData<TCommandMap, T>} data
   * @param {string} aggregateId
   * @param {Record<string, any>} [metadata]
   * @returns {Promise<CommandResult<TCommandMap, T>>}
   */
  async executeCommand<T extends CommandType<TCommandMap>>(
    type: T,
    data: CommandData<TCommandMap, T>,
    aggregateId: string,
    metadata?: Record<string, any>
  ): Promise<CommandResult<TCommandMap, T>> {
    const command = this.messageFactory.createCommand(type, data, aggregateId, metadata);
    const handler = this.commandHandlers.get(type);
    
    if (!handler) {
      throw new Error(`No handler registered for command: ${type}`);
    }

    return await this.executeWithMiddleware(
      command, 
      handler,
      this.config.commandTimeout
    ) as CommandResult<TCommandMap, T>;
  }

  /**
   * Executes a query message.
   * @template T
   * @param {T} type
   * @param {QueryParams<TQueryMap, T>} params
   * @param {Record<string, any>} [metadata]
   * @returns {Promise<QueryResult<TQueryMap, T>>}
   */
  async executeQuery<T extends QueryType<TQueryMap>>(
    type: T,
    params: QueryParams<TQueryMap, T>,
    metadata?: Record<string, any>
  ): Promise<QueryResult<TQueryMap, T>> {
    const query = this.messageFactory.createQuery(type, params, metadata);
    const handler = this.queryHandlers.get(type);
    
    if (!handler) {
      throw new Error(`No handler registered for query: ${type}`);
    }

    return await this.executeWithMiddleware(
      query, 
      handler,
      this.config.queryTimeout
    ) as QueryResult<TQueryMap, T>;
  }

  /**
   * Publishes an event message to all registered handlers.
   * @template T
   * @param {T} type
   * @param {EventData<TEventMap, T>} data
   * @param {string} aggregateId
   * @param {number} version
   * @param {Record<string, any>} [metadata]
   * @returns {Promise<void>}
   */
  async publishEvent<T extends EventType<TEventMap>>(
    type: T,
    data: EventData<TEventMap, T>,
    aggregateId: string,
    version: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    const event = this.messageFactory.createEvent(type, data, aggregateId, version, metadata);
    const handlers = this.eventHandlers.get(type) || [];

    if (handlers.length === 0) {
      if (this.config.enableLogging && this.config.logLevel === 'debug') {
        console.log(`📢 No handlers registered for event: ${type}`);
      }
      return;
    }

    // Execute all handlers in parallel
    const promises = handlers.map(handler => 
      this.executeWithMiddleware(event, handler, this.config.commandTimeout)
    );

    await Promise.all(promises);
  }

  // ================================================================================
  // Private Methods
  // ================================================================================

  /**
   * Executes a message through the middleware pipeline.
   * @template T, R
   * @param {T} message
   * @param {IMessageHandler<T, R>} handler
   * @param {number} timeout
   * @returns {Promise<R>}
   */
  private async executeWithMiddleware<T extends IMessage, R>(
    message: T,
    handler: IMessageHandler<T, R>,
    timeout: number
  ): Promise<R> {
    // Create middleware chain
    const dispatch = async (msg: T): Promise<R> => {
      return await handler.handle(msg);
    };

    // Apply middleware in reverse order
    let chain = dispatch;
    for (let i = this.middlewares.length - 1; i >= 0; i--) {
      const middleware = this.middlewares[i];
      const next = chain;
      chain = async (msg: T) => middleware.execute(msg, next);
    }

    return await this.withTimeout(chain(message), timeout, message.type);
  }

  /**
   * Executes a promise with a timeout.
   * @template T
   * @param {Promise<T>} promise
   * @param {number} timeoutMs
   * @param {string} operationType
   * @returns {Promise<T>}
   */
  private async withTimeout<T>(
    promise: Promise<T>, 
    timeoutMs: number, 
    operationType: string
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${operationType} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  // ================================================================================
  // Utility Methods
  // ================================================================================

  /**
   * Clears all registered handlers and middleware.
   */
  clear(): void {
    this.commandHandlers.clear();
    this.queryHandlers.clear();
    this.eventHandlers.clear();
    this.middlewares = [];
    
    if (this.config.enableLogging) {
      console.log('🧹 TypeBus cleared all handlers and middleware');
    }
  }

  /**
   * Gets statistics about the bus.
   * @returns {object}
   */
  getStats() {
    return {
      commandHandlers: this.commandHandlers.size,
      queryHandlers: this.queryHandlers.size,
      eventHandlers: Array.from(this.eventHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0),
      middleware: this.middlewares.length,
      totalHandlers: this.commandHandlers.size + this.queryHandlers.size + Array.from(this.eventHandlers.values()).reduce((sum, handlers) => sum + handlers.length, 0)
    };
  }

  /**
   * Gets all registered handlers.
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
