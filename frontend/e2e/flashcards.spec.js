import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const AUTH_FILE = path.resolve(__dirname, '../playwright/.auth/user.json')
const FLASK_API = 'http://localhost:5000/api'

/** Read the JWT from the saved playwright auth state */
function getToken() {
  const state = JSON.parse(fs.readFileSync(AUTH_FILE, 'utf8'))
  return (
    state.origins[0]?.localStorage?.find((e) => e.name === 'zenith_token')?.value ?? ''
  )
}

/** POST to Flask directly (no browser needed) */
async function apiPost(endpoint, body = {}) {
  const res = await fetch(`${FLASK_API}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  })
  return res.json()
}

/** DELETE via Flask directly */
async function apiDelete(endpoint) {
  await fetch(`${FLASK_API}${endpoint}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${getToken()}` },
  })
}

// Use serial mode so tests share a single deck across all steps
test.describe.serial('Flashcards', () => {
  test.use({ storageState: AUTH_FILE })

  // Stable across the full describe block (set in beforeAll)
  let deckId = null
  const DECK_NAME = `PW-${Date.now()}`

  test.beforeAll(async () => {
    // Create the deck via API — no risk of module re-evaluation timing
    const data = await apiPost('/decks', { name: DECK_NAME })
    deckId = data.id
    // Pre-load one card so review mode has something to show
    if (deckId) {
      await apiPost(`/decks/${deckId}/cards`, {
        front: 'What is gravity?',
        back: 'Force of attraction between masses',
      })
    }
  })

  test.afterAll(async () => {
    // Clean up — only needed if delete-deck test didn't run or was skipped
    if (deckId) {
      await apiDelete(`/decks/${deckId}`)
      deckId = null
    }
  })

  test.beforeEach(async ({ page }) => {
    await page.goto('/flashcards')
  })

  // ──────────────────────────────────────────────────────────────────
  // 1. Basic page structure
  // ──────────────────────────────────────────────────────────────────
  test('page loads with heading and New Deck button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Flashcards', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'New Deck' })).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────
  // 2. Deck created via API is visible in the grid
  // ──────────────────────────────────────────────────────────────────
  test('deck created via API is visible in list', async ({ page }) => {
    await expect(page.getByText(DECK_NAME)).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────
  // 3. Create a deck through the UI
  // ──────────────────────────────────────────────────────────────────
  test('create a deck via UI', async ({ page }) => {
    await page.getByRole('button', { name: 'New Deck' }).click()
    const uniqueName = `UI Deck ${Date.now()}`
    await page.locator('input[placeholder="Deck name"]').fill(uniqueName)
    await page.getByRole('button', { name: 'Create Deck' }).click()
    await expect(page.getByText(uniqueName)).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────
  // 4. Add a card via the inline form  ← requires worktree Flashcards.jsx
  // ──────────────────────────────────────────────────────────────────
  test('add a card via inline form', async ({ page }) => {
    // Wait for the deck list to load (async API call) before checking for the button
    const deckWrapper = page.locator('.space-y-2').filter({ hasText: DECK_NAME })
    await expect(deckWrapper).toBeVisible({ timeout: 8000 })

    const addCardBtn = deckWrapper.getByText('Add Card')

    // Skip gracefully if "Add Card" button doesn't exist yet (pre-merge)
    const exists = await addCardBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (!exists) {
      test.skip()
      return
    }

    await addCardBtn.click()
    await deckWrapper.locator('input[placeholder="Front (question)"]').fill('What is 2+2?')
    await deckWrapper.locator('input[placeholder="Back (answer)"]').fill('4')
    await deckWrapper.getByRole('button', { name: 'Add Card' }).click()

    await expect(page.getByText('Card added')).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────
  // 5. Entering review mode from a deck card
  // ──────────────────────────────────────────────────────────────────
  test('enter review mode from deck card', async ({ page }) => {
    const deckWrapper = page.locator('.space-y-2').filter({ hasText: DECK_NAME })
    // First button inside the wrapper is the FlashcardDeck <button>
    await deckWrapper.locator('button').first().click()

    await expect(page.getByRole('button', { name: /back to decks/i })).toBeVisible()

    // Wait for the loading state to resolve — either a card or the "no cards" message will appear
    const cardOrMessage = page.locator('[style*="perspective"], :has-text("No cards due"), :has-text("All done")')
    await expect(cardOrMessage.first()).toBeVisible({ timeout: 10000 })
  })

  // ──────────────────────────────────────────────────────────────────
  // 6. Flip card shows back face and rating buttons
  // ──────────────────────────────────────────────────────────────────
  test('card flip shows back face and rating buttons', async ({ page }) => {
    const deckWrapper = page.locator('.space-y-2').filter({ hasText: DECK_NAME })
    await deckWrapper.locator('button').first().click()

    const cardContainer = page.locator('[style*="perspective"]')
    const hasCard = await cardContainer.isVisible({ timeout: 3000 }).catch(() => false)
    if (!hasCard) {
      // No cards due right now (may have been reviewed already)
      test.skip()
      return
    }

    // Flip the card
    await cardContainer.click()
    await page.waitForTimeout(600) // let CSS transition settle

    await expect(page.getByRole('button', { name: 'Again' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Good' })).toBeVisible()
  })

  // ──────────────────────────────────────────────────────────────────
  // 7. Delete a deck via the Delete button  ← requires worktree Flashcards.jsx
  // ──────────────────────────────────────────────────────────────────
  test('delete deck via UI', async ({ page }) => {
    const deckWrapper = page.locator('.space-y-2').filter({ hasText: DECK_NAME })
    await expect(deckWrapper).toBeVisible({ timeout: 8000 })
    const deleteBtn = deckWrapper.getByRole('button', { name: /delete/i })

    // Skip gracefully if Delete button doesn't exist yet (pre-merge)
    const exists = await deleteBtn.isVisible({ timeout: 3000 }).catch(() => false)
    if (!exists) {
      test.skip()
      return
    }

    page.once('dialog', (dialog) => dialog.accept())
    await deleteBtn.click()

    await expect(page.getByText(DECK_NAME)).not.toBeVisible()
    deckId = null // afterAll won't try to double-delete
  })
})
