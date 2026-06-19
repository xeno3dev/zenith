import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Use the authenticated session from auth.setup.js
test.use({ storageState: path.resolve(__dirname, '../playwright/.auth/user.json') })

test.describe('Subjects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/subjects')
  })

  test('page loads and shows heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Subjects' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Subject' })).toBeVisible()
  })

  test('create a subject', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Subject' }).click()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()

    await page.getByLabel('Name').fill('Mathematics')
    await page.getByLabel('Teacher').fill('Mr. Smith')
    await page.getByLabel('Room').fill('101')
    await page.getByRole('button', { name: 'Save Subject' }).click()

    await expect(page.getByText('Mathematics')).toBeVisible()
    await expect(page.getByText('Mr. Smith')).toBeVisible()
  })

  test('edit a subject', async ({ page }) => {
    // Ensure subject exists
    const card = page.getByText('Mathematics').first()
    await expect(card).toBeVisible()

    // Click the edit (pencil) button on that card
    await page.getByRole('button', { name: /edit/i }).first().click()

    await page.getByLabel('Name').fill('Advanced Mathematics')
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText('Advanced Mathematics')).toBeVisible()
  })

  test('delete a subject shows confirmation dialog', async ({ page }) => {
    await expect(page.getByText('Advanced Mathematics')).toBeVisible()

    // Open delete dialog
    await page.locator('button[class*="text-destructive"]').first().click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('Delete subject?')).toBeVisible()

    // Confirm deletion
    await page.getByRole('button', { name: 'Delete' }).click()
    await expect(page.getByText('Advanced Mathematics')).not.toBeVisible()
  })
})
