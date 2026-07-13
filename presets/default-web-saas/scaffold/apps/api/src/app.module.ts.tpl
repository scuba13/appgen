import { Module } from "@nestjs/common";
import { APP_FILTER } from "@nestjs/core";
import { HttpErrorFilter } from "./common/http-error.filter";
import { HealthController } from "./health.controller";
import { PrismaService } from "./prisma.service";

@Module({
  controllers: [HealthController],
  providers: [
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: HttpErrorFilter
    }
  ]
})
export class AppModule {}
