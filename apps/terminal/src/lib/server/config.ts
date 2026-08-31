import { Ae2Client } from "@ae2-terminal/ae2-api";

export const config = {
  iconPackDir: process.env.ICON_PACK_DIR?.trim() || null,
  logLevel: parseLogLevel(process.env.LOG_LEVEL),
  publicMode: process.env.PUBLIC_MODE?.toLowerCase() === "true",
  upstreamUrl: process.env.UPSTREAM_URL?.trim() || "http://gtnh:2324",
} as const;

export const ae2 = new Ae2Client({ baseUrl: config.upstreamUrl });

export type LogLevel = "debug" | "info" | "warn" | "error";

function parseLogLevel(value: string | undefined): LogLevel {
  if (
    value === "debug" ||
    value === "info" ||
    value === "warn" ||
    value === "error"
  )
    return value;
  return "error";
}
