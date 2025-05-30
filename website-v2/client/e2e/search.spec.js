const { test, expect } = require('@playwright/test');

test.describe('Search Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should perform search and display results', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder="Search by title..."]', 'machine learning');
    await page.click('button:has-text("Search")');

    // Wait for results to load
    await page.waitForSelector('.paper-card');

    // Verify search results
    const results = await page.$$('.paper-card');
    expect(results.length).toBeGreaterThan(0);

    // Verify search query in URL
    const url = page.url();
    expect(url).toContain('q=machine+learning');
  });

  test('should handle empty search gracefully', async ({ page }) => {
    // Try to search with empty query
    await page.click('button:has-text("Search")');

    // Verify URL hasn't changed
    const url = page.url();
    expect(url).not.toContain('q=');
  });

  test('should filter results by category', async ({ page }) => {
    // Perform initial search
    await page.fill('input[placeholder="Search by title..."]', 'AI');
    await page.click('button:has-text("Search")');

    // Wait for results
    await page.waitForSelector('.paper-card');

    // Click on a category filter
    await page.click('text=Machine Learning');

    // Verify filtered results
    const results = await page.$$('.paper-card');
    for (const result of results) {
      const category = await result.$eval('.ant-tag', tag => tag.textContent);
      expect(category).toBe('Machine Learning');
    }
  });

  test('should navigate to paper details', async ({ page }) => {
    // Perform search
    await page.fill('input[placeholder="Search by title..."]', 'deep learning');
    await page.click('button:has-text("Search")');

    // Wait for results
    await page.waitForSelector('.paper-card');

    // Click on first paper
    await page.click('.paper-card >> nth=0');

    // Verify paper details page
    await page.waitForSelector('.paper-details');
    expect(await page.isVisible('.paper-details')).toBeTruthy();
  });

  test('should handle search with special characters', async ({ page }) => {
    // Search with special characters
    await page.fill('input[placeholder="Search by title..."]', 'AI & ML');
    await page.click('button:has-text("Search")');

    // Verify URL encoding
    const url = page.url();
    expect(url).toContain('q=AI+%26+ML');
  });
}); 