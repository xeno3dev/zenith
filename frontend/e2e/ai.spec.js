import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test.use({ storageState: path.resolve(__dirname, '../playwright/.auth/user.json') })

test.describe('AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai')
  })

  test('page loads with Chat tab active', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI Assistant', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Chat' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Explain' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Quiz' })).toBeVisible()
  })

  test('chat sends a message and gets a reply', async ({ page }) => {
    const input = page.locator('input[placeholder="Type your question..."]')
    await expect(input).toBeVisible()

    await input.fill('What is photosynthesis in one sentence?')
    await page.keyboard.press('Enter')

    // Wait for a response to appear (AI can take a few seconds)
    await expect(page.getByText(/photosynthesis/i)).toBeVisible({ timeout: 30000 })
  })

  test('explain tab returns an explanation', async ({ page }) => {
    await page.getByRole('button', { name: 'Explain' }).click()

    await page.locator('input[placeholder*="Topic"]').fill('Mitosis')
    await page.locator('input[placeholder*="Subject"]').fill('Biology')
    await page.getByRole('button', { name: 'Explain Topic' }).click()

    // Wait for the explanation to load
    await expect(page.locator('.whitespace-pre-wrap')).toBeVisible({ timeout: 30000 })
    const text = await page.locator('.whitespace-pre-wrap').textContent()
    expect(text.length).toBeGreaterThan(50)
  })
})
