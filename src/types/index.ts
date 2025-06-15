// types/index.ts - Экспорт всех типов
export * from './MessageMaps';
export * from './Messages';

/**
 * Awaitable type. Represents a value or a Promise of that value.
 * @template T
 * @typedef {T | Promise<T>} Awaitable
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * Makes some properties of T optional.
 * @template T, K
 * @typedef {Omit<T, K> & Partial<Pick<T, K>>} Optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Makes some properties of T required.
 * @template T, K
 * @typedef {T & Required<Pick<T, K>>} RequiredFields
 */
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Configuration options for TypeBus-CQRS.
 * @typedef {Object} TypeBusConfig
 * @property {boolean} [enableMetrics]
 * @property {boolean} [enableLogging]
 * @property {'info'|'debug'|'verbose'|'error'} [logLevel]
 * @property {number} [maxMiddleware]
 * @property {number} [commandTimeout]
 * @property {number} [queryTimeout]
 */
export interface TypeBusConfig {
  enableMetrics?: boolean;
  enableLogging?: boolean;
  logLevel?: 'info' | 'debug' | 'verbose' | 'error';
  maxMiddleware?: number;
  commandTimeout?: number;
  queryTimeout?: number;
}

// Импортируем IMessageBus из Messages
import { IMessageBus } from './Messages';

/**
 * Interface for TypeBus-CQRS modules.
 * @typedef {Object} ITypeBusModule
 * @property {string} name
 * @property {string} [version]
 * @property {(bus: IMessageBus) => void | Promise<void>} configure
 */
export interface ITypeBusModule {
  name: string;
  version?: string;
  configure(bus: IMessageBus): void | Promise<void>;
}

/**
 * Interface for TypeBus-CQRS extensions.
 * @typedef {Object} ITypeBusExtension
 * @property {string} name
 * @property {(bus: IMessageBus) => void} install
 * @property {(bus: IMessageBus) => void} [uninstall]
 */
export interface ITypeBusExtension {
  name: string;
  install(bus: IMessageBus): void;
  uninstall?(bus: IMessageBus): void;
}
