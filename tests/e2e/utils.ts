import type { Page, Locator } from '@playwright/test';

/**
 * Locates the drawing canvas and returns a Locator pointing to it.
 *
 * Checks several common canvas selectors and returns the first one that becomes visible; if none are visible within their timeouts, returns the locator for `.board-wrapper` as a fallback.
 *
 * @returns A Locator referencing the canvas element — the first visible selector found, or the `.board-wrapper` locator if none are visible.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

/**
 * Get the canvas element's bounding box in page coordinates.
 *
 * @returns An object with `x`, `y`, `width`, and `height` representing the canvas bounding box in page coordinates.
 * @throws If the canvas bounding box cannot be determined.
 */
export async function getCanvasBoundingBox(page: Page): Promise<{ x: number; y: number; width: number; height: number }> {
  const canvas = await getCanvas(page);
  const box = await canvas.boundingBox();
  if (!box) {
    throw new Error('Canvas bounding box not found');
  }
  return box;
}

/**
 * Draws a straight shape on the canvas by dragging the mouse from a start point to an end point.
 *
 * @param page - Playwright Page instance used to perform mouse actions
 * @param startX - X coordinate of the start point, in pixels relative to the canvas top-left
 * @param startY - Y coordinate of the start point, in pixels relative to the canvas top-left
 * @param endX - X coordinate of the end point, in pixels relative to the canvas top-left
 * @param endY - Y coordinate of the end point, in pixels relative to the canvas top-left
 */
export async function drawShape(page: Page, startX: number, startY: number, endX: number, endY: number): Promise<void> {
  const box = await getCanvasBoundingBox(page);
  
  await page.mouse.move(box.x + startX, box.y + startY);
  await page.mouse.down();
  await page.mouse.move(box.x + endX, box.y + endY, { steps: 10 });
  await page.mouse.up();
  await page.waitForTimeout(300);
}

/**
 * Simulates a freehand stroke on the canvas by tracing a sequence of offset points.
 *
 * Traces the provided points in order: moves to the first point, presses the mouse button,
 * moves through subsequent points to draw the stroke, releases the button, and waits briefly.
 *
 * @param points - An ordered array of [x, y] coordinates (pixels) relative to the canvas origin.
 */
