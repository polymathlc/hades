import json
import base64
import os

# Asset loading
assets_keys = [
    'hero', 'shade', 'witch', 'chronos',
    'consistent_tiles', 'seamless_floor', 'props', 'ui',
    'clean_fx', 'attack_fx_anim',
    'all_10_gods', 'monsters_beasts', 'undead_cultists', 'new_projectiles',
    'minibosses'
]

b64_data = {}
for k in assets_keys:
    webp_path = os.path.join('assets_webp', f"{k}.webp")
    with open(webp_path, 'rb') as fp:
        enc = base64.b64encode(fp.read()).decode('utf-8')
        b64_data[k] = f"data:image/webp;base64,{enc}"

print(f"Loaded {len(b64_data)} assets into memory.")

html_template = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>HADES II: CHRONOS FALL - 100 Chambers Hardcore Edition</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;900&family=Philosopher:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --gold-primary: #e6b450;
      --gold-light: #fff2a8;
      --gold-dark: #8c5b16;
      --bronze: #5a3818;
      --obsidian: #0e0d13;
      --magick-purple: #b356ff;
      --magick-glow: #e084ff;
      --health-green: #3cd070;
      --health-red: #d9383a;
      --underworld-teal: #2ae6b4;
      --olympus-blue: #38bdf8;
      --crimson: #ef4444;
      --duo-gold: #fbbf24;
      --boss-gold: #facc15;
      --font-title: 'Cinzel', serif;
      --font-body: 'Philosopher', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      user-select: none;
      -webkit-user-select: none;
    }

    body, html {
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-color: #0c0914;
      font-family: var(--font-body);
      color: #f1e9da;
    }

    #game-container {
      position: relative;
      width: 100vw;
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: radial-gradient(circle at center, #1c142b 0%, #08060d 100%);
    }

    canvas#gameCanvas {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      cursor: crosshair;
    }

    /* UI Layer Overlay */
    #ui-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: 22px;
    }

    /* Top HUD */
    .top-hud {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      width: 100%;
    }

    .player-bars {
      display: flex;
      flex-direction: column;
      gap: 10px;
      width: 350px;
      filter: drop-shadow(0 4px 14px rgba(0,0,0,0.9));
    }

    .bar-wrapper {
      position: relative;
      height: 28px;
      background: #110e18;
      border: 2px solid var(--gold-dark);
      border-radius: 6px;
      overflow: hidden;
      box-shadow: inset 0 2px 8px rgba(0,0,0,0.95);
    }

    .bar-fill {
      height: 100%;
      width: 100%;
      transition: width 0.15s cubic-bezier(0.2, 0.9, 0.4, 1.1);
    }

    .bar-fill.health {
      background: linear-gradient(90deg, #991b1b, #ef4444, #f87171);
      box-shadow: 0 0 14px rgba(239, 68, 68, 0.8);
    }

    .bar-fill.magick {
      background: linear-gradient(90deg, #6b21a8, #a855f7, #c084fc);
      box-shadow: 0 0 14px rgba(168, 85, 247, 0.8);
    }

    .bar-text {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 14px;
      font-family: var(--font-title);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 1.5px;
      text-shadow: 0 2px 4px #000;
      color: #fff;
    }

    .top-center-hud {
      text-align: center;
      pointer-events: none;
    }

    .chamber-title {
      font-family: var(--font-title);
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 4px;
      color: var(--gold-light);
      text-transform: uppercase;
      text-shadow: 0 0 18px rgba(230, 180, 80, 0.9), 0 2px 8px #000;
    }

    .chamber-subtitle {
      font-size: 13px;
      letter-spacing: 2px;
      color: #cbd5e1;
      text-transform: uppercase;
    }

    .currency-panel {
      display: flex;
      gap: 18px;
      background: rgba(14, 13, 19, 0.92);
      border: 1px solid var(--gold-dark);
      padding: 8px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.8);
    }

    .currency-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-family: var(--font-title);
      font-size: 15px;
      font-weight: 700;
      color: var(--gold-light);
    }

    .icon-obol { color: #f59e0b; filter: drop-shadow(0 0 6px #f59e0b); }
    .icon-ash { color: #cbd5e1; filter: drop-shadow(0 0 6px #e2e8f0); }
    .icon-bones { color: #c084fc; filter: drop-shadow(0 0 6px #d8b4fe); }

    /* Left Active Boons Display */
    .active-boons-list {
      position: absolute;
      left: 22px;
      top: 100px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 65vh;
      overflow-y: auto;
      pointer-events: auto;
      scrollbar-width: thin;
    }

    .boon-badge {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(14, 13, 19, 0.94);
      border-left: 4px solid var(--gold-primary);
      padding: 6px 14px;
      border-radius: 0 6px 6px 0;
      border-top: 1px solid rgba(230, 180, 80, 0.3);
      border-bottom: 1px solid rgba(230, 180, 80, 0.3);
      border-right: 1px solid rgba(230, 180, 80, 0.3);
      backdrop-filter: blur(4px);
    }

    .boon-badge.duo {
      border-left-color: #fbbf24;
      background: linear-gradient(90deg, rgba(60, 40, 10, 0.95), rgba(20, 15, 30, 0.95));
      box-shadow: 0 0 12px rgba(251, 191, 36, 0.5);
    }

    .boon-badge-god {
      font-family: var(--font-title);
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .boon-badge-name {
      font-size: 13px;
      color: #fff;
    }

    /* Bottom HUD */
    .bottom-hud {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      width: 100%;
    }

    .abilities-cluster {
      display: flex;
      gap: 14px;
      align-items: center;
    }

    .ability-slot {
      width: 64px;
      height: 64px;
      background: rgba(14, 13, 19, 0.94);
      border: 2px solid var(--gold-dark);
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 4px 14px rgba(0,0,0,0.85);
    }

    .ability-slot.active {
      border-color: var(--gold-primary);
      box-shadow: 0 0 18px rgba(230, 180, 80, 0.7);
    }

    .ability-key {
      position: absolute;
      top: -8px;
      right: -6px;
      background: #2a1f10;
      border: 1px solid var(--gold-primary);
      color: var(--gold-light);
      font-size: 10px;
      font-weight: 900;
      font-family: var(--font-title);
      padding: 2px 6px;
      border-radius: 4px;
    }

    .ability-icon {
      font-size: 22px;
    }

    .ability-name {
      font-size: 10px;
      font-family: var(--font-title);
      color: #e2e8f0;
      margin-top: 2px;
      text-transform: uppercase;
    }

    /* Hex Moon Circle Gauge */
    .hex-circle {
      width: 82px;
      height: 82px;
      border-radius: 50%;
      background: radial-gradient(circle, #3b1d5c 0%, #0e0717 100%);
      border: 3px solid #7c3aed;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      position: relative;
      box-shadow: 0 0 22px rgba(124, 58, 237, 0.7);
    }

    .hex-circle.ready {
      border-color: #c084fc;
      box-shadow: 0 0 30px rgba(192, 132, 252, 1);
      animation: hexPulse 1.4s infinite alternate;
    }

    @keyframes hexPulse {
      0% { transform: scale(1); filter: brightness(1); }
      100% { transform: scale(1.08); filter: brightness(1.35); }
    }

    /* Boss / Mini-Boss Health Bar */
    .boss-bar-container {
      position: absolute;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      width: 680px;
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      filter: drop-shadow(0 6px 20px rgba(0,0,0,0.95));
    }

    .boss-name {
      font-family: var(--font-title);
      font-size: 20px;
      font-weight: 900;
      letter-spacing: 4px;
      color: #fef08a;
      text-transform: uppercase;
      text-shadow: 0 0 16px #ca8a04, 0 2px 6px #000;
    }

    .boss-bar-frame {
      position: relative;
      width: 100%;
      height: 32px;
      background: #110e18;
      border: 2px solid #ca8a04;
      border-radius: 6px;
      overflow: hidden;
    }

    .boss-bar-fill {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #b45309, #eab308, #fef08a);
      box-shadow: 0 0 20px rgba(234, 179, 8, 0.9);
      transition: width 0.1s linear;
    }

    /* Modals */
    .modal-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(4, 3, 7, 0.92);
      backdrop-filter: blur(8px);
      display: none;
      justify-content: center;
      align-items: center;
      z-index: 100;
      pointer-events: auto;
    }

    .modal-card {
      background: #0f0c18;
      border: 2px solid var(--gold-primary);
      border-radius: 14px;
      padding: 32px 42px;
      box-shadow: 0 0 50px rgba(230, 180, 80, 0.4), inset 0 0 35px rgba(0,0,0,0.85);
      max-width: 950px;
      width: 92%;
      text-align: center;
      position: relative;
      animation: modalFade 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes modalFade {
      0% { opacity: 0; transform: scale(0.92) translateY(20px); }
      100% { opacity: 1; transform: scale(1) translateY(0); }
    }

    .modal-title {
      font-family: var(--font-title);
      font-size: 28px;
      font-weight: 900;
      letter-spacing: 3px;
      color: var(--gold-light);
      margin-bottom: 6px;
      text-shadow: 0 0 16px rgba(230, 180, 80, 0.6);
    }

    .modal-subtitle {
      font-size: 15px;
      color: #cbd5e1;
      margin-bottom: 22px;
      font-style: italic;
    }

    /* Boon Selection Cards Grid */
    .boon-cards-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
      margin-top: 14px;
    }

    .boon-card {
      background: linear-gradient(180deg, #1c152a 0%, #0d0a14 100%);
      border: 2px solid var(--gold-dark);
      border-radius: 10px;
      padding: 20px 16px;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s cubic-bezier(0.2, 0.8, 0.2, 1);
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 220px;
    }

    .boon-card:hover {
      border-color: var(--gold-light);
      transform: translateY(-6px);
      box-shadow: 0 10px 24px rgba(230, 180, 80, 0.45), inset 0 0 15px rgba(230, 180, 80, 0.25);
    }

    .boon-card.duo-card {
      border-color: #fbbf24;
      background: linear-gradient(180deg, #2e1d08 0%, #150f1f 100%);
      box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);
    }

    .boon-card.duo-card:hover {
      border-color: #fef08a;
      box-shadow: 0 0 30px rgba(251, 191, 36, 0.7);
    }

    .boon-rarity {
      font-family: var(--font-title);
      font-size: 10px;
      font-weight: 900;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 4px;
      color: #60a5fa;
    }

    .boon-card.duo-card .boon-rarity {
      color: #fbbf24;
      text-shadow: 0 0 8px rgba(251, 191, 36, 0.8);
    }

    .boon-card-name {
      font-family: var(--font-title);
      font-size: 18px;
      font-weight: 700;
      color: var(--gold-light);
      margin-bottom: 8px;
    }

    .boon-card-desc {
      font-size: 13px;
      line-height: 1.4;
      color: #d1c7dc;
      flex-grow: 1;
    }

    .boon-card-slot {
      margin-top: 12px;
      font-size: 11px;
      font-family: var(--font-title);
      color: #94a3b8;
      text-transform: uppercase;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 6px;
    }

    /* God Dialogue Modal */
    .dialogue-modal {
      display: flex;
      gap: 26px;
      align-items: center;
      text-align: left;
      margin-bottom: 12px;
    }

    .dialogue-portrait-canvas {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: none;
      box-shadow: 0 0 25px rgba(230, 180, 80, 0.6);
      flex-shrink: 0;
      background: transparent;
    }

    .dialogue-content {
      flex-grow: 1;
    }

    .dialogue-god-name {
      font-family: var(--font-title);
      font-size: 22px;
      font-weight: 900;
      color: var(--gold-light);
      letter-spacing: 2px;
      margin-bottom: 6px;
    }

    .dialogue-text {
      font-size: 16px;
      line-height: 1.5;
      color: #f1e9da;
      font-style: italic;
      margin-bottom: 18px;
    }

    /* Buttons */
    .hades-btn {
      background: linear-gradient(180deg, #3d2410 0%, #1e1106 100%);
      border: 2px solid var(--gold-primary);
      color: var(--gold-light);
      font-family: var(--font-title);
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      padding: 12px 28px;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 4px 14px rgba(0,0,0,0.6);
      transition: all 0.2s;
    }

    .hades-btn:hover {
      background: linear-gradient(180deg, #5e3717 0%, #301b0a 100%);
      border-color: var(--gold-light);
      box-shadow: 0 0 18px rgba(230, 180, 80, 0.6);
      transform: translateY(-2px);
    }

    /* Altar */
    .altar-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      margin: 20px 0;
      text-align: left;
    }

    .altar-card {
      background: rgba(22, 17, 34, 0.9);
      border: 1px solid var(--gold-dark);
      border-radius: 8px;
      padding: 14px 18px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .altar-info h4 {
      font-family: var(--font-title);
      font-size: 15px;
      color: var(--gold-light);
      margin-bottom: 2px;
    }

    .altar-info p {
      font-size: 12px;
      color: #94a3b8;
    }

    /* Controls helper banner */
    .controls-banner {
      position: absolute;
      bottom: 85px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 16px;
      background: rgba(10, 8, 16, 0.88);
      border: 1px solid rgba(230, 180, 80, 0.4);
      border-radius: 20px;
      padding: 6px 20px;
      font-size: 11px;
      font-family: var(--font-title);
      color: #cbd5e1;
      letter-spacing: 1px;
      pointer-events: none;
      backdrop-filter: blur(4px);
    }

    .key-badge {
      color: var(--gold-primary);
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div id="game-container">
    <canvas id="gameCanvas"></canvas>

    <!-- UI Overlay Layer -->
    <div id="ui-layer">
      <!-- Top HUD -->
      <div class="top-hud">
        <div class="player-bars">
          <div class="bar-wrapper">
            <div id="hp-bar" class="bar-fill health" style="width: 100%;"></div>
            <div class="bar-text"><span>HEALTH</span><span id="hp-text">100 / 100</span></div>
          </div>
          <div class="bar-wrapper">
            <div id="magick-bar" class="bar-fill magick" style="width: 100%;"></div>
            <div class="bar-text"><span>MAGICK</span><span id="magick-text">50 / 50</span></div>
          </div>
        </div>

        <div class="top-center-hud">
          <div id="chamber-name" class="chamber-title">EREBUS - CHAMBER 1 / 100</div>
          <div id="chamber-sub" class="chamber-subtitle">Underworld Gateway</div>
        </div>

        <div class="currency-panel">
          <div class="currency-item"><span class="icon-obol">🪙</span> <span id="gold-count">0</span></div>
          <div class="currency-item"><span class="icon-ash">🌪️</span> <span id="ash-count">0</span></div>
          <div class="currency-item"><span class="icon-bones">🦴</span> <span id="bones-count">0</span></div>
        </div>
      </div>

      <!-- Left Active Boons HUD -->
      <div id="active-boons" class="active-boons-list"></div>

      <!-- Controls helper -->
      <div class="controls-banner">
        <span><span class="key-badge">WASD</span> Move</span>
        <span><span class="key-badge">L-CLICK / J</span> Strike</span>
        <span><span class="key-badge">R-CLICK / K</span> Special (Nerfed -80%)</span>
        <span><span class="key-badge">Q / E</span> Cast</span>
        <span><span class="key-badge">SPACE / SHIFT</span> Dash</span>
        <span><span class="key-badge">F</span> Hex</span>
        <span><span class="key-badge">M</span> Mute</span>
      </div>

      <!-- Bottom HUD -->
      <div class="bottom-hud">
        <div class="abilities-cluster">
          <div class="ability-slot active">
            <div class="ability-key">L-CLICK</div>
            <div class="ability-icon">⚔️</div>
            <div class="ability-name">Strike</div>
          </div>
          <div class="ability-slot active">
            <div class="ability-key">R-CLICK</div>
            <div class="ability-icon">🌙</div>
            <div class="ability-name">Special</div>
          </div>
          <div class="ability-slot active">
            <div class="ability-key">Q</div>
            <div class="ability-icon">⭕</div>
            <div class="ability-name">Cast</div>
          </div>
          <div class="ability-slot active">
            <div class="ability-key">SPACE</div>
            <div class="ability-icon">💨</div>
            <div class="ability-name">Dash</div>
          </div>
        </div>

        <!-- Boss / Mini-Boss Health Bar -->
        <div id="boss-hud" class="boss-bar-container">
          <div id="boss-name-text" class="boss-name">CHRONOS — TITAN OF TIME</div>
          <div class="boss-bar-frame">
            <div id="boss-hp-bar" class="boss-bar-fill"></div>
          </div>
        </div>

        <!-- Selene Hex Gauge -->
        <div id="hex-gauge" class="hex-circle">
          <div class="ability-key">F</div>
          <div style="font-size: 24px;">🌕</div>
          <div style="font-size: 9px; font-family: var(--font-title); color: #c084fc; font-weight: 700;">HEX</div>
        </div>
      </div>
    </div>

    <!-- Modals -->

    <!-- God Boon Modal -->
    <div id="boon-modal" class="modal-overlay">
      <div class="modal-card">
        <div class="dialogue-modal">
          <canvas id="god-portrait-canvas" class="dialogue-portrait-canvas" width="140" height="140"></canvas>
          <div class="dialogue-content">
            <div id="god-name" class="dialogue-god-name">ZEUS, LORD OF OLYMPUS</div>
            <div id="god-quote" class="dialogue-text">"Take my lightning, niece. Smite the usurper of Time and light up the darkness!"</div>
          </div>
        </div>
        <div class="modal-title">CHOOSE A BOON</div>
        <div class="modal-subtitle">Bestow divine power or forge legendary Duo Boons</div>
        <div id="boon-choices-container" class="boon-cards-grid"></div>
      </div>
    </div>

    <!-- Altar of Ashes -->
    <div id="altar-modal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-title">THE ALTAR OF ASHES</div>
        <div class="modal-subtitle">Channel the remnants of the underworld to empower Melinoë</div>
        <div class="altar-grid" id="altar-items-grid"></div>
        <button id="start-run-btn" class="hades-btn">DESCEND INTO THE UNDERWORLD ➔</button>
      </div>
    </div>

    <!-- Game Over / Victory Modal -->
    <div id="gameover-modal" class="modal-overlay">
      <div class="modal-card">
        <div id="gameover-title" class="modal-title">DEATH APPROACHES</div>
        <div id="gameover-subtitle" class="modal-subtitle">There is no escape from the Underworld. Return to the Crossroads.</div>
        <div style="margin: 20px 0; font-size: 16px; color: var(--gold-light);">
          <div>Chambers Cleared: <span id="stats-chambers">0</span> / 100</div>
          <div>Enemies Vanquished: <span id="stats-kills">0</span></div>
          <div>Ashes Collected: <span id="stats-ashes">0</span></div>
        </div>
        <button id="return-crossroads-btn" class="hades-btn">RETURN TO CROSSROADS</button>
      </div>
    </div>
  </div>

  <script>
    /* ==========================================================================
       HADES 2 ENGINE: 100 CHAMBERS, 4 MINIBOSSES, 20X CHRONOS, NERFED SPECIAL
       ========================================================================== */

    const ASSETS_DATA = %ASSETS_JSON%;

    const loadedImages = {};
    for (const [key, uri] of Object.entries(ASSETS_DATA)) {
      const img = new Image();
      img.src = uri;
      loadedImages[key] = img;
    }

    // --- PROCEDURAL SOUND SYNTHESIS ENGINE ---
    class SoundEngine {
      constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.bgmTimer = null;
        this.step = 0;
        this.init();
      }

      init() {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }

      resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
      }

      toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
      }

      playSlash() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const bufferSize = Math.floor(this.ctx.sampleRate * 0.14);
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
        }
        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1600, now);
        filter.frequency.exponentialRampToValueAtTime(340, now + 0.14);
        filter.Q.value = 3.5;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(270, now);
        osc.frequency.exponentialRampToValueAtTime(70, now + 0.11);
        oscGain.gain.setValueAtTime(0.35, now);
        oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);

        noise.start(now);
        osc.start(now);
        osc.stop(now + 0.14);
      }

      playDash() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.18);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.18);
      }

      playCast() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        [220, 330, 440, 660].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.frequency.linearRampToValueAtTime(freq * 1.25, now + 0.35);
          gain.gain.setValueAtTime(0.14 / (idx + 1), now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.45);
        });
      }

      playExplosion() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(35, now + 0.38);
        gain.gain.setValueAtTime(0.55, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.38);
      }

      playHit() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.09);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.09);
      }

      playLightning() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(940, now);
        osc.frequency.linearRampToValueAtTime(130, now + 0.16);
        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.16);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.16);
      }

      playBoonChime() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
        notes.forEach((note, i) => {
          const now = this.ctx.currentTime + i * 0.08;
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(note, now);
          gain.gain.setValueAtTime(0.25, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now);
          osc.stop(now + 0.55);
        });
      }

      playGold() {
        if (this.isMuted || !this.ctx) return;
        this.resume();
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1760, now);
        osc.frequency.setValueAtTime(2637, now + 0.05);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.22);
      }

      startBGM() {
        if (this.bgmTimer) return;
        this.bgmTimer = setInterval(() => {
          if (this.isMuted || !this.ctx) return;
          this.resume();
          const now = this.ctx.currentTime;
          const scale = [82.41, 87.31, 98.0, 123.47];
          const note = scale[Math.floor(this.step / 4) % scale.length];

          if (this.step % 4 === 0) {
            const kick = this.ctx.createOscillator();
            const kGain = this.ctx.createGain();
            kick.frequency.setValueAtTime(115, now);
            kick.frequency.exponentialRampToValueAtTime(35, now + 0.13);
            kGain.gain.setValueAtTime(0.35, now);
            kGain.gain.exponentialRampToValueAtTime(0.01, now + 0.13);
            kick.connect(kGain);
            kGain.connect(this.ctx.destination);
            kick.start(now);
            kick.stop(now + 0.13);
          }

          const bass = this.ctx.createOscillator();
          const bGain = this.ctx.createGain();
          bass.type = 'sawtooth';
          bass.frequency.setValueAtTime(note, now);
          bGain.gain.setValueAtTime(0.09, now);
          bGain.gain.exponentialRampToValueAtTime(0.005, now + 0.11);
          bass.connect(bGain);
          bGain.connect(this.ctx.destination);
          bass.start(now);
          bass.stop(now + 0.11);

          this.step = (this.step + 1) % 16;
        }, 130);
      }
    }

    const sound = new SoundEngine();

    // --- CANVAS & INPUT SETUP ---
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    function resizeCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const keys = {};
    const mouse = { x: canvas.width / 2, y: canvas.height / 2, leftDown: false, rightDown: false };

    window.addEventListener('keydown', (e) => {
      keys[e.key.toLowerCase()] = true;
      sound.resume();
      sound.startBGM();

      if (e.key.toLowerCase() === 'm') {
        sound.toggleMute();
      }
      if (e.key.toLowerCase() === 'q' || e.key.toLowerCase() === 'e') {
        player.triggerCast();
      }
      if (e.key.toLowerCase() === ' ' || e.key.toLowerCase() === 'shift') {
        player.triggerDash();
      }
      if (e.key.toLowerCase() === 'f') {
        player.triggerHex();
      }
      if (e.key.toLowerCase() === 'j') {
        player.triggerAttack();
      }
      if (e.key.toLowerCase() === 'k') {
        player.triggerSpecial();
      }
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    window.addEventListener('mousedown', (e) => {
      sound.resume();
      sound.startBGM();
      if (e.button === 0) {
        mouse.leftDown = true;
        player.triggerAttack();
      } else if (e.button === 2) {
        mouse.rightDown = true;
        player.triggerSpecial();
      }
    });

    window.addEventListener('mouseup', (e) => {
      if (e.button === 0) mouse.leftDown = false;
      if (e.button === 2) mouse.rightDown = false;
    });

    window.addEventListener('contextmenu', (e) => e.preventDefault());

    // --- 10 OLYMPIAN & CHTHONIC GODS REGISTRY & DUO BOONS ---
    const GODS = {
      zeus: {
        name: 'Zeus',
        title: 'Lord of Olympus',
        portraitIndex: 0,
        color: '#facc15',
        quotes: [
          '"Take my lightning, niece. Smite the usurper of Time and light up the darkness!"',
          '"A storm gathers in the Underworld. Let Chronos feel the wrath of Olympus!"'
        ],
        boons: [
          { id: 'zeus_strike', name: 'Lightning Strike', slot: 'Attack', desc: 'Attacks call down chain lightning arcing between up to 5 enemies for 45 damage.' },
          { id: 'zeus_ring', name: 'Storm Ring', slot: 'Cast', desc: 'Your Cast circle triggers repeating lightning strikes every 0.4s for 40 damage.' },
          { id: 'zeus_dash', name: 'Static Dash', slot: 'Dash', desc: 'Dashing discharges a burst of 6 electric spark bolts.' },
          { id: 'zeus_special', name: 'Thunder Special', slot: 'Special', desc: 'Special sickle calls down a thunderbolt upon every enemy struck.' }
        ]
      },
      hestia: {
        name: 'Hestia',
        title: 'Goddess of the Hearth',
        portraitIndex: 1,
        color: '#f97316',
        quotes: [
          '"Keep the hearth burning bright, child. Let us reduce these shades to ash!"',
          '"A small ember is all it takes to consume the grandest halls of time."'
        ],
        boons: [
          { id: 'hestia_strike', name: 'Flame Strike', slot: 'Attack', desc: 'Attacks inflict Scorch, dealing 80 burn damage over 3 seconds.' },
          { id: 'hestia_ring', name: 'Smolder Ring', slot: 'Cast', desc: 'Your Cast circle ignites a continuous fire vortex that incinerates foes for 120 dmg.' },
          { id: 'hestia_dash', name: 'Searing Dash', slot: 'Dash', desc: 'Dash leaves a flaming path that burns enemies who step into it.' },
          { id: 'hestia_special', name: 'Magma Special', slot: 'Special', desc: 'Special sickle leaves a trail of burning magma on its path.' }
        ]
      },
      poseidon: {
        name: 'Poseidon',
        title: 'Lord of the Seas',
        portraitIndex: 2,
        color: '#38bdf8',
        quotes: [
          '"Aha! Melinoë! Wash away these gloomy shades with the crushing power of the tides!"',
          '"Let the depths rise and crush the ancient Titan into the reef!"'
        ],
        boons: [
          { id: 'poseidon_strike', name: 'Wave Strike', slot: 'Attack', desc: 'Attacks blast enemies backward with heavy waves. Slashing foes into walls deals 110 wall-slam bonus damage!' },
          { id: 'poseidon_ring', name: 'Flood Ring', slot: 'Cast', desc: 'Your Cast circle erupts into a violent geyser, knocking all snared foes outward.' },
          { id: 'poseidon_dash', name: 'Tidal Dash', slot: 'Dash', desc: 'Dash unleashes a surging wave that propels you and slams enemies.' },
          { id: 'poseidon_special', name: 'Tsunami Special', slot: 'Special', desc: 'Special sickle creates a wide wave pushing back all enemies in front.' }
        ]
      },
      apollo: {
        name: 'Apollo',
        title: 'God of Light',
        portraitIndex: 3,
        color: '#fde047',
        quotes: [
          '"Radiance to guide your blade, Melinoë. Let us shine bright upon the shadows!"',
          '"Strike with solar brilliance and dazzle all who oppose your destiny."'
        ],
        boons: [
          { id: 'apollo_strike', name: 'Nova Strike', slot: 'Attack', desc: 'Attacks have +50% wider sweep radius and inflict Dazzle (enemies miss attacks).' },
          { id: 'apollo_ring', name: 'Solar Ring', slot: 'Cast', desc: 'Your Cast circle expands by +50% and triggers blinding solar flares.' },
          { id: 'apollo_special', name: 'Sunburst Special', slot: 'Special', desc: 'Special sickle creates a blinding explosion at the apex of its throw.' },
          { id: 'apollo_dash', name: 'Blinding Dash', slot: 'Dash', desc: 'Dashing blinds nearby foes for 2.5s.' }
        ]
      },
      selene: {
        name: 'Selene',
        title: 'Goddess of the Moon',
        portraitIndex: 4,
        color: '#c084fc',
        quotes: [
          '"The silver light guides you in the darkest hour, Witch of the Crossroads."',
          '"Invoke the Moon Hex, Melinoë, and pierce the shroud of Time itself."'
        ],
        boons: [
          { id: 'selene_hex_ray', name: 'Lunar Ray', slot: 'Hex', desc: 'Fires a continuous devastating moonlight laser beam dealing 550 total damage!' },
          { id: 'selene_hex_slow', name: 'Phase Shift', slot: 'Hex', desc: 'Slows down time for all enemies by 85% for 4.5 seconds.' },
          { id: 'selene_hex_meteor', name: 'Total Eclipse', slot: 'Hex', desc: 'Calls down a colossal lunar meteor after 1s, dealing 750 area damage.' },
          { id: 'selene_dash', name: 'Moon Cloak', slot: 'Dash', desc: 'Dashing grants invisibility and +50% critical strike chance on next hit.' }
        ]
      },
      hermes: {
        name: 'Hermes',
        title: 'God of Swiftness',
        portraitIndex: 5,
        color: '#fb923c',
        quotes: [
          '"Quick on your feet, coz! Time waits for no one, especially not Chronos!"',
          '"Speed is the greatest weapon against the Master of Time."'
        ],
        boons: [
          { id: 'hermes_speed', name: 'Nimble Mind', slot: 'Passive', desc: 'Attack and Special speed increased by +45%.' },
          { id: 'hermes_dash', name: 'Hyper Sprint', slot: 'Dash', desc: 'Gain +2 Dash charges and +60% movement speed for 2s after dashing.' },
          { id: 'hermes_dodge', name: 'Greater Evasion', slot: 'Passive', desc: 'Gain a flat 30% chance to completely dodge any incoming attack.' }
        ]
      },
      aphrodite: {
        name: 'Aphrodite',
        title: 'Goddess of Love',
        portraitIndex: 6,
        color: '#f43f5e',
        quotes: [
          '"Heartstrings weave fate, darling. Let them tremble before our beauty!"',
          '"A broken heart hurts worse than any blade, Melinoë."'
        ],
        boons: [
          { id: 'aphrodite_strike', name: 'Heartbreak Strike', slot: 'Attack', desc: 'Attacks deal +60% damage and inflict Weak, reducing enemy attack power by 35%.' },
          { id: 'aphrodite_dash', name: 'Passion Dash', slot: 'Dash', desc: 'Dashing releases a burst of charm petals that weaken nearby foes.' },
          { id: 'aphrodite_ring', name: 'Sweet Surrender', slot: 'Cast', desc: 'Cast circle causes snared enemies to take +50% bonus damage from all sources.' }
        ]
      },
      hephaestus: {
        name: 'Hephaestus',
        title: 'God of the Forge',
        portraitIndex: 7,
        color: '#ea580c',
        quotes: [
          '"Good steel and heavy blows! Let us forge Chronos into scrap metal!"',
          '"Feel the heat of the divine furnace in your strikes!"'
        ],
        boons: [
          { id: 'hephaestus_strike', name: 'Volcanic Strike', slot: 'Attack', desc: 'Every 4s, your next Attack unleashes a colossal volcanic blast for 280 damage.' },
          { id: 'hephaestus_armor', name: 'Heavy Armor', slot: 'Passive', desc: 'Gain +50 Max HP and 25% passive damage resistance.' },
          { id: 'hephaestus_ring', name: 'Molten Ring', slot: 'Cast', desc: 'Cast circle erupts with a molten crater dealing 180 area damage.' }
        ]
      },
      demeter: {
        name: 'Demeter',
        title: 'Goddess of Seasons',
        portraitIndex: 8,
        color: '#67e8f9',
        quotes: [
          '"Winter has arrived for the Underworld. Freeze them to brittle stone, granddaughter."',
          '"The cold preserves nothing that stands against us."'
        ],
        boons: [
          { id: 'demeter_strike', name: 'Frost Strike', slot: 'Attack', desc: 'Attacks inflict Chill, slowing enemy movement and attacks by up to 60%.' },
          { id: 'demeter_ring', name: 'Arctic Ring', slot: 'Cast', desc: 'Cast circle summons a freezing blizzard vortex that continuously chills foes.' },
          { id: 'demeter_dash', name: 'Glacial Dash', slot: 'Dash', desc: 'Dash leaves freezing icicles that shatter when stepped on for 80 damage.' }
        ]
      },
      ares: {
        name: 'Ares',
        title: 'God of War',
        portraitIndex: 9,
        color: '#dc2626',
        quotes: [
          '"Carnage is the true destiny of the Underworld. Let blood flow!"',
          '"A glorious battle awaits us, Melinoë. Slay them all."'
        ],
        boons: [
          { id: 'ares_strike', name: 'Curse of Agony', slot: 'Attack', desc: 'Attacks inflict Doom, dealing 130 delayed explosive damage after 1.1 seconds.' },
          { id: 'ares_ring', name: 'Blade Rift', slot: 'Cast', desc: 'Cast circle summons a spinning blade rift that tears through enemies for 240 dmg.' },
          { id: 'ares_passive', name: 'Battle Rage', slot: 'Passive', desc: 'Slaying any enemy grants +50% damage boost for 5 seconds.' }
        ]
      }
    };

    // --- DUO BOON SYNERGY SYSTEM ---
    const DUO_BOONS = [
      {
        id: 'duo_sea_storm',
        name: 'Sea Storm',
        gods: ['Poseidon', 'Zeus'],
        reqs: [['poseidon_strike', 'poseidon_dash', 'poseidon_ring'], ['zeus_strike', 'zeus_ring', 'zeus_dash']],
        desc: 'Whenever your wave knockback effects slam enemies, instant chain lightning strikes them for 60 damage!'
      },
      {
        id: 'duo_plasma',
        name: 'Plasma Discharge',
        gods: ['Zeus', 'Hestia'],
        reqs: [['zeus_strike', 'zeus_ring'], ['hestia_strike', 'hestia_ring', 'hestia_dash']],
        desc: 'Chain lightning ignites Scorch on all targets, making burn damage tick twice as fast with secondary spark bursts.'
      },
      {
        id: 'duo_supernova',
        name: 'Supernova',
        gods: ['Apollo', 'Hestia'],
        reqs: [['apollo_strike', 'apollo_ring'], ['hestia_strike', 'hestia_ring']],
        desc: 'Scorched enemies detonate upon death in a massive 220px blinding solar nova dealing 180 damage.'
      },
      {
        id: 'duo_blizzard',
        name: 'Blizzard Cyclone',
        gods: ['Poseidon', 'Demeter'],
        reqs: [['poseidon_ring', 'poseidon_strike'], ['demeter_ring', 'demeter_strike']],
        desc: 'Cast circle becomes a permanent freezing water cyclone that pulls in all enemies and inflicts Chill.'
      },
      {
        id: 'duo_heartbreak_doom',
        name: 'Heartbreak Doom',
        gods: ['Aphrodite', 'Ares'],
        reqs: [['aphrodite_strike', 'aphrodite_dash'], ['ares_strike', 'ares_ring']],
        desc: 'Weakened foes immediately trigger continuous Doom blade rifts whenever they take attack damage.'
      },
      {
        id: 'duo_freezing_inferno',
        name: 'Freezing Inferno',
        gods: ['Hestia', 'Demeter'],
        reqs: [['hestia_strike', 'hestia_dash'], ['demeter_strike', 'demeter_ring']],
        desc: 'Enemies afflicted with both Scorch and Chill suffer Steam Shock, taking +150% critical damage from all attacks.'
      },
      {
        id: 'duo_volcanic_flash',
        name: 'Volcanic Flash',
        gods: ['Hephaestus', 'Zeus'],
        reqs: [['hephaestus_strike', 'hephaestus_ring'], ['zeus_strike', 'zeus_ring']],
        desc: 'Hephaestus volcanic blasts trigger chain lightning to all surrounding targets across the arena.'
      },
      {
        id: 'duo_sunlit_moon',
        name: 'Sunlit Moon',
        gods: ['Apollo', 'Selene'],
        reqs: [['apollo_strike', 'apollo_ring'], ['selene_hex_ray', 'selene_hex_slow', 'selene_hex_meteor']],
        desc: 'Selene Hexes charge +100% faster and gain +100% blast radius with blinding solar brilliance.'
      }
    ];

    // --- GAME STATE ---
    const gameState = {
      chamber: 1,
      maxChambers: 100,
      chamberType: 'normal',
      enemiesCleared: false,
      kills: 0,
      gold: 60,
      ashes: 10,
      bones: 5,
      upgrades: {
        maxHp: 0,
        magick: 0,
        damage: 0,
        defiance: 1
      },
      equippedBoons: [],
      particles: [],
      projectiles: [],
      enemies: [],
      camera: { x: 0, y: 0 },
      isPaused: false,
      battleRageTimer: 0
    };

    // --- 30+ ENEMY DEFINITIONS (All standard enemies 2x stronger, Mini-bosses & 20x Chronos) ---
    const ENEMY_TYPES = {
      // 1. Mini-Bosses (Mapped to minibosses.webp: 2x2 grid)
      asterius_king: { name: 'Asterius — Minotaur King', isMiniBoss: true, maxHp: 8500, speed: 110, radius: 52, color: '#f59e0b', sheet: 'minibosses', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'miniboss_asterius' },
      hydra_prime: { name: 'Lernaean Bone Hydra Prime', isMiniBoss: true, maxHp: 16000, speed: 70, radius: 56, color: '#10b981', sheet: 'minibosses', cellX: 1, cellY: 0, cols: 2, rows: 2, behavior: 'miniboss_hydra' },
      hecate_matron: { name: 'Hecate — Witch Matron', isMiniBoss: true, maxHp: 26000, speed: 120, radius: 48, color: '#8b5cf6', sheet: 'minibosses', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'miniboss_hecate' },
      cerberus_prime: { name: 'Cerberus Prime — Infernal Guardian', isMiniBoss: true, maxHp: 38000, speed: 180, radius: 55, color: '#ef4444', sheet: 'minibosses', cellX: 1, cellY: 1, cols: 2, rows: 2, behavior: 'miniboss_cerberus' },

      // 2. Monsters & Beasts (Mapped to monsters_beasts.webp: 3x2 grid) (HP 2x)
      minotaur_brute: { name: 'Minotaur Brute', maxHp: 840, speed: 90, radius: 40, color: '#b91c1c', sheet: 'monsters_beasts', cellX: 0, cellY: 0, cols: 3, rows: 2, behavior: 'bull_rush' },
      cerberus_hound: { name: 'Cerberus Houndling', maxHp: 580, speed: 190, radius: 32, color: '#b45309', sheet: 'monsters_beasts', cellX: 1, cellY: 0, cols: 3, rows: 2, behavior: 'triple_fireball' },
      tartarus_behemoth: { name: 'Tartarus Behemoth', maxHp: 1200, speed: 60, radius: 48, color: '#78716c', sheet: 'monsters_beasts', cellX: 2, cellY: 0, cols: 3, rows: 2, behavior: 'earthquake' },
      cyclops_smasher: { name: 'Cyclops Smasher', maxHp: 880, speed: 75, radius: 42, color: '#71717a', sheet: 'monsters_beasts', cellX: 0, cellY: 1, cols: 3, rows: 2, behavior: 'quad_boulder_slam' },
      gorgon_viper: { name: 'Gorgon Viper', maxHp: 290, speed: 180, radius: 25, color: '#15803d', sheet: 'monsters_beasts', cellX: 1, cellY: 1, cols: 3, rows: 2, behavior: 'poison_fan' },
      lava_crag_crab: { name: 'Lava Crag Crab', maxHp: 680, speed: 110, radius: 35, color: '#c2410c', sheet: 'monsters_beasts', cellX: 2, cellY: 1, cols: 3, rows: 2, behavior: 'magma_dropper' },

      // 3. Undead & Cultists (Mapped to undead_cultists.webp: 3x2 grid) (HP 2x)
      bloodless_screamer: { name: 'Bloodless Screamer', maxHp: 200, speed: 230, radius: 22, color: '#f43f5e', sheet: 'undead_cultists', cellX: 0, cellY: 0, cols: 3, rows: 2, behavior: 'screamer' },
      satyr_cultist: { name: 'Satyr Cultist', maxHp: 260, speed: 175, radius: 25, color: '#84cc16', sheet: 'undead_cultists', cellX: 1, cellY: 0, cols: 3, rows: 2, behavior: 'poison_darts' },
      phantasm_cloaker: { name: 'Phantasm Cloaker', maxHp: 240, speed: 160, radius: 24, color: '#9333ea', sheet: 'undead_cultists', cellX: 2, cellY: 0, cols: 3, rows: 2, behavior: 'stealth_backstab' },
      doom_herald: { name: 'Doom Herald', maxHp: 520, speed: 110, radius: 32, color: '#ef4444', sheet: 'undead_cultists', cellX: 0, cellY: 1, cols: 3, rows: 2, behavior: 'doom_runes' },
      bone_chariot: { name: 'Bone Chariot', maxHp: 500, speed: 310, radius: 32, color: '#d97706', sheet: 'undead_cultists', cellX: 1, cellY: 1, cols: 3, rows: 2, behavior: 'wall_bounce_charger' },
      automaton_sentry: { name: 'Automaton Sentry', maxHp: 640, speed: 0, radius: 34, color: '#ca8a04', sheet: 'undead_cultists', cellX: 2, cellY: 1, cols: 3, rows: 2, behavior: 'dual_laser_turret' },

      // 4. Shades & Swarmers (Mapped to shade.webp) (HP 2x)
      shade_wretch: { name: 'Shade Wretch', maxHp: 170, speed: 200, radius: 24, color: '#2ae6b4', sheet: 'shade', behavior: 'swarmer' },
      shade_bruiser: { name: 'Shade Bruiser', maxHp: 560, speed: 85, radius: 36, color: '#0891b2', sheet: 'shade', behavior: 'slammer' },
      blast_beetle: { name: 'Blast Beetle', maxHp: 150, speed: 260, radius: 20, color: '#dc2626', sheet: 'shade', behavior: 'kamikaze_bomber' },
      clockwork_saw: { name: 'Clockwork Saw', maxHp: 360, speed: 270, radius: 24, color: '#eab308', sheet: 'shade', behavior: 'blade_bouncer' },
      stygian_jellyfish: { name: 'Stygian Jellyfish', maxHp: 350, speed: 70, radius: 30, color: '#06b6d4', sheet: 'shade', behavior: 'electric_pulse_ring' },
      hydra_spawn: { name: 'Hydra Spawn', maxHp: 580, speed: 85, radius: 33, color: '#16a34a', sheet: 'shade', behavior: 'bouncing_acid_triad' },
      shadow_reaper: { name: 'Shadow Reaper', maxHp: 340, speed: 140, radius: 28, color: '#6366f1', sheet: 'shade', behavior: 'teleport_scythe' },
      void_lurker: { name: 'Void Lurker', maxHp: 310, speed: 165, radius: 26, color: '#4c1d95', sheet: 'shade', behavior: 'burrow_eruption' },

      // 5. Casters (Mapped to witch.webp) (HP 2x)
      witch_siren: { name: 'Witch Siren', maxHp: 280, speed: 120, radius: 28, color: '#a855f7', sheet: 'witch', behavior: 'triple_orb' },
      witch_archmage: { name: 'Witch Archmage', maxHp: 420, speed: 95, radius: 30, color: '#c084fc', sheet: 'witch', behavior: 'pentagram_mortar' },
      flame_cultist: { name: 'Flame Cultist', maxHp: 320, speed: 115, radius: 26, color: '#ea580c', sheet: 'witch', behavior: 'flamethrower' },
      frost_banshee: { name: 'Frost Banshee', maxHp: 350, speed: 130, radius: 27, color: '#38bdf8', sheet: 'witch', behavior: 'frost_spiral' },
      chrono_mage: { name: 'Chrono-Mage', maxHp: 480, speed: 105, radius: 30, color: '#fbbf24', sheet: 'witch', behavior: 'time_rift' },
      time_weever: { name: 'Time Weever', maxHp: 380, speed: 125, radius: 27, color: '#eab308', sheet: 'witch', behavior: 'time_tether_bombs' },
      sirens_choir: { name: 'Sirens Choir', maxHp: 400, speed: 110, radius: 28, color: '#ec4899', sheet: 'witch', behavior: 'charm_pulse' },
      soul_necromancer: { name: 'Soul Necromancer', maxHp: 460, speed: 100, radius: 29, color: '#8b5cf6', sheet: 'witch', behavior: 'summon_skeleton_shades' },

      // 6. Elite & Final Boss (CHRONOS 20X STRONGER = 68,000 HP!)
      chronos_vanguard: { name: 'Chronos Vanguard', maxHp: 720, speed: 110, radius: 36, color: '#d97706', sheet: 'chronos', behavior: 'shield_spearman' },
      chronos: { name: 'Chronos — Titan of Time (Colossal)', isBoss: true, maxHp: 68000, speed: 115, radius: 64, color: '#eab308', sheet: 'chronos', behavior: 'titan_boss_20x' }
    };

    // --- PLAYER CLASS (Special Nerfed by 80%) ---
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

        this.attackCombo = 0;
        this.attackTimer = 0;
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
        this.maxHp = this.baseMaxHp + gameState.upgrades.maxHp * 20;
        if (hasBoon('hephaestus_armor')) this.maxHp += 50;
        this.hp = this.maxHp;
        this.maxMagick = this.baseMagick + gameState.upgrades.magick * 15;
        this.magick = this.maxMagick;
        this.x = 0;
        this.y = 220;
        this.hexCharge = 0;
        this.castActive = null;
        this.isDashing = false;
        gameState.equippedBoons = [];
        updateHUD();
      }

      update(dt) {
        if (this.magick < this.maxMagick) {
          this.magick = Math.min(this.maxMagick, this.magick + dt * 7);
        }

        if (this.iFrames > 0) this.iFrames -= dt;
        if (this.attackTimer > 0) this.attackTimer -= dt;
        if (this.specialCooldown > 0) this.specialCooldown -= dt;
        if (this.dashCooldown > 0) this.dashCooldown -= dt;
        if (gameState.battleRageTimer > 0) gameState.battleRageTimer -= dt;

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
            const spd = this.speed * (hasBoon('hermes_dash') ? 1.25 : 1.0);
            this.moveWithCollision(moveX * spd * dt, moveY * spd * dt);
            this.animRow = 1;
          } else {
            this.animRow = 0;
          }

          if (this.attackTimer > 0) {
            this.animRow = 2;
          }
        }

        this.animTimer += dt;
        if (this.animTimer > 0.12) {
          this.animTimer = 0;
          this.animFrame = (this.animFrame + 1) % 4;
        }

        if (this.castActive) {
          this.castActive.timer -= dt;

          if (hasBoon('duo_blizzard')) {
            gameState.enemies.forEach(e => {
              const d = Math.hypot(e.x - this.castActive.x, e.y - this.castActive.y);
              if (d < 300) {
                const ang = Math.atan2(this.castActive.y - e.y, this.castActive.x - e.x);
                e.x += Math.cos(ang) * 90 * dt;
                e.y += Math.sin(ang) * 90 * dt;
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
        const atkSpdMod = hasBoon('hermes_speed') ? 0.6 : 1.0;
        if (this.attackTimer > 0 || this.isDashing || gameState.isPaused) return;
        this.attackTimer = 0.22 * atkSpdMod;
        this.attackCombo = (this.attackCombo + 1) % 3;
        sound.playSlash();

        let baseDmg = 38 + (this.attackCombo === 2 ? 32 : 0);
        baseDmg *= (1 + gameState.upgrades.damage * 0.1);
        if (gameState.battleRageTimer > 0) baseDmg *= 1.5;
        if (hasBoon('aphrodite_strike')) baseDmg *= 1.6;

        const attackRange = hasBoon('apollo_strike') ? 150 : 105;
        const attackArc = Math.PI * 0.7;

        gameState.particles.push(new AnimatedAttackSweep(this.x, this.y, this.angle, attackRange, this.attackCombo));

        gameState.enemies.forEach(enemy => {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= attackRange + enemy.radius) {
            const angleToEnemy = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angleToEnemy - this.angle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            if (angleDiff <= attackArc / 2) {
              let finalDmg = baseDmg;
              if (enemy.isWeak && hasBoon('aphrodite_ring')) finalDmg *= 1.5;
              if (enemy.scorchStacks > 0 && enemy.chillStacks > 0 && hasBoon('duo_freezing_inferno')) finalDmg *= 2.5;

              enemy.takeDamage(finalDmg, 'player');
              sound.playHit();
              this.hexCharge = Math.min(this.hexMax, this.hexCharge + 12);
              updateHUD();

              gameState.particles.push(new HitSpark(enemy.x, enemy.y, '#2ae6b4'));

              if (hasBoon('hephaestus_strike') && this.volcanicReady) {
                this.volcanicReady = false;
                enemy.takeDamage(280, 'volcanic');
                sound.playExplosion();
                createScreenShake(14);
                gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 160));
                if (hasBoon('duo_volcanic_flash')) {
                  procChainLightning(enemy, 65);
                }
              }

              if (hasBoon('ares_strike')) {
                enemy.applyDoom(130);
              }

              if (hasBoon('demeter_strike')) {
                enemy.applyChill(3.5);
              }

              if (hasBoon('zeus_strike')) {
                procChainLightning(enemy, 45);
              }

              if (hasBoon('hestia_strike')) {
                enemy.applyScorch(80);
                gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 70));
              }

              if (hasBoon('poseidon_strike')) {
                const knockDist = 110;
                const targetX = enemy.x + Math.cos(this.angle) * knockDist;
                const targetY = enemy.y + Math.sin(this.angle) * knockDist;
                gameState.particles.push(new AnimatedWaterWave(enemy.x, enemy.y, this.angle, 90));

                if (hasBoon('duo_sea_storm')) {
                  procChainLightning(enemy, 60);
                }

                if (checkWallCollision(targetX, targetY, enemy.radius)) {
                  enemy.takeDamage(110, 'slam');
                  sound.playExplosion();
                  createScreenShake(8);
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
        const atkSpdMod = hasBoon('hermes_speed') ? 0.6 : 1.0;
        if (this.specialCooldown > 0 || gameState.isPaused) return;
        this.specialCooldown = 0.48 * atkSpdMod;
        sound.playSlash();

        const spd = 580;
        // NERFED BY 80%: Base damage 10.4 (down from 52)
        let specDmg = 10.4 * (1 + gameState.upgrades.damage * 0.1);
        if (gameState.battleRageTimer > 0) specDmg *= 1.5;

        gameState.projectiles.push(new Projectile(
          this.x, this.y,
          Math.cos(this.angle) * spd,
          Math.sin(this.angle) * spd,
          specDmg,
          'moon_sickle',
          this
        ));
      }

      triggerCast() {
        if (gameState.isPaused) return;
        if (this.magick < 10 && !this.castActive) return;

        if (!this.castActive) {
          this.magick -= 10;
          updateHUD();
          sound.playCast();
          const targetX = mouse.x + gameState.camera.x - canvas.width / 2;
          const targetY = mouse.y + gameState.camera.y - canvas.height / 2;
          const radius = hasBoon('apollo_ring') ? 180 : 120;
          this.castActive = {
            x: targetX,
            y: targetY,
            radius: radius,
            timer: 3.0,
            angle: 0
          };
        } else {
          this.detonateCast();
        }
      }

      detonateCast() {
        if (!this.castActive) return;
        sound.playExplosion();
        createScreenShake(10);
        const radius = this.castActive.radius;
        let dmg = 105 * (1 + gameState.upgrades.damage * 0.1);

        gameState.enemies.forEach(enemy => {
          const dist = Math.hypot(enemy.x - this.castActive.x, enemy.y - this.castActive.y);
          if (dist <= radius + enemy.radius) {
            enemy.takeDamage(dmg, 'cast');
            if (hasBoon('hestia_ring')) {
              enemy.applyScorch(120);
              gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 80));
            }
            if (hasBoon('zeus_ring')) {
              procChainLightning(enemy, 55);
            }
            if (hasBoon('hephaestus_ring')) {
              enemy.takeDamage(180, 'volcanic');
              gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 140));
            }
            if (hasBoon('ares_ring')) {
              enemy.takeDamage(240, 'doom');
              gameState.particles.push(new Shockwave(enemy.x, enemy.y, 120, '#dc2626'));
            }
            if (hasBoon('poseidon_ring')) {
              const ang = Math.atan2(enemy.y - this.castActive.y, enemy.x - this.castActive.x);
              enemy.x += Math.cos(ang) * 110;
              enemy.y += Math.sin(ang) * 110;
              gameState.particles.push(new AnimatedWaterWave(enemy.x, enemy.y, ang, 90));
            }
          }
        });

        gameState.particles.push(new AnimatedFireExplosion(this.castActive.x, this.castActive.y, radius * 1.3));
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

        const dashSpeed = 820;
        this.dashVx = moveX * dashSpeed;
        this.dashVy = moveY * dashSpeed;

        if (hasBoon('zeus_dash')) {
          sound.playLightning();
          for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*340, Math.sin(a)*340, 32, 'spark', this));
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
      }

      triggerHex() {
        if (this.hexCharge < this.hexMax || gameState.isPaused) return;
        this.hexCharge = 0;
        updateHUD();
        sound.playExplosion();
        createScreenShake(15);

        const radiusBoost = hasBoon('duo_sunlit_moon') ? 2.0 : 1.0;

        if (hasBoon('selene_hex_ray')) {
          const rayLength = 750 * radiusBoost;
          for (let i = 0; i < 18; i++) {
            setTimeout(() => {
              gameState.enemies.forEach(e => {
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < rayLength) {
                  const ang = Math.atan2(e.y - this.y, e.x - this.x);
                  if (Math.abs(ang - this.angle) < 0.38) {
                    e.takeDamage(48, 'hex');
                  }
                }
              });
            }, i * 28);
          }
          gameState.particles.push(new LunarRayEffect(this.x, this.y, this.angle, rayLength));
        } else if (hasBoon('selene_hex_slow')) {
          gameState.enemies.forEach(e => e.timeSlowTimer = 4.5);
          gameState.particles.push(new Shockwave(this.x, this.y, 600 * radiusBoost, '#c084fc'));
        } else {
          const targetX = mouse.x + gameState.camera.x - canvas.width / 2;
          const targetY = mouse.y + gameState.camera.y - canvas.height / 2;
          setTimeout(() => {
            sound.playExplosion();
            createScreenShake(20);
            gameState.enemies.forEach(e => {
              if (Math.hypot(e.x - targetX, e.y - targetY) < 220 * radiusBoost) {
                e.takeDamage(750, 'hex');
              }
            });
            gameState.particles.push(new AnimatedFireExplosion(targetX, targetY, 220 * radiusBoost));
          }, 550);
        }
      }

      takeDamage(amount) {
        if (this.iFrames > 0 || gameState.isPaused) return;

        if (hasBoon('hermes_dodge') && Math.random() < 0.3) {
          gameState.particles.push(new FloatingText(this.x, this.y - 28, 'DODGED!', '#fb923c'));
          sound.playDash();
          return;
        }

        let finalDmg = amount;
        if (hasBoon('hephaestus_armor')) finalDmg *= 0.75;
        finalDmg = Math.round(finalDmg);

        this.hp -= finalDmg;
        this.iFrames = 0.6;
        sound.playHit();
        createScreenShake(8);
        updateHUD();

        gameState.particles.push(new FloatingText(this.x, this.y - 24, `-${finalDmg}`, '#ef4444'));

        if (this.hp <= 0) {
          if (gameState.upgrades.defiance > 0) {
            gameState.upgrades.defiance--;
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
        ctx.save();
        ctx.translate(this.x, this.y);

        // Cast Circle Draw
        if (this.castActive) {
          ctx.save();
          const cleanFx = loadedImages['clean_fx'];
          if (cleanFx && cleanFx.complete) {
            ctx.save();
            ctx.translate(this.castActive.x - this.x, this.castActive.y - this.y);
            this.castActive.angle += 0.02;
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
        if (heroImg && heroImg.complete) {
          const cellW = heroImg.width / 4;
          const cellH = heroImg.height / 4;
          const sx = this.animFrame * cellW;
          const sy = this.animRow * cellH;

          const facingLeft = Math.cos(this.angle) < 0;
          if (facingLeft) ctx.scale(-1, 1);

          ctx.drawImage(heroImg, sx, sy, cellW, cellH, -52, -66, 105, 105);
        }

        ctx.restore();
      }
    }

    const player = new Player();

    // --- ENEMY CLASS (Supports Mini-Bosses & 20x Chronos) ---
    class Enemy {
      constructor(x, y, typeKey) {
        this.x = x;
        this.y = y;
        this.typeKey = typeKey;
        const conf = ENEMY_TYPES[typeKey] || ENEMY_TYPES['shade_wretch'];
        this.name = conf.name;
        this.isBoss = conf.isBoss || false;
        this.isMiniBoss = conf.isMiniBoss || false;

        // Scale HP based on Chamber depth
        const depthMult = 1.0 + (gameState.chamber - 1) * 0.025;
        this.maxHp = Math.round(conf.maxHp * (this.isBoss || this.isMiniBoss ? 1.0 : depthMult));
        this.hp = this.maxHp;
        this.speed = conf.speed;
        this.baseSpeed = conf.speed;
        this.radius = conf.radius;
        this.color = conf.color;
        this.sheet = conf.sheet;
        this.cellX = conf.cellX !== undefined ? conf.cellX : 0;
        this.cellY = conf.cellY !== undefined ? conf.cellY : 0;
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
        let speedMult = 1.0;
        if (this.timeSlowTimer > 0) {
          this.timeSlowTimer -= dt;
          speedMult *= 0.15;
        }
        if (this.chillTimer > 0) {
          this.chillTimer -= dt;
          speedMult *= 0.5;
        }

        const effectiveDt = dt * speedMult;

        if (this.scorchTimer > 0) {
          this.scorchTimer -= dt;
          const tickRate = hasBoon('duo_plasma') ? 2.0 : 1.0;
          this.takeDamage(this.scorchStacks * dt * tickRate, 'scorch', true);
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
        const dist = Math.hypot(dx, dy);
        this.angle = Math.atan2(dy, dx);

        // Update Boss / Mini-Boss HUD
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

        // --- MINI-BOSS BEHAVIORS ---
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
          // FINAL BOSS: CHRONOS 20X STRONGER
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
        // --- STANDARD ENEMY BEHAVIORS ---
        else if (this.behavior === 'swarmer') {
          if (dist > 45) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          else if (this.attackCooldown <= 0) this.startTelegraph('circle', 0.45, 60);
        } else if (this.behavior === 'slammer') {
          if (dist > 75) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          else if (this.attackCooldown <= 0) this.startTelegraph('circle', 0.7, 130);
        } else if (this.behavior === 'triple_orb') {
          if (dist < 200) this.moveWithCollision(-(dx / dist) * moveSpeed * effectiveDt, -(dy / dist) * moveSpeed * effectiveDt);
          else if (dist > 360) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0 && dist < 500) this.startTelegraph('line', 0.6, 400);
        } else if (this.behavior === 'pentagram_mortar') {
          if (dist < 260) this.moveWithCollision(-(dx / dist) * moveSpeed * effectiveDt, -(dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) this.startTelegraph('mortar', 0.8, 140);
        } else if (this.behavior === 'poison_fan' || this.behavior === 'poison_darts') {
          if (dist > 180) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) this.startTelegraph('fan', 0.5, 300);
        } else if (this.behavior === 'screamer') {
          this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0 && dist < 120) this.startTelegraph('ring', 0.4, 150);
        } else if (this.behavior === 'bull_rush') {
          if (this.attackCooldown <= 0 && dist < 420) this.startTelegraph('rush', 0.75, 450);
          else this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
        } else if (this.behavior === 'dual_laser_turret') {
          this.angle += effectiveDt * 1.2;
          if (this.attackCooldown <= 0) {
            this.attackCooldown = 0.15;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(this.angle)*360, Math.sin(this.angle)*360, 24, 'laser_shard', this));
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(this.angle+Math.PI)*360, Math.sin(this.angle+Math.PI)*360, 24, 'laser_shard', this));
          }
        } else if (this.behavior === 'magma_dropper') {
          this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (Math.random() < 0.05) gameState.particles.push(new FireTrail(this.x, this.y));
          if (this.attackCooldown <= 0) this.startTelegraph('fan', 0.6, 280);
        } else if (this.behavior === 'teleport_scythe' || this.behavior === 'stealth_backstab') {
          if (this.attackCooldown <= 0) {
            this.x = player.x - Math.cos(player.angle) * 70;
            this.y = player.y - Math.sin(player.angle) * 70;
            this.startTelegraph('circle', 0.5, 120);
          }
        } else if (this.behavior === 'earthquake' || this.behavior === 'quad_boulder_slam') {
          if (dist > 90) this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (this.attackCooldown <= 0) this.startTelegraph('earthquake', 0.9, 200);
        } else if (this.behavior === 'wall_bounce_charger' || this.behavior === 'blade_bouncer') {
          this.x += this.vx * effectiveDt;
          this.y += this.vy * effectiveDt;
          if (checkWallCollision(this.x, this.y, this.radius)) {
            this.vx = -this.vx;
            this.vy = -this.vy;
          }
          if (Math.hypot(player.x - this.x, player.y - this.y) < this.radius + player.radius) {
            player.takeDamage(38);
          }
        } else if (this.behavior === 'kamikaze_bomber') {
          this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
          if (dist < 48) this.startTelegraph('circle', 0.35, 120);
        } else if (this.behavior === 'flamethrower') {
          if (this.attackCooldown <= 0 && dist < 280) this.startTelegraph('flame_cone', 0.6, 260);
          else this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
        } else if (this.behavior === 'frost_spiral') {
          if (this.attackCooldown <= 0) this.startTelegraph('ring', 0.5, 200);
          else this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
        } else if (this.behavior === 'triple_fireball') {
          if (this.attackCooldown <= 0 && dist < 360) this.startTelegraph('fan', 0.55, 340);
          else this.moveWithCollision((dx / dist) * moveSpeed * effectiveDt, (dy / dist) * moveSpeed * effectiveDt);
        } else if (this.behavior === 'bouncing_acid_triad') {
          if (this.attackCooldown <= 0 && dist < 400) this.startTelegraph('fan', 0.6, 320);
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
        this.telegraphTimer = duration;
        this.telegraphMax = duration;
        this.telegraphParam = radiusOrRange;
        this.telegraphAngle = this.angle;
        this.telegraphTarget = { x: player.x, y: player.y };
        this.animRow = 2;
      }

      executeAttack() {
        this.animRow = 0;
        this.attackCooldown = (this.isBoss || this.isMiniBoss ? 1.4 : 1.8) + Math.random() * 1.0;
        const distToPlayer = Math.hypot(player.x - this.x, player.y - this.y);

        // --- MINI-BOSS EXECUTIONS ---
        if (this.telegraphType === 'boss_axe_cleave') {
          sound.playSlash();
          createScreenShake(12);
          if (distToPlayer <= this.telegraphParam + player.radius) player.takeDamage(65);
          for (let i = -2; i <= 2; i++) {
            const a = this.telegraphAngle + i * 0.25;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*340, Math.sin(a)*340, 32, 'whirling_blade', this));
          }
        } else if (this.telegraphType === 'boss_leap_slam') {
          sound.playExplosion();
          createScreenShake(16);
          this.x = this.telegraphTarget.x;
          this.y = this.telegraphTarget.y;
          if (Math.hypot(player.x - this.x, player.y - this.y) <= 150) player.takeDamage(75);
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
          if (distToPlayer < 200) player.takeDamage(60);
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
            player.takeDamage(45);
            player.iFrames = 0.2;
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
          if (Math.hypot(player.x - this.x, player.y - this.y) <= 160) player.takeDamage(80);
          gameState.particles.push(new AnimatedFireExplosion(this.x, this.y, 200));
        }
        // --- 20X CHRONOS EXECUTIONS ---
        else if (this.telegraphType === 'boss_scythe') {
          sound.playSlash();
          createScreenShake(18);
          if (distToPlayer < 200) player.takeDamage(85);
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
          player.takeDamage(45);
        } else if (this.telegraphType === 'chronos_orbital_lasers') {
          sound.playLightning();
          for (let i = 0; i < 24; i++) {
            const a = (i / 24) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*380, Math.sin(a)*380, 48, 'time_shard', this));
          }
        } else if (this.telegraphType === 'chronos_blitz') {
          sound.playSlash();
          createScreenShake(20);
          this.x = player.x - Math.cos(player.angle) * 80;
          this.y = player.y - Math.sin(player.angle) * 80;
          if (Math.hypot(player.x - this.x, player.y - this.y) < 140) player.takeDamage(90);
          gameState.particles.push(new Shockwave(this.x, this.y, 180, '#facc15'));
        }
        // --- STANDARD ATTACK EXECUTIONS ---
        else if (this.telegraphType === 'circle' || this.telegraphType === 'slam') {
          sound.playSlash();
          createScreenShake(6);
          if (distToPlayer <= this.telegraphParam + player.radius) {
            player.takeDamage(this.behavior === 'kamikaze_bomber' ? 70 : 44);
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
        } else if (this.telegraphType === 'fan') {
          sound.playCast();
          const projType = (this.behavior === 'triple_fireball' || this.behavior === 'magma_dropper') ? 'magma_ball' : (this.behavior === 'bouncing_acid_triad' ? 'bouncing_acid' : 'poison_dart');
          for (let i = -2; i <= 2; i++) {
            const a = this.telegraphAngle + i * 0.18;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*320, Math.sin(a)*320, 36, projType, this));
          }
        } else if (this.telegraphType === 'mortar') {
          sound.playExplosion();
          const target = this.telegraphTarget;
          setTimeout(() => {
            sound.playExplosion();
            createScreenShake(10);
            if (Math.hypot(player.x - target.x, player.y - target.y) <= 80) player.takeDamage(60);
            gameState.particles.push(new AnimatedFireExplosion(target.x, target.y, 130));
          }, 400);
        } else if (this.telegraphType === 'ring') {
          sound.playExplosion();
          createScreenShake(8);
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*240, Math.sin(a)*240, 38, 'frost_shard', this));
          }
        } else if (this.telegraphType === 'rush') {
          sound.playSlash();
          const rushDist = 380;
          this.x += Math.cos(this.telegraphAngle) * rushDist;
          this.y += Math.sin(this.telegraphAngle) * rushDist;
          if (Math.hypot(player.x - this.x, player.y - this.y) < 70) player.takeDamage(65);
          createScreenShake(12);
        } else if (this.telegraphType === 'eruption') {
          this.isBurrowed = false;
          this.x = this.telegraphTarget.x;
          this.y = this.telegraphTarget.y;
          sound.playExplosion();
          createScreenShake(10);
          if (Math.hypot(player.x - this.x, player.y - this.y) < 80) player.takeDamage(60);
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
        this.scorchStacks += amount;
        this.scorchTimer = 3.0;
      }

      applyChill(duration) {
        this.chillStacks++;
        this.chillTimer = duration;
      }

      applyDoom(amount) {
        this.doomDamage = amount;
        this.doomTimer = 1.1;
      }

      takeDamage(amount, source = 'normal', silent = false) {
        const intDmg = Math.round(amount);
        this.hp -= intDmg;

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
        const idx = gameState.enemies.indexOf(this);
        if (idx !== -1) {
          gameState.enemies.splice(idx, 1);
          gameState.kills++;
          sound.playHit();

          if (hasBoon('ares_passive')) {
            gameState.battleRageTimer = 5.0;
          }

          if (hasBoon('duo_supernova') && this.scorchStacks > 0) {
            gameState.enemies.forEach(e => {
              if (Math.hypot(e.x - this.x, e.y - this.y) < 220) e.takeDamage(180, 'supernova');
            });
            gameState.particles.push(new AnimatedFireExplosion(this.x, this.y, 220));
          }

          const obols = (this.isBoss ? 200 : (this.isMiniBoss ? 80 : Math.floor(Math.random() * 6) + 4));
          const ashes = (this.isBoss ? 50 : (this.isMiniBoss ? 20 : 2));
          gameState.gold += obols;
          gameState.ashes += ashes;
          sound.playGold();
          updateHUD();

          gameState.particles.push(new Shockwave(this.x, this.y, this.radius * 2.2, this.color));

          if (this.isBoss) {
            document.getElementById('boss-hud').style.display = 'none';
            handleGameOver(true);
          } else if (this.isMiniBoss) {
            document.getElementById('boss-hud').style.display = 'none';
            onChamberCleared();
          } else if (gameState.enemies.length === 0) {
            onChamberCleared();
          }
        }
      }

      draw(ctx) {
        if (this.isBurrowed) return;

        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.isTelegraphing) {
          const progress = 1 - (this.telegraphTimer / this.telegraphMax);
          ctx.save();
          if (this.telegraphType === 'circle' || this.telegraphType === 'slam' || this.telegraphType === 'boss_axe_cleave' || this.telegraphType === 'hydra_slam' || this.telegraphType === 'cerberus_pounce') {
            ctx.beginPath();
            ctx.arc(0, 0, this.telegraphParam * progress, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.9)';
            ctx.lineWidth = 2.5;
            ctx.stroke();
          } else if (this.telegraphType === 'line' || this.telegraphType === 'rush' || this.telegraphType === 'chronos_blitz') {
            ctx.rotate(this.telegraphAngle);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(this.telegraphParam, 0);
            ctx.stroke();
          } else if (this.telegraphType === 'fan' || this.telegraphType === 'hydra_barrage' || this.telegraphType === 'cerberus_magma_breath') {
            ctx.rotate(this.telegraphAngle);
            ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, this.telegraphParam, -0.45, 0.45);
            ctx.closePath();
            ctx.fill();
          }
          ctx.restore();
        }

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
        if (img && img.complete) {
          const cellW = img.width / this.cols;
          const cellH = img.height / this.rows;
          let sx = (this.sheet === 'monsters_beasts' || this.sheet === 'undead_cultists' || this.sheet === 'minibosses') ? (this.cellX * cellW) : (this.animFrame * cellW);
          let sy = (this.sheet === 'monsters_beasts' || this.sheet === 'undead_cultists' || this.sheet === 'minibosses') ? (this.cellY * cellH) : (this.animRow * cellH);

          const facingLeft = Math.cos(this.angle) < 0;
          if (facingLeft) ctx.scale(-1, 1);

          const drawSize = this.radius * 3.6;
          ctx.drawImage(img, sx, sy, cellW, cellH, -drawSize/2, -drawSize/2, drawSize, drawSize);
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

    // --- PROJECTILE CLASS ---
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
      }

      update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;
        this.angle += dt * 18;

        if (this.type === 'moon_sickle' && this.lifetime < 0.65) {
          const dx = player.x - this.x;
          const dy = player.y - this.y;
          const dist = Math.hypot(dx, dy);
          this.vx = (dx / dist) * 620;
          this.vy = (dy / dist) * 620;
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
          gameState.enemies.forEach(enemy => {
            if (Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.radius + enemy.radius) {
              enemy.takeDamage(this.damage, 'projectile');
              sound.playHit();
              gameState.particles.push(new HitSpark(enemy.x, enemy.y, '#c084fc'));
              if (this.type !== 'moon_sickle') this.destroy();
            }
          });
        } else {
          if (Math.hypot(player.x - this.x, player.y - this.y) <= this.radius + player.radius) {
            player.takeDamage(this.damage);
            this.destroy();
          }
        }
      }

      destroy() {
        const idx = gameState.projectiles.indexOf(this);
        if (idx !== -1) gameState.projectiles.splice(idx, 1);
      }

      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const cleanFx = loadedImages['clean_fx'];
        const npImg = loadedImages['new_projectiles'];

        if (this.type === 'moon_sickle') {
          if (cleanFx && cleanFx.complete) {
            const sw = cleanFx.width / 2;
            const sh = cleanFx.height;
            ctx.drawImage(cleanFx, sw, 0, sw, sh, -24, -24, 48, 48);
          } else {
            ctx.strokeStyle = '#c084fc';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(0, 0, 22, 0, Math.PI * 1.3);
            ctx.stroke();
          }
        } else if (npImg && npImg.complete) {
          const cw = npImg.width / 4;
          const ch = npImg.height / 4;
          let cellCol = 0, cellRow = 0;
          if (this.type === 'poison_dart') { cellCol = 0; cellRow = 0; }
          else if (this.type === 'frost_shard') { cellCol = 1; cellRow = 0; }
          else if (this.type === 'magma_ball') { cellCol = 2; cellRow = 0; }
          else if (this.type === 'bouncing_acid') { cellCol = 3; cellRow = 0; }
          else if (this.type === 'doom_skull') { cellCol = 0; cellRow = 2; }
          else if (this.type === 'clockwork_bomb') { cellCol = 1; cellRow = 2; }
          else if (this.type === 'charm_heart') { cellCol = 2; cellRow = 2; }
          else if (this.type === 'whirling_blade') { cellCol = 3; cellRow = 2; }

          ctx.drawImage(npImg, cellCol * cw, cellRow * ch, cw, ch, -18, -18, 36, 36);
        } else {
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, 0, 8, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }
    }

    // --- ANIMATED ATTACK SWEEP & ELEMENTAL EFFECTS ---
    class AnimatedAttackSweep {
      constructor(x, y, angle, range, combo) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.range = range;
        this.combo = combo;
        this.life = 0.22;
        this.maxLife = 0.22;
        this.frame = 0;
      }
      update(dt) {
        this.life -= dt;
        const progress = 1 - (this.life / this.maxLife);
        this.frame = Math.min(3, Math.floor(progress * 4));
      }
      draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const animImg = loadedImages['attack_fx_anim'];
        if (animImg && animImg.complete) {
          const cw = animImg.width / 4;
          const ch = animImg.height / 4;
          const sx = this.frame * cw;
          const sy = 0;
          const drawW = this.range * 2.1;
          const drawH = this.range * 2.1;
          ctx.drawImage(animImg, sx, sy, cw, ch, -drawW * 0.15, -drawH / 2, drawW, drawH);
        } else {
          ctx.strokeStyle = '#2ae6b4';
          ctx.lineWidth = 6;
          ctx.beginPath();
          ctx.arc(0, 0, this.range, -Math.PI * 0.35, Math.PI * 0.35);
          ctx.stroke();
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
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        for (let i = 0; i < 4; i++) {
          const a = (i / 4) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(this.x, this.y);
          ctx.lineTo(this.x + Math.cos(a) * 20, this.y + Math.sin(a) * 20);
          ctx.stroke();
        }
        ctx.restore();
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
        ctx.save();
        ctx.translate(this.x, this.y);
        const animImg = loadedImages['attack_fx_anim'];
        if (animImg && animImg.complete) {
          const cw = animImg.width / 4;
          const ch = animImg.height / 4;
          const sx = this.frame * cw;
          const sy = ch;
          ctx.drawImage(animImg, sx, sy, cw, ch, -this.size/2, -this.size, this.size, this.size);
        }
        ctx.restore();
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
        ctx.save();
        ctx.translate(this.x, this.y);
        const animImg = loadedImages['attack_fx_anim'];
        if (animImg && animImg.complete) {
          const cw = animImg.width / 4;
          const ch = animImg.height / 4;
          const sx = this.frame * cw;
          const sy = ch * 2;
          ctx.drawImage(animImg, sx, sy, cw, ch, -this.size/2, -this.size/2, this.size, this.size);
        }
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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        const animImg = loadedImages['attack_fx_anim'];
        if (animImg && animImg.complete) {
          const cw = animImg.width / 4;
          const ch = animImg.height / 4;
          const sx = this.frame * cw;
          const sy = ch * 3;
          ctx.drawImage(animImg, sx, sy, cw, ch, -this.size/2, -this.size/2, this.size, this.size);
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
        gameState.enemies.forEach(e => {
          if (Math.hypot(e.x - this.x, e.y - this.y) < 35) {
            e.takeDamage(40 * dt, 'scorch', true);
          }
        });
      }
      draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(249, 115, 22, 0.45)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 25, 0, Math.PI * 2);
        ctx.fill();
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
        gameState.enemies.forEach(e => {
          if (Math.hypot(e.x - this.x, e.y - this.y) < 30) {
            e.takeDamage(80, 'frost');
            e.applyChill(3.0);
            this.life = 0;
          }
        });
      }
      draw(ctx) {
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 16, 0, Math.PI * 2);
        ctx.fill();
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
        gameState.enemies.forEach(e => {
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
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
      }
    }

    // --- ARENA TILES & WALL COLLISION ---
    const arena = {
      width: 1400,
      height: 900,
      pillars: [
        { x: -380, y: -220, radius: 42 },
        { x: 380, y: -220, radius: 42 },
        { x: -380, y: 220, radius: 42 },
        { x: 380, y: 220, radius: 42 }
      ],
      door: { x: 0, y: -410, radius: 48, isOpen: false }
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
      screenShake = intensity;
    }

    function hasBoon(boonId) {
      return gameState.equippedBoons.some(b => b.id === boonId);
    }

    function procChainLightning(initialEnemy, damage) {
      sound.playLightning();
      let current = initialEnemy;
      const hitList = [current];

      gameState.particles.push(new AnimatedLightningStrike(initialEnemy.x, initialEnemy.y, 140));

      for (let step = 0; step < 4; step++) {
        let closest = null;
        let minDist = 260;
        gameState.enemies.forEach(e => {
          if (!hitList.includes(e)) {
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

    // --- 100-CHAMBER PROGRESSION SYSTEM (Mini-bosses at 20, 40, 60, 80; Final Boss at 100) ---
    function startChamber(chamberIndex) {
      gameState.chamber = chamberIndex;
      gameState.enemiesCleared = false;
      arena.door.isOpen = false;
      gameState.projectiles = [];
      gameState.particles = [];
      player.x = 0;
      player.y = 260;

      const titleEl = document.getElementById('chamber-name');
      const subEl = document.getElementById('chamber-sub');
      const bossHud = document.getElementById('boss-hud');

      // 1. FINAL BOSS (Chamber 100)
      if (chamberIndex === 100) {
        gameState.chamberType = 'boss';
        titleEl.innerText = 'HOUSE OF CHRONOS — FINAL BATTLE (CHAMBER 100)';
        subEl.innerText = 'Chronos — The Master of Time (20x Strength)';
        bossHud.style.display = 'flex';
        gameState.enemies = [new Enemy(0, -180, 'chronos')];
      }
      // 2. MINI-BOSSES (Chambers 20, 40, 60, 80)
      else if (chamberIndex === 20) {
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
      // 3. SHOPS / SAFE HAVENS (Chambers 10, 30, 50, 70, 90)
      else if (chamberIndex % 20 === 10) {
        gameState.chamberType = 'shop';
        titleEl.innerText = `CHARON’S SAFE HAVEN — CHAMBER ${chamberIndex} / 100`;
        subEl.innerText = 'Replenish & Seek Divine Blessings';
        gameState.enemies = [];
        gameState.enemiesCleared = true;
        arena.door.isOpen = true;
        bossHud.style.display = 'none';
        showBoonSelection('selene');
      }
      // 4. STANDARD HARDCORE COMBAT CHAMBERS
      else {
        gameState.chamberType = 'normal';
        bossHud.style.display = 'none';

        let biomeName = 'EREBUS DEPTHS';
        if (chamberIndex > 80) biomeName = 'HOUSE OF CHRONOS GATEWAY';
        else if (chamberIndex > 60) biomeName = 'TEMPLE OF STYX';
        else if (chamberIndex > 40) biomeName = 'ELYSIUM GLADES';
        else if (chamberIndex > 20) biomeName = 'ASPHODEL MAGMA SEAS';

        titleEl.innerText = `${biomeName} — CHAMBER ${chamberIndex} / 100`;
        subEl.innerText = 'Underworld Depths (Enemies 2x Strength)';

        const count = 4 + Math.min(10, Math.floor(chamberIndex / 10) * 2);
        const availableKeys = Object.keys(ENEMY_TYPES).filter(k => !ENEMY_TYPES[k].isBoss && !ENEMY_TYPES[k].isMiniBoss);
        gameState.enemies = [];

        for (let i = 0; i < count; i++) {
          const typeKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
          const angle = Math.random() * Math.PI * 2;
          const dist = 200 + Math.random() * 280;
          gameState.enemies.push(new Enemy(Math.cos(angle) * dist, Math.sin(angle) * dist, typeKey));
        }
      }

      updateHUD();
    }

    function onChamberCleared() {
      gameState.enemiesCleared = true;
      arena.door.isOpen = true;
      sound.playBoonChime();

      const godKeys = Object.keys(GODS);
      const chosenGod = godKeys[Math.floor(Math.random() * godKeys.length)];
      setTimeout(() => {
        showBoonSelection(chosenGod);
      }, 600);
    }

    function showBoonSelection(godKey) {
      gameState.isPaused = true;
      const god = GODS[godKey] || GODS['zeus'];
      const modal = document.getElementById('boon-modal');
      const portraitCanvas = document.getElementById('god-portrait-canvas');
      const pctx = portraitCanvas.getContext('2d');
      pctx.clearRect(0, 0, 140, 140);

      const godsImg = loadedImages['all_10_gods'];
      if (godsImg && godsImg.complete) {
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

      choices.forEach(boon => {
        const card = document.createElement('div');
        card.className = `boon-card ${boon.isDuo ? 'duo-card' : ''}`;
        card.innerHTML = `
          <div>
            <div class="boon-rarity">${boon.isDuo ? '★ LEGENDARY DUO ★' : 'RARE BOON'}</div>
            <div class="boon-card-name">${boon.name}</div>
            <div class="boon-card-desc">${boon.desc}</div>
          </div>
          <div class="boon-card-slot">${boon.isDuo ? `Synergy: ${boon.gods.join(' + ')}` : `Slot: ${boon.slot}`}</div>
        `;
        card.onclick = () => {
          gameState.equippedBoons.push({ ...boon, godName: boon.isDuo ? boon.gods.join(' & ') : god.name });
          modal.style.display = 'none';
          gameState.isPaused = false;
          sound.playBoonChime();
          updateHUD();
        };
        container.appendChild(card);
      });

      modal.style.display = 'flex';
    }

    function handleGameOver(isVictory) {
      gameState.isPaused = true;
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
        sub.innerText = `Melinoë falls in Chamber ${gameState.chamber}. Return to the Altar of Ashes to grow stronger.`;
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

      const upgrades = [
        { key: 'maxHp', title: 'Titanic Vitality', desc: '+20 Max Health per rank', cost: 5 },
        { key: 'magick', title: 'Arcane Pool', desc: '+15 Max Magick per rank', cost: 5 },
        { key: 'damage', title: 'Witchcraft Might', desc: '+10% All Damage per rank', cost: 8 },
        { key: 'defiance', title: 'Death Defiance', desc: '+1 Revive on Death', cost: 12 }
      ];

      upgrades.forEach(u => {
        const card = document.createElement('div');
        card.className = 'altar-card';
        card.innerHTML = `
          <div class="altar-info">
            <h4>${u.title} (Lvl ${gameState.upgrades[u.key]})</h4>
            <p>${u.desc}</p>
          </div>
          <button class="hades-btn" style="padding: 6px 14px; font-size: 12px;">${u.cost} 🌪️ Upgrade</button>
        `;
        card.querySelector('button').onclick = () => {
          if (gameState.ashes >= u.cost) {
            gameState.ashes -= u.cost;
            gameState.upgrades[u.key]++;
            sound.playBoonChime();
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
      gameState.isPaused = false;
      player.resetForRun();
      startChamber(1);
    };

    // --- HUD UPDATES ---
    function updateHUD() {
      document.getElementById('hp-bar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;
      document.getElementById('hp-text').innerText = `${Math.ceil(player.hp)} / ${player.maxHp}`;
      document.getElementById('magick-bar').style.width = `${Math.max(0, (player.magick / player.maxMagick) * 100)}%`;
      document.getElementById('magick-text').innerText = `${Math.ceil(player.magick)} / ${player.maxMagick}`;

      document.getElementById('gold-count').innerText = gameState.gold;
      document.getElementById('ash-count').innerText = gameState.ashes;
      document.getElementById('bones-count').innerText = gameState.bones;

      const hexEl = document.getElementById('hex-gauge');
      if (player.hexCharge >= player.hexMax) {
        hexEl.classList.add('ready');
      } else {
        hexEl.classList.remove('ready');
      }

      const boonsList = document.getElementById('active-boons');
      boonsList.innerHTML = '';
      gameState.equippedBoons.forEach(b => {
        const item = document.createElement('div');
        item.className = `boon-badge ${b.isDuo ? 'duo' : ''}`;
        item.innerHTML = `
          <div>
            <div class="boon-badge-god">${b.isDuo ? '★ DUO SYNERGY' : b.godName}</div>
            <div class="boon-badge-name">${b.name}</div>
          </div>
        `;
        boonsList.appendChild(item);
      });
    }

    function updateBossHUD(boss) {
      document.getElementById('boss-name-text').innerText = boss.name;
      const hpPct = Math.max(0, (boss.hp / boss.maxHp) * 100);
      document.getElementById('boss-hp-bar').style.width = `${hpPct}%`;
    }

    // --- MAIN RENDER LOOP ---
    let lastTime = performance.now();

    function gameLoop(time) {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      if (!gameState.isPaused) {
        player.update(dt);
        gameState.enemies.forEach(e => e.update(dt));
        gameState.projectiles.forEach(p => p.update(dt));
        gameState.particles.forEach(p => p.update(dt));
        gameState.particles = gameState.particles.filter(p => p.life > 0);

        if (arena.door.isOpen) {
          if (Math.hypot(player.x - arena.door.x, player.y - arena.door.y) < arena.door.radius + player.radius) {
            startChamber(gameState.chamber + 1);
          }
        }

        gameState.camera.x += (player.x - gameState.camera.x) * 0.1;
        gameState.camera.y += (player.y - gameState.camera.y) * 0.1;
      }

      let shakeX = 0;
      let shakeY = 0;
      if (screenShake > 0) {
        shakeX = (Math.random() - 0.5) * screenShake;
        shakeY = (Math.random() - 0.5) * screenShake;
        screenShake = Math.max(0, screenShake - dt * 30);
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(canvas.width / 2 - gameState.camera.x + shakeX, canvas.height / 2 - gameState.camera.y + shakeY);

      // 1. Seamless Stone Floor & Walls
      drawChamberTiles(ctx);

      // 2. Props (Exit Gate, Altar, Pillars with Torches)
      drawProps(ctx);

      // 3. Lower Particles (Fire trails & Ice traps)
      gameState.particles.forEach(p => { if (p instanceof FireTrail || p instanceof IceShardTrap) p.draw(ctx); });

      // 4. Enemies (Rendered with dedicated pre-rendered 3D models)
      gameState.enemies.forEach(e => e.draw(ctx));

      // 5. Player
      player.draw(ctx);

      // 6. Projectiles (Rendered with new projectile models)
      gameState.projectiles.forEach(p => p.draw(ctx));

      // 7. Upper Animated Attack Effects & Impact Sparks
      gameState.particles.forEach(p => { if (!(p instanceof FireTrail) && !(p instanceof IceShardTrap)) p.draw(ctx); });

      ctx.restore();

      requestAnimationFrame(gameLoop);
    }

    function drawChamberTiles(ctx) {
      const halfW = arena.width / 2;
      const halfH = arena.height / 2;

      const floorImg = loadedImages['seamless_floor'];
      if (floorImg && floorImg.complete) {
        const pattern = ctx.createPattern(floorImg, 'repeat');
        if (pattern) {
          ctx.fillStyle = pattern;
          ctx.fillRect(-halfW, -halfH, arena.width, arena.height);
        } else {
          ctx.fillStyle = '#1c152a';
          ctx.fillRect(-halfW, -halfH, arena.width, arena.height);
        }
      } else {
        ctx.fillStyle = '#1c152a';
        ctx.fillRect(-halfW, -halfH, arena.width, arena.height);
      }

      const tilesImg = loadedImages['consistent_tiles'];
      if (tilesImg && tilesImg.complete) {
        const wallSx = 180, wallSy = 480, wallSw = 280, wallSh = 450;
        const wallW = 80, wallH = 90;
        for (let x = -halfW; x < halfW; x += wallW) {
          ctx.drawImage(tilesImg, wallSx, wallSy, wallSw, wallSh, x, -halfH - wallH + 20, wallW, wallH);
          ctx.drawImage(tilesImg, wallSx, wallSy, wallSw, wallSh, x, halfH - 20, wallW, wallH);
        }
        for (let y = -halfH; y < halfH; y += wallH) {
          ctx.drawImage(tilesImg, wallSx, wallSy, wallSw, wallSh, -halfW - wallW + 20, y, wallW, wallH);
          ctx.drawImage(tilesImg, wallSx, wallSy, wallSw, wallSh, halfW - 20, y, wallW, wallH);
        }
      }

      ctx.lineWidth = 14;
      ctx.strokeStyle = '#3a2412';
      ctx.strokeRect(-halfW, -halfH, arena.width, arena.height);
    }

    function drawProps(ctx) {
      const tilesImg = loadedImages['consistent_tiles'];
      const propsImg = loadedImages['props'];

      arena.pillars.forEach(pillar => {
        ctx.beginPath();
        ctx.ellipse(pillar.x, pillar.y + 24, pillar.radius * 1.1, pillar.radius * 0.55, 0, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();

        if (tilesImg && tilesImg.complete) {
          const px = 770, py = 150, pw = 210, ph = 770;
          ctx.drawImage(tilesImg, px, py, pw, ph, pillar.x - 42, pillar.y - 130, 84, 165);
        } else {
          ctx.beginPath();
          ctx.arc(pillar.x, pillar.y, pillar.radius, 0, Math.PI * 2);
          ctx.fillStyle = '#2b1b0e';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(pillar.x, pillar.y - 120, 28, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(42, 230, 180, 0.3)';
        ctx.fill();
      });

      const door = arena.door;
      ctx.save();
      ctx.translate(door.x, door.y);

      if (propsImg && propsImg.complete) {
        const cw = propsImg.width / 3;
        const ch = propsImg.height / 3;
        ctx.drawImage(propsImg, cw * 2, 0, cw, ch, -60, -100, 120, 120);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, door.radius, Math.PI, 0);
        ctx.fillStyle = door.isOpen ? '#2ae6b4' : '#2a1a12';
        ctx.fill();
      }

      if (door.isOpen) {
        ctx.font = 'bold 15px Cinzel';
        ctx.fillStyle = '#fff2a8';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.fillText('ENTER CHAMBER', 0, -30);
      }
      ctx.restore();
    }

    // Start game
    player.resetForRun();
    startChamber(1);
    requestAnimationFrame(gameLoop);
  </script>
</body>
</html>
"""

final_html = html_template.replace('%ASSETS_JSON%', json.dumps(b64_data))

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f"Successfully compiled 100 Chambers Hardcore Edition index.html ({len(final_html)} bytes)!")
