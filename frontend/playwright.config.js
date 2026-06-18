import { defineConfig, devices } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  projects: [
    // Auth setup runs first, saves storage state
    {
      name: 'setup',
      testMatch: /setup\/.*\.setup\.js/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  webServer: [
    {
      command: process.env.CI
        ? 'flask run --port 5000'
        : 'venv/bin/flask run --port 5000',
      cwd: path.resolve(__dirname, '../backend'),
      url: 'http://localhost:5000/health',
      reuseExistingServer: !process.env.CI,
      env: {
        FLASK_APP: 'app:create_app',
        CORS_ORIGINS: 'http://localhost:5173',
      },
    },
    {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
})
