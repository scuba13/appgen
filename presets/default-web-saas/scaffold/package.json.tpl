{
  "name": "{{PACKAGE_NAME}}",
  "private": true,
  "version": "0.1.0",
  "scripts": {
    "dev": "pnpm --parallel --filter @{{PACKAGE_NAME}}/web --filter @{{PACKAGE_NAME}}/api dev",
    "dev:web": "pnpm --filter @{{PACKAGE_NAME}}/web dev",
    "dev:api": "pnpm --filter @{{PACKAGE_NAME}}/api dev",
    "lint": "pnpm -r lint",
    "typecheck": "pnpm -r typecheck",
    "test": "pnpm -r test",
    "test:e2e": "playwright test",
    "test:e2e:install": "playwright install chromium",
    "build": "pnpm -r build",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "@playwright/test": "^1.49.1",
    "@typescript-eslint/eslint-plugin": "^7.17.0",
    "@typescript-eslint/parser": "^7.17.0",
    "eslint": "^8.57.0",
    "prettier": "^3.3.3",
    "typescript": "^5.5.4"
  },
  "packageManager": "pnpm@9.7.1"
}
