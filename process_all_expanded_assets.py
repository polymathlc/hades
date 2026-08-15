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

# 1. Build unified 10 God Medallions (5x2 grid, 256x256 each)
gods_im = Image.open('assets/gods.jpg')
gods_exp_im = Image.open('assets/gods_expansion.jpg')

all_gods_sheet = Image.new('RGBA', (256 * 5, 256 * 2), (0, 0, 0, 0))

# 6 Original Gods
orig_god_coords = [
    (0, 0), # Zeus -> (col 0, row 0)
    (1, 0), # Hestia -> (col 1, row 0)
    (2, 0), # Poseidon -> (col 2, row 0)
    (0, 1), # Apollo -> (col 3, row 0)
    (1, 1), # Selene -> (col 4, row 0)
    (2, 1), # Hermes -> (col 0, row 1)
]

target_slots = [
    (0, 0), (1, 0), (2, 0), (3, 0), (4, 0), (0, 1)
]

cell_w = 1024 / 3.0
cell_h = 1024 / 2.0
crop_size = min(cell_w, cell_h) * 0.96

for i in range(6):
    src_c, src_r = orig_god_coords[i]
    cx = src_c * cell_w + cell_w / 2.0
    cy = src_r * cell_h + cell_h / 2.0
    cropped = gods_im.crop((cx - crop_size/2, cy - crop_size/2, cx + crop_size/2, cy + crop_size/2)).resize((256, 256), Image.Resampling.LANCZOS)
    keyed = key_magenta(cropped)
    dst_c, dst_r = target_slots[i]
    all_gods_sheet.paste(keyed, (dst_c * 256, dst_r * 256))

# 4 Expansion Gods: Aphrodite, Hephaestus, Demeter, Ares
exp_coords = [
    (0, 0), # Aphrodite -> (col 1, row 1)
    (1, 0), # Hephaestus -> (col 2, row 1)
    (0, 1), # Demeter -> (col 3, row 1)
    (1, 1), # Ares -> (col 4, row 1)
]
exp_targets = [
    (1, 1), (2, 1), (3, 1), (4, 1)
]

exp_cell_w = 1024 / 2.0
exp_cell_h = 1024 / 2.0
exp_crop_size = min(exp_cell_w, exp_cell_h) * 0.96

for i in range(4):
    src_c, src_r = exp_coords[i]
    cx = src_c * exp_cell_w + exp_cell_w / 2.0
    cy = src_r * exp_cell_h + exp_cell_h / 2.0
    cropped = gods_exp_im.crop((cx - exp_crop_size/2, cy - exp_crop_size/2, cx + exp_crop_size/2, cy + exp_crop_size/2)).resize((256, 256), Image.Resampling.LANCZOS)
    keyed = key_magenta(cropped)
    dst_c, dst_r = exp_targets[i]
    all_gods_sheet.paste(keyed, (dst_c * 256, dst_r * 256))

all_gods_sheet.save('assets_webp/all_10_gods.webp', 'WEBP', quality=90, method=6)
print("Saved all_10_gods.webp")

# 2. Keyed Monsters & Beasts
mb_im = Image.open('assets/monsters_beasts.jpg')
mb_keyed = key_magenta(mb_im)
mb_keyed.save('assets_webp/monsters_beasts.webp', 'WEBP', quality=85, method=6)
print("Saved monsters_beasts.webp")

# 3. Keyed Undead & Cultists (crop top 86% of each cell to exclude text labels)
uc_im = Image.open('assets/undead_cultists.jpg')
uc_keyed = key_magenta(uc_im)
uc_keyed.save('assets_webp/undead_cultists.webp', 'WEBP', quality=85, method=6)
print("Saved undead_cultists.webp")

# 4. Keyed New Projectiles & Skills
np_im = Image.open('assets/new_projectiles.jpg')
np_keyed = key_magenta(np_im)
np_keyed.save('assets_webp/new_projectiles.webp', 'WEBP', quality=85, method=6)
print("Saved new_projectiles.webp")

print("All expanded assets successfully processed into WebP!")
