import json
import base64
import os

# Asset loading
assets_keys = [
    'hero', 'shade', 'witch', 'chronos',
    'consistent_tiles', 'seamless_floor', 'props', 'ui',
    'clean_fx', 'attack_fx_anim',
    'all_10_gods', 'monsters_beasts', 'undead_cultists', 'new_projectiles',
    'minibosses', 'reward_icons',
    'infinite_bosses_a', 'infinite_bosses_b', 'infinite_bosses_c'
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

    .boon-lvl-badge {
      background: #7c3aed;
      color: #fff;
      font-size: 10px;
      font-weight: 900;
      padding: 1px 5px;
      border-radius: 4px;
      margin-left: 4px;
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

    /* Cards Grid */
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

    /* Boon & Skill Codex Modal [TAB] */
    #codex-modal .modal-card {
      max-width: 960px;
      width: 92%;
      max-height: 88vh;
      display: flex;
      flex-direction: column;
    }
    .codex-stats-bar {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-around;
      background: rgba(0,0,0,0.6);
      border: 1px solid var(--gold-dark);
      border-radius: 8px;
      padding: 10px 14px;
      margin: 10px 0 14px 0;
      gap: 12px;
      font-size: 13px;
      font-family: var(--font-title);
      color: var(--gold-light);
    }
    .codex-stat-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .codex-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 12px;
      overflow-y: auto;
      padding: 6px 4px 14px 4px;
      max-height: 52vh;
    }
    .codex-card {
      background: linear-gradient(135deg, rgba(30, 20, 48, 0.95) 0%, rgba(15, 10, 25, 0.95) 100%);
      border: 1px solid var(--gold-dark);
      border-radius: 8px;
      padding: 12px 14px;
      text-align: left;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 14px rgba(0,0,0,0.5);
      transition: transform 0.2s, border-color 0.2s;
    }
    .codex-card:hover {
      border-color: var(--gold-light);
      transform: translateY(-2px);
    }
    .codex-card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 6px;
    }
    .codex-portrait {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      box-shadow: 0 0 10px rgba(230,180,80,0.4);
      flex-shrink: 0;
    }
    .codex-card-title {
      font-family: var(--font-title);
      font-size: 14px;
      font-weight: 700;
      color: var(--gold-light);
      display: flex;
      justify-content: space-between;
      align-items: center;
      width: 100%;
    }
    .codex-tag {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 1px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(230,180,80,0.15);
      border: 1px solid var(--gold-dark);
      color: #fde047;
      display: inline-block;
      margin-top: 2px;
    }
    .codex-card-desc {
      font-size: 12px;
      line-height: 1.45;
      color: #cbd5e1;
      margin-top: 6px;
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
          <button id="open-codex-btn" class="hades-btn" style="padding: 4px 10px; font-size: 11px; margin-left: 8px; border-radius: 4px;">📜 BOONS [TAB]</button>
        </div>
      </div>

      <!-- Left Active Boons HUD -->
      <div id="active-boons" class="active-boons-list"></div>

      <!-- Controls helper -->
      <div class="controls-banner">
        <span><span class="key-badge">WASD</span> Move</span>
        <span><span class="key-badge">L-CLICK / J</span> Strike</span>
        <span><span class="key-badge">R-CLICK / K</span> Special</span>
        <span><span class="key-badge">Q / E</span> Cast</span>
        <span><span class="key-badge">SPACE</span> Dash</span>
        <span><span class="key-badge">F</span> Hex</span>
        <span><span class="key-badge">TAB</span> Boons Codex</span>
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

    <!-- Pom of Power Modal (Pomegranate Level Up) -->
    <div id="pom-modal" class="modal-overlay">
      <div class="modal-card">
        <div style="display:flex; justify-content:center; margin-bottom:12px;">
          <canvas id="pom-portrait-canvas" class="dialogue-portrait-canvas" width="120" height="120"></canvas>
        </div>
        <div class="modal-title">POM OF POWER</div>
        <div class="modal-subtitle">Enhance the potency of one of your existing divine blessings (+40% Power per Lv)</div>
        <div id="pom-choices-container" class="boon-cards-grid"></div>
      </div>
    </div>

    <!-- Charon's Shop Modal -->
    <div id="shop-modal" class="modal-overlay">
      <div class="modal-card">
        <div style="display:flex; justify-content:center; margin-bottom:12px;">
          <canvas id="shop-portrait-canvas" class="dialogue-portrait-canvas" width="120" height="120"></canvas>
        </div>
        <div class="modal-title">CHARON'S OBOLEUM VAULT</div>
        <div class="modal-subtitle">"Hrrrnnnn... (Purchase sacred goods with your collected Gold Obols)"</div>
        <div id="shop-choices-container" class="boon-cards-grid"></div>
        <button id="leave-shop-btn" class="hades-btn" style="margin-top:20px;">PROCEED TO NEXT CHAMBER ➔</button>
      </div>
    </div>

    <!-- Boon & Skill Codex Modal [TAB] -->
    <div id="codex-modal" class="modal-overlay">
      <div class="modal-card">
        <div class="modal-title">PRAYERS & BLESSINGS CODEX</div>
        <div class="modal-subtitle">Press [TAB] or [ESC] to resume your Underworld trial</div>

        <div class="codex-stats-bar">
          <div class="codex-stat-item">❤️ HP: <span id="codex-hp">100/100</span></div>
          <div class="codex-stat-item">🔮 Magick: <span id="codex-magick">50/50</span></div>
          <div class="codex-stat-item">🗡️ Might: <span id="codex-damage">+0%</span></div>
          <div class="codex-stat-item">🌪️ Defiance: <span id="codex-defiance">1</span></div>
          <div class="codex-stat-item">🪙 Gold: <span id="codex-gold">0</span></div>
          <div class="codex-stat-item">🌪️ Ashes: <span id="codex-ashes">0</span></div>
        </div>

        <div id="codex-cards-container" class="codex-grid"></div>
        <button id="close-codex-btn" class="hades-btn" style="margin-top:14px;">RESUME TRIAL [TAB / ESC]</button>
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
       HADES 2 COMPLETE ENGINE: 100 CHAMBERS, MULTIPLE GATES, POMS, SHOPS, 100+ BOONS
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

      if (e.key === 'Tab' || e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggleSkillCodex();
        return;
      }
      if (e.key === 'Escape') {
        closeSkillCodex();
        return;
      }
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

    // --- 10 OLYMPIAN & CHTHONIC GODS REGISTRY (10+ BOONS EACH = 100+ BOONS) ---
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
          { id: 'zeus_strike', name: 'Lightning Strike', slot: 'Attack', desc: '[ATTACK] Strikes call down chain lightning arcing between up to 5 enemies for 45 electric damage.' },
          { id: 'zeus_ring', name: 'Storm Ring', slot: 'Cast', desc: '[CAST] Cast circle triggers repeating lightning strikes every 0.4s for 22 damage.' },
          { id: 'zeus_dash', name: 'Static Dash', slot: 'Dash', desc: '[DASH] Dashing discharges a burst of 6 electric spark bolts for 30 damage.' },
          { id: 'zeus_special', name: 'Thunder Special', slot: 'Special', desc: '[SPECIAL] Special sickle calls down a thunderbolt upon every enemy struck for 55 damage.' },
          { id: 'zeus_cloud', name: 'High Voltage', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Chain lightning jumps +3 extra times and has +40% wider arc distance.' },
          { id: 'zeus_jolt', name: 'Static Shock', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Inflicts Jolted on foes; when they attack, they take 80 self-inflicted electric damage.' },
          { id: 'zeus_bolt', name: 'Heaven’s Vengeance', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Whenever you take damage, immediately strike the attacker with 120 retaliatory lightning.' },
          { id: 'zeus_conduit', name: 'Storm Conduit', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] All lightning effects have +30% chance to critically strike for 2.5x damage.' },
          { id: 'zeus_fury', name: 'God’s Wrath', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Gain +25% overall attack speed and +25% lightning strike frequency.' },
          { id: 'zeus_overload', name: 'Electric Overload', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Foes struck by lightning emit secondary shockwaves dealing 35 area damage.' }
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
          { id: 'hestia_strike', name: 'Flame Strike', slot: 'Attack', desc: '[ATTACK] Strikes inflict Scorch, dealing 60 burn damage over 3 seconds.' },
          { id: 'hestia_ring', name: 'Smolder Ring', slot: 'Cast', desc: '[CAST] Cast circle ignites a continuous fire vortex that incinerates foes for 30 burn damage.' },
          { id: 'hestia_dash', name: 'Searing Dash', slot: 'Dash', desc: '[DASH] Dash leaves a flaming path that burns enemies who step into it.' },
          { id: 'hestia_special', name: 'Magma Special', slot: 'Special', desc: '[SPECIAL] Special sickle leaves a trail of burning magma on its path.' },
          { id: 'hestia_pyro', name: 'Pyroclast', slot: 'Passive — Attack & Cast', desc: '[PASSIVE — ATTACK & CAST] Scorch burn ticks +60% faster and spreads to nearby adjacent foes.' },
          { id: 'hestia_combust', name: 'Controlled Burn', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Striking scorched foes triggers a fiery combustion dealing 50 instant bonus damage.' },
          { id: 'hestia_ash', name: 'Hearth Blessing', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain 25% damage resistance while standing inside fire trails or cast rings.' },
          { id: 'hestia_inferno', name: 'Raging Inferno', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Foes suffering Scorch take +40% bonus damage from all player attacks.' },
          { id: 'hestia_ember', name: 'Firebrand', slot: 'Passive — Special', desc: '[PASSIVE — SPECIAL] Your Special launches 2 bouncing fire embers alongside the sickle throw.' },
          { id: 'hestia_flare', name: 'Solar Flare', slot: 'Passive — Hex', desc: '[PASSIVE — HEX] Hex activations leave a lasting 5s blazing firestorm dealing 150 total area damage.' }
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
          { id: 'poseidon_strike', name: 'Wave Strike', slot: 'Attack', desc: '[ATTACK] Attacks blast enemies backward with heavy waves. Slashing foes into walls deals 80 wall-slam bonus damage!' },
          { id: 'poseidon_ring', name: 'Flood Ring', slot: 'Cast', desc: '[CAST] Cast circle erupts into a violent geyser, knocking all snared foes outward.' },
          { id: 'poseidon_dash', name: 'Tidal Dash', slot: 'Dash', desc: '[DASH] Dash unleashes a surging wave that propels you and slams enemies for 50 damage.' },
          { id: 'poseidon_special', name: 'Tsunami Special', slot: 'Special', desc: '[SPECIAL] Special sickle creates a wide wave pushing back all enemies in front.' },
          { id: 'poseidon_crush', name: 'Heavy Surf', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Wall slam damage increased by +80% and stuns enemies for 1.0s.' },
          { id: 'poseidon_rip', name: 'Riptide', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Wave attacks create whirlpools pulling foes inward toward the center.' },
          { id: 'poseidon_ocean', name: 'Ocean’s Bounty', slot: 'Passive — Economy', desc: '[PASSIVE — ECONOMY] Enemies drop +60% more Gold Obols and Ashes upon defeat.' },
          { id: 'poseidon_typhoon', name: 'Typhoon Force', slot: 'Passive — Attack & Dash', desc: '[PASSIVE — ATTACK & DASH] Surge waves pierce enemy shields and destroy incoming hostile projectiles.' },
          { id: 'poseidon_undertow', name: 'Undertow', slot: 'Passive — Dash', desc: '[PASSIVE — DASH] Dashing directly into enemies slams them backwards for 60 water damage.' },
          { id: 'poseidon_surge', name: 'Tidal Surge', slot: 'Passive — Special', desc: '[PASSIVE — SPECIAL] Gain +40% movement speed for 3s after launching your Special sickle.' }
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
          { id: 'apollo_strike', name: 'Nova Strike', slot: 'Attack', desc: '[ATTACK] Attacks have +50% wider sweep radius and inflict Dazzle (foes miss attacks).' },
          { id: 'apollo_ring', name: 'Solar Ring', slot: 'Cast', desc: '[CAST] Cast circle expands by +40% radius and triggers blinding solar flares.' },
          { id: 'apollo_special', name: 'Sunburst Special', slot: 'Special', desc: '[SPECIAL] Special sickle creates a radiant blinding explosion at apex for 85 damage.' },
          { id: 'apollo_dash', name: 'Blinding Dash', slot: 'Dash', desc: '[DASH] Dashing blinds nearby foes for 2.5s.' },
          { id: 'apollo_radiance', name: 'Solar Radiance', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Dazzled and blinded foes take +40% bonus damage from all sources.' },
          { id: 'apollo_dawn', name: 'Breaking Dawn', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Striking blinded foes triggers an instant 60 damage light burst.' },
          { id: 'apollo_hymn', name: 'Divine Hymn', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Defeating enemies heals Melinoë for 4 HP (up to 25 HP per chamber).' },
          { id: 'apollo_splendor', name: 'High Splendor', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] All sword attacks release radiant sun sparks seeking out targets.' },
          { id: 'apollo_sunfire', name: 'Sunfire Aegis', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain a 25% passive evasion chance while standing inside cast rings.' },
          { id: 'apollo_clarity', name: 'Lucid Mind', slot: 'Passive — Cast', desc: '[PASSIVE — CAST] Magick regenerates +100% faster (14 Magick per second).' }
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
          { id: 'selene_hex_ray', name: 'Lunar Ray', slot: 'Hex', desc: '[HEX] Fires a continuous devastating moonlight laser beam dealing 550 total damage!' },
          { id: 'selene_hex_slow', name: 'Phase Shift', slot: 'Hex', desc: '[HEX] Slows down time for all enemies by 85% for 4.5 seconds.' },
          { id: 'selene_hex_meteor', name: 'Total Eclipse', slot: 'Hex', desc: '[HEX] Calls down a colossal lunar meteor after 1s, dealing 750 area damage.' },
          { id: 'selene_dash', name: 'Moon Cloak', slot: 'Dash', desc: '[DASH] Dashing grants invisibility and +50% critical strike chance on next hit.' },
          { id: 'selene_crescent', name: 'Silver Crescent', slot: 'Passive — Special', desc: '[PASSIVE — SPECIAL] Your Special sickle fires 2 crescent blades in a spread.' },
          { id: 'selene_orbit', name: 'Orbital Moon', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] A lunar orb orbits Melinoë dealing 35 contact damage and blocking bullets.' },
          { id: 'selene_gravity', name: 'Lunar Gravity', slot: 'Passive — Cast', desc: '[PASSIVE — CAST] Your Cast circle draws in enemy projectiles and neutralizes them.' },
          { id: 'selene_shroud', name: 'Witch Shroud', slot: 'Passive — Hex', desc: '[PASSIVE — HEX] Dashing through enemy attacks generates +20 Hex Charge instantly.' },
          { id: 'selene_waxing', name: 'Waxing Crescent', slot: 'Passive — Hex', desc: '[PASSIVE — HEX] Hex charge gains +40% faster on all basic attacks and specials.' },
          { id: 'selene_fullmoon', name: 'Full Moon Might', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] While your Hex gauge is 100% full, all attacks deal +40% bonus damage.' }
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
          { id: 'hermes_speed', name: 'Nimble Mind', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Attack and Special speed increased by +45%.' },
          { id: 'hermes_dash', name: 'Hyper Sprint', slot: 'Dash', desc: '[DASH] Gain +2 Dash charges and +60% movement speed for 2s after dashing.' },
          { id: 'hermes_dodge', name: 'Greater Evasion', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain a flat 30% chance to completely dodge any incoming attack.' },
          { id: 'hermes_haste', name: 'Quick Strike', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Attack combo recovery time reduced by 60%.' },
          { id: 'hermes_gust', name: 'Gale Force', slot: 'Passive — Dash', desc: '[PASSIVE — DASH] Dashing creates a shockwave blowing away enemy bullets.' },
          { id: 'hermes_rush', name: 'Adrenaline Rush', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Moving above base speed grants +35% damage to your next strike.' },
          { id: 'hermes_delivery', name: 'Swift Delivery', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] You deal bonus damage equal to 40% of your total movement speed.' },
          { id: 'hermes_reflex', name: 'Lightning Reflexes', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Dodging an attack discharges an instant 80 electric shock to nearby foes.' },
          { id: 'hermes_stride', name: 'Fleet Stride', slot: 'Passive — Mobility', desc: '[PASSIVE — MOBILITY] Permanently increases base movement speed by +40%.' },
          { id: 'hermes_wings', name: 'Winged Talaria', slot: 'Passive — Dash', desc: '[PASSIVE — DASH] Dashing lets you glide smoothly over traps and magma hazards.' }
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
          { id: 'aphrodite_strike', name: 'Heartbreak Strike', slot: 'Attack', desc: '[ATTACK] Attacks deal +60% damage and inflict Weak, reducing enemy attack power by 35%.' },
          { id: 'aphrodite_dash', name: 'Passion Dash', slot: 'Dash', desc: '[DASH] Dashing releases a burst of charm petals that weaken nearby foes.' },
          { id: 'aphrodite_ring', name: 'Sweet Surrender', slot: 'Cast', desc: '[CAST] Cast circle causes snared enemies to take +50% bonus damage from all sources.' },
          { id: 'aphrodite_special', name: 'Crush Special', slot: 'Special', desc: '[SPECIAL] Special sickle inflicts heavy Weak and slows enemy movement by 40%.' },
          { id: 'aphrodite_charm', name: 'Captivating Glance', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Attacks have a 20% chance to Charm foes to fight for you for 4s.' },
          { id: 'aphrodite_allure', name: 'Fatal Allure', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Weakened foes suffer +40% critical damage from all your attacks.' },
          { id: 'aphrodite_grace', name: 'Life Affirmation', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] All maximum health pickups and healing effects are increased by +50%.' },
          { id: 'aphrodite_heart', name: 'Dying Wish', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Weakened enemies detonate in a burst of charm petals on death for 80 area damage.' },
          { id: 'aphrodite_beauty', name: 'Unshakable Glamour', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Bosses and mini-bosses deal -25% reduced damage to Melinoë.' },
          { id: 'aphrodite_embrace', name: 'Loving Embrace', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Standing near enemies restores 2 HP per second (up to 20 HP per room).' }
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
          { id: 'hephaestus_strike', name: 'Volcanic Strike', slot: 'Attack', desc: '[ATTACK] Every 4s, your next Attack unleashes a colossal volcanic blast for 180 damage.' },
          { id: 'hephaestus_armor', name: 'Heavy Armor', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain +50 Max HP and 25% passive damage resistance.' },
          { id: 'hephaestus_ring', name: 'Molten Ring', slot: 'Cast', desc: '[CAST] Cast circle erupts with a molten crater dealing 45 area damage.' },
          { id: 'hephaestus_special', name: 'Anvil Special', slot: 'Special', desc: '[SPECIAL] Special sickle triggers a concussive shockwave for 90 volcanic bonus damage.' },
          { id: 'hephaestus_forge', name: 'Divine Forge', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Every 3 cleared chambers, gain +15 permanent Max Health.' },
          { id: 'hephaestus_blast', name: 'Molten Shrapnel', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Volcanic Strikes fire 6 piercing metal shrapnel shards in all directions.' },
          { id: 'hephaestus_temper', name: 'Tempered Steel', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Attacks deal +45% bonus damage to armored foes, mini-bosses, and Titan bosses.' },
          { id: 'hephaestus_shield', name: 'Iron Aegis', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Gain a 40 HP energy barrier that completely absorbs hits and recharges each room.' },
          { id: 'hephaestus_smelt', name: 'Magma Smelting', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Attack strikes cleave through all targets, ignoring defense shields.' },
          { id: 'hephaestus_crush', name: 'Seismic Anvil', slot: 'Passive — Special', desc: '[PASSIVE — SPECIAL] Sickle hits shred armor, making targets take +30% damage from all sources.' }
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
          { id: 'demeter_strike', name: 'Frost Strike', slot: 'Attack', desc: '[ATTACK] Attacks inflict Chill, slowing enemy movement and attacks by up to 50%.' },
          { id: 'demeter_ring', name: 'Arctic Ring', slot: 'Cast', desc: '[CAST] Cast circle summons a freezing blizzard vortex that continuously chills foes.' },
          { id: 'demeter_dash', name: 'Glacial Dash', slot: 'Dash', desc: '[DASH] Dash leaves freezing icicles that shatter when stepped on for 50 damage.' },
          { id: 'demeter_special', name: 'Freeze Special', slot: 'Special', desc: '[SPECIAL] Special sickle freezes enemies solid in ice for 1.5 seconds.' },
          { id: 'demeter_shatter', name: 'Glacial Shatter', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Striking chilled or frozen foes deals +50% critical damage.' },
          { id: 'demeter_hail', name: 'Hailstorm', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Chilled foes are struck by falling hailstones every 1s for 30 damage.' },
          { id: 'demeter_blizzard', name: 'Snow Squall', slot: 'Passive — Cast', desc: '[PASSIVE — CAST] Your Cast blizzard expands by +40% and reduces enemy projectile accuracy.' },
          { id: 'demeter_rime', name: 'Killing Frost', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Enemies at max Chill stacks decay rapidly for 40 frost damage per second.' },
          { id: 'demeter_frostbite', name: 'Bitter Cold', slot: 'Passive — Survival', desc: '[PASSIVE — SURVIVAL] Foes who hit Melinoë while chilled take 60 reflected frost damage and get frozen.' },
          { id: 'demeter_winter', name: 'Winter Harvest', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Chilled foes with under 15% health shatter instantly into ice (execute).' }
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
          { id: 'ares_strike', name: 'Curse of Agony', slot: 'Attack', desc: '[ATTACK] Attacks inflict Doom, dealing 90 delayed explosive damage after 1.1 seconds.' },
          { id: 'ares_ring', name: 'Blade Rift', slot: 'Cast', desc: '[CAST] Cast circle summons a spinning blade rift that tears through enemies for 50 damage.' },
          { id: 'ares_passive', name: 'Battle Rage', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Slaying any enemy grants +50% damage boost for 5 seconds.' },
          { id: 'ares_special', name: 'Curse of Pain', slot: 'Special', desc: '[SPECIAL] Special sickle inflicts 120 delayed Doom on all enemies pierced.' },
          { id: 'ares_blade_dash', name: 'Blade Dash', slot: 'Dash', desc: '[DASH] Dashing leaves behind a miniature whirling blade rift dealing 50 damage.' },
          { id: 'ares_impending', name: 'Impending Doom', slot: 'Passive — Attack & Special', desc: '[PASSIVE — ATTACK & SPECIAL] Doom takes 0.4s longer to detonate, but its explosive damage is increased by +80%.' },
          { id: 'ares_engulf', name: 'Engulfing Vortex', slot: 'Passive — Cast', desc: '[PASSIVE — CAST] Blade Rifts pull in nearby foes and grow +40% larger over their duration.' },
          { id: 'ares_blood', name: 'Blood Frenzy', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] After taking damage, your next 2 attacks deal +100% bonus damage.' },
          { id: 'ares_grim', name: 'Grim Reaper', slot: 'Passive — Attack', desc: '[PASSIVE — ATTACK] Slaying a Doom-afflicted foe immediately triggers Doom on all adjacent targets.' },
          { id: 'ares_carnage', name: 'Carnage Engine', slot: 'Passive — Economy', desc: '[PASSIVE — ECONOMY] Defeating 3 enemies without taking damage grants +30 bonus Gold Obols.' }
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
        desc: '[DUO BOON — ATTACK & DASH] Whenever your wave knockback effects slam enemies, instant chain lightning strikes them for 60 damage!'
      },
      {
        id: 'duo_plasma',
        name: 'Plasma Discharge',
        gods: ['Zeus', 'Hestia'],
        reqs: [['zeus_strike', 'zeus_ring'], ['hestia_strike', 'hestia_ring', 'hestia_dash']],
        desc: '[DUO BOON — ATTACK] Chain lightning ignites Scorch on all targets, making burn damage tick twice as fast with secondary spark bursts.'
      },
      {
        id: 'duo_supernova',
        name: 'Supernova',
        gods: ['Apollo', 'Hestia'],
        reqs: [['apollo_strike', 'apollo_ring'], ['hestia_strike', 'hestia_ring']],
        desc: '[DUO BOON — ATTACK] Scorched enemies detonate upon death in a massive 220px blinding solar nova dealing 180 area damage.'
      },
      {
        id: 'duo_blizzard',
        name: 'Blizzard Cyclone',
        gods: ['Poseidon', 'Demeter'],
        reqs: [['poseidon_ring', 'poseidon_strike'], ['demeter_ring', 'demeter_strike']],
        desc: '[DUO BOON — CAST] Cast circle becomes a permanent freezing water cyclone that pulls in all enemies and inflicts Chill.'
      },
      {
        id: 'duo_heartbreak_doom',
        name: 'Heartbreak Doom',
        gods: ['Aphrodite', 'Ares'],
        reqs: [['aphrodite_strike', 'aphrodite_dash'], ['ares_strike', 'ares_ring']],
        desc: '[DUO BOON — ATTACK] Weakened foes immediately trigger continuous Doom blade rifts whenever they take attack damage.'
      },
      {
        id: 'duo_freezing_inferno',
        name: 'Freezing Inferno',
        gods: ['Hestia', 'Demeter'],
        reqs: [['hestia_strike', 'hestia_dash'], ['demeter_strike', 'demeter_ring']],
        desc: '[DUO BOON — ATTACK & SPECIAL] Enemies afflicted with both Scorch and Chill suffer Steam Shock, taking +150% critical damage from all attacks.'
      },
      {
        id: 'duo_volcanic_flash',
        name: 'Volcanic Flash',
        gods: ['Hephaestus', 'Zeus'],
        reqs: [['hephaestus_strike', 'hephaestus_ring'], ['zeus_strike', 'zeus_ring']],
        desc: '[DUO BOON — ATTACK] Hephaestus volcanic blasts trigger chain lightning to all surrounding targets across the arena.'
      },
      {
        id: 'duo_sunlit_moon',
        name: 'Sunlit Moon',
        gods: ['Apollo', 'Selene'],
        reqs: [['apollo_strike', 'apollo_ring'], ['selene_hex_ray', 'selene_hex_slow', 'selene_hex_meteor']],
        desc: '[DUO BOON — HEX] Selene Hexes charge +100% faster and gain +100% blast radius with blinding solar brilliance.'
      }
    ];

    // --- GAME STATE ---
    const gameState = {
      chamber: 1,
      maxChambers: 100,
      chamberType: 'normal',
      enemiesCleared: false,
      kills: 0,
      gold: 80,
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
      battleRageTimer: 0,
      doors: [] // Array of interactive exit gates
    };

    // --- 40+ ENEMY DEFINITIONS (Standard enemies 80% reduced HP, Mini-bosses, 20x Chronos & 10 Post-Chronos Bosses) ---
    const ENEMY_TYPES = {
      // 1. Mini-Bosses (Mapped to minibosses.webp: 2x2 grid)
      asterius_king: { name: 'Asterius — Minotaur King', isMiniBoss: true, maxHp: 8500, speed: 110, radius: 52, color: '#f59e0b', sheet: 'minibosses', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'miniboss_asterius' },
      hydra_prime: { name: 'Lernaean Bone Hydra Prime', isMiniBoss: true, maxHp: 16000, speed: 70, radius: 56, color: '#10b981', sheet: 'minibosses', cellX: 1, cellY: 0, cols: 2, rows: 2, behavior: 'miniboss_hydra' },
      hecate_matron: { name: 'Hecate — Witch Matron', isMiniBoss: true, maxHp: 26000, speed: 120, radius: 48, color: '#8b5cf6', sheet: 'minibosses', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'miniboss_hecate' },
      cerberus_prime: { name: 'Cerberus Prime — Infernal Guardian', isMiniBoss: true, maxHp: 38000, speed: 180, radius: 55, color: '#ef4444', sheet: 'minibosses', cellX: 1, cellY: 1, cols: 2, rows: 2, behavior: 'miniboss_cerberus' },

      // 2. Monsters & Beasts (Mapped to monsters_beasts.webp: 3x2 grid) (HP -80%)
      minotaur_brute: { name: 'Minotaur Brute', maxHp: 168, speed: 90, radius: 40, color: '#b91c1c', sheet: 'monsters_beasts', cellX: 0, cellY: 0, cols: 3, rows: 2, behavior: 'bull_rush' },
      cerberus_hound: { name: 'Cerberus Houndling', maxHp: 116, speed: 190, radius: 32, color: '#b45309', sheet: 'monsters_beasts', cellX: 1, cellY: 0, cols: 3, rows: 2, behavior: 'triple_fireball' },
      tartarus_behemoth: { name: 'Tartarus Behemoth', maxHp: 240, speed: 60, radius: 48, color: '#78716c', sheet: 'monsters_beasts', cellX: 2, cellY: 0, cols: 3, rows: 2, behavior: 'earthquake' },
      cyclops_smasher: { name: 'Cyclops Smasher', maxHp: 176, speed: 75, radius: 42, color: '#71717a', sheet: 'monsters_beasts', cellX: 0, cellY: 1, cols: 3, rows: 2, behavior: 'quad_boulder_slam' },
      gorgon_viper: { name: 'Gorgon Viper', maxHp: 58, speed: 180, radius: 25, color: '#15803d', sheet: 'monsters_beasts', cellX: 1, cellY: 1, cols: 3, rows: 2, behavior: 'poison_fan' },
      lava_crag_crab: { name: 'Lava Crag Crab', maxHp: 136, speed: 110, radius: 35, color: '#c2410c', sheet: 'monsters_beasts', cellX: 2, cellY: 1, cols: 3, rows: 2, behavior: 'magma_dropper' },

      // 3. Undead & Cultists (Mapped to undead_cultists.webp: 3x2 grid) (HP -80%)
      bloodless_screamer: { name: 'Bloodless Screamer', maxHp: 40, speed: 230, radius: 22, color: '#f43f5e', sheet: 'undead_cultists', cellX: 0, cellY: 0, cols: 3, rows: 2, behavior: 'screamer' },
      satyr_cultist: { name: 'Satyr Cultist', maxHp: 52, speed: 175, radius: 25, color: '#84cc16', sheet: 'undead_cultists', cellX: 1, cellY: 0, cols: 3, rows: 2, behavior: 'poison_darts' },
      phantasm_cloaker: { name: 'Phantasm Cloaker', maxHp: 48, speed: 160, radius: 24, color: '#9333ea', sheet: 'undead_cultists', cellX: 2, cellY: 0, cols: 3, rows: 2, behavior: 'stealth_backstab' },
      doom_herald: { name: 'Doom Herald', maxHp: 104, speed: 110, radius: 32, color: '#ef4444', sheet: 'undead_cultists', cellX: 0, cellY: 1, cols: 3, rows: 2, behavior: 'doom_runes' },
      bone_chariot: { name: 'Bone Chariot', maxHp: 100, speed: 310, radius: 32, color: '#d97706', sheet: 'undead_cultists', cellX: 1, cellY: 1, cols: 3, rows: 2, behavior: 'wall_bounce_charger' },
      automaton_sentry: { name: 'Automaton Sentry', maxHp: 128, speed: 0, radius: 34, color: '#ca8a04', sheet: 'undead_cultists', cellX: 2, cellY: 1, cols: 3, rows: 2, behavior: 'dual_laser_turret' },

      // 4. Shades & Swarmers (Mapped to shade.webp) (HP -80%)
      shade_wretch: { name: 'Shade Wretch', maxHp: 34, speed: 200, radius: 24, color: '#2ae6b4', sheet: 'shade', behavior: 'swarmer' },
      shade_bruiser: { name: 'Shade Bruiser', maxHp: 112, speed: 85, radius: 36, color: '#0891b2', sheet: 'shade', behavior: 'slammer' },
      blast_beetle: { name: 'Blast Beetle', maxHp: 30, speed: 260, radius: 20, color: '#dc2626', sheet: 'shade', behavior: 'kamikaze_bomber' },
      clockwork_saw: { name: 'Clockwork Saw', maxHp: 72, speed: 270, radius: 24, color: '#eab308', sheet: 'shade', behavior: 'blade_bouncer' },
      stygian_jellyfish: { name: 'Stygian Jellyfish', maxHp: 70, speed: 70, radius: 30, color: '#06b6d4', sheet: 'shade', behavior: 'electric_pulse_ring' },
      hydra_spawn: { name: 'Hydra Spawn', maxHp: 116, speed: 85, radius: 33, color: '#16a34a', sheet: 'shade', behavior: 'bouncing_acid_triad' },
      shadow_reaper: { name: 'Shadow Reaper', maxHp: 68, speed: 140, radius: 28, color: '#6366f1', sheet: 'shade', behavior: 'teleport_scythe' },
      void_lurker: { name: 'Void Lurker', maxHp: 62, speed: 165, radius: 26, color: '#4c1d95', sheet: 'shade', behavior: 'burrow_eruption' },

      // 5. Casters (Mapped to witch.webp) (HP -80%)
      witch_siren: { name: 'Witch Siren', maxHp: 56, speed: 120, radius: 28, color: '#a855f7', sheet: 'witch', behavior: 'triple_orb' },
      witch_archmage: { name: 'Witch Archmage', maxHp: 84, speed: 95, radius: 30, color: '#c084fc', sheet: 'witch', behavior: 'pentagram_mortar' },
      flame_cultist: { name: 'Flame Cultist', maxHp: 64, speed: 115, radius: 26, color: '#ea580c', sheet: 'witch', behavior: 'flamethrower' },
      frost_banshee: { name: 'Frost Banshee', maxHp: 70, speed: 130, radius: 27, color: '#38bdf8', sheet: 'witch', behavior: 'frost_spiral' },
      chrono_mage: { name: 'Chrono-Mage', maxHp: 96, speed: 105, radius: 30, color: '#fbbf24', sheet: 'witch', behavior: 'time_rift' },
      time_weever: { name: 'Time Weever', maxHp: 76, speed: 125, radius: 27, color: '#eab308', sheet: 'witch', behavior: 'time_tether_bombs' },
      sirens_choir: { name: 'Sirens Choir', maxHp: 80, speed: 110, radius: 28, color: '#ec4899', sheet: 'witch', behavior: 'charm_pulse' },
      soul_necromancer: { name: 'Soul Necromancer', maxHp: 92, speed: 100, radius: 29, color: '#8b5cf6', sheet: 'witch', behavior: 'summon_skeleton_shades' },

      // 6. Elite & Chronos Titan Boss (Chamber 100)
      chronos_vanguard: { name: 'Chronos Vanguard', maxHp: 144, speed: 110, radius: 36, color: '#d97706', sheet: 'chronos', behavior: 'shield_spearman' },
      chronos: { name: 'Chronos — Titan of Time (Colossal)', isBoss: true, maxHp: 68000, speed: 115, radius: 64, color: '#eab308', sheet: 'chronos', behavior: 'titan_boss_20x' },

      // 7. Ten Post-Chronos Colossal Bosses (Every 30 Chambers after 100)
      typhon_prime: { name: 'Typhon Prime — Father of Monsters', isBoss: true, maxHp: 85000, speed: 120, radius: 68, color: '#ea580c', sheet: 'infinite_bosses_a', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'boss_typhon' },
      nyx_primordial: { name: 'Nyx Primordial — Sovereign of Night', isBoss: true, maxHp: 110000, speed: 130, radius: 65, color: '#818cf8', sheet: 'infinite_bosses_a', cellX: 1, cellY: 0, cols: 2, rows: 2, behavior: 'boss_nyx' },
      tartarus_colossus: { name: 'Tartarus Colossus — The Living Pit', isBoss: true, maxHp: 145000, speed: 100, radius: 72, color: '#d97706', sheet: 'infinite_bosses_a', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'boss_tartarus' },
      thanatos_ascended: { name: 'Thanatos Ascended — God of Death', isBoss: true, maxHp: 180000, speed: 155, radius: 66, color: '#06b6d4', sheet: 'infinite_bosses_a', cellX: 1, cellY: 1, cols: 2, rows: 2, behavior: 'boss_thanatos' },
      prometheus_rebound: { name: 'Prometheus Rebound — Titan of Fire', isBoss: true, maxHp: 220000, speed: 125, radius: 68, color: '#f97316', sheet: 'infinite_bosses_b', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'boss_prometheus' },
      medusa_queen: { name: 'Medusa Queen — Petrifying Terror', isBoss: true, maxHp: 265000, speed: 140, radius: 65, color: '#10b981', sheet: 'infinite_bosses_b', cellX: 1, cellY: 0, cols: 2, rows: 2, behavior: 'boss_medusa' },
      nemesis_supreme: { name: 'Nemesis Supreme — Divine Retribution', isBoss: true, maxHp: 310000, speed: 160, radius: 64, color: '#f59e0b', sheet: 'infinite_bosses_b', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'boss_nemesis' },
      charon_harvester: { name: 'Charon Harvester — Dread Ferryman', isBoss: true, maxHp: 360000, speed: 110, radius: 70, color: '#eab308', sheet: 'infinite_bosses_b', cellX: 1, cellY: 1, cols: 2, rows: 2, behavior: 'boss_charon' },
      python_ancient: { name: 'Python Ancient — Dragon of Delphi', isBoss: true, maxHp: 420000, speed: 135, radius: 72, color: '#22c55e', sheet: 'infinite_bosses_c', cellX: 0, cellY: 0, cols: 2, rows: 2, behavior: 'boss_python' },
      chaos_embodied: { name: 'Chaos Embodied — Origin of Cosmos', isBoss: true, maxHp: 500000, speed: 140, radius: 75, color: '#ec4899', sheet: 'infinite_bosses_c', cellX: 0, cellY: 1, cols: 2, rows: 2, behavior: 'boss_chaos' }
    };

    // --- PLAYER CLASS (4-Hit Attack Combo System with Devastating Finisher) ---
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
        this.maxHp = this.baseMaxHp + gameState.upgrades.maxHp * 20;
        if (hasBoon('hephaestus_armor')) this.maxHp += 50;
        this.hp = this.maxHp;
        this.maxMagick = this.baseMagick + gameState.upgrades.magick * 15;
        this.magick = this.maxMagick;
        this.speed = 330 * (hasBoon('hermes_stride') ? 1.4 : 1.0);
        // BALANCED DEATH DEFIANCE: 1 base + 1 for every 20 upgrade ranks
        const bonusRevives = Math.floor(gameState.upgrades.defiance / 20);
        this.defianceCount = 1 + bonusRevives;
        this.maxDefiance = 1 + bonusRevives;
        this.barrierHp = hasBoon('hephaestus_shield') ? 40 : 0;
        this.bloodFrenzyCount = 0;
        this.attackCombo = 0;
        this.comboResetTimer = 0;
        this.x = 0;
        this.y = 220;
        this.hexCharge = 0;
        this.castActive = null;
        this.isDashing = false;
        gameState.equippedBoons = [];
        updateHUD();
      }

      update(dt) {
        const regenRate = hasBoon('apollo_clarity') ? 14 : 7;
        if (this.magick < this.maxMagick) {
          this.magick = Math.min(this.maxMagick, this.magick + dt * regenRate);
        }

        if (this.iFrames > 0) this.iFrames -= dt;
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
        if (hasBoon('aphrodite_embrace') && this.hp < this.maxHp) {
          const nearEnemy = gameState.enemies.some(e => Math.hypot(e.x - this.x, e.y - this.y) < 220);
          if (nearEnemy) {
            this.hp = Math.min(this.maxHp, this.hp + dt * 2.0);
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
            let spd = this.speed;
            if (hasBoon('hermes_dash')) spd *= 1.25;
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
            const attackProgress = 1 - (this.attackTimer / 0.22);
            this.animFrame = Math.min(3, Math.floor(attackProgress * 4));
          }
        }

        if (this.castActive) {
          this.castActive.timer -= dt;

          if (hasBoon('duo_blizzard')) {
            gameState.enemies.forEach(e => {
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
        const atkSpdMod = hasBoon('hermes_speed') ? 0.55 : (hasBoon('hermes_haste') ? 0.7 : 1.0);
        if (this.attackTimer > 0 || this.isDashing || gameState.isPaused) return;

        const currentCombo = this.attackCombo; // 0: Cleave, 1: Riposte, 2: Lunge, 3: Crescent Cataclysm (Finisher)
        const isFinisher = (currentCombo === 3);

        this.attackTimer = (isFinisher ? 0.32 : 0.18) * atkSpdMod;
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

        if (hasBoon('apollo_strike')) attackRange += 60;

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

        gameState.enemies.forEach(enemy => {
          const dx = enemy.x - this.x;
          const dy = enemy.y - this.y;
          const dist = Math.hypot(dx, dy);

          if (dist <= attackRange + enemy.radius) {
            const angleToEnemy = Math.atan2(dy, dx);
            let angleDiff = Math.abs(angleToEnemy - this.angle);
            if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;

            if (isFinisher || angleDiff <= attackArc / 2) {
              let finalDmg = baseDmg;
              if (enemy.isWeak && hasBoon('aphrodite_ring')) finalDmg *= 1.5;
              if (enemy.scorchStacks > 0 && enemy.chillStacks > 0 && hasBoon('duo_freezing_inferno')) finalDmg *= 2.5;

              enemy.takeDamage(finalDmg, 'player');
              sound.playHit();
              const chargeGain = (hasBoon('selene_waxing') ? 17 : 12) * (isFinisher ? 2.0 : 1.0);
              this.hexCharge = Math.min(this.hexMax, this.hexCharge + chargeGain);
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
                  const slamDmg = (hasBoon('poseidon_crush') ? 140 : 80) * (isFinisher ? 1.6 : 1.0);
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
        const atkSpdMod = hasBoon('hermes_speed') ? 0.6 : 1.0;
        if (this.specialCooldown > 0 || gameState.isPaused) return;
        this.specialCooldown = 0.48 * atkSpdMod;
        sound.playSlash();

        const spd = 580;
        let specDmg = 36 * (1 + gameState.upgrades.damage * 0.1);
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
          const radius = hasBoon('apollo_ring') ? 140 : 100;
          this.castActive = {
            x: targetX,
            y: targetY,
            radius: radius,
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

        gameState.enemies.forEach(enemy => {
          const dist = Math.hypot(enemy.x - this.castActive.x, enemy.y - this.castActive.y);
          if (dist <= radius + enemy.radius) {
            enemy.takeDamage(dmg, 'cast');
            if (hasBoon('hestia_ring')) {
              enemy.applyScorch(30);
              gameState.particles.push(new AnimatedFireExplosion(enemy.x, enemy.y, 60));
            }
            if (hasBoon('zeus_ring')) {
              procChainLightning(enemy, 22);
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
              enemy.x += Math.cos(ang) * 70;
              enemy.y += Math.sin(ang) * 70;
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
          if (hasBoon('hermes_reflex')) {
            gameState.enemies.forEach(e => {
              if (Math.hypot(e.x - this.x, e.y - this.y) < 180) {
                e.takeDamage(80, 'electric');
              }
            });
            gameState.particles.push(new Shockwave(this.x, this.y, 180, '#facc15'));
          }
          return;
        }

        let finalDmg = amount;
        if (hasBoon('hephaestus_armor')) finalDmg *= 0.75;
        if (hasBoon('hestia_ash') && this.castActive) finalDmg *= 0.75;
        finalDmg = Math.round(finalDmg);

        // Hephaestus Iron Aegis Barrier
        if (this.barrierHp > 0) {
          const absorbed = Math.min(this.barrierHp, finalDmg);
          this.barrierHp -= absorbed;
          finalDmg -= absorbed;
          gameState.particles.push(new FloatingText(this.x, this.y - 32, `BARRIER ABSORBED ${absorbed}`, '#f97316'));
          if (finalDmg <= 0) return;
        }

        this.hp -= finalDmg;
        this.iFrames = 0.6;
        sound.playHit();
        createScreenShake(8);
        updateHUD();

        if (hasBoon('ares_blood')) {
          this.bloodFrenzyCount = 2;
          gameState.particles.push(new FloatingText(this.x, this.y - 40, 'BLOOD FRENZY! (2X ATK)', '#dc2626'));
        }

        if (hasBoon('zeus_bolt')) {
          gameState.enemies.forEach(e => {
            if (Math.hypot(e.x - this.x, e.y - this.y) < 260) {
              procChainLightning(e, 120);
            }
          });
        }

        if (hasBoon('demeter_frostbite')) {
          gameState.enemies.forEach(e => {
            if (Math.hypot(e.x - this.x, e.y - this.y) < 160 && e.chillStacks > 0) {
              e.takeDamage(60, 'frost');
              e.timeSlowTimer = 1.5;
            }
          });
        }

        gameState.particles.push(new FloatingText(this.x, this.y - 24, `-${finalDmg}`, '#ef4444'));

        if (this.hp <= 0) {
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

    // --- ENEMY CLASS ---
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
            this.attackCooldown = 0.15;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(this.angle)*360, Math.sin(this.angle)*360, 24, 'laser_shard', this));
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(this.angle+Math.PI)*360, Math.sin(this.angle+Math.PI)*360, 24, 'laser_shard', this));
          }
        } else if (this.behavior === 'sirens_choir' || this.behavior === 'soul_necromancer') {
          const targetAng = this.angle + 0.03;
          const targetX = player.x + Math.cos(targetAng) * 240;
          const targetY = player.y + Math.sin(targetAng) * 240;
          this.moveWithCollision((targetX - this.x) * 0.05, (targetY - this.y) * 0.05);
          if (this.attackCooldown <= 0) this.startTelegraph('ring', 0.6, 200);
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
        this.telegraphTimer = duration;
        this.telegraphMax = duration;
        this.telegraphParam = radiusOrRange;
        this.telegraphAngle = this.angle;
        this.telegraphTarget = { x: player.x, y: player.y };
        this.animRow = 2;
      }

      executeAttack() {
        this.animRow = 0;
        this.attackCooldown = (this.isBoss || this.isMiniBoss ? 1.3 : 1.8) + Math.random() * 0.8;
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
            player.takeDamage(55);
          }
        } else if (this.telegraphType === 'tartarus_ground_shatter') {
          sound.playExplosion();
          createScreenShake(22);
          if (distToPlayer < 260) player.takeDamage(85);
          gameState.particles.push(new Shockwave(this.x, this.y, 280, '#d97706'));
          for (let i = 0; i < 8; i++) {
            const a = (i / 8) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*260, Math.sin(a)*260, 45, 'magma_ball', this));
          }
        } else if (this.telegraphType === 'thanatos_reaper_cleave') {
          sound.playSlash();
          createScreenShake(18);
          if (distToPlayer < 220) player.takeDamage(95);
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
          this.x = player.x - Math.cos(player.angle) * 75;
          this.y = player.y - Math.sin(player.angle) * 75;
          if (Math.hypot(player.x - this.x, player.y - this.y) < 130) player.takeDamage(80);
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
            player.takeDamage(40);
            player.iFrames = 0.1;
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
            player.takeDamage(75);
          }
          for (let i = 0; i < 20; i++) {
            const a = (i / 20) * Math.PI * 2;
            gameState.projectiles.push(new Projectile(this.x, this.y, Math.cos(a)*360, Math.sin(a)*360, 55, 'time_shard', this));
          }
        } else if (this.telegraphType === 'boss_axe_cleave') {
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
        } else if (this.telegraphType === 'boss_scythe') {
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
        } else if (this.telegraphType === 'circle' || this.telegraphType === 'slam') {
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

          if (hasBoon('apollo_hymn') && player.hp < player.maxHp) {
            player.hp = Math.min(player.maxHp, player.hp + 4);
            updateHUD();
          }

          if (hasBoon('aphrodite_heart') && this.isWeak) {
            gameState.enemies.forEach(e => {
              if (Math.hypot(e.x - this.x, e.y - this.y) < 140) e.takeDamage(80, 'charm');
            });
            gameState.particles.push(new CharmBurst(this.x, this.y));
          }

          if (hasBoon('ares_grim') && this.doomDamage > 0) {
            gameState.enemies.forEach(e => {
              if (Math.hypot(e.x - this.x, e.y - this.y) < 160) e.applyDoom(this.doomDamage);
            });
          }

          if (hasBoon('duo_supernova') && this.scorchStacks > 0) {
            gameState.enemies.forEach(e => {
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
          let sx = (this.cellX !== undefined) ? (this.cellX * cellW) : (this.animFrame * cellW);
          let sy = (this.cellY !== undefined) ? (this.cellY * cellH) : (this.animRow * cellH);

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

    // --- PROJECTILE CLASS (Single-Hit Registration Per Target) ---
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
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime -= dt;
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
          gameState.enemies.forEach(enemy => {
            if (!this.hitEnemies.has(enemy) && Math.hypot(enemy.x - this.x, enemy.y - this.y) <= this.radius + enemy.radius) {
              this.hitEnemies.add(enemy);
              let finalDmg = this.damage;
              if (enemy.isWeak && hasBoon('aphrodite_ring')) finalDmg *= 1.5;
              if (enemy.scorchStacks > 0 && enemy.chillStacks > 0 && hasBoon('duo_freezing_inferno')) finalDmg *= 2.5;

              enemy.takeDamage(finalDmg, 'projectile');
              sound.playHit();
              gameState.particles.push(new HitSpark(enemy.x, enemy.y, '#c084fc'));

              if (this.type === 'moon_sickle') {
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
                  enemy.x += Math.cos(waveAng) * 90;
                  enemy.y += Math.sin(waveAng) * 90;
                  gameState.particles.push(new AnimatedWaterWave(enemy.x, enemy.y, waveAng, 100));
                  enemy.takeDamage(70 * (1 + (pLvl - 1) * 0.4), 'slam');
                }
                if (hasBoon('apollo_special')) {
                  const apLvl = getBoonLevel('apollo_special');
                  gameState.particles.push(new Shockwave(enemy.x, enemy.y, 140, '#fde047'));
                  gameState.enemies.forEach(e => {
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
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        let filterStr = 'none';
        let strokeColor = '#2ae6b4';

        if (hasBoon('zeus_strike')) {
          filterStr = 'hue-rotate(180deg) saturate(320%) brightness(140%)';
          strokeColor = '#38bdf8';
        } else if (hasBoon('hestia_strike')) {
          filterStr = 'hue-rotate(230deg) saturate(320%) brightness(130%)';
          strokeColor = '#ea580c';
        } else if (hasBoon('poseidon_strike')) {
          filterStr = 'hue-rotate(20deg) saturate(350%) brightness(110%)';
          strokeColor = '#0284c7';
        } else if (hasBoon('apollo_strike')) {
          filterStr = 'hue-rotate(145deg) saturate(320%) brightness(160%)';
          strokeColor = '#facc15';
        } else if (hasBoon('demeter_strike')) {
          filterStr = 'hue-rotate(60deg) saturate(260%) brightness(150%)';
          strokeColor = '#7dd3fc';
        } else if (hasBoon('ares_strike')) {
          filterStr = 'hue-rotate(270deg) saturate(350%) brightness(115%)';
          strokeColor = '#dc2626';
        } else if (hasBoon('aphrodite_strike')) {
          filterStr = 'hue-rotate(295deg) saturate(320%) brightness(130%)';
          strokeColor = '#ec4899';
        } else if (hasBoon('hephaestus_strike')) {
          filterStr = 'hue-rotate(210deg) saturate(350%) brightness(130%)';
          strokeColor = '#f97316';
        }

        const animImg = loadedImages['attack_fx_anim'];
        const progress = 1 - (this.life / this.maxLife);

        if (this.combo === 3) {
          // FINISHER: 360 Full Circle Expanding Double Ring Cataclysm
          ctx.save();
          ctx.rotate(progress * Math.PI * 2);
          if (animImg && animImg.complete) {
            ctx.filter = filterStr;
            const cw = animImg.width / 4;
            const ch = animImg.height / 4;
            const sx = this.frame * cw;
            const drawSize = this.range * 2.2;
            ctx.drawImage(animImg, sx, 0, cw, ch, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
            ctx.filter = 'none';
          }
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 8 * (1 - progress);
          ctx.beginPath();
          ctx.arc(0, 0, this.range * (0.4 + progress * 0.6), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else if (this.combo === 1) {
          // STRIKE 2: Reverse Upward Diagonal Riposte
          ctx.save();
          ctx.scale(1, -1);
          if (animImg && animImg.complete) {
            ctx.filter = filterStr;
            const cw = animImg.width / 4;
            const ch = animImg.height / 4;
            const sx = this.frame * cw;
            const drawSize = this.range * 2.0;
            ctx.drawImage(animImg, sx, 0, cw, ch, -this.range * 0.2, -this.range, drawSize, drawSize);
            ctx.filter = 'none';
          } else {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.range, -Math.PI * 0.5, Math.PI * 0.5);
            ctx.stroke();
          }
          ctx.restore();
        } else if (this.combo === 2) {
          // STRIKE 3: Witchcraft Thrust Lunge
          ctx.save();
          ctx.strokeStyle = strokeColor;
          ctx.lineWidth = 8 * (1 - progress);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(this.range * (0.5 + progress * 0.5), 0);
          ctx.stroke();

          if (animImg && animImg.complete) {
            ctx.filter = filterStr;
            const cw = animImg.width / 4;
            const ch = animImg.height / 4;
            const sx = this.frame * cw;
            const drawSize = this.range * 1.6;
            ctx.drawImage(animImg, sx, 0, cw, ch, 0, -drawSize / 2, drawSize, drawSize);
            ctx.filter = 'none';
          }
          ctx.restore();
        } else {
          // STRIKE 0: Standard Cleave
          if (animImg && animImg.complete) {
            ctx.filter = filterStr;
            const cw = animImg.width / 4;
            const ch = animImg.height / 4;
            const sx = this.frame * cw;
            const drawSize = this.range * 2.0;
            ctx.drawImage(animImg, sx, 0, cw, ch, -this.range * 0.2, -this.range, drawSize, drawSize);
            ctx.filter = 'none';
          } else {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, 0, this.range, -Math.PI * 0.5, Math.PI * 0.5);
            ctx.stroke();
          }
        }

        // Elemental spark overlay
        if (hasBoon('zeus_strike')) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(this.range * 0.4, -this.range * 0.3);
          ctx.lineTo(this.range * 0.75, 0);
          ctx.lineTo(this.range * 0.5, this.range * 0.3);
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
      screenShake = intensity;
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

    // --- INFINITE CHAMBERS PROGRESSION WITH MULTIPLE GATES & DIVERSE REWARDS ---
    const INFINITE_BOSS_SEQUENCE = [
      'typhon_prime', 'nyx_primordial', 'tartarus_colossus', 'thanatos_ascended',
      'prometheus_rebound', 'medusa_queen', 'nemesis_supreme', 'charon_harvester',
      'python_ancient', 'chaos_embodied'
    ];

    function startChamber(chamberIndex, chosenReward = null) {
      gameState.chamber = chamberIndex;
      gameState.enemiesCleared = false;
      gameState.doors = [];
      gameState.projectiles = [];
      gameState.particles = [];
      player.x = 0;
      player.y = 260;

      const titleEl = document.getElementById('chamber-name');
      const subEl = document.getElementById('chamber-sub');
      const bossHud = document.getElementById('boss-hud');

      // 1. Grant pre-chosen gate reward if entering a non-combat or specialized room
      if (chosenReward) {
        if (chosenReward.type === 'heart') {
          player.maxHp += 25;
          player.hp += 25;
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
        setTimeout(() => openCharonShop(), 400);
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
        subEl.innerText = chamberIndex > 100 ? 'Infinite Abyssal Depths' : 'Underworld Depths (Enemies 2x Strength)';

        // 3X ENEMY DENSITY (12 to 36+ enemies per room)
        const count = 12 + Math.min(24, Math.floor(chamberIndex / 10) * 4);
        const availableKeys = Object.keys(ENEMY_TYPES).filter(k => !ENEMY_TYPES[k].isBoss && !ENEMY_TYPES[k].isMiniBoss);
        gameState.enemies = [];

        for (let i = 0; i < count; i++) {
          const typeKey = availableKeys[Math.floor(Math.random() * availableKeys.length)];
          const angle = Math.random() * Math.PI * 2;
          const dist = 160 + Math.random() * 380;
          gameState.enemies.push(new Enemy(Math.cos(angle) * dist, Math.sin(angle) * dist, typeKey));
        }
      }

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

      const godKeys = Object.keys(GODS);
      const rewardTypesPool = [
        { type: 'god', godKey: godKeys[Math.floor(Math.random() * godKeys.length)] },
        { type: 'pom', label: 'POM OF POWER (LV UP)' },
        { type: 'shop', label: 'CHARON SHOP (BUY GOODS)' },
        { type: 'heart', label: 'CENTAUR HEART (+25 HP)' },
        { type: 'ash', label: 'DARK ASHES (+15 ASH)' },
        { type: 'god', godKey: godKeys[Math.floor(Math.random() * godKeys.length)] }
      ];

      // Shuffle and pick 2 distinct rewards
      for (let i = rewardTypesPool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [rewardTypesPool[i], rewardTypesPool[j]] = [rewardTypesPool[j], rewardTypesPool[i]];
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
      gameState.enemiesCleared = true;
      sound.playBoonChime();

      // Clear Round Gold Bounty!
      const roundBounty = 25 + Math.floor(Math.random() * 20);
      gameState.gold += roundBounty;
      gameState.particles.push(new FloatingText(player.x, player.y - 30, `+${roundBounty} 🪙 ROUND CLEARED!`, '#f59e0b'));
      sound.playGold();
      updateHUD();

      // Open 2-3 Choice Gates
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
          gameState.equippedBoons.push({ ...boon, level: 1, godName: boon.isDuo ? boon.gods.join(' & ') : god.name });
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

    function openPomModal(onComplete) {
      if (gameState.equippedBoons.length === 0) {
        // If no boons, grant +50 Max HP instead
        player.maxHp += 50;
        player.hp += 50;
        sound.playBoonChime();
        gameState.particles.push(new FloatingText(player.x, player.y - 40, '+50 MAX HP (NO BOONS TO UPGRADE)', '#ef4444'));
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
      if (rewImg && rewImg.complete) {
        pctx.drawImage(rewImg, 0, 0, 256, 256, 0, 0, 120, 120);
      }

      const container = document.getElementById('pom-choices-container');
      container.innerHTML = '';

      // Pick up to 3 player boons to level up
      const upgradeable = [...gameState.equippedBoons].sort(() => Math.random() - 0.5).slice(0, 3);

      upgradeable.forEach(boon => {
        const curLvl = boon.level || 1;
        const nextLvl = curLvl + 1;
        const card = document.createElement('div');
        card.className = 'boon-card';
        card.innerHTML = `
          <div>
            <div class="boon-rarity" style="color:#ef4444;">POM UPGRADE</div>
            <div class="boon-card-name">${boon.name} <span class="boon-lvl-badge">Lv ${curLvl} ➔ Lv ${nextLvl}</span></div>
            <div class="boon-card-desc">${boon.desc}</div>
          </div>
          <div class="boon-card-slot">+40% Base Efficacy & Potency</div>
        `;
        card.onclick = () => {
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
      if (rewImg && rewImg.complete) {
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
        { name: 'Centaur Heart Vessel', desc: 'Gain +35 Permanent Maximum Health.', cost: 120, type: 'heart' }
      ];

      shopItems.forEach(item => {
        const card = document.createElement('div');
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
          if (gameState.gold >= item.cost) {
            gameState.gold -= item.cost;
            sound.playGold();
            updateHUD();
            card.style.opacity = '0.35';
            card.style.pointerEvents = 'none';

            if (item.type === 'god') {
              modal.style.display = 'none';
              openGodBoonModal(item.godKey, () => modal.style.display = 'flex');
            } else if (item.type === 'pom') {
              modal.style.display = 'none';
              openPomModal(() => modal.style.display = 'flex');
            } else if (item.type === 'heal') {
              player.hp = Math.min(player.maxHp, player.hp + 75);
              sound.playBoonChime();
              updateHUD();
            } else if (item.type === 'heart') {
              player.maxHp += 35;
              player.hp += 35;
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

      const currentRevives = 1 + Math.floor(gameState.upgrades.defiance / 20);
      const ranksInCurrentTier = gameState.upgrades.defiance % 20;

      const upgrades = [
        { key: 'maxHp', title: 'Titanic Vitality', desc: '+20 Max Health per rank', cost: 5 },
        { key: 'magick', title: 'Arcane Pool', desc: '+15 Max Magick per rank', cost: 5 },
        { key: 'damage', title: 'Witchcraft Might', desc: '+10% All Damage per rank', cost: 8 },
        { key: 'defiance', title: 'Death Defiance', desc: `+1 Revive every 20 ranks (Current Revives: ${currentRevives}, Progress: ${ranksInCurrentTier}/20)`, cost: 12 }
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
      document.getElementById('boss-name-text').innerText = boss.name;
      const hpPct = Math.max(0, (boss.hp / boss.maxHp) * 100);
      document.getElementById('boss-hp-bar').style.width = `${hpPct}%`;
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

    function openSkillCodex() {
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
              ${level > 1 ? `<span class="codex-tag" style="background: rgba(16,185,129,0.2); border-color:#10b981; color:#34d399;">+${(level - 1) * 40}% Potency</span>` : ''}
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
      document.getElementById('codex-modal').style.display = 'none';
      gameState.isPaused = false;
    }

    document.getElementById('close-codex-btn').onclick = closeSkillCodex;
    document.getElementById('open-codex-btn').onclick = openSkillCodex;

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

        // Check gate entry
        if (gameState.doors.length > 0) {
          gameState.doors.forEach(door => {
            if (Math.hypot(player.x - door.x, player.y - door.y) < door.radius + player.radius) {
              const reward = door.reward;
              const nextChamber = gameState.chamber + 1;

              if (reward.type === 'god') {
                openGodBoonModal(reward.godKey, () => startChamber(nextChamber));
              } else if (reward.type === 'pom') {
                openPomModal(() => startChamber(nextChamber));
              } else if (reward.type === 'shop') {
                startChamber(nextChamber, reward);
              } else {
                startChamber(nextChamber, reward);
              }
            }
          });
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

      // 2. Props (Exit Gates with Floating Reward Medallions)
      drawProps(ctx, time);

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

    function drawProps(ctx, time) {
      const tilesImg = loadedImages['consistent_tiles'];
      const propsImg = loadedImages['props'];
      const godsImg = loadedImages['all_10_gods'];
      const rewImg = loadedImages['reward_icons'];

      // Pillars
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

      // Interactive Exit Gates with 3D Preview Medallions
      if (gameState.doors.length > 0) {
        gameState.doors.forEach((door, idx) => {
          ctx.save();
          ctx.translate(door.x, door.y);

          // Gate arch
          if (propsImg && propsImg.complete) {
            const cw = propsImg.width / 3;
            const ch = propsImg.height / 3;
            ctx.drawImage(propsImg, cw * 2, 0, cw, ch, -60, -100, 120, 120);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, door.radius, Math.PI, 0);
            ctx.fillStyle = '#2ae6b4';
            ctx.fill();
          }

          // Floating Reward Medallion above gate
          const bob = Math.sin(time / 280 + idx * 2) * 8;
          const medY = -140 + bob;

          // Glowing aura behind medallion
          ctx.beginPath();
          ctx.arc(0, medY, 36, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(230, 180, 80, 0.35)';
          ctx.fill();

          // Render specific reward medallion
          if (door.reward.type === 'god' && godsImg && godsImg.complete) {
            const god = GODS[door.reward.godKey];
            if (god) {
              const col = god.portraitIndex % 5;
              const row = Math.floor(god.portraitIndex / 5);
              ctx.drawImage(godsImg, col * 256, row * 256, 256, 256, -32, medY - 32, 64, 64);
            }
          } else if (door.reward.type === 'pom' && rewImg && rewImg.complete) {
            ctx.drawImage(rewImg, 0, 0, 256, 256, -32, medY - 32, 64, 64);
          } else if (door.reward.type === 'shop' && rewImg && rewImg.complete) {
            ctx.drawImage(rewImg, 256, 0, 256, 256, -32, medY - 32, 64, 64);
          } else if (door.reward.type === 'heart' && rewImg && rewImg.complete) {
            ctx.drawImage(rewImg, 0, 256, 256, 256, -32, medY - 32, 64, 64);
          } else if (door.reward.type === 'ash' && rewImg && rewImg.complete) {
            ctx.drawImage(rewImg, 256, 256, 256, 256, -32, medY - 32, 64, 64);
          }

          // Gate Label
          ctx.font = 'bold 12px Cinzel';
          ctx.fillStyle = '#fff2a8';
          ctx.textAlign = 'center';
          ctx.shadowColor = '#000';
          ctx.shadowBlur = 6;
          ctx.fillText(door.reward.label || 'ENTER CHAMBER', 0, -190 + bob);

          ctx.restore();
        });
      }
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

print(f"Successfully compiled Complete Edition index.html with multiple gates, poms, and 100+ boons ({len(final_html)} bytes)!")
