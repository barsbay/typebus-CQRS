
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
 * Factory for creating type-safe command, query, and event messages.
 */
export class MessageFactory {
  /**
   * Generates a unique message ID.
   * @returns {string}
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates a command message object.
   * @template T
   * @param {T} type - Command type
   * @param {CommandData<T>} data - Command data
   * @param {string} aggregateId - Aggregate ID
   * @param {Record<string, any>} [metadata] - Optional metadata
   * @returns {ICommand<T>}
   */
  createCommand<T extends CommandType>(
    type: T,
    data: CommandData<T>,
    aggregateId: string,
    metadata?: Record<string, any>
  ): ICommand<T> {
    return {
      id: this.generateId(),
      type,
      data,
      aggregateId,
      timestamp: new Date(),
      metadata
    };
  }

  /**
   * Creates a query message object.
   * @template T
   * @param {T} type - Query type
   * @param {QueryParams<T>} params - Query parameters
   * @param {Record<string, any>} [metadata] - Optional metadata
   * @returns {IQuery<T>}
   */
  createQuery<T extends QueryType>(
    type: T,
    params: QueryParams<T>,
    metadata?: Record<string, any>
  ): IQuery<T> {
    return {
      id: this.generateId(),
      type,
      params,
      timestamp: new Date(),
      metadata
    };
  }

  /**
   * Creates an event message object.
   * @template T
   * @param {T} type - Event type
   * @param {EventData<T>} data - Event data
   * @param {string} aggregateId - Aggregate ID
   * @param {number} version - Event version
   * @param {Record<string, any>} [metadata] - Optional metadata
   * @returns {IEvent<T>}
   */
  createEvent<T extends EventType>(
    type: T,
    data: EventData<T>,
    aggregateId: string,
    version: number,
    metadata?: Record<string, any>
  ): IEvent<T> {
    return {
      id: this.generateId(),
      type,
      data,
      aggregateId,
      version,
      timestamp: new Date(),
      metadata
    };
  }
}
