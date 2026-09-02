export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
  durationMs?: number;
  [key: string]: any;
}

class Logger {
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private colorize(level: LogLevel, text: string): string {
    const colors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // Cyan
      info: '\x1b[32m',  // Green
      warn: '\x1b[33m',  // Yellow
      error: '\x1b[31m', // Red
    };
    const reset = '\x1b[0m';
    return `${colors[level] || ''}${text}${reset}`;
  }

  private output(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = this.formatTimestamp();
    const formattedLevel = `[${level.toUpperCase()}]`.padEnd(7);
    const coloredLevel = this.colorize(level, formattedLevel);
    const reqInfo = context?.requestId ? `[${context.requestId}] ` : '';
    const ctxString = context && Object.keys(context).length > 0 ? ` ${JSON.stringify(context)}` : '';

    const line = `${timestamp} ${coloredLevel} ${reqInfo}${message}${ctxString}`;

    if (level === 'error') {
      console.error(line);
    } else if (level === 'warn') {
      console.warn(line);
    } else {
      console.log(line);
    }
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production') {
      this.output('debug', message, context);
    }
  }

  info(message: string, context?: LogContext) {
    this.output('info', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.output('warn', message, context);
  }

  error(message: string, error?: Error | any, context?: LogContext) {
    const enrichedContext = {
      ...context,
      errorMessage: error?.message || error,
      stack: error?.stack,
    };
    this.output('error', message, enrichedContext);
  }
}

export const logger = new Logger();
