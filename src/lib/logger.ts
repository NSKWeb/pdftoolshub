type LogMeta = Record<string, unknown>;

function jsonMeta(meta?: LogMeta): string {
  if (!meta) return "";
  try {
    return ` ${JSON.stringify(meta)}`;
  } catch {
    return "";
  }
}

export const logger = {
  info: (message: string, meta?: LogMeta) =>
    console.info(`[info] ${message}${jsonMeta(meta)}`),
  warn: (message: string, meta?: LogMeta) =>
    console.warn(`[warn] ${message}${jsonMeta(meta)}`),
  error: (message: string, meta?: LogMeta) =>
    console.error(`[error] ${message}${jsonMeta(meta)}`)
};

export function createRequestLogger(requestId: string) {
  const prefix = `[req:${requestId}]`;
  return {
    info: (meta: LogMeta, message: string) =>
      logger.info(`${prefix} ${message}`, meta),
    warn: (meta: LogMeta, message: string) =>
      logger.warn(`${prefix} ${message}`, meta),
    error: (meta: LogMeta, message: string) =>
      logger.error(`${prefix} ${message}`, meta)
  };
}