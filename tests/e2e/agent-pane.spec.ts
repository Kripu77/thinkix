import { expect, test, type Page } from '@playwright/test';
import type { UIMessageChunk } from 'ai';
import { fulfillUIMessageStream } from './helpers/agent-stream';
import { getElementCount, openAppMenu, waitForBoard } from './utils';

const AGENT_SETTINGS_STORAGE_KEY = 'thinkix-agent-settings';
const AGENT_SHORTCUT = process.platform === 'darwin' ? 'Meta+KeyJ' : 'Control+KeyJ';

async function seedAgentSettings(
  page: Page,
  overrides: Partial<{
    apiKey: string;
    customModel: string;
    provider?: 'openai' | 'anthropic';
  }> = {},
) {
  await page.addInitScript(
    ([storageKey, seededOverrides]) => {
      window.localStorage.setItem(
        storageKey,
        JSON.stringify({
          apiKey: 'test-key',
          customModel: '',
          provider: 'anthropic',
          ...seededOverrides,
        }),
      );
    },
    [AGENT_SETTINGS_STORAGE_KEY, overrides] as const,
  );
}

async function openAgentPane(page: Page) {
  await page.keyboard.press(AGENT_SHORTCUT);
  await expect(page.getByTestId('agent-pane')).toBeVisible({ timeout: 10000 });
}

async function sendAgentPrompt(page: Page, prompt: string) {
  const textarea = page.getByTestId('agent-prompt-textarea');
  await textarea.fill(prompt);
  await page.getByTestId('agent-send-button').click();
  await expect(textarea).toHaveValue('');
}

async function selectCanvasTheme(
  page: Page,
  theme: 'default' | 'dark' | 'soft' | 'retro' | 'starry' | 'colorful',
) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await openAppMenu(page);
  await page.getByTestId('app-menu-theme-trigger').hover();
  await page.getByTestId('app-menu-theme-trigger').click();
  await expect(page.getByTestId(`app-menu-theme-${theme}`)).toBeVisible();
  await page.getByTestId(`app-menu-theme-${theme}`).click();
  await expect(page.getByTestId('app-menu-content')).not.toBeVisible({
    timeout: 5000,
  });
}

function textResponseChunks(messageId: string, text: string): UIMessageChunk[] {
  return [
    { type: 'start', messageId },
    { type: 'text-start', id: `${messageId}-text` },
    { type: 'text-delta', delta: text, id: `${messageId}-text` },
    { type: 'text-end', id: `${messageId}-text` },
    { type: 'finish', finishReason: 'stop' },
  ];
}

