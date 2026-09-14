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
        const friendly=this.owner===player, direction=Math.atan2(this.vy,this.vx), reduced=gameRuntime.settings.reducedMotion;
        const speed=Math.hypot(this.vx,this.vy), trail=Math.min(48,16+speed*.04);
        attackSvgArt.draw(ctx,friendly?'comet-tail':'enemy-tail',this.x-Math.cos(direction)*trail*.48,this.y-Math.sin(direction)*trail*.48,trail,this.radius*1.3,direction,.65);
        const key=attackSvgArt.projectileTypes.includes(this.type)?this.type:'witch_orb';
        const spin=['moon_sickle','whirling_blade','clockwork_bomb','witch_orb'].includes(this.type);
        const angle=spin ? (reduced?0:this.angle*.55) : direction;
        attackSvgArt.draw(ctx,key,this.x,this.y,this.radius*2.35,this.radius*2.35,angle);
        if (this.type==='moon_sickle' && friendly && hasBoon('hestia_special')) {
          const frame=reduced?1:Math.floor(this.angle*1.5)%4;
          attackSvgArt.draw(ctx,'flame-'+frame,this.x,this.y,this.radius*1.3,this.radius*1.3,direction+Math.PI/2,.64);
        }
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
        const progress=Math.max(0,Math.min(1,1-this.life/this.maxLife));
        const theme=attackSvgArt.activeTheme(), finisher=this.combo===3;
        const grow=this.combo===2 ? .65+progress*.35 : finisher ? .5+progress*.5 : 1;
        const diameter=this.range*2/.96*grow;
        attackSvgArt.draw(ctx,'sweep-'+this.combo+'-'+theme,this.x,this.y,diameter,diameter,this.angle,1-progress*.8);
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
        const fade=Math.max(0,this.life/this.maxLife), diameter=18+(1-fade)*40;
        attackSvgArt.draw(ctx,'spark-'+attackSvgArt.themeForColor(this.color),this.x,this.y,diameter,diameter,0,fade);
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
        const fade=Math.max(0,this.life/this.maxLife), frame=gameRuntime.settings.reducedMotion?1:this.frame;
        attackSvgArt.draw(ctx,'lightning-'+frame,this.x,this.y-this.size*.44,this.size*.85,this.size*1.1,0,fade);
      }
    }

    class AnimatedFireExplosion {
      constructor(x, y, size = 100, artKind = 'fire') {
        this.artKind = artKind;
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
        const fade=Math.max(0,this.life/this.maxLife), diameter=this.size*(.42+(1-fade)*.78);
        const key=this.artKind==='cast'?'cast-burst':'fire-bloom';
        attackSvgArt.draw(ctx,key,this.x,this.y,diameter,diameter,gameRuntime.settings.reducedMotion?0:(1-fade)*.3,fade);
        if(this.artKind!=='cast') {
          const frame=gameRuntime.settings.reducedMotion?1:this.frame;
          attackSvgArt.draw(ctx,'flame-'+frame,this.x,this.y-this.size*.12,this.size*.55,this.size*.7,0,fade*.8);
        }
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
        const fade=Math.max(0,this.life/this.maxLife), offset=(1-fade)*this.size*.25;
        attackSvgArt.draw(ctx,'water-wave',this.x+Math.cos(this.angle)*offset,this.y+Math.sin(this.angle)*offset,this.size,this.size,this.angle,fade);
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
        const fade=Math.max(0,this.life/this.maxLife);
        attackSvgArt.draw(ctx,this.type==='ghost'?'comet-tail':'mote-'+attackSvgArt.themeForColor(this.color),this.x,this.y,this.size*2.4,this.size*2.4,this.type==='ghost'?player.angle:0,fade);
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
        attackSvgArt.draw(ctx,'shock-'+attackSvgArt.themeForColor(this.color),this.x,this.y,this.radius*2/.86,this.radius*2/.86,0,Math.max(0,this.life/this.maxLife));
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
        attackSvgArt.draw(ctx,'lunar-ray',this.x+Math.cos(this.angle)*this.length/2,this.y+Math.sin(this.angle)*this.length/2,this.length,64,this.angle,Math.max(0,this.life/this.maxLife));
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
        const frame=gameRuntime.settings.reducedMotion?1:Math.floor((2-this.life)*8)%4;
        attackSvgArt.draw(ctx,'flame-'+Math.max(0,frame),this.x,this.y-7,65,65,0,Math.min(.85,Math.max(0,this.life)));
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
        attackSvgArt.draw(ctx,'ice-trap',this.x,this.y-7,65,65,0,Math.min(1,Math.max(0,this.life)));
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
        attackSvgArt.draw(ctx,'charm-bloom',this.x,this.y,180,180,gameRuntime.settings.reducedMotion?0:(.5-this.life)*.35,Math.max(0,Math.min(.7,this.life*2)));
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
