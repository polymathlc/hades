import json
import base64
import os
import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent
parser = argparse.ArgumentParser(description='Build the standalone Hades game from src/.')
parser.add_argument('--check', action='store_true', help='Fail when index.html needs rebuilding.')
args = parser.parse_args()

# Asset loading
assets_keys = [
    'hero', 'shade', 'witch', 'chronos',
    'consistent_tiles', 'seamless_floor', 'props', 'ui',
    'all_10_gods', 'monsters_beasts', 'undead_cultists',
    'minibosses', 'reward_icons',
    'infinite_bosses_a', 'infinite_bosses_b', 'infinite_bosses_c'
]

b64_data = {}
for k in assets_keys:
    webp_path = ROOT / 'assets_webp' / f"{k}.webp"
    with open(webp_path, 'rb') as fp:
        enc = base64.b64encode(fp.read()).decode('utf-8')
        b64_data[k] = f"data:image/webp;base64,{enc}"

print(f"Loaded {len(b64_data)} assets into memory.")

# Source files are composed in dependency order into the standalone deployment.
SOURCE_FILES = ['runtime.js', 'attack-svg-art.js', 'learning.js', 'data.js', 'player.js', 'enemies.js', 'effects.js', 'world.js', 'flow.js', 'boon-effects.js', 'loop.js', 'render.js', 'startup.js']
source_root = ROOT / 'src'
html_template = (source_root / 'index.template.html').read_text(encoding='utf-8')
styles = '\n'.join((source_root / name).read_text(encoding='utf-8') for name in ['styles.css', 'runtime.css', 'learning.css'])
final_html = html_template.replace('%STYLES%', styles)
final_html = final_html.replace('%SCRIPTS%', '\n'.join((source_root / name).read_text(encoding='utf-8') for name in SOURCE_FILES))
final_html = final_html.replace('%ASSETS_JSON%', json.dumps(b64_data))
output = ROOT / 'index.html'
if args.check:
    if output.read_text(encoding='utf-8') != final_html:
        raise SystemExit('index.html is stale. Run python generate_game.py and commit the result.')
    print('index.html matches src/ and assets.')
else:
    output.write_text(final_html, encoding='utf-8', newline='\n')
    print('Compiled index.html from src/.')
