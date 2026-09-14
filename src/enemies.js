    class Enemy {
      constructor(x, y, typeKey) {
        this.x = x;
        this.y = y;
        this.typeKey = typeKey;
        const conf = ENEMY_TYPES[typeKey] || ENEMY_TYPES['shade_wretch'];
        this.name = conf.name;
        this.isBoss = conf.isBoss || false;
        this.isMiniBoss = conf.isMiniBoss || false;

        const depthMult = 1.0 + (gameState.chamber - 1) * 0.025;
        const abyssCycle = gameState.chamber > 100 ? Math.floor((gameState.chamber - 101) / 300) : 0;
        const bossScale = this.isMiniBoss ? 0.65 : this.isBoss ? 0.7 * (1 + abyssCycle * 0.35) : depthMult;
        this.maxHp = Math.round(conf.maxHp * bossScale);
        this.hp = this.maxHp;
        this.dead = false;
        this.spawnGrace = 0.8;
        this.enraged = false;
        this.speed = conf.speed;
        this.baseSpeed = conf.speed;
        this.radius = conf.radius;
        this.color = conf.color;
        this.sheet = conf.sheet;
        this.cellX = conf.cellX;
        this.cellY = conf.cellY;
        this.cols = conf.cols || 3;
        this.rows = conf.rows || 3;
        this.behavior = conf.behavior;

        this.attackCooldown = 1.0 + Math.random() * 1.5;
        this.telegraphTimer = 0;
        this.isTelegraphing = false;
        this.telegraphType = 'circle';
        this.telegraphAngle = 0;
        this.telegraphTarget = { x: 0, y: 0 };

        this.scorchStacks = 0;
        this.scorchTimer = 0;
        this.chillStacks = 0;
        this.chillTimer = 0;
        this.doomDamage = 0;
        this.doomTimer = 0;
        this.timeSlowTimer = 0;
        this.isWeak = false;
        this.weakTimer = 0;
        this.isBurrowed = false;

        this.animFrame = 0;
        this.animRow = 0;
        this.animTimer = 0;
        this.angle = 0;

        this.vx = (Math.random() - 0.5) * this.speed * 1.4;
        this.vy = (Math.random() - 0.5) * this.speed * 1.4;
      }

      update(dt) {
        if (this.dead || this.hp <= 0) return;
        if (this.spawnGrace > 0) { this.spawnGrace -= dt; return; }
        if (updateEnemyBoonEffects(this, dt) || this.dead) return;
        if ((this.isBoss || this.isMiniBoss) && !this.enraged && this.hp < this.maxHp * 0.5) {
          this.enraged = true;
          gameState.particles.push(new FloatingText(this.x, this.y - 70, 'PHASE II • STAY SHARP', '#fb7185'));
          gameState.particles.push(new Shockwave(this.x, this.y, 170, this.color));
          this.attackCooldown = Math.max(0.8, this.attackCooldown);
        }
        let speedMult = 1.0;
        if (this.timeSlowTimer > 0) {
          this.timeSlowTimer -= dt;
          speedMult *= 0.15;
        }
        if (this.chillTimer > 0) {
          this.chillTimer -= dt;
          speedMult *= 0.5;
          if (this.chillTimer <= 0) this.chillStacks = 0;
        }

        const effectiveDt = dt * speedMult;

        if (this.scorchTimer > 0) {
          const burnTime = Math.min(dt, this.scorchTimer);
          this.scorchTimer -= dt;
          const tickRate = (hasBoon('duo_plasma') ? 2.0 : 1.0) * (hasBoon('hestia_pyro') ? 1.6 : 1);
          this.takeDamage(this.scorchStacks * burnTime * tickRate, 'scorch', true);
          if (this.scorchTimer <= 0) this.scorchStacks = 0;
        }

        if (this.doomTimer > 0) {
          this.doomTimer -= dt;
          if (this.doomTimer <= 0) {
            this.takeDamage(this.doomDamage, 'doom');
            sound.playExplosion();
            gameState.particles.push(new Shockwave(this.x, this.y, 90, '#dc2626'));
            this.doomDamage = 0;
          }
        }

        if (this.dead) return;
        if (this.weakTimer > 0) {
          this.weakTimer -= dt;
          if (this.weakTimer <= 0) this.isWeak = false;
        }

        let moveSpeed = this.speed * speedMult;
        if (player.castActive) {
          const dToCast = Math.hypot(this.x - player.castActive.x, this.y - player.castActive.y);
          if (dToCast <= player.castActive.radius) {
            moveSpeed *= 0.3;
          }
        }

        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.max(0.001, Math.hypot(dx, dy));
        this.angle = Math.atan2(dy, dx);

        if (this.isBoss || this.isMiniBoss) {
          updateBossHUD(this);
        }

        if (this.isTelegraphing) {
          this.telegraphTimer -= effectiveDt;
          if (this.telegraphTimer <= 0) {
            this.isTelegraphing = false;
            this.executeAttack();
          }
          return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= effectiveDt;

        if (this.behavior === 'miniboss_asterius') {
          if (dist > 95) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('boss_axe_cleave', 0.65, 170);
            else if (pat === 1) this.startTelegraph('boss_leap_slam', 0.85, 220);
            else this.startTelegraph('rush', 0.75, 450);
          }
        } else if (this.behavior === 'miniboss_hydra') {
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 2);
            if (pat === 0) this.startTelegraph('hydra_barrage', 0.65, 380);
            else this.startTelegraph('hydra_slam', 0.8, 200);
          }
        } else if (this.behavior === 'miniboss_hecate') {
          if (dist < 180) this.moveWithCollision(-(dx / dist) * moveSpeed * effectiveDt, -(dy / dist) * moveSpeed * effectiveDt);
          else if (dist > 320) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('hecate_moon_beams', 0.6, 400);
            else if (pat === 1) this.startTelegraph('hecate_polymorph', 0.75, 240);
            else this.startTelegraph('mortar', 0.8, 160);
          }
        } else if (this.behavior === 'miniboss_cerberus') {
          if (dist > 85) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('cerberus_magma_breath', 0.6, 360);
            else if (pat === 1) this.startTelegraph('cerberus_pounce', 0.75, 240);
            else this.startTelegraph('ring', 0.5, 220);
          }
        } else if (this.behavior === 'titan_boss_20x') {
          if (dist > 95) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const hpPct = this.hp / this.maxHp;
            const pat = Math.floor(Math.random() * (hpPct < 0.33 ? 5 : (hpPct < 0.66 ? 4 : 3)));
            if (pat === 0) this.startTelegraph('boss_scythe', 0.65, 200);
            else if (pat === 1) this.startTelegraph('boss_barrage', 0.55, 450);
            else if (pat === 2) this.startTelegraph('boss_timestop', 0.75, 360);
            else if (pat === 3) this.startTelegraph('chronos_orbital_lasers', 0.7, 500);
            else this.startTelegraph('chronos_blitz', 0.5, 450);
          }
        }
        // --- 10 POST-CHRONOS INFINITE BOSSES AI ---
        else if (this.behavior === 'boss_typhon') {
          if (dist > 110) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('typhon_magma_eruption', 0.7, 450);
            else if (pat === 1) this.startTelegraph('boss_leap_slam', 0.8, 240);
            else this.startTelegraph('cerberus_magma_breath', 0.6, 380);
          }
        } else if (this.behavior === 'boss_nyx') {
          if (dist < 220) this.moveWithCollision(-(dx / dist) * moveSpeed * effectiveDt, -(dy / dist) * moveSpeed * effectiveDt);
          else if (dist > 360) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('nyx_pulsar_ring', 0.65, 450);
            else if (pat === 1) this.startTelegraph('nyx_darkness_beam', 0.7, 420);
            else this.startTelegraph('nyx_gravity_well', 0.8, 280);
          }
        } else if (this.behavior === 'boss_tartarus') {
          if (dist > 100) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('tartarus_ground_shatter', 0.85, 260);
            else if (pat === 1) this.startTelegraph('quad_boulder_slam', 0.75, 400);
            else this.startTelegraph('earthquake', 0.9, 250);
          }
        } else if (this.behavior === 'boss_thanatos') {
          if (dist > 90) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('thanatos_reaper_cleave', 0.6, 220);
            else if (pat === 1) this.startTelegraph('thanatos_doom_skulls', 0.65, 420);
            else this.startTelegraph('thanatos_teleport_slash', 0.5, 300);
          }
        } else if (this.behavior === 'boss_prometheus') {
          if (dist > 100) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('prometheus_solar_slash', 0.65, 380);
            else if (pat === 1) this.startTelegraph('mortar', 0.75, 180);
            else this.startTelegraph('ring', 0.6, 260);
          }
        } else if (this.behavior === 'boss_medusa') {
          if (dist < 190) this.moveWithCollision(-(dx / dist) * moveSpeed * effectiveDt, -(dy / dist) * moveSpeed * effectiveDt);
          else if (dist > 330) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('medusa_gaze_petrify', 0.75, 320);
            else if (pat === 1) this.startTelegraph('poison_fan', 0.55, 420);
            else this.startTelegraph('circle', 0.5, 160);
          }
        } else if (this.behavior === 'boss_nemesis') {
          if (dist > 80) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('rush', 0.55, 420);
            else if (pat === 1) this.startTelegraph('chronos_blitz', 0.5, 360);
            else this.startTelegraph('ring', 0.6, 250);
          }
        } else if (this.behavior === 'boss_charon') {
          if (dist > 90) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('charon_tsunami_surge', 0.7, 400);
            else if (pat === 1) this.startTelegraph('charon_obol_spiral', 0.6, 450);
            else this.startTelegraph('boss_scythe', 0.65, 220);
          }
        } else if (this.behavior === 'boss_python') {
          if (dist > 80) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 3);
            if (pat === 0) this.startTelegraph('python_toxic_carpet', 0.7, 360);
            else if (pat === 1) this.startTelegraph('eruption', 0.9, 150);
            else this.startTelegraph('fan', 0.55, 400);
          }
        } else if (this.behavior === 'boss_chaos') {
          if (this.attackCooldown <= 0) {
            const pat = Math.floor(Math.random() * 4);
            if (pat === 0) this.startTelegraph('chaos_singularity_blackhole', 0.85, 450);
            else if (pat === 1) this.startTelegraph('chronos_orbital_lasers', 0.65, 520);
            else if (pat === 2) this.startTelegraph('boss_barrage', 0.55, 480);
            else this.startTelegraph('boss_timestop', 0.75, 400);
          }
        }
        // --- STANDARD ENEMY AI BEHAVIORS ---
        // 1. FAST SWARMERS & RUSHERS (Direct Aggressive Rush)
        else if (this.behavior === 'swarmer') {
          if (dist > 45) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          else if (this.attackCooldown <= 0) this.startTelegraph('circle', 0.45, 60);
        } else if (this.behavior === 'screamer') {
          this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0 && dist < 130) this.startTelegraph('ring', 0.4, 150);
        } else if (this.behavior === 'kamikaze_bomber') {
          this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (dist < 48) this.startTelegraph('circle', 0.35, 120);
        } else if (this.behavior === 'bull_rush') {
          if (this.attackCooldown <= 0 && dist < 450) this.startTelegraph('rush', 0.75, 450);
          else this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
        }

        // 2. SKIRMISHERS & HIT-AND-RUN BRUTES (Withdraw after attack, then re-engage)
        else if (this.behavior === 'slammer' || this.behavior === 'cyclops_smasher' || this.behavior === 'tartarus_behemoth' || this.behavior === 'shield_spearman') {
          if (this.attackCooldown > 0.6) {
            // Withdraw backwards to reset space!
            if (dist < 260) this.moveWithCollision(-(dx / dist) * moveSpeed * 0.85 * effectiveDt, -(dy / dist) * moveSpeed * 0.85 * effectiveDt);
          } else {
            // Ready to attack: advance into range
            if (dist > 80) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
            else if (this.attackCooldown <= 0) this.startTelegraph('circle', 0.7, 130);
          }
        } else if (this.behavior === 'earthquake' || this.behavior === 'quad_boulder_slam') {
          if (this.attackCooldown > 0.7) {
            if (dist < 280) this.moveWithCollision(-(dx / dist) * moveSpeed * 0.8 * effectiveDt, -(dy / dist) * moveSpeed * 0.8 * effectiveDt);
          } else {
            if (dist > 100) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
            else if (this.attackCooldown <= 0) this.startTelegraph('earthquake', 0.9, 200);
          }
        }

        // 3. SNIPERS & LONG-RANGE CASTERS (Shoot from afar, kite if player approaches)
        else if (this.behavior === 'triple_orb') {
          if (dist < 280) this.moveWithCollision(-(dx / dist) * moveSpeed * 1.1 * effectiveDt, -(dy / dist) * moveSpeed * 1.1 * effectiveDt);
          else if (dist > 480) this.moveWithCollision((dx / dist) * moveSpeed * 0.6 * effectiveDt, (dy / dist) * moveSpeed * 0.6 * effectiveDt);
          if (this.attackCooldown <= 0 && dist <= 520) this.startTelegraph('line', 0.6, 420);
        } else if (this.behavior === 'pentagram_mortar') {
          if (dist < 300) this.moveWithCollision(-(dx / dist) * moveSpeed * 1.1 * effectiveDt, -(dy / dist) * moveSpeed * 1.1 * effectiveDt);
          else if (dist > 500) this.moveWithCollision((dx / dist) * moveSpeed * 0.5 * effectiveDt, (dy / dist) * moveSpeed * 0.5 * effectiveDt);
          if (this.attackCooldown <= 0) this.startTelegraph('mortar', 0.8, 140);
        } else if (this.behavior === 'poison_fan' || this.behavior === 'poison_darts') {
          if (dist < 260) this.moveWithCollision(-(dx / dist) * moveSpeed * 1.1 * effectiveDt, -(dy / dist) * moveSpeed * 1.1 * effectiveDt);
          else if (dist > 450) this.moveWithCollision((dx / dist) * moveSpeed * 0.6 * effectiveDt, (dy / dist) * moveSpeed * 0.6 * effectiveDt);
          if (this.attackCooldown <= 0 && dist <= 480) this.startTelegraph('fan', 0.5, 340);
        } else if (this.behavior === 'frost_spiral' || this.behavior === 'time_rift') {
          if (dist < 260) this.moveWithCollision(-(dx / dist) * moveSpeed * 1.0 * effectiveDt, -(dy / dist) * moveSpeed * 1.0 * effectiveDt);
          else if (dist > 440) this.moveWithCollision((dx / dist) * moveSpeed * 0.6 * effectiveDt, (dy / dist) * moveSpeed * 0.6 * effectiveDt);
          if (this.attackCooldown <= 0) this.startTelegraph('ring', 0.5, 220);
        } else if (this.behavior === 'doom_runes' || this.behavior === 'time_tether_bombs') {
          if (dist < 280) this.moveWithCollision(-(dx / dist) * moveSpeed * 1.0 * effectiveDt, -(dy / dist) * moveSpeed * 1.0 * effectiveDt);
          else if (dist > 460) this.moveWithCollision((dx / dist) * moveSpeed * 0.5 * effectiveDt, (dy / dist) * moveSpeed * 0.5 * effectiveDt);
          if (this.attackCooldown <= 0) this.startTelegraph('mortar', 0.8, 150);
        } else if (this.behavior === 'triple_fireball' || this.behavior === 'bouncing_acid_triad') {
          if (dist < 280) this.moveWithCollision(-(dx / dist) * moveSpeed * 1.0 * effectiveDt, -(dy / dist) * moveSpeed * 1.0 * effectiveDt);
          else if (dist > 460) this.moveWithCollision((dx / dist) * moveSpeed * 0.6 * effectiveDt, (dy / dist) * moveSpeed * 0.6 * effectiveDt);
          if (this.attackCooldown <= 0 && dist <= 480) this.startTelegraph('fan', 0.6, 340);
        }

        // 4. CONTROLLERS, SUMMONERS & TURRETS
        else if (this.behavior === 'dual_laser_turret') {
          this.angle += effectiveDt * 1.2;
          if (this.attackCooldown <= 0) {
            this.attackCooldown = 0.42;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(this.angle)*360, Math.sin(this.angle)*360, 24, 'laser_shard', this));
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(this.angle+Math.PI)*360, Math.sin(this.angle+Math.PI)*360, 24, 'laser_shard', this));
          }
        } else if (this.behavior === 'charm_pulse' || this.behavior === 'summon_skeleton_shades') {
          const targetAng = this.angle + 0.03;
          const targetX = player.x + Math.cos(targetAng) * 240;
          const targetY = player.y + Math.sin(targetAng) * 240;
          this.moveWithCollision((targetX - this.x) * 3 * effectiveDt, (targetY - this.y) * 3 * effectiveDt);
          if (this.attackCooldown <= 0) this.startTelegraph('ring', 0.6, 200);
        } else if (this.behavior === 'magma_dropper') {
          this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          // Hostile magma is emitted as enemy projectiles, never as a player-owned FireTrail.
          if (this.attackCooldown <= 0) this.startTelegraph('fan', 0.6, 280);
        } else if (this.behavior === 'teleport_scythe' || this.behavior === 'stealth_backstab') {
          if (this.attackCooldown <= 0) {
            this.x = player.x - Math.cos(player.angle) * 70;
            this.y = player.y - Math.sin(player.angle) * 70;
            this.startTelegraph('circle', 0.5, 120);
          }
        } else if (this.behavior === 'wall_bounce_charger' || this.behavior === 'blade_bouncer') {
          const nextX = this.x + this.vx * effectiveDt;
          const nextY = this.y + this.vy * effectiveDt;
          if (checkWallCollision(nextX, this.y, this.radius)) this.vx = -this.vx;
          else this.x = nextX;
          if (checkWallCollision(this.x, nextY, this.radius)) this.vy = -this.vy;
          else this.y = nextY;
          if (Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius) {
            player.takeDamage(38, this);
          }
        } else if (this.behavior === 'flamethrower') {
          if (this.attackCooldown <= 0 && dist < 280) this.startTelegraph('flame_cone', 0.6, 260);
          else this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
        } else if (this.behavior === 'burrow_eruption') {
          if (this.attackCooldown <= 0) {
            this.isBurrowed = true;
            this.telegraphTarget = { x: player.x, y: player.y };
            this.startTelegraph('eruption', 1.0, 110);
          }
        } else {
          if (dist > 60) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0 && dist < 100) this.startTelegraph('circle', 0.45, 70);
        }

        this.animTimer += effectiveDt;
        if (this.animTimer > 0.15) {
          this.animTimer = 0;
          this.animFrame = (this.animFrame + 1) % 3;
        }
      }

      startTelegraph(type, duration, radiusOrRange) {
        this.isTelegraphing = true;
        this.telegraphType = type;
        // The warning remains readable even when phase II shortens recovery time.
        this.telegraphTimer = Math.max(0.6, duration);
        this.telegraphMax = this.telegraphTimer;
        this.telegraphParam = radiusOrRange;
        this.telegraphAngle = this.angle;
        this.telegraphTarget = safeArenaPosition(player.x, player.y, this.radius);
        this.animRow = 2;
      }

      executeAttack() {
        this.animRow = 0;
        if (this.dead) return;
        this.attackCooldown = (this.isBoss || this.isMiniBoss ? (this.enraged ? 1.05 : 1.5) : 1.8) + Math.random() * 0.8;
        if (onEnemyBoonAttack(this)) return;
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        if (this.telegraphType === 'typhon_magma_eruption') {
          sound.playExplosion();
          createScreenShake(18);
          for (let i = -4; i <= 4; i++) {
            const a = this.telegraphAngle + i * 0.22;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*360, Math.sin(a)*360, 48, 'magma_ball', this));
          }
          gameState.particles.push(new Shockwave(this.x, this.y, 240, '#ea580c'));
        } else if (this.telegraphType === 'nyx_pulsar_ring') {
          sound.playLightning();
          createScreenShake(14);
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*320, Math.sin(a)*320, 44, 'frost_shard', this));
          }
        } else if (this.telegraphType === 'nyx_darkness_beam') {
          sound.playCast();
          for (let i = -2; i <= 2; i++) {
            const a = this.telegraphAngle + i * 0.12;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*420, Math.sin(a)*420, 52, 'doom_skull', this));
          }
        } else if (this.telegraphType === 'nyx_gravity_well') {
          sound.playExplosion();
          createScreenShake(16);
          gameState.particles.push(new Shockwave(this.x, this.y, 320, '#818cf8'));
          if (distToPlayer < 320) {
            player.x += (this.x - player.x) * 0.4;
            player.y += (this.y - player.y) * 0.4;
            player.takeDamage(55, this);
          }
        } else if (this.telegraphType === 'tartarus_ground_shatter') {
          sound.playExplosion();
          createScreenShake(22);
          if (distToPlayer < 260) player.takeDamage(85, this);
          gameState.particles.push(new Shockwave(this.x, this.y, 280, '#d97706'));
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*260, Math.sin(a)*260, 45, 'magma_ball', this));
          }
        } else if (this.telegraphType === 'thanatos_reaper_cleave') {
          sound.playSlash();
          createScreenShake(18);
          if (distToPlayer < 220) player.takeDamage(95, this);
          for (let i = -3; i <= 3; i++) {
            const a = this.telegraphAngle + i * 0.2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*380, Math.sin(a)*380, 48, 'whirling_blade', this));
          }
        } else if (this.telegraphType === 'thanatos_doom_skulls') {
          sound.playCast();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*280, Math.sin(a)*280, 50, 'doom_skull', this));
          }
        } else if (this.telegraphType === 'thanatos_teleport_slash') {
          sound.playSlash();
          createScreenShake(16);
          this.x = this.telegraphTarget.x;
          this.y = this.telegraphTarget.y;
          if (Math.hypot(player.x - this.x, player.y - this.y) < 130) player.takeDamage(80, this);
          gameState.particles.push(new Shockwave(this.x, this.y, 160, '#06b6d4'));
        } else if (this.telegraphType === 'prometheus_solar_slash') {
          sound.playSlash();
          createScreenShake(16);
          for (let i = -2; i <= 2; i++) {
            const a = this.telegraphAngle + i * 0.25;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*360, Math.sin(a)*360, 50, 'whirling_blade', this));
          }
        } else if (this.telegraphType === 'medusa_gaze_petrify') {
          sound.playCast();
          createScreenShake(14);
          gameState.particles.push(new Shockwave(this.x, this.y, 320, '#10b981'));
          if (distToPlayer < 320) {
            player.takeDamage(40, this);
            player.slowTimer = 1.5;
            gameState.particles.push(new FloatingText(player.x, player.y - 30, 'PETRIFIED (SLOWED)!', '#10b981'));
          }
        } else if (this.telegraphType === 'charon_tsunami_surge') {
          sound.playExplosion();
          createScreenShake(18);
          for (let i = -3; i <= 3; i++) {
            const a = this.telegraphAngle + i * 0.2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*340, Math.sin(a)*340, 52, 'bouncing_acid', this));
          }
          gameState.particles.push(new Shockwave(this.x, this.y, 260, '#eab308'));
        } else if (this.telegraphType === 'charon_obol_spiral') {
          sound.playGold();
          for (let i = 0; i < 18; i++) {
            const a = (i / 18) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*310, Math.sin(a)*310, 42, 'clockwork_bomb', this));
          }
        } else if (this.telegraphType === 'python_toxic_carpet') {
          sound.playCast();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*260, Math.sin(a)*260, 46, 'poison_dart', this));
          }
          gameState.particles.push(new Shockwave(this.x, this.y, 220, '#22c55e'));
        } else if (this.telegraphType === 'chaos_singularity_blackhole') {
          sound.playExplosion();
          createScreenShake(24);
          gameState.particles.push(new Shockwave(this.x, this.y, 480, '#ec4899'));
          if (distToPlayer < 400) {
            player.x += (this.x - player.x) * 0.5;
            player.y += (this.y - player.y) * 0.5;
            player.takeDamage(75, this);
          }
          for (let i = 0; i < 20; i++) {
            const a = (i / 20) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*360, Math.sin(a)*360, 55, 'time_shard', this));
          }
        } else if (this.telegraphType === 'boss_axe_cleave') {
          sound.playSlash();
          createScreenShake(12);
          if (distToPlayer <= this.telegraphParam + player.radius) player.takeDamage(65, this);
          for (let i = -2; i <= 2; i++) {
            const a = this.telegraphAngle + i * 0.25;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*340, Math.sin(a)*340, 32, 'whirling_blade', this));
          }
        } else if (this.telegraphType === 'boss_leap_slam') {
          sound.playExplosion();
          createScreenShake(16);
          this.x = this.telegraphTarget.x;
          this.y = this.telegraphTarget.y;
          if (Math.hypot(player.x - this.x, player.y - this.y) <= 150) player.takeDamage(75, this);
          gameState.particles.push(new Shockwave(this.x, this.y, 220, '#f59e0b'));
        } else if (this.telegraphType === 'hydra_barrage') {
          sound.playCast();
          for (let i = -3; i <= 3; i++) {
            const a = this.telegraphAngle + i * 0.2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*320, Math.sin(a)*320, 38, 'bouncing_acid', this));
          }
        } else if (this.telegraphType === 'hydra_slam') {
          sound.playExplosion();
          createScreenShake(14);
          if (distToPlayer < 200) player.takeDamage(60, this);
          gameState.particles.push(new Shockwave(this.x, this.y, 200, '#10b981'));
        } else if (this.telegraphType === 'hecate_moon_beams') {
          sound.playLightning();
          createScreenShake(12);
          for (let i = 0; i < 12; i++) {
            const a = (i / 12) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*280, Math.sin(a)*280, 42, 'frost_shard', this));
          }
        } else if (this.telegraphType === 'hecate_polymorph') {
          sound.playCast();
          gameState.particles.push(new Shockwave(this.x, this.y, 240, '#8b5cf6'));
          if (distToPlayer < 240) {
            player.takeDamage(45, this);
            player.slowTimer = 1.2;
          }
        } else if (this.telegraphType === 'cerberus_magma_breath') {
          sound.playExplosion();
          for (let i = -3; i <= 3; i++) {
            const a = this.telegraphAngle + i * 0.22;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*360, Math.sin(a)*360, 48, 'magma_ball', this));
          }
        } else if (this.telegraphType === 'cerberus_pounce') {
          sound.playExplosion();
          createScreenShake(18);
          this.x = this.telegraphTarget.x;
          this.y = this.telegraphTarget.y;
          if (Math.hypot(player.x - this.x, player.y - this.y) <= 160) player.takeDamage(80, this);
          gameState.particles.push(new AnimatedFireExplosion(this.x, this.y, 200));
        } else if (this.telegraphType === 'boss_scythe') {
          sound.playSlash();
          createScreenShake(18);
          if (distToPlayer < 200) player.takeDamage(85, this);
          for (let i = 0; i < 16; i++) {
            const a = (i / 16) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*320, Math.sin(a)*320, 44, 'time_shard', this));
          }
        } else if (this.telegraphType === 'boss_barrage') {
          sound.playCast();
          for (let i = 0; i < 20; i++) {
            const a = (i / 20) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*340, Math.sin(a)*340, 40, 'time_shard', this));
          }
        } else if (this.telegraphType === 'boss_timestop') {
          sound.playCast();
          createScreenShake(20);
          gameState.particles.push(new Shockwave(this.x, this.y, 600, '#eab308'));
          if (distToPlayer <= this.telegraphParam) player.takeDamage(45, this);
        } else if (this.telegraphType === 'chronos_orbital_lasers') {
          sound.playLightning();
          for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*380, Math.sin(a)*380, 48, 'time_shard', this));
          }
        } else if (this.telegraphType === 'chronos_blitz') {
          sound.playSlash();
          createScreenShake(20);
          this.x = this.telegraphTarget.x;
          this.y = this.telegraphTarget.y;
          if (Math.hypot(player.x - this.x, player.y - this.y) < 140) player.takeDamage(90, this);
          gameState.particles.push(new Shockwave(this.x, this.y, 180, '#facc15'));
        } else if (this.telegraphType === 'circle' || this.telegraphType === 'slam') {
          sound.playSlash();
          createScreenShake(6);
          if (distToPlayer <= this.telegraphParam + player.radius) {
            player.takeDamage(this.behavior === 'kamikaze_bomber' ? 70 : 44, this);
          }
          if (this.behavior === 'kamikaze_bomber') {
            this.takeDamage(9999);
            gameState.particles.push(new AnimatedFireExplosion(this.x, this.y, 140));
          }
        } else if (this.telegraphType === 'line') {
          sound.playCast();
          for (let i = -1; i <= 1; i++) {
            const a = this.telegraphAngle + i * 0.2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*280, Math.sin(a)*280, 40, 'witch_orb', this));
          }
        } else if (this.telegraphType === 'fan' || this.telegraphType === 'poison_fan') {
          sound.playCast();
          const projType = (this.behavior === 'triple_fireball' || this.behavior === 'magma_dropper') ? 'magma_ball' : (this.behavior === 'bouncing_acid_triad' ? 'bouncing_acid' : 'poison_dart');
          for (let i = -2; i <= 2; i++) {
            const a = this.telegraphAngle + i * 0.18;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*320, Math.sin(a)*320, 36, projType, this));
          }
        } else if (this.telegraphType === 'mortar') {
          sound.playExplosion();
          const target = this.telegraphTarget;
          scheduleGameAction(0.4, () => {
            sound.playExplosion();
            createScreenShake(10);
            if (Math.hypot(player.x - target.x, player.y - target.y) <= 80) player.takeDamage(60, this);
            gameState.particles.push(new AnimatedFireExplosion(target.x, target.y, 130));
          });
        } else if (this.telegraphType === 'ring') {
          sound.playExplosion();
          createScreenShake(8);
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*240, Math.sin(a)*240, 38, 'frost_shard', this));
          }
          if (this.behavior === 'summon_skeleton_shades' && gameState.enemies.length < 28) {
            const position = safeArenaPosition(this.x + 80, this.y, 24);
            gameState.enemies.push(new Enemy(position.x, position.y, 'shade_wretch'));
            this.attackCooldown = 5;
          }
        } else if (this.telegraphType === 'rush') {
          sound.playSlash();
          const rushDist = Math.min(380, this.telegraphParam);
          for (let step = 0; step < 20; step++) {
            this.moveWithCollision(Math.cos(this.telegraphAngle) * rushDist / 20, Math.sin(this.telegraphAngle) * rushDist / 20);
          }
          if (Math.hypot(player.x - this.x, player.y - this.y) < 70) player.takeDamage(65, this);
          createScreenShake(12);
        } else if (this.telegraphType === 'earthquake') {
          sound.playExplosion();
          createScreenShake(12);
          if (distToPlayer <= this.telegraphParam + player.radius) player.takeDamage(this.isBoss ? 70 : 44, this);
          gameState.particles.push(new Shockwave(this.x, this.y, this.telegraphParam, '#fb923c'));
        } else if (this.telegraphType === 'quad_boulder_slam') {
          sound.playExplosion();
          for (let i = 0; i < 4; i++) {
            const angle = this.telegraphAngle + i * Math.PI / 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle) * 260, Math.sin(angle) * 260, 48, 'magma_ball', this));
          }
        } else if (this.telegraphType === 'flame_cone') {
          sound.playExplosion();
          for (let i = -2; i <= 2; i++) {
            const angle = this.telegraphAngle + i * 0.16;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(angle) * 320, Math.sin(angle) * 320, 30, 'magma_ball', this));
          }
        } else if (this.telegraphType === 'eruption') {
          this.isBurrowed = false;
          this.x = this.telegraphTarget.x;
          this.y = this.telegraphTarget.y;
          sound.playExplosion();
          createScreenShake(10);
          if (Math.hypot(player.x - this.x, player.y - this.y) < 80) player.takeDamage(60, this);
          gameState.particles.push(new Shockwave(this.x, this.y, 110, '#9333ea'));
        }
      }

      moveWithCollision(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (!checkWallCollision(newX, this.y, this.radius)) this.x = newX;
        if (!checkWallCollision(this.x, newY, this.radius)) this.y = newY;
      }

      applyScorch(amount) {
        if (this.dead) return;
        this.scorchStacks += amount / 3;
        this.scorchTimer = 3.0;
      }

      applyChill(duration) {
        if (this.dead) return;
        this.chillStacks++;
        this.chillTimer = duration;
      }

      applyDoom(amount) {
        if (this.dead) return;
        this.doomDamage = amount * (hasBoon('ares_impending') ? 1.8 : 1);
        this.doomTimer = hasBoon('ares_impending') ? 1.5 : 1.1;
      }

      takeDamage(amount, source = 'normal', silent = false) {
        if (this.dead || !Number.isFinite(amount) || amount <= 0) return;
        // Keep fractional damage: rounding each burn tick made damage depend on FPS.
        amount = modifyBoonDamage(this, amount, source);
        const damage = Math.min(this.hp, amount * (hasBoon('hestia_inferno') && this.scorchTimer > 0 && source !== 'scorch' ? 1.4 : 1));
        const intDmg = Math.round(damage);
        this.hp = Math.max(0, this.hp - damage);
        onEnemyBoonHit(this, source);

        if (source === 'player' && hasBoon('aphrodite_strike')) {
          this.isWeak = true;
          this.weakTimer = 4.0;
        }

        if (!silent) {
          const color = source === 'slam' ? '#38bdf8' : (source === 'hex' ? '#fde047' : (source === 'cast' ? '#c084fc' : (source === 'doom' ? '#dc2626' : '#ffffff')));
          gameState.particles.push(new FloatingText(this.x + (Math.random()-0.5)*20, this.y - 24, `${intDmg}`, color));
        }

        if (this.hp <= 0) {
          this.die();
        }
      }

      die() {
        if (this.dead) return;
        this.dead = true;
        const idx = gameState.enemies.indexOf(this);
        if (idx !== -1) {
          gameState.enemies.splice(idx, 1);
          gameState.kills++;
          onEnemyBoonDeath();
          sound.playHit();

          if (hasBoon('ares_passive')) {
            gameState.battleRageTimer = 5.0;
          }

          if (hasBoon('apollo_hymn') && player.hp < player.maxHp && (boonState().hymnHealing || 0) < 25) {
            const healed = Math.min(4, 25 - (boonState().hymnHealing || 0));
            boonState().hymnHealing = (boonState().hymnHealing || 0) + healed;
            gainHealth(healed);
            updateHUD();
          }

          if (hasBoon('aphrodite_heart') && this.isWeak) {
            gameState.enemies.slice().forEach(e => {
              if (Math.hypot(e.x - this.x, e.y - this.y) < 140) e.takeDamage(80, 'charm');
            });
            gameState.particles.push(new CharmBurst(this.x, this.y));
          }

          if (hasBoon('ares_grim') && this.doomDamage > 0) {
            gameState.enemies.slice().forEach(e => {
              if (Math.hypot(e.x - this.x, e.y - this.y) < 160) e.takeDamage(this.doomDamage, 'doom');
            });
          }

          if (hasBoon('duo_supernova') && this.scorchStacks > 0) {
            gameState.enemies.slice().forEach(e => {
              if (Math.hypot(e.x - this.x, e.y - this.y) < 220) e.takeDamage(180, 'supernova');
            });
            gameState.particles.push(new AnimatedFireExplosion(this.x, this.y, 220));
          }

          let obols = (this.isBoss ? 200 : (this.isMiniBoss ? 80 : Math.floor(Math.random() * 6) + 4));
          let ashes = (this.isBoss ? 50 : (this.isMiniBoss ? 20 : 2));
          if (hasBoon('poseidon_ocean')) {
            obols = Math.round(obols * 1.6);
            ashes = Math.round(ashes * 1.6);
          }
          gameState.gold += obols;
          gameState.ashes += ashes;
          sound.playGold();
          updateHUD();

          gameState.particles.push(new Shockwave(this.x, this.y, this.radius * 2.2, this.color));

          if (this.isBoss) {
            document.getElementById('boss-hud').style.display = 'none';
            if (gameState.chamber === 100) {
              gameState.gold += 500;
              gameState.ashes += 100;
              gameState.particles.push(new FloatingText(player.x, player.y - 60, 'CHRONOS DEFEATED! ENTERING INFINITE TARTARUS', '#fde047'));
            } else if (gameState.chamber > 100) {
              gameState.gold += 350;
              gameState.ashes += 60;
              gameState.particles.push(new FloatingText(player.x, player.y - 60, 'ABYSSAL TITAN SLAIN!', '#f59e0b'));
            }
            onChamberCleared();
          } else if (this.isMiniBoss) {
            document.getElementById('boss-hud').style.display = 'none';
            onChamberCleared();
          } else if (gameState.enemies.length === 0) {
            onChamberCleared();
          }
        }
      }

      draw(ctx) {
        if (this.dead) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isTelegraphing) {
          const progress = 1 - this.telegraphTimer / this.telegraphMax;
          const targetRadii = { mortar: 80, eruption: 80, boss_leap_slam: 150, cerberus_pounce: 160, thanatos_teleport_slash: 130, chronos_blitz: 140 };
          const areaRadii = { nyx_gravity_well: 320, tartarus_ground_shatter: 260, thanatos_reaper_cleave: 220, medusa_gaze_petrify: 320, chaos_singularity_blackhole: 400, hydra_slam: 200, hecate_polymorph: 240, boss_scythe: 200 };
          const fanTypes = ['fan', 'poison_fan', 'flame_cone', 'hydra_barrage', 'cerberus_magma_breath', 'typhon_magma_eruption', 'nyx_darkness_beam', 'prometheus_solar_slash', 'charon_tsunami_surge', 'line'];
          ctx.save();
          ctx.strokeStyle = '#ffb4a9';
          ctx.fillStyle = 'rgba(239,68,68,' + (0.1 + progress * 0.25) + ')';
          ctx.lineWidth = 3;
          if (targetRadii[this.telegraphType]) {
            ctx.translate(this.telegraphTarget.x - this.x, this.telegraphTarget.y - this.y);
          }
          ctx.beginPath();
          if (this.telegraphType === 'rush') {
            ctx.rotate(this.telegraphAngle);
            ctx.rect(0, -40, Math.min(380, this.telegraphParam), 80);
          } else if (fanTypes.includes(this.telegraphType)) {
            ctx.rotate(this.telegraphAngle);
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.telegraphParam, -0.9, 0.9);
            ctx.closePath();
          } else {
            const radius = targetRadii[this.telegraphType] || areaRadii[this.telegraphType] || this.telegraphParam;
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
          }
          ctx.fill();
          ctx.stroke();
          ctx.setLineDash([7, 7]);
          ctx.strokeStyle = '#fff0d1';
          ctx.beginPath();
          ctx.arc(0, 0, 14 + progress * 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        if (this.isBurrowed) { ctx.restore(); return; }

        // Ambient Aura
        ctx.beginPath();
        ctx.arc(0, 0, this.radius * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = this.color + '33';
        ctx.fill();

        // Shadow
        ctx.beginPath();
        ctx.ellipse(0, this.radius * 0.8, this.radius, this.radius * 0.5, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fill();

        // Sprite Rendering
        const img = loadedImages[this.sheet];
        if (img && img.complete && img.naturalWidth > 0) {
          const cellW = img.width / this.cols;
          const cellH = img.height / this.rows;
          let sx = (this.cellX !== undefined) ? (this.cellX * cellW) : (this.animFrame * cellW);
          let sy = (this.cellY !== undefined) ? (this.cellY * cellH) : (this.animRow * cellH);

          const facingLeft = Math.cos(this.angle) < 0;
          if (facingLeft) ctx.scale(-1, 1);

          const drawSize = this.radius * 3.6;
          ctx.save();
          ctx.drawImage(img, sx, sy, cellW, cellH, -drawSize/2, -drawSize/2, drawSize, drawSize);
          ctx.restore();
          if (facingLeft) ctx.scale(-1, 1);
        } else {
          ctx.fillStyle = this.color;
          ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.fillRect(-10, -6, 6, 5); ctx.fillRect(4, -6, 6, 5);
        }

        // Overhead health bar & Type Name (non-bosses)
        if (!this.isBoss && !this.isMiniBoss) {
          const barW = Math.max(46, this.radius * 1.8);
          const barH = 6;
          ctx.fillStyle = '#000';
          ctx.fillRect(-barW/2, -this.radius - 20, barW, barH);
          ctx.fillStyle = this.color;
          ctx.fillRect(-barW/2, -this.radius - 20, (this.hp / this.maxHp) * barW, barH);

          ctx.font = 'bold 9px Cinzel';
          ctx.fillStyle = '#cbd5e1';
          ctx.textAlign = 'center';
          ctx.fillText(this.name, 0, -this.radius - 24);
        }

        ctx.restore();
      }
    }

    // --- PROJECTILE CLASS (Single-Hit Registration Per Target) ---
