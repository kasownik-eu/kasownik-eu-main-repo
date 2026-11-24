import { expect, test } from '@playwright/test'

// Runs against `next dev` (playwright.config.ts) with the sample operators in data/
test.describe('Frontend', () => {
  test('the root opens the Polish home page and its search finds a city', async ({ page }) => {
    await page.goto('http://localhost:3000/')
    await expect(page).toHaveURL(/\/pl\/$/)
    await expect(page.locator('h1').first()).toHaveText('Sprawdź, jak kupić i skasować bilet')

    await page.getByRole('combobox', { name: 'Wpisz miasto lub przewoźnika' }).first().fill('przyklad')
    await page.getByRole('option', { name: /Miasto Przykładowe/ }).click()
    await expect(page).toHaveURL(/\/pl\/miasto\/miasto-przykladowe\/$/)
  })

  test('the header search opens a dialog and picks a result with the keyboard', async ({ page }) => {
    await page.goto('http://localhost:3000/pl/miasta/')
    await page.locator('header').getByRole('button', { name: 'Szukaj' }).click()
    const dialog = page.getByRole('dialog', { name: 'Wyszukiwarka' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('combobox').fill('lotnisk')
    await expect(dialog.getByRole('option')).toHaveCount(1)
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/pl\/przewoznik\/ll-przykladowe\/$/)
  })

  test('the list page search also filters the list', async ({ page }) => {
    await page.goto('http://localhost:3000/pl/przewoznicy/')
    await page.getByRole('combobox', { name: 'Wpisz miasto lub przewoźnika' }).fill('lotnisk')
    await expect(page.getByText('Znaleziono: 1 przewoźnik')).toBeVisible()
    await expect(page.getByRole('heading', { level: 2, name: 'Linie Lotniskowe' })).toBeVisible()
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
