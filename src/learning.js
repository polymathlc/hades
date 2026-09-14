// The authenticated portal owns the question bank and grading. The game only
// consumes a five-answer result for its current session and pending exit gate.
const HADES_LEARNING_ENABLED = new URLSearchParams(window.location.search).get('learning') === '1';
const hadesLearning = {
  enabled: HADES_LEARNING_ENABLED, sessionId: null, profileKey: null,
  helloId: null, round: 0, pending: null, onStart: null, timer: null,
  tier: 'common', rewardEpoch: 0, state: 'idle', subject: new URLSearchParams(window.location.search).get('subject') === 'math' ? 'Math' : 'Science'
};
const HADES_BOON_TIERS = {
  fractured: {name:'Fractured', rank:0, fallback:1, heart:1, shopHeart:1, ash:1},
  common: {name:'Common', rank:1, fallback:5, heart:10, shopHeart:12, ash:5},
  uncommon: {name:'Uncommon', rank:2, fallback:10, heart:18, shopHeart:24, ash:10},
  rare: {name:'Rare', rank:3, fallback:20, heart:25, shopHeart:35, ash:15},
  epic: {name:'Epic', rank:5, fallback:35, heart:40, shopHeart:50, ash:25},
  heroic: {name:'Heroic', rank:8, fallback:60, heart:60, shopHeart:80, ash:40}
};
function learningRewardForScore(correct) {
  if (!Number.isInteger(correct) || correct < 0 || correct > 5) return null;
  return {correct, total: 5, healPercent: correct * 8, boonTier: ['fractured','common','uncommon','rare','epic','heroic'][correct]};
}
function learningStorageKey() {
  if (!hadesLearning.enabled) return 'chronos-fall-progress-v1';
  return hadesLearning.profileKey ? 'chronos-fall-learning-v1:' + encodeURIComponent(hadesLearning.profileKey) : null;
}
function learningMaxLifeReward(kind = 'fallback') { return HADES_BOON_TIERS[hadesLearning.tier][kind]; }
function learningAshReward() { return HADES_BOON_TIERS[hadesLearning.tier].ash; }
function applyLearningMaxLife(amount) {
  // An upgrade increases capacity; only quiz accuracy supplies checkpoint healing.
  player.maxHp += amount;
  gameState.particles.push(new FloatingText(player.x, player.y - 40, '+' + amount + ' MAX LIFE · NO HEALING', '#efbda7'));
  updateHUD();
}
function learningRewardGuard() {
  const {rewardEpoch, sessionId, round, tier} = hadesLearning;
  return () => !hadesLearning.enabled || (hadesLearning.rewardEpoch === rewardEpoch && hadesLearning.sessionId === sessionId && hadesLearning.round === round && hadesLearning.tier === tier);
}
function openFracturedBoonReward(onComplete) {
  const canClaimReward = learningRewardGuard();
  const modal = document.getElementById('boon-modal');
  document.getElementById('pom-modal').style.display = 'none';
  document.getElementById('god-name').innerText = 'FRACTURED · 0/5 CORRECT';
  document.getElementById('god-quote').innerText = 'A tiny consolation. Improve your answers to earn stronger upgrades.';
  const portrait = document.getElementById('god-portrait-canvas');
  portrait.getContext('2d').clearRect(0,0,portrait.width,portrait.height);
  const choices = document.getElementById('boon-choices-container'); choices.innerHTML = '';
  const card = document.createElement('button'); card.type = 'button'; card.className = 'boon-card';
  card.innerHTML = '<div><div class="boon-rarity">FRACTURED REWARD</div><div class="boon-card-name">Faint life fragment</div><div class="boon-card-desc">+1 maximum life only. No healing, new boon or Pom levels.</div></div><div class="boon-card-slot">Claim and continue</div>';
  let claimed = false;
  card.onclick = () => {
    if (claimed || !canClaimReward()) return; claimed = true;
    applyLearningMaxLife(1); sound.playBoonChime(); modal.style.display = 'none'; gameState.isPaused = false;
    if (onComplete) onComplete();
  };
  choices.appendChild(card); modal.style.display = 'flex'; gameState.isPaused = true;
}
function learningBoonRank() { return hadesLearning.enabled ? HADES_BOON_TIERS[hadesLearning.tier].rank : 1; }
function learningBoonLabel() { return hadesLearning.enabled ? HADES_BOON_TIERS[hadesLearning.tier].name + ' · sanctuary reward' : 'Rare boon'; }
function learningIsWaiting() { return hadesLearning.enabled && ['connecting','checkpoint','blocked'].includes(hadesLearning.state); }
function postLearningMessage(message) {
  if (window.parent === window) return false;
  window.parent.postMessage(message, window.location.origin); return true;
}
function clearLearningTimer() { clearTimeout(hadesLearning.timer); hadesLearning.timer = null; }
function showLearningWait(title, message) {
  const panel = document.getElementById('learning-wait');
  panel.style.display = 'flex';
  document.getElementById('learning-title').textContent = title;
  document.getElementById('learning-message').textContent = message;
  document.getElementById('runtime-overlay').hidden = true;
  gameState.isPaused = true; resetRuntimeInput(); sound.stopBGM();
}
function hideLearningWait() { document.getElementById('learning-wait').style.display = 'none'; }
function resetLearningSession() {
  clearLearningTimer(); hadesLearning.rewardEpoch++;
  for (const kind of ['boon','pom','shop']) {
    const modal = document.getElementById(kind + '-modal'); if (modal) modal.style.display = 'none';
    const choices = document.getElementById(kind + '-choices-container'); if (choices) choices.innerHTML = '';
  }
  hadesLearning.sessionId = null; hadesLearning.profileKey = null;
  hadesLearning.helloId = null; hadesLearning.pending = null; hadesLearning.onStart = null;
  hadesLearning.round = 0; hadesLearning.tier = 'common'; hadesLearning.state = 'idle';
}
function finishStartingHadesRun() {
  gameRuntime.started = true; player.resetForRun(); startChamber(1);
  gameState.isPaused = false; resumeRuntime();
}
function startHadesRun() {
  if (!hadesLearning.enabled) { finishStartingHadesRun(); return; }
  resetLearningSession(); gameRuntime.started = false; gameRuntime.manualPaused = false;
  hadesLearning.helloId = crypto.randomUUID(); hadesLearning.onStart = finishStartingHadesRun;
  hadesLearning.state = 'connecting';
  showLearningWait('Connect to your learning profile', 'Your ' + hadesLearning.subject + ' platform will select questions for your school level.');
  sendLearningHello();
}
function sendLearningHello() {
  clearLearningTimer();
  if (!postLearningMessage({type: 'HADES_HELLO', requestId: hadesLearning.helloId})) {
    hadesLearning.state = 'blocked';
    showLearningWait('Open this beta from your learning platform', 'Start Chronos Fall from the Math or Science game menu to use its question bank.');
    return;
  }
  hadesLearning.timer = setTimeout(() => {
    if (!hadesLearning.sessionId) {
      hadesLearning.state = 'blocked';
      showLearningWait('The learning platform is not ready', 'Return to the platform, sign in, then retry. Your game will wait.');
    }
  }, 10000);
}
function requestLearningRound() {
  const pending = hadesLearning.pending;
  if (!pending || !hadesLearning.sessionId) return;
  clearLearningTimer(); hadesLearning.state = 'checkpoint';
  showLearningWait('Five questions before the next chamber', 'Answer the questions in your learning platform. Each correct answer restores 8% maximum life and improves the next boon tier.');
  postLearningMessage({type: 'HADES_ROUND_REQUEST', requestId: pending.requestId, sessionId: hadesLearning.sessionId, round: pending.round});
  hadesLearning.timer = setTimeout(() => {
    if (hadesLearning.pending === pending) document.getElementById('learning-message').textContent = 'Your game is safely paused. If the question panel has not opened, retry or return to the platform.';
  }, 15000);
}
function continueThroughHadesGate(reward, nextChamber) {
  const enter = () => {
    if (reward.type === 'god') openGodBoonModal(reward.godKey, () => startChamber(nextChamber));
    else if (reward.type === 'pom') openPomModal(() => startChamber(nextChamber));
    else startChamber(nextChamber, reward);
  };
  if (!hadesLearning.enabled) { enter(); return; }
  if (hadesLearning.pending) return;
  if (!hadesLearning.sessionId) {
    hadesLearning.state = 'blocked';
    showLearningWait('Your learning session has ended', 'Start a new run from the learning platform. No questions or rewards have been skipped.');
    return;
  }
  hadesLearning.pending = {requestId: crypto.randomUUID(), round: hadesLearning.round + 1, enter};
  requestLearningRound();
}
function receiveLearningMessage(event) {
  if (!hadesLearning.enabled || event.source !== window.parent || event.source === window || event.origin !== window.location.origin) return;
  const d = event.data;
  if (!d || typeof d !== 'object') return;
  if (d.type === 'HADES_INVALIDATE') {
    if (!hadesLearning.sessionId || d.sessionId !== hadesLearning.sessionId) return;
    resetLearningSession(); hadesLearning.state = 'blocked';
    gameRuntime.started = false; gameRuntime.manualPaused = false;
    showLearningWait('Your learning profile changed', 'Start a new run so the questions and progress use the correct profile.');
    return;
  }
  if (d.type === 'HADES_READY') {
    if (d.requestId !== hadesLearning.helloId || !hadesLearning.onStart || typeof d.sessionId !== 'string' || !d.sessionId || d.sessionId.length > 128) return;
    if (d.available !== true || typeof d.profileKey !== 'string' || !d.profileKey || d.profileKey.length > 512) {
      hadesLearning.state = 'blocked'; clearLearningTimer();
      showLearningWait('Choose a learning profile', String(d.reason || 'Open this game through the Math or Science beta menu.')); return;
    }
    clearLearningTimer();
    hadesLearning.sessionId = d.sessionId; hadesLearning.profileKey = d.profileKey;
    hadesLearning.subject = String(d.subject).toLowerCase() === 'math' ? 'Math' : 'Science';
    hadesLearning.state = 'ready';
    // No progress crosses accounts, preview grades, or subjects sharing an origin.
    gameState.ashes = 10; gameState.bones = 5; gameState.bestChamber = 1;
    Object.assign(gameState.upgrades, {maxHp: 0, magick: 0, damage: 0, defiance: 1});
    loadPermanentProgress();
    const start = hadesLearning.onStart; hadesLearning.onStart = null;
    hideLearningWait(); start(); return;
  }
  const pending = hadesLearning.pending;
  if (!pending || d.sessionId !== hadesLearning.sessionId || d.requestId !== pending.requestId || d.round !== pending.round) return;
  if (d.type === 'HADES_ROUND_BLOCKED') {
    clearLearningTimer(); hadesLearning.state = 'blocked';
    showLearningWait('The next chamber is waiting', String(d.message || 'Complete five suitable bank questions before continuing.')); return;
  }
  if (d.type !== 'HADES_ROUND_RESULT') return;
  const reward = learningRewardForScore(d.correct);
  if (!reward || d.total !== 5 || d.healPercent !== reward.healPercent || d.boonTier !== reward.boonTier) return;
  // Claim before callbacks so replayed messages can never heal/advance twice.
  clearLearningTimer(); hadesLearning.pending = null; hadesLearning.round = pending.round;
  hadesLearning.tier = reward.boonTier; hadesLearning.state = 'ready';
  const healed = Math.min(player.maxHp - player.hp, Math.round(player.maxHp * reward.healPercent / 100));
  player.hp += Math.max(0, healed);
  gameState.particles.push(new FloatingText(player.x, player.y - 60, `${d.correct}/5 · +${Math.max(0, healed)} LIFE · ${HADES_BOON_TIERS[reward.boonTier].name.toUpperCase()}`, '#b8f2d8'));
  updateHUD(); savePermanentProgress(); hideLearningWait();
  gameState.isPaused = false; resumeRuntime(); pending.enter();
  if (document.hidden) pauseRuntime('away');
}
function installHadesLearning() {
  if (!hadesLearning.enabled) return;
  const panel = document.createElement('div'); panel.id = 'learning-wait'; panel.className = 'modal-overlay';
  panel.innerHTML = '<section class="modal-card learning-card" role="dialog" aria-modal="true" aria-labelledby="learning-title"><div class="runtime-eyebrow">SANCTUARY CHECKPOINT</div><h2 id="learning-title"></h2><p id="learning-message" role="status"></p><p class="learning-tiers">0: Fractured · 1: Common · 2: Uncommon · 3: Rare · 4: Epic · 5: Heroic (Lv 8 / +8 Pom)</p><div class="learning-buttons"><button id="learning-retry" class="hades-btn" type="button">Retry</button><button id="learning-end" class="hades-btn" type="button">End run</button></div></section>';
  document.getElementById('game-container').append(panel); gameRuntime.modalNodes.push(panel);
  document.getElementById('learning-retry').onclick = () => {
    if (hadesLearning.pending) requestLearningRound();
    else if (hadesLearning.helloId && hadesLearning.onStart) sendLearningHello();
    else startHadesRun();
  };
  document.getElementById('learning-end').onclick = () => {
    resetLearningSession(); hideLearningWait(); gameState.isPaused = true; gameRuntime.started = false;
    showRuntimePanel('start');
  };
  window.addEventListener('message', receiveLearningMessage);
}
