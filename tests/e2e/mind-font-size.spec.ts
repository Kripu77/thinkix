import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, hasElementOnCanvas } from './utils';

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

    const fontSizeData = await page.evaluate(() => {
      const boardWrapper = document.querySelector('.board-wrapper');
      if (!boardWrapper) return null;
      
      const allSpans: { text: string; fontSize: string }[] = [];
      
      const foreignObjects = boardWrapper.querySelectorAll('foreignObject');
      foreignObjects.forEach((fo) => {
        const spans = fo.querySelectorAll('span');
        spans.forEach((span) => {
          if (span.textContent) {
            const style = window.getComputedStyle(span);
            allSpans.push({
              text: span.textContent.trim().substring(0, 20),
              fontSize: style.fontSize,
            });
          }
        });
      });
      
      return allSpans.length > 0 ? allSpans : null;
    });

    expect(fontSizeData).not.toBeNull();
    expect(fontSizeData!.length).toBeGreaterThan(0);
    
    const hasCorrectFontSize = fontSizeData!.some((el: any) => el.fontSize === '18px');
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

    const fontSizeData = await page.evaluate(() => {
      const boardWrapper = document.querySelector('.board-wrapper');
      if (!boardWrapper) return null;
      
      const allSpans: { text: string; fontSize: string }[] = [];
      
      const foreignObjects = boardWrapper.querySelectorAll('foreignObject');
      foreignObjects.forEach((fo) => {
        const spans = fo.querySelectorAll('span');
        spans.forEach((span) => {
          if (span.textContent) {
            const style = window.getComputedStyle(span);
            allSpans.push({
              text: span.textContent.trim().substring(0, 20),
              fontSize: style.fontSize,
            });
          }
        });
      });
      
      return allSpans.length > 0 ? allSpans : null;
    });

    expect(fontSizeData).not.toBeNull();
    expect(fontSizeData!.length).toBeGreaterThan(0);
    
    const hasCorrectFontSize = fontSizeData!.some((el: any) => el.fontSize === '18px');
    expect(hasCorrectFontSize).toBe(true);
  });
});
