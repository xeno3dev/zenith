import { test as setup, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.resolve(__dirname, '../../playwright/.auth/user.json')

export const TEST_USER = {
  name: 'Playwright Test User',
  email: 'playwright-test@zenith.local',
  password: 'PlaywrightTest123!',
}

setup('authenticate test user', async ({ page }) => {
  fs.mkdirSync(path.dirname(AUTH_FILE), { recursive: true })

  // Try login first — user may already exist from a previous local run
  await page.goto('/login')
  await page.getByLabel('Email').fill(TEST_USER.email)
  await page.getByLabel('Password').fill(TEST_USER.password)
  await page.getByRole('button', { name: 'Log In' }).click()

  const loggedIn = await page.waitForURL('/', { timeout: 3000 }).then(() => true).catch(() => false)

  if (!loggedIn) {
    // Register fresh
    await page.goto('/register')
    await page.getByLabel('Full Name').fill(TEST_USER.name)
    await page.getByLabel('Email').fill(TEST_USER.email)
    await page.getByLabel('Password').fill(TEST_USER.password)
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page).toHaveURL('/')
  }

  await page.context().storageState({ path: AUTH_FILE })
})
