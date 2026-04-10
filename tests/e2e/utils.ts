import { expect, type Locator, type Page } from '@playwright/test';

export const E2E_BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:3100';
const PRIMARY_MODIFIER = process.platform === 'darwin' ? 'Meta' : 'Control';

async function dismissOverlays(page: Page): Promise<void> {
  const overlay = page.locator('nextjs-portal');
  const isOverlayVisible = await overlay
    .first()
    .isVisible({ timeout: 250 })
    .catch(() => false);

  if (isOverlayVisible) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }
}

async function dismissCollaborationStartDialog(page: Page): Promise<void> {
  const dialog = page.getByRole('dialog').filter({
    has: page.getByText(/start collaborating/i),
  });
  const isDialogVisible = await dialog.isVisible({ timeout: 500 }).catch(() => false);

  if (!isDialogVisible) {
    return;
  }

  const closeButton = dialog.getByRole('button', { name: /got it/i });
  await closeButton.click();
  await expect(dialog).toBeHidden({ timeout: 5000 });
}

async function waitForBoardShell(page: Page): Promise<void> {
  const boardWrapper = page.locator('.board-wrapper');
  const boardRoot = page.locator('[data-board="true"]');

  await boardWrapper.waitFor({ state: 'visible', timeout: 30000 });
  await boardRoot.waitFor({ state: 'visible', timeout: 30000 });
  await dismissOverlays(page);
}

async function waitForToolbar(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: 'Select' }).first()).toBeVisible({
    timeout: 30000,
  });
}

export async function waitForMainBoard(page: Page): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await waitForBoardShell(page);
      return;
    } catch (error) {
      lastError = error;

      if (attempt === 1) {
        break;
      }

      await page.waitForTimeout(500);
    }
  }

  throw lastError;
}

export async function waitForCollaborationBoard(
  page: Page,
  url = `${E2E_BASE_URL}/test/collaboration`,
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await waitForBoardShell(page);
      await dismissCollaborationStartDialog(page);
      return;
    } catch (error) {
      lastError = error;

      if (attempt === 1) {
        break;
      }

      await page.waitForTimeout(500);
    }
  }

  throw lastError;
}

export async function waitForRadixMenu(page: Page): Promise<Locator> {
  const menu = page.locator('[role="menu"]').last();
  await expect(menu).toBeVisible({ timeout: 5000 });
  return menu;
}

export async function openAppMenu(page: Page): Promise<Locator> {
  await dismissOverlays(page);
  const menuButton = page.getByTestId('app-menu-button');
  await expect(menuButton).toBeVisible({ timeout: 5000 });
  await menuButton.click();
  return waitForRadixMenu(page);
}

export async function getCanvas(page: Page): Promise<Locator> {
  const selectors = [
    page.locator('[data-board="true"]'),
    page.locator('.board-wrapper'),
    page.locator('[class*="plait-board"]'),
    page.locator('svg[class*="board"]'),
    page.locator('.plait-board'),
    page.locator('.board-host-svg'),
  ];
  
  for (const selector of selectors) {
    if (await selector.isVisible({ timeout: 2000 }).catch(() => false)) {
      return selector;
    }
  }
  
  return page.locator('.board-wrapper');
}

export async function getCanvasBoundingBox(page: Page): Promise<{ x: number; y: number; width: number; height: number }> {
  const canvas = await getCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box not found');
  }

  const safeInset = {
    top: 96,
    left: 80,
    right: 24,
    bottom: 24,
  };

  return {
    x: box.x + safeInset.left,
    y: box.y + safeInset.top,
    width: Math.max(1, box.width - safeInset.left - safeInset.right),
    height: Math.max(1, box.height - safeInset.top - safeInset.bottom),
  };
}

export async function drawShape(page: Page, startX: number, startY: number, endX: number, endY: number): Promise<void> {
  await dismissOverlays(page);
  const box = await getCanvasBoundingBox(page);
  
  await page.mouse.move(box.x + startX, box.y + startY);
  await page.mouse.down();
  await page.mouse.move(box.x + endX, box.y + endY, { steps: 10 });
  await page.mouse.up();
}

export async function drawFreehand(page: Page, points: Array<[number, number]>): Promise<void> {
  await dismissOverlays(page);
  const box = await getCanvasBoundingBox(page);
  
  if (points.length === 0) return;
  
  await page.mouse.move(box.x + points[0][0], box.y + points[0][1]);
  await page.mouse.down();
  
  for (const [x, y] of points.slice(1)) {
    await page.mouse.move(box.x + x, box.y + y, { steps: 2 });
  }
  
  await page.mouse.up();
  await page.waitForTimeout(200);
}

