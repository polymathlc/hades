const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function fixture(saved = null, blockedStorage = false, realEffects = false) {
  const elements = new Map(), storage = new Map();
  if (saved !== null) storage.set('chronos-fall-progress-v1', JSON.stringify(saved));
  function element(tagName = 'div') {
    const node = { tagName, style: {}, dataset: {}, children: [], classList: { add() {}, remove() {} },
      appendChild(child) { this.children.push(child); }, getContext() { return new Proxy({}, { get: () => () => {} }); },
      querySelector(selector) { if (!this.button) this.button = element(selector); return this.button; }
    };
    Object.defineProperty(node, 'innerHTML', { set(value) { this.html = value; this.children = []; }, get() { return this.html || ''; } });
    return node;
  }
  const context = vm.createContext({ console, Math, performance: { now: () => 0 },
    document: { getElementById(id) { if (!elements.has(id)) elements.set(id, element()); return elements.get(id); }, createElement: element },
    localStorage: { getItem(key) { if (blockedStorage) throw Error('blocked'); return storage.get(key) || null; }, setItem(key, value) { if (blockedStorage) throw Error('blocked'); storage.set(key, value); } },
    window: { addEventListener() {} }, loadedImages: {}, canvas: { width: 1280, height: 800 }, mouse: { x: 640, y: 400 }, keys: {},
    sound: new Proxy({}, { get: () => () => {} }), renderGodPortraitToCanvas() {},
    scheduleGameAction(delay, callback) { context.pending.push({ delay, callback }); }, pending: [],
  });
  const effectClasses = ['Particle', 'FloatingText', 'Shockwave', 'AnimatedFireExplosion', 'AnimatedLightningStrike', 'AnimatedWaterWave', 'AnimatedAttackSweep', 'HitSpark', 'LunarRayEffect', 'FireTrail', 'IceShardTrap', 'CharmBurst', 'Projectile'];
  for (const name of effectClasses) context[name] = class { constructor(...args) { this.args = args; } };
  for (const file of ['data.js', 'world.js', 'player.js', 'enemies.js', ...(realEffects ? ['effects.js'] : []), 'boon-effects.js', 'flow.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'src', file), 'utf8'), context, { filename: file });
  }
  const run = code => vm.runInContext(code, context);
  run('player.resetForRun(); startChamber(1);');
  return { run, context, elements, storage };
}

{
  const f = fixture();
  f.run(`gameState.kills=88; gameState.gold=9999; gameState.upgrades.maxHp=3;
    gameState.equippedBoons=[{id:'hephaestus_armor'}, {id:'hermes_stride'}];
    player.attackTimer=9; player.dashCooldown=7; player.iFrames=8;
    player.resetForRun();`);
  assert.equal(f.run('player.maxHp'), 160);
  assert.equal(f.run('player.speed'), 330);
  assert.equal(f.run('gameState.kills'), 0);
  assert.equal(f.run('gameState.gold'), 80);
  assert.equal(f.run('player.attackTimer+player.dashCooldown'), 0);
  assert.equal(f.run('gameState.equippedBoons.length'), 0);
}
{
  const f = fixture();
  for (const chamber of [1, 2, 7, 19, 41, 61, 101, 401]) {
    for (let iteration = 0; iteration < 10; iteration++) {
      f.run(`startChamber(${chamber});`);
      assert(f.run('gameState.enemies.every(e=>!checkWallCollision(e.x,e.y,e.radius))'), `legal spawns at ${chamber}`);
      assert(f.run('gameState.enemies.every(e=>Math.hypot(e.x-player.x,e.y-player.y)>260)'), `safe opening at ${chamber}`);
      assert(f.run('gameState.enemies.length<=24'));
    }
  }
  f.run('startChamber(1); onChamberCleared();');
  assert(f.run("gameState.doors.some(d=>d.reward.type==='god')"));
  const bounty = f.run('gameState.gold');
  f.run('onChamberCleared();');
  assert.equal(f.run('gameState.gold'), bounty, 'room clear pays once');
  for (let i = 0; i < 100; i++) {
    f.run('setupExitGates();');
    assert(f.run("gameState.doors[0].reward.type!==gameState.doors[1].reward.type || gameState.doors[0].reward.godKey!==gameState.doors[1].reward.godKey"));
  }
}
{
  const f = fixture();
  f.run("gameState.equippedBoons=GODS.zeus.boons.map(b=>({...b,level:1,godName:'Zeus'})); openGodBoonModal('zeus');");
  assert.equal(f.elements.get('pom-modal').style.display, 'flex', 'exhausted god offers an upgrade');
  assert.equal(f.elements.get('pom-choices-container').children.length, 3);
  const button = f.elements.get('pom-choices-container').children[0];
  assert.equal(button.tagName, 'button');
  button.onclick(); button.onclick();
  assert.equal(f.run('gameState.equippedBoons.reduce((sum,b)=>sum+b.level,0)'), 11, 'double clicks upgrade once');
}
{
  const f = fixture();
  f.run('gameState.gold=500; openCharonShop();');
  f.elements.get('shop-choices-container').children[0].onclick();
  f.elements.get('boon-choices-container').children[0].onclick();
  assert.equal(f.run('gameState.isPaused'), true, 'shop stays paused after nested reward');
  assert.equal(f.elements.get('shop-modal').style.display, 'flex');
  f.run('openSkillCodex(); closeSkillCodex();');
  assert.equal(f.run('gameState.isPaused'), true, 'codex restores underlying pause');
  f.elements.get('leave-shop-btn').onclick();
  assert.equal(f.run('gameState.isPaused'), false);
}
{
  const f = fixture();
  f.run("gameState.ashes=123; gameState.upgrades.damage=7; gameState.bestChamber=130; savePermanentProgress();");
  const restored = fixture(JSON.parse(f.storage.get('chronos-fall-progress-v1')));
  assert.equal(restored.run('gameState.ashes'), 123);
  assert.equal(restored.run('gameState.upgrades.damage'), 7);
  assert.equal(restored.run('gameState.bestChamber'), 130);
  const corrupt = fixture({ version: 1, ashes: -55, upgrades: { damage: '999' } });
  assert.equal(corrupt.run('gameState.ashes'), 10);
  assert.equal(corrupt.run('gameState.upgrades.damage'), 0);
  assert.doesNotThrow(() => fixture(null, true));
}
{
  const f = fixture();
  f.run(`gameState.enemies=[new Enemy(10,0,'shade_wretch'),new Enemy(20,0,'shade_wretch')];
    player.x=0; player.y=0; player.angle=0; player.triggerAttack();`);
  assert.equal(f.run('gameState.enemies.length'), 0, 'one sweep hits adjacent enemies when the first dies');
  assert.equal(f.run('gameState.kills'), 2);
  f.run('player.iFrames=0; player.takeDamage(1000);');
  assert.equal(f.run('player.hp'), 100, 'cleared rooms cannot hurt player');
}
{
  const damage = [];
  for (const fps of [30, 60, 144]) {
    const f = fixture();
    f.run("gameState.enemies=[new Enemy(500,-300,'tartarus_behemoth')]; const target=gameState.enemies[0]; target.spawnGrace=0; target.attackCooldown=99; target.applyScorch(60);");
    f.run(`for(let i=0;i<${fps * 3};i++) target.update(1/${fps});`);
    damage.push(f.run('target.maxHp-target.hp'));
  }
  for (const value of damage) assert(Math.abs(value - 60) < 0.001, `burn damage remains 60 at each frame rate, got ${value}`);
}
{
  const f = fixture();
  f.run("startChamber(100); const boss=gameState.enemies[0]; player.x=0; player.y=0; player.iFrames=0; boss.startTelegraph('chronos_blitz',0.5,360); player.x=400; boss.executeAttack();");
  assert.equal(f.run('player.hp'), 100, 'dodging target-locked teleport works');
  assert.equal(f.run('boss.x'), 0);
  f.run("boss.startTelegraph('boss_timestop',0.8,200); player.x=600; boss.executeAttack();");
  assert.equal(f.run('player.hp'), 100, 'time-stop has an avoidable range');
  for (const attack of ['earthquake','quad_boulder_slam','poison_fan','flame_cone']) {
    const before = f.run('gameState.particles.length+gameState.projectiles.length');
    f.run(`boss.startTelegraph('${attack}',0.8,200); boss.executeAttack();`);
    assert(f.run('gameState.particles.length+gameState.projectiles.length') > before, `${attack} has an implemented effect`);
  }
}
console.log('Gameplay regressions passed: progression, rewards, saving, pause, AoE, damage timing, and boss fairness.');

// Independent review regressions exercise real combat hooks, not just reward copy.
{
  const f = fixture();
  f.run("gameState.equippedBoons=[{id:'hermes_wings',level:1},{id:'zeus_jolt',level:1,name:'Static Shock'}]; openPomModal();");
  assert.equal(f.elements.get('pom-choices-container').children.length, 1, 'unique utilities cannot consume a Pom');
  assert.match(f.elements.get('pom-choices-container').children[0].innerHTML, /Jolted damage: 140% of base/);
  f.elements.get('pom-choices-container').children[0].onclick();
  f.run("const joltedTarget=new Enemy(0,0,'tartarus_behemoth'); onEnemyBoonHit(joltedTarget,'player');");
  assert.equal(f.run('joltedTarget.jolted'), 112, 'the offered upgrade changes actual damage');
  f.run("gameState.equippedBoons=[{id:'hermes_wings',level:1}]; gameState.isPaused=true; openPomModal();");
  assert.equal(f.run('gameState.isPaused'), false, 'no-scalable-boon fallback cannot trap the game paused');
  assert.equal(f.run('player.maxHp'), 150);
  f.run("gameState.gold=500; openCharonShop();");
  f.elements.get('shop-choices-container').children[1].onclick();
  assert.equal(f.run('gameState.isPaused'), true, 'fallback from a purchased Pom returns to the paused shop');
  assert.equal(f.elements.get('shop-modal').style.display, 'flex');
}
{
  const f = fixture();
  f.run("gameState.equippedBoons=GODS.selene.boons.filter(b=>b.id!=='selene_hex_slow').map(b=>({...b,level:1})); openGodBoonModal('selene');");
  const choice = f.elements.get('boon-choices-container').children.find(card => card.innerHTML.includes('Phase Shift'));
  assert(choice, 'new Hex is offered'); choice.onclick();
  assert.equal(f.run("gameState.equippedBoons.filter(b=>b.slot==='Hex').length"), 1);
  assert.equal(f.run("gameState.equippedBoons.find(b=>b.slot==='Hex').id"), 'selene_hex_slow', 'selected Hex is active rather than shadowed by Lunar Ray');
  f.run('player.hexCharge=100; player.triggerHex();');
  assert(f.run('gameState.enemies.every(e=>e.timeSlowTimer===4.5)'));
}
{
  const f = fixture();
  f.run('gameState.enemies=[]; player.attackCombo=3; player.triggerAttack(); player.update(1/60);');
  assert.equal(f.run('player.attackDuration'), 0.32);
  assert(f.run('player.animFrame>=0 && player.animFrame<=3'), 'finisher never samples a negative sprite frame');
  f.run("player.attackTimer=0; player.attackCombo=0; gameState.equippedBoons=[{id:'hermes_speed'}]; player.triggerAttack(); const nimbleDuration=player.attackDuration; player.attackTimer=0; gameState.equippedBoons.push({id:'hermes_haste'}); player.triggerAttack();");
  assert(Math.abs(f.run('player.attackDuration/nimbleDuration')-0.4)<1e-9, 'Quick Strike still improves recovery with Nimble Mind');
}
{
  for (const defiance of [0, 1]) {
    const f = fixture();
    f.run(`gameState.equippedBoons=[{id:'zeus_bolt'}]; gameState.enemies=[new Enemy(0,0,'shade_wretch')]; player.x=0; player.y=0; player.iFrames=0; player.hp=10; player.defianceCount=${defiance}; player.takeDamage(20,gameState.enemies[0]);`);
    assert.equal(f.run('gameState.enemies.length'), 0, 'retaliatory hit clears the last enemy');
    assert.equal(f.run('player.hp'), defiance ? 50 : 0, 'room-clear healing cannot undo a lethal hit');
    assert.equal(f.run('player.defianceCount'), 0);
    assert.equal(f.run('gameState.isPaused'), !defiance);
  }
}
{
  const f = fixture(null, false, true);
  f.run("gameState.enemies=[new Enemy(0,0,'tartarus_behemoth')]; const fieldTarget=gameState.enemies[0]; addBoonArea('firestorm',0,0,240,5,150); for(let i=0;i<40;i++) addBoonArea('vortex',i*90,0,50,1,0);");
  assert.equal(f.run("gameState.boonAreas.filter(a=>a.damage).length"), 1, 'pull effects never evict damage fields');
  assert(f.run('gameState.boonAreas.length<=13'), 'redundant pull fields remain bounded');
  f.run('for(let i=0;i<300;i++) updateBoonEffects(1/60);');
  assert(Math.abs(f.run('fieldTarget.maxHp-fieldTarget.hp')-150)<1e-6, 'full firestorm damage survives vortex spam');
  f.run("gameState.enemies=[new Enemy(0,0,'tartarus_behemoth')]; const dashTarget=gameState.enemies[0]; player.x=0; player.y=0; player.angle=0; gameState.equippedBoons=[{id:'poseidon_dash',level:2},{id:'poseidon_undertow',level:1}]; player.triggerDash(); updateBoonEffects(1/60);");
  assert(Math.abs(f.run('dashTarget.maxHp-dashTarget.hp')-130)<1e-6, 'Tidal Dash upgrades remain useful alongside Undertow');
}
{
  const f = fixture(null, false, true);
  f.run("gameState.equippedBoons=[{id:'hestia_pyro'}]; gameState.enemies=[new Enemy(0,0,'tartarus_behemoth'),new Enemy(100,0,'tartarus_behemoth')]; gameState.enemies[0].applyScorch(60); for(let i=0;i<61;i++) updateEnemyBoonEffects(gameState.enemies[0],1/60);");
  assert.equal(f.run('gameState.enemies[1].scorchStacks'), 10, 'Pyroclast spreads a bounded half-strength burn');
  f.run("gameState.equippedBoons=[{id:'duo_heartbreak_doom'}]; gameState.enemies[0].isWeak=true; onEnemyBoonHit(gameState.enemies[0],'player');");
  assert(f.run("gameState.boonAreas.some(a=>a.type==='blades'&&a.damage===50)"), 'Heartbreak Doom creates its advertised damaging rift');
  f.run("gameState.equippedBoons=[{id:'duo_plasma'}]; gameState.enemies[0].scorchStacks=0; onEnemyBoonHit(gameState.enemies[0],'lightning');");
  assert.equal(f.run('gameState.enemies[0].scorchStacks'), 10, 'Plasma lightning ignites scorch');
  f.run("gameState.equippedBoons=[{id:'duo_sunlit_moon'}]; player.hexCharge=0; onSpecialBoonHit(gameState.enemies[0]);");
  assert.equal(f.run('player.hexCharge'), 24, 'Sunlit Moon doubles Hex charge');
  f.run("gameState.equippedBoons=[{id:'hestia_special'}]; player.triggerSpecial(); updateBoonEffects(1/60);");
  assert(f.run('gameState.particles.some(p=>p instanceof FireTrail)'), 'Magma Special leaves an actual damaging trail');
}
{
  const f = fixture(null, false, true);
  f.run("gameState.equippedBoons=[{id:'ares_grim'}]; gameState.enemies=[new Enemy(0,0,'shade_wretch'),new Enemy(80,0,'tartarus_behemoth')]; const doomedNeighbor=gameState.enemies[1]; gameState.enemies[0].applyDoom(90); gameState.enemies[0].takeDamage(999);");
  assert.equal(f.run('doomedNeighbor.maxHp-doomedNeighbor.hp'), 90, 'Grim Reaper triggers Doom immediately on adjacent targets');
}
{
  const f = fixture(null, false, true);
  const ids = f.run('Object.values(GODS).flatMap(g=>g.boons).concat(DUO_BOONS).map(b=>b.id)');
  for (const id of ids) {
    f.run(`player.resetForRun(); startChamber(1); gameState.equippedBoons=[{id:${JSON.stringify(id)},level:2}]; gameState.enemies=[new Enemy(70,0,'tartarus_behemoth')]; var smokeTarget=gameState.enemies[0]; smokeTarget.maxHp=smokeTarget.hp=10000; smokeTarget.spawnGrace=0; smokeTarget.isWeak=true; smokeTarget.applyChill(3); smokeTarget.applyScorch(30); player.x=0;player.y=0;player.angle=0;player.triggerAttack();player.triggerSpecial();player.triggerCast();player.triggerDash();player.hexCharge=100;player.triggerHex();player.iFrames=0;player.takeDamage(5,smokeTarget);for(let i=0;i<30;i++){player.update(1/60);for(const e of gameState.enemies.slice())e.update(1/60);for(const p of gameState.projectiles.slice())p.update(1/60);} globalThis.smokeValid=Number.isFinite(player.hp)&&gameState.enemies.every(e=>Number.isFinite(e.hp));`);
    assert(f.context.smokeValid, `${id} produces finite combat state`);
  }
  f.run("player.resetForRun();startChamber(1);gameState.equippedBoons=Object.values(GODS).flatMap(g=>g.boons).concat(DUO_BOONS).map(b=>({...b,level:2}));gameState.enemies=Array.from({length:24},(_,i)=>new Enemy(i*2,0,'shade_wretch'));for(const e of gameState.enemies){e.isWeak=true;e.scorchStacks=10;e.scorchTimer=3;e.chillTimer=3;e.doomDamage=90;}gameState.enemies[0].takeDamage(1000,'player');");
  assert.equal(f.run('gameState.kills'), 24, 'chained death boons resolve every enemy exactly once without recursive overflow');
  assert.equal(f.run('gameState.roomsCleared'), 1, 'chain reactions award the room clear once');
}
console.log('Independent boon review passed: real upgrade effects, Hex replacement, combo animation, lethal retaliation, bounded fields, synergies, and every boon combat smoke.');
