import { test, expect } from '@playwright/test';

test.describe('Map Transition System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
    // Wait for game to fully load
    await page.waitForTimeout(2000);
  });

  test('should fade to black when player crosses area boundary', async ({ page }) => {
    // Get the fade overlay element
    const getOverlayAlpha = async () => {
      return await page.evaluate(() => {
        // Query the fade overlay rectangle created by MapTransition
        const canvas = document.querySelector('canvas');
        // We'll use console messages and game state to verify instead
        return window.__gameState?.fadeAlpha || 0;
      });
    };

    // Store initial state
    const initialLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('[TRANSITION]')) {
        initialLogs.push(msg.text());
        console.log(`Console: ${msg.text()}`);
      }
    });

    // Simulate player movement to the right to trigger transition
    // Player starts around x=100, needs to reach x=1280 to cross to shophouse area
    const movePlayerRight = async () => {
      for (let i = 0; i < 50; i++) {
        // Simulate arrow key or D key press
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(50);
      }
    };

    console.log('Starting player movement to trigger transition...');
    await movePlayerRight();

    // Wait for transition to potentially happen
    await page.waitForTimeout(1500);

    // Check if transition was logged
    const hasTransitionLog = initialLogs.some(log => 
      log.includes('[TRANSITION]') && log.includes('Boundary detected')
    );

    console.log('Transition logs:', initialLogs);

    // Verify transition occurred
    expect(hasTransitionLog).toBe(true);
  });

  test('should load new area after fade completes', async ({ page }) => {
    const transitionLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('[TRANSITION]')) {
        transitionLogs.push(msg.text());
      }
    });

    // Move player to boundary
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }

    // Wait for full transition (fade out 300ms + fade in 300ms + buffer)
    await page.waitForTimeout(2000);

    // Check for area loaded message
    const areaLoadedLog = transitionLogs.find(log => 
      log.includes('Area loaded')
    );

    console.log('All transition logs:', transitionLogs);
    
    expect(areaLoadedLog).toBeDefined();
    expect(areaLoadedLog).toMatch(/Area loaded:.*shophouse/);
  });

  test('should not freeze during transition', async ({ page }) => {
    let gameFroze = false;
    let lastFrameTime = Date.now();

    // Monitor frame rate - if no updates for 2+ seconds, game is frozen
    const frameMonitor = setInterval(() => {
      const now = Date.now();
      if (now - lastFrameTime > 2000) {
        gameFroze = true;
      }
    }, 100);

    page.on('console', msg => {
      // Update lastFrameTime whenever we see game output
      lastFrameTime = Date.now();
    });

    // Move player to boundary
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(50);
    }

    // Wait through full transition
    await page.waitForTimeout(2000);

    clearInterval(frameMonitor);

    expect(gameFroze).toBe(false);
  });

  test('should transition through multiple areas', async ({ page }) => {
    const allLogs = [];
    page.on('console', msg => {
      if (msg.text().includes('[TRANSITION]')) {
        allLogs.push(msg.text());
      }
    });

    // First transition: Pasar -> Shophouse
    console.log('Moving to first boundary...');
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(1500);

    const logsAfterFirst = allLogs.length;
    expect(logsAfterFirst).toBeGreaterThan(0);

    // Second transition: Shophouse -> Alley
    console.log('Moving to second boundary...');
    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(1500);

    const logsAfterSecond = allLogs.length;
    expect(logsAfterSecond).toBeGreaterThan(logsAfterFirst);

    console.log(`First transition logs: ${logsAfterFirst}, Second transition logs: ${logsAfterSecond}`);
  });
});
