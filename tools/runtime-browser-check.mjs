import assert from 'node:assert/strict';
import {withBrowser, preparePage} from './browser-harness.mjs';

await withBrowser(async ({browser, url}) => {
  const {page, errors} = await preparePage(browser);
  await page.goto(url);
  await page.waitForFunction(() => gameRuntime.ready);
  await page.locator('#runtime-start').click();
  await page.evaluate(() => { gameState.enemies = []; player.iFrames = 1e6; });

  await page.locator('#open-codex-btn').click();
  await page.locator('#close-codex-btn').click();
  await page.waitForFunction(() => document.activeElement === canvas);
  const before = await page.evaluate(() => player.x);
  await page.keyboard.down('a');
  await page.waitForTimeout(130);
  await page.keyboard.up('a');
  assert.ok(await page.evaluate(() => player.x) < before - 15);
  console.log('PASS closing a modal with its button restores keyboard movement');

  await page.evaluate(() => {
    window.delayedHits = 0;
    scheduleGameAction(0.1, () => window.delayedHits++);
    pauseRuntime();
  });
  await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.delayedHits), 0);
  assert.equal(await page.evaluate(() => sound.bgmTimer), null);
  await page.waitForFunction(() => sound.voices.size === 0);
  await page.locator('#runtime-start').click();
  await page.waitForFunction(() => window.delayedHits === 1);
  console.log('PASS pause suspends combat timers and disconnects active audio voices');

  await page.locator('#runtime-pause').click();
  await page.locator('#runtime-mute').check();
  await page.locator('#runtime-motion').check();
  await page.reload();
  await page.waitForFunction(() => gameRuntime.ready);
  assert.equal(await page.locator('#runtime-mute').isChecked(), true);
  assert.equal(await page.locator('#runtime-motion').isChecked(), true);
  assert.equal(await page.evaluate(() => document.documentElement.classList.contains('reduced-motion')), true);
  assert.deepEqual(errors, []);
  await page.close();
  console.log('PASS audio and reduced-motion settings survive reload');

  const mobile = await preparePage(browser, {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true});
  await mobile.page.goto(url);
  await mobile.page.waitForFunction(() => gameRuntime.ready);
  await mobile.page.locator('#runtime-start').tap();
  await mobile.page.evaluate(() => { gameState.enemies = []; player.iFrames = 1e6; });
  const client = await mobile.page.context().newCDPSession(mobile.page);
  const stick = await mobile.page.locator('#touch-stick').boundingBox();
  const initialX = await mobile.page.evaluate(() => player.x);
  await client.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x: stick.x + stick.width * .85, y: stick.y + stick.height / 2, id: 1}]});
  await mobile.page.waitForTimeout(160);
  assert.ok(await mobile.page.evaluate(() => player.x) > initialX + 20);
  await client.send('Input.dispatchTouchEvent', {type: 'touchCancel', touchPoints: []});
  assert.equal(await mobile.page.evaluate(() => Boolean(keys.a || keys.d || keys.w || keys.s)), false);
  const stoppedX = await mobile.page.evaluate(() => player.x);
  await mobile.page.waitForTimeout(100);
  assert.equal(await mobile.page.evaluate(() => player.x), stoppedX);
  assert.deepEqual(mobile.errors, []);
  await mobile.page.close();
  console.log('PASS real touch joystick moves the player and cancellation clears held movement');

  const fallback = await preparePage(browser);
  await fallback.page.addInitScript(() => {
    const imageSource = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    let count = 0;
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      configurable: true,
      get: imageSource.get,
      set(value) { imageSource.set.call(this, ++count === 1 ? 'data:image/webp;base64,invalid' : value); }
    });
    Object.defineProperty(window, 'localStorage', {get() { throw new DOMException('Storage unavailable', 'SecurityError'); }});
  });
  await fallback.page.goto(url);
  await fallback.page.waitForFunction(() => gameRuntime.ready);
  assert.equal(await fallback.page.evaluate(() => failedAssets.includes('hero')), true);
  await fallback.page.locator('#runtime-start').click();
  await fallback.page.waitForTimeout(160);
  assert.equal(await fallback.page.evaluate(() => runtimeCanPlay()), true);
  assert.deepEqual(fallback.errors, []);
  await fallback.page.close();
  console.log('PASS failed artwork and disabled storage still allow a playable run');
});
