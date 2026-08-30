import { config, type LogLevel } from "./config";

const levels: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function log(
  level: LogLevel,
  category: string,
  message: string,
  context: Record<string, unknown> = {},
): void {
  if (levels[level] < levels[config.logLevel]) return;
  const record = JSON.stringify({
    time: new Date().toISOString(),
    level,
    category,
    message,
    ...context,
  });
  if (level === "error") console.error(record);
  else if (level === "warn") console.warn(record);
  else console.log(record);
}
