import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Authenticated pages use stored session
test.use({ storageState: path.resolve(__dirname, '../playwright/.auth/user.json') })

test.describe('Visual regression', () => {
  test('login page', async ({ page }) => {
    // Override storage state for this test — we want to see the unauthed page
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    await page.goto('/login')
    await expect(page).toHaveScreenshot('login.png', { maxDiffPixels: 50 })
  })

  test('dashboard', async ({ page }) => {
    await page.goto('/')
    // Wait for data to settle before screenshotting
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('dashboard.png', { maxDiffPixels: 100 })
  })

  test('subjects page', async ({ page }) => {
    await page.goto('/subjects')
    await page.waitForLoadState('networkidle')
    await expect(page).toHaveScreenshot('subjects.png', { maxDiffPixels: 100 })
  })
})
