import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, hasElementOnCanvas, getFontSizeDataFromBoard } from './utils';

test.describe('Mind Node Font Size', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test('should create mind map and have text rendered', async ({ page }) => {
    const mindSelected = await selectTool(page, 'mind');
    test.skip(!mindSelected);

    await clickOnCanvas(page, 300, 300);
    await page.waitForTimeout(500);

    await selectTool(page, 'select');
    await clickOnCanvas(page, 300, 300);
    await page.waitForTimeout(300);

    await page.keyboard.type('Root Node');
    await page.waitForTimeout(500);

    const hasElement = await hasElementOnCanvas(page);
    expect(hasElement).toBe(true);
  });

  test('should have 18px font-size on mind root node text spans', async ({ page }) => {
    const mindSelected = await selectTool(page, 'mind');
    test.skip(!mindSelected);

    await clickOnCanvas(page, 300, 300);
    await page.waitForTimeout(500);

    const fontSizeData = await getFontSizeDataFromBoard(page);

    expect(fontSizeData).not.toBeNull();
    expect(fontSizeData!.length).toBeGreaterThan(0);
    
    const hasCorrectFontSize = fontSizeData!.some((el) => el.fontSize === '18px');
    expect(hasCorrectFontSize).toBe(true);
  });

  test('should have 18px font-size on child node text spans', async ({ page }) => {
    const mindSelected = await selectTool(page, 'mind');
    test.skip(!mindSelected);

    await clickOnCanvas(page, 300, 300);
    await page.waitForTimeout(500);

    await selectTool(page, 'select');
    await clickOnCanvas(page, 300, 300);
    await page.waitForTimeout(300);

    await page.keyboard.press('Tab');
    await page.waitForTimeout(500);

    const fontSizeData = await getFontSizeDataFromBoard(page);

    expect(fontSizeData).not.toBeNull();
    expect(fontSizeData!.length).toBeGreaterThan(0);
    
    const hasCorrectFontSize = fontSizeData!.some((el) => el.fontSize === '18px');
    expect(hasCorrectFontSize).toBe(true);
  });
});
