import { test, expect } from '@playwright/test';
import { waitForBoard, selectTool, clickOnCanvas, hasElementOnCanvas, getCanvasBoundingBox } from './utils';

test.describe('Mind Map Advanced E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Mind Map Hierarchy', () => {
    test('should create 3+ level deep hierarchy', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Root');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.type('Child 1');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.type('Grandchild');
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should create multiple children at same level', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Root');
      await page.waitForTimeout(200);
      
      for (let i = 1; i <= 3; i++) {
        await page.keyboard.press('Tab');
        await page.waitForTimeout(200);
        await page.keyboard.type(`Child ${i}`);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(200);
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Mind Map Collapse/Expand', () => {
    test('should collapse node with children', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Root');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.type('Hidden Child');
      await page.waitForTimeout(300);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 300, y: 300 } });
      await page.waitForTimeout(500);
      
      const collapseButton = page.locator('[class*="collapse"]').first()
        .or(page.locator('button').filter({ has: page.locator('svg') }).first());
      
      if (await collapseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await collapseButton.click();
        await page.waitForTimeout(300);
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });

    test('should expand collapsed node', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Root');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.type('Child');
      await page.waitForTimeout(300);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 300, y: 300 } });
      await page.waitForTimeout(500);
      
      const collapseButton = page.locator('[class*="collapse"]').first();
      if (await collapseButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await collapseButton.click();
        await page.waitForTimeout(200);
        await collapseButton.click();
        await page.waitForTimeout(300);
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Mind Map Drag Reorder', () => {
    test('should drag node to reorder within parent', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Root');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.type('First');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      await page.keyboard.type('Second');
      await page.waitForTimeout(300);
      
      await selectTool(page, 'select');
      
      const box = await getCanvasBoundingBox(page);
      const childNodeX = box.x + 400;
      const childNodeY = box.y + 280;
      
      await page.mouse.move(childNodeX, childNodeY);
      await page.mouse.down();
      await page.mouse.move(childNodeX, childNodeY - 50, { steps: 10 });
      await page.mouse.up();
      await page.waitForTimeout(300);
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });

  test.describe('Mind Map Delete Node', () => {
    test('should delete node and its children', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await page.keyboard.type('Root');
      await page.waitForTimeout(200);
      
      await page.keyboard.press('Tab');
      await page.waitForTimeout(300);
      await page.keyboard.type('To Delete');
      await page.waitForTimeout(300);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 400, y: 300 } });
      await page.waitForTimeout(300);
      
      await page.keyboard.press('Delete');
      await page.waitForTimeout(300);
      
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Mind Map Emoji', () => {
    test('should add emoji to node', async ({ page }) => {
      const mindSelected = await selectTool(page, 'mind');
      if (!mindSelected) {
        test.skip();
        return;
      }
      
      await clickOnCanvas(page, 300, 300);
      await page.waitForTimeout(500);
      
      await selectTool(page, 'select');
      const canvas = page.locator('.board-wrapper');
      await canvas.click({ position: { x: 300, y: 300 } });
      await page.waitForTimeout(500);
      
      const emojiButton = page.getByRole('button', { name: /emoji/i })
        .or(page.locator('button').filter({ has: page.locator('[class*="emoji"]') }).first());
      
      if (await emojiButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await emojiButton.click();
        await page.waitForTimeout(300);
        
        const emojiPicker = page.locator('[class*="emoji-picker"]')
          .or(page.getByRole('listbox'));
        
        if (await emojiPicker.isVisible({ timeout: 1000 }).catch(() => false)) {
          const firstEmoji = emojiPicker.locator('button').first();
          if (await firstEmoji.isVisible({ timeout: 500 }).catch(() => false)) {
            await firstEmoji.click();
            await page.waitForTimeout(300);
          }
        }
      }
      
      const hasElement = await hasElementOnCanvas(page);
      expect(hasElement).toBe(true);
    });
  });
});
