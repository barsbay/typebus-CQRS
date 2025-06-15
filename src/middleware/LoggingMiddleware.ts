//[TYPEBUS-CQRS]
//|_|_|_|_|
// o     o
import { IMiddleware, IMessage } from '../types';

/**
 * Options for configuring the LoggingMiddleware.
 * @typedef {Object} LoggingOptions
 * @property {'info'|'debug'|'verbose'|'error'} [logLevel]
 * @property {boolean} [includeData]
 * @property {boolean} [includeMetadata]
 * @property {boolean} [colorOutput]
 * @property {number} [maxDataLength]
 */
export interface LoggingOptions {
  logLevel?: 'info' | 'debug' | 'verbose' | 'error';
  includeData?: boolean;
  includeMetadata?: boolean;
  colorOutput?: boolean;
  maxDataLength?: number;
}

/**
 * Middleware for logging message execution in TypeBus-CQRS.
 * @implements {IMiddleware}
 */
export class LoggingMiddleware implements IMiddleware {
  private options: Required<LoggingOptions>;

  /**
   * Creates a new LoggingMiddleware instance.
   * @param {LoggingOptions} [options]
   */
  constructor(options: LoggingOptions = {}) {
    this.options = {
      logLevel: 'info',
      includeData: false,
      includeMetadata: false,
      colorOutput: true,
      maxDataLength: 200,
      ...options
    };
  }

  /**
   * Executes the middleware logic for logging.
   * @template T, R
   * @param {T} message - The message to process.
   * @param {(message: T) => Promise<R>} next - The next middleware or handler.
   * @returns {Promise<R>}
   */
  async execute<T extends IMessage, R>(message: T, next: (message: T) => Promise<R>): Promise<R> {
    const startTime = process.hrtime.bigint();
    const icon = this.getMessageIcon(message.type);
    if (this.shouldLogStart()) {
      console.log(this.colorize(`${icon} START: ${message.type}`, 'blue'), {
        id: message.id,
        timestamp: message.timestamp.toISOString(),
        ...this.getExtraLogData(message)
      });
    }
    try {
      const result = await next(message);
      const duration = this.getDuration(startTime);
      const color = duration > 1000 ? 'yellow' : 'green';
      console.log(this.colorize(`${icon} SUCCESS: ${message.type}`, color), {
        id: message.id,
        duration: `${duration.toFixed(2)}ms`,
        ...this.getResultLogData(result)
      });
      return result;
    } catch (error) {
      const duration = this.getDuration(startTime);
      console.error(this.colorize(`${icon} ERROR: ${message.type}`, 'red'), {
        id: message.id,
        duration: `${duration.toFixed(2)}ms`,
        error: error instanceof Error ? error.message : String(error),
        ...this.getStackTrace(error)
      });
      throw error;
    }
  }

  /**
   * Determines if the start of message processing should be logged.
   * @returns {boolean}
   */
  private shouldLogStart(): boolean {
    return this.options.logLevel === 'verbose' || this.options.logLevel === 'debug';
  }

  /**
   * Extracts extra log data from the message (data, params, metadata).
   * @param {IMessage} message
   * @returns {object}
   */
  private getExtraLogData(message: IMessage): object {
    const extra: any = {};
    if (this.options.includeData) {
      const data = (message as any).data || (message as any).params;
      if (data) {
        extra.data = this.sanitizeData(data);
      }
    }
    if (this.options.includeMetadata && message.metadata) {
      extra.metadata = message.metadata;
    }
    return extra;
  }

  /**
   * Extracts result log data if logLevel is 'debug'.
   * @param {any} result
   * @returns {object}
   */
  private getResultLogData(result: any): object {
    if (this.options.logLevel !== 'debug') return {};
    return {
      result: this.sanitizeResult(result)
    };
  }

  /**
   * Extracts stack trace from error if logLevel is 'debug'.
   * @param {any} error
   * @returns {object}
   */
  private getStackTrace(error: any): object {
    if (this.options.logLevel !== 'debug') return {};
    return {
      stack: error instanceof Error ? error.stack : undefined
    };
  }

  /**
   * Calculates the duration in milliseconds from the given start time.
   * @param {bigint} startTime
   * @returns {number}
   */
  private getDuration(startTime: bigint): number {
    const endTime = process.hrtime.bigint();
    return Number(endTime - startTime) / 1000000;
  }

  /**
   * Returns an icon based on the message type.
   * @param {string} type
   * @returns {string}
   */
  private getMessageIcon(type: string): string {
    if (this.isCommand(type)) return '📤';
    if (this.isQuery(type)) return '📥';
    if (this.isEvent(type)) return '📢';
    return '💬';
  }

  /**
   * Determines if the message type is a command.
   * @param {string} type
   * @returns {boolean}
   */
  private isCommand(type: string): boolean {
    return (
      type.includes('Command') ||
      type.includes('.Create') ||
      type.includes('.Update') ||
      type.includes('.Delete') ||
      type.includes('.Change')
    );
  }

  /**
   * Determines if the message type is a query.
   * @param {string} type
   * @returns {boolean}
   */
  private isQuery(type: string): boolean {
    return (
      type.includes('Query') ||
      type.includes('.Get') ||
      type.includes('.Search') ||
      type.includes('.Find')
    );
  }

  /**
   * Determines if the message type is an event.
   * @param {string} type
   * @returns {boolean}
   */
  private isEvent(type: string): boolean {
    return (
      type.includes('Event') ||
      type.includes('.Created') ||
      type.includes('.Updated') ||
      type.includes('.Changed')
    );
  }

  /**
   * Adds color to the log output if enabled.
   * @param {string} text
   * @param {string} color
   * @returns {string}
   */
  private colorize(text: string, color: string): string {
    if (!this.options.colorOutput) return text;
    const colors: Record<string, string> = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      reset: '\x1b[0m'
    };
    return `${colors[color] || ''}${text}${colors.reset}`;
  }

  /**
   * Sanitizes data for logging, hiding sensitive fields and limiting length.
   * @param {any} data
   * @returns {any}
   */
  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth', 'authorization'];
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '***HIDDEN***';
      }
    }
    const stringified = JSON.stringify(sanitized);
    if (stringified.length > this.options.maxDataLength) {
      return `${stringified.substring(0, this.options.maxDataLength)}...`;
    }
    return sanitized;
  }

  /**
   * Sanitizes result for logging, limiting length.
   * @param {any} result
   * @returns {any}
   */
  private sanitizeResult(result: any): any {
    if (!result || typeof result !== 'object') return result;
    const stringified = JSON.stringify(result);
    if (stringified.length > this.options.maxDataLength) {
      return `${stringified.substring(0, this.options.maxDataLength)}...`;
    }
    return result;
  }
}
