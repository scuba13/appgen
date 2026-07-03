{
  "name": "@{{PACKAGE_NAME}}/api",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "postinstall": "prisma generate",
    "dev": "nest start --watch",
    "start": "node dist/main.js",
    "build": "nest build",
    "lint": "eslint \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@nestjs/common": "^10.3.10",
    "@nestjs/core": "^10.3.10",
    "@nestjs/platform-express": "^10.3.10",
    "@prisma/client": "^5.18.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.4.2",
    "@types/node": "^20.14.12",
    "eslint": "^8.57.0",
    "prisma": "^5.18.0",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