test.describe('Agent Pane E2E', () => {
  test.beforeEach(async ({ page }) => {
    await seedAgentSettings(page);
  });

  test('opens with the keyboard shortcut and streams a basic response', async ({
    page,
  }) => {
    await page.route('**/api/agent', async (route) => {
      await fulfillUIMessageStream(
        route,
        textResponseChunks('agent-basic-response', 'Here is a concise answer.'),
      );
    });

    await waitForBoard(page);
    await openAgentPane(page);
    await sendAgentPrompt(page, 'Say hello.');

    await expect(page.getByTestId('agent-message-list')).toContainText(
      'Here is a concise answer.',
    );
  });

  test('uses mocked Thinkix defaults without opening settings when no local key is saved', async ({
    page,
  }) => {
    await seedAgentSettings(page, { apiKey: '', provider: 'anthropic' });

    await page.route('**/api/agent/config', async (route) => {
      await route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify({
          provider: 'openai',
          hasDefaultApiKey: true,
          availableProviders: ['openai'],
          providerApiKeys: {
            openai: true,
            anthropic: false,
          },
        }),
      });
    });

    await page.route('**/api/agent', async (route) => {
      await fulfillUIMessageStream(
        route,
        textResponseChunks('agent-default-response', 'Thinkix defaults handled this request.'),
      );
    });

    await waitForBoard(page);
    await openAgentPane(page);

    await expect(page.getByTestId('agent-provider-select-trigger')).toContainText('OpenAI');
    await page.getByTestId('agent-provider-select-trigger').click();
    await expect(page.getByTestId('agent-provider-option-auto')).toBeVisible();
    await expect(page.getByTestId('agent-provider-option-openai')).toBeVisible();
    await expect(page.getByTestId('agent-provider-option-anthropic')).toHaveCount(0);
    await page.keyboard.press('Escape');

    await sendAgentPrompt(page, 'Use the Thinkix defaults.');

    await expect(page.getByRole('dialog', { name: 'AI Settings' })).toHaveCount(0);
    await expect(page.getByTestId('agent-message-list')).toContainText(
      'Thinkix defaults handled this request.',
    );
  });

  test('keeps pane and board chrome on the same surface system in dark mode', async ({
    page,
  }) => {
    await waitForBoard(page);
    await selectCanvasTheme(page, 'dark');
    await openAgentPane(page);
    await page.mouse.move(640, 360);

    const styles = await page.evaluate(() => {
      const read = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) {
          return null;
        }

        const css = window.getComputedStyle(element);
        return {
          backgroundColor: css.backgroundColor,
          borderColor: css.borderColor,
          color: css.color,
        };
      };

      return {
        rootTheme: document.documentElement.getAttribute('data-board-theme'),
        appMenu: read('[data-testid="app-menu-button"]'),
        boardToolbar: read('[data-testid="board-toolbar"]'),
        zoomToolbar: read('[data-testid="zoom-toolbar"]'),
        canvasModeToolbar: read('[data-testid="canvas-mode-toolbar"]'),
        agentPane: read('[data-testid="agent-pane"]'),
        agentPrompt: read('[data-testid="agent-prompt-shell"]'),
      };
    });

    expect(styles.rootTheme).toBe('dark');
    expect(styles.appMenu?.backgroundColor).toBe(styles.zoomToolbar?.backgroundColor);
    expect(styles.boardToolbar?.backgroundColor).toBe(styles.zoomToolbar?.backgroundColor);
    expect(styles.appMenu?.borderColor).toBe(styles.boardToolbar?.borderColor);
    expect(styles.canvasModeToolbar?.backgroundColor).toBe(styles.zoomToolbar?.backgroundColor);
    expect(styles.canvasModeToolbar?.borderColor).toBe(styles.agentPrompt?.borderColor);
    expect(styles.agentPane?.backgroundColor).not.toBe('rgb(255, 255, 255)');
  });

  test('renders tool activity and inserts a sticky note via mocked agent tool call', async ({
    page,
  }) => {
    let requestCount = 0;

    await page.route('**/api/agent', async (route) => {
      requestCount += 1;

      if (requestCount === 1) {
        await fulfillUIMessageStream(route, [
          { type: 'start', messageId: 'agent-tool-call' },
          {
            type: 'tool-input-available',
            dynamic: false,
            input: { command: 'touch sticky "Agent note" color:yellow' },
            toolCallId: 'tool-run-1',
            toolName: 'run',
          },
          { type: 'finish', finishReason: 'tool-calls' },
        ]);
        return;
      }

      if (requestCount > 2) {
        await fulfillUIMessageStream(route, []);
        return;
      }

      await fulfillUIMessageStream(
        route,
        textResponseChunks('agent-tool-finish', 'Added the sticky note to the board.'),
      );
    });

    await waitForBoard(page);
    await openAgentPane(page);
    await sendAgentPrompt(page, 'Add a sticky note.');

    await expect(page.getByTestId('agent-tool-row').first()).toBeVisible({
      timeout: 10000,
    });
    await expect.poll(() => getElementCount(page), { timeout: 10000 }).toBeGreaterThan(0);
    await expect(page.getByTestId('agent-message-list')).toContainText(
      'Added the sticky note to the board.',
    );
  });

  test('inserts a mind map from escaped markdown without page errors', async ({
    page,
  }) => {
    let requestCount = 0;
    const pageErrors: string[] = [];

    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    await page.route('**/api/agent', async (route) => {
      requestCount += 1;

      if (requestCount === 1) {
        await fulfillUIMessageStream(route, [
          { type: 'start', messageId: 'agent-mindmap-call' },
          {
            type: 'tool-input-available',
            dynamic: false,
            input: {
              command:
                "write mindmap '# Tech Trends\\n- Agentic AI\\n  - Automation\\n- Security\\n  - Resilience'",
            },
            toolCallId: 'tool-run-mindmap',
            toolName: 'run',
          },
          { type: 'finish', finishReason: 'tool-calls' },
        ]);
        return;
      }

      if (requestCount > 2) {
        await fulfillUIMessageStream(route, []);
        return;
      }

      await fulfillUIMessageStream(
        route,
        textResponseChunks('agent-mindmap-finish', 'Inserted the mind map.'),
      );
    });

    await waitForBoard(page);
    await openAgentPane(page);
    await sendAgentPrompt(page, 'Create a mind map for tech trends.');

    await expect(page.getByTestId('agent-tool-row').first()).toBeVisible({
      timeout: 10000,
    });
    await expect.poll(() => getElementCount(page), { timeout: 10000 }).toBeGreaterThan(0);
    await expect(page.getByTestId('agent-message-list')).toContainText(
      'Inserted the mind map.',
    );
    expect(
      pageErrors.filter((message) =>
        /can not get node|Unable to find the path|Cannot set properties of undefined/i.test(
          message,
        ),
      ),
    ).toEqual([]);
  });
});
