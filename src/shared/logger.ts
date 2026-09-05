import type { LogLevel } from '../config/env.js';

const priorities: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };
type LogData = Readonly<Record<string, boolean | number | string | null>>;

export interface Logger {
  debug(message: string, data?: LogData): void;
  info(message: string, data?: LogData): void;
  warn(message: string, data?: LogData): void;
  error(message: string, data?: LogData): void;
}

export function createLogger(minimumLevel: LogLevel): Logger {
  const write = (level: LogLevel, message: string, data?: LogData): void => {
    if (priorities[level] < priorities[minimumLevel]) return;

    const entry = JSON.stringify({ timestamp: new Date().toISOString(), level, message, ...data });
    if (level === 'error') console.error(entry);
    else if (level === 'warn') console.warn(entry);
    else console.log(entry);
  };

  return {
    debug: (message, data) => write('debug', message, data),
    info: (message, data) => write('info', message, data),
    warn: (message, data) => write('warn', message, data),
    error: (message, data) => write('error', message, data),
  };
}
