import os
import base64
import numpy as np
from PIL import Image

def key_magenta(im, threshold=110, softness=40):
    im = im.convert('RGBA')
    arr = np.array(im, dtype=np.float32)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    # Distance from pure magenta (255, 0, 255)
    dist = np.sqrt((r - 255)**2 + g**2 + (b - 255)**2)
    
    alpha = np.ones_like(a) * 255.0
    alpha[dist < threshold] = 0.0
    fade_mask = (dist >= threshold) & (dist < (threshold + softness))
    alpha[fade_mask] = (dist[fade_mask] - threshold) / float(softness) * 255.0
    
    # Desaturate pink fringe
    fringe_mask = (alpha > 0) & (alpha < 255) | ((r > g + 40) & (b > g + 40) & (alpha > 0))
    arr[:,:,0][fringe_mask] = np.minimum(r[fringe_mask], g[fringe_mask] + 30)
    arr[:,:,2][fringe_mask] = np.minimum(b[fringe_mask], g[fringe_mask] + 30)
    
    arr[:,:,3] = alpha
    return Image.fromarray(np.uint8(np.clip(arr, 0, 255)), 'RGBA')

os.makedirs('assets_keyed', exist_ok=True)
os.makedirs('assets_webp', exist_ok=True)

files = [
    'hero.jpg', 'shade.jpg', 'witch.jpg', 'chronos.jpg',
    'consistent_tiles.jpg', 'props.jpg', 'gods.jpg', 'ui.jpg',
    'fx.jpg', 'attack_fx_anim.jpg'
]

b64_dict = {}

for f in files:
    path = os.path.join('assets', f)
    if os.path.exists(path):
        im = Image.open(path)
        keyed = key_magenta(im)
        key_name = f.replace('.jpg', '')
        
        # Save as optimized webp
        webp_path = os.path.join('assets_webp', f"{key_name}.webp")
        keyed.save(webp_path, 'WEBP', quality=85, method=6)
        
        with open(webp_path, 'rb') as wfp:
            encoded = base64.b64encode(wfp.read()).decode('utf-8')
            b64_dict[key_name] = f"data:image/webp;base64,{encoded}"
            print(f"Loaded and encoded {key_name}: {len(encoded)} chars")

print("All assets processed!")
