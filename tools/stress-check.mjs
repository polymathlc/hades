import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {withBrowser, preparePage} from './browser-harness.mjs';

// Deliberately stronger than a legal run: every god boon against immortal foes.
// This catches missing startup integration of the cosmetic budget, not just its helper.
await withBrowser(async ({browser, url, root}) => {
  const {page, errors} = await preparePage(browser);
  await page.goto(url);
  await page.waitForFunction(() => gameRuntime.ready);
  await page.locator('#runtime-start').click();
  await page.evaluate(() => {
    gameState.equippedBoons = Object.values(GODS).flatMap(god => god.boons.map(boon => ({...boon, level: 1, godName: god.name})));
    startChamber(95);
    player.x = player.y = 0;
    player.iFrames = 1e9;
    gameState.enemies.forEach((enemy, index) => {
      enemy.hp = enemy.maxHp = 1e8;
      enemy.x = Math.cos(index) * 170;
      enemy.y = Math.sin(index) * 170;
    });
    updateHUD();
    const cosmetics = new Set([Particle, HitSpark, AnimatedLightningStrike, AnimatedFireExplosion, AnimatedWaterWave, AnimatedAttackSweep, Shockwave, LunarRayEffect, FloatingText]);
    window.stressReport = {peakCosmetics: 0, peakProjectiles: 0, samples: 0};
    window.stressTimer = setInterval(() => {
      player.triggerCast(); player.triggerSpecial(); player.triggerHex();
      window.stressReport.peakCosmetics = Math.max(window.stressReport.peakCosmetics, gameState.particles.filter(effect => cosmetics.has(effect.constructor)).length);
      window.stressReport.peakProjectiles = Math.max(window.stressReport.peakProjectiles, gameState.projectiles.length);
      window.stressReport.samples++;
    }, 250);
  });
  await page.mouse.move(900, 450);
  await page.keyboard.down('j');
  await page.waitForTimeout(3000);
  await page.keyboard.up('j');
  const report = await page.evaluate(() => {
    clearInterval(window.stressTimer);
    return {...window.stressReport, metrics: gameRuntime.frameMetrics, finite: Number.isFinite(player.hp) && gameState.enemies.every(enemy => Number.isFinite(enemy.hp))};
  });
  assert.ok(report.samples >= 5, 'combat continued throughout the stress fixture');
  assert.ok(report.peakCosmetics > 0 && report.peakCosmetics <= 296, JSON.stringify(report));
  assert.ok(report.peakProjectiles > 0, 'projectiles still simulate under visual pressure');
  assert.equal(report.finite, true);
  assert.deepEqual(errors, []);
  await fs.mkdir(path.join(root, 'test-results'), {recursive: true});
  await fs.writeFile(path.join(root, 'test-results', 'stress-performance.json'), JSON.stringify(report, null, 2));
  console.log(`PASS extreme boon build: ${report.peakCosmetics} peak cosmetic effects; ${report.metrics.averageWorkMs.toFixed(2)}ms average update/render work (environment-specific).`);
});
