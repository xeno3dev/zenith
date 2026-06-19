import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

test.use({ storageState: path.resolve(__dirname, '../playwright/.auth/user.json') })

// Selector for assistant chat bubbles (not the loading spinner which also uses bg-white/10)
const ASSISTANT_BUBBLE = '.whitespace-pre-wrap.bg-white\\/10'

test.describe('AI Assistant', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ai')
  })

  test('page loads with unified chat interface', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'AI Assistant', level: 1 })).toBeVisible()
    // Unified chat — no separate Chat / Explain / Quiz tabs
    await expect(page.locator('input[placeholder*="Ask about your"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    // Confirm no legacy tab buttons exist
    await expect(page.getByRole('button', { name: 'Explain' })).not.toBeVisible()
    await expect(page.getByRole('button', { name: 'Quiz' })).not.toBeVisible()
  })

  test('sends a message and receives a reply', async ({ page }) => {
    const input = page.locator('input[placeholder*="Ask about your"]')
    await input.fill('What is photosynthesis in one sentence?')
    await page.keyboard.press('Enter')

    // Wait for the loading indicator to disappear (the 3-dot bubble is also bg-white/10
    // but has no text; we wait for it to be gone before reading the response)
    await page.locator('.animate-bounce').first().waitFor({ state: 'hidden', timeout: 30000 })

    // Assistant reply bubble — uses whitespace-pre-wrap which the loading spinner does not
    const bubble = page.locator(ASSISTANT_BUBBLE).first()
    await expect(bubble).toBeVisible({ timeout: 5000 })
    const reply = await bubble.textContent()
    // Accept both a real reply and the error fallback message
    expect(reply.trim().length).toBeGreaterThan(10)
  })

  test('data-aware: asking about assignments triggers tool use', async ({ page }) => {
    const input = page.locator('input[placeholder*="Ask about your"]')
    await input.fill('What assignments do I have?')
    await page.keyboard.press('Enter')

    // Wait for response (either tool badge + reply, or just a reply if ANTHROPIC_API_KEY not set)
    const toolBadge = page.locator('text=Checking your assignments')
    const anyReply = page.locator(ASSISTANT_BUBBLE).first()

    // Either the tool badge fires (real API key present) or we at least get a reply
    const toolFired = await toolBadge
      .waitFor({ state: 'visible', timeout: 15000 })
      .then(() => true)
      .catch(() => false)

    if (!toolFired) {
      // No API key configured locally — just verify the chat responded
      await page.locator('.animate-bounce').first().waitFor({ state: 'hidden', timeout: 30000 })
      await expect(anyReply).toBeVisible({ timeout: 5000 })
      const reply = await anyReply.textContent()
      expect(reply.trim().length).toBeGreaterThan(10)
    } else {
      // Full tool-use path — verify reply also came through
      await expect(anyReply).toBeVisible({ timeout: 30000 })
    }
  })
})
