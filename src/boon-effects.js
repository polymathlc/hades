    // Shared boon hooks keep rewards attached to real combat events, never wall-clock timers.
    function boonPower(id) { return 1 + (getBoonLevel(id) - 1) * 0.4; }
    function boonState() { return player.boonState || (player.boonState = {}); }
    function inPlayerCast(x, y) { return player.castActive && Math.hypot(x - player.castActive.x, y - player.castActive.y) <= player.castActive.radius; }
    function gainHealth(amount, maximum = false) {
      const value = Math.round(amount * (hasBoon('aphrodite_grace') ? 1.5 : 1));
      if (maximum) player.maxHp += value;
      player.hp = Math.min(player.maxHp, player.hp + value);
      return value;
    }
    function burstDamage(x, y, radius, damage, source = 'boon_proc', except = null) {
      for (const enemy of gameState.enemies.slice()) {
        if (enemy !== except && !enemy.dead && Math.hypot(enemy.x - x, enemy.y - y) <= radius + enemy.radius) enemy.takeDamage(damage, source);
      }
    }
    function clearHostileBullets(x, y, radius) {
      for (const projectile of gameState.projectiles.slice()) {
        if (projectile.owner !== player && !projectile.destroyed && Math.hypot(projectile.x - x, projectile.y - y) < radius + projectile.radius) {
          projectile.destroy();
          gameState.particles.push(new HitSpark(projectile.x, projectile.y, '#a5f3fc'));
        }
      }
    }
    function addBoonArea(type, x, y, radius, duration, damage) {
      const areas = gameState.boonAreas || (gameState.boonAreas = []);
      // Repeated pull effects may merge; never evict a field with damage left to deal.
      if (!damage) {
        const matching = areas.find(area => !area.damage && area.type === type && Math.hypot(area.x-x, area.y-y) < radius * 0.5);
        if (matching) { matching.remaining = Math.max(matching.remaining, duration); return; }
        const pulls = areas.filter(area => !area.damage);
        if (pulls.length >= 12) areas.splice(areas.indexOf(pulls[0]), 1);
      }
      areas.push({ type, x, y, radius, remaining: duration, duration, damage });
    }
    function gainHexCharge(amount) {
      player.hexCharge = Math.min(player.hexMax, player.hexCharge + amount * (hasBoon('selene_waxing') ? 1.4 : 1) * (hasBoon('duo_sunlit_moon') ? 2 : 1));
    }
    function onAttackBoon() {
      if (hasBoon('apollo_splendor')) {
        const target = gameState.enemies.filter(e => !e.dead).sort((a, b) => Math.hypot(a.x - player.x, a.y - player.y) - Math.hypot(b.x - player.x, b.y - player.y))[0];
        if (target) {
          const angle = Math.atan2(target.y - player.y, target.x - player.x);
          const spark = new Projectile(player.x, player.y, Math.cos(angle) * 500, Math.sin(angle) * 500, 22 * boonPower('apollo_splendor'), 'spark', player);
          spark.seekTarget = target;
          gameState.projectiles.push(spark);
        }
      }
      if (hasBoon('poseidon_typhoon')) clearHostileBullets(player.x, player.y, 170);
    }
    function modifyBoonDamage(enemy, damage, source) {
      const basic = source === 'player' || source === 'projectile';
      if (enemy.armorShred > 0) damage *= 1.3;
      if (enemy.blindTimer > 0 && hasBoon('apollo_radiance')) damage *= 1.4;
      if (basic && enemy.isWeak && hasBoon('aphrodite_allure')) damage *= 1.4;
      if (basic && enemy.chillTimer > 0 && hasBoon('demeter_shatter')) damage *= 1.5;
      if (hasBoon('aphrodite_ring') && inPlayerCast(enemy.x, enemy.y)) damage *= 1.5;
      if (basic && enemy.behavior === 'shield_spearman' && !hasBoon('hephaestus_smelt') && !hasBoon('poseidon_typhoon')) damage *= 0.7;
      if ((source === 'lightning' || source === 'electric') && hasBoon('zeus_conduit') && Math.random() < 0.3) damage *= 2.5;
      return damage;
    }
    function onEnemyBoonHit(enemy, source) {
      const basic = source === 'player' || source === 'projectile';
      if (basic && hasBoon('zeus_jolt')) enemy.jolted = 80 * boonPower('zeus_jolt');
      if (source === 'player' && hasBoon('apollo_strike')) enemy.blindTimer = 2.5;
      if (source === 'player' && hasBoon('hestia_combust') && enemy.scorchTimer > 0) enemy.takeDamage(50 * boonPower('hestia_combust'), 'boon_proc');
      if (source === 'player' && hasBoon('apollo_dawn') && enemy.blindTimer > 0) enemy.takeDamage(60 * boonPower('apollo_dawn'), 'boon_proc');
      if (source === 'player' && hasBoon('aphrodite_charm') && Math.random() < 0.2 && !enemy.isBoss && !enemy.isMiniBoss) enemy.charmTimer = 4;
      if ((source === 'lightning' || source === 'electric') && hasBoon('zeus_overload')) {
        burstDamage(enemy.x, enemy.y, 100, 35 * boonPower('zeus_overload'), 'overload', enemy);
        gameState.particles.push(new Shockwave(enemy.x, enemy.y, 100, '#facc15'));
      }
      if (source === 'volcanic' && hasBoon('hephaestus_blast')) {
        for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3;
          const shard = new Projectile(enemy.x, enemy.y, Math.cos(angle) * 380, Math.sin(angle) * 380, 25 * boonPower('hephaestus_blast'), 'metal_shard', player);
          shard.piercing = true;
          gameState.projectiles.push(shard);
        }
      }
      if (source === 'player' && hasBoon('poseidon_rip')) addBoonArea('vortex', enemy.x, enemy.y, 140, 1, 0);
      if (source === 'player' && hasBoon('duo_heartbreak_doom') && enemy.isWeak && !(enemy.heartbreakTimer > 0)) {
        enemy.heartbreakTimer = 1;
        addBoonArea('blades', enemy.x, enemy.y, 90, 1, 50);
      }
      if ((source === 'lightning' || source === 'electric') && hasBoon('duo_plasma')) enemy.applyScorch(30);
      if (hasBoon('demeter_winter') && enemy.chillTimer > 0 && !enemy.dead && enemy.hp > 0 && enemy.hp < enemy.maxHp * 0.15) enemy.takeDamage(enemy.hp, 'execute');
    }
    function onSpecialBoonHit(enemy) {
      gainHexCharge(12);
      if (hasBoon('hephaestus_crush')) enemy.armorShred = 5;
      if (hasBoon('aphrodite_special')) { enemy.isWeak = true; enemy.weakTimer = 4; enemy.chillTimer = Math.max(enemy.chillTimer, 3); }
      if (hasBoon('apollo_special')) enemy.blindTimer = 2.5;
      updateHUD();
    }
    function onSpecialBoon() {
      if (hasBoon('poseidon_surge')) boonState().surge = 3;
      if (hasBoon('hestia_ember')) {
        for (const offset of [-0.3, 0.3]) {
          const angle = player.angle + offset;
          const ember = new Projectile(player.x, player.y, Math.cos(angle) * 430, Math.sin(angle) * 430, 35 * boonPower('hestia_ember'), 'magma_ball', player);
          ember.bouncesLeft = 2;
          gameState.projectiles.push(ember);
        }
      }
    }
    function onDashBoon() {
      const state = boonState();
      state.dashHits = new Set();
      state.shroudUsed = false;
      if (hasBoon('hermes_dash')) { state.sprint = 2; player.dashCooldown *= 0.5; }
      if (hasBoon('hermes_wings')) player.iFrames = Math.max(player.iFrames, 0.55);
      if (hasBoon('selene_dash')) { state.moonCritical = true; state.cloak = 0.45; }
      if (hasBoon('hermes_gust') || hasBoon('poseidon_typhoon')) clearHostileBullets(player.x, player.y, 200);
      if (hasBoon('apollo_dash')) for (const enemy of gameState.enemies) if (Math.hypot(enemy.x-player.x, enemy.y-player.y)<200) enemy.blindTimer = 2.5;
      if (hasBoon('ares_blade_dash')) addBoonArea('blades', player.x, player.y, 90, 1, 50 * boonPower('ares_blade_dash'));
    }
    function onHexBoon() {
      if (hasBoon('hestia_flare')) addBoonArea('firestorm', player.x, player.y, 240, 5, 150 * boonPower('hestia_flare'));
    }
    function boonMovementMultiplier() {
      const state = boonState();
      return (state.surge > 0 ? 1.4 : 1) * (state.sprint > 0 ? 1.6 : 1);
    }
    function basicBoonDamage(damage, melee) {
      const state = boonState();
      if (hasBoon('hermes_delivery')) damage += player.speed * (hasBoon('hermes_stride') ? 1.4 : 1) * boonMovementMultiplier() * 0.4;
      if (melee && hasBoon('hermes_rush') && (boonMovementMultiplier() > 1 || hasBoon('hermes_stride'))) damage *= 1.35;
      if (melee && state.moonCritical) { if (Math.random() < 0.5) damage *= 2; state.moonCritical = false; }
      return damage;
    }
    function updateBoonEffects(dt) {
      const state = boonState();
      for (const timer of ['surge', 'sprint', 'cloak']) state[timer] = Math.max(0, (state[timer] || 0) - dt);
      state.time = (state.time || 0) + dt;
      if (player.isDashing) {
        for (const enemy of gameState.enemies.slice()) {
          if (Math.hypot(enemy.x - player.x, enemy.y - player.y) < enemy.radius + 65 && !state.dashHits?.has(enemy)) {
            state.dashHits?.add(enemy);
            if (hasBoon('poseidon_undertow') || hasBoon('poseidon_dash')) {
              const damage = (hasBoon('poseidon_undertow') ? 60 * boonPower('poseidon_undertow') : 0) + (hasBoon('poseidon_dash') ? 50 * boonPower('poseidon_dash') : 0);
              enemy.takeDamage(damage, 'wave');
              enemy.moveWithCollision(Math.cos(player.angle) * 75, Math.sin(player.angle) * 75);
            }
          }
        }
        if (hasBoon('selene_shroud') && !state.shroudUsed && gameState.projectiles.some(p => p.owner !== player && Math.hypot(p.x-player.x,p.y-player.y)<80)) {
          state.shroudUsed = true;
          gainHexCharge(20);
        }
      }
      const orbX = player.x + Math.cos(state.time * 2.2) * 86, orbY = player.y + Math.sin(state.time * 2.2) * 86;
      if (hasBoon('selene_orbit')) {
        clearHostileBullets(orbX, orbY, 24);
        state.orbTick = (state.orbTick || 0) - dt;
        if (state.orbTick <= 0) { state.orbTick = 0.5; burstDamage(orbX, orbY, 24, 35 * boonPower('selene_orbit')); }
      }
      if (player.castActive) {
        const cast = player.castActive;
        if (hasBoon('selene_gravity')) clearHostileBullets(cast.x, cast.y, cast.radius);
        if (hasBoon('ares_engulf')) cast.radius = cast.baseRadius * (1 + 0.4 * (1 - Math.max(0, cast.timer) / 2.5));
        state.castTick = (state.castTick || 0) - dt;
        const tick = state.castTick <= 0;
        if (tick) state.castTick = hasBoon('zeus_fury') ? 0.32 : 0.4;
        for (const enemy of gameState.enemies.slice()) {
          if (Math.hypot(enemy.x-cast.x, enemy.y-cast.y) > cast.radius) continue;
          if (hasBoon('ares_engulf')) enemy.moveWithCollision((cast.x-enemy.x)*dt, (cast.y-enemy.y)*dt);
          if (hasBoon('demeter_ring')) enemy.applyChill(0.6);
          if (tick && hasBoon('zeus_ring')) procChainLightning(enemy, 22 * boonPower('zeus_ring'));
          if (tick && hasBoon('hestia_ring')) enemy.applyScorch(12 * boonPower('hestia_ring'));
          if (tick && hasBoon('apollo_ring')) { enemy.blindTimer = 1; enemy.takeDamage(12 * boonPower('apollo_ring'), 'solar'); }
        }
      }
      for (const area of (gameState.boonAreas || []).slice()) {
        const elapsed = Math.min(dt, area.remaining);
        area.remaining -= dt;
        for (const enemy of gameState.enemies.slice()) {
          if (Math.hypot(enemy.x-area.x, enemy.y-area.y) > area.radius) continue;
          if (area.type === 'vortex') enemy.moveWithCollision((area.x-enemy.x)*elapsed*2, (area.y-enemy.y)*elapsed*2);
          if (area.damage) enemy.takeDamage(area.damage / area.duration * elapsed, 'area', true);
        }
      }
      gameState.boonAreas = (gameState.boonAreas || []).filter(area => area.remaining > 0);
      for (const projectile of gameState.projectiles) {
        if (projectile.owner === player && projectile.type === 'moon_sickle' && hasBoon('hestia_special')) {
          projectile.magmaTrailTick = (projectile.magmaTrailTick || 0) - dt;
          if (projectile.magmaTrailTick <= 0) {
            projectile.magmaTrailTick = 0.24;
            // Overlapping throws share a trail so their visual density stays bounded.
            const trail = gameState.particles.find(p => p instanceof FireTrail && p.life > 0 && Math.hypot(p.x-projectile.x,p.y-projectile.y) < 35);
            if (trail) trail.life = Math.max(trail.life, 1);
            else gameState.particles.push(new FireTrail(projectile.x, projectile.y));
          }
        }
        if (projectile.seekTarget && !projectile.seekTarget.dead) {
          const angle = Math.atan2(projectile.seekTarget.y-projectile.y,projectile.seekTarget.x-projectile.x);
          projectile.vx = Math.cos(angle)*500; projectile.vy = Math.sin(angle)*500;
        }
        if (projectile.bouncesLeft > 0 && checkWallCollision(projectile.x+projectile.vx*dt, projectile.y+projectile.vy*dt, projectile.radius)) {
          if (checkWallCollision(projectile.x+projectile.vx*dt,projectile.y,projectile.radius)) projectile.vx *= -1;
          if (checkWallCollision(projectile.x,projectile.y+projectile.vy*dt,projectile.radius)) projectile.vy *= -1;
          projectile.bouncesLeft--;
        }
      }
    }
    function updateEnemyBoonEffects(enemy, dt) {
      enemy.blindTimer = Math.max(0, (enemy.blindTimer || 0)-dt);
      enemy.armorShred = Math.max(0, (enemy.armorShred || 0)-dt);
      enemy.heartbreakTimer = Math.max(0, (enemy.heartbreakTimer || 0)-dt);
      if (hasBoon('hestia_pyro') && enemy.scorchTimer > 0) {
        enemy.scorchSpreadTimer = (enemy.scorchSpreadTimer ?? 1) - dt;
        if (enemy.scorchSpreadTimer <= 0) {
          enemy.scorchSpreadTimer += 1;
          for (const neighbor of gameState.enemies) {
            if (neighbor === enemy || neighbor.dead || Math.hypot(neighbor.x-enemy.x, neighbor.y-enemy.y) > 140) continue;
            // Spreading copies a weaker burn instead of compounding stacks forever.
            neighbor.scorchStacks = Math.max(neighbor.scorchStacks, enemy.scorchStacks * 0.5);
            neighbor.scorchTimer = Math.max(neighbor.scorchTimer, Math.min(2, enemy.scorchTimer));
          }
        }
      }
      if (enemy.chillTimer > 0) {
        enemy.hailTimer = (enemy.hailTimer || 0) - dt;
        if (hasBoon('demeter_hail') && enemy.hailTimer <= 0) { enemy.hailTimer = 1; enemy.takeDamage(30 * boonPower('demeter_hail'), 'hail'); gameState.particles.push(new HitSpark(enemy.x, enemy.y, '#a5f3fc')); }
        if (hasBoon('demeter_rime') && enemy.chillStacks >= 5) enemy.takeDamage(40 * boonPower('demeter_rime') * dt, 'rime', true);
      }
      if (enemy.charmTimer > 0) {
        enemy.charmTimer -= dt;
        const target = gameState.enemies.find(e => e !== enemy && !e.dead && Math.hypot(e.x-enemy.x,e.y-enemy.y)<300);
        if (target) target.takeDamage(30*dt, 'charm', true);
        return true;
      }
      return false;
    }
    function onEnemyBoonAttack(enemy) {
      if (enemy.jolted > 0) { const damage=enemy.jolted; enemy.jolted=0; enemy.takeDamage(damage,'jolt'); }
      return enemy.dead || boonState().cloak > 0 || (enemy.blindTimer > 0 && Math.random() < 0.35) || (hasBoon('demeter_blizzard') && inPlayerCast(enemy.x, enemy.y) && Math.random()<0.25);
    }
    function onEnemyBoonDeath() {
      const state=boonState();
      state.carnage = (state.carnage || 0) + 1;
      if (hasBoon('ares_carnage') && state.carnage >= 3) {
        state.carnage = 0; gameState.gold += 30;
        gameState.particles.push(new FloatingText(player.x,player.y-45,'CARNAGE +30 OBOLS','#facc15'));
      }
    }
    function drawBoonEffects(ctx) {
      for (const area of gameState.boonAreas || []) {
        ctx.save(); ctx.globalAlpha = Math.min(0.35, area.remaining * 0.4);
        ctx.fillStyle = area.type === 'firestorm' ? '#fb923c' : area.type === 'vortex' ? '#38bdf8' : '#fb7185';
        ctx.strokeStyle=ctx.fillStyle; ctx.lineWidth=3; ctx.beginPath(); ctx.arc(area.x,area.y,area.radius,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.restore();
      }
      if (hasBoon('selene_orbit')) {
        const time=boonState().time || 0;
        ctx.save(); ctx.fillStyle='#ddd6fe'; ctx.strokeStyle='#8b5cf6'; ctx.lineWidth=4;
        ctx.beginPath(); ctx.arc(player.x+Math.cos(time*2.2)*86,player.y+Math.sin(time*2.2)*86,14,0,Math.PI*2); ctx.fill();ctx.stroke();ctx.restore();
      }
    }
