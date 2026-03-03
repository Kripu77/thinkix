export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

export interface LogContext {
  [key: string]: unknown;
}

let cachedIsDev: boolean | undefined;

function getIsDevelopment(): boolean {
  if (cachedIsDev !== undefined) {
    return cachedIsDev;
  }
  
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    cachedIsDev = true;
    return true;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    cachedIsDev = hostname === 'localhost' || hostname === '127.0.0.1';
    return cachedIsDev;
  }
  cachedIsDev = false;
  return false;
}

class Logger {
  private packageName: string;
  
  constructor(packageName: string = 'thinkix') {
    this.packageName = packageName;
  }
  
  private get isDev(): boolean {
    return getIsDevelopment();
  }
  
  log(level: LogLevel, message: string, context?: LogContext) {
    const prefix = `[${this.packageName}]`;
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    
    if (this.isDev) {
      const logFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
      logFn(`${prefix} ${message}${contextStr}`);
    }
    
    if (typeof window !== 'undefined' && (level === 'error' || level === 'warn')) {
      this.captureForAnalytics(level, message, context);
    }
  }
  
  error(message: string, error?: Error, context?: LogContext) {
    const errorContext = error 
      ? { ...context, error: error.message, stack: error.stack }
      : context;
    this.log('error', message, errorContext);
  }
  
  warn(message: string, context?: LogContext) {
    this.log('warn', message, context);
  }
  
  info(message: string, context?: LogContext) {
    this.log('info', message, context);
  }
  
  debug(message: string, context?: LogContext) {
    if (this.isDev) {
      this.log('debug', message, context);
    }
  }
  
  private captureForAnalytics(level: LogLevel, message: string, context?: LogContext) {
    if (typeof window !== 'undefined' && 'posthog' in window) {
      try {
        const posthog = (window as { posthog?: { capture: (event: string, data?: Record<string, unknown>) => void } }).posthog;
        posthog?.capture(`${this.packageName}_${level}`, {
          message,
          ...context,
        });
      } catch {
        // Silently fail if posthog is not available
      }
    }
  }
}

export function createLogger(packageName: string): Logger {
  return new Logger(packageName);
}

export { Logger };

export const logger = new Logger('thinkix');
