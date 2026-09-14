    class Player {
      constructor() {
        this.x = 0;
        this.y = 200;
        this.radius = 24;
        this.baseMaxHp = 100;
        this.maxHp = 100;
        this.hp = 100;
        this.baseMagick = 50;
        this.maxMagick = 50;
        this.magick = 50;
        this.speed = 330;
        this.angle = 0;

        this.attackCombo = 0; // 0, 1, 2, 3 (Finisher)
        this.attackTimer = 0;
        this.attackDuration = 0.18;
        this.comboResetTimer = 0;
        this.specialCooldown = 0;
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.isDashing = false;
        this.dashVx = 0;
        this.dashVy = 0;
        this.iFrames = 0;
        this.castActive = null;
        this.hexCharge = 0;
        this.hexMax = 100;
        this.volcanicReady = true;
        this.volcanicTimer = 0;

        this.animRow = 0;
        this.animFrame = 0;
        this.animTimer = 0;
      }

      resetForRun() {
        gameState.equippedBoons = [];
        gameState.kills = 0;
        gameState.gold = 80;
        gameState.roomsCleared = 0;
        gameState.battleRageTimer = 0;
        gameState.pendingActions = [];
        gameState.boonAreas = [];
        this.boonState = {};
        this.maxHp = this.baseMaxHp + gameState.upgrades.maxHp * 20;
        this.hp = this.maxHp;
        this.maxMagick = this.baseMagick + gameState.upgrades.magick * 15;
        this.magick = this.maxMagick;
        this.speed = 330;
        this.defianceCount = 1 + Math.floor(gameState.upgrades.defiance / 20);
        this.maxDefiance = this.defianceCount;
        this.barrierHp = 0;
        this.bloodFrenzyCount = 0;
        this.attackCombo = this.comboResetTimer = this.attackTimer = 0;
        this.specialCooldown = this.dashCooldown = this.dashTimer = 0;
        this.dashVx = this.dashVy = 0;
        this.iFrames = 1;
        this.slowTimer = 0;
        this.volcanicReady = true;
        this.volcanicTimer = 0;
        this.roomHealing = 0;
        this.x = 0;
        this.y = 260;
        this.hexCharge = 0;
        this.castActive = null;
        this.isDashing = false;
        updateHUD();
      }

      update(dt) {
        updateBoonEffects(dt);
        const regenRate = hasBoon('apollo_clarity') ? 14 : 7;
        if (this.magick < this.maxMagick) {
          this.magick = Math.min(this.maxMagick, this.magick + dt * regenRate);
        }

        if (this.iFrames > 0) this.iFrames -= dt;
        if (this.slowTimer > 0) this.slowTimer -= dt;
        if (this.attackTimer > 0) this.attackTimer -= dt;
        if (this.specialCooldown > 0) this.specialCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (gameState.battleRageTimer > 0) gameState.battleRageTimer -= dt;

        // Combo Reset Window: reset to Strike 1 if idle for > 0.75s
        if (this.comboResetTimer > 0) {
          this.comboResetTimer -= dt;
          if (this.comboResetTimer <= 0) {
            this.attackCombo = 0;
          }
        }

        // Passive: Aphrodite's Loving Embrace (heal near enemies up to 20/chamber)
        if (hasBoon('aphrodite_embrace') && this.hp < this.maxHp && this.roomHealing < 20) {
          const nearEnemy = gameState.enemies.some(e => Math.hypot(e.x - this.x, e.y - this.y) < 220);
          if (nearEnemy) {
            const healing = Math.min(dt * 2, 20 - this.roomHealing, this.maxHp - this.hp);
            this.roomHealing += healing;
            this.hp += healing;
            updateHUD();
          }
        }

        if (!this.volcanicReady) {
          this.volcanicTimer += dt;
          if (this.volcanicTimer >= 4.0) {
            this.volcanicReady = true;
            this.volcanicTimer = 0;
          }
        }

        const worldMouseX = mouse.x + gameState.camera.x - canvas.width / 2;
        const worldMouseY = mouse.y + gameState.camera.y - canvas.height / 2;
        this.angle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        if (this.isDashing) {
          this.dashTimer -= dt;
          this.moveWithCollision(this.dashVx * dt, this.dashVy * dt);
          if (Math.random() < 0.8) {
            gameState.particles.push(new Particle(this.x + (Math.random()-0.5)*20, this.y + (Math.random()-0.5)*20, 0, 0, '#2ae6b4', 18, 0.3, 'ghost'));
          }
          if (this.dashTimer <= 0) {
            this.isDashing = false;
          }
        } else {
          let moveX = 0;
          let moveY = 0;
          if (keys['w'] || keys['arrowup']) moveY -= 1;
          if (keys['s'] || keys['arrowdown']) moveY += 1;
          if (keys['a'] || keys['arrowleft']) moveX -= 1;
          if (keys['d'] || keys['arrowright']) moveX += 1;

          const len = Math.hypot(moveX, moveY);
          if (len > 0) {
            moveX /= len;
            moveY /= len;
            let spd = this.speed * (this.slowTimer > 0 ? 0.6 : 1);
            spd *= boonMovementMultiplier();
            if (hasBoon('hermes_stride')) spd *= 1.4;
            this.moveWithCollision(moveX * spd * dt, moveY * spd * dt);
            this.animRow = 1; // Running row
            this.animTimer += dt;
            if (this.animTimer > 0.12) {
              this.animTimer = 0;
              this.animFrame = (this.animFrame + 1) % 4;
            }
          } else {
            this.animRow = 0; // Idle row
            this.animTimer = 0;
            // STABLE IDLE: Do NOT spin or cycle frames!
            if (Math.sin(this.angle) < -0.35) {
              this.animFrame = 2; // Facing back / away from camera
            } else {
              this.animFrame = 0; // Facing front / towards camera
            }
          }

          if (this.attackTimer > 0) {
            this.animRow = 2; // Attack row
            const attackProgress = Math.max(0, Math.min(1, 1 - this.attackTimer / this.attackDuration));
            this.animFrame = Math.max(0, Math.min(3, Math.floor(attackProgress * 4)));
          }
        }

        if (this.castActive) {
          this.castActive.timer -= dt;
          this.castActive.angle += dt * 1.2;

          if (hasBoon('duo_blizzard')) {
            gameState.enemies.slice().forEach(e => {
              const d = Math.hypot(e.x - this.castActive.x, e.y - this.castActive.y);
              if (d < 240) {
                const ang = Math.atan2(this.castActive.y - e.y, this.castActive.x - e.x);
                e.x += Math.cos(ang) * 75 * dt;
                e.y += Math.sin(ang) * 75 * dt;
                e.applyChill(0.5);
              }
            });
          }

          if (this.castActive.timer <= 0) {
            this.detonateCast();
          }
        }
      }

      moveWithCollision(dx, dy) {
        const newX = this.x + dx;
        const newY = this.y + dy;
        if (!checkWallCollision(newX, this.y, this.radius)) this.x = newX;
        if (!checkWallCollision(this.x, newY, this.radius)) this.y = newY;
      }

      triggerAttack() {
        const atkSpdMod = (hasBoon('hermes_haste') ? 0.4 : 1) / ((hasBoon('hermes_speed') ? 1.45 : 1) * (hasBoon('zeus_fury') ? 1.25 : 1));
        if (this.attackTimer > 0 || this.isDashing || gameState.isPaused) return;

        onAttackBoon();
        const currentCombo = this.attackCombo; // 0: Cleave, 1: Riposte, 2: Lunge, 3: Crescent Cataclysm (Finisher)
        const isFinisher = (currentCombo === 3);

        this.attackDuration = (isFinisher ? 0.32 : 0.18) * atkSpdMod;
        this.attackTimer = this.attackDuration;
        this.comboResetTimer = 0.75 * atkSpdMod;
        this.attackCombo = (this.attackCombo + 1) % 4;

        sound.playSlash();
        if (isFinisher) {
          sound.playExplosion();
          createScreenShake(16);
        }

        // 4-Strike Damage Curve (1: 35, 2: 44, 3: 58, 4: 160 Colossal Finisher)
        let baseDmg = 35;
        if (currentCombo === 1) baseDmg = 44;
        else if (currentCombo === 2) baseDmg = 58;
        else if (currentCombo === 3) baseDmg = 160;

        baseDmg *= (1 + gameState.upgrades.damage * 0.1);
        baseDmg = basicBoonDamage(baseDmg, true);
        if (gameState.battleRageTimer > 0) baseDmg *= 1.5;
        if (this.bloodFrenzyCount > 0) {
          baseDmg *= 2.0;
          this.bloodFrenzyCount--;
        }
        if (hasBoon('selene_fullmoon') && this.hexCharge >= this.hexMax) {
          baseDmg *= 1.4;
        }
        if (hasBoon('aphrodite_strike')) {
          const lvl = getBoonLevel('aphrodite_strike');
          baseDmg *= (1.6 + (lvl - 1) * 0.4);
        }

        // Hitbox & Sweep Range scaling per combo
        let attackRange = 160;
        let attackArc = Math.PI * 0.9; // 162 degrees

        if (currentCombo === 1) {
          attackRange = 170;
          attackArc = Math.PI * 1.0;
        } else if (currentCombo === 2) {
          attackRange = 205; // Long forward lunge
          attackArc = Math.PI * 0.7; // Focused piercing cone
          this.moveWithCollision(Math.cos(this.angle) * 35, Math.sin(this.angle) * 35);
        } else if (currentCombo === 3) {
          attackRange = 250; // Colossal AoE
          attackArc = Math.PI * 2.0; // 360 Full Circle Cataclysm!
        }

        if (hasBoon('apollo_strike')) attackRange *= 1.5;
        if (hasBoon('hephaestus_smelt')) attackRange += 40;

        // Visual sweep particle with combo-specific animation frame & style
        gameState.particles.push(new AnimatedAttackSweep(this.x, this.y, this.angle, attackRange, currentCombo));

        if (isFinisher) {
          let elemShockColor = '#2ae6b4';
          if (hasBoon('zeus_strike')) elemShockColor = '#38bdf8';
          else if (hasBoon('hestia_strike')) elemShockColor = '#ea580c';
          else if (hasBoon('poseidon_strike')) elemShockColor = '#0284c7';
          else if (hasBoon('apollo_strike')) elemShockColor = '#facc15';
          else if (hasBoon('demeter_strike')) elemShockColor = '#7dd3fc';
          else if (hasBoon('ares_strike')) elemShockColor = '#dc2626';
          else if (hasBoon('aphrodite_strike')) elemShockColor = '#ec4899';
          else if (hasBoon('hephaestus_strike')) elemShockColor = '#f97316';
          gameState.particles.push(new Shockwave(this.x, this.y, attackRange * 1.1, elemShockColor));
        }

        gameState.enemies.slice().forEach(enemy => {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= attackRange + enemy.radius) {
            const angleToEnemy = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angleToEnemy - this.angle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            if (isFinisher || angleDiff <= attackArc / 2) {
              let finalDmg = baseDmg;
              if (hasBoon('hephaestus_temper') && (enemy.isBoss || enemy.isMiniBoss || enemy.behavior === 'shield_spearman')) finalDmg *= 1.45;
              // Cast vulnerability is applied centrally to every damage source.
              if (enemy.scorchStacks > 0 && enemy.chillStacks > 0 && hasBoon('duo_freezing_inferno')) finalDmg *= 2.5;

              enemy.takeDamage(finalDmg, 'player');
              sound.playHit();
              gainHexCharge(12 * (isFinisher ? 2.0 : 1.0));
              updateHUD();

              gameState.particles.push(new HitSpark(enemy.x, enemy.y, '#2ae6b4'));

              const procMultiplier = isFinisher ? 1.8 : 1.0;

              if (hasBoon('hephaestus_strike') && (this.volcanicReady || isFinisher)) {
                if (this.volcanicReady) this.volcanicReady = false;
                const vLvl = getBoonLevel('hephaestus_strike');
                const vDmg = 180 * (1 + (vLvl - 1) * 0.4) * (isFinisher ? 1.5 : 1.0);
                enemy.takeDamage(vDmg, 'volcanic');
                sound.playExplosion();
                createScreenShake(14);
                gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 160));
                if (hasBoon('duo_volcanic_flash')) {
                  procChainLightning(enemy, 65);
                }
              }

              if (hasBoon('ares_strike')) {
                const aLvl = getBoonLevel('ares_strike');
                enemy.applyDoom(90 * (1 + (aLvl - 1) * 0.4) * procMultiplier);
              }

              if (hasBoon('demeter_strike')) {
                enemy.applyChill(isFinisher ? 5.0 : 3.5);
              }

              if (hasBoon('zeus_strike')) {
                const zLvl = getBoonLevel('zeus_strike');
                procChainLightning(enemy, 45 * (1 + (zLvl - 1) * 0.4) * procMultiplier);
              }

              if (hasBoon('hestia_strike')) {
                const hLvl = getBoonLevel('hestia_strike');
                enemy.applyScorch(60 * (1 + (hLvl - 1) * 0.4) * procMultiplier);
                gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, isFinisher ? 110 : 70));
              }

              if (hasBoon('poseidon_strike')) {
                const knockDist = isFinisher ? 160 : 90;
                const targetX = enemy.x + Math.cos(this.angle) * knockDist;
                const targetY = enemy.y + Math.sin(this.angle) * knockDist;
                gameState.particles.push(new AnimatedWaterWave(enemy.x, enemy.y, this.angle, isFinisher ? 140 : 90));

                if (hasBoon('duo_sea_storm')) {
                  procChainLightning(enemy, 60 * procMultiplier);
                }

                if (checkWallCollision(targetX, targetY, enemy.radius)) {
                  if (hasBoon('poseidon_crush')) enemy.timeSlowTimer = 1;
                  const slamDmg = (hasBoon('poseidon_crush') ? 144 : 80) * (isFinisher ? 1.6 : 1.0);
                  enemy.takeDamage(slamDmg, 'slam');
                  sound.playExplosion();
                  createScreenShake(10);
                } else {
                  enemy.x = targetX;
                  enemy.y = targetY;
                }
              }
            }
          }
        });
      }

      triggerSpecial() {
        const atkSpdMod = 1 / ((hasBoon('hermes_speed') ? 1.45 : 1) * (hasBoon('zeus_fury') ? 1.25 : 1));
        if (this.specialCooldown > 0 || gameState.isPaused) return;
        this.specialCooldown = 0.48 * atkSpdMod;
        onSpecialBoon();
        sound.playSlash();

        const spd = 580;
        let specDmg = basicBoonDamage(36 * (1 + gameState.upgrades.damage * 0.1), false);
        if (gameState.battleRageTimer > 0) specDmg *= 1.5;
        if (hasBoon('selene_fullmoon') && this.hexCharge >= this.hexMax) specDmg *= 1.4;
        if (hasBoon('aphrodite_special')) {
          const lvl = getBoonLevel('aphrodite_special');
          specDmg *= (1.6 + (lvl - 1) * 0.4);
        }

        const angles = hasBoon('selene_crescent') ? [this.angle - 0.16, this.angle + 0.16] : [this.angle];
        angles.forEach(ang => {
          gameState.projectiles.push(new Projectile(
            this.x + Math.cos(ang) * 28,
            this.y + Math.sin(ang) * 28,
            Math.cos(ang) * spd,
            Math.sin(ang) * spd,
            specDmg,
            'moon_sickle',
            this
          ));
        });
      }

      triggerCast() {
        if (gameState.isPaused) return;
        const cost = 15;
        if (this.magick < cost && !this.castActive) return;

        if (!this.castActive) {
          this.magick -= cost;
          updateHUD();
          sound.playCast();
          const targetX = mouse.x + gameState.camera.x - canvas.width / 2;
          const targetY = mouse.y + gameState.camera.y - canvas.height / 2;
          const radius = (hasBoon('apollo_ring') ? 140 : 100) * (hasBoon('demeter_blizzard') ? 1.4 : 1);
          boonState().castTick = 0;
          this.castActive = {
            x: targetX,
            y: targetY,
            radius: radius,
            baseRadius: radius,
            timer: 2.5,
            angle: 0
          };
        } else {
          this.detonateCast();
        }
      }

      detonateCast() {
        if (!this.castActive) return;
        sound.playExplosion();
        createScreenShake(6);
        const radius = this.castActive.radius;
        // NERFED CAST DAMAGE: Base 25 damage (tactical snare rather than room nuke)
        let dmg = 25 * (1 + gameState.upgrades.damage * 0.1);

        gameState.enemies.slice().forEach(enemy => {
          const dist = Math.hypot(enemy.x - this.castActive.x, enemy.y - this.castActive.y);
          if (dist <= radius + enemy.radius) {
            enemy.takeDamage(dmg, 'cast');
            if (hasBoon('hestia_ring')) {
              enemy.applyScorch(30 * boonPower('hestia_ring'));
              gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 60));
            }
            if (hasBoon('zeus_ring')) {
              procChainLightning(enemy, 22 * boonPower('zeus_ring'));
            }
            if (hasBoon('hephaestus_ring')) {
              enemy.takeDamage(45, 'volcanic');
              gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 90));
            }
            if (hasBoon('ares_ring')) {
              enemy.takeDamage(50, 'doom');
              gameState.particles.push(new Shockwave(enemy.x, enemy.y, 80, '#dc2626'));
            }
            if (hasBoon('poseidon_ring')) {
              const ang = Math.atan2(enemy.y - this.castActive.y, enemy.x - this.castActive.x);
              const landing = safeArenaPosition(enemy.x + Math.cos(ang) * 70, enemy.y + Math.sin(ang) * 70, enemy.radius);
              enemy.x = landing.x;
              enemy.y = landing.y;
              gameState.particles.push(new AnimatedWaterWave(enemy.x, enemy.y, ang, 70));
            }
            if (hasBoon('demeter_ring')) {
              enemy.applyChill(3.0);
            }
          }
        });

        gameState.particles.push(new AnimatedFireExplosion(this.castActive.x, this.castActive.y, radius * 1.1));
        this.castActive = null;
      }

      triggerDash() {
        if (this.dashCooldown > 0 || this.isDashing || gameState.isPaused) return;
        this.dashCooldown = 0.4;
        this.dashTimer = 0.18;
        this.isDashing = true;
        this.iFrames = 0.25;
        sound.playDash();

        let moveX = 0;
        let moveY = 0;
        if (keys['w'] || keys['arrowup']) moveY -= 1;
        if (keys['s'] || keys['arrowdown']) moveY += 1;
        if (keys['a'] || keys['arrowleft']) moveX -= 1;
        if (keys['d'] || keys['arrowright']) moveX += 1;

        if (moveX === 0 && moveY === 0) {
          moveX = Math.cos(this.angle);
          moveY = Math.sin(this.angle);
        } else {
          const len = Math.hypot(moveX, moveY);
          moveX /= len;
          moveY /= len;
        }

        onDashBoon();
        const dashSpeed = 820;
        this.dashVx = moveX * dashSpeed;
        this.dashVy = moveY * dashSpeed;

        if (hasBoon('zeus_dash')) {
          sound.playLightning();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*340, Math.sin(a)*340, 30, 'spark', this));
          }
        }
        if (hasBoon('hestia_dash')) {
          gameState.particles.push(new FireTrail(this.x, this.y));
        }
        if (hasBoon('demeter_dash')) {
          gameState.particles.push(new IceShardTrap(this.x, this.y));
        }
        if (hasBoon('poseidon_dash')) {
          gameState.particles.push(new AnimatedWaterWave(this.x, this.y, Math.atan2(moveY, moveX), 90));
        }
        if (hasBoon('aphrodite_dash')) {
          gameState.particles.push(new CharmBurst(this.x, this.y));
        }
        if (hasBoon('ares_blade_dash')) {
          gameState.particles.push(new Shockwave(this.x, this.y, 70, '#dc2626'));
        }
      }

      triggerHex() {
        if (this.hexCharge < this.hexMax || gameState.isPaused) return;
        this.hexCharge = 0;
        onHexBoon();
        updateHUD();
        sound.playExplosion();
        createScreenShake(15);

        const radiusBoost = hasBoon('duo_sunlit_moon') ? 2.0 : 1.0;

        if (hasBoon('selene_hex_ray')) {
          const rayLength = 750 * radiusBoost;
          for (let i = 0; i < 18; i++) {
            scheduleGameAction(i * 0.028, () => {
              gameState.enemies.slice().forEach(e => {
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < rayLength) {
                  const ang = Math.atan2(e.y - this.y, e.x - this.x);
                  if (Math.abs(Math.atan2(Math.sin(ang - this.angle), Math.cos(ang - this.angle))) < 0.38) {
                    e.takeDamage(550 / 18 * boonPower('selene_hex_ray'), 'hex');
                  }
                }
              });
            });
          }
          gameState.particles.push(new LunarRayEffect(this.x, this.y, this.angle, rayLength));
        } else if (hasBoon('selene_hex_slow')) {
          gameState.enemies.slice().forEach(e => e.timeSlowTimer = 4.5);
          gameState.particles.push(new Shockwave(this.x, this.y, 600 * radiusBoost, '#c084fc'));
        } else {
          const targetX = mouse.x + gameState.camera.x - canvas.width / 2;
          const targetY = mouse.y + gameState.camera.y - canvas.height / 2;
          const meteorPower = hasBoon('selene_hex_meteor') ? 1.6 * boonPower('selene_hex_meteor') : 1;
          scheduleGameAction(0.55, () => {
            sound.playExplosion();
            createScreenShake(20);
            gameState.enemies.slice().forEach(e => {
              if (Math.hypot(e.x - targetX, e.y - targetY) < 220 * radiusBoost) {
                e.takeDamage(750 * meteorPower, 'hex');
              }
            });
            gameState.particles.push(new AnimatedFireExplosion(targetX, targetY, 220 * radiusBoost));
          });
        }
      }

      takeDamage(amount, attacker = null) {
        if (this.iFrames > 0 || gameState.isPaused || gameState.enemiesCleared || this.hp <= 0) return;

        const castEvasion = hasBoon('apollo_sunfire') && inPlayerCast(this.x, this.y) && Math.random() < 0.25;
        if (castEvasion || (hasBoon('hermes_dodge') && Math.random() < 0.3)) {
          gameState.particles.push(new FloatingText(this.x, this.y - 28, 'DODGED!', '#fb923c'));
          sound.playDash();
          if (hasBoon('hermes_reflex')) {
            gameState.enemies.slice().forEach(e => {
              if (Math.hypot(e.x - this.x, e.y - this.y) < 180) {
                e.takeDamage(80, 'electric');
              }
            });
            gameState.particles.push(new Shockwave(this.x, this.y, 180, '#facc15'));
          }
          return;
        }

        let finalDmg = amount;
        if (attacker?.isWeak) finalDmg *= 0.65;
        if (hasBoon('aphrodite_beauty') && (attacker?.isBoss || attacker?.isMiniBoss)) finalDmg *= 0.75;
        if (hasBoon('hephaestus_armor')) finalDmg *= 0.75;
        if (hasBoon('hestia_ash') && (inPlayerCast(this.x, this.y) || gameState.particles.some(p => p instanceof FireTrail && Math.hypot(p.x-this.x,p.y-this.y)<70))) finalDmg *= 0.75;
        finalDmg = Math.round(finalDmg);

        // Hephaestus Iron Aegis Barrier
        if (this.barrierHp > 0) {
          const absorbed = Math.min(this.barrierHp, finalDmg);
          this.barrierHp -= absorbed;
          finalDmg -= absorbed;
          gameState.particles.push(new FloatingText(this.x, this.y - 32, `BARRIER ABSORBED ${absorbed}`, '#f97316'));
          if (finalDmg <= 0) { this.iFrames = 0.35; updateHUD(); return; }
        }

        boonState().carnage = 0;
        gameState.roomDamageTaken += finalDmg;
        this.hp = Math.max(0, this.hp - finalDmg);
        const lethalHit = this.hp <= 0;
        this.iFrames = 0.6;
        sound.playHit();
        createScreenShake(8);
        updateHUD();

        if (hasBoon('ares_blood')) {
          this.bloodFrenzyCount = 2;
          gameState.particles.push(new FloatingText(this.x, this.y - 40, 'BLOOD FRENZY! (2X ATK)', '#dc2626'));
        }

        if (hasBoon('zeus_bolt')) {
          gameState.enemies.slice().forEach(e => {
            if (Math.hypot(e.x - this.x, e.y - this.y) < 260) {
              procChainLightning(e, 120);
            }
          });
        }

        if (hasBoon('demeter_frostbite')) {
          gameState.enemies.slice().forEach(e => {
            if (Math.hypot(e.x - this.x, e.y - this.y) < 160 && e.chillStacks > 0) {
              e.takeDamage(60, 'frost');
              e.timeSlowTimer = 1.5;
            }
          });
        }

        gameState.particles.push(new FloatingText(this.x, this.y - 24, `-${finalDmg}`, '#ef4444'));

        if (lethalHit) {
          // Retaliation may clear the room and award healing. It cannot undo this death.
          this.hp = 0;
          if (this.defianceCount > 0) {
            this.defianceCount--;
            this.hp = Math.floor(this.maxHp * 0.5);
            this.iFrames = 2.0;
            sound.playBoonChime();
            gameState.particles.push(new Shockwave(this.x, this.y, 260, '#f59e0b'));
            gameState.particles.push(new FloatingText(this.x, this.y - 40, 'DEATH DEFIED!', '#f59e0b'));
            updateHUD();
          } else {
            handleGameOver(false);
          }
        }
      }

      draw(ctx) {
        drawBoonEffects(ctx);
        ctx.save();
        ctx.translate(this.x, this.y);

        // Cast Circle Draw
        if (this.castActive) {
          ctx.save();
          const cleanFx = loadedImages['clean_fx'];
          if (cleanFx && cleanFx.complete && cleanFx.naturalWidth > 0) {
            ctx.save();
            ctx.translate(this.castActive.x - this.x, this.castActive.y - this.y);
            // Rotation advances with the simulation and stays still while paused.
            ctx.rotate(this.castActive.angle);
            const sw = cleanFx.width / 2;
            const sh = cleanFx.height;
            const rad = this.castActive.radius;
            ctx.drawImage(cleanFx, 0, 0, sw, sh, -rad, -rad, rad * 2, rad * 2);
            ctx.restore();
          } else {
            ctx.beginPath();
            ctx.arc(this.castActive.x - this.x, this.castActive.y - this.y, this.castActive.radius, 0, Math.PI * 2);
            ctx.strokeStyle = '#b356ff';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
          ctx.restore();
        }

        // Character glowing aura
        ctx.beginPath();
        ctx.arc(0, 0, 32, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(42, 230, 180, 0.25)';
        ctx.fill();

        // Shadow
        ctx.beginPath();
        ctx.ellipse(0, 22, 24, 12, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
        ctx.fill();

        // Sprite
        const heroImg = loadedImages['hero'];
        if (heroImg && heroImg.complete && heroImg.naturalWidth > 0) {
          const cellW = heroImg.width / 4;
          const cellH = heroImg.height / 4;
          const sx = this.animFrame * cellW;
          const sy = this.animRow * cellH;

          const facingLeft = Math.cos(this.angle) < 0;
          if (facingLeft) ctx.scale(-1, 1);

          // Sprite-sheet frames include an eight-pixel decorative grid border.
          ctx.drawImage(heroImg, sx + 8, sy + 8, cellW - 16, cellH - 16, -52, -66, 105, 105);
        } else {
          ctx.fillStyle = '#5eead4';
          ctx.beginPath(); ctx.moveTo(0, -32); ctx.lineTo(24, 24); ctx.lineTo(0, 14); ctx.lineTo(-24, 24); ctx.closePath(); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -15, 10, 0, Math.PI * 2); ctx.fill();
        }

        ctx.restore();
      }
    }

    const player = new Player();

    // --- ENEMY CLASS ---
