import { ErrorResponseSchema, type ErrorResponse } from "@{{PACKAGE_NAME}}/shared";

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;
  readonly correlationId: string;

  constructor({
    status,
    response
  }: {
    status: number;
    response: ErrorResponse;
  }) {
    super(response.error.message);
    this.name = "ApiError";
    this.code = response.error.code;
    this.status = status;
    this.details = response.error.details;
    this.correlationId = response.error.correlationId;
  }
}

export function parseErrorResponse(value: unknown, fallbackCorrelationId: string): ErrorResponse {
  const parsed = ErrorResponseSchema.safeParse(value);

  if (parsed.success) {
    return parsed.data;
  }

  return {
    error: {
      code: "HTTP_ERROR",
      message: "Nao foi possivel concluir a operacao.",
      details: {},
      correlationId: fallbackCorrelationId
    }
  };
}
