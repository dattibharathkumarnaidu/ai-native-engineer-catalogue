import type { Logger } from '../ports/Logger.js';

/** Minimal structured (JSON-line) logger; swap for pino when observability matters. */
export const consoleLogger: Logger = {
  info: (message, meta) => console.log(JSON.stringify({ level: 'info', message, ...meta })),
  warn: (message, meta) => console.warn(JSON.stringify({ level: 'warn', message, ...meta })),
  error: (message, meta) => console.error(JSON.stringify({ level: 'error', message, ...meta })),
};

export const silentLogger: Logger = { info() {}, warn() {}, error() {} };
