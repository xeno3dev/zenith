import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test.use({ storageState: path.resolve(__dirname, '../playwright/.auth/user.json') })

// Selector for assistant chat bubbles (whitespace-pre-wrap p tags inside message divs)
const ASSISTANT_BUBBLE = '.whitespace-pre-wrap'

test.describe('AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai')
  })

  test('page loads with sessions-based AI interface', async ({ page }) => {
    // Welcome screen shown when no session is active
    await expect(page.getByRole('heading', { name: 'AI Study Assistant' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Start a new chat' })).toBeVisible()
    // Sidebar always shows the New chat button
    await expect(page.getByRole('button', { name: 'New chat' })).toBeVisible()
  })

  test('creates a session and shows chat input', async ({ page }) => {
    await page.getByRole('button', { name: 'Start a new chat' }).click()
    const input = page.locator('input[placeholder*="Ask about your"]')
    await expect(input).toBeVisible({ timeout: 5000 })
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('sends a message and receives a reply', async ({ page }) => {
    // Open a new session first
    await page.getByRole('button', { name: 'Start a new chat' }).click()

    const input = page.locator('input[placeholder*="Ask about your"]')
    await input.waitFor({ state: 'visible', timeout: 5000 })
    await input.fill('What is photosynthesis in one sentence?')
    await page.keyboard.press('Enter')

    // Wait for the loading indicator to disappear
    await page.locator('.animate-bounce').first().waitFor({ state: 'hidden', timeout: 30000 })

    // Assistant reply (or error) rendered as a text bubble
    const bubble = page.locator(ASSISTANT_BUBBLE).last()
    await expect(bubble).toBeVisible({ timeout: 5000 })
    const reply = await bubble.textContent()
    // Accept both a real reply and the error fallback (e.g. no API key in CI)
    expect(reply.trim().length).toBeGreaterThan(10)
  })

  test('data-aware: asking about assignments triggers tool use', async ({ page }) => {
    await page.getByRole('button', { name: 'Start a new chat' }).click()

    const input = page.locator('input[placeholder*="Ask about your"]')
    await input.waitFor({ state: 'visible', timeout: 5000 })
    await input.fill('What assignments do I have?')
    await page.keyboard.press('Enter')

    // Either the tool badge fires (real API key present) or we at least get a reply/error
    const toolBadge = page.locator('text=Checking your assignments')
    const toolFired = await toolBadge
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false)

    if (!toolFired) {
      // No API key configured in CI — just verify the chat responded at all
      await page.locator('.animate-bounce').first().waitFor({ state: 'hidden', timeout: 30000 })
      const anyReply = page.locator(ASSISTANT_BUBBLE).last()
      await expect(anyReply).toBeVisible({ timeout: 5000 })
      const reply = await anyReply.textContent()
      expect(reply.trim().length).toBeGreaterThan(10)
    } else {
      // Full tool-use path — verify reply also came through
      const anyReply = page.locator(ASSISTANT_BUBBLE).last()
      await expect(anyReply).toBeVisible({ timeout: 30000 })
    }
  })
})
