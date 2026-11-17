import { expect, test } from '@playwright/test'

// Runs against `next dev` (playwright.config.ts) with the sample operators in data/
test.describe('Frontend', () => {
  test('the root opens the Polish city list', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page).toHaveURL(/\/pl\/miasta\/$/)
    await expect(page.locator('h1').first()).toHaveText('Miasta')
  })

  test('a city shows its primary operator and switches language', async ({ page }) => {
    await page.goto('http://localhost:3000/pl/miasto/miasto-przykladowe/')
    await expect(page.locator('h1').first()).toHaveText('Miejski Zarząd Transportu')
    await expect(page.getByText('Bilet 20-minutowy').first()).toBeVisible()

    await page.locator('nav a[lang=en]').click()
    await expect(page).toHaveURL(/\/en\/city\/miasto-przykladowe\/$/)
    await expect(page.getByText('20-minute ticket').first()).toBeVisible()
  })
})
