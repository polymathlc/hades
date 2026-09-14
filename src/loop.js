    const SIMULATION_STEP = 1 / 60;
    const MAX_FRAME_STEPS = 4;
    function installEffectBudget() {
      // Explicit constructor allowlist: damage, control fields (including
      // CharmBurst) and future effect types must never enter this visual budget.
      const cosmeticTypes = new Map([
        [Particle, 48], [HitSpark, 32], [AnimatedLightningStrike, 32],
        [AnimatedFireExplosion, 24], [AnimatedWaterWave, 24],
        [AnimatedAttackSweep, 16], [Shockwave, 48], [LunarRayEffect, 8], [FloatingText, 64]
      ]);
      const ids = new Map([...cosmeticTypes.keys()].map((type, index) => [type, index]));
      class EffectBuffer extends Array {
        static get [Symbol.species]() { return Array; }
        constructor(values = []) { super(); this.counts = new Map(); this.cells = new Map(); for (const value of values) this.push(value); }
        key(effect) {
          const numeric = effect.constructor === FloatingText && (Number.isFinite(effect.damageTotal) || /^-?\d+(?:\.\d+)?$/.test(effect.text));
          const shape = `${effect.artKind ?? ''}:${effect.combo ?? ''}:${effect.maxRadius ?? effect.size ?? ''}:${Math.round((effect.angle || 0) * 4)}`;
          return `${ids.get(effect.constructor)}:${Math.floor(effect.x / 48)}:${Math.floor(effect.y / 48)}:${effect.color || ''}:${numeric ? 'damage' : (effect.text || '')}:${shape}`;
        }
        push(...effects) {
          for (const effect of effects) {
            const limit = cosmeticTypes.get(effect?.constructor);
            if (!limit) { super.push(effect); continue; }
            const key = this.key(effect), existing = this.cells.get(key);
            if (existing && existing.life > 0) {
              if (effect.constructor === FloatingText && /^-?\d+(?:\.\d+)?$/.test(effect.text)) {
                existing.damageTotal = (existing.damageTotal ?? Number(existing.text)) + Number(effect.text);
                const total = Math.round(existing.damageTotal);
                existing.text = Math.abs(total) >= 10000 ? `${(total / 1000).toFixed(1)}k` : String(total);
              }
              gameRuntime.frameMetrics.cosmeticCoalesced = (gameRuntime.frameMetrics.cosmeticCoalesced || 0) + 1;
              continue;
            }
            const count = this.counts.get(effect.constructor) || 0;
            if (count >= limit) {
              gameRuntime.frameMetrics.cosmeticSkipped = (gameRuntime.frameMetrics.cosmeticSkipped || 0) + 1;
              continue;
            }
            this.counts.set(effect.constructor, count + 1); this.cells.set(key, effect); super.push(effect);
          }
          return this.length;
        }
        compact() {
          this.counts.clear(); this.cells.clear();
          let write = 0;
          for (let read = 0; read < this.length; read++) {
            const effect = this[read];
            if (effect.life <= 0) continue;
            this[write++] = effect;
            if (cosmeticTypes.has(effect.constructor)) {
              this.counts.set(effect.constructor, (this.counts.get(effect.constructor) || 0) + 1);
              this.cells.set(this.key(effect), effect);
            }
          }
          this.length = write;
        }
      }
      let effects = new EffectBuffer(gameState.particles);
      Object.defineProperty(gameState, 'particles', {
        configurable: true, enumerable: true,
        get() { return effects; },
        set(values) { effects = values instanceof EffectBuffer ? values : new EffectBuffer(values); }
      });
    }
    function clampedCameraTarget(x = player.x, y = player.y) {
      const limitX = Math.max(0, (arena.width - canvas.width) / 2);
      const limitY = Math.max(0, (arena.height - canvas.height) / 2);
      return { x: Math.max(-limitX, Math.min(limitX, x)), y: Math.max(-limitY, Math.min(limitY, y)) };
    }
    function projectileIsVisible(projectile) {
      const margin = (projectile.radius || 24) + 48;
      return Math.abs(projectile.x - gameState.camera.x) <= canvas.width / 2 + margin &&
        Math.abs(projectile.y - gameState.camera.y) <= canvas.height / 2 + margin;
    }
    function isGroundEffect(effect) {
      return effect instanceof FireTrail || effect instanceof IceShardTrap ||
        (typeof AnimatedFireExplosion !== 'undefined' && effect instanceof AnimatedFireExplosion && effect.artKind === 'cast');
    }
    let lastTime = performance.now(), simulationDebt = 0, worldTime = 0;
    function resetFrameClock() { lastTime = performance.now(); simulationDebt = 0; }
    function scheduleGameAction(delaySeconds, callback) {
      if (typeof callback !== 'function' || !Number.isFinite(delaySeconds)) return;
      if (!gameState.pendingActions) gameState.pendingActions = [];
      gameState.pendingActions.push({ remaining: Math.max(0, delaySeconds), callback });
    }
    function updateGameActions(dt) {
      const queue = gameState.pendingActions || [], due = [];
      for (const action of queue) { action.remaining -= dt; if (action.remaining <= 0) due.push(action); }
      gameState.pendingActions = queue.filter(action => action.remaining > 0);
      const chamber = gameState.chamber, waiting = gameState.pendingActions;
      for (let i = 0; i < due.length; i++) {
        if (gameState.chamber !== chamber) break;
        if (!runtimeCanPlay()) {
          // Menus suspend due actions; an explicit queue reset (death or a new
          // chamber) still cancels them so effects cannot leak into a new run.
          if (gameState.pendingActions === waiting) waiting.push(...due.slice(i));
          break;
        }
        due[i].callback();
      }
    }
    function updateSimulation(dt) {
      if (!runtimeCanPlay()) return;
      worldTime += dt * 1000; updateAimAssist(); player.update(dt); updateHeldActions();
      if (!runtimeCanPlay()) return;
      gameState.enemies.slice().forEach(enemy => { if (runtimeCanPlay() && !enemy.dead) enemy.update(dt); });
      if (!runtimeCanPlay()) return;
      gameState.projectiles.slice().forEach(projectile => { if (runtimeCanPlay() && !projectile.destroyed) projectile.update(dt); });
      if (!runtimeCanPlay()) return;
      gameState.particles.forEach(particle => particle.update(dt));
      if (gameState.particles.compact) gameState.particles.compact();
      else gameState.particles = gameState.particles.filter(particle => particle.life > 0);
      updateGameActions(dt); if (!runtimeCanPlay()) return;
      // Consume only one gate, even if its callback replaces the door array.
      for (const door of gameState.doors) {
        if (Math.hypot(player.x - door.x, player.y - door.y) >= door.radius + player.radius) continue;
        const reward = door.reward, nextChamber = gameState.chamber + 1;
        gameState.doors = []; resetRuntimeInput();
        if (typeof continueThroughHadesGate === 'function') continueThroughHadesGate(reward, nextChamber);
        else if (reward.type === 'god') openGodBoonModal(reward.godKey, () => startChamber(nextChamber));
        else if (reward.type === 'pom') openPomModal(() => startChamber(nextChamber));
        else startChamber(nextChamber, reward);
        break;
      }
      const blend = 1 - Math.exp(-8 * dt), target = clampedCameraTarget();
      gameState.camera.x += (target.x - gameState.camera.x) * blend;
      gameState.camera.y += (target.y - gameState.camera.y) * blend;
    }
    function gameLoop(time) {
      const workStarted = performance.now(), rawElapsed = Math.max(0, (time - lastTime) / 1000);
      const elapsed = Math.min(rawElapsed, SIMULATION_STEP * MAX_FRAME_STEPS); lastTime = time;
      const metrics = gameRuntime.frameMetrics; metrics.lastFrameMs = rawElapsed * 1000;
      metrics.droppedTimeMs += Math.max(0, rawElapsed - elapsed) * 1000;
      if (runtimeCanPlay()) {
        simulationDebt += elapsed; let steps = 0;
        while (simulationDebt + 1e-9 >= SIMULATION_STEP && steps < MAX_FRAME_STEPS && runtimeCanPlay()) {
          updateSimulation(SIMULATION_STEP); simulationDebt -= SIMULATION_STEP; steps++;
        }
        metrics.simulationSteps += steps;
      } else simulationDebt = 0;
      // Under a long stall, game time slows instead of tunnelling through walls
      // or silently skipping damaging projectiles. Tab return has no catch-up.
      let shakeX = 0, shakeY = 0;
      if (screenShake > 0 && runtimeCanPlay()) {
        if (!gameRuntime.settings.reducedMotion) { shakeX = (Math.random() - 0.5) * screenShake; shakeY = (Math.random() - 0.5) * screenShake; }
        screenShake = Math.max(0, screenShake - elapsed * 30);
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height); ctx.save();
      // A resize can make the previous camera offset invalid immediately.
      Object.assign(gameState.camera, clampedCameraTarget(gameState.camera.x, gameState.camera.y));
      ctx.translate(canvas.width / 2 - gameState.camera.x + shakeX, canvas.height / 2 - gameState.camera.y + shakeY);
      drawChamberTiles(ctx);
      // A cast is a world-anchored inscription: scenery and actors cover it.
      if (typeof drawSvgCast === 'function') drawSvgCast(ctx, player.castActive);
      for (const p of gameState.particles) if (isGroundEffect(p)) p.draw(ctx);
      drawProps(ctx, worldTime);
      if (typeof drawCombatReadability === 'function') drawCombatReadability(ctx, worldTime);
      if (typeof drawBoonEffects === 'function') drawBoonEffects(ctx);
      for (const e of gameState.enemies) e.draw(ctx);
      player.draw(ctx);
      for (const p of gameState.projectiles) if (projectileIsVisible(p)) p.draw(ctx);
      for (const p of gameState.particles) if (!isGroundEffect(p)) p.draw(ctx);
      ctx.restore();
      if (typeof drawScreenAtmosphere === 'function') drawScreenAtmosphere(ctx, worldTime);
      const workMs = performance.now() - workStarted; metrics.frames++;
      metrics.averageWorkMs += (workMs - metrics.averageWorkMs) / Math.min(metrics.frames, 120);
      metrics.worstWorkMs = Math.max(metrics.worstWorkMs, workMs);
      requestAnimationFrame(gameLoop);
    }
