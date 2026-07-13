import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { AppError } from "./app-error";
import { appLogger } from "./logger";

type HttpRequestLike = {
  headers?: Record<string, string | string[] | undefined>;
  method?: string;
  url?: string;
};

type HttpResponseLike = {
  status: (statusCode: number) => {
    json: (body: unknown) => void;
  };
};

function firstHeader(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function correlationIdFrom(request: HttpRequestLike): string {
  return firstHeader(request.headers?.["x-correlation-id"]) ?? randomUUID();
}

function safeMessage(status: number): string {
  if (status === HttpStatus.UNAUTHORIZED) return "Autenticacao obrigatoria.";
  if (status === HttpStatus.FORBIDDEN) return "Voce nao tem permissao para esta acao.";
  if (status === HttpStatus.NOT_FOUND) return "Recurso nao encontrado.";
  return "Nao foi possivel concluir a operacao.";
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly logger = appLogger.child("http-error-filter");

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const request = http.getRequest<HttpRequestLike>();
    const response = http.getResponse<HttpResponseLike>();
    const correlationId = correlationIdFrom(request);

    if (exception instanceof AppError) {
      this.logger.warn({
        event: "http-app-error",
        correlationId,
        method: request.method,
        path: request.url,
        statusCode: exception.status,
        errorCode: exception.code
      });
      response.status(exception.status).json({
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          correlationId
        }
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      this.logger.warn({
        event: "http-framework-error",
        correlationId,
        method: request.method,
        path: request.url,
        statusCode: status,
        errorCode: `HTTP_${status}`
      });
      response.status(status).json({
        error: {
          code: `HTTP_${status}`,
          message: safeMessage(status),
          details: {},
          correlationId
        }
      });
      return;
    }

    this.logger.failure(
      {
        event: "http-unhandled-error",
        correlationId,
        method: request.method,
        path: request.url,
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        errorCode: "INTERNAL_ERROR"
      },
      exception
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: {
        code: "INTERNAL_ERROR",
        message: "Erro inesperado. Tente novamente mais tarde.",
        details: {},
        correlationId
      }
    });
  }
}
