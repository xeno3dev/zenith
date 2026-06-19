import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Use the authenticated session from auth.setup.js
test.use({ storageState: path.resolve(__dirname, '../playwright/.auth/user.json') })

// Unique name per run to avoid cross-run collisions in the shared SQLite DB
const RUN_ID = Date.now()
const SUBJECT_NAME = `Math ${RUN_ID}`
const SUBJECT_NAME_EDITED = `Advanced Math ${RUN_ID}`

test.describe('Subjects', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/subjects')
  })

  test('page loads and shows heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Subjects', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Add Subject' })).toBeVisible()
  })

  test('create a subject', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Subject' }).click()
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible()

    await page.getByLabel('Name').fill(SUBJECT_NAME)
    await page.getByLabel('Teacher').fill('Mr. Smith')
    await page.getByLabel('Room').fill('101')
    await page.getByRole('button', { name: 'Save Subject' }).click()

    await expect(page.getByText(SUBJECT_NAME).first()).toBeVisible()
    await expect(page.getByText('Mr. Smith').first()).toBeVisible()
  })

  test('edit a subject', async ({ page }) => {
    // Ensure our unique subject from the create test exists
    await expect(page.getByText(SUBJECT_NAME).first()).toBeVisible()

    await page.getByRole('button', { name: `Edit ${SUBJECT_NAME}` }).first().click()

    await page.getByLabel('Name').fill(SUBJECT_NAME_EDITED)
    await page.getByRole('button', { name: 'Save Changes' }).click()

    await expect(page.getByText(SUBJECT_NAME_EDITED).first()).toBeVisible()
  })

  test('delete a subject shows confirmation dialog', async ({ page }) => {
    await expect(page.getByText(SUBJECT_NAME_EDITED).first()).toBeVisible()

    await page.getByRole('button', { name: `Delete ${SUBJECT_NAME_EDITED}` }).first().click()
    await expect(page.getByRole('alertdialog')).toBeVisible()
    await expect(page.getByText('Delete subject?')).toBeVisible()

    await page.getByRole('button', { name: 'Delete' }).click()

    // Wait for the card h2 to disappear (not the dialog's <strong> which closes too)
    await expect(
      page.locator('h2').filter({ hasText: SUBJECT_NAME_EDITED })
    ).not.toBeVisible()
  })
})
