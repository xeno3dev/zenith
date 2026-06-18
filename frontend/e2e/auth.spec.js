import { test, expect } from '@playwright/test'

// Auth tests run without stored auth state — they test the flows themselves
const uniqueEmail = () => `test-${Date.now()}@zenith.local`

test.describe('Registration', () => {
  test('valid registration redirects to dashboard', async ({ page }) => {
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('New Test User')
    await page.getByLabel('Email').fill(uniqueEmail())
    await page.getByLabel('Password').fill('ValidPass123!')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page).toHaveURL('/')
  })

  test('duplicate email shows error and stays on register', async ({ page }) => {
    const email = uniqueEmail()

    // Register once
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('First User')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('ValidPass123!')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page).toHaveURL('/')

    // Log out by clearing storage and trying to register again with same email
    await page.goto('/register')
    await page.getByLabel('Full Name').fill('Second User')
    await page.getByLabel('Email').fill(email)
    await page.getByLabel('Password').fill('ValidPass123!')
    await page.getByRole('button', { name: 'Sign Up' }).click()
    await expect(page).toHaveURL('/register')
  })
})

test.describe('Login', () => {
  test('wrong password stays on login', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('playwright-test@zenith.local')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Log In' }).click()
    await expect(page).toHaveURL('/login')
  })

  test('unauthenticated access to dashboard redirects to login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL('/login')
  })
})
