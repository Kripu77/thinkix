import type { Page, Locator } from '@playwright/test';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function dismissOverlays(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
  // Check for and close Next.js error overlay
  const overlay = page.locator('nextjs-portal');
  if (await overlay.count() > 0) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
  }
}

export async function getCanvas(page: Page): Promise<Locator> {
  const selectors = [
    page.locator('.board-wrapper'),
    page.locator('[class*="plait-board"]'),
    page.locator('svg[class*="board"]'),
    page.locator('.plait-board'),
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
  return box;
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
  // Dismiss any overlays first
  await dismissOverlays(page);

  // Arrow is now a standalone button, not in the shapes dropdown
  if (toolName === 'arrow') {
    await dismissOverlays(page);
    const arrowButton = page.locator('button[aria-label="Arrow"]')
      .or(page.locator(`button:has(svg[class*="lucide-arrow-right"])`))
      .or(page.getByRole('button', { name: /arrow/i }));
    
    if (await arrowButton.first().isVisible({ timeout: 2000 }).catch(() => false)) {
      try {
        await arrowButton.first().click({ force: true, timeout: 5000 });
        await page.waitForTimeout(100);
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  const shapeTools = ['rectangle', 'ellipse', 'diamond', 'triangle', 'roundRectangle', 
    'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon', 'star', 'cloud'];
  
  if (shapeTools.includes(toolName)) {
    await dismissOverlays(page);
    const shapesDropdown = page.getByRole('button', { name: /shapes/i })
      .or(page.locator('button[aria-label="Shapes"]'))
      .or(page.locator('button:has(svg[class*="chevron"])').first());
    
    if (await shapesDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await shapesDropdown.click({ force: true });
      await page.waitForTimeout(200);
      
      const toolItem = page.locator(`[role="menuitem"]:has-text("${toolName}")`)
        .or(page.getByRole('menuitem', { name: new RegExp(escapeRegExp(toolName), 'i') }));
      
      if (await toolItem.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await toolItem.first().click({ force: true });
        await page.waitForTimeout(100);
        return true;
      }
    }
    return false;
  }
  
  // For select and other tools
  await dismissOverlays(page);
  const tool = page.locator(`[aria-label*="${toolName}" i]`)
    .or(page.locator(`[role="button"]:has-text("${toolName}")`))
    .or(page.locator(`[data-tool="${toolName}"]`));
  
  const toolElement = tool.first();
  if (await toolElement.isVisible({ timeout: 2000 }).catch(() => false)) {
    try {
      await toolElement.click({ force: true, timeout: 5000 });
      await page.waitForTimeout(100);
      return true;
    } catch {
      // Try again after dismissing overlays
      await dismissOverlays(page);
      try {
        await toolElement.click({ force: true, timeout: 5000 });
        await page.waitForTimeout(100);
        return true;
      } catch {
        return false;
      }
    }
  }
  return false;
}

export async function clickOnCanvas(page: Page, x: number, y: number): Promise<void> {
  await dismissOverlays(page);
  const box = await getCanvasBoundingBox(page);
  await page.mouse.click(box.x + x, box.y + y);
}

export async function waitForBoard(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await dismissOverlays(page);
  const canvas = await getCanvas(page);
  await canvas.waitFor({ state: 'visible', timeout: 10000 });
}

export async function getElementCount(page: Page): Promise<number> {
  const canvas = await getCanvas(page);
  const content = await canvas.innerHTML();
  const elementPatterns = [
    /<g[^>]*class="[^"]*element/g,
    /<path[^>]*class="[^"]*board/g,
    /data-plait-id/g,
  ];
  
  let count = 0;
  for (const pattern of elementPatterns) {
    const matches = content.match(pattern);
    if (matches) {
      count += matches.length;
    }
  }
  
  if (count > 0) {
    return count;
  }
  
  const svgElements = content.match(/<svg|<path|<rect|<ellipse|<circle|<polygon|<line/g);
  return svgElements ? svgElements.length : 0;
}

export async function hasElementOnCanvas(page: Page): Promise<boolean> {
  const canvas = await getCanvas(page);
  const content = await canvas.innerHTML();
  return content.includes('<path') || content.includes('<rect') || 
         content.includes('<ellipse') || content.includes('<g') ||
         content.includes('<circle') || content.includes('<polygon');
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
