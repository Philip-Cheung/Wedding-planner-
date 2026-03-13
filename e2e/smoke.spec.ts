import { test, expect } from '@playwright/test'

test('app loads and shows wedding planner', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Wedding Planner/)
  // Unauthenticated: redirect to /auth with "Wedding Planner" heading; authenticated: dashboard or onboarding
  await expect(
    page.getByRole('heading', { name: /wedding planner/i })
  ).toBeVisible({ timeout: 10000 })
})