export async function selectTool(page: Page, toolName: string): Promise<boolean> {
  await dismissOverlays(page);

  const openMenu = page.locator('[role="menu"]').last();
  if (await openMenu.isVisible({ timeout: 250 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }

  const canvasModePanel = page.getByTestId('canvas-mode-panel');
  if (await canvasModePanel.isVisible({ timeout: 250 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }

  await waitForToolbar(page);

  const directToolLabels: Record<string, string> = {
    arrow: 'Arrow',
    select: 'Select',
    draw: 'Freehand',
    eraser: 'Eraser',
    text: 'Text',
    stickyNote: 'Sticky Note',
    image: 'Image',
  };

  const shapeToolLabels: Record<string, string> = {
    rectangle: 'Rectangle',
    ellipse: 'Ellipse',
    diamond: 'Diamond',
    triangle: 'Triangle',
    roundRectangle: 'Rounded Rect',
    parallelogram: 'Parallelogram',
    trapezoid: 'Trapezoid',
    pentagon: 'Pentagon',
    hexagon: 'Hexagon',
    octagon: 'Octagon',
    star: 'Star',
    cloud: 'Cloud',
  };

  const directToolLabel = directToolLabels[toolName];
  if (directToolLabel) {
    const button = page
      .locator(`button[aria-label="${directToolLabel}"]:visible`)
      .first()
      .or(page.getByRole('button', { name: directToolLabel }).first());

    if (await button.isVisible({ timeout: 3000 }).catch(() => false)) {
      await button.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(100);
      return true;
    }

    return false;
  }

  if (toolName in shapeToolLabels) {
    const dropdownButton = page
      .getByTestId('shapes-dropdown-trigger')
      .or(page.getByRole('button', { name: 'Shapes' }))
      .first();

    if (!(await dropdownButton.isVisible({ timeout: 10000 }).catch(() => false))) {
      return false;
    }

    await dropdownButton.click({ force: true });
    const toolItem = page
      .getByTestId(`shape-tool-${toolName}`)
      .or(page.getByRole('menuitem', { name: shapeToolLabels[toolName] }).first())
      .first();
    await expect(toolItem).toBeVisible({ timeout: 3000 });
    await toolItem.click({ force: true });
    await page.waitForTimeout(100);
    return true;
  }

  return false;
}

export async function clickOnCanvas(page: Page, x: number, y: number): Promise<void> {
  await dismissOverlays(page);
  const box = await getCanvasBoundingBox(page);
  await page.mouse.click(box.x + x, box.y + y);
}

export async function waitForBoard(page: Page): Promise<void> {
  await waitForMainBoard(page);
}

export async function getElementCount(page: Page): Promise<number> {
  return page.evaluate(() => {
    const boardRoot = document.querySelector('[data-board="true"]');
    const count = boardRoot?.getAttribute('data-element-count');
    const renderedElementCount = document.querySelectorAll(
      '.board-wrapper [plait-data-id]',
    ).length;

    if (count !== null && count !== undefined) {
      const parsed = Number.parseInt(count, 10);
      if (!Number.isNaN(parsed)) {
        return Math.max(parsed, renderedElementCount);
      }
    }

    return renderedElementCount;
  });
}

export async function hasElementOnCanvas(page: Page): Promise<boolean> {
  return (await getElementCount(page)) > 0;
}

export async function isSelectionToolbarVisible(page: Page): Promise<boolean> {
  const toolbar = page.locator('[data-testid="selection-toolbar"]')
    .or(page.locator('.inline-flex.items-center.gap-0\\.5.rounded-lg.border'));
  return toolbar.isVisible({ timeout: 2000 }).catch(() => false);
}

export function getSelectionToolbar(page: Page): Locator {
  return page.locator('[data-testid="selection-toolbar"]')
    .or(page.locator('.inline-flex.items-center.gap-0\\.5.rounded-lg.border')).first();
}

export async function pressEscape(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
}

export async function clearSelection(page: Page): Promise<void> {
  await pressEscape(page);
}

export async function selectAllElements(page: Page): Promise<void> {
  await dismissOverlays(page);
  const box = await getCanvasBoundingBox(page);
  await page.mouse.click(box.x + 8, box.y + 8);
  await page.waitForTimeout(50);
  await page.keyboard.press(`${PRIMARY_MODIFIER}+A`);
  await page.waitForTimeout(150);
}

export async function undo(page: Page): Promise<void> {
  await page.keyboard.press(`${PRIMARY_MODIFIER}+Z`);
  await page.waitForTimeout(150);
}

export async function redo(page: Page): Promise<void> {
  if (PRIMARY_MODIFIER === 'Meta') {
    await page.keyboard.press('Meta+Shift+Z');
  } else {
    await page.keyboard.press('Control+Shift+Z');
  }
  await page.waitForTimeout(150);
}

export async function zoomIn(page: Page): Promise<void> {
  const zoomInBtn = page.getByRole('button', { name: /\+/i })
    .or(page.locator('button').filter({ hasText: '+' }));
  if (await zoomInBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await zoomInBtn.click();
    await page.waitForTimeout(200);
  }
}

export async function zoomOut(page: Page): Promise<void> {
  const zoomOutBtn = page.getByRole('button', { name: /-/i })
    .or(page.locator('button').filter({ hasText: '-' }));
  if (await zoomOutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await zoomOutBtn.click();
    await page.waitForTimeout(200);
  }
}

export interface FontSizeData {
  text: string;
  fontSize: string;
}

export async function getFontSizeDataFromBoard(page: Page): Promise<FontSizeData[] | null> {
  return page.evaluate(() => {
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
}
