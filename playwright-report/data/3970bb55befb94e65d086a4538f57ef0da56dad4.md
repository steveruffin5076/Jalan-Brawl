# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: map-transition.spec.js >> Map Transition System >> should load new area after fade completes
- Location: tests\map-transition.spec.js:57:3

# Error details

```
Error: expect(received).toBeDefined()

Received: undefined
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Map Transition System', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });
  6   |     // Wait for game to fully load
  7   |     await page.waitForTimeout(2000);
  8   |   });
  9   | 
  10  |   test('should fade to black when player crosses area boundary', async ({ page }) => {
  11  |     // Get the fade overlay element
  12  |     const getOverlayAlpha = async () => {
  13  |       return await page.evaluate(() => {
  14  |         // Query the fade overlay rectangle created by MapTransition
  15  |         const canvas = document.querySelector('canvas');
  16  |         // We'll use console messages and game state to verify instead
  17  |         return window.__gameState?.fadeAlpha || 0;
  18  |       });
  19  |     };
  20  | 
  21  |     // Store initial state
  22  |     const initialLogs = [];
  23  |     page.on('console', msg => {
  24  |       if (msg.text().includes('[TRANSITION]')) {
  25  |         initialLogs.push(msg.text());
  26  |         console.log(`Console: ${msg.text()}`);
  27  |       }
  28  |     });
  29  | 
  30  |     // Simulate player movement to the right to trigger transition
  31  |     // Player starts around x=100, needs to reach x=1280 to cross to shophouse area
  32  |     const movePlayerRight = async () => {
  33  |       for (let i = 0; i < 50; i++) {
  34  |         // Simulate arrow key or D key press
  35  |         await page.keyboard.press('ArrowRight');
  36  |         await page.waitForTimeout(50);
  37  |       }
  38  |     };
  39  | 
  40  |     console.log('Starting player movement to trigger transition...');
  41  |     await movePlayerRight();
  42  | 
  43  |     // Wait for transition to potentially happen
  44  |     await page.waitForTimeout(1500);
  45  | 
  46  |     // Check if transition was logged
  47  |     const hasTransitionLog = initialLogs.some(log => 
  48  |       log.includes('[TRANSITION]') && log.includes('Boundary detected')
  49  |     );
  50  | 
  51  |     console.log('Transition logs:', initialLogs);
  52  | 
  53  |     // Verify transition occurred
  54  |     expect(hasTransitionLog).toBe(true);
  55  |   });
  56  | 
  57  |   test('should load new area after fade completes', async ({ page }) => {
  58  |     const transitionLogs = [];
  59  |     page.on('console', msg => {
  60  |       if (msg.text().includes('[TRANSITION]')) {
  61  |         transitionLogs.push(msg.text());
  62  |       }
  63  |     });
  64  | 
  65  |     // Move player to boundary
  66  |     for (let i = 0; i < 50; i++) {
  67  |       await page.keyboard.press('ArrowRight');
  68  |       await page.waitForTimeout(50);
  69  |     }
  70  | 
  71  |     // Wait for full transition (fade out 300ms + fade in 300ms + buffer)
  72  |     await page.waitForTimeout(2000);
  73  | 
  74  |     // Check for area loaded message
  75  |     const areaLoadedLog = transitionLogs.find(log => 
  76  |       log.includes('Area loaded')
  77  |     );
  78  | 
  79  |     console.log('All transition logs:', transitionLogs);
  80  |     
> 81  |     expect(areaLoadedLog).toBeDefined();
      |                           ^ Error: expect(received).toBeDefined()
  82  |     expect(areaLoadedLog).toMatch(/Area loaded:.*shophouse/);
  83  |   });
  84  | 
  85  |   test('should not freeze during transition', async ({ page }) => {
  86  |     let gameFroze = false;
  87  |     let lastFrameTime = Date.now();
  88  | 
  89  |     // Monitor frame rate - if no updates for 2+ seconds, game is frozen
  90  |     const frameMonitor = setInterval(() => {
  91  |       const now = Date.now();
  92  |       if (now - lastFrameTime > 2000) {
  93  |         gameFroze = true;
  94  |       }
  95  |     }, 100);
  96  | 
  97  |     page.on('console', msg => {
  98  |       // Update lastFrameTime whenever we see game output
  99  |       lastFrameTime = Date.now();
  100 |     });
  101 | 
  102 |     // Move player to boundary
  103 |     for (let i = 0; i < 50; i++) {
  104 |       await page.keyboard.press('ArrowRight');
  105 |       await page.waitForTimeout(50);
  106 |     }
  107 | 
  108 |     // Wait through full transition
  109 |     await page.waitForTimeout(2000);
  110 | 
  111 |     clearInterval(frameMonitor);
  112 | 
  113 |     expect(gameFroze).toBe(false);
  114 |   });
  115 | 
  116 |   test('should transition through multiple areas', async ({ page }) => {
  117 |     const allLogs = [];
  118 |     page.on('console', msg => {
  119 |       if (msg.text().includes('[TRANSITION]')) {
  120 |         allLogs.push(msg.text());
  121 |       }
  122 |     });
  123 | 
  124 |     // First transition: Pasar -> Shophouse
  125 |     console.log('Moving to first boundary...');
  126 |     for (let i = 0; i < 50; i++) {
  127 |       await page.keyboard.press('ArrowRight');
  128 |       await page.waitForTimeout(30);
  129 |     }
  130 |     await page.waitForTimeout(1500);
  131 | 
  132 |     const logsAfterFirst = allLogs.length;
  133 |     expect(logsAfterFirst).toBeGreaterThan(0);
  134 | 
  135 |     // Second transition: Shophouse -> Alley
  136 |     console.log('Moving to second boundary...');
  137 |     for (let i = 0; i < 50; i++) {
  138 |       await page.keyboard.press('ArrowRight');
  139 |       await page.waitForTimeout(30);
  140 |     }
  141 |     await page.waitForTimeout(1500);
  142 | 
  143 |     const logsAfterSecond = allLogs.length;
  144 |     expect(logsAfterSecond).toBeGreaterThan(logsAfterFirst);
  145 | 
  146 |     console.log(`First transition logs: ${logsAfterFirst}, Second transition logs: ${logsAfterSecond}`);
  147 |   });
  148 | });
  149 | 
```