// One bounded cache for the current chamber; endless runs never retain old scenery.
const chamberArtwork = { key: '', canvas: null, builds: 0 };
const chamberPalettes = [
  { floor: '#102425', edge: '#355754', glow: '#74e8ca', gold: '#b89b66' },
  { floor: '#1d2237', edge: '#46506c', glow: '#92b9fa', gold: '#b8a178' },
  { floor: '#172a27', edge: '#3f5c4a', glow: '#c6e8a0', gold: '#c8ad74' },
  { floor: '#291c27', edge: '#5b3848', glow: '#e29bac', gold: '#bd9266' },
  { floor: '#252332', edge: '#575269', glow: '#d1b4fa', gold: '#d1b476' },
  { floor: '#201c30', edge: '#514264', glow: '#b8a0f5', gold: '#c2a46e' }
];
function graphicsReducedMotion() {
  return typeof gameRuntime !== 'undefined' ? gameRuntime.settings.reducedMotion :
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
function usableArtwork(image) { return image && image.complete && image.naturalWidth > 0; }
function chamberPalette() {
  return chamberPalettes[Math.min(5, Math.floor((Math.max(1, gameState.chamber) - 1) / 20))];
}
function drawMoonSigil(c, x, y, radius, color) {
  c.save(); c.translate(x, y); c.strokeStyle = color; c.lineWidth = 1.5;
  for (const r of [radius, radius * 0.88, radius * 0.65]) {
    c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.stroke();
  }
  c.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = i * Math.PI / 16;
    const inner = i % 4 === 0 ? 0.77 : 0.84;
    c.moveTo(Math.cos(a) * radius * 0.9, Math.sin(a) * radius * 0.9);
    c.lineTo(Math.cos(a) * radius * inner, Math.sin(a) * radius * inner);
  }
  c.stroke(); c.beginPath();
  c.moveTo(0, -radius * 0.75); c.lineTo(radius * 0.48, radius * 0.35);
  c.lineTo(-radius * 0.48, radius * 0.35); c.closePath(); c.stroke();
  c.beginPath(); c.arc(0, 0, radius * 0.3, Math.PI * 0.35, Math.PI * 1.65);
  c.bezierCurveTo(-radius * 0.08, -radius * 0.2, -radius * 0.08, radius * 0.2,
    Math.cos(Math.PI * 0.35) * radius * 0.3, Math.sin(Math.PI * 0.35) * radius * 0.3);
  c.stroke(); c.restore();
}
function buildChamberArtwork() {
  const key = [gameState.chamber, arena.width, arena.height].join(':');
  if (chamberArtwork.key === key) return;
  const margin = 170, surface = chamberArtwork.canvas || document.createElement('canvas');
  surface.width = arena.width + margin * 2; surface.height = arena.height + margin * 2;
  const c = surface.getContext('2d');
  c.translate(surface.width / 2, surface.height / 2);
  const w = arena.width / 2, h = arena.height / 2, palette = chamberPalette();
  c.fillStyle = '#070e16'; c.fillRect(-w - margin, -h - margin, surface.width, surface.height);
  c.fillStyle = palette.floor; c.fillRect(-w, -h, arena.width, arena.height);
  // Quiet masonry leaves silhouettes and attack warnings legible.
  c.strokeStyle = '#a9c6b510'; c.lineWidth = 1;
  for (let y = -h; y < h; y += 100) {
    c.beginPath(); c.moveTo(-w, y); c.lineTo(w, y); c.stroke();
    const row = Math.round((y + h) / 100);
    for (let x = -w + (row % 2) * 100; x < w; x += 200) {
      c.beginPath(); c.moveTo(x, y); c.lineTo(x, Math.min(h, y + 100)); c.stroke();
    }
  }
  const light = c.createRadialGradient(0, -40, 30, 0, 0, w);
  light.addColorStop(0, '#c0ebd911'); light.addColorStop(0.62, '#02070c05'); light.addColorStop(1, '#02070c99');
  c.fillStyle = light; c.fillRect(-w, -h, arena.width, arena.height);
  drawMoonSigil(c, 0, 0, 250, palette.gold + '33');
  for (const x of [-w + 75, w - 75]) {
    for (const y of [-h + 80, h - 80]) drawMoonSigil(c, x, y, 29, palette.gold + '60');
  }
  for (const [inset, width, color] of [[-16, 28, '#081016'], [-3, 14, palette.edge], [8, 2, palette.gold + 'b0'], [28, 1, palette.gold + '36']]) {
    c.lineWidth = width; c.strokeStyle = color;
    c.strokeRect(-w + inset, -h + inset, arena.width - inset * 2, arena.height - inset * 2);
  }
  c.strokeStyle = palette.gold + '77'; c.lineWidth = 2;
  for (let x = -w + 42; x < w - 30; x += 38) {
    for (const y of [-h - 16, h + 16]) {
      c.beginPath(); c.moveTo(x - 9, y); c.lineTo(x, y - 8); c.lineTo(x + 9, y); c.lineTo(x, y + 8); c.closePath(); c.stroke();
    }
  }
  for (const pillar of arena.pillars) {
    c.fillStyle = '#00000070'; c.beginPath();
    c.ellipse(pillar.x + 12, pillar.y + 16, 60, 32, -0.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#091319'; c.fillRect(pillar.x - 40, pillar.y - 34, 80, 52);
    c.strokeStyle = palette.gold + '99'; c.lineWidth = 2; c.strokeRect(pillar.x - 39, pillar.y - 34, 78, 52);
    // Vector fluting avoids sprite-sheet borders and remains sharp at every scale.
    const column = c.createLinearGradient(pillar.x - 30, 0, pillar.x + 30, 0);
    column.addColorStop(0, '#142329'); column.addColorStop(0.45, palette.edge); column.addColorStop(1, '#152129');
    c.fillStyle = column; c.fillRect(pillar.x - 28, pillar.y - 120, 56, 130);
    c.strokeStyle = palette.gold + '70'; c.lineWidth = 1;
    for (let dx = -19; dx < 25; dx += 10) {
      c.beginPath(); c.moveTo(pillar.x + dx, pillar.y - 104); c.lineTo(pillar.x + dx, pillar.y - 5); c.stroke();
    }
    c.fillStyle = '#263a3c'; c.fillRect(pillar.x - 36, pillar.y - 126, 72, 20);
    c.strokeStyle = palette.gold; c.strokeRect(pillar.x - 36, pillar.y - 126, 72, 20);
    c.strokeRect(pillar.x - 33, pillar.y - 7, 66, 17);
    const glow = c.createRadialGradient(pillar.x, pillar.y - 118, 3, pillar.x, pillar.y - 118, 80);
    glow.addColorStop(0, palette.glow + '45'); glow.addColorStop(1, palette.glow + '00');
    c.fillStyle = glow; c.fillRect(pillar.x - 80, pillar.y - 198, 160, 160);
    c.fillStyle = palette.glow; c.beginPath();
    c.moveTo(pillar.x, pillar.y - 151); c.lineTo(pillar.x + 8, pillar.y - 133);
    c.lineTo(pillar.x, pillar.y - 119); c.lineTo(pillar.x - 8, pillar.y - 133); c.closePath(); c.fill();
  }
  chamberArtwork.canvas = surface; chamberArtwork.key = key; chamberArtwork.builds++;
}
function drawChamberTiles(ctx) {
  buildChamberArtwork(); const surface = chamberArtwork.canvas;
  ctx.drawImage(surface, -surface.width / 2, -surface.height / 2);
}
function drawProps(ctx, time) {
  const palette = chamberPalette(), reduced = graphicsReducedMotion(), motionTime = reduced ? 0 : time;
  // Fixed motes never enter or grow the simulation particle array.
  ctx.save(); ctx.fillStyle = palette.glow;
  for (let i = 0; i < 16; i++) {
    ctx.globalAlpha = 0.12 + (i % 3) * 0.04;
    const x = Math.sin(i * 12.7) * arena.width * 0.45 + Math.sin(motionTime / 5000 + i) * 9;
    const y = Math.cos(i * 4.3) * arena.height * 0.42 - ((motionTime / 100 + i * 7) % 42);
    ctx.fillRect(x, y, i % 4 === 0 ? 3 : 2, i % 4 === 0 ? 3 : 2);
  }
  ctx.restore();
  for (let idx = 0; idx < gameState.doors.length; idx++) {
    const door = gameState.doors[idx], reward = door.reward;
    const near = Math.hypot(player.x - door.x, player.y - door.y) < 160;
    const accent = reward.type === 'heart' ? '#ffafb2' : reward.type === 'god' ? '#8aefd8' : '#efd398';
    const bob = Math.sin(motionTime / 650 + idx * 2) * (reduced ? 0 : 3);
    ctx.save(); ctx.translate(door.x, door.y);
    ctx.strokeStyle = accent; ctx.fillStyle = '#07131ced'; ctx.lineWidth = near ? 3 : 1.5;
    ctx.beginPath(); ctx.ellipse(0, 4, 53, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = near ? '#6fdcbd30' : '#6fdcbd12';
    ctx.beginPath(); ctx.moveTo(-43, 3); ctx.lineTo(-43, -72); ctx.quadraticCurveTo(0, -138, 43, -72);
    ctx.lineTo(43, 3); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 5; ctx.strokeStyle = '#4b535b';
    ctx.beginPath(); ctx.moveTo(-51, 10); ctx.lineTo(-51, -75); ctx.quadraticCurveTo(0, -153, 51, -75); ctx.lineTo(51, 10); ctx.stroke();
    const medY = -72 + bob;
    ctx.fillStyle = '#0c1924'; ctx.strokeStyle = accent; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, medY, 30, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    const gods = loadedImages.all_10_gods, icons = loadedImages.reward_icons;
    if (reward.type === 'god' && usableArtwork(gods) && GODS[reward.godKey]) {
      const portrait = GODS[reward.godKey].portraitIndex;
      ctx.drawImage(gods, (portrait % 5) * 256, Math.floor(portrait / 5) * 256, 256, 256, -27, medY - 27, 54, 54);
    } else if (usableArtwork(icons) && ['pom', 'shop', 'heart', 'ash'].includes(reward.type)) {
      const positions = { pom: [0, 0], shop: [256, 0], heart: [0, 256], ash: [256, 256] };
      const [x, y] = positions[reward.type];
      ctx.drawImage(icons, x, y, 256, 256, -25, medY - 25, 50, 50);
    } else { drawMoonSigil(ctx, 0, medY, 21, accent); }
    const label = reward.label || 'NEXT CHAMBER';
    ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'center';
    const labelWidth = Math.min(250, Math.max(116, ctx.measureText(label).width + 26));
    ctx.fillStyle = '#07111bee'; ctx.fillRect(-labelWidth / 2, 27, labelWidth, 42);
    ctx.strokeStyle = accent + '66'; ctx.lineWidth = 1; ctx.strokeRect(-labelWidth / 2, 27, labelWidth, 42);
    ctx.fillStyle = accent; ctx.fillText(label, 0, 44, labelWidth - 14);
    ctx.fillStyle = near ? '#fff7e1' : '#a3b7bc'; ctx.font = '10px system-ui, sans-serif';
    ctx.fillText(near ? 'STEP THROUGH TO CHOOSE' : 'REWARD · NEXT CHAMBER', 0, 59);
    ctx.restore();
  }
}
function drawCombatReadability(ctx) {
  ctx.save();
  for (const enemy of gameState.enemies) {
    if (enemy.isBurrowed || enemy.hp <= 0) continue;
    const elite = enemy.isBoss || enemy.isMiniBoss;
    ctx.strokeStyle = elite ? '#f0b577a0' : '#ee929480'; ctx.fillStyle = '#0a091c48'; ctx.lineWidth = elite ? 2 : 1;
    ctx.beginPath(); ctx.ellipse(enemy.x, enemy.y + 6, enemy.radius + 6, enemy.radius * 0.5 + 5, 0, 0, Math.PI * 2);
    ctx.fill(); ctx.stroke();
  }
  ctx.strokeStyle = '#9fffe9ad'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.ellipse(player.x, player.y + 6, player.radius + 7, player.radius * 0.5 + 5, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function drawScreenAtmosphere(ctx) {
  // The screen vignette lives in CSS, not a full-screen per-frame gradient.
}
