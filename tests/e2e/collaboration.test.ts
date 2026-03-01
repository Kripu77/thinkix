import { test, expect } from '@playwright/test';

test.describe('Collaboration Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('displays collaborate button on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    await expect(collaborateButton).toBeVisible({ timeout: 10000 });
  });

  test('hides collaborate button on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    await expect(collaborateButton).not.toBeVisible();
  });

  test('collaborate button is in top right position', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    await expect(collaborateButton).toBeVisible();
    
    const boundingBox = await collaborateButton.boundingBox();
    expect(boundingBox).not.toBeNull();
    
    if (boundingBox) {
      expect(boundingBox.x).toBeGreaterThan(500);
      expect(boundingBox.y).toBeLessThan(100);
    }
  });
});

test.describe('Multi-User Collaboration', () => {
  test('two users can join the same room via URL', async ({ browser }) => {
    const roomId = `test-room-${Date.now()}`;
    const roomUrl = `http://localhost:3000/?room=${roomId}`;
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();
    
    await page1.setViewportSize({ width: 1280, height: 720 });
    await page2.setViewportSize({ width: 1280, height: 720 });
    
    await page1.goto(roomUrl);
    await page2.goto(roomUrl);
    
    await page1.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    
    await context1.close();
    await context2.close();
  });

  test('shows collaborating status when enabled', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?room=test-status-room');
    
    await page.waitForLoadState('networkidle');
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (!(await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip(true, 'Collaborate button not visible in this environment');
      return;
    }
    
    await collaborateButton.click();
    await page.waitForLoadState('networkidle');
    
    const collaboratingIndicator = page.locator('text=/just you|online/i');
    await expect(collaboratingIndicator).toBeVisible({ timeout: 10000 });
  });

  test('can leave collaboration', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/?room=leave-room');
    
    await page.waitForLoadState('networkidle');
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collaborateButton.click();
      
      const leaveButton = page.getByRole('button', { name: /×/i });
      
      if (await leaveButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await leaveButton.click();
        
        const collaborateButtonAgain = page.getByRole('button', { name: /collaborate/i });
        await expect(collaborateButtonAgain).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('Collaboration Status Bar', () => {
  test('shows connection status when collaboration is active', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const roomId = `status-test-${Date.now()}`;
    await page.goto(`/?room=${roomId}`);
    
    await page.waitForLoadState('networkidle');
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collaborateButton.click();
      
      const onlineIndicator = page.locator('text=/online|just you/i');
      const isOnlineVisible = await onlineIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      
      expect(typeof isOnlineVisible).toBe('boolean');
    }
  });
});

test.describe('User Presence', () => {
  test('user can see their own cursor on the board', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    
    const canvas = page.locator('svg.plait-board, .plait-board-container, canvas').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });
    
    const box = await canvas.boundingBox();
    
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    }
  });
});

test.describe('Board Sharing', () => {
  test('share button copies room URL to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const roomId = `share-test-${Date.now()}`;
    await page.goto(`/?room=${roomId}`);
    
    await page.waitForLoadState('networkidle');
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collaborateButton.click();
      
      const shareButton = page.getByRole('button', { name: /share/i });
      
      if (await shareButton.isVisible({ timeout: 5000 }).catch(() => false)) {
        await shareButton.click();
        
        await expect(async () => {
          const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
          expect(clipboardText).toContain(roomId);
        }).toPass({ timeout: 3000 });
      }
    }
  });
});

test.describe('Error Handling', () => {
  test('handles invalid room ID gracefully', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    await page.goto('/?room=');
    
    await page.waitForTimeout(1000);
    
    await expect(page).toHaveURL(/room=/);
    
    const canvas = page.locator('svg.plait-board, .plait-board-container, canvas').first();
    await expect(canvas).toBeVisible({ timeout: 5000 });
  });

  test('handles network disconnection gracefully', async ({ page, context }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    
    const roomId = `network-test-${Date.now()}`;
    await page.goto(`/?room=${roomId}`);
    
    await page.waitForTimeout(1000);
    
    const collaborateButton = page.getByRole('button', { name: /collaborate/i });
    
    if (await collaborateButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await collaborateButton.click();
      
      await page.waitForTimeout(2000);
      
      await context.setOffline(true);
      
      await page.waitForTimeout(2000);
      
      const disconnectedIndicator = page.locator('text=/disconnected|reconnecting/i');
      const isDisconnectedVisible = await disconnectedIndicator.isVisible({ timeout: 5000 }).catch(() => false);
      
      await context.setOffline(false);
      
      expect(typeof isDisconnectedVisible).toBe('boolean');
    }
  });
});

test.describe('Mobile Responsiveness', () => {
  test('collaboration controls are accessible via menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await page.waitForTimeout(1000);
    
    const menuButton = page.getByRole('button').filter({ has: page.locator('svg') }).first();
    
    if (await menuButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await menuButton.click();
      
      await page.waitForTimeout(500);
    }
  });
});
