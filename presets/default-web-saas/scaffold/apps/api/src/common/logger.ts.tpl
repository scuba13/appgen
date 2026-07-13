import type { LoggerService } from "@nestjs/common";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | JsonValue[]
  | { [key: string]: JsonValue };

export type LogFields = {
  event: string;
  correlationId?: string;
  [key: string]: JsonValue;
};

type LogLevel = "debug" | "info" | "warn" | "error";

const REDACTED_KEYS = new Set([
  "authorization",
  "cookie",
  "password",
  "secret",
  "token"
]);

function sanitize(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    return value.map(item => sanitize(item));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        REDACTED_KEYS.has(key.toLowerCase()) ? "[redacted]" : sanitize(item)
      ])
    );
  }

  return value;
}

export function serializeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack
    };
  }

  return {
    name: "UnknownError",
    message: String(error)
  };
}

export class AppLogger implements LoggerService {
  constructor(private readonly context = "{{PACKAGE_NAME}}-api") {}

  child(context: string) {
    return new AppLogger(context);
  }

  debug(messageOrFields: string | LogFields, context?: string) {
    this.write("debug", this.normalize(messageOrFields, context, "framework-debug"));
  }

  info(fields: LogFields) {
    this.write("info", fields);
  }

  warn(messageOrFields: string | LogFields, context?: string) {
    this.write("warn", this.normalize(messageOrFields, context, "framework-warn"));
  }

  decision(fields: LogFields & { decision: string; reason: string }) {
    this.write("info", fields);
  }

  failure(fields: LogFields, error: unknown) {
    this.write("error", {
      ...fields,
      error: serializeError(error)
    });
  }

  log(message: string, context?: string) {
    this.info({
      event: "framework-log",
      message,
      context: context ?? this.context
    });
  }

  error(message: string, trace?: string, context?: string) {
    this.write("error", {
      event: "framework-error",
      message,
      stack: trace,
      context: context ?? this.context
    });
  }

  verbose(message: string, context?: string) {
    this.write("debug", this.normalize(message, context, "framework-verbose"));
  }

  private normalize(messageOrFields: string | LogFields, context: string | undefined, event: string): LogFields {
    if (typeof messageOrFields === "string") {
      return {
        event,
        message: messageOrFields,
        context: context ?? this.context
      };
    }

    return messageOrFields;
  }

  private write(level: LogLevel, fields: LogFields) {
    const entry = sanitize({
      ts: new Date().toISOString(),
      level,
      context: this.context,
      ...fields
    });
    const line = JSON.stringify(entry);

    if (level === "error") {
      console.error(line);
    } else if (level === "warn") {
      console.warn(line);
    } else {
      console.log(line);
    }
  }
}

export const appLogger = new AppLogger();
