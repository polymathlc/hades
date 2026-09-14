import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Exercise the reward UI and actual combat calculations together. A label-only
// tier change must never satisfy these regressions.
function fixture({score = 5, learning = true} = {}) {
  const elements = new Map();
  function element(tagName = 'div') {
    const node = {
      tagName, style: {}, dataset: {}, children: [], hidden: false,
      classList: {add() {}, remove() {}},
      appendChild(child) {this.children.push(child);}, append(child) {this.children.push(child);},
      getContext() {return new Proxy({}, {get: () => () => {}});},
      querySelector(selector) {return this.button ||= element(selector);}
    };
    Object.defineProperty(node, 'innerHTML', {
      set(value) {this.html = value; this.children = [];}, get() {return this.html || '';}
    });
    return node;
  }
  const parent = {postMessage() {}};
  const location = {origin: 'https://learning.example.test', search: learning ? '?learning=1&subject=math' : ''};
  let context;
  context = vm.createContext({
    console, Math, URLSearchParams, encodeURIComponent, crypto: {randomUUID: () => 'score-test-request'},
    performance: {now: () => 0},
    document: {hidden: false, getElementById(id) {if (!elements.has(id)) elements.set(id, element()); return elements.get(id);}, createElement: element},
    localStorage: {getItem() {return null;}, setItem() {}},
    window: {location, parent, addEventListener() {}}, loadedImages: {},
    canvas: {width: 1280, height: 800}, mouse: {x: 640, y: 400}, keys: {},
    sound: new Proxy({}, {get: () => () => {}}),
    setTimeout() {return 1;}, clearTimeout() {},
    resetRuntimeInput() {}, resumeRuntime() {}, pauseRuntime() {}, showRuntimePanel() {},
    renderGodPortraitToCanvas() {}, scheduleGameAction() {},
    gameRuntime: {started: true, ready: true, manualPaused: false, modalNodes: []}
  });
  for (const name of ['Particle', 'FloatingText', 'Shockwave', 'AnimatedFireExplosion', 'AnimatedLightningStrike', 'AnimatedWaterWave', 'AnimatedAttackSweep', 'HitSpark', 'LunarRayEffect', 'FireTrail', 'IceShardTrap', 'CharmBurst', 'Projectile']) {
    context[name] = class {constructor(...args) {this.args = args;}};
  }
  for (const name of ['learning.js', 'data.js', 'world.js', 'player.js', 'enemies.js', 'boon-effects.js', 'flow.js']) {
    vm.runInContext(fs.readFileSync(new URL('../src/' + name, import.meta.url), 'utf8'), context, {filename: name});
  }
  const run = code => vm.runInContext(code, context);
  run('player.resetForRun(); startChamber(1); player.hp = 40;');
  let round = 0;
  const complete = correct => {
    const reward = run(`learningRewardForScore(${correct})`);
    const next = ++round;
    run(`hadesLearning.sessionId='score-session'; hadesLearning.pending={requestId:'score-${next}',round:${next},enter(){}};`);
    context.testEvent = {source: parent, origin: location.origin, data: {
      type: 'HADES_ROUND_RESULT', sessionId: 'score-session', requestId: 'score-' + next, round: next,
      ...JSON.parse(JSON.stringify(reward))
    }};
    run('receiveLearningMessage(testEvent);');
    return context.testEvent;
  };
  if (learning) complete(score);
  // Reward comparisons exclude the separately asserted checkpoint healing.
  run('player.hp=40;');
  const claim = (kind, text = null) => {
    const container = elements.get(kind + '-choices-container');
    assert.ok(container?.children.length, kind + ' must offer a claimable reward');
    const card = text ? container.children.find(node => node.innerHTML.includes(text)) : container.children[0];
    assert.ok(card, 'expected reward: ' + text);
    card.onclick();
    return card;
  };
  return {run, context, elements, complete, claim};
}

test('every score earns a distinct tier and strictly stronger combat upgrade', () => {
  const names = ['fractured', 'common', 'uncommon', 'rare', 'epic', 'heroic'];
  const ranks = [0, 1, 2, 3, 5, 8];
  for (let score = 0; score <= 5; score++) {
    const f = fixture({score});
    assert.equal(f.run('hadesLearning.tier'), names[score]);
    assert.equal(f.run('learningBoonRank()'), ranks[score]);
    assert.equal(f.run(`learningRewardForScore(${score}).healPercent`), score * 8);
  }
});

