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
 * Builder for creating and registering command handlers with TypeBus.
    ================================================================================  */
export class TypedCommandBuilder {
  /**
   * Creates and registers a command handler.
   * @template T
   * @param {TypeBus} bus - The TypeBus instance.
   * @param {T} commandType - The command type.
   * @param {(data: CommandData<T>, aggregateId: string, metadata?: Record<string, any>) => Promise<CommandResult<T>>} handlerLogic - The handler logic.
   * @returns {object} Command executor and handler meta.
   */
  static create<T extends CommandType>(
    bus: TypeBus,
    commandType: T,
    handlerLogic: (
      data: CommandData<T>,
      aggregateId: string,
      metadata?: Record<string, any>
    ) => Promise<CommandResult<T>>
  ) {
    const handler: IMessageHandler<ICommand<T>, CommandResult<T>> = {
      async handle(command: ICommand<T>): Promise<CommandResult<T>> {
        return await handlerLogic(command.data, command.aggregateId, command.metadata);
      }
    };
    bus.registerCommandHandler(commandType, handler);
    return {
      async execute(
        data: CommandData<T>,
        aggregateId: string,
        metadata?: Record<string, any>
      ): Promise<CommandResult<T>> {
        return await bus.executeCommand(commandType, data, aggregateId, metadata);
      },
      type: commandType,
      handler
    };
  }
}

/** ================================================================================
 * Builder for creating and registering query handlers with TypeBus.
    ================================================================================  */
export class TypedQueryBuilder {
  /**
   * Creates and registers a query handler.
   * @template T
   * @param {TypeBus} bus - The TypeBus instance.
   * @param {T} queryType - The query type.
   * @param {(params: QueryParams<T>, metadata?: Record<string, any>) => Promise<QueryResult<T>>} handlerLogic - The handler logic.
   * @returns {object} Query executor and handler meta.
   */
  static create<T extends QueryType>(
    bus: TypeBus,
    queryType: T,
    handlerLogic: (
      params: QueryParams<T>,
      metadata?: Record<string, any>
    ) => Promise<QueryResult<T>>
  ) {
    const handler: IMessageHandler<IQuery<T>, QueryResult<T>> = {
      async handle(query: IQuery<T>): Promise<QueryResult<T>> {
        return await handlerLogic(query.params, query.metadata);
      }
    };
    bus.registerQueryHandler(queryType, handler);
    return {
      async execute(
        params: QueryParams<T>,
        metadata?: Record<string, any>
      ): Promise<QueryResult<T>> {
        return await bus.executeQuery(queryType, params, metadata);
      },
      type: queryType,
      handler
    };
  }
}

/** ================================================================================
 * Builder for creating and registering event handlers with TypeBus.
    ================================================================================  */
