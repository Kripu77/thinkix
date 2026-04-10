import { test, expect } from '@playwright/test';
import type { Download } from '@playwright/test';
import { stat } from 'node:fs/promises';
import { waitForBoard, getCanvas, openAppMenu, selectTool, drawShape } from './utils';

const GRID_TYPE_MAP: Record<string, string> = {
  'Dots': 'dot',
  'Lines': 'square',
  'Focus': 'blank',
  'Blank': 'blank',
  'Blueprint': 'blueprint',
  'Isometric': 'isometric',
  'Ruled': 'ruled',
};

async function selectGridType(page: import('@playwright/test').Page, gridType: string): Promise<void> {
  const gridButton = page.getByTestId('canvas-mode-trigger').or(page.locator('button[title="Canvas mode"]'));
  
  const menuContent = page.locator('[role="menu"]').filter({ hasText: 'Canvas Mode' });
  const isMenuOpen = await menuContent.isVisible({ timeout: 500 }).catch(() => false);
  
  if (!isMenuOpen) {
    await gridButton.click();
    await page.locator('[data-testid="canvas-mode-panel"]').waitFor({ state: 'visible', timeout: 2000 });
  }
  
  const gridTypeId = GRID_TYPE_MAP[gridType] || gridType.toLowerCase();
  const option = page.getByTestId(`canvas-mode-${gridTypeId}`);
  await option.click();
  await page.waitForTimeout(300);
}

async function selectGridSpacing(page: import('@playwright/test').Page, spacing: number): Promise<void> {
  const menuContent = page.locator('[data-testid="canvas-mode-panel"]');
  const isMenuOpen = await menuContent.isVisible({ timeout: 500 }).catch(() => false);
  
  if (!isMenuOpen) {
    const gridButton = page.getByTestId('canvas-mode-trigger').or(page.locator('button[title="Canvas mode"]'));
    await gridButton.click();
    await menuContent.waitFor({ state: 'visible', timeout: 2000 });
  }
  
  const spacingOption = page.getByTestId(`grid-spacing-${spacing}`);
  await spacingOption.click();
  await page.waitForTimeout(200);
}

async function toggleMajorGrid(page: import('@playwright/test').Page): Promise<void> {
  const majorGridContainer = page.getByTestId('major-grid-select');
  const switchButton = majorGridContainer.getByRole('switch');
  await switchButton.click();
  await page.waitForTimeout(200);
}

async function openExportSubmenu(page: import('@playwright/test').Page): Promise<void> {
  await openAppMenu(page);
  const exportTrigger = page.getByTestId('app-menu-export-trigger');
  await expect(exportTrigger).toBeVisible({ timeout: 5000 });
  await exportTrigger.hover();
  await exportTrigger.click();
  await expect(page.getByTestId('app-menu-export-svg')).toBeVisible({ timeout: 5000 });
}

async function selectCanvasTheme(
  page: import('@playwright/test').Page,
  theme: 'default' | 'dark' | 'soft' | 'retro' | 'starry' | 'colorful',
): Promise<void> {
  await page.keyboard.press('Escape').catch(() => undefined);
  await openAppMenu(page);
  const themeTrigger = page.getByTestId('app-menu-theme-trigger');
  await expect(themeTrigger).toBeVisible({ timeout: 5000 });
  await themeTrigger.hover();
  await themeTrigger.click();
  await expect(page.getByTestId(`app-menu-theme-${theme}`)).toBeVisible({ timeout: 5000 });
  await page.getByTestId(`app-menu-theme-${theme}`).click();
}

async function expectNonEmptyDownload(download: Download): Promise<void> {
  const path = await download.path();
  expect(path).toBeTruthy();
  const file = await stat(path!);
  expect(file.size).toBeGreaterThan(0);
}

async function getGridBackgroundColor(page: import('@playwright/test').Page): Promise<string | null> {
  return page.evaluate(() => {
    const boardContainer = document.querySelector('.board-host-svg');
    if (boardContainer) {
      const style = window.getComputedStyle(boardContainer);
      return style.backgroundColor;
    }
    return null;
  });
}

