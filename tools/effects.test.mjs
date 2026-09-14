import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

function projectileFixture(piercing) {
  const player = {x: -200, y: 0, radius: 24};
  const enemies = [20, 50].map(x => ({x, y: 0, radius: 10, hp: 100, hits: 0,
    takeDamage(amount) { this.hp -= amount; this.hits++; }}));
  const gameState = {enemies, projectiles: [], particles: []};
  const context = vm.createContext({player, gameState, Math,
    checkWallCollision: () => false, hasBoon: () => false,
    sound: {playHit() {}}, loadedImages: {}});
  vm.runInContext(fs.readFileSync(new URL('../src/effects.js', import.meta.url), 'utf8') +
    '\nglobalThis.ProjectileClass = Projectile;', context);
  const shard = new context.ProjectileClass(0, 0, 600, 0, 12, 'metal_shard', player);
  shard.piercing = piercing;
  gameState.projectiles.push(shard);
  return {shard, enemies, gameState};
}

test('piercing shrapnel hits aligned foes once each and expires', () => {
  const {shard, enemies, gameState} = projectileFixture(true);
  for (let step = 0; step < 6; step++) shard.update(1 / 60);
  assert.deepEqual(enemies.map(enemy => enemy.hits), [1, 1]);
  assert.deepEqual(enemies.map(enemy => enemy.hp), [88, 88]);
  assert.equal(gameState.projectiles.length, 1);
  shard.update(4);
  assert.equal(shard.destroyed, true);
  assert.equal(gameState.projectiles.length, 0);
});

test('ordinary projectiles stop at their first foe', () => {
  const {shard, enemies, gameState} = projectileFixture(false);
  for (let step = 0; step < 6; step++) shard.update(1 / 60);
  assert.deepEqual(enemies.map(enemy => enemy.hits), [1, 0]);
  assert.equal(shard.destroyed, true);
  assert.equal(gameState.projectiles.length, 0);
});