test('zero-score rewards cannot unlock any god, fixed utility, armour or eligible Duo', () => {
  const names = fixture().run('Object.keys(GODS)');
  for (const god of names) {
    const f = fixture({score: 0});
    // Equip all prerequisites while leaving every Duo unowned.
    f.run('gameState.equippedBoons=Object.values(GODS).flatMap(g=>g.boons).filter(b=>b.id!=="hephaestus_armor").map(b=>({...b,level:3}));');
    const before = f.run('JSON.stringify(gameState.equippedBoons)');
    f.run(`globalThis.claims=0; openGodBoonModal('${god}',()=>claims++);`);
    const card = f.claim('boon');
    card.onclick();
    assert.equal(f.run('JSON.stringify(gameState.equippedBoons)'), before, god + ' must not bypass Fractured through Duo or god exhaustion');
    assert.equal(f.run('player.maxHp'), 101);
    assert.equal(f.run('player.hp'), 40, 'zero grants no hidden healing');
    assert.equal(f.run('claims'), 1, 'double claim advances only once');
    assert.equal(f.run('gameState.isPaused'), false);
  }
});

test('zero-score Poms give one max life without levelling or the old 50-life fallback', () => {
  for (const boons of ['[]', '[{id:"hermes_wings",level:1}]', '[{id:"zeus_jolt",level:3}]']) {
    const f = fixture({score: 0});
    f.run(`gameState.equippedBoons=${boons}; globalThis.claims=0; openPomModal(()=>claims++);`);
    const before = f.run('JSON.stringify(gameState.equippedBoons)');
    const card = f.claim('boon'); card.onclick();
    assert.equal(f.run('JSON.stringify(gameState.equippedBoons)'), before);
    assert.equal(f.run('player.maxHp'), 101);
    assert.equal(f.run('player.hp'), 40);
    assert.equal(f.run('claims'), 1);
  }
});

test('perfect new scalable boons start at level eight and increase actual damage', () => {
  const f = fixture();
  f.run('gameState.equippedBoons=GODS.zeus.boons.filter(b=>b.id!=="zeus_jolt").map(b=>({...b,level:1})); openGodBoonModal("zeus");');
  const card = f.claim('boon', 'Static Shock'); card.onclick();
  assert.equal(f.run('getBoonLevel("zeus_jolt")'), 8);
  assert.equal(f.run('gameState.equippedBoons.filter(b=>b.id==="zeus_jolt").length'), 1);
  f.run('const target=new Enemy(0,0,"tartarus_behemoth"); onEnemyBoonHit(target,"player");');
  assert.ok(Math.abs(f.run('target.jolted') - 304) < 1e-9, 'perfect gives 3.8 times base Jolted damage');
});

test('Poms add the earned rank once and a perfect Pom changes real combat output', () => {
  for (const [score, increase] of [[1,1],[2,2],[3,3],[4,5],[5,8]]) {
    const f = fixture({score});
    f.run('gameState.equippedBoons=[{id:"zeus_jolt",level:1,name:"Static Shock"}]; globalThis.claims=0; openPomModal(()=>claims++);');
    const card = f.claim('pom'); card.onclick();
    assert.equal(f.run('getBoonLevel("zeus_jolt")'), 1 + increase);
    f.run('const target=new Enemy(0,0,"tartarus_behemoth"); onEnemyBoonHit(target,"player");');
    assert.ok(Math.abs(f.run('target.jolted') - 80 * (1 + increase * .4)) < 1e-9);
    assert.equal(f.run('claims'), 1);
  }
});

test('fixed utility boons receive score-scaled reinforcement without fake levels or hidden healing', () => {
  for (const [score, rank] of [[1,1],[2,2],[3,3],[4,5],[5,8]]) {
    const f = fixture({score});
    f.run('gameState.equippedBoons=GODS.hermes.boons.filter(b=>b.id!=="hermes_wings").map(b=>({...b,level:1})); openGodBoonModal("hermes");');
    const card = f.claim('boon', 'Winged Talaria'); card.onclick();
    assert.equal(f.run('getBoonLevel("hermes_wings")'), 1);
    assert.equal(f.run('player.maxHp'), 100 + rank * 5);
    assert.equal(f.run('player.hp'), 40);
  }
});

