import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {withBrowser, preparePage} from './browser-harness.mjs';

await withBrowser(async ({browser, url, root}) => {
  const {page, errors} = await preparePage(browser, {viewport: {width: 1100, height: 800}});
  await page.goto(url);
  await page.waitForFunction(() => gameRuntime.ready);
  await page.locator('#runtime-start').click();
  await page.evaluate(() => {
    gameState.equippedBoons = [];
    gameState.projectiles = [];
    gameState.particles = [];
    gameRuntime.settings.reducedMotion = false;
    player.x = -28;
    player.y = 195;
    player.magick = player.maxMagick;
    player.castActive = null;
    player.iFrames = 0;
    gameState.camera.x = 0;
    gameState.camera.y = 0;
    mouse.x = canvas.width / 2;
    mouse.y = canvas.height / 2 + 170;
    player.triggerCast();
    player.castActive.timer = 2.1;
    player.castActive.angle = 2;
    gameState.enemies = [new Enemy(42, 193, 'shade_wretch')];
    gameState.isPaused = true;
    screenShake = 0;
    window.castGroundEvidence = {frame: 0, order: [], cast: null};
    const floorDraw = drawChamberTiles;
    drawChamberTiles = function(context) {
      window.castGroundEvidence.frame++;
      window.castGroundEvidence.order = ['floor'];
      floorDraw(context);
    };
    const castDraw = drawSvgCast;
    drawSvgCast = function(context, cast, ...origin) {
      window.castGroundEvidence.order.push('cast');
      if (!cast) return castDraw(context, cast, ...origin);
      const transform = context.getTransform();
      const rotations = [];
      const rotate = context.rotate;
      context.rotate = function(angle) {
        rotations.push(angle);
        rotate.call(this, angle);
      };
      try { castDraw(context, cast, ...origin); }
      finally { context.rotate = rotate; }
      window.castGroundEvidence.cast = {
        x: cast.x, y: cast.y, radius: cast.radius,
        screenX: transform.a * cast.x + transform.c * cast.y + transform.e,
        screenY: transform.b * cast.x + transform.d * cast.y + transform.f,
        cameraX: gameState.camera.x, cameraY: gameState.camera.y,
        playerX: player.x, playerY: player.y, rotations, origin
      };
    };
    const propDraw = drawProps;
    drawProps = function(...args) {
      window.castGroundEvidence.order.push('props');
      propDraw(...args);
    };
    const enemyDraw = Enemy.prototype.draw;
    Enemy.prototype.draw = function(...args) {
      window.castGroundEvidence.order.push('enemy');
      enemyDraw.apply(this, args);
    };
    const playerDraw = player.draw;
    player.draw = function(...args) {
      window.castGroundEvidence.order.push('player');
      playerDraw.apply(this, args);
    };
  });
  await page.waitForFunction(() => window.castGroundEvidence.cast);
  const first = await page.evaluate(() => window.castGroundEvidence);
  assert.deepEqual(first.order, ['floor', 'cast', 'props', 'enemy', 'player']);
  assert.deepEqual(first.cast.origin, [], 'the render loop supplies world coordinates');
  assert.equal(first.cast.radius, 100, 'the real base cast keeps its gameplay radius');
  assert.deepEqual(first.cast.rotations, [.16, -.26]);
  assert.equal(first.cast.x, 0);
  assert.equal(first.cast.y, 170);
  assert.ok(Math.hypot(first.cast.playerX, first.cast.playerY - 170) < 100);
  const output = path.join(root, 'test-results');
  await fs.mkdir(output, {recursive: true});
  await page.screenshot({path: path.join(output, 'cast-ground-overlap.png')});
  console.log('PASS actual game renders the summoning circle beneath scenery, enemy and player');

  const movedFrame = await page.evaluate(() => {
    player.x += 140;
    gameState.camera.x = 80;
    return window.castGroundEvidence.frame;
  });
  await page.waitForFunction(frame => window.castGroundEvidence.frame > frame, movedFrame);
  const moved = await page.evaluate(() => window.castGroundEvidence.cast);
  assert.equal(moved.x, first.cast.x);
  assert.equal(moved.y, first.cast.y);
  assert.equal(moved.playerX, first.cast.playerX + 140);
  assert.equal(moved.screenX - first.cast.screenX, first.cast.cameraX - moved.cameraX);
  assert.equal(moved.screenY - first.cast.screenY, first.cast.cameraY - moved.cameraY);
  assert.notEqual(moved.cameraX, first.cast.cameraX, 'exercise actual camera movement');
  await page.screenshot({path: path.join(output, 'cast-ground-world-anchor.png')});
  console.log('PASS moving the player and camera leaves the cast at its original world position');

  const reducedFrame = await page.evaluate(() => {
    gameRuntime.settings.reducedMotion = true;
    player.castActive.angle = 40;
    return window.castGroundEvidence.frame;
  });
  await page.waitForFunction(frame => window.castGroundEvidence.frame > frame, reducedFrame);
  const reduced = await page.evaluate(() => window.castGroundEvidence.cast);
  assert.deepEqual(reduced.rotations, [], 'all inscription rings stay still with reduced motion');
  assert.equal(reduced.radius, first.cast.radius);
  assert.equal(reduced.x, first.cast.x);
  assert.equal(reduced.y, first.cast.y);
  console.log('PASS reduced motion freezes ritual rings without changing targeting');

  const burstFrame = await page.evaluate(() => {
    player.x = -28;
    gameState.camera.x = 0;
    player.detonateCast();
    screenShake = 0;
    const burst = gameState.particles.find(effect => effect instanceof AnimatedFireExplosion && effect.artKind === 'cast');
    if (!burst) throw new Error('The actual cast did not create its SVG detonation');
    window.castBurstGround = isGroundEffect(burst);
    const burstDraw = burst.draw;
    burst.draw = function(...args) {
      window.castGroundEvidence.order.push('burst');
      burstDraw.apply(this, args);
    };
    return window.castGroundEvidence.frame;
  });
  await page.waitForFunction(frame => window.castGroundEvidence.frame > frame, burstFrame);
  const burst = await page.evaluate(() => ({order: window.castGroundEvidence.order, ground: window.castBurstGround}));
  assert.equal(burst.ground, true);
  assert.ok(burst.order.indexOf('burst') > burst.order.indexOf('floor'));
  assert.ok(burst.order.indexOf('burst') < burst.order.indexOf('props'));
  assert.ok(burst.order.indexOf('burst') < burst.order.indexOf('enemy'));
  assert.ok(burst.order.indexOf('burst') < burst.order.indexOf('player'));
  await page.screenshot({path: path.join(output, 'cast-ground-detonation.png')});
  assert.deepEqual(errors, []);
  console.log('PASS real cast detonation remains a floor ripple beneath overlapping actors');
  await page.close();
});
