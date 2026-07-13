"use client";

import { Button, Result } from "antd";
import { useEffect } from "react";
import { appLogger, createCorrelationId } from "../lib/logger";

export default function ErrorBoundary({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    appLogger.failure(
      {
        event: "render-error",
        correlationId: createCorrelationId("render"),
        digest: error.digest
      },
      error
    );
  }, [error]);

  return (
    <Result
      status="error"
      title="Nao foi possivel carregar esta tela"
      subTitle="Tente novamente. Se o erro continuar, informe o horario e a acao que estava tentando executar."
      extra={
        <Button type="primary" onClick={reset}>
          Tentar novamente
        </Button>
      }
    />
  );
}
