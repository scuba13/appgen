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

export function createCorrelationId(prefix = "web") {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return `${prefix}-${random}`;
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

export const appLogger = {
  info(fields: LogFields) {
    write("info", fields);
  },
  warn(fields: LogFields) {
    write("warn", fields);
  },
  decision(fields: LogFields & { decision: string; reason: string }) {
    write("info", fields);
  },
  failure(fields: LogFields, error: unknown) {
    write("error", {
      ...fields,
      error: serializeError(error)
    });
  }
};

function write(level: "info" | "warn" | "error", fields: LogFields) {
  const entry = sanitize({
    ts: new Date().toISOString(),
    level,
    source: "{{PACKAGE_NAME}}-web",
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
