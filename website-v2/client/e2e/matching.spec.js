const { test, expect } = require('@playwright/test');

test.describe('Paper Matching Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/match');
  });

  test('should select papers for matching', async ({ page }) => {
    // Search for first paper
    await page.fill('input[placeholder="Search by title..."]', 'machine learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');

    // Select first paper
    await page.click('.paper-card >> nth=0 >> button:has-text("Select for Match")');
    expect(await page.locator('.paper-card >> nth=0').getAttribute('class')).toContain('selected');

    // Search for second paper
    await page.fill('input[placeholder="Search by title..."]', 'deep learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');

    // Select second paper
    await page.click('.paper-card >> nth=0 >> button:has-text("Select for Match")');
    expect(await page.locator('.paper-card >> nth=0').getAttribute('class')).toContain('selected');
  });

  test('should start match with selected papers', async ({ page }) => {
    // Select two papers
    await page.fill('input[placeholder="Search by title..."]', 'machine learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');
    await page.click('.paper-card >> nth=0 >> button:has-text("Select for Match")');

    await page.fill('input[placeholder="Search by title..."]', 'deep learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');
    await page.click('.paper-card >> nth=0 >> button:has-text("Select for Match")');

    // Start match
    await page.click('button:has-text("Start Match")');
    await page.waitForSelector('.match-container');
    expect(await page.isVisible('.match-container')).toBeTruthy();
  });

  test('should handle paper deselection', async ({ page }) => {
    // Select a paper
    await page.fill('input[placeholder="Search by title..."]', 'machine learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');
    await page.click('.paper-card >> nth=0 >> button:has-text("Select for Match")');

    // Verify selection
    expect(await page.locator('.paper-card >> nth=0').getAttribute('class')).toContain('selected');

    // Deselect the paper
    await page.click('.paper-card >> nth=0 >> button:has-text("Selected")');
    expect(await page.locator('.paper-card >> nth=0').getAttribute('class')).not.toContain('selected');
  });

  test('should show error when starting match without two papers', async ({ page }) => {
    // Select only one paper
    await page.fill('input[placeholder="Search by title..."]', 'machine learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');
    await page.click('.paper-card >> nth=0 >> button:has-text("Select for Match")');

    // Try to start match
    await page.click('button:has-text("Start Match")');
    expect(await page.isVisible('.error-message')).toBeTruthy();
  });

  test('should maintain selection state after search', async ({ page }) => {
    // Select a paper
    await page.fill('input[placeholder="Search by title..."]', 'machine learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');
    await page.click('.paper-card >> nth=0 >> button:has-text("Select for Match")');

    // Search again
    await page.fill('input[placeholder="Search by title..."]', 'deep learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');

    // Go back to previous search
    await page.goBack();

    // Verify selection is maintained
    expect(await page.locator('.paper-card >> nth=0').getAttribute('class')).toContain('selected');
  });

  test('should show paper details on hover', async ({ page }) => {
    await page.fill('input[placeholder="Search by title..."]', 'machine learning');
    await page.click('button:has-text("Search")');
    await page.waitForSelector('.paper-card');

    // Hover over paper card
    await page.hover('.paper-card >> nth=0');

    // Verify tooltip appears
    await page.waitForSelector('.ant-tooltip');
    expect(await page.isVisible('.ant-tooltip')).toBeTruthy();
  });
}); 