// builders/TypedBuilders.ts - Удобные билдеры для создания команд, запросов и событий
import {
  CommandType,
  QueryType,
  EventType,
  CommandData,
  CommandResult,
  QueryParams,
  QueryResult,
  EventData,
  IMessageHandler,
  ICommand,
  IQuery,
  IEvent
} from '../types';
import { TypeBus } from '../core/TypeBus';

/** ================================================================================
 * Builder for creating and registering command handlers with TypeBus-CQRS.
    ================================================================================  */
export class TypedCommandBuilder {
  /**
   * Creates and registers a command handler.
   * @template TCommandMap - Command map type
   * @template T - Command type key
   * @param {TypeBus<TCommandMap, any, any>} bus - The TypeBus-CQRS instance.
   * @param {T} commandType - The command type.
   * @param {(data: CommandData<TCommandMap, T>, aggregateId: string, metadata?: Record<string, any>) => Promise<CommandResult<TCommandMap, T>>} handlerLogic - The handler logic.
   * @returns {object} Command executor and handler meta.
   */
  static create<TCommandMap extends Record<string, any> = any, T extends CommandType<TCommandMap> = CommandType<TCommandMap>>(
    bus: TypeBus<TCommandMap, any, any>,
    commandType: T,
    handlerLogic: (
      data: CommandData<TCommandMap, T>,
      aggregateId: string,
      metadata?: Record<string, any>
    ) => Promise<CommandResult<TCommandMap, T>>
  ) {
    const handler: IMessageHandler<ICommand<TCommandMap, T>, CommandResult<TCommandMap, T>> = {
      async handle(command: ICommand<TCommandMap, T>): Promise<CommandResult<TCommandMap, T>> {
        return await handlerLogic(command.data, command.aggregateId, command.metadata);
      }
    };
    bus.registerCommandHandler(commandType, handler);
    return {
      async execute(
        data: CommandData<TCommandMap, T>,
        aggregateId: string,
        metadata?: Record<string, any>
      ): Promise<CommandResult<TCommandMap, T>> {
        return await bus.executeCommand(commandType, data, aggregateId, metadata);
      },
      type: commandType,
      handler
    };
  }
}

/** ================================================================================
 * Builder for creating and registering query handlers with TypeBus-CQRS.
    ================================================================================  */
export class TypedQueryBuilder {
  /**
   * Creates and registers a query handler.
   * @template TQueryMap - Query map type
   * @template T - Query type key
   * @param {TypeBus<any, TQueryMap, any>} bus - The TypeBus-CQRS instance.
   * @param {T} queryType - The query type.
   * @param {(params: QueryParams<TQueryMap, T>, metadata?: Record<string, any>) => Promise<QueryResult<TQueryMap, T>>} handlerLogic - The handler logic.
   * @returns {object} Query executor and handler meta.
   */
  static create<TQueryMap extends Record<string, any> = any, T extends QueryType<TQueryMap> = QueryType<TQueryMap>>(
    bus: TypeBus<any, TQueryMap, any>,
    queryType: T,
    handlerLogic: (
      params: QueryParams<TQueryMap, T>,
      metadata?: Record<string, any>
    ) => Promise<QueryResult<TQueryMap, T>>
  ) {
    const handler: IMessageHandler<IQuery<TQueryMap, T>, QueryResult<TQueryMap, T>> = {
      async handle(query: IQuery<TQueryMap, T>): Promise<QueryResult<TQueryMap, T>> {
        return await handlerLogic(query.params, query.metadata);
      }
    };
    bus.registerQueryHandler(queryType, handler);
    return {
      async execute(
        params: QueryParams<TQueryMap, T>,
        metadata?: Record<string, any>
      ): Promise<QueryResult<TQueryMap, T>> {
        return await bus.executeQuery(queryType, params, metadata);
      },
      type: queryType,
      handler
    };
  }
}

/** ================================================================================
 * Builder for creating and registering event handlers with TypeBus-CQRS.
    ================================================================================  */
export class TypedEventBuilder {
  /**
   * Creates and registers an event handler.
   * @template TEventMap - Event map type
   * @template T - Event type key
   * @param {TypeBus<any, any, TEventMap>} bus - The TypeBus-CQRS instance.
   * @param {T} eventType - The event type.
   * @param {(data: EventData<TEventMap, T>, aggregateId: string, version: number, metadata?: Record<string, any>) => Promise<void>} handlerLogic - The handler logic.
   * @returns {object} Event publisher and handler meta.
   */
  static create<TEventMap extends Record<string, any> = any, T extends EventType<TEventMap> = EventType<TEventMap>>(
    bus: TypeBus<any, any, TEventMap>,
    eventType: T,
    handlerLogic: (
      data: EventData<TEventMap, T>,
      aggregateId: string,
      version: number,
      metadata?: Record<string, any>
    ) => Promise<void>
  ) {
    const handler: IMessageHandler<IEvent<TEventMap, T>, void> = {
      async handle(event: IEvent<TEventMap, T>): Promise<void> {
        return await handlerLogic(event.data, event.aggregateId, event.version, event.metadata);
      }
    };
    bus.registerEventHandler(eventType, handler);
    return {
      async publish(
        data: EventData<TEventMap, T>,
        aggregateId: string,
        version: number,
        metadata?: Record<string, any>
      ): Promise<void> {
        return await bus.publishEvent(eventType, data, aggregateId, version, metadata);
      },
      type: eventType,
      handler
    };
  }
}

