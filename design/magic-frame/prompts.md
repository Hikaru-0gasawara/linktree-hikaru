# Magic frame prompts (Higgsfield, GPT Image 2.6, 736x1024, quality high, 1k)

References: image 1 = the card's geometry template (`template.py <card>`), image 2 = `style-reference.png` (the front of
Hikaru's original Magic business card, the "book cover" classic frame). One variant per card. See docs/adr/0001.

## Pass 1: the complete card (design and typography reference)

```
Finish image 1 into the front of a real, premium Magic: The Gathering card, in the same classic "book cover" frame
style, materials and finish as image 2. Image 1 is a strict layout: keep every box exactly where it is and the same
size (title bar, art window, type line, text box, {PT}collector line along the bottom black border). Do not move,
resize, add or remove boxes. Dress the frame in {COLOR} as its colour identity: {COLOR_NOTE}. Give it the full
finish of a printed Magic card: engraved metal or stone frame texture, subtle ornaments, bevelled bars, the parchment
text box, a holofoil-free classic look. Typeset all the text exactly as written in image 1 with real Magic
typography: the title in a Beleren-style bold, the rules text in a Plantin-style serif, keywords in the style of
Magic keyword abilities. The four labels at the bottom of the text box ({BUTTONS}) must look like small engraved
plaques or buttons that fit the frame. The art window stays a plain dark rectangle with no picture in it.
No extra text, no watermark, no signature, no set symbol other than a small gem in the type line.
```

## Pass 2: the frame the site uses (text areas empty)

Same references plus the pass 1 result as image 3:

```
Recreate image 3 exactly, same frame, same materials, same colours, same box positions and sizes, but with every
piece of text removed: the title bar, type line, text box, {PT}plaques and the collector line are empty, showing only
their clean texture, and the art window is a plain flat dark rectangle. Keep the plaques as empty engraved shapes in
the same places. No text, letters, numbers or symbols anywhere except the mana gems in the title bar and the gem in
the type line.
```

## Results (Higgsfield job ids, GPT Image 2.6, 736x1024 high 1k)

The full cards are kept here as `<card>-full.webp` (the typography the site's live text follows); the empty frames are
`site/img/frame-<card>.webp`. Colour identity per card: Hikaru gold (W U B R G), Portfolio red-blue, AquaSense blue-green,
ECOS black, Ferrovia white-red, Procurando o Fábio blue-black, IoT Safe colourless artifact.

| card | pass 1 (full) | pass 2 (frame) |
|---|---|---|
| hikaru | a35d0b37-5db3-401f-b243-0443f6a7a9f1 | 2116d96a-fbd3-44aa-8fbb-09d4e1083f0b |
| portfolio | 47a3302f-7834-4c40-9140-4b268e94beb8 | bc2f6758-1e53-4cf4-ab0c-c925345340cc |
| aquasense | 10c90f5c-94b3-49db-8314-7cb28b5ce570 | ff3bde80-094d-4630-ae29-83e347edec0c |
| ecos | a7eb899b-70a8-4662-99aa-845e50be547e | d0696791-0785-4314-85c7-3a679ff6c3c8 |
| ferrovia | f196995e-b70d-4c8c-b6d3-5ddf46e72aa5 | f7f03781-1411-40a7-9ae7-9fec87d6de76 |
| fabio | 1e287bd9-fb6e-4066-a74e-39929a06dbe1 | 86abdefa-d40d-40ca-8593-0b3ecc71e56f |
| cofre | e76c6a6a-a8bd-467b-ad1b-f2bad7e9eb42 | 838b2810-a85e-46dc-b2dc-3bf1a7fee6c6 |

The boxes of each frame were read with `measure.py` (scan-line runs) and the plaques from zoomed crops; they are the
per-card variables at the top of the Magic frame block in site/styles.css.

## Real Magic proportions (second geometry)

The first frames had a wide, short art window (2.4:1) and a text box half the card tall. `template.py` now follows a real
Magic card (title bar 4-9 % of the height, art window 10-55 % at about 1.4:1, type line 56-61 %, text box 62-91 %, P/T box
over the text box's corner). Each frame was regenerated in one pass from the blank template (`template.py <card> <out>
--blank`, which keeps the plaques) plus the card's previous frame as the style reference:

```
Dress image 1 in exactly the frame of image 2: the same materials, colours, ornaments, engraving and finish, the same
{MANA} at the right end of the title bar and the same small gem at the right end of the type line. Image 1 is a strict
layout with the proportions of a real Magic: The Gathering card: keep every box exactly where it is and the same size [...].
Every text area is empty [...]; the plaques are empty engraved shapes; the art window is a plain flat dark rectangle.
```

| card | frame job (current) |
|---|---|
| hikaru | 758a2de1-e23e-4b44-b22d-edf86a0fce40 |
| portfolio | 3db562d9-a403-428b-9a2d-ec5d7a703edc |
| aquasense | 1ac54a3b-dfce-42ca-9fad-1ce9742e4370 |
| ecos | cb897e36-732c-4fa3-a0b8-8808cfd8d571 |
| ferrovia | e549b089-870d-4130-89ac-214cb42de9f2 |
| fabio | 9f707c9c-8bc6-4319-ba44-95ab4cb41db6 |
| cofre | 1a5f7068-b89b-4573-a50d-caf4bc2159a3 |

ECOS, Ferrovia and IoT Safe came back with a somewhat shorter art window (about 1.55:1); the CSS follows each frame's
own measured boxes, so they are kept. The `-full.webp` references above are from the first geometry: they still show the
typography, not the proportions.

## Hikaru's art window

`site/img/hikaru-art.webp` comes from `assets/hikaru-card-art.png`, job 01a8dc6c-f229-4e3e-9d12-5f79ece5852b (1024x720,
the art window's 1.42:1): a studio portrait in a stronger, still informal pose (three-quarter turn, arms crossed, framed
from the thighs), generated from his own photos (the current portrait and three studio shots from the Data Vault's
`overall-me` references) with a stock portrait used only as the pose reference.
