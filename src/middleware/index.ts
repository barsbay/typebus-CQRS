// middleware/index.ts - Экспорт всех middleware
import { LoggingMiddleware } from './LoggingMiddleware';

export * from './LoggingMiddleware';

/**
 * Helper function to quickly set up logging middleware.
 * @param {Object} [options]
 * @param {'info'|'debug'|'verbose'} [options.level]
 * @param {boolean} [options.includeData]
 * @returns {LoggingMiddleware}
 */
export function withLogging(options?: {
  level?: 'info' | 'debug' | 'verbose';
  includeData?: boolean;
}) {
  return new LoggingMiddleware({
    logLevel: options?.level || 'info',
    includeData: options?.includeData || false,
    includeMetadata: true,
    colorOutput: true
  });
}
