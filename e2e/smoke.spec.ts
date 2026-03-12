import { test, expect } from '@playwright/test'

test('app loads and shows dashboard', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveTitle(/Wedding Planner/)
  await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
})