export async function drawFreehand(page: Page, points: Array<[number, number]>): Promise<void> {
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

/**
 * Selects a drawing tool from the application's UI by its name.
 *
 * @param toolName - The tool name to select (case-insensitive); may be a shape name or a general tool identifier
 * @returns `true` if the tool was found and activated, `false` otherwise
 */
export async function selectTool(page: Page, toolName: string): Promise<boolean> {
  const shapeTools = ['rectangle', 'ellipse', 'diamond', 'triangle', 'roundRectangle', 
    'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'octagon', 'star', 'cloud', 'arrow'];
  
  if (shapeTools.includes(toolName)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    
    const shapesDropdown = page.getByRole('button', { name: /shapes/i })
      .or(page.locator('button[aria-label="Shapes"]'))
      .or(page.locator('button:has(svg[class*="chevron"])').first());
    
    if (await shapesDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
      await shapesDropdown.click({ force: true });
      await page.waitForTimeout(200);
      
      const toolItem = page.locator(`[role="menuitem"]:has-text("${toolName}")`)
        .or(page.getByRole('menuitem', { name: new RegExp(escapeRegExp(toolName), 'i') }));
      
      if (await toolItem.first().isVisible({ timeout: 1000 }).catch(() => false)) {
        await toolItem.first().click();
        await page.waitForTimeout(100);
        return true;
      }
    }
    return false;
  }
  
  const tool = page.locator(`[role="button"]:has-text("${toolName}")`)
    .or(page.locator(`[data-tool="${toolName}"]`))
    .or(page.locator(`[aria-label*="${toolName}" i]`));
  
  const toolElement = tool.first();
  if (await toolElement.isVisible({ timeout: 2000 }).catch(() => false)) {
    await toolElement.click();
    await page.waitForTimeout(100);
    return true;
  }
  return false;
}

/**
 * Clicks the canvas at the specified coordinates relative to the canvas origin and waits briefly.
 *
 * @param page - The Playwright Page instance
 * @param x - Horizontal offset in pixels from the canvas's left edge
 * @param y - Vertical offset in pixels from the canvas's top edge
 */
export async function clickOnCanvas(page: Page, x: number, y: number): Promise<void> {
  const box = await getCanvasBoundingBox(page);
  await page.mouse.click(box.x + x, box.y + y);
  await page.waitForTimeout(200);
}

/**
 * Ensures the app's drawing board is loaded and the canvas element is visible.
 *
 * Navigates to the root path, waits for network idle and a short delay, then waits up to 20 seconds for the canvas to become visible.
 */
export async function waitForBoard(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  const canvas = await getCanvas(page);
  await canvas.waitFor({ state: 'visible', timeout: 15000 });
}

/**
 * Count drawable elements present inside the canvas HTML.
 *
 * Counts common SVG element tags and board-specific markers found in the canvas innerHTML.
 *
 * @returns The total number of detected element-like nodes in the canvas HTML.
 */
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

/**
 * Determines whether the canvas contains any common SVG drawable elements.
 *
 * @returns `true` if the canvas inner HTML contains tags like `<path>`, `<rect>`, `<ellipse>`, `<circle>`, `<polygon>`, or `<g>`, `false` otherwise.
 */
export async function hasElementOnCanvas(page: Page): Promise<boolean> {
  const canvas = await getCanvas(page);
  const content = await canvas.innerHTML();
  return content.includes('<path') || content.includes('<rect') || 
         content.includes('<ellipse') || content.includes('<g') ||
         content.includes('<circle') || content.includes('<polygon');
}

/**
 * Check whether the selection toolbar is visible on the page.
 *
 * @returns `true` if the selection toolbar is visible within 2 seconds, `false` otherwise.
 */
export async function isSelectionToolbarVisible(page: Page): Promise<boolean> {
  const toolbar = page.locator('[data-testid="selection-toolbar"]')
    .or(page.locator('.inline-flex.items-center.gap-0\\.5.rounded-lg.border'));
  return toolbar.isVisible({ timeout: 2000 }).catch(() => false);
}

/**
 * Locates the selection toolbar in the board UI.
 *
 * @returns A Locator for the first matching selection toolbar element
 */
export function getSelectionToolbar(page: Page): Locator {
  return page.locator('[data-testid="selection-toolbar"]')
    .or(page.locator('.inline-flex.items-center.gap-0\\.5.rounded-lg.border')).first();
}

/**
 * Sends an Escape keypress to the given page and waits briefly to allow the UI to update.
 *
 * Waits 100 ms after pressing Escape to give page handlers time to react (e.g., clear selections or dismiss overlays).
 */
export async function pressEscape(page: Page): Promise<void> {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);
}

/**
 * Clears any active selection on the provided page.
 */
export async function clearSelection(page: Page): Promise<void> {
  await pressEscape(page);
}

/**
 * Clicks the page's zoom-in control if it is visible; otherwise does nothing.
 */
export async function zoomIn(page: Page): Promise<void> {
  const zoomInBtn = page.getByRole('button', { name: /\+/i })
    .or(page.locator('button').filter({ hasText: '+' }));
  if (await zoomInBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await zoomInBtn.click();
    await page.waitForTimeout(200);
  }
}

/**
 * Clicks the zoom-out control on the page if it is present and visible.
 *
 * Waits briefly after clicking to allow the UI to update.
 */
export async function zoomOut(page: Page): Promise<void> {
  const zoomOutBtn = page.getByRole('button', { name: /-/i })
    .or(page.locator('button').filter({ hasText: '-' }));
  if (await zoomOutBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await zoomOutBtn.click();
    await page.waitForTimeout(200);
  }
}