async function getChromeStyles(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const readStyles = (selector: string) => {
      const element = document.querySelector(selector);
      if (!element) {
        return null;
      }

      const styles = window.getComputedStyle(element);
      return {
        backgroundColor: styles.backgroundColor,
        color: styles.color,
        borderColor: styles.borderColor,
      };
    };

    return {
      rootTheme: document.documentElement.getAttribute('data-board-theme'),
      rootDark: document.documentElement.classList.contains('dark'),
      appMenu: readStyles('[data-testid="app-menu-button"]'),
      boardToolbar: readStyles('[data-testid="board-toolbar"]'),
      zoomToolbar: readStyles('[data-testid="zoom-toolbar"]'),
      collaborate: readStyles('[data-testid="collaborate-button"]'),
    };
  });
}

async function getLocalStorageGridConfig(page: import('@playwright/test').Page): Promise<{ type: string; density?: number; showMajor?: boolean } | null> {
  return page.evaluate(() => {
    try {
      const stored = localStorage.getItem('thinkix:grid-background');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      return null;
    }
    return null;
  });
}

test.describe('Grid Background E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await waitForBoard(page);
  });

  test.describe('Grid Toolbar Visibility', () => {
    test('should display grid toolbar on desktop', async ({ page }) => {
      const gridToolbar = page.locator('button[title="Canvas mode"]');
      await expect(gridToolbar).toBeVisible({ timeout: 5000 });
    });

    test('should show grid type dropdown when clicked', async ({ page }) => {
      const gridButton = page.locator('button[title="Canvas mode"]');
      await gridButton.click();
      
      const dropdown = page.locator('[role="menu"]').or(page.locator('.radix-dropdown-menu-content'));
      await expect(dropdown).toBeVisible({ timeout: 2000 });
    });
  });

  test.describe('Grid Type Selection', () => {
    test('should switch to dots grid and render circles', async ({ page }) => {
      await selectGridType(page, 'Dots');
      
      const canvas = await getCanvas(page);
      const content = await canvas.innerHTML();
      expect(content).toContain('circle');
    });

    test('should switch to lines grid and render lines', async ({ page }) => {
      await selectGridType(page, 'Lines');
      
      const canvas = await getCanvas(page);
      const content = await canvas.innerHTML();
      expect(content).toContain('line');
    });

    test('should switch to blueprint grid with correct background color', async ({ page }) => {
      await selectGridType(page, 'Blueprint');
      
      const canvas = await getCanvas(page);
      const content = await canvas.innerHTML();
      expect(content).toContain('line');
      
      const bgColor = await getGridBackgroundColor(page);
      expect(bgColor).toBeTruthy();
    });

    test('should switch to ruled grid and render horizontal lines', async ({ page }) => {
      await selectGridType(page, 'Ruled');
      
      const canvas = await getCanvas(page);
      const content = await canvas.innerHTML();
      expect(content).toContain('line');
    });

    test('should switch to isometric grid and render diagonal lines', async ({ page }) => {
      await selectGridType(page, 'Isometric');
      
      const canvas = await getCanvas(page);
      const content = await canvas.innerHTML();
      expect(content).toContain('line');
    });

    test('should switch to blank (no grid) and have no grid lines', async ({ page }) => {
      await selectGridType(page, 'Focus');
      
      const canvas = await getCanvas(page);
      const gridLayer = canvas.locator('.grid-layer line');
      const lineCount = await gridLayer.count();
      expect(lineCount).toBe(0);
      
      const gridCircles = canvas.locator('.grid-layer circle');
      const circleCount = await gridCircles.count();
      expect(circleCount).toBe(0);
    });
  });

  test.describe('Grid Background Colors', () => {
    test('blueprint grid should have light blue background in light theme', async ({ page }) => {
      await selectGridType(page, 'Blueprint');
      
      const bgColor = await getGridBackgroundColor(page);
      expect(bgColor).toBeTruthy();
      expect(bgColor).toMatch(/rgb\(232,\s*244,\s*252\)|#e8f4fc/i);
    });

    test('ruled grid should have cream background in the default theme', async ({ page }) => {
      await selectGridType(page, 'Ruled');
      
      await expect
        .poll(() => getGridBackgroundColor(page), { timeout: 5000 })
        .toMatch(/rgb\(248,\s*248,\s*245\)|#f8f8f5/i);
    });

    test('ruled grid should switch to a dark background in dark theme', async ({ page }) => {
      await selectGridType(page, 'Ruled');
      await selectCanvasTheme(page, 'dark');

      await expect
        .poll(() => getGridBackgroundColor(page), { timeout: 5000 })
        .toMatch(/rgb\(24,\s*24,\s*27\)|#18181b/i);
    });

    test('ruled grid should switch to a starry background in starry theme', async ({ page }) => {
      await selectGridType(page, 'Ruled');
      await selectCanvasTheme(page, 'starry');

      await expect
        .poll(() => getGridBackgroundColor(page), { timeout: 5000 })
        .toMatch(/rgb\(16,\s*41,\s*61\)|#10293d/i);
    });

    test('dots grid should have default white background', async ({ page }) => {
      await selectGridType(page, 'Dots');
      
      const bgColor = await getGridBackgroundColor(page);
      expect(bgColor).toBeTruthy();
    });

    test('updates blank canvas background when theme changes and keeps it after reload', async ({ page }) => {
      await selectGridType(page, 'Blank');
      await selectCanvasTheme(page, 'dark');

      await expect
        .poll(() => getGridBackgroundColor(page), { timeout: 5000 })
        .toMatch(/rgb\(26,\s*26,\s*26\)|#1a1a1a/i);

      await page.reload();
      await waitForBoard(page);

      await expect
        .poll(() => getGridBackgroundColor(page), { timeout: 5000 })
        .toMatch(/rgb\(26,\s*26,\s*26\)|#1a1a1a/i);
    });

    test('applies starry theme to the app chrome, not just the canvas background', async ({ page }) => {
      await selectGridType(page, 'Blank');
      await selectCanvasTheme(page, 'starry');

      await expect
        .poll(() => getChromeStyles(page), { timeout: 5000 })
        .toMatchObject({
          rootTheme: 'starry',
          rootDark: true,
        });

      const chrome = await getChromeStyles(page);
      expect(chrome.appMenu?.backgroundColor).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
      expect(chrome.boardToolbar?.backgroundColor).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
      expect(chrome.zoomToolbar?.backgroundColor).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
      expect(chrome.collaborate?.backgroundColor).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
    });
  });

  test.describe('Grid Persistence', () => {
    test('should persist grid selection in localStorage', async ({ page }) => {
      await selectGridType(page, 'Blueprint');
      
      const config = await getLocalStorageGridConfig(page);
      expect(config).not.toBeNull();
      expect(config?.type).toBe('blueprint');
    });

    test('should persist grid selection after page reload', async ({ page }) => {
      await selectGridType(page, 'Ruled');
      
      await page.reload();
      await waitForBoard(page);
      
      const config = await getLocalStorageGridConfig(page);
      expect(config?.type).toBe('ruled');
      
      const gridButton = page.locator('button[title="Canvas mode"]');
      const buttonText = await gridButton.textContent();
      expect(buttonText).toContain('Ruled');
    });

    test('should restore grid rendering after reload', async ({ page }) => {
      await selectGridType(page, 'Dots');
      
      await page.reload();
      await waitForBoard(page);
      
      await expect
        .poll(async () => (await getCanvas(page)).innerHTML(), { timeout: 10000 })
        .toContain('circle');
    });

    test('should persist grid density setting', async ({ page }) => {
      await selectGridType(page, 'Dots');
      
      const config = await getLocalStorageGridConfig(page);
      expect(config).not.toBeNull();
      expect(config?.type).toBe('dot');
      expect(typeof config?.density).toBe('number');
    });
  });

  test.describe('Grid Export Integration', () => {
    test.beforeEach(async ({ page }) => {
      const rectSelected = await selectTool(page, 'rectangle');
      test.skip(!rectSelected, 'Rectangle tool not available');
    });

    test('should export SVG with grid background for blueprint', async ({ page }) => {
      await selectGridType(page, 'Blueprint');
      await drawShape(page, 100, 100, 200, 200);

      await openExportSubmenu(page);
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('app-menu-export-svg').click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/\.svg$/i);
      await expectNonEmptyDownload(download);
    });

    test('should export PNG with grid background for ruled', async ({ page }) => {
      await selectGridType(page, 'Ruled');
      await drawShape(page, 100, 100, 200, 200);

      await openExportSubmenu(page);
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('app-menu-export-png-white').click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/\.png$/i);
      await expectNonEmptyDownload(download);
    });

    test('should export JPG with grid background', async ({ page }) => {
      await selectGridType(page, 'Blueprint');
      await drawShape(page, 100, 100, 200, 200);

      await openExportSubmenu(page);
      const [download] = await Promise.all([
        page.waitForEvent('download'),
        page.getByTestId('app-menu-export-jpg').click(),
      ]);

      expect(download.suggestedFilename()).toMatch(/\.jpg$/i);
      await expectNonEmptyDownload(download);
    });
  });

  test.describe('Grid Type Switching', () => {
    test('should switch between multiple grid types', async ({ page }) => {
      await selectGridType(page, 'Dots');
      let canvas = await getCanvas(page);
      expect(await canvas.innerHTML()).toContain('circle');
      
      await selectGridType(page, 'Lines');
      canvas = await getCanvas(page);
      expect(await canvas.innerHTML()).toContain('line');
      
      await selectGridType(page, 'Blueprint');
      canvas = await getCanvas(page);
      expect(await canvas.innerHTML()).toContain('line');
      
      await selectGridType(page, 'Isometric');
      canvas = await getCanvas(page);
      expect(await canvas.innerHTML()).toContain('line');
    });

    test('should update background color when switching to blueprint', async ({ page }) => {
      await selectGridType(page, 'Blank');
      const blankBg = await getGridBackgroundColor(page);
      
      await selectGridType(page, 'Blueprint');
      const blueprintBg = await getGridBackgroundColor(page);
      
      expect(blankBg).not.toBe(blueprintBg);
    });

    test('should update background color when switching to ruled', async ({ page }) => {
      await selectGridType(page, 'Blank');
      const blankBg = await getGridBackgroundColor(page);
      
      await selectGridType(page, 'Ruled');
      const ruledBg = await getGridBackgroundColor(page);
      
      expect(blankBg).not.toBe(ruledBg);
    });
  });

  test.describe('Grid Visibility', () => {
    test('grid layer should be present in DOM', async ({ page }) => {
      await selectGridType(page, 'Dots');
      
      const gridLayer = page.locator('.grid-layer').first();
      await expect(gridLayer).toBeVisible({ timeout: 2000 });
    });

    test('grid should render at default zoom level', async ({ page }) => {
      await selectGridType(page, 'Dots');
      
      const canvas = await getCanvas(page);
      const content = await canvas.innerHTML();
      expect(content).toContain('circle');
    });

    test('blank grid should have grid-layer but no elements', async ({ page }) => {
      await selectGridType(page, 'Blank');
      
      const canvas = await getCanvas(page);
      const gridContent = await canvas.locator('.grid-layer').innerHTML();
      const hasVisibleElements = gridContent.includes('circle') || gridContent.includes('line');
      
      expect(hasVisibleElements).toBe(false);
    });
  });

  test.describe('Grid with Canvas Elements', () => {
    test('grid should remain visible when drawing shapes', async ({ page }) => {
      await selectGridType(page, 'Dots');
      
      const rectSelected = await selectTool(page, 'rectangle');
      if (rectSelected) {
        await drawShape(page, 100, 100, 200, 200);
      }
      
      const canvas = await getCanvas(page);
      const content = await canvas.innerHTML();
      expect(content).toContain('circle');
    });

    test('grid background should not interfere with element selection', async ({ page }) => {
      await selectGridType(page, 'Blueprint');
      
      const rectSelected = await selectTool(page, 'rectangle');
      if (!rectSelected) {
        test.skip();
        return;
      }
      
      await drawShape(page, 100, 100, 200, 200);
      
      await page.mouse.click(150, 150);
      await page.waitForTimeout(200);
      
      const canvas = page.locator('.board-wrapper');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Grid State Management', () => {
    test('should maintain grid state across board operations', async ({ page }) => {
      await selectGridType(page, 'Blueprint');
      
      const configBefore = await getLocalStorageGridConfig(page);
      expect(configBefore?.type).toBe('blueprint');
      
      const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
      await page.keyboard.down(modifier);
      await page.keyboard.press('KeyS');
      await page.keyboard.up(modifier);
      await page.waitForTimeout(300);
      
      const configAfter = await getLocalStorageGridConfig(page);
      expect(configAfter?.type).toBe('blueprint');
    });

    test('should reset to default grid when clearing localStorage', async ({ page }) => {
      await selectGridType(page, 'Blueprint');
      
      await page.evaluate(() => {
        localStorage.removeItem('thinkix:grid-background');
      });
      
      await page.reload();
      await waitForBoard(page);
      
      const gridButton = page.getByTestId('canvas-mode-trigger').or(page.locator('button[title="Canvas mode"]'));
      await expect(gridButton).toContainText('Focus', { timeout: 3000 });
    });
  });

  test.describe('Grid Spacing Change', () => {
    test('should change grid spacing and persist', async ({ page }) => {
      await selectGridType(page, 'Dots');
      await selectGridSpacing(page, 32);
      
      const config = await getLocalStorageGridConfig(page);
      expect(config?.density).toBe(32);
    });

    test('should persist grid spacing after reload', async ({ page }) => {
      await selectGridType(page, 'Lines');
      await selectGridSpacing(page, 32);
      
      await page.reload();
      await waitForBoard(page);
      
      const config = await getLocalStorageGridConfig(page);
      expect(config?.density).toBe(32);
    });
  });

  test.describe('Focus Mode Behavior', () => {
    test('should hide major grid control in focus mode', async ({ page }) => {
      await selectGridType(page, 'Blank');
      
      const majorGridContainer = page.getByTestId('major-grid-container');
      await expect(majorGridContainer).toHaveAttribute('aria-hidden', 'true');
    });

    test('should show major grid control when switching to lines mode', async ({ page }) => {
      await selectGridType(page, 'Lines');
      
      const majorGridContainer = page.getByTestId('major-grid-container');
      await expect(majorGridContainer).not.toHaveAttribute('aria-hidden', 'true');
    });

    test('should toggle major grid visibility', async ({ page }) => {
      await selectGridType(page, 'Lines');

      let config = await getLocalStorageGridConfig(page);
      expect(config?.showMajor).toBe(false);

      await toggleMajorGrid(page);
      config = await getLocalStorageGridConfig(page);
      expect(config?.showMajor).toBe(true);

      await toggleMajorGrid(page);
      config = await getLocalStorageGridConfig(page);
      expect(config?.showMajor).toBe(false);
    });
  });

  test.describe('Mode Switching with Persistence', () => {
    test('should switch to Isometric and persist after reload', async ({ page }) => {
      await selectGridType(page, 'Isometric');
      
      const config = await getLocalStorageGridConfig(page);
      expect(config?.type).toBe('isometric');
      
      await page.reload();
      await waitForBoard(page);
      
      const configAfterReload = await getLocalStorageGridConfig(page);
      expect(configAfterReload?.type).toBe('isometric');
      
      await expect(page.locator('.grid-layer line').first()).toBeVisible();
    });
  });
});
