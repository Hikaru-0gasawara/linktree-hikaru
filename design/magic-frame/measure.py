# Finds the boxes of a generated empty frame, in card px (460x642), so site/styles.css can place the live text in them.
# Reads luminance along scan lines and prints the runs: P = parchment (bright), D = dark (art window, black border),
# F = frame. usage: python measure.py <frame.png>
import sys
import numpy as np
from PIL import Image

im = np.asarray(Image.open(sys.argv[1]).convert('L')).astype(float)
H, W = im.shape
sx, sy = 460 / W, 642 / H

def segs(line, scale, min_len=3):
    k = np.convolve(line, np.ones(3) / 3, 'same')
    cls = np.where(k > 150, 'P', np.where(k < 45, 'D', 'F'))
    out, start = [], 0
    for i in range(1, len(cls) + 1):
        if i == len(cls) or cls[i] != cls[start]:
            if i - start >= min_len: out.append((cls[start], round(start * scale, 1), round(i * scale, 1)))
            start = i
    return out

def band(rows=None, cols=None):
    """median over a 9 px wide band, which ignores texture specks"""
    return np.median(im[rows, :], 0) if rows is not None else np.median(im[:, cols], 1)

x = int(W * .40)  # left of the mana gems, right of the plaques' gaps
v = segs(band(cols=slice(x - 4, x + 5)), sy)
print('vertical @x=%.0f:' % (x * sx), ' '.join(f'{c}{a}-{b}' for c, a, b in v))
for c, a, b in v:
    if b - a < 12: continue
    y = int((a + b) / 2 / sy)
    h = segs(band(rows=slice(y - 4, y + 5)), sx)
    print(f'  row y={round(y * sy)} ({c}):', ' '.join(f'{k}{p}-{q}' for k, p, q in h))
