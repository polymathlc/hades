import assert from 'node:assert/strict';
import {withBrowser, preparePage} from './browser-harness.mjs';

function overlaps(a, b) {
  return a.x < b.x + b.width && b.x < a.x + a.width &&
    a.y < b.y + b.height && b.y < a.y + a.height;
}

await withBrowser(async ({browser, url}) => {
  for (const [width, height, touch] of [[1440, 900, false], [320, 568, true], [390, 844, true], [844, 390, true], [768, 1024, true]]) {
    const {page, errors} = await preparePage(browser, {
      viewport: {width, height}, isMobile: touch, hasTouch: touch,
      reducedMotion: 'reduce',
    });
    await page.goto(url);
    await page.waitForFunction(() => gameRuntime.ready);
    await page.locator('#runtime-start').click();
    await page.evaluate(() => {
      startChamber(100);
      gameState.isPaused = true;
      gameState.equippedBoons = GODS.zeus.boons.slice(0, 4).map(boon => ({...boon, level: 1, godName: 'Zeus'}));
      updateHUD();
    });
    const box = selector => page.locator(selector).boundingBox();
    const pause = await box('#runtime-toolbar');
    const codex = await box('#open-codex-btn');
    assert.equal(overlaps(pause, codex), false, `Pause and Boons remain separate at ${width}×${height}`);
    const boss = await box('#boss-hud');
    assert.equal(overlaps(boss, await box('.top-hud')), false, `Boss does not cover top HUD at ${width}×${height}`);
    assert.equal(overlaps(await box('#active-boons'), await box('.top-hud')), false, `Boon badges follow top HUD at ${width}×${height}`);
    if (touch) {
      assert.equal(overlaps(boss, await box('#touch-stick')), false, 'Boss does not cover movement pad');
      assert.equal(overlaps(boss, await box('.touch-actions')), false, 'Boss does not cover action buttons');
    }
    for (const item of [pause, codex, boss]) {
      assert.ok(item.x >= 0 && item.y >= 0 && item.x + item.width <= width + 1 && item.y + item.height <= height + 1, 'HUD stays within viewport');
    }
    await page.evaluate(() => openGodBoonModal('poseidon', () => {}));
    const modal = await page.locator('#boon-modal .modal-card').evaluate(node => ({
      width: node.clientWidth, scrollWidth: node.scrollWidth,
      rect: node.getBoundingClientRect().toJSON(),
    }));
    assert.ok(modal.scrollWidth <= modal.width + 1, 'Reward text does not overflow horizontally');
    assert.ok(modal.rect.y >= 0 && modal.rect.bottom <= height + 1, 'Reward modal fits viewport and scrolls internally');
    for (const choice of await page.locator('#boon-choices-container .boon-card').all()) {
      await choice.scrollIntoViewIfNeeded();
      assert.equal(await choice.isVisible(), true, 'Every reward can be reached');
    }
    assert.deepEqual(errors, []);
    console.log(`PASS graphics and reward layout ${width}×${height}`);
    await page.close();
  }
});