test('eligible Duos and fully collected gods preserve the earned reward strength', () => {
  for (const [score, extraLife] of [[1,5],[5,40]]) {
    const f = fixture({score});
    f.run('gameState.equippedBoons=Object.values(GODS).flatMap(g=>g.boons).map(b=>({...b,level:1})); openGodBoonModal("zeus");');
    f.claim('boon');
    assert.equal(f.run('gameState.equippedBoons.filter(b=>b.isDuo).length'), 1);
    assert.equal(f.run('player.maxHp'), 100 + extraLife);
    assert.equal(f.run('player.hp'), 40);
  }
  const exhausted = fixture();
  exhausted.run('gameState.equippedBoons=GODS.zeus.boons.map(b=>({...b,level:1})); openGodBoonModal("zeus");');
  const before = exhausted.run('gameState.equippedBoons.reduce((sum,b)=>sum+b.level,0)');
  exhausted.claim('pom');
  assert.equal(exhausted.run('gameState.equippedBoons.reduce((sum,b)=>sum+b.level,0)'), before + 8);
});

test('positive-score Pom fallback scales from five to sixty max life with no free healing', () => {
  for (const [score, life] of [[1,5],[2,10],[3,20],[4,35],[5,60]]) {
    const f = fixture({score});
    f.run('gameState.equippedBoons=[{id:"hermes_wings",level:1}]; globalThis.claims=0; openPomModal(()=>claims++);');
    assert.equal(f.run('player.maxHp'), 100 + life);
    assert.equal(f.run('player.hp'), 40);
    assert.equal(f.run('claims'), 1);
    assert.equal(f.run('gameState.isPaused'), false);
  }
});

test('shop blessings and Poms cannot bypass a failed checkpoint or double-charge on replay', () => {
  for (const index of [0,1]) {
    const f = fixture({score: 0});
    f.run('gameState.gold=500; openCharonShop();');
    const purchase = f.elements.get('shop-choices-container').children[index];
    purchase.onclick(); purchase.onclick();
    assert.equal(f.run('gameState.gold'), 500 - [140,95][index]);
    const reward = f.claim('boon'); reward.onclick();
    assert.equal(f.run('player.maxHp'), 101);
    assert.equal(f.run('player.hp'), 40);
    assert.equal(f.run('gameState.equippedBoons.length'), 0);
    assert.equal(f.elements.get('shop-modal').style.display, 'flex');
    assert.equal(f.run('gameState.isPaused'), true, 'nested claim returns to paused shop');
  }
});

test('heart gates, ash gates and shop hearts respect every score without bonus healing', () => {
  const gateLife = [1,10,18,25,40,60], ashes = [1,5,10,15,25,40], shopLife = [1,12,24,35,50,80];
  for (let score = 0; score <= 5; score++) {
    const heart = fixture({score});
    heart.run('gameState.equippedBoons=[{id:"aphrodite_grace",level:1}]; startChamber(2,{type:"heart"});');
    assert.equal(heart.run('player.maxHp'), 100 + gateLife[score], 'healing multipliers cannot inflate score rewards');
    assert.equal(heart.run('player.hp'), 40);
    const ash = fixture({score});
    const before = ash.run('gameState.ashes');
    ash.run('startChamber(2,{type:"ash"});');
    assert.equal(ash.run('gameState.ashes'), before + ashes[score]);
    const shop = fixture({score});
    shop.run('gameState.gold=500; openCharonShop();');
    const card = shop.elements.get('shop-choices-container').children[3];
    card.onclick(); card.onclick();
    assert.equal(shop.run('player.maxHp'), 100 + shopLife[score]);
    assert.equal(shop.run('player.hp'), 40);
    assert.equal(shop.run('gameState.gold'), 380);
  }
});

test('a new wrong checkpoint replaces prior Heroic strength and stale results cannot restore it', () => {
  const f = fixture();
  const previous = f.context.testEvent;
  assert.equal(f.run('learningBoonRank()'), 8);
  f.complete(0);
  assert.equal(f.run('learningBoonRank()'), 0);
  const health = f.run('player.hp');
  f.context.replay = previous;
  f.run('receiveLearningMessage(replay);');
  assert.equal(f.run('learningBoonRank()'), 0);
  assert.equal(f.run('player.hp'), health);
  f.run('resetLearningSession();');
  assert.equal(f.run('learningBoonRank()'), 1, 'a fresh run starts at the baseline, never stale Heroic');
});

