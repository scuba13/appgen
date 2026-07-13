import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { appLogger } from "./common/logger";

async function bootstrap() {
  const logger = appLogger.child("bootstrap");

  try {
    const app = await NestFactory.create(AppModule, {
      logger: appLogger
    });

    const port = Number(process.env.API_PORT ?? 3001);
    await app.listen(port);
    logger.info({
      event: "api-started",
      port,
      service: "{{PACKAGE_NAME}}-api"
    });
  } catch (error) {
    logger.failure(
      {
        event: "api-start-failed",
        service: "{{PACKAGE_NAME}}-api"
      },
      error
    );
    process.exit(1);
  }
}

void bootstrap();
