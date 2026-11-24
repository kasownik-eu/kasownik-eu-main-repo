import { expect, test } from '@playwright/test'

// Runs against `next dev` (playwright.config.ts) with the operators in data/
test.describe('Frontend', () => {
  test('the root opens the Polish home page and its search finds a city', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page).toHaveURL(/\/pl\/$/)
    await expect(page.locator('h1').first()).toHaveText('Sprawdź, jak kupić i skasować bilet')

    await page.getByRole('combobox', { name: 'Wpisz miasto lub przewoźnika' }).first().fill('katowic')
    await page.getByRole('option', { name: /Katowice/ }).click()
    await expect(page).toHaveURL(/\/pl\/miasto\/katowice\/$/)
  })

  test('the header search opens a dialog and picks a result with the keyboard', async ({ page }) => {
    await page.goto('http://localhost:3000/pl/miasta/')
    await page.locator('header').getByRole('button', { name: 'Szukaj' }).click()
    const dialog = page.getByRole('dialog', { name: 'Wyszukiwarka' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('combobox').fill('jaworzn')
    await expect(dialog.getByRole('option').first()).toBeVisible()
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/pl\/(przewoznik|miasto)\/[a-z-]+\/$/)
  })

  test('the list page search also filters the list', async ({ page }) => {
    await page.goto('http://localhost:3000/pl/przewoznicy/')
    await page.getByRole('combobox', { name: 'Wpisz miasto lub przewoźnika' }).fill('jaworzn')
    await expect(page.getByText('Znaleziono: 1 przewoźnik')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: /Jaworznie/ })).toBeVisible()
  })

  test('a city shows its primary operator and switches language', async ({ page }) => {
    await page.goto('http://localhost:3000/pl/miasto/katowice/')
    await expect(page.locator('h1').first()).toContainText('Zarząd Transportu Metropolitalnego')
    await expect(page.getByText('20 minut').first()).toBeVisible()

    await page.locator('nav a[lang=en]').click()
    await expect(page).toHaveURL(/\/en\/city\/katowice\/$/)
    await expect(page.locator('h1').first()).toContainText('Zarząd Transportu Metropolitalnego')
  })
})
