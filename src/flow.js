    const INFINITE_BOSS_SEQUENCE = [
      'typhon_prime', 'nyx_primordial', 'tartarus_colossus', 'thanatos_ascended',
      'prometheus_rebound', 'medusa_queen', 'nemesis_supreme', 'charon_harvester',
      'python_ancient', 'chaos_embodied'
    ];

    function startChamber(chamberIndex, chosenReward = null) {
      gameState.chamber = chamberIndex;
      gameState.bestChamber = Math.max(gameState.bestChamber, chamberIndex);
      gameState.pendingActions = [];
      gameState.boonAreas = [];
      boonState().hymnHealing = 0;
      gameState.roomDamageTaken = 0;
      player.roomHealing = 0;
      player.castActive = null;
      player.isDashing = false;
      player.dashTimer = 0;
      player.iFrames = Math.max(player.iFrames, 1);
      player.barrierHp = hasBoon('hephaestus_shield') ? 40 : 0;
      player.magick = player.maxMagick;
      gameState.enemiesCleared = false;
      gameState.doors = [];
      gameState.projectiles = [];
      gameState.particles = [];
      player.x = 0;
      player.y = 260;
      if (typeof clampedCameraTarget === 'function') Object.assign(gameState.camera, clampedCameraTarget());

      const titleEl = document.getElementById('chamber-name');
      const subEl = document.getElementById('chamber-sub');
      const bossHud = document.getElementById('boss-hud');

      // 1. Grant pre-chosen gate reward if entering a non-combat or specialized room
      if (chosenReward) {
        if (chosenReward.type === 'heart') {
          gainHealth(25, true);
          sound.playBoonChime();
          gameState.particles.push(new FloatingText(player.x, player.y - 40, '+25 MAX HEALTH!', '#ef4444'));
        } else if (chosenReward.type === 'ash') {
          gameState.ashes += 15;
          sound.playGold();
          gameState.particles.push(new FloatingText(player.x, player.y - 40, '+15 ASHES!', '#cbd5e1'));
        }
      }

      // 2. BOSS & MINI-BOSS CHAMBERS
      if (chamberIndex === 100) {
        gameState.chamberType = 'boss';
        titleEl.innerText = 'HOUSE OF CHRONOS — FINAL BATTLE (CHAMBER 100)';
        subEl.innerText = 'Chronos — The Master of Time (20x Strength)';
        bossHud.style.display = 'flex';
        gameState.enemies = [new Enemy(0, -180, 'chronos')];
      } else if (chamberIndex > 100 && (chamberIndex - 100) % 30 === 0) {
        // 10 POST-CHRONOS TITAN BOSSES (Every 30 Chambers: 130, 160, 190, 220, 250, 280, 310, 340, 370, 400+)
        const bossIdx = Math.floor((chamberIndex - 100) / 30) - 1;
        const bossKey = INFINITE_BOSS_SEQUENCE[bossIdx % INFINITE_BOSS_SEQUENCE.length];
        const bossDef = ENEMY_TYPES[bossKey];
        gameState.chamberType = 'boss';
        titleEl.innerText = `INFINITE TARTARUS ABYSS — ${bossDef.name.toUpperCase()} (CHAMBER ${chamberIndex})`;
        subEl.innerText = `${bossDef.name} (Cataclysmic Strength)`;
        bossHud.style.display = 'flex';
        gameState.enemies = [new Enemy(0, -180, bossKey)];
      } else if (chamberIndex === 20) {
        gameState.chamberType = 'miniboss';
        titleEl.innerText = 'EREBUS GATEWAY — MINI-BOSS (CHAMBER 20)';
        subEl.innerText = 'Asterius — The Minotaur King';
        bossHud.style.display = 'flex';
        gameState.enemies = [new Enemy(0, -180, 'asterius_king')];
      } else if (chamberIndex === 40) {
        gameState.chamberType = 'miniboss';
        titleEl.innerText = 'ASPHODEL MAGMA REACH — MINI-BOSS (CHAMBER 40)';
        subEl.innerText = 'Lernaean Bone Hydra Prime';
        bossHud.style.display = 'flex';
        gameState.enemies = [new Enemy(0, -180, 'hydra_prime')];
      } else if (chamberIndex === 60) {
        gameState.chamberType = 'miniboss';
        titleEl.innerText = 'ELYSIUM MOON SANCTUM — MINI-BOSS (CHAMBER 60)';
        subEl.innerText = 'Hecate — Matron of Witchcraft';
        bossHud.style.display = 'flex';
        gameState.enemies = [new Enemy(0, -180, 'hecate_matron')];
      } else if (chamberIndex === 80) {
        gameState.chamberType = 'miniboss';
        titleEl.innerText = 'TEMPLE OF STYX — MINI-BOSS (CHAMBER 80)';
        subEl.innerText = 'Cerberus Prime — Infernal Guardian';
        bossHud.style.display = 'flex';
        gameState.enemies = [new Enemy(0, -180, 'cerberus_prime')];
      }
      // 3. CHARON'S SAFE HAVEN SHOP (Every 20 Chambers or when picked)
      else if (chamberIndex % 20 === 10 || (chosenReward && chosenReward.type === 'shop')) {
        gameState.chamberType = 'shop';
        titleEl.innerText = `CHARON’S SAFE HAVEN — CHAMBER ${chamberIndex}`;
        subEl.innerText = 'Purchase Divine Blessings, Poms & Vitality';
        gameState.enemies = [];
        gameState.enemiesCleared = true;
        bossHud.style.display = 'none';
        setupExitGates();
        openCharonShop();
      }
      // 4. STANDARD HARDCORE COMBAT ROOMS
      else {
        gameState.chamberType = 'normal';
        bossHud.style.display = 'none';

        let biomeName = 'EREBUS DEPTHS';
        if (chamberIndex > 100) biomeName = `INFINITE TARTARUS ABYSS (TIER ${Math.floor((chamberIndex - 100) / 30) + 1})`;
        else if (chamberIndex > 80) biomeName = 'HOUSE OF CHRONOS GATEWAY';
        else if (chamberIndex > 60) biomeName = 'TEMPLE OF STYX';
        else if (chamberIndex > 40) biomeName = 'ELYSIUM GLADES';
        else if (chamberIndex > 20) biomeName = 'ASPHODEL MAGMA SEAS';

        titleEl.innerText = `${biomeName} — CHAMBER ${chamberIndex}`;
        subEl.innerText = chamberIndex > 100 ? 'Infinite Abyssal Depths — survive, adapt, ascend' : chamberIndex < 5 ? 'Dash through danger • finish your four-strike combo' : 'Clear the chamber • choose your next reward';

        // Introduce readable encounters before mixing the full enemy roster.
        const openingRoster = ['shade_wretch', 'shade_bruiser', 'witch_siren', 'gorgon_viper', 'minotaur_brute', 'cerberus_hound'];
        const allStandard = Object.keys(ENEMY_TYPES).filter(k => !ENEMY_TYPES[k].isBoss && !ENEMY_TYPES[k].isMiniBoss);
        const roster = [...openingRoster, ...allStandard.filter(k => !openingRoster.includes(k))];
        const availableKeys = roster.slice(0, Math.min(roster.length, 3 + Math.floor((chamberIndex - 1) / 2)));
        const count = Math.min(24, 6 + Math.floor(chamberIndex / 3) * 2);
        const positions = [];
        for (let y = -330; y <= 330; y += 110) {
          for (let x = -550; x <= 550; x += 110) {
            if (!checkWallCollision(x, y, 50) && Math.hypot(x - player.x, y - player.y) > 260) positions.push({ x, y });
          }
        }
        const spawnPositions = shuffled(positions);
        let encounterBag = [];
        gameState.enemies = [];
        for (let i = 0; i < count && i < spawnPositions.length; i++) {
          if (!encounterBag.length) encounterBag = shuffled(availableKeys);
          const { x, y } = spawnPositions[i];
          gameState.enemies.push(new Enemy(x, y, encounterBag.pop()));
        }
      }

      savePermanentProgress();
      updateHUD();
    }

    // --- SETUP 2-3 EXIT GATES WITH DIVERSE REWARDS (Gods, Poms, Shops, Hearts) ---
    function setupExitGates() {
      gameState.doors = [];
      const nextChamber = gameState.chamber + 1;
      const isBossComing = [20, 40, 60, 80, 100].includes(nextChamber) || (nextChamber > 100 && (nextChamber - 100) % 30 === 0);

      if (isBossComing) {
        let bossLabel = 'CHRONOS TITAN BATTLE';
        if (nextChamber === 20) bossLabel = 'ASTERIUS MINOTAUR KING';
        else if (nextChamber === 40) bossLabel = 'LERNAEAN HYDRA PRIME';
        else if (nextChamber === 60) bossLabel = 'HECATE WITCH MATRON';
        else if (nextChamber === 80) bossLabel = 'CERBERUS PRIME';
        else if (nextChamber > 100) {
          const bossIdx = Math.floor((nextChamber - 100) / 30) - 1;
          const bossKey = INFINITE_BOSS_SEQUENCE[bossIdx % INFINITE_BOSS_SEQUENCE.length];
          bossLabel = ENEMY_TYPES[bossKey].name.toUpperCase();
        }

        // Single Skull Boss Gate
        gameState.doors.push({
          x: 0,
          y: -410,
          radius: 52,
          reward: { type: 'boss', label: bossLabel }
        });
        return;
      }

      // Generate 2 distinct gates
      const gatePositions = [
        { x: -280, y: -410 },
        { x: 280, y: -410 }
      ];

      const godKeys = shuffled(Object.keys(GODS));
      const rewardTypesPool = [
        { type: 'god', godKey: godKeys[0] },
        { type: 'pom', label: 'POM OF POWER (LV UP)' },
        { type: 'shop', label: 'CHARON SHOP (BUY GOODS)' },
        { type: 'heart', label: 'CENTAUR HEART (+25 HP)' },
        { type: 'ash', label: 'DARK ASHES (+15 ASH)' },
        { type: 'god', godKey: godKeys[1] }
      ];

      // Shuffle and pick 2 distinct rewards
      for (let i = rewardTypesPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rewardTypesPool[i], rewardTypesPool[j]] = [rewardTypesPool[j], rewardTypesPool[i]];
      }

      // The first clear always offers a build-defining boon.
      if (gameState.chamber === 1) {
        const firstGod = rewardTypesPool.findIndex(reward => reward.type === 'god');
        [rewardTypesPool[0], rewardTypesPool[firstGod]] = [rewardTypesPool[firstGod], rewardTypesPool[0]];
      }
      gatePositions.forEach((pos, idx) => {
        const reward = rewardTypesPool[idx];
        if (reward.type === 'god') {
          const g = GODS[reward.godKey];
          reward.label = `${g.name.toUpperCase()} BOON`;
        }
        gameState.doors.push({
          x: pos.x,
          y: pos.y,
          radius: 52,
          reward: reward
        });
      });
    }

    function onChamberCleared() {
      if (gameState.enemiesCleared) return;
      gameState.enemiesCleared = true;
      gameState.roomsCleared++;
      gameState.pendingActions = [];
      gameState.projectiles = [];
      const flawless = gameState.roomDamageTaken === 0;
      const heal = gameState.chamberType === 'boss' || gameState.chamberType === 'miniboss' ? 30 : 4;
      if (typeof HADES_LEARNING_ENABLED === 'undefined' || !HADES_LEARNING_ENABLED) gainHealth(heal);
      if (hasBoon('hephaestus_forge') && gameState.roomsCleared % 3 === 0) {
        gainHealth(15 * boonPower('hephaestus_forge'), true);
        gameState.particles.push(new FloatingText(player.x, player.y - 95, 'DIVINE FORGE • MAX HEALTH UP', '#fb923c'));
      }
      player.magick = player.maxMagick;
      sound.playBoonChime();

      // Clear Round Gold Bounty!
      const roundBounty = 25 + Math.floor(Math.random() * 20) + (flawless ? 20 : 0);
      if (flawless) gameState.particles.push(new FloatingText(player.x, player.y - 65, 'FLAWLESS! +20 OBOLS', '#67e8f9'));
      gameState.gold += roundBounty;
      gameState.particles.push(new FloatingText(player.x, player.y - 30, `+${roundBounty} 🪙 ROUND CLEARED!`, '#f59e0b'));
      sound.playGold();
      updateHUD();

      savePermanentProgress();
      // Open choice gates only after hazards have been removed.
      setupExitGates();
    }

    // --- REWARD SELECTION MODALS (God Boon, Pom, Shop) ---
    function openGodBoonModal(godKey, onComplete) {
      gameState.isPaused = true;
      const god = GODS[godKey] || GODS['zeus'];
      const modal = document.getElementById('boon-modal');
      const portraitCanvas = document.getElementById('god-portrait-canvas');
      const pctx = portraitCanvas.getContext('2d');
      pctx.clearRect(0, 0, 140, 140);

      const godsImg = loadedImages['all_10_gods'];
      if (godsImg && godsImg.complete && godsImg.naturalWidth > 0) {
        const col = god.portraitIndex % 5;
        const row = Math.floor(god.portraitIndex / 5);
        const cw = 256;
        const ch = 256;
        pctx.drawImage(godsImg, col * cw, row * ch, cw, ch, 0, 0, 140, 140);
      } else {
        pctx.fillStyle = god.color;
        pctx.fillRect(0, 0, 140, 140);
      }

      document.getElementById('god-name').innerText = `${god.name.toUpperCase()} — ${god.title.toUpperCase()}`;
      document.getElementById('god-quote').innerText = god.quotes[Math.floor(Math.random() * god.quotes.length)];

      const container = document.getElementById('boon-choices-container');
      container.innerHTML = '';

      const availableDuos = DUO_BOONS.filter(duo => {
        if (hasBoon(duo.id)) return false;
        const [reqA, reqB] = duo.reqs;
        const hasA = reqA.some(id => hasBoon(id));
        const hasB = reqB.some(id => hasBoon(id));
        return hasA && hasB;
      });

      const choices = [];
      if (availableDuos.length > 0) {
        const duo = availableDuos[Math.floor(Math.random() * availableDuos.length)];
        choices.push({ ...duo, isDuo: true, slot: 'DUO BOON' });
      }

      const unownedBoons = god.boons.filter(b => !hasBoon(b.id));
      while (choices.length < 3 && unownedBoons.length > 0) {
        const idx = Math.floor(Math.random() * unownedBoons.length);
        choices.push(unownedBoons.splice(idx, 1)[0]);
      }

      // Fully collected gods offer upgrades instead of an empty, unclosable modal.
      if (!choices.length) {
        modal.style.display = 'none';
        openPomModal(onComplete, god.boons.map(boon => boon.id));
        return;
      }
      let chosen = false;
      choices.forEach(boon => {
        const rewardLevel = POM_UPGRADE_EFFECTS[boon.id] && typeof learningBoonRank === 'function' ? learningBoonRank() : 1;
        const card = document.createElement('button');
        card.type = 'button';
        card.className = `boon-card ${boon.isDuo ? 'duo-card' : ''}`;
        card.innerHTML = `
          <div>
            <div class="boon-rarity">${typeof learningBoonLabel === 'function' && HADES_LEARNING_ENABLED ? learningBoonLabel() : boon.isDuo ? '★ LEGENDARY DUO ★' : 'RARE BOON'}</div>
            <div class="boon-card-name">${boon.name}</div>
            <div class="boon-card-desc">${boon.desc}</div>
            ${rewardLevel > 1 ? `<div class="boon-card-desc">Lv ${rewardLevel}: ${pomUpgradeDescription(boon, rewardLevel)}</div>` : ''}
            ${typeof HADES_LEARNING_ENABLED !== 'undefined' && HADES_LEARNING_ENABLED && !POM_UPGRADE_EFFECTS[boon.id] ? '<div class="boon-card-desc">Unique effect · fixed strength</div>' : ''}
          </div>
          <div class="boon-card-slot">${boon.isDuo ? `Synergy: ${boon.gods.join(' + ')}` : boon.slot === 'Hex' ? 'Hex ability • replaces your current Hex' : `Slot: ${boon.slot}`}</div>
        `;
        card.onclick = () => {
          if (chosen) return;
          chosen = true;
          // Hexes are alternative ultimate abilities. A new Hex replaces the old one.
          if (boon.slot === 'Hex') gameState.equippedBoons = gameState.equippedBoons.filter(owned => owned.slot !== 'Hex');
          gameState.equippedBoons.push({ ...boon, level: rewardLevel, tier: typeof hadesLearning !== 'undefined' && hadesLearning.enabled ? hadesLearning.tier : 'rare', godName: boon.isDuo ? boon.gods.join(' & ') : god.name });
          if (boon.id === 'hephaestus_armor') { player.maxHp += 50; player.hp += 50; }
          if (boon.id === 'hephaestus_shield') player.barrierHp = 40;
          modal.style.display = 'none';
          gameState.isPaused = false;
          sound.playBoonChime();
          updateHUD();
          if (onComplete) onComplete();
        };
        container.appendChild(card);
      });

      modal.style.display = 'flex';
    }

    function openPomModal(onComplete, preferredIds = null) {
      const scalable = gameState.equippedBoons.filter(boon => POM_UPGRADE_EFFECTS[boon.id]);
      if (scalable.length === 0) {
        // A build made entirely of unique utility effects still receives a useful reward.
        gainHealth(50, true);
        sound.playBoonChime();
        gameState.particles.push(new FloatingText(player.x, player.y - 40, '+50 BASE MAX HP (NO SCALABLE BOONS)', '#ef4444'));
        document.getElementById('pom-modal').style.display = 'none';
        gameState.isPaused = false;
        updateHUD();
        if (onComplete) onComplete();
        return;
      }

      gameState.isPaused = true;
      const modal = document.getElementById('pom-modal');
      const pCanvas = document.getElementById('pom-portrait-canvas');
      const pctx = pCanvas.getContext('2d');
      pctx.clearRect(0, 0, 120, 120);

      const rewImg = loadedImages['reward_icons'];
      if (rewImg && rewImg.complete && rewImg.naturalWidth > 0) {
        pctx.drawImage(rewImg, 0, 0, 256, 256, 0, 0, 120, 120);
      }

      const container = document.getElementById('pom-choices-container');
      container.innerHTML = '';

      // Pick up to 3 player boons to level up
      const pool = preferredIds ? scalable.filter(boon => preferredIds.includes(boon.id)) : scalable;
      const upgradeable = shuffled(pool.length ? pool : scalable).slice(0, 3);
      let chosen = false;

      upgradeable.forEach(boon => {
        const curLvl = boon.level || 1;
        const nextLvl = curLvl + (typeof learningBoonRank === 'function' ? learningBoonRank() : 1);
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'boon-card';
        card.innerHTML = `
          <div>
            <div class="boon-rarity" style="color:#ef4444;">${typeof learningBoonLabel === 'function' && HADES_LEARNING_ENABLED ? learningBoonLabel() + ' · POM UPGRADE' : 'POM UPGRADE'}</div>
            <div class="boon-card-name">${boon.name} <span class="boon-lvl-badge">Lv ${curLvl} ➔ Lv ${nextLvl}</span></div>
            <div class="boon-card-desc">${boon.desc}</div>
          </div>
          <div class="boon-card-slot">${pomUpgradeDescription(boon, curLvl)}<br>Next: ${pomUpgradeDescription(boon, nextLvl)}</div>
        `;
        card.onclick = () => {
          if (chosen) return;
          chosen = true;
          boon.level = nextLvl;
          modal.style.display = 'none';
          gameState.isPaused = false;
          sound.playBoonChime();
          updateHUD();
          if (onComplete) onComplete();
        };
        container.appendChild(card);
      });

      modal.style.display = 'flex';
    }

    function openCharonShop() {
      gameState.isPaused = true;
      const modal = document.getElementById('shop-modal');
      const sCanvas = document.getElementById('shop-portrait-canvas');
      const sctx = sCanvas.getContext('2d');
      sctx.clearRect(0, 0, 120, 120);

      const rewImg = loadedImages['reward_icons'];
      if (rewImg && rewImg.complete && rewImg.naturalWidth > 0) {
        sctx.drawImage(rewImg, 256, 0, 256, 256, 0, 0, 120, 120);
      }

      const container = document.getElementById('shop-choices-container');
      container.innerHTML = '';

      const godKeys = Object.keys(GODS);
      const randomGod = godKeys[Math.floor(Math.random() * godKeys.length)];

      const shopItems = [
        { name: `${GODS[randomGod].name} Divine Blessing`, desc: 'Receive a random rare boon from Olympus.', cost: 140, type: 'god', godKey: randomGod },
        { name: 'Pom of Power Slice', desc: 'Upgrade one of your equipped boons by +1 Level.', cost: 95, type: 'pom' },
        { name: 'Underworld Gyros & Nectar', desc: 'Restore 75 Health instantly to Melinoë.', cost: 70, type: 'heal' },
        { name: 'Centaur Heart Vessel', desc: 'Gain +35 maximum Health for this run.', cost: 120, type: 'heart' }
      ];

      const purchased = new Set();
      const refreshShop = () => { modal.style.display = 'flex'; gameState.isPaused = true; };
      shopItems.forEach(item => {
        const card = document.createElement('button');
        card.type = 'button';
        card.className = 'boon-card';
        card.innerHTML = `
          <div>
            <div class="boon-rarity" style="color:#f59e0b;">CHARON'S WARES</div>
            <div class="boon-card-name">${item.name}</div>
            <div class="boon-card-desc">${item.desc}</div>
          </div>
          <div class="boon-card-slot" style="color:#fde047; font-weight:700;">🪙 ${item.cost} Gold Obols</div>
        `;
        card.onclick = () => {
          if (purchased.has(item.type)) return;
          if (gameState.gold >= item.cost) {
            purchased.add(item.type);
            gameState.gold -= item.cost;
            sound.playGold();
            updateHUD();
            card.style.opacity = '0.35';
            card.style.pointerEvents = 'none';

            if (item.type === 'god') {
              modal.style.display = 'none';
              openGodBoonModal(item.godKey, refreshShop);
            } else if (item.type === 'pom') {
              modal.style.display = 'none';
              openPomModal(refreshShop);
            } else if (item.type === 'heal') {
              gainHealth(75);
              sound.playBoonChime();
              updateHUD();
            } else if (item.type === 'heart') {
              gainHealth(35, true);
              sound.playBoonChime();
              updateHUD();
            }
          } else {
            sound.playHit();
          }
        };
        container.appendChild(card);
      });

      document.getElementById('leave-shop-btn').onclick = () => {
        modal.style.display = 'none';
        gameState.isPaused = false;
      };

      modal.style.display = 'flex';
    }

    function handleGameOver(isVictory) {
      gameState.isPaused = true;
      gameState.pendingActions = [];
      savePermanentProgress();
      const modal = document.getElementById('gameover-modal');
      const title = document.getElementById('gameover-title');
      const sub = document.getElementById('gameover-subtitle');

      if (isVictory) {
        title.innerText = 'VICTORY ACHIEVED!';
        title.style.color = '#fde047';
        sub.innerText = 'Chronos has been vanquished at Chamber 100. The Underworld is reclaimed!';
      } else {
        title.innerText = 'THERE IS NO ESCAPE';
        title.style.color = '#ef4444';
        sub.innerText = `Chamber ${gameState.chamber} reached • ${gameState.roomsCleared} cleared • Best: ${gameState.bestChamber}. Your Ashes and Altar upgrades are saved on this device.`;
      }

      document.getElementById('stats-chambers').innerText = gameState.chamber;
      document.getElementById('stats-kills').innerText = gameState.kills;
      document.getElementById('stats-ashes').innerText = gameState.ashes;

      modal.style.display = 'flex';
    }

    document.getElementById('return-crossroads-btn').onclick = () => {
      document.getElementById('gameover-modal').style.display = 'none';
      openAltarOfAshes();
    };

    function openAltarOfAshes() {
      gameState.isPaused = true;
      const modal = document.getElementById('altar-modal');
      const grid = document.getElementById('altar-items-grid');
      grid.innerHTML = '';

      const currentRevives = 1 + Math.floor(gameState.upgrades.defiance / 20);
      const ranksInCurrentTier = gameState.upgrades.defiance % 20;

      const upgrades = [
        { key: 'maxHp', title: 'Titanic Vitality', desc: '+20 Max Health per rank', cost: 5 },
        { key: 'magick', title: 'Arcane Pool', desc: '+15 Max Magick per rank', cost: 5 },
        { key: 'damage', title: 'Witchcraft Might', desc: '+10% Attack, Special and Cast base damage per rank', cost: 8 },
        { key: 'defiance', title: 'Death Defiance', desc: `+1 Revive every 20 ranks (Current Revives: ${currentRevives}, Progress: ${ranksInCurrentTier}/20)`, cost: 12 }
      ];

      upgrades.forEach(u => {
        u.cost += Math.floor(gameState.upgrades[u.key] / 5) * u.cost;
        const card = document.createElement('div');
        card.className = 'altar-card';
        card.innerHTML = `
          <div class="altar-info">
            <h4>${u.title} (Lvl ${gameState.upgrades[u.key]})</h4>
            <p>${u.desc}</p>
          </div>
          <button class="hades-btn" style="padding: 6px 14px; font-size: 12px;">${u.cost} 🌪️ Upgrade</button>
        `;
        card.querySelector('button').disabled = gameState.ashes < u.cost;
        card.querySelector('button').onclick = () => {
          if (gameState.ashes >= u.cost) {
            gameState.ashes -= u.cost;
            gameState.upgrades[u.key]++;
            savePermanentProgress();
            sound.playBoonChime();
            player.maxHp = player.baseMaxHp + gameState.upgrades.maxHp * 20 + (hasBoon('hephaestus_armor') ? 50 : 0);
            player.hp = Math.min(player.maxHp, player.hp + (u.key === 'maxHp' ? 20 : 0));
            player.maxMagick = player.baseMagick + gameState.upgrades.magick * 15;
            player.magick = player.maxMagick;
            const revives = 1 + Math.floor(gameState.upgrades.defiance / 20);
            player.defianceCount = revives;
            player.maxDefiance = revives;
            openAltarOfAshes();
            updateHUD();
          }
        };
        grid.appendChild(card);
      });

      modal.style.display = 'flex';
    }

    document.getElementById('start-run-btn').onclick = () => {
      document.getElementById('altar-modal').style.display = 'none';
      if (typeof startHadesRun === 'function') { startHadesRun(); return; }
      gameState.isPaused = false;
      player.resetForRun();
      startChamber(1);
    };

    // --- HUD UPDATES ---
    const hudValueCache = new Map();
    function setHudValue(id, property, value) {
      const key = id + ':' + property;
      const text = String(value);
      if (hudValueCache.get(key) === text) return;
      hudValueCache.set(key, text);
      const element = document.getElementById(id);
      if (property === 'width') element.style.width = text;
      else element.textContent = text;
    }
    function updateHUD() {
      setHudValue('hp-bar', 'width', `${Math.max(0, (player.hp / player.maxHp) * 100)}%`);
      setHudValue('hp-text', 'text', `${Math.ceil(player.hp)} / ${player.maxHp}`);
      setHudValue('magick-bar', 'width', `${Math.max(0, (player.magick / player.maxMagick) * 100)}%`);
      setHudValue('magick-text', 'text', `${Math.ceil(player.magick)} / ${player.maxMagick}`);

      setHudValue('gold-count', 'text', gameState.gold);
      setHudValue('ash-count', 'text', gameState.ashes);
      setHudValue('bones-count', 'text', gameState.bones);

      const hexEl = document.getElementById('hex-gauge');
      if (player.hexCharge >= player.hexMax) {
        hexEl.classList.add('ready');
      } else {
        hexEl.classList.remove('ready');
      }

      const boonsList = document.getElementById('active-boons');
      const signature = gameState.equippedBoons.map(boon => boon.id + ':' + (boon.level || 1)).join('|');
      if (boonsList.dataset.signature === signature) return;
      boonsList.dataset.signature = signature;
      boonsList.innerHTML = '';
      gameState.equippedBoons.forEach(b => {
        const item = document.createElement('div');
        item.className = `boon-badge ${b.isDuo ? 'duo' : ''}`;
        const lvlTag = b.level && b.level > 1 ? `<span class="boon-lvl-badge">Lv ${b.level}</span>` : '';
        item.innerHTML = `
          <div>
            <div class="boon-badge-god">${b.isDuo ? '★ DUO SYNERGY' : b.godName}</div>
            <div class="boon-badge-name">${b.name} ${lvlTag}</div>
          </div>
        `;
        boonsList.appendChild(item);
      });
    }

    function updateBossHUD(boss) {
      setHudValue('boss-name-text', 'text', boss.name);
      const hpPct = Math.max(0, (boss.hp / boss.maxHp) * 100);
      setHudValue('boss-hp-bar', 'width', `${hpPct}%`);
    }

    // --- BOON & SKILL CODEX MODAL [TAB] ---
    function toggleSkillCodex() {
      const modal = document.getElementById('codex-modal');
      if (modal.style.display === 'flex') {
        closeSkillCodex();
      } else {
        openSkillCodex();
      }
    }

    let codexPreviousPause = false;
    function openSkillCodex() {
      if (document.getElementById('codex-modal').style.display === 'flex') return;
      codexPreviousPause = gameState.isPaused;
      gameState.isPaused = true;
      const modal = document.getElementById('codex-modal');
      const container = document.getElementById('codex-cards-container');
      container.innerHTML = '';

      // Update Codex Stats Bar
      document.getElementById('codex-hp').innerText = `${Math.ceil(player.hp)} / ${player.maxHp}`;
      document.getElementById('codex-magick').innerText = `${Math.ceil(player.magick)} / ${player.maxMagick}`;
      document.getElementById('codex-damage').innerText = `+${Math.round(gameState.upgrades.damage * 10)}%`;
      document.getElementById('codex-defiance').innerText = `${player.defianceCount || 0} / ${player.maxDefiance || 1}`;
      document.getElementById('codex-gold').innerText = `${gameState.gold} 🪙`;
      document.getElementById('codex-ashes').innerText = `${gameState.ashes} 🌪️`;

      if (gameState.equippedBoons.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #94a3b8; font-style: italic; font-size: 14px;">
            No Divine Boons equipped yet.<br>
            Clear chambers and step through golden Olympian Gates to receive blessings from the Gods.
          </div>
        `;
      } else {
        gameState.equippedBoons.forEach(equipped => {
          let boonDef = null;
          let godDef = null;
          let isDuo = false;

          // Check Duo Boons first
          const duo = DUO_BOONS.find(d => d.id === equipped.id);
          if (duo) {
            boonDef = duo;
            godDef = { name: duo.gods.join(' & '), color: '#f59e0b', portraitIndex: 0 };
            isDuo = true;
          } else {
            // Check standard Gods
            for (const [gKey, gVal] of Object.entries(GODS)) {
              const b = gVal.boons.find(item => item.id === equipped.id);
              if (b) {
                boonDef = b;
                godDef = gVal;
                break;
              }
            }
          }

          if (!boonDef) return;

          const level = equipped.level || 1;
          const card = document.createElement('div');
          card.className = 'codex-card';
          card.style.borderColor = godDef ? godDef.color : 'var(--gold-dark)';

          const slotBadge = boonDef.slot ? `[${boonDef.slot.toUpperCase()}]` : (isDuo ? '[DUO BOON]' : '[PASSIVE]');

          card.innerHTML = `
            <div class="codex-card-header">
              <canvas class="codex-portrait" width="42" height="42"></canvas>
              <div style="flex-grow: 1;">
                <div class="codex-card-title">
                  <span>${boonDef.name}</span>
                  <span style="font-size: 11px; color: #fde047; font-weight: 900; background: rgba(0,0,0,0.6); padding: 2px 6px; border-radius: 4px; border: 1px solid var(--gold-dark);">Lv ${level}</span>
                </div>
                <div style="font-size: 11px; color: ${godDef ? godDef.color : '#cbd5e1'}; font-weight: 700;">${godDef ? godDef.name : ''}</div>
              </div>
            </div>
            <div>
              <span class="codex-tag">${slotBadge}</span>
              <span class="codex-tag">${pomUpgradeDescription(equipped) || 'Unique effect • does not consume Poms'}</span>
            </div>
            <div class="codex-card-desc">${boonDef.desc}</div>
          `;

          const canvasEl = card.querySelector('canvas');
          if (canvasEl && godDef && godDef.portraitIndex !== undefined) {
            renderGodPortraitToCanvas(canvasEl, godDef.portraitIndex, godDef.color);
          }

          container.appendChild(card);
        });
      }

      modal.style.display = 'flex';
    }

    function closeSkillCodex() {
      const modal = document.getElementById('codex-modal');
      if (modal.style.display !== 'flex') return;
      modal.style.display = 'none';
      gameState.isPaused = codexPreviousPause;
    }

    document.getElementById('close-codex-btn').onclick = closeSkillCodex;
    document.getElementById('open-codex-btn').onclick = openSkillCodex;

    // --- MAIN RENDER LOOP ---