export class TypedEventBuilder {
  /**
   * Creates and registers an event handler.
   * @template T
   * @param {TypeBus} bus - The TypeBus instance.
   * @param {T} eventType - The event type.
   * @param {(data: EventData<T>, aggregateId: string, version: number, metadata?: Record<string, any>) => Promise<void>} handlerLogic - The handler logic.
   * @returns {object} Event publisher and handler meta.
   */
  static create<T extends EventType>(
    bus: TypeBus,
    eventType: T,
    handlerLogic: (
      data: EventData<T>,
      aggregateId: string,
      version: number,
      metadata?: Record<string, any>
    ) => Promise<void>
  ) {
    const handler: IMessageHandler<IEvent<T>, void> = {
      async handle(event: IEvent<T>): Promise<void> {
        return await handlerLogic(event.data, event.aggregateId, event.version, event.metadata);
      }
    };
    bus.registerEventHandler(eventType, handler);
    return {
      async publish(
        data: EventData<T>,
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
export class BatchBuilder {
  private items: Array<{
    type: 'command' | 'query' | 'event';
    executor: any;
    name: string;
  }> = [];

  constructor(private bus: TypeBus) {}

  /**
   * Adds a command to the batch.
   * @template T
   * @param {string} name - The name of the command.
   * @param {T} commandType - The command type.
   * @param {(data: CommandData<T>, aggregateId: string, metadata?: Record<string, any>) => Promise<CommandResult<T>>} handlerLogic - The handler logic.
   * @returns {BatchBuilder}
   */
  addCommand<T extends CommandType>(
    name: string,
    commandType: T,
    handlerLogic: (
      data: CommandData<T>,
      aggregateId: string,
      metadata?: Record<string, any>
    ) => Promise<CommandResult<T>>
  ) {
    const executor = TypedCommandBuilder.create(this.bus, commandType, handlerLogic);
    this.items.push({ type: 'command', executor, name });
    return this;
  }

  /**
   * Adds a query to the batch.
   * @template T
   * @param {string} name - The name of the query.
   * @param {T} queryType - The query type.
   * @param {(params: QueryParams<T>, metadata?: Record<string, any>) => Promise<QueryResult<T>>} handlerLogic - The handler logic.
   * @returns {BatchBuilder}
   */
  addQuery<T extends QueryType>(
    name: string,
    queryType: T,
    handlerLogic: (
      params: QueryParams<T>,
      metadata?: Record<string, any>
    ) => Promise<QueryResult<T>>
  ) {
    const executor = TypedQueryBuilder.create(this.bus, queryType, handlerLogic);
    this.items.push({ type: 'query', executor, name });
    return this;
  }

  /**
   * Adds an event handler to the batch.
   * @template T
   * @param {string} name - The name of the event handler.
   * @param {T} eventType - The event type.
   * @param {(data: EventData<T>, aggregateId: string, version: number, metadata?: Record<string, any>) => Promise<void>} handlerLogic - The handler logic.
   * @returns {BatchBuilder}
   */
  addEventHandler<T extends EventType>(
    name: string,
    eventType: T,
    handlerLogic: (
      data: EventData<T>,
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
   * @returns {Record<string, any>}
   */
  build() {
    const result: Record<string, any> = {};
    for (const item of this.items) {
      result[item.name] = item.executor;
    }
    return result;
  }
}

/** ================================================================================
 * Fluent builder for chaining command, query, and event handler creation.
    ================================================================================  */
export class FluentBuilder {
  constructor(private bus: TypeBus) {}

  /**
   * Starts a command builder chain.
   * @template T
   * @param {T} commandType - The command type.
   * @returns {object}
   */
  command<T extends CommandType>(commandType: T) {
    return {
      handle: (
        handlerLogic: (
          data: CommandData<T>,
          aggregateId: string,
          metadata?: Record<string, any>
        ) => Promise<CommandResult<T>>
      ) => {
        return TypedCommandBuilder.create(this.bus, commandType, handlerLogic);
      }
    };
  }

  /**
   * Starts a query builder chain.
   * @template T
   * @param {T} queryType - The query type.
   * @returns {object}
   */
  query<T extends QueryType>(queryType: T) {
    return {
      handle: (
        handlerLogic: (
          params: QueryParams<T>,
          metadata?: Record<string, any>
        ) => Promise<QueryResult<T>>
      ) => {
        return TypedQueryBuilder.create(this.bus, queryType, handlerLogic);
      }
    };
  }

  /**
   * Starts an event builder chain.
   * @template T
   * @param {T} eventType - The event type.
   * @returns {object}
   */
  event<T extends EventType>(eventType: T) {
    return {
      handle: (
        handlerLogic: (
          data: EventData<T>,
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
   * Starts a batch builder chain.
   * @returns {BatchBuilder}
   */
  batch() {
    return new BatchBuilder(this.bus);
  }
}

/** ================================================================================
 * Utility function to create a command builder.
 * @template T
 * @param {TypeBus} bus - The TypeBus instance.
 * @param {T} commandType - The command type.
 * @param {(data: CommandData<T>, aggregateId: string, metadata?: Record<string, any>) => Promise<CommandResult<T>>} handlerLogic - The handler logic.
 * @returns {object}
   ================================================================================ */
export function createCommand<T extends CommandType>(
  bus: TypeBus,
  commandType: T,
  handlerLogic: (
    data: CommandData<T>,
    aggregateId: string,
    metadata?: Record<string, any>
  ) => Promise<CommandResult<T>>
) {
  return TypedCommandBuilder.create(bus, commandType, handlerLogic);
}

/** ================================================================================
 * Utility function to create a query builder.
 * @template T
 * @param {TypeBus} bus - The TypeBus instance.
 * @param {T} queryType - The query type.
 * @param {(params: QueryParams<T>, metadata?: Record<string, any>) => Promise<QueryResult<T>>} handlerLogic - The handler logic.
 * @returns {object}
   ================================================================================ */
export function createQuery<T extends QueryType>(
  bus: TypeBus,
  queryType: T,
  handlerLogic: (params: QueryParams<T>, metadata?: Record<string, any>) => Promise<QueryResult<T>>
) {
  return TypedQueryBuilder.create(bus, queryType, handlerLogic);
}

/** ================================================================================
 * Utility function to create an event handler builder.
 * @template T
 * @param {TypeBus} bus - The TypeBus instance.
 * @param {T} eventType - The event type.
 * @param {(data: EventData<T>, aggregateId: string, version: number, metadata?: Record<string, any>) => Promise<void>} handlerLogic - The handler logic.
 * @returns {object}
   ================================================================================  */
export function createEventHandler<T extends EventType>(
  bus: TypeBus,
  eventType: T,
  handlerLogic: (
    data: EventData<T>,
    aggregateId: string,
    version: number,
    metadata?: Record<string, any>
  ) => Promise<void>
) {
  return TypedEventBuilder.create(bus, eventType, handlerLogic);
}

/** ================================================================================
 * Utility function to create a fluent builder for TypeBus.
 * @param {TypeBus} bus - The TypeBus instance.
 * @returns {FluentBuilder}
   ================================================================================  */
export function createFluentBuilder(bus: TypeBus) {
  return new FluentBuilder(bus);
}
