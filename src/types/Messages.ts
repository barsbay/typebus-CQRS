// types/Messages.ts - Базовые интерфейсы сообщений
import { 
  CommandType, 
  QueryType, 
  EventType, 
  CommandData, 
  CommandResult,
  QueryParams, 
  QueryResult,
  EventData 
} from './MessageMaps';

/**
 * Base interface for all messages.
 * @typedef {Object} IMessage
 * @property {string} id
 * @property {string} type
 * @property {Date} timestamp
 * @property {Record<string, any>} [metadata]
 */
export interface IMessage {
  readonly id: string;
  readonly type: string;
  readonly timestamp: Date;
  readonly metadata?: Record<string, any>;
}

/**
 * Interface for command messages.
 * @template T - Command map type
 * @template K - Command type key
 * @typedef {IMessage & { type: K, data: CommandData<T, K>, aggregateId: string }} ICommand
 */
export interface ICommand<T extends Record<string, any> = any, K extends keyof T & string = keyof T & string> extends IMessage {
  readonly type: K;
  readonly data: CommandData<T, K>;
  readonly aggregateId: string;
}

/**
 * Interface for query messages.
 * @template T - Query map type
 * @template K - Query type key
 * @typedef {IMessage & { type: K, params: QueryParams<T, K> }} IQuery
 */
export interface IQuery<T extends Record<string, any> = any, K extends keyof T & string = keyof T & string> extends IMessage {
  readonly type: K;
  readonly params: QueryParams<T, K>;
}

/**
 * Interface for event messages.
 * @template T - Event map type
 * @template K - Event type key
 * @typedef {IMessage & { type: K, data: EventData<T, K>, aggregateId: string, version: number }} IEvent
 */
export interface IEvent<T extends Record<string, any> = any, K extends keyof T & string = keyof T & string> extends IMessage {
  readonly type: K;
  readonly data: EventData<T, K>;
  readonly aggregateId: string;
  readonly version: number;
}

/**
 * Interface for message handlers.
 * @template TMessage, TResult
 * @typedef {Object} IMessageHandler
 * @property {(message: TMessage) => Promise<TResult>} handle
 */
export interface IMessageHandler<TMessage extends IMessage = IMessage, TResult = any> {
  handle(message: TMessage): Promise<TResult>;
}

/**
 * Interface for middleware.
 * @typedef {Object} IMiddleware
 * @property {(message: T, next: (message: T) => Promise<R>) => Promise<R>} execute
 */
export interface IMiddleware {
  execute<T extends IMessage, R = any>(
    message: T,
    next: (message: T) => Promise<R>
  ): Promise<R>;
}

/**
 * Interface for the message bus.
 * @template TCommandMap - Command map type
 * @template TQueryMap - Query map type
 * @template TEventMap - Event map type
 * @typedef {Object} IMessageBus
 */
export interface IMessageBus<
  TCommandMap extends Record<string, any> = any,
  TQueryMap extends Record<string, any> = any,
  TEventMap extends Record<string, any> = any
> {
  executeCommand<T extends CommandType<TCommandMap>>(
    type: T,
    data: CommandData<TCommandMap, T>,
    aggregateId: string,
    metadata?: Record<string, any>
  ): Promise<CommandResult<TCommandMap, T>>;
  
  executeQuery<T extends QueryType<TQueryMap>>(
    type: T,
    params: QueryParams<TQueryMap, T>,
    metadata?: Record<string, any>
  ): Promise<QueryResult<TQueryMap, T>>;
  
  publishEvent<T extends EventType<TEventMap>>(
    type: T,
    data: EventData<TEventMap, T>,
    aggregateId: string,
    version: number,
    metadata?: Record<string, any>
  ): Promise<void>;
  
  use(middleware: IMiddleware): void;
  clear(): void;
}
