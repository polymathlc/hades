import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const readSource = name => fs.readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8');

function drawFixture() {
  const draws = [];
  const ctx = new Proxy({globalAlpha: 1}, {get(target, key) {
    if (!(key in target)) target[key] = () => {};
    return target[key];
  }});
  const context = vm.createContext({
    performance: {now: () => 0},
    gameState: {chamber: 1, enemies: [], projectiles: [], particles: [], doors: [], camera: {x: 0, y: 0}},
    gameRuntime: {settings: {reducedMotion: true}, frameMetrics: {frames: 0, simulationSteps: 0, droppedTimeMs: 0, averageWorkMs: 0, worstWorkMs: 0}},
    player: {x: 200, y: 100, radius: 24, angle: 0,
      castActive: Object.freeze({x: -80, y: 35, radius: 170, timer: 1.5, angle: 0.8})},
    ctx, canvas: {width: 1440, height: 900}, arena: {width: 1400, height: 900},
    screenShake: 0, loadedImages: {}, requestAnimationFrame() {}, runtimeCanPlay: () => false,
    drawChamberTiles: () => draws.push('floor'), drawProps: () => draws.push('props'),
    drawSvgCast: (_ctx, cast) => { if (cast) draws.push('cast'); },
  });
  vm.runInContext(readSource('effects.js'), context);
  vm.runInContext(readSource('loop.js'), context);
  // Exercise the real sprite draw method too: a leftover player-local cast
  // hook would draw the circle twice, including above the enemies.
  vm.runInContext(readSource('player.js').split('    const player = new Player();')[0] +
    '\nglobalThis.drawPlayerSprite = function () { Player.prototype.draw.call(player, ctx); };', context);
  context.player.draw = () => { draws.push('player'); context.drawPlayerSprite(); };
  return {context, draws};
}

test('cast circles and detonations draw once on the floor, beneath props and actors', () => {
  const {context, draws} = drawFixture();
  context.note = label => draws.push(label);
  vm.runInContext(`
    const castBlast = new AnimatedFireExplosion(-80, 35, 170, 'cast');
    const fireBlast = new AnimatedFireExplosion(-80, 35, 170, 'fire');
    const fireTrail = new FireTrail(0, 0), iceTrap = new IceShardTrap(0, 0);
    castBlast.draw = () => note('cast blast'); fireBlast.draw = () => note('fire blast');
    fireTrail.draw = () => note('fire trail'); iceTrap.draw = () => note('ice trap');
    gameState.particles = [castBlast, fireBlast, fireTrail, iceTrap];
    gameState.enemies = [{draw: () => note('enemy')}];
    gameState.projectiles = [{x: 0, y: 0, draw: () => note('projectile')}];
    gameLoop(17);
  `, context);
  assert.equal(draws[0], 'floor');
  for (const name of ['cast', 'cast blast', 'fire trail', 'ice trap']) {
    assert.equal(draws.filter(item => item === name).length, 1, `${name} must draw exactly once`);
    assert.ok(draws.indexOf(name) > draws.indexOf('floor'), `${name} must stay above the floor`);
    assert.ok(draws.indexOf(name) < draws.indexOf('props'), `${name} must stay beneath scenery`);
    assert.ok(draws.indexOf(name) < draws.indexOf('enemy'), `${name} must stay beneath enemies`);
    assert.ok(draws.indexOf(name) < draws.indexOf('player'), `${name} must stay beneath the player`);
  }
  for (const name of ['projectile', 'fire blast']) {
    assert.equal(draws.filter(item => item === name).length, 1);
    assert.ok(draws.indexOf(name) > draws.indexOf('player'), `${name} must retain its foreground layer`);
  }
});

