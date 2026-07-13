import { ApiError, parseErrorResponse } from "./api-error";
import { appLogger, createCorrelationId } from "./logger";

type FetchJsonOptions = RequestInit & {
  event?: string;
};

export async function fetchJson<T>(url: string, options: FetchJsonOptions = {}): Promise<T> {
  const correlationId = createCorrelationId("web-request");
  const event = options.event ?? "http-request";
  const startedAt = performance.now();

  appLogger.decision({
    event: `${event}-started`,
    decision: "fetch-json",
    reason: "user-or-page-request",
    correlationId,
    method: options.method ?? "GET",
    url
  });

  const headers = new Headers(options.headers);
  headers.set("x-correlation-id", correlationId);

  const response = await fetch(url, {
    ...options,
    headers
  });
  const durationMs = Math.round(performance.now() - startedAt);

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const errorResponse = parseErrorResponse(body, correlationId);
    const error = new ApiError({
      status: response.status,
      response: errorResponse
    });
    appLogger.failure(
      {
        event: `${event}-failed`,
        correlationId,
        method: options.method ?? "GET",
        url,
        statusCode: response.status,
        durationMs,
        errorCode: error.code
      },
      error
    );
    throw error;
  }

  appLogger.info({
    event: `${event}-succeeded`,
    correlationId,
    method: options.method ?? "GET",
    url,
    statusCode: response.status,
    durationMs
  });

  return response.json() as Promise<T>;
}