/** ================================================================================
 * Builder for creating a batch of related commands, queries, and events.
    ================================================================================  */
export class BatchBuilder<
  TCommandMap extends Record<string, any> = any,
  TQueryMap extends Record<string, any> = any,
  TEventMap extends Record<string, any> = any
> {
  private items: Array<{
    type: 'command' | 'query' | 'event';
    executor: any;
    name: string;
  }> = [];

  constructor(private bus: TypeBus<TCommandMap, TQueryMap, TEventMap>) {}

  /**
   * Adds a command to the batch.
   * @template T - Command type key
   * @param {string} name - The name of the command.
   * @param {T} commandType - The command type.
   * @param {(data: CommandData<TCommandMap, T>, aggregateId: string, metadata?: Record<string, any>) => Promise<CommandResult<TCommandMap, T>>} handlerLogic - The handler logic.
   * @returns {BatchBuilder<TCommandMap, TQueryMap, TEventMap>}
   */
  addCommand<T extends CommandType<TCommandMap>>(
    name: string,
    commandType: T,
    handlerLogic: (
      data: CommandData<TCommandMap, T>,
      aggregateId: string,
      metadata?: Record<string, any>
    ) => Promise<CommandResult<TCommandMap, T>>
  ) {
    const executor = TypedCommandBuilder.create(this.bus, commandType, handlerLogic);
    this.items.push({ type: 'command', executor, name });
    return this;
  }

  /**
   * Adds a query to the batch.
   * @template T - Query type key
   * @param {string} name - The name of the query.
   * @param {T} queryType - The query type.
   * @param {(params: QueryParams<TQueryMap, T>, metadata?: Record<string, any>) => Promise<QueryResult<TQueryMap, T>>} handlerLogic - The handler logic.
   * @returns {BatchBuilder<TCommandMap, TQueryMap, TEventMap>}
   */
  addQuery<T extends QueryType<TQueryMap>>(
    name: string,
    queryType: T,
    handlerLogic: (
      params: QueryParams<TQueryMap, T>,
      metadata?: Record<string, any>
    ) => Promise<QueryResult<TQueryMap, T>>
  ) {
    const executor = TypedQueryBuilder.create(this.bus, queryType, handlerLogic);
    this.items.push({ type: 'query', executor, name });
    return this;
  }

  /**
   * Adds an event handler to the batch.
   * @template T - Event type key
   * @param {string} name - The name of the event handler.
   * @param {T} eventType - The event type.
   * @param {(data: EventData<TEventMap, T>, aggregateId: string, version: number, metadata?: Record<string, any>) => Promise<void>} handlerLogic - The handler logic.
   * @returns {BatchBuilder<TCommandMap, TQueryMap, TEventMap>}
   */
  addEventHandler<T extends EventType<TEventMap>>(
    name: string,
    eventType: T,
    handlerLogic: (
      data: EventData<TEventMap, T>,
      aggregateId: string,
      version: number,
      metadata?: Record<string, any>
    ) => Promise<void>
  ) {
    const executor = TypedEventBuilder.create(this.bus, eventType, handlerLogic);
    this.items.push({ type: 'event', executor, name });
    return this;
  }

  /**
   * Builds the batch and returns an object with all executors.
   * @returns {object}
   */
  build() {
    const result: Record<string, any> = {};
    this.items.forEach(item => {
      result[item.name] = item.executor;
    });
    return result;
  }
}

/** ================================================================================
 * Fluent API builder for TypeBus-CQRS.
    ================================================================================  */
export class FluentBuilder<
  TCommandMap extends Record<string, any> = any,
  TQueryMap extends Record<string, any> = any,
  TEventMap extends Record<string, any> = any
