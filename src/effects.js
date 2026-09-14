    class Projectile {
      constructor(x, y, vx, vy, damage, type, owner) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.type = type;
        this.owner = owner;
        this.radius = type === 'moon_sickle' ? 22 : (type === 'magma_ball' ? 18 : 12);
        this.lifetime = type === 'moon_sickle' ? 1.3 : 3.5;
        this.angle = 0;
        this.hitEnemies = new Set();
      }

      update(dt) {
        if (this.destroyed) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;
        if (this.lifetime <= 0) { this.destroy(); return; }
        this.angle += dt * 18;

        if (this.type === 'moon_sickle') {
          if (this.lifetime < 0.7) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist < 36) {
              // Player cleanly catches the sickle — destroy immediately!
              this.destroy();
              return;
            }
            if (dist > 1) {
              this.vx = (dx / dist) * 680;
              this.vy = (dy / dist) * 680;
            }
          }
        }

        if (this.type === 'witch_orb') {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.hypot(dx, dy);
          if (dist > 10) {
            this.vx += (dx / dist) * 120 * dt;
            this.vy += (dy / dist) * 120 * dt;
          }
        }

        if (checkWallCollision(this.x, this.y, this.radius)) {
          this.destroy();
          return;
        }

        if (this.owner === player) {
          gameState.enemies.slice().forEach(enemy => {
            if (this.destroyed || enemy.hp <= 0) return;
            if (!this.hitEnemies.has(enemy) && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.radius + enemy.radius) {
              this.hitEnemies.add(enemy);
              let finalDmg = this.damage;
              if (enemy.isWeak && hasBoon('aphrodite_ring')) finalDmg *= 1.5;
              if (enemy.scorchStacks > 0 && enemy.chillStacks > 0 && hasBoon('duo_freezing_inferno')) finalDmg *= 2.5;

              enemy.takeDamage(finalDmg, 'projectile');
              sound.playHit();
              gameState.particles.push(new HitSpark(enemy.x, enemy.y, '#c084fc'));

              if (this.type === 'moon_sickle') {
                onSpecialBoonHit(enemy, this);
                if (hasBoon('zeus_special')) {
                  const zLvl = getBoonLevel('zeus_special');
                  procChainLightning(enemy, 55 * (1 + (zLvl - 1) * 0.4));
                }
                if (hasBoon('hestia_special')) {
                  const hLvl = getBoonLevel('hestia_special');
                  enemy.applyScorch(75 * (1 + (hLvl - 1) * 0.4));
                  gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 70));
                }
                if (hasBoon('ares_special')) {
                  const aLvl = getBoonLevel('ares_special');
                  enemy.applyDoom(120 * (1 + (aLvl - 1) * 0.4));
                }
                if (hasBoon('demeter_special')) {
                  enemy.applyChill(4.0);
                  enemy.timeSlowTimer = 1.5;
                  gameState.particles.push(new Shockwave(enemy.x, enemy.y, 80, '#38bdf8'));
                }
                if (hasBoon('poseidon_special')) {
                  const pLvl = getBoonLevel('poseidon_special');
                  const waveAng = Math.atan2(this.vy, this.vx);
                  const landing = safeArenaPosition(enemy.x + Math.cos(waveAng) * 90, enemy.y + Math.sin(waveAng) * 90, enemy.radius);
                  enemy.x = landing.x;
                  enemy.y = landing.y;
                  gameState.particles.push(new AnimatedWaterWave(enemy.x, enemy.y, waveAng, 100));
                  enemy.takeDamage(70 * (1 + (pLvl - 1) * 0.4), 'slam');
                }
                if (hasBoon('apollo_special')) {
                  const apLvl = getBoonLevel('apollo_special');
                  gameState.particles.push(new Shockwave(enemy.x, enemy.y, 140, '#fde047'));
                  gameState.enemies.slice().forEach(e => {
                    if (Math.hypot(e.x - enemy.x, e.y - enemy.y) < 140) {
                      e.takeDamage(85 * (1 + (apLvl - 1) * 0.4), 'sunburst');
                    }
                  });
                }
                if (hasBoon('hephaestus_special')) {
                  const hpLvl = getBoonLevel('hephaestus_special');
                  enemy.takeDamage(90 * (1 + (hpLvl - 1) * 0.4), 'volcanic');
                  sound.playExplosion();
                  createScreenShake(8);
                  gameState.particles.push(new Shockwave(enemy.x, enemy.y, 110, '#ea580c'));
                }
              }

              if (this.type !== 'moon_sickle' && !this.piercing) this.destroy();
            }
          });
        } else {
          if (Math.hypot(player.x - this.x, player.y - this.y) <= this.radius + player.radius) {
            player.takeDamage(this.damage, this.owner);
            this.destroy();
          }
        }
      }

      destroy() {
        if (this.destroyed) return;
        this.destroyed = true;
        const idx = gameState.projectiles.indexOf(this);
        if (idx !== -1) gameState.projectiles.splice(idx, 1);
      }

      draw(ctx) {
        if (this.destroyed) return;
        const friendly = this.owner === player;
        const colors = { poison_dart: '#b7f584', frost_shard: '#a5eaff', magma_ball: '#ffb676',
          bouncing_acid: '#c1f589', doom_skull: '#e4bbff', clockwork_bomb: '#ffe092',
          charm_heart: '#ffa9cf', whirling_blade: '#e5dcce', witch_orb: '#e8b3f7' };
        const color = friendly ? '#bcfff0' : (colors[this.type] || '#ffb3a5');
        const speed = Math.hypot(this.vx, this.vy), direction = Math.atan2(this.vy, this.vx);
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(direction);
        ctx.lineCap = 'round';
        ctx.strokeStyle = friendly ? '#68dccb44' : '#ffb9a43b'; ctx.lineWidth = this.radius * 1.1;
        ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-Math.min(36, speed * 0.055), 0); ctx.stroke();
        ctx.strokeStyle = '#080e21'; ctx.lineWidth = 4;
        if (this.type === 'moon_sickle') {
          ctx.rotate(this.angle - direction);
          ctx.fillStyle = '#83dec9'; ctx.beginPath();
          ctx.arc(0, 0, this.radius, -Math.PI * 0.65, Math.PI * 0.65);
          ctx.bezierCurveTo(-12, 10, -12, -10, Math.cos(-Math.PI * 0.65) * this.radius, Math.sin(-Math.PI * 0.65) * this.radius);
          ctx.closePath(); ctx.stroke(); ctx.fill();
          ctx.strokeStyle = '#e1fff7'; ctx.lineWidth = 2; ctx.beginPath();
          ctx.arc(0, 0, this.radius, -Math.PI * 0.65, Math.PI * 0.65); ctx.stroke();
        } else if (this.type === 'poison_dart' || this.type === 'frost_shard' || this.type === 'whirling_blade') {
          ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(this.radius, 0);
          ctx.lineTo(-this.radius, -this.radius * 0.58); ctx.lineTo(-this.radius * 0.4, 0);
          ctx.lineTo(-this.radius, this.radius * 0.58); ctx.closePath(); ctx.stroke(); ctx.fill();
          ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-this.radius * 0.3, 0); ctx.lineTo(this.radius * 0.75, 0); ctx.stroke();
        } else {
          ctx.fillStyle = '#421b2f'; ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.stroke(); ctx.fill();
          ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.stroke();
          ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.62, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#fff6e1'; ctx.beginPath(); ctx.arc(2, -2, this.radius * 0.24, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }

    // --- ANIMATED ATTACK SWEEP & ELEMENTAL EFFECTS (Hitbox & Visual Aligned 1:1) ---
    class AnimatedAttackSweep {
      constructor(x, y, angle, range, combo = 0) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.range = range;
        this.combo = combo;
        this.life = combo === 3 ? 0.32 : 0.20;
        this.maxLife = this.life;
        this.frame = 0;
      }
      update(dt) {
        this.life -= dt;
        const progress = 1 - (this.life / this.maxLife);
        this.frame = Math.min(3, Math.floor(progress * 4));
      }
      draw(ctx) {
        const progress = Math.max(0, Math.min(1, 1 - this.life / this.maxLife));
        const colors = [['zeus_strike', '#8ee5ff'], ['hestia_strike', '#ffb17d'],
          ['poseidon_strike', '#6ccfeb'], ['apollo_strike', '#ffe49a'], ['demeter_strike', '#c4f4ff'],
          ['ares_strike', '#ff8e95'], ['aphrodite_strike', '#ffacd9'], ['hephaestus_strike', '#ffc58d']];
        const color = (colors.find(([boon]) => hasBoon(boon)) || ['', '#98ffe2'])[1];
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.globalAlpha = Math.max(0, 1 - progress * 0.85); ctx.lineCap = 'round';
        if (this.combo === 2) {
          const reach = this.range * (0.4 + progress * 0.6);
          ctx.fillStyle = color + '44'; ctx.beginPath(); ctx.moveTo(0, -14);
          ctx.lineTo(reach, 0); ctx.lineTo(0, 14); ctx.closePath(); ctx.fill();
          ctx.strokeStyle = color; ctx.lineWidth = 5 * (1 - progress) + 1;
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(reach, 0); ctx.stroke();
          ctx.strokeStyle = '#f0fff9'; ctx.lineWidth = 1.5; ctx.stroke();
        } else {
          const fullCircle = this.combo === 3, reach = this.range * (fullCircle ? 0.5 + progress * 0.5 : 1);
          const span = fullCircle ? Math.PI * 2 : Math.PI * 0.92;
          const start = fullCircle ? -Math.PI / 2 : -span / 2;
          if (this.combo === 1) ctx.scale(1, -1);
          ctx.fillStyle = color + '19'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, reach, start, start + span); ctx.closePath(); ctx.fill();
          for (let i = 0; i < 3; i++) {
            ctx.strokeStyle = i === 0 ? '#eefff8' : color;
            ctx.globalAlpha = (1 - progress * 0.85) * (1 - i * 0.3);
            ctx.lineWidth = i === 0 ? 2 : 4;
            ctx.beginPath(); ctx.arc(0, 0, reach - i * 9, start + progress * span * 0.5, start + span); ctx.stroke();
          }
          ctx.fillStyle = '#f0fff9'; ctx.globalAlpha = 1 - progress;
          const tip = start + span;
          ctx.beginPath(); ctx.arc(Math.cos(tip) * reach, Math.sin(tip) * reach, 3, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
      }
    }

    class HitSpark {
      constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 0.15;
        this.maxLife = 0.15;
      }
      update(dt) {
        this.life -= dt;
      }
      draw(ctx) {
        const fade = Math.max(0, this.life / this.maxLife), reach = 10 + (1 - fade) * 19;
        ctx.save(); ctx.translate(this.x, this.y); ctx.globalAlpha = fade;
        ctx.strokeStyle = this.color; ctx.lineWidth = 2; ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = i * Math.PI / 3;
          ctx.moveTo(Math.cos(angle) * reach * 0.45, Math.sin(angle) * reach * 0.45);
          ctx.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
        }
        ctx.stroke(); ctx.fillStyle = '#fff4dc'; ctx.beginPath();
        ctx.moveTo(0, -8 * fade); ctx.lineTo(3 * fade, -3 * fade); ctx.lineTo(8 * fade, 0);
        ctx.lineTo(3 * fade, 3 * fade); ctx.lineTo(0, 8 * fade); ctx.lineTo(-3 * fade, 3 * fade);
        ctx.lineTo(-8 * fade, 0); ctx.lineTo(-3 * fade, -3 * fade); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }

    class AnimatedLightningStrike {
      constructor(x, y, size = 120) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.life = 0.24;
        this.maxLife = 0.24;
        this.frame = 0;
      }
      update(dt) {
        this.life -= dt;
        const progress = 1 - (this.life / this.maxLife);
        this.frame = Math.min(3, Math.floor(progress * 4));
      }
      draw(ctx) {
        const fade = Math.max(0, this.life / this.maxLife);
        ctx.save(); ctx.translate(this.x, this.y); ctx.globalAlpha = fade; ctx.lineJoin = 'miter';
        ctx.beginPath(); ctx.moveTo(-this.size * 0.08, -this.size);
        ctx.lineTo(this.size * 0.08, -this.size * 0.62); ctx.lineTo(-this.size * 0.12, -this.size * 0.57);
        ctx.lineTo(this.size * 0.07, -this.size * 0.27); ctx.lineTo(-this.size * 0.06, -this.size * 0.29); ctx.lineTo(0, 0);
        ctx.strokeStyle = '#7edbff55'; ctx.lineWidth = 12; ctx.stroke();
        ctx.strokeStyle = '#a5eaff'; ctx.lineWidth = 4; ctx.stroke();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.strokeStyle = '#a5eaff'; ctx.lineWidth = 2; ctx.beginPath();
        ctx.ellipse(0, 0, 8 + (1 - fade) * this.size * 0.28, 5 + (1 - fade) * this.size * 0.12, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
    }

    class AnimatedFireExplosion {
      constructor(x, y, size = 100) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.life = 0.32;
        this.maxLife = 0.32;
        this.frame = 0;
      }
      update(dt) {
        this.life -= dt;
        const progress = 1 - (this.life / this.maxLife);
        this.frame = Math.min(3, Math.floor(progress * 4));
      }
      draw(ctx) {
        const fade = Math.max(0, this.life / this.maxLife), radius = this.size * (0.12 + (1 - fade) * 0.4);
        ctx.save(); ctx.translate(this.x, this.y); ctx.globalAlpha = fade;
        ctx.fillStyle = '#ffb97520'; ctx.strokeStyle = '#ffae73'; ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i < 24; i++) {
          const angle = i * Math.PI / 12, r = radius * (i % 2 === 0 ? 1 : 0.66);
          if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
          else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
        }
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#fff0c2'; ctx.lineWidth = 3 * fade + 1; ctx.beginPath(); ctx.arc(0, 0, radius * 0.65, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
    }

    class AnimatedWaterWave {
      constructor(x, y, angle, size = 110) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.size = size;
        this.life = 0.28;
        this.maxLife = 0.28;
        this.frame = 0;
      }
      update(dt) {
        this.life -= dt;
        const progress = 1 - (this.life / this.maxLife);
        this.frame = Math.min(3, Math.floor(progress * 4));
      }
      draw(ctx) {
        const fade = Math.max(0, this.life / this.maxLife), offset = (1 - fade) * this.size * 0.4;
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle); ctx.lineCap = 'round';
        for (let i = 0; i < 3; i++) {
          ctx.globalAlpha = fade * (1 - i * 0.23); ctx.strokeStyle = i === 0 ? '#c8fbff' : '#71cde9'; ctx.lineWidth = 3 - i * 0.7;
          ctx.beginPath(); ctx.arc(offset - i * 13, 0, this.size * 0.46, -Math.PI * 0.43, Math.PI * 0.43); ctx.stroke();
        }
        ctx.restore();
      }
    }

    class Particle {
      constructor(x, y, vx, vy, color, size, life, type = 'normal') {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.life = life;
        this.maxLife = life;
        this.type = type;
      }
      update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
      }
      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class Shockwave {
      constructor(x, y, maxRadius, color) {
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.maxRadius = maxRadius;
        this.color = color;
        this.life = 0.4;
        this.maxLife = 0.4;
      }
      update(dt) {
        this.life -= dt;
        this.radius += (this.maxRadius / this.maxLife) * dt;
      }
      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    class LunarRayEffect {
      constructor(x, y, angle, length) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.length = length;
        this.life = 0.55;
        this.maxLife = 0.55;
      }
      update(dt) {
        this.life -= dt;
      }
      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.strokeStyle = '#c084fc';
        ctx.lineWidth = 26;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(this.length, 0);
        ctx.stroke();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 12;
        ctx.stroke();
        ctx.restore();
      }
    }

    class FireTrail {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 2.0;
      }
      update(dt) {
        this.life -= dt;
        gameState.enemies.slice().forEach(e => {
          if (Math.hypot(e.x - this.x, e.y - this.y) < 35) {
            e.takeDamage(40 * dt, 'scorch', true);
          }
        });
      }
      draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.globalAlpha = Math.min(0.8, Math.max(0, this.life));
        ctx.fillStyle = '#ff9e6740'; ctx.beginPath(); ctx.ellipse(0, 4, 28, 14, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = -1; i <= 1; i++) {
          ctx.fillStyle = i === 0 ? '#ffd49b' : '#e58261'; ctx.beginPath();
          ctx.moveTo(i * 12 - 5, 5); ctx.quadraticCurveTo(i * 12 - 11, -5, i * 12 + 2, -18 - (i === 0 ? 9 : 0));
          ctx.quadraticCurveTo(i * 12 - 1, -3, i * 12 + 6, 3); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
    }

    class IceShardTrap {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 3.0;
      }
      update(dt) {
        this.life -= dt;
        gameState.enemies.slice().forEach(e => {
          if (Math.hypot(e.x - this.x, e.y - this.y) < 30) {
            e.takeDamage(80, 'frost');
            e.applyChill(3.0);
            this.life = 0;
          }
        });
      }
      draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y); ctx.globalAlpha = Math.min(1, Math.max(0, this.life));
        ctx.fillStyle = '#83d1ed26'; ctx.strokeStyle = '#90d7edaa'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.ellipse(0, 4, 26, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
        for (let i = -1; i <= 1; i++) {
          ctx.fillStyle = i === 0 ? '#c2f3ff' : '#72b8d3'; ctx.beginPath();
          ctx.moveTo(i * 10 - 4, 6); ctx.lineTo(i * 10 + 2, -17 - (i === 0 ? 12 : 0));
          ctx.lineTo(i * 10 + 6, 3); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
    }

    class CharmBurst {
      constructor(x, y) {
        this.x = x;
        this.y = y;
        this.life = 0.5;
      }
      update(dt) {
        this.life -= dt;
        gameState.enemies.slice().forEach(e => {
          if (Math.hypot(e.x - this.x, e.y - this.y) < 90) {
            e.isWeak = true;
            e.weakTimer = 4.0;
          }
        });
      }
      draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 80, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    class FloatingText {
      constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = 0.8;
      }
      update(dt) {
        this.y -= 40 * dt;
        this.life -= dt;
      }
      draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / 0.8);
        ctx.font = 'bold 16px Cinzel';
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#071019';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
      }
    }

    // --- ARENA TILES & WALL COLLISION ---
