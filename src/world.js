    const arena = {
      width: 1400,
      height: 900,
      pillars: [
        { x: -380, y: -220, radius: 42 },
        { x: 380, y: -220, radius: 42 },
        { x: -380, y: 220, radius: 42 },
        { x: 380, y: 220, radius: 42 }
      ]
    };

    function checkWallCollision(x, y, radius) {
      const halfW = arena.width / 2;
      const halfH = arena.height / 2;
      if (x - radius < -halfW || x + radius > halfW || y - radius < -halfH || y + radius > halfH) {
        return true;
      }
      for (const pillar of arena.pillars) {
        if (Math.hypot(x - pillar.x, y - pillar.y) < radius + pillar.radius) {
          return true;
        }
      }
      return false;
    }

    let screenShake = 0;
    function createScreenShake(intensity) {
      screenShake = Math.max(screenShake, Math.min(18, intensity));
    }

    function shuffled(items) {
      const result = [...items];
      for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
      }
      return result;
    }

    function safeArenaPosition(x, y, radius) {
      const limitX = arena.width / 2 - radius - 2;
      const limitY = arena.height / 2 - radius - 2;
      const result = { x: Math.max(-limitX, Math.min(limitX, x)), y: Math.max(-limitY, Math.min(limitY, y)) };
      for (const pillar of arena.pillars) {
        const dx = result.x - pillar.x, dy = result.y - pillar.y;
        const distance = Math.hypot(dx, dy), minimum = pillar.radius + radius + 2;
        if (distance < minimum) {
          result.x = pillar.x + (distance ? dx / distance : 1) * minimum;
          result.y = pillar.y + (distance ? dy / distance : 0) * minimum;
        }
      }
      return result;
    }

    function hasBoon(boonId) {
      return gameState.equippedBoons.some(b => b.id === boonId);
    }

    function getBoonLevel(boonId) {
      const b = gameState.equippedBoons.find(b => b.id === boonId);
      return b && b.level ? b.level : 1;
    }

    function procChainLightning(initialEnemy, damage) {
      sound.playLightning();
      let current = initialEnemy;
      const hitList = [current];
      if (initialEnemy.hp > 0) initialEnemy.takeDamage(damage, 'lightning');

      gameState.particles.push(new AnimatedLightningStrike(initialEnemy.x, initialEnemy.y, 140));

      const jumps = hasBoon('zeus_cloud') ? 7 : 4;
      for (let step = 0; step < jumps; step++) {
        let closest = null;
        let minDist = hasBoon('zeus_cloud') ? 364 : 260;
        gameState.enemies.forEach(e => {
          if (e.hp > 0 && !hitList.includes(e)) {
            const d = Math.hypot(e.x - current.x, e.y - current.y);
            if (d < minDist) {
              minDist = d;
              closest = e;
            }
          }
        });

        if (closest) {
          closest.takeDamage(damage, 'lightning');
          gameState.particles.push(new AnimatedLightningStrike(closest.x, closest.y, 120));
          hitList.push(closest);
          current = closest;
        } else {
          break;
        }
      }
    }

    // --- INFINITE CHAMBERS PROGRESSION WITH MULTIPLE GATES & DIVERSE REWARDS ---
