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

# 1. Reward icons (2x2 grid, 256x256 each)
rew_im = Image.open('assets/reward_icons.jpg')
rew_sheet = Image.new('RGBA', (512, 512), (0, 0, 0, 0))

cell_w = 1024 / 2.0
cell_h = 1024 / 2.0
crop_size = min(cell_w, cell_h) * 0.96

for c in range(2):
    for r in range(2):
        cx = c * cell_w + cell_w / 2.0
        cy = r * cell_h + cell_h / 2.0
        cropped = rew_im.crop((cx - crop_size/2, cy - crop_size/2, cx + crop_size/2, cy + crop_size/2)).resize((256, 256), Image.Resampling.LANCZOS)
        keyed = key_magenta(cropped)
        rew_sheet.paste(keyed, (c * 256, r * 256))

rew_sheet.save('assets_webp/reward_icons.webp', 'WEBP', quality=90, method=6)
print("Saved reward_icons.webp!")
