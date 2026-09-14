import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {withBrowser, preparePage} from './browser-harness.mjs';

await withBrowser(async ({browser, url, root}) => {
  const out = path.join(root, 'test-results');
  await fs.mkdir(out, {recursive: true});
  const checks = [];
  const {page, errors} = await preparePage(browser);
  const check = async (name, run) => { await run(); checks.push(name); console.log(`PASS ${name}`); };
  await page.goto(url);
  await page.waitForFunction(() => gameRuntime.ready);
  await check('assets load before combat and welcome screen is usable', async () => {
    assert.equal(await page.locator('#runtime-overlay').isVisible(), true);
    assert.equal(await page.evaluate(() => runtimeCanPlay()), false);
    assert.equal(await page.evaluate(() => Object.values(loadedImages).filter(i => i.naturalWidth > 0).length), 19);
    await page.screenshot({path: path.join(out, 'welcome-desktop.png')});
    await page.locator('#runtime-start').click();
    await page.waitForFunction(() => gameRuntime.started && !gameState.isPaused);
  });
  await page.evaluate(() => { gameState.enemies = []; player.iFrames = 1e6; });
  await check('keyboard movement responds and release stops movement', async () => {
    const before = await page.evaluate(() => player.x);
    await page.keyboard.down('d');
    await page.waitForTimeout(180);
    await page.keyboard.up('d');
    const after = await page.evaluate(() => player.x);
    assert.ok(after > before + 20);
    await page.waitForTimeout(80);
    assert.ok(Math.abs(await page.evaluate(() => player.x) - after) < 2);
  });
  await check('HUD clicks and key repeat do not trigger combat or dismiss menus', async () => {
    await page.evaluate(() => { player.attackTimer = 0; player.attackCombo = 0; });
    await page.locator('#open-codex-btn').click();
    assert.equal(await page.locator('#codex-modal').isVisible(), true);
    assert.equal(await page.evaluate(() => player.attackCombo), 0);
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#codex-modal').isVisible(), false);
    await page.keyboard.down('Tab');
    await page.keyboard.down('Tab');
    assert.equal(await page.locator('#codex-modal').isVisible(), true);
    await page.keyboard.up('Tab');
    await page.keyboard.press('Escape');
  });
  await check('focus loss clears held input and pauses safely', async () => {
    await page.keyboard.down('d');
    await page.evaluate(() => window.dispatchEvent(new Event('blur')));
    await page.keyboard.up('d');
    assert.equal(await page.evaluate(() => runtimeCanPlay()), false);
    assert.equal(await page.evaluate(() => Object.values(keys).some(Boolean) || mouse.leftDown || mouse.rightDown), false);
    const x = await page.evaluate(() => player.x);
    await page.waitForTimeout(100);
    assert.equal(await page.evaluate(() => player.x), x);
    await page.locator('#runtime-start').click();
    assert.equal(await page.evaluate(() => runtimeCanPlay()), true);
  });
  await check('reward choices cannot be bypassed with Escape', async () => {
    await page.evaluate(() => openGodBoonModal('zeus', () => {}));
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => gameState.isPaused), true);
    assert.equal(await page.locator('#boon-modal').isVisible(), true);
    await page.locator('#boon-choices-container .boon-card').first().click();
    assert.equal(await page.locator('#boon-modal').isVisible(), false);
    assert.equal(await page.evaluate(() => gameState.equippedBoons.length), 1);
  });
  await check('every enemy family renders and attacks without errors', async () => {
    const report = await page.evaluate(() => {
      gameState.isPaused = true;
      player.iFrames = 1e6;
      const names = Object.keys(ENEMY_TYPES);
      for (const type of names) {
        gameState.pendingActions = [];
        gameState.projectiles = [];
        gameState.particles = [];
        const enemy = new Enemy(80, -80, type);
        gameState.enemies = [enemy];
        enemy.attackCooldown = 0;
        enemy.update(1 / 60);
        enemy.draw(ctx);
        if (enemy.isTelegraphing) {
          enemy.telegraphTimer = 0;
          enemy.update(1 / 60);
        }
        for (const projectile of [...gameState.projectiles]) projectile.draw(ctx);
        for (const effect of [...gameState.particles]) effect.draw(ctx);
        if (![enemy.x, enemy.y, enemy.hp].every(Number.isFinite)) throw new Error(`Invalid enemy state: ${type}`);
      }
      return names.length;
    });
    assert.ok(report >= 40);
  });
  await check('all biomes and endless boss cycles render', async () => {
    for (const chamber of [1, 21, 41, 61, 81, 100, 130, 400, 430]) {
      await page.evaluate(n => { startChamber(n); gameState.isPaused = true; gameState.camera.x = 0; gameState.camera.y = 0; }, chamber);
      await page.waitForTimeout(50);
      if ([1, 100, 430].includes(chamber)) await page.screenshot({path: path.join(out, `arena-${chamber}.png`)});
    }
  });
  await check('permanent upgrades survive reload', async () => {
    await page.evaluate(() => { gameState.ashes = 50; handleGameOver(false); });
    await page.locator('#return-crossroads-btn').click();
    const before = await page.evaluate(() => gameState.upgrades.maxHp);
    await page.locator('#altar-items-grid button').first().click();
    assert.equal(await page.evaluate(() => gameState.upgrades.maxHp), before + 1);
    await page.reload();
    await page.waitForFunction(() => gameRuntime.ready);
    assert.equal(await page.evaluate(() => gameState.upgrades.maxHp), before + 1);
  });
  await check('dense combat runs without long tasks or runaway effects', async () => {
    await page.locator('#runtime-start').click();
    await page.evaluate(() => {
      startChamber(95);
      player.iFrames = 1e6;
      player.hp = player.maxHp;
      gameState.isPaused = false;
      window.qaLongTasks = [];
      if (PerformanceObserver.supportedEntryTypes.includes('longtask')) {
        const observer = new PerformanceObserver(list => window.qaLongTasks.push(...list.getEntries().map(e => e.duration)));
        observer.observe({type: 'longtask'});
        window.qaObserver = observer;
      }
    });
    await page.mouse.move(900, 430);
    await page.keyboard.down('j');
    await page.waitForTimeout(2000);
    await page.keyboard.up('j');
    const metrics = await page.evaluate(() => {
      window.qaObserver?.disconnect();
      return {...gameRuntime.frameMetrics, enemies: gameState.enemies.length, projectiles: gameState.projectiles.length, effects: gameState.particles.length, longTasks: window.qaLongTasks};
    });
    // Broad hardware-independent guard; record detailed timings without claiming universal FPS.
    assert.ok(metrics.frames > 30, JSON.stringify(metrics));
    assert.ok(metrics.projectiles < 2000 && metrics.effects < 5000, JSON.stringify(metrics));
    assert.ok(metrics.longTasks.every(ms => ms < 1000), JSON.stringify(metrics));
    await fs.writeFile(path.join(out, 'performance.json'), JSON.stringify(metrics, null, 2));
  });
  assert.deepEqual(errors, [], 'desktop runtime errors');
  await page.close();

  const mobile = await preparePage(browser, {viewport: {width: 390, height: 844}, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce'});
  await mobile.page.goto(url);
  await mobile.page.waitForFunction(() => gameRuntime.ready);
  await mobile.page.screenshot({path: path.join(out, 'welcome-mobile.png')});
  await mobile.page.locator('#runtime-start').tap();
  await mobile.page.evaluate(() => { gameState.enemies = []; player.iFrames = 1e6; });
  await check('mobile touch actions fit the screen and trigger abilities', async () => {
    assert.equal(await mobile.page.locator('#touch-controls').isVisible(), true);
    assert.equal(await mobile.page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    for (const locator of [mobile.page.locator('#touch-stick'), mobile.page.locator('.touch-action[data-action="strike"]'), mobile.page.locator('.touch-action[data-action="dash"]')]) {
      const box = await locator.boundingBox();
      assert.ok(box && box.x >= 0 && box.y >= 0 && box.x + box.width <= 391 && box.y + box.height <= 845, JSON.stringify(box));
    }
    await mobile.page.locator('.touch-action[data-action="cast"]').tap();
    assert.equal(await mobile.page.evaluate(() => player.castActive !== null), true);
    await mobile.page.locator('.touch-action[data-action="special"]').tap();
    assert.ok(await mobile.page.evaluate(() => player.specialCooldown > 0));
    await mobile.page.screenshot({path: path.join(out, 'arena-mobile.png')});
    assert.equal(await mobile.page.evaluate(() => gameRuntime.settings.reducedMotion), true);
  });
  await check('simultaneous touch movement and strike release cleanly', async () => {
    await mobile.page.evaluate(() => { player.attackTimer = 0; player.attackCombo = 0; player.isDashing = false; });
    const pad = await mobile.page.locator('#touch-stick').boundingBox();
    const strike = await mobile.page.locator('.touch-action[data-action="strike"]').boundingBox();
    const session = await mobile.page.context().newCDPSession(mobile.page);
    const movement = {id: 1, x: pad.x + pad.width / 2 + 35, y: pad.y + pad.height / 2};
    const attack = {id: 2, x: strike.x + strike.width / 2, y: strike.y + strike.height / 2};
    const before = await mobile.page.evaluate(() => player.x);
    await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [movement]});
    await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [movement, attack]});
    await mobile.page.waitForTimeout(180);
    assert.ok(await mobile.page.evaluate(() => player.x) > before + 20);
    assert.ok(await mobile.page.evaluate(() => player.attackCombo > 0 || player.attackTimer > 0));
    await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    assert.equal(await mobile.page.evaluate(() => Object.values(keys).some(Boolean)), false);
    assert.equal(await mobile.page.locator('.touch-action.is-held').count(), 0);
    await session.detach();
  });
  await mobile.page.setViewportSize({width: 844, height: 390});
  await mobile.page.waitForTimeout(80);
  await mobile.page.screenshot({path: path.join(out, 'arena-mobile-landscape.png')});
  assert.deepEqual(mobile.errors, [], 'mobile runtime errors');
  await mobile.page.close();

  const fallback = await preparePage(browser);
  await fallback.page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {get() { throw new DOMException('Storage unavailable', 'SecurityError'); }});
    const source = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    let failed = false;
    Object.defineProperty(HTMLImageElement.prototype, 'src', {...source, set(value) {
      if (!failed && value.startsWith('data:image/webp')) { failed = true; source.set.call(this, 'data:image/webp;base64,aW52YWxpZA=='); }
      else source.set.call(this, value);
    }});
  });
  await check('artwork failure and disabled storage do not block play', async () => {
    await fallback.page.goto(url);
    await fallback.page.waitForFunction(() => gameRuntime.ready);
    assert.equal(await fallback.page.evaluate(() => failedAssets.length), 1);
    await fallback.page.locator('#runtime-start').click();
    await fallback.page.keyboard.press('q');
    await fallback.page.waitForTimeout(120);
    assert.equal(await fallback.page.evaluate(() => runtimeCanPlay()), true);
    assert.deepEqual(fallback.errors, []);
  });
  await fallback.page.close();
  await fs.writeFile(path.join(out, 'checks.json'), JSON.stringify(checks, null, 2));
  console.log(`${checks.length} browser scenarios passed.`);
});