test('moving the player does not move or duplicate an already placed summoning circle', () => {
  const {context} = drawFixture(), calls = [];
  const originalCast = context.player.castActive;
  context.drawSvgCast = (_ctx, cast, ...offsets) => {
    if (cast) calls.push({x: cast.x, y: cast.y, radius: cast.radius, offsets});
  };
  context.gameLoop(17);
  context.player.x = -430; context.player.y = 260;
  context.gameLoop(34);
  assert.deepEqual(calls, [
    {x: -80, y: 35, radius: 170, offsets: []},
    {x: -80, y: 35, radius: 170, offsets: []},
  ]);
  assert.equal(context.player.castActive, originalCast);
  assert.deepEqual({...originalCast}, {x: -80, y: 35, radius: 170, timer: 1.5, angle: 0.8});
});

test('ground classification leaves ordinary fire and unrelated visual effects in the foreground', () => {
  const {context} = drawFixture();
  const result = vm.runInContext(`[
    isGroundEffect(new AnimatedFireExplosion(0, 0, 170, 'cast')),
    isGroundEffect(new AnimatedFireExplosion(0, 0, 170)),
    isGroundEffect(new FireTrail(0, 0)),
    isGroundEffect(new IceShardTrap(0, 0)),
    isGroundEffect({artKind: 'cast', draw() {}})
  ]`, context);
  assert.deepEqual(Array.from(result), [true, false, true, true, false]);
});

test('overlapping fire effects cannot coalesce away the summoning-circle detonation', () => {
  const {context} = drawFixture();
  const result = vm.runInContext(`(() => {
    installEffectBudget();
    for (const kind of ['fire', 'cast', 'fire', 'cast'])
      gameState.particles.push(new AnimatedFireExplosion(10, 10, 170, kind));
    return gameState.particles.map(effect => effect.artKind);
  })()`, context);
  assert.deepEqual(Array.from(result), ['fire', 'cast']);
});

function castArtFixture(reducedMotion = false) {
  const calls = [];
  const source = readSource('attack-svg-art.js');
  const helper = source.slice(source.indexOf('    function drawSvgCast('), source.indexOf('    function drawSvgBoonEffects('));
  const context = vm.createContext({
    gameRuntime: {settings: {reducedMotion}},
    attackSvgArt: {draw(_ctx, key, x, y, width, height, angle, alpha) {
      calls.push({key, x, y, width, height, angle, alpha});
    }},
  });
  vm.runInContext(helper, context);
  return {context, calls};
}

test('the fixed circular boundary matches cast reach while only interior runes rotate', () => {
  const {context, calls} = castArtFixture();
  const cast = Object.freeze({x: 120, y: -60, radius: 210, timer: 2, angle: 1.3});
  context.drawSvgCast({}, cast);
  assert.ok(calls.length >= 2);
  assert.ok(calls.every(call => call.x === cast.x && call.y === cast.y));
  assert.ok(calls.every(call => call.width === call.height), 'a round hit area must have circular artwork');
  const boundary = calls.find(call => call.key === 'cast-outer');
  assert.ok(boundary, 'the visible boundary must always be drawn');
  // The SVG viewBox spans 200 units; the outlined outer edge lies at r=96.
  assert.ok(Math.abs(boundary.width * 96 / 200 - cast.radius) < 1e-9);
  assert.equal(boundary.angle, 0, 'rotating inner ornaments must not rotate the engraved ground boundary');
  const runes = calls.filter(call => call.key === 'cast-inner');
  assert.ok(runes.some(call => call.angle > 0));
  assert.ok(runes.some(call => call.angle < 0), 'the independent rune rings should counter-rotate');
  assert.deepEqual({...cast}, {x: 120, y: -60, radius: 210, timer: 2, angle: 1.3});
});

test('reduced motion keeps the ground circle and its rune rings stationary', () => {
  const {context, calls} = castArtFixture(true);
  context.drawSvgCast({}, {x: 0, y: 0, radius: 170, timer: 1, angle: 9});
  assert.ok(calls.length >= 2);
  assert.ok(calls.every(call => call.angle === 0));
  const before = calls.length;
  context.drawSvgCast({}, null);
  assert.equal(calls.length, before, 'an ended cast must not leave an active boundary behind');
});
