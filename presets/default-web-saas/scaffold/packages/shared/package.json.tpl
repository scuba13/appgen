{
  "name": "@{{PACKAGE_NAME}}/shared",
  "private": true,
  "version": "0.1.0",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "lint": "eslint \"src/**/*.ts\"",
    "typecheck": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "build": "tsc --noEmit"
  },
  "dependencies": {
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "eslint": "^8.57.0",
    "typescript": "^5.5.4",
    "vitest": "^2.0.5"
  }
}