test('profile changes revoke already-open reward cards and their old gate callbacks', () => {
  for (const kind of ['god', 'pom', 'fractured', 'shop']) {
    const f = fixture({score: kind === 'fractured' ? 0 : 5});
    f.run('globalThis.claims=0;');
    if (kind === 'pom') f.run('gameState.equippedBoons=[{id:"zeus_jolt",level:1,name:"Static Shock"}]; openPomModal(()=>claims++);');
    else if (kind === 'shop') f.run('gameState.gold=500; openCharonShop();');
    else f.run('openGodBoonModal("zeus",()=>claims++);');
    const containerKind = kind === 'pom' ? 'pom' : kind === 'shop' ? 'shop' : 'boon';
    const staleCard = f.elements.get(containerKind + '-choices-container').children[0];
    f.context.invalidate = {source:f.context.window.parent, origin:f.context.window.location.origin, data:{type:'HADES_INVALIDATE',sessionId:'score-session'}};
    f.run('receiveLearningMessage(invalidate); startHadesRun();');
    f.context.newReady = {source:f.context.window.parent, origin:f.context.window.location.origin, data:{
      type:'HADES_READY', requestId:f.run('hadesLearning.helloId'), sessionId:'next-score-session',
      available:true, profileKey:'another-student|math|P4', subject:'math'
    }};
    f.run('receiveLearningMessage(newReady); gameState.gold=500;');
    assert.notEqual(f.elements.get(containerKind + '-modal').style.display, 'flex', 'prior profile reward UI closes');
    staleCard.onclick();
    assert.equal(f.run('claims'), 0, kind + ' cannot execute its old gate callback');
    assert.equal(f.run('gameState.equippedBoons.length'), 0, kind + ' cannot grant prior Heroic boons');
    assert.equal(f.run('player.maxHp'), 100, kind + ' cannot grant an old life fragment');
    assert.equal(f.run('gameState.gold'), 500, kind + ' cannot charge the new run');
  }
});

test('reward cards captured before a newer checkpoint cannot claim the old score', () => {
  for (const kind of ['god', 'pom', 'fractured', 'shop']) {
    const f = fixture({score: kind === 'fractured' ? 0 : 5});
    f.run('globalThis.claims=0;');
    if (kind === 'pom') f.run('gameState.equippedBoons=[{id:"zeus_jolt",level:1,name:"Static Shock"}]; openPomModal(()=>claims++);');
    else if (kind === 'shop') f.run('gameState.gold=500; openCharonShop();');
    else f.run('openGodBoonModal("zeus",()=>claims++);');
    const containerKind = kind === 'pom' ? 'pom' : kind === 'shop' ? 'shop' : 'boon';
    const staleCard = f.elements.get(containerKind + '-choices-container').children[0];
    f.complete(kind === 'fractured' ? 5 : 0);
    const before = f.run('JSON.stringify({boons:gameState.equippedBoons,hp:player.hp,maxHp:player.maxHp,gold:gameState.gold})');
    staleCard.onclick();
    assert.equal(f.run('JSON.stringify({boons:gameState.equippedBoons,hp:player.hp,maxHp:player.maxHp,gold:gameState.gold})'), before);
    assert.equal(f.run('claims'), 0);
  }
});

test('standalone gameplay retains level-one boons, one-level Poms and original heart/fallback healing', () => {
  const f = fixture({learning:false});
  f.run('gameState.equippedBoons=GODS.zeus.boons.filter(b=>b.id!=="zeus_jolt").map(b=>({...b,level:1})); openGodBoonModal("zeus");');
  f.claim('boon', 'Static Shock');
  assert.equal(f.run('getBoonLevel("zeus_jolt")'), 1);
  f.run('gameState.equippedBoons=[{id:"zeus_jolt",level:1,name:"Static Shock"}]; openPomModal();');
  f.claim('pom');
  assert.equal(f.run('getBoonLevel("zeus_jolt")'), 2);
  f.run('gameState.equippedBoons=[]; player.maxHp=100; player.hp=40; openPomModal();');
  assert.equal(f.run('player.maxHp'), 150); assert.equal(f.run('player.hp'), 90);
  f.run('player.maxHp=100; player.hp=40; startChamber(2,{type:"heart"});');
  assert.equal(f.run('player.maxHp'), 125); assert.equal(f.run('player.hp'), 65);
});
