import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const loop = fs.readFileSync(new URL('../src/loop.js', import.meta.url), 'utf8');

function makeRuntime() {
  const context = vm.createContext({
    canPlay: true,
    performance: {now: () => 0},
    gameState: {chamber: 1, enemies: [], projectiles: [], particles: [], doors: [], camera: {x: 0, y: 0}},
    gameRuntime: {settings: {reducedMotion: true}, frameMetrics: {frames: 0, simulationSteps: 0, droppedTimeMs: 0, averageWorkMs: 0, worstWorkMs: 0}},
    player: {x: 0, y: 0, radius: 24, update() {}, draw() {}},
    ctx: {clearRect() {}, save() {}, translate() {}, restore() {}},
    canvas: {width: 1440, height: 900},
    arena: {width: 1400, height: 900},
    screenShake: 0,
    updateAimAssist() {}, updateHeldActions() {}, resetRuntimeInput() {},
    drawChamberTiles() {}, drawProps() {},
    FireTrail: class {}, IceShardTrap: class {},
    requestAnimationFrame() {},
  });
  vm.runInContext('function runtimeCanPlay() { return canPlay; }', context);
  vm.runInContext(loop, context);
  return context;
}

test('each enemy and projectile advances once even when an earlier entity removes itself', () => {
  const runtime = makeRuntime(), updates = [];
  for (const kind of ['enemies', 'projectiles']) {
    const first = {update() { updates.push(kind + ':first'); runtime.gameState[kind].splice(0, 1); }};
    const second = {update() { updates.push(kind + ':second'); }};
    const third = {update() { updates.push(kind + ':third'); }};
    runtime.gameState[kind] = [first, second, third];
  }
  runtime.updateSimulation(1 / 60);
  assert.deepEqual(updates, ['enemies:first', 'enemies:second', 'enemies:third', 'projectiles:first', 'projectiles:second', 'projectiles:third']);
});

test('entities killed by an earlier update cannot act afterwards', () => {
  const runtime = makeRuntime();
  let attacks = 0;
  const victim = {dead: false, update() { attacks++; }};
  runtime.gameState.enemies = [{update() { victim.dead = true; }}, victim];
  const projectile = {destroyed: false, update() { attacks++; }};
  runtime.gameState.projectiles = [{update() { projectile.destroyed = true; }}, projectile];
  runtime.updateSimulation(1 / 60);
  assert.equal(attacks, 0);
});

test('a long frame uses bounded fixed steps instead of one tunnelling update', () => {
  const runtime = makeRuntime(), steps = [];
  runtime.updateSimulation = dt => steps.push(dt);
  runtime.gameLoop(10_000);
  assert.equal(steps.length, 4);
  assert.ok(steps.every(dt => dt === 1 / 60));
  assert.equal(runtime.gameRuntime.frameMetrics.simulationSteps, 4);
  assert.ok(runtime.gameRuntime.frameMetrics.droppedTimeMs > 9900);
});

test('pause freezes damage timers and discards accumulated catch-up time', () => {
  const runtime = makeRuntime();
  let calls = 0;
  runtime.scheduleGameAction(0.04, () => calls++);
  runtime.canPlay = false;
  runtime.gameLoop(5000);
  assert.equal(calls, 0);
  assert.equal(runtime.gameState.pendingActions[0].remaining, 0.04);
  runtime.canPlay = true;
  runtime.resetFrameClock();
  runtime.gameLoop(17);
  assert.equal(calls, 0);
  runtime.gameLoop(50);
  assert.equal(calls, 1);
});

test('due actions suspended by a menu resume, while explicit cancellation stays cancelled', () => {
  const runtime = makeRuntime();
  let calls = 0;
  runtime.scheduleGameAction(0, () => { runtime.canPlay = false; });
  runtime.scheduleGameAction(0, () => calls++);
  runtime.updateGameActions(1 / 60);
  assert.equal(calls, 0);
  assert.equal(runtime.gameState.pendingActions.length, 1);
  runtime.canPlay = true;
  runtime.updateGameActions(1 / 60);
  assert.equal(calls, 1);
  runtime.scheduleGameAction(0, () => { runtime.gameState.pendingActions = []; runtime.canPlay = false; });
  runtime.scheduleGameAction(0, () => calls++);
  runtime.updateGameActions(1 / 60);
  assert.equal(runtime.gameState.pendingActions.length, 0);
  runtime.canPlay = true;
  runtime.updateGameActions(1 / 60);
  assert.equal(calls, 1);
});

