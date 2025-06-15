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
 * @template T
 * @typedef {IMessage & { type: T, data: CommandData<T>, aggregateId: string }} ICommand
 */
export interface ICommand<T extends CommandType = CommandType> extends IMessage {
  readonly type: T;
  readonly data: CommandData<T>;
  readonly aggregateId: string;
}

/**
 * Interface for query messages.
 * @template T
 * @typedef {IMessage & { type: T, params: QueryParams<T> }} IQuery
 */
export interface IQuery<T extends QueryType = QueryType> extends IMessage {
  readonly type: T;
  readonly params: QueryParams<T>;
}

/**
 * Interface for event messages.
 * @template T
 * @typedef {IMessage & { type: T, data: EventData<T>, aggregateId: string, version: number }} IEvent
 */
export interface IEvent<T extends EventType = EventType> extends IMessage {
  readonly type: T;
  readonly data: EventData<T>;
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
 * @typedef {Object} IMessageBus
 * @property {(type: T, data: CommandData<T>, aggregateId: string, metadata?: Record<string, any>) => Promise<CommandResult<T>>} executeCommand
 * @property {(type: T, params: QueryParams<T>, metadata?: Record<string, any>) => Promise<QueryResult<T>>} executeQuery
 * @property {(type: T, data: EventData<T>, aggregateId: string, version: number, metadata?: Record<string, any>) => Promise<void>} publishEvent
 * @property {(middleware: IMiddleware) => void} use
 * @property {() => void} clear
 */
export interface IMessageBus {
  executeCommand<T extends CommandType>(
    type: T,
    data: CommandData<T>,
    aggregateId: string,
    metadata?: Record<string, any>
  ): Promise<CommandResult<T>>;
  
  executeQuery<T extends QueryType>(
    type: T,
    params: QueryParams<T>,
    metadata?: Record<string, any>
  ): Promise<QueryResult<T>>;
  
  publishEvent<T extends EventType>(
    type: T,
    data: EventData<T>,
    aggregateId: string,
    version: number,
    metadata?: Record<string, any>
  ): Promise<void>;
  
  use(middleware: IMiddleware): void;
  clear(): void;
}
