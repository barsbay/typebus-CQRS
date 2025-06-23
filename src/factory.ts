// factory.ts - Фабричные функции для TypeBus-CQRS
import { TypeBus } from './core/TypeBus';
import { createFluentBuilder } from './builders/TypedBuilders';
import { withLogging } from './middleware';

/**
 * Factory function for creating a configured TypeBus-CQRS instance.
 * @template TCommandMap - Command map type
 * @template TQueryMap - Query map type
 * @template TEventMap - Event map type
 * @param {Object} [config] - Optional configuration for the TypeBus-CQRS instance.
 * @param {boolean} [config.enableLogging] - Enable logging middleware.
 * @param {'info'|'debug'|'verbose'} [config.logLevel] - Logging level.
 * @returns {TypeBus<TCommandMap, TQueryMap, TEventMap>} TypeBus-CQRS instance
 */
export function createTypeBus<
  TCommandMap extends Record<string, any> = any,
  TQueryMap extends Record<string, any> = any,
  TEventMap extends Record<string, any> = any
>(config?: {
  enableLogging?: boolean;
  logLevel?: 'info' | 'debug' | 'verbose';
}): TypeBus<TCommandMap, TQueryMap, TEventMap> {
  const bus = new TypeBus<TCommandMap, TQueryMap, TEventMap>({
    enableLogging: config?.enableLogging ?? true,
    logLevel: config?.logLevel ?? 'info'
  });

  if (config?.enableLogging) {
    bus.use(withLogging({ 
      level: config.logLevel,
      includeData: config.logLevel === 'debug' 
    }));
  }

  return bus;
}

/**
 * Utility function for creating a fluent API builder for TypeBus-CQRS.
 * @template TCommandMap - Command map type
 * @template TQueryMap - Query map type
 * @template TEventMap - Event map type
 * @param {TypeBus<TCommandMap, TQueryMap, TEventMap>} bus - The TypeBus-CQRS instance.
 * @returns {ReturnType<typeof createFluentBuilder<TCommandMap, TQueryMap, TEventMap>>}
 */
export function fluent<
  TCommandMap extends Record<string, any> = any,
  TQueryMap extends Record<string, any> = any,
  TEventMap extends Record<string, any> = any
>(bus: TypeBus<TCommandMap, TQueryMap, TEventMap>) {
  return createFluentBuilder(bus);
}
