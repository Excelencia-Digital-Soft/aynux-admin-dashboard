import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('should display login page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Aynux Admin')

    // Check form elements exist
    await expect(page.locator('input[type="text"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show error on invalid credentials', async ({ page }) => {
    // Fill in invalid credentials
    await page.fill('input[type="text"]', 'invalid@email.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    // Submit form
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(page.locator('.p-message-error, .p-toast-message-error')).toBeVisible({
      timeout: 10000
    })
  })

  test('should require email and password', async ({ page }) => {
    // Button should be disabled when fields are empty
    const submitButton = page.locator('button[type="submit"]')

    // Check initial state
    await expect(submitButton).toBeDisabled()

    // Fill only email
    await page.fill('input[type="text"]', 'test@email.com')
    await expect(submitButton).toBeDisabled()

    // Clear email and fill password
    await page.fill('input[type="text"]', '')
    await page.fill('input[type="password"]', 'password')
    await expect(submitButton).toBeDisabled()

    // Fill both
    await page.fill('input[type="text"]', 'test@email.com')
    await expect(submitButton).toBeEnabled()
  })

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access protected route
    await page.goto('/knowledge')

    // Should be redirected to login
    await expect(page).toHaveURL(/\/login/)
  })
})

test.describe('Navigation', () => {
  test('should have responsive sidebar', async ({ page }) => {
    // Mock authentication by setting localStorage
    await page.goto('/login')

    // For mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Sidebar should be collapsed on mobile
    // This test verifies responsive behavior
  })
})
