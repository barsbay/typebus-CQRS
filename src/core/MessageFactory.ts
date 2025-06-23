import {
  ICommand,
  IQuery,
  IEvent,
  CommandType,
  QueryType,
  EventType,
  CommandData,
  QueryParams,
  EventData
} from '../types';

/**
 * Factory class for creating message instances.
 * Handles the creation of commands, queries, and events with proper typing.
 */
export class MessageFactory {
  /**
   * Creates a command message.
   * @template TCommandMap - Command map type
   * @template T - Command type key
   * @param {T} type - The command type.
   * @param {CommandData<TCommandMap, T>} data - The command data.
   * @param {string} aggregateId - The aggregate ID.
   * @param {Record<string, any>} [metadata] - Optional metadata.
   * @returns {ICommand<TCommandMap, T>} The created command.
   */
  createCommand<TCommandMap extends Record<string, any> = any, T extends CommandType<TCommandMap> = CommandType<TCommandMap>>(
    type: T,
    data: CommandData<TCommandMap, T>,
    aggregateId: string,
    metadata?: Record<string, any>
  ): ICommand<TCommandMap, T> {
    return {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      data,
      aggregateId,
      metadata
    };
  }

  /**
   * Creates a query message.
   * @template TQueryMap - Query map type
   * @template T - Query type key
   * @param {T} type - The query type.
   * @param {QueryParams<TQueryMap, T>} params - The query parameters.
   * @param {Record<string, any>} [metadata] - Optional metadata.
   * @returns {IQuery<TQueryMap, T>} The created query.
   */
  createQuery<TQueryMap extends Record<string, any> = any, T extends QueryType<TQueryMap> = QueryType<TQueryMap>>(
    type: T,
    params: QueryParams<TQueryMap, T>,
    metadata?: Record<string, any>
  ): IQuery<TQueryMap, T> {
    return {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      params,
      metadata
    };
  }

  /**
   * Creates an event message.
   * @template TEventMap - Event map type
   * @template T - Event type key
   * @param {T} type - The event type.
   * @param {EventData<TEventMap, T>} data - The event data.
   * @param {string} aggregateId - The aggregate ID.
   * @param {number} version - The event version.
   * @param {Record<string, any>} [metadata] - Optional metadata.
   * @returns {IEvent<TEventMap, T>} The created event.
   */
  createEvent<TEventMap extends Record<string, any> = any, T extends EventType<TEventMap> = EventType<TEventMap>>(
    type: T,
    data: EventData<TEventMap, T>,
    aggregateId: string,
    version: number,
    metadata?: Record<string, any>
  ): IEvent<TEventMap, T> {
    return {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      data,
      aggregateId,
      version,
      metadata
    };
  }

  /**
   * Generates a unique message ID.
   * @returns {string} A unique message ID.
   */
  private generateId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
