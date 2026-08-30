import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "test/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "on-first-retry",
  },
  webServer: [
    {
      command: "node test/mock-upstream.mjs",
      port: 4324,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: "pnpm exec vite dev --host 127.0.0.1 --port 4173",
      env: {
        COOKIE_SECURE: "false",
        PUBLIC_MODE: "true",
        UPSTREAM_URL: "http://127.0.0.1:4324",
        VERSION: "0.0.0-e2e",
      },
      port: 4173,
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "desktop-chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
