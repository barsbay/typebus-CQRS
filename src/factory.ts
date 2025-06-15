// factory.ts - Фабричные функции для TypeBus-CQRS
import { TypeBus } from './core/TypeBus';
import { createFluentBuilder } from './builders/TypedBuilders';
import { withLogging } from './middleware';

/**
 * Factory function for creating a configured TypeBus-CQRS instance.
 * @param {Object} [config] - Optional configuration for the TypeBus-CQRS instance.
 * @param {boolean} [config.enableLogging] - Enable logging middleware.
 * @param {'info'|'debug'|'verbose'} [config.logLevel] - Logging level.
 * @returns {TypeBus} TypeBus-CQRS instance
 */
export function createTypeBus(config?: {
  enableLogging?: boolean;
  logLevel?: 'info' | 'debug' | 'verbose';
}): TypeBus {
  const bus = new TypeBus({
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
 * @param {TypeBus} bus - The TypeBus-CQRS instance.
 * @returns {ReturnType<typeof createFluentBuilder>}
 */
export function fluent(bus: TypeBus) {
  return createFluentBuilder(bus);
}