test('chamber transitions cancel old due attacks without dropping new chamber actions', () => {
  const runtime = makeRuntime();
  let calls = 0;
  runtime.scheduleGameAction(0, () => {
    runtime.gameState.chamber++;
    runtime.gameState.pendingActions = [];
    runtime.scheduleGameAction(0.1, () => calls += 10);
  });
  runtime.scheduleGameAction(0, () => calls++);
  runtime.updateGameActions(1 / 60);
  assert.equal(calls, 0);
  runtime.updateGameActions(0.11);
  assert.equal(calls, 10);
});

test('damaging boon areas draw below combat actors on each rendered frame', () => {
  const runtime = makeRuntime(), draws = [];
  runtime.drawBoonEffects = () => draws.push('boons');
  runtime.player.draw = () => draws.push('player');
  runtime.canPlay = false;
  runtime.gameLoop(17);
  assert.deepEqual(draws, ['boons', 'player']);
});

test('cosmetic overload never removes or shortens damaging and status fields', () => {
  const runtime = makeRuntime();
  vm.runInContext(fs.readFileSync(new URL('../src/effects.js', import.meta.url), 'utf8'), runtime);
  const report = vm.runInContext(`(() => {
    installEffectBudget();
    const fire = new FireTrail(0, 0), ice = new IceShardTrap(0, 0), charm = new CharmBurst(0, 0);
    const futureGameplay = {life: 4, update() {}, draw() {}};
    for (let i = 0; i < 15000; i++) {
      gameState.particles.push(new FloatingText(i % 300, i % 170, '10', '#fff'));
      gameState.particles.push(new Shockwave(i * 100, 0, 80, '#fff'));
    }
    gameState.particles.push(fire, ice, charm, futureGameplay);
    const before = [fire.life, ice.life, charm.life, futureGameplay.life];
    let damage = 0;
    const foe = {x: 0, y: 0, takeDamage(value) { damage += value; }, applyChill() {}};
    gameState.enemies = [foe];
    fire.update(0.1); ice.update(0.1); charm.update(0.1);
    const result = {length: gameState.particles.length, kept: [fire, ice, charm, futureGameplay].every(p => gameState.particles.includes(p)), before, damage, weak: foe.isWeak, weakTimer: foe.weakTimer};
    gameState.particles.compact();
    result.expiredIceRemoved = !gameState.particles.includes(ice);
    result.liveFieldsKept = [fire, charm, futureGameplay].every(p => gameState.particles.includes(p));
    return result;
  })()`, runtime);
  assert.ok(report.length <= 300);
  assert.equal(report.kept, true);
  assert.deepEqual(Array.from(report.before), [2, 3, 0.5, 4]);
  assert.equal(report.damage, 84);
  assert.equal(report.weak, true);
  assert.equal(report.weakTimer, 4);
  assert.equal(report.expiredIceRemoved, true);
  assert.equal(report.liveFieldsKept, true);
});

test('cosmetic budget remains installed after chamber clearing and merges displayed damage totals', () => {
  const runtime = makeRuntime();
  vm.runInContext(fs.readFileSync(new URL('../src/effects.js', import.meta.url), 'utf8'), runtime);
  const report = vm.runInContext(`(() => {
    installEffectBudget(); gameState.particles = [];
    for (let i = 0; i < 1000; i++) gameState.particles.push(new FloatingText(0, 0, '25', '#fff'));
    gameState.particles.compact();
    gameState.particles.push(new FloatingText(0, 0, '25', '#fff'));
    return {length: gameState.particles.length, total: gameState.particles[0].damageTotal};
  })()`, runtime);
  assert.equal(report.length, 1);
  assert.equal(report.total, 25025);
});

test('camera follows mobile movement within arena edges and centers the desktop arena', () => {
  const runtime = makeRuntime();
  runtime.player.x = 600; runtime.player.y = 420;
  assert.deepEqual({...runtime.clampedCameraTarget()}, {x: 0, y: 0});
  runtime.canvas.width = 390; runtime.canvas.height = 844;
  assert.deepEqual({...runtime.clampedCameraTarget()}, {x: 505, y: 28});
  runtime.gameState.camera = {x: 505, y: 28};
  runtime.canvas.width = 1440; runtime.canvas.height = 900;
  runtime.canPlay = false; runtime.gameLoop(17);
  assert.deepEqual({...runtime.gameState.camera}, {x: 0, y: 0});
});

test('offscreen projectiles retain their gameplay update while only their drawing is culled', () => {
  const runtime = makeRuntime();
  let updates = 0, draws = 0;
  const projectile = {x: 2000, y: 0, radius: 12, update() { updates++; }, draw() { draws++; }};
  runtime.gameState.projectiles = [projectile];
  runtime.gameLoop(17);
  assert.equal(updates, 1);
  assert.equal(draws, 0);
  assert.equal(runtime.gameState.projectiles[0], projectile);
});
