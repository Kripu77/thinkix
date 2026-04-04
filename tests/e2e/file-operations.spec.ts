import { expect, test } from '@playwright/test';
import {
  openAppMenu,
  waitForBoard,
} from './utils';

async function getPickerCallCount(
  page: Parameters<typeof test>[0]['page'],
  type: 'open' | 'save',
) {
  return page.evaluate((pickerType) => {
    type PickerWindow = Window & {
      __thinkixPickerCalls?: { open: number; save: number };
    };

    return ((window as PickerWindow).__thinkixPickerCalls ?? { open: 0, save: 0 })[
      pickerType
    ];
  }, type);
}

async function openExportSubmenu(
  page: Parameters<typeof test>[0]['page'],
) {
  await openAppMenu(page);
  const exportTrigger = page.getByTestId('app-menu-export-trigger');
  await expect(exportTrigger).toBeVisible({ timeout: 5000 });
  await exportTrigger.hover();
  await exportTrigger.click();
  await expect(page.getByTestId('app-menu-export-svg')).toBeVisible({
    timeout: 5000,
  });
}

test.describe('File Operations E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      type PickerWindow = Window & {
        __thinkixPickerCalls?: { open: number; save: number };
        showOpenFilePicker?: () => Promise<never>;
        showSaveFilePicker?: () => Promise<never>;
      };

      const pickerWindow = window as PickerWindow;
      pickerWindow.__thinkixPickerCalls = { open: 0, save: 0 };

      pickerWindow.showOpenFilePicker = async () => {
        pickerWindow.__thinkixPickerCalls = {
          ...(pickerWindow.__thinkixPickerCalls ?? { open: 0, save: 0 }),
          open: (pickerWindow.__thinkixPickerCalls?.open ?? 0) + 1,
        };
        throw new DOMException('Aborted', 'AbortError');
      };

      pickerWindow.showSaveFilePicker = async () => {
        pickerWindow.__thinkixPickerCalls = {
          ...(pickerWindow.__thinkixPickerCalls ?? { open: 0, save: 0 }),
          save: (pickerWindow.__thinkixPickerCalls?.save ?? 0) + 1,
        };
        throw new DOMException('Aborted', 'AbortError');
      };
    });

    await waitForBoard(page);
  });

  test('opens the app menu', async ({ page }) => {
    const menu = await openAppMenu(page);
    await expect(menu).toBeVisible();
    await expect(page.getByTestId('app-menu-open-file')).toBeVisible();
  });

  test('triggers save from the app menu', async ({ page }) => {
    await openAppMenu(page);
    await page.getByTestId('app-menu-save-file').click();
    await expect.poll(() => getPickerCallCount(page, 'save')).toBe(1);
  });

  test('opens the file chooser from the app menu', async ({ page }) => {
    await openAppMenu(page);
    await page.getByTestId('app-menu-open-file').click();
    await expect.poll(() => getPickerCallCount(page, 'open')).toBe(1);
  });

  test('exports the board as SVG', async ({ page }) => {
    await openExportSubmenu(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('app-menu-export-svg').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.svg$/i);
  });

  test('exports the board as PNG', async ({ page }) => {
    await openExportSubmenu(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('app-menu-export-png-transparent').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.png$/i);
  });

  test('exports the board as JPG', async ({ page }) => {
    await openExportSubmenu(page);

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('app-menu-export-jpg').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/\.jpg$/i);
  });

  test('opens the clear board confirmation dialog', async ({ page }) => {
    await openAppMenu(page);
    await page.getByTestId('app-menu-clear-board').click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByTestId('clear-board-confirm')).toBeVisible();
  });
});
