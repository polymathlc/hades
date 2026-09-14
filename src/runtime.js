    const ASSETS_DATA = %ASSETS_JSON%;
    const loadedImages = {};
    const failedAssets = [];
    // Settle failed images too: every renderer has a fallback, and loading must
    // never strand the player behind a disabled start button.
    const assetsReady = Promise.all(Object.entries(ASSETS_DATA).map(([key, uri]) => new Promise(resolve => {
      const img = new Image(); loadedImages[key] = img;
      img.onload = () => resolve();
      img.onerror = () => { loadedImages[key] = null; failedAssets.push(key); resolve(); };
      img.src = uri;
    })));
    function readRuntimeSettings() {
      const settings = { muted: false, reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches };
      try {
        const saved = JSON.parse(localStorage.getItem('hades.settings.v1') || 'null');
        for (const key of Object.keys(settings)) if (typeof saved?.[key] === 'boolean') settings[key] = saved[key];
      } catch (_) { /* Private or embedded contexts may disable storage. */ }
      return settings;
    }
    const gameRuntime = {
      started: false, ready: false, manualPaused: false, settings: readRuntimeSettings(),
      aimAssist: false, lastAim: { x: 0, y: -1 }, modalNodes: [],
      frameMetrics: { frames: 0, lastFrameMs: 0, averageWorkMs: 0, worstWorkMs: 0, simulationSteps: 0, droppedTimeMs: 0 }
    };
    function saveRuntimeSettings() {
      try { localStorage.setItem('hades.settings.v1', JSON.stringify(gameRuntime.settings)); } catch (_) {}
      document.documentElement.classList.toggle('reduced-motion', gameRuntime.settings.reducedMotion);
    }
    // A lazy audio context avoids autoplay failures. All nodes disconnect after
    // playback; limiting simultaneous voices changes sound only, never damage.
    class SoundEngine {
      constructor() { this.ctx = null; this.master = null; this.isMuted = gameRuntime.settings.muted; this.bgmTimer = null; this.step = 0; this.voices = new Set(); this.lastEffect = new Map(); }
      init() {
        if (this.ctx) return;
        const Context = window.AudioContext || window.webkitAudioContext;
        if (!Context) return;
        try { this.ctx = new Context(); this.master = this.ctx.createGain(); this.master.gain.value = this.isMuted ? 0 : 0.34; this.master.connect(this.ctx.destination); }
        catch (_) { this.ctx = null; }
      }
      resume() { this.init(); if (this.ctx?.state === 'suspended') this.ctx.resume().catch(() => {}); }
      toggleMute() {
        this.isMuted = !this.isMuted; gameRuntime.settings.muted = this.isMuted;
        if (this.master) this.master.gain.setTargetAtTime(this.isMuted ? 0 : 0.34, this.ctx.currentTime, 0.02);
        saveRuntimeSettings();
        const input = document.getElementById('runtime-mute'); if (input) input.checked = this.isMuted;
        return this.isMuted;
      }
      voice(frequency, endFrequency, duration, type = 'sine', volume = 0.18, delay = 0) {
        if (this.isMuted || !this.ctx || this.ctx.state !== 'running' || this.voices.size >= 32) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(), now = this.ctx.currentTime + delay;
        osc.type = type; osc.frequency.setValueAtTime(Math.max(20, frequency), now);
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), now + duration);
        gain.gain.setValueAtTime(0.001, now); gain.gain.linearRampToValueAtTime(volume, now + 0.008);
        gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
        osc.connect(gain); gain.connect(this.master); this.voices.add(osc);
        osc.onended = () => { osc.disconnect(); gain.disconnect(); this.voices.delete(osc); };
        osc.start(now); osc.stop(now + duration + 0.01);
      }
      effect(name, callback, interval = 0.035) {
        if (!this.ctx || this.isMuted) return;
        const now = this.ctx.currentTime;
        if (now - (this.lastEffect.get(name) ?? -Infinity) < interval) return;
        this.lastEffect.set(name, now); callback();
      }
      playSlash() { this.effect('slash', () => { this.voice(520, 80, 0.12, 'triangle', 0.3); this.voice(1200, 320, 0.085, 'sawtooth', 0.05); }); }
      playDash() { this.effect('dash', () => this.voice(680, 130, 0.19, 'triangle', 0.24)); }
      playCast() { this.effect('cast', () => [220, 330, 440, 660].forEach((n, i) => this.voice(n, n * 1.25, 0.4, 'sine', 0.16 / (i + 1)))); }
      playExplosion() { this.effect('explosion', () => this.voice(190, 32, 0.38, 'sawtooth', 0.29)); }
      playHit() { this.effect('hit', () => this.voice(170, 48, 0.085, 'triangle', 0.25), 0.05); }
      playLightning() { this.effect('lightning', () => this.voice(1000, 100, 0.17, 'sawtooth', 0.14)); }
      playBoonChime() { this.effect('boon', () => [523.25, 659.25, 783.99, 1046.5].forEach((n, i) => this.voice(n, n, 0.48, 'triangle', 0.16, i * 0.07))); }
      playGold() { this.effect('gold', () => { this.voice(1760, 1760, 0.14, 'sine', 0.14); this.voice(2637, 2637, 0.16, 'sine', 0.12, 0.05); }); }
      startBGM() {
        if (this.bgmTimer) return;
        this.bgmTimer = setInterval(() => {
          if (this.isMuted || !this.ctx || !runtimeCanPlay()) return;
          const scale = [82.41, 87.31, 98, 123.47], note = scale[Math.floor(this.step / 4) % scale.length];
          if (this.step % 4 === 0) this.voice(100, 32, 0.15, 'sine', 0.15);
          this.voice(note, note, 0.17, 'triangle', 0.11);
          if (this.step % 8 === 0) this.voice(note * 4, note * 4, 0.7, 'sine', 0.035);
          this.step = (this.step + 1) % 16;
        }, 150);
      }
      stopBGM() { clearInterval(this.bgmTimer); this.bgmTimer = null; for (const osc of this.voices) { try { osc.stop(); } catch (_) {} } }
    }
    const sound = new SoundEngine();
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d', { alpha: false });
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Underworld arena. Move WASD or arrows. Strike J, special K, cast Q, dash Space, Hex F, pause Escape.');
    function resizeCanvas() {
      // CSS-pixel world coordinates keep high-density mobile fill cost bounded.
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(rect.width || innerWidth));
      canvas.height = Math.max(1, Math.round(rect.height || innerHeight));
    }
    window.addEventListener('resize', resizeCanvas); resizeCanvas();
    const keys = {};
    const mouse = { x: canvas.width / 2, y: canvas.height / 2, leftDown: false, rightDown: false };
    const touchPointers = new Map();
    let joystickPointer = null;
    function runtimeHasModal(except = null) { return gameRuntime.modalNodes.some(node => node !== except && node.style.display !== 'none' && node.style.display !== ''); }
    function runtimeCanPlay() { return gameRuntime.started && gameRuntime.ready && !gameRuntime.manualPaused && !gameState.isPaused && !document.hidden && !runtimeHasModal(); }
    function resetRuntimeInput() {
      for (const key of Object.keys(keys)) delete keys[key];
      mouse.leftDown = false; mouse.rightDown = false; touchPointers.clear(); joystickPointer = null;
      const knob = document.getElementById('touch-stick-knob'); if (knob) knob.style.transform = 'translate(-50%, -50%)';
      document.querySelectorAll('.touch-action.is-held').forEach(button => button.classList.remove('is-held'));
    }
    function updateAimAssist() {
      if (!gameRuntime.aimAssist) return;
      let nearest = null, distance = Infinity;
      for (const enemy of gameState.enemies) {
        if (enemy.hp <= 0) continue;
        const d = (enemy.x - player.x) ** 2 + (enemy.y - player.y) ** 2;
        if (d < distance) { nearest = enemy; distance = d; }
      }
      const x = nearest ? nearest.x : player.x + gameRuntime.lastAim.x * 220;
      const y = nearest ? nearest.y : player.y + gameRuntime.lastAim.y * 220;
      mouse.x = x - gameState.camera.x + canvas.width / 2; mouse.y = y - gameState.camera.y + canvas.height / 2;
      player.angle = Math.atan2(y - player.y, x - player.x);
    }
    function performRuntimeAction(action) {
      if (!runtimeCanPlay()) return;
      updateAimAssist();
      const method = { strike: 'triggerAttack', special: 'triggerSpecial', cast: 'triggerCast', dash: 'triggerDash', hex: 'triggerHex' }[action];
      if (method) player[method]();
    }
    function updateHeldActions() {
      if (mouse.leftDown || keys.j || [...touchPointers.values()].includes('strike')) performRuntimeAction('strike');
      if (mouse.rightDown || keys.k || [...touchPointers.values()].includes('special')) performRuntimeAction('special');
    }
    function setPointerAim(event) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (event.clientX - rect.left) * canvas.width / Math.max(1, rect.width);
      mouse.y = (event.clientY - rect.top) * canvas.height / Math.max(1, rect.height); gameRuntime.aimAssist = false;
    }
    function pauseRuntime(reason = 'paused') {
      if (!gameRuntime.started) return;
      resetRuntimeInput(); gameRuntime.manualPaused = true; sound.stopBGM(); showRuntimePanel(reason);
    }
    function resumeRuntime() {
      if (!gameRuntime.ready) return;
      resetRuntimeInput(); gameRuntime.manualPaused = false;
      document.getElementById('runtime-overlay').hidden = true;
      document.getElementById('touch-controls').hidden = !window.matchMedia('(pointer: coarse)').matches;
      sound.resume(); sound.startBGM(); resetFrameClock(); canvas.focus({ preventScroll: true });
    }
    window.addEventListener('keydown', event => {
      const key = event.key.toLowerCase();
      if (event.target.closest?.('input, select, textarea') || event.ctrlKey || event.metaKey || event.altKey) return;
      if (key === 'escape') {
        if (!gameRuntime.started || event.repeat) return;
        event.preventDefault();
        const codex = document.getElementById('codex-modal');
        if (gameRuntime.manualPaused) resumeRuntime();
        else if (codex.style.display === 'flex') closeSkillCodex();
        else if (!runtimeHasModal()) pauseRuntime();
        return;
      }
      if (key === 'm' && !event.repeat) { sound.toggleMute(); return; }
      if (key === 'p' && !event.repeat && gameRuntime.started && !runtimeHasModal()) { if (gameRuntime.manualPaused) resumeRuntime(); else pauseRuntime(); return; }
      if ((key === 'b' || (key === 'tab' && (event.target === canvas || event.target === document.body))) && !event.repeat && gameRuntime.started && !gameRuntime.manualPaused) {
        if (!runtimeHasModal(document.getElementById('codex-modal'))) { event.preventDefault(); resetRuntimeInput(); toggleSkillCodex(); } return;
      }
      if (!runtimeCanPlay() || event.target.closest?.('button, a')) return;
      if ([' ', 'shift', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
      keys[key] = true; if (event.repeat) return;
      const action = { q: 'cast', e: 'cast', ' ': 'dash', shift: 'dash', f: 'hex', j: 'strike', k: 'special' }[key];
      if (action) { gameRuntime.aimAssist = true; performRuntimeAction(action); }
    });
    window.addEventListener('keyup', event => { delete keys[event.key.toLowerCase()]; });
    canvas.addEventListener('pointermove', event => { if (event.pointerType !== 'touch') setPointerAim(event); });
    canvas.addEventListener('pointerdown', event => {
      if (!runtimeCanPlay() || event.pointerType === 'touch') return;
      event.preventDefault(); canvas.focus({ preventScroll: true }); setPointerAim(event); canvas.setPointerCapture(event.pointerId);
      if (event.button === 0) { mouse.leftDown = true; performRuntimeAction('strike'); }
      if (event.button === 2) { mouse.rightDown = true; performRuntimeAction('special'); }
    });
    function releasePointer(event) {
      if (event.pointerType !== 'touch') {
        if (event.button === 0 || event.type !== 'pointerup') mouse.leftDown = false;
        if (event.button === 2 || event.type !== 'pointerup') mouse.rightDown = false;
      }
    }
    window.addEventListener('pointerup', releasePointer); window.addEventListener('pointercancel', releasePointer);
    canvas.addEventListener('lostpointercapture', releasePointer); canvas.addEventListener('contextmenu', event => event.preventDefault());
    window.addEventListener('blur', () => pauseRuntime('away'));
    document.addEventListener('visibilitychange', () => { if (document.hidden) pauseRuntime('away'); });

    function installRuntimeControls() {
      installEffectBudget();
      document.getElementById('game-container').insertAdjacentHTML('beforeend', `
        <div id="runtime-toolbar"><button id="runtime-pause" type="button" aria-label="Pause game and open settings">Ⅱ <span>Pause</span></button></div>
        <section id="runtime-overlay" role="dialog" aria-modal="true" aria-labelledby="runtime-title">
          <div class="runtime-panel">
            <div class="runtime-eyebrow">CHRONOS FALL · UNDERWORLD ODYSSEY</div><h1 id="runtime-title">Defy the Titan of Time</h1>
            <p id="runtime-description">Descend through shifting chambers, forge a divine build and challenge the endless depths beyond Chronos.</p>
            <div class="runtime-help"><span><b>MOVE</b> WASD / Arrows</span><span><b>STRIKE</b> Hold click / J</span><span><b>SPECIAL</b> Right click / K</span><span><b>DASH</b> Space / Shift</span><span><b>CAST</b> Q / E</span><span><b>HEX</b> F when charged</span></div>
            <p class="runtime-touch-hint">Touch: move with the left pad and use the ability buttons. Attacks aim at the nearest foe.</p>
            <div class="runtime-settings"><label><input id="runtime-mute" type="checkbox"> Mute sound</label><label><input id="runtime-motion" type="checkbox"> Reduce motion</label></div>
            <button id="runtime-start" class="runtime-primary" type="button" disabled>Preparing the underworld…</button>
            <p id="runtime-status" role="status" aria-live="polite">Loading artwork. Your run starts when you are ready.</p>
          </div>
        </section>
        <div id="touch-controls" hidden aria-label="Touch game controls">
          <div id="touch-stick" role="group" aria-label="Drag to move"><span class="touch-stick-ring"></span><span id="touch-stick-knob"></span><span class="touch-stick-label">MOVE</span></div>
          <div class="touch-actions"><button class="touch-action" data-action="cast" type="button">Cast</button><button class="touch-action" data-action="hex" type="button">Hex</button><button class="touch-action" data-action="special" type="button">Special</button><button class="touch-action touch-strike" data-action="strike" type="button">Strike</button><button class="touch-action touch-dash" data-action="dash" type="button">Dash</button></div>
        </div>`);
      document.querySelector('.currency-panel').appendChild(document.getElementById('runtime-toolbar'));
      gameRuntime.modalNodes = [...document.querySelectorAll('.modal-overlay')];
      const observer = new MutationObserver(() => {
        if (runtimeHasModal()) resetRuntimeInput();
        document.getElementById('touch-controls').classList.toggle('controls-blocked', !runtimeCanPlay());
        // Closing a dialog must restore keyboard play, including when its
        // closing button remains focused inside the now-hidden overlay.
        if (runtimeCanPlay()) canvas.focus({ preventScroll: true });
      });
      for (const node of gameRuntime.modalNodes) observer.observe(node, { attributes: true, attributeFilter: ['style'] });
      const mute = document.getElementById('runtime-mute'); mute.checked = sound.isMuted;
      mute.onchange = () => { if (mute.checked !== sound.isMuted) sound.toggleMute(); };
      const motion = document.getElementById('runtime-motion'); motion.checked = gameRuntime.settings.reducedMotion;
      motion.onchange = () => { gameRuntime.settings.reducedMotion = motion.checked; saveRuntimeSettings(); }; saveRuntimeSettings();
      document.getElementById('runtime-pause').onclick = () => pauseRuntime();
      document.getElementById('runtime-start').onclick = () => {
        if (!gameRuntime.ready) return;
        if (!gameRuntime.started) { gameRuntime.started = true; player.resetForRun(); startChamber(1); gameState.isPaused = false; }
        resumeRuntime();
      };
      const overlay = document.getElementById('runtime-overlay');
      overlay.addEventListener('keydown', event => {
        if (event.key !== 'Tab') return;
        const focusable = [...overlay.querySelectorAll('button:not([disabled]), input')], first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
      const stick = document.getElementById('touch-stick');
      function moveStick(event) {
        if (event.pointerId !== joystickPointer || !runtimeCanPlay()) return;
        const rect = stick.getBoundingClientRect(), dx = event.clientX - rect.left - rect.width / 2, dy = event.clientY - rect.top - rect.height / 2;
        const distance = Math.hypot(dx, dy), reach = rect.width * 0.3, scale = distance > reach ? reach / distance : 1;
        keys.a = dx < -12; keys.d = dx > 12; keys.w = dy < -12; keys.s = dy > 12;
        if (distance > 12) gameRuntime.lastAim = { x: dx / distance, y: dy / distance };
        gameRuntime.aimAssist = true;
        document.getElementById('touch-stick-knob').style.transform = `translate(calc(-50% + ${dx * scale}px), calc(-50% + ${dy * scale}px))`;
      }
      stick.addEventListener('pointerdown', event => {
        if (!runtimeCanPlay() || joystickPointer !== null) return;
        event.preventDefault(); joystickPointer = event.pointerId; stick.setPointerCapture(event.pointerId); moveStick(event);
      });
      stick.addEventListener('pointermove', moveStick);
      function releaseStick(event) {
        if (event.pointerId !== joystickPointer) return;
        joystickPointer = null; for (const key of ['a', 'd', 'w', 's']) delete keys[key];
        document.getElementById('touch-stick-knob').style.transform = 'translate(-50%, -50%)';
      }
      for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) stick.addEventListener(name, releaseStick);
      document.querySelectorAll('.touch-action').forEach(button => {
        button.addEventListener('pointerdown', event => {
          if (!runtimeCanPlay()) return;
          event.preventDefault(); button.setPointerCapture(event.pointerId); gameRuntime.aimAssist = true;
          touchPointers.set(event.pointerId, button.dataset.action); button.classList.add('is-held'); performRuntimeAction(button.dataset.action);
        });
        const release = event => { touchPointers.delete(event.pointerId); button.classList.remove('is-held'); };
        for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(name, release);
        button.addEventListener('click', event => { if (event.detail === 0) { gameRuntime.aimAssist = true; performRuntimeAction(button.dataset.action); } });
      });
      showRuntimePanel('start');
    }
    function showRuntimePanel(reason) {
      const overlay = document.getElementById('runtime-overlay'); if (!overlay) return;
      overlay.hidden = false; document.getElementById('touch-controls').hidden = true;
      document.getElementById('runtime-title').textContent = gameRuntime.started ? 'Your journey is paused' : 'Defy the Titan of Time';
      document.getElementById('runtime-description').textContent = gameRuntime.started ? (reason === 'away' ? 'The underworld waits while you are away. Resume when you are ready.' : 'Take a breath, adjust your settings, then return to the fight.') : 'Descend through shifting chambers, forge a divine build and challenge the endless depths beyond Chronos.';
      const button = document.getElementById('runtime-start');
      if (gameRuntime.ready) button.textContent = gameRuntime.started ? 'Resume journey' : 'Enter the underworld';
      if (!button.disabled) button.focus({ preventScroll: true });
    }
