import { HttpStatus } from "@nestjs/common";

export type AppErrorOptions = {
  code: string;
  message: string;
  status?: number;
  details?: Record<string, unknown>;
};

export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details: Record<string, unknown>;

  constructor({
    code,
    message,
    status = HttpStatus.BAD_REQUEST,
    details = {}
  }: AppErrorOptions) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
