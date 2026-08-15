import os
import numpy as np
from PIL import Image

def key_magenta(im, threshold=110, softness=40):
    im = im.convert('RGBA')
    arr = np.array(im, dtype=np.float32)
    r, g, b, a = arr[:,:,0], arr[:,:,1], arr[:,:,2], arr[:,:,3]
    
    dist = np.sqrt((r - 255)**2 + g**2 + (b - 255)**2)
    alpha = np.ones_like(a) * 255.0
    alpha[dist < threshold] = 0.0
    fade_mask = (dist >= threshold) & (dist < (threshold + softness))
    alpha[fade_mask] = (dist[fade_mask] - threshold) / float(softness) * 255.0
    
    fringe_mask = (alpha > 0) & (alpha < 255) | ((r > g + 40) & (b > g + 40) & (alpha > 0))
    arr[:,:,0][fringe_mask] = np.minimum(r[fringe_mask], g[fringe_mask] + 30)
    arr[:,:,2][fringe_mask] = np.minimum(b[fringe_mask], g[fringe_mask] + 30)
    
    arr[:,:,3] = alpha
    return Image.fromarray(np.uint8(np.clip(arr, 0, 255)), 'RGBA')

os.makedirs('assets_webp', exist_ok=True)

# 1. Minibosses sheet (2x2 grid)
mb_boss_im = Image.open('assets/minibosses.jpg')
mb_boss_keyed = key_magenta(mb_boss_im)
mb_boss_keyed.save('assets_webp/minibosses.webp', 'WEBP', quality=85, method=6)
print("Saved minibosses.webp")

print("Asset processing complete!")