> {
  constructor(private bus: TypeBus<TCommandMap, TQueryMap, TEventMap>) {}

  /**
   * Creates a command with fluent API.
   * @template T - Command type key
   * @param {T} commandType - The command type.
   * @returns {object} Fluent command builder.
   */
  command<T extends CommandType<TCommandMap>>(commandType: T) {
    return {
      handle: (
        handlerLogic: (
          data: CommandData<TCommandMap, T>,
          aggregateId: string,
          metadata?: Record<string, any>
        ) => Promise<CommandResult<TCommandMap, T>>
      ) => {
        return TypedCommandBuilder.create(this.bus, commandType, handlerLogic);
      }
    };
  }

  /**
   * Creates a query with fluent API.
   * @template T - Query type key
   * @param {T} queryType - The query type.
   * @returns {object} Fluent query builder.
   */
  query<T extends QueryType<TQueryMap>>(queryType: T) {
    return {
      handle: (
        handlerLogic: (
          params: QueryParams<TQueryMap, T>,
          metadata?: Record<string, any>
        ) => Promise<QueryResult<TQueryMap, T>>
      ) => {
        return TypedQueryBuilder.create(this.bus, queryType, handlerLogic);
      }
    };
  }

  /**
   * Creates an event handler with fluent API.
   * @template T - Event type key
   * @param {T} eventType - The event type.
   * @returns {object} Fluent event builder.
   */
  event<T extends EventType<TEventMap>>(eventType: T) {
    return {
      handle: (
        handlerLogic: (
          data: EventData<TEventMap, T>,
          aggregateId: string,
          version: number,
          metadata?: Record<string, any>
        ) => Promise<void>
      ) => {
        return TypedEventBuilder.create(this.bus, eventType, handlerLogic);
      }
    };
  }

  /**
   * Creates a batch builder.
   * @returns {BatchBuilder<TCommandMap, TQueryMap, TEventMap>}
   */
  batch() {
    return new BatchBuilder(this.bus);
  }
}

// ================================================================================
// Factory Functions
// ================================================================================

/**
 * Creates and registers a command handler.
 * @template TCommandMap - Command map type
 * @template T - Command type key
 * @param {TypeBus<TCommandMap, any, any>} bus - The TypeBus-CQRS instance.
 * @param {T} commandType - The command type.
 * @param {(data: CommandData<TCommandMap, T>, aggregateId: string, metadata?: Record<string, any>) => Promise<CommandResult<TCommandMap, T>>} handlerLogic - The handler logic.
 * @returns {object} Command executor.
 */
export function createCommand<TCommandMap extends Record<string, any> = any, T extends CommandType<TCommandMap> = CommandType<TCommandMap>>(
  bus: TypeBus<TCommandMap, any, any>,
  commandType: T,
  handlerLogic: (
    data: CommandData<TCommandMap, T>,
    aggregateId: string,
    metadata?: Record<string, any>
  ) => Promise<CommandResult<TCommandMap, T>>
) {
  return TypedCommandBuilder.create(bus, commandType, handlerLogic);
}

/**
 * Creates and registers a query handler.
 * @template TQueryMap - Query map type
 * @template T - Query type key
 * @param {TypeBus<any, TQueryMap, any>} bus - The TypeBus-CQRS instance.
 * @param {T} queryType - The query type.
 * @param {(params: QueryParams<TQueryMap, T>, metadata?: Record<string, any>) => Promise<QueryResult<TQueryMap, T>>} handlerLogic - The handler logic.
 * @returns {object} Query executor.
 */
export function createQuery<TQueryMap extends Record<string, any> = any, T extends QueryType<TQueryMap> = QueryType<TQueryMap>>(
  bus: TypeBus<any, TQueryMap, any>,
  queryType: T,
  handlerLogic: (params: QueryParams<TQueryMap, T>, metadata?: Record<string, any>) => Promise<QueryResult<TQueryMap, T>>
) {
  return TypedQueryBuilder.create(bus, queryType, handlerLogic);
}

/**
 * Creates and registers an event handler.
 * @template TEventMap - Event map type
 * @template T - Event type key
 * @param {TypeBus<any, any, TEventMap>} bus - The TypeBus-CQRS instance.
 * @param {T} eventType - The event type.
 * @param {(data: EventData<TEventMap, T>, aggregateId: string, version: number, metadata?: Record<string, any>) => Promise<void>} handlerLogic - The handler logic.
 * @returns {object} Event publisher.
 */
export function createEventHandler<TEventMap extends Record<string, any> = any, T extends EventType<TEventMap> = EventType<TEventMap>>(
  bus: TypeBus<any, any, TEventMap>,
  eventType: T,
  handlerLogic: (
    data: EventData<TEventMap, T>,
    aggregateId: string,
    version: number,
    metadata?: Record<string, any>
  ) => Promise<void>
) {
  return TypedEventBuilder.create(bus, eventType, handlerLogic);
}

/**
 * Creates a fluent API builder.
 * @template TCommandMap - Command map type
 * @template TQueryMap - Query map type
 * @template TEventMap - Event map type
 * @param {TypeBus<TCommandMap, TQueryMap, TEventMap>} bus - The TypeBus-CQRS instance.
 * @returns {FluentBuilder<TCommandMap, TQueryMap, TEventMap>}
 */
export function createFluentBuilder<
  TCommandMap extends Record<string, any> = any,
  TQueryMap extends Record<string, any> = any,
  TEventMap extends Record<string, any> = any
>(bus: TypeBus<TCommandMap, TQueryMap, TEventMap>) {
  return new FluentBuilder(bus);
}
