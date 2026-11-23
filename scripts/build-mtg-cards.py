# Renders the Hikaru Magic business cards and single Magic cards from the Data Vault PDFs to site webps, with the phone
# number taken off (backs: PDF redaction; the flat "Wanted" fronts: pixel patch). Needs pymupdf, numpy and Pillow.
# usage: python scripts/build-mtg-cards.py <Data-Vault MTG-idea/Hikaru dir> site/img <preview dir for PNG copies>
import sys, io, pymupdf, numpy as np
from PIL import Image

src, dst, prev = sys.argv[1:4]
W = 920
Z = W / 178.58267211914062  # px per pt
PHONE = ('97119', '+55')

def render(page):
    pix = page.get_pixmap(matrix=pymupdf.Matrix(Z, Z))
    return np.asarray(Image.frombytes('RGB', (pix.width, pix.height), pix.samples)).astype(np.float32)

def chars_on_line(page, y):
    out = []
    for b in page.get_text('rawdict')['blocks']:
        for ln in b.get('lines', []):
            for sp in ln['spans']:
                for c in sp['chars']:
                    if c['bbox'][1] <= y <= c['bbox'][3]: out.append(c)
    return sorted(out, key=lambda c: c['bbox'][0])

def move_text(normal, clean, box, shift, color):
    """copy the text in box (pixels, from `normal` over `clean`) `shift` px right onto clean, re-blending its alpha"""
    x0, y0, x1, y1 = box
    out = clean.copy()
    c = np.array(color, np.float32)
    lum = lambda a: a @ np.array([0.299, 0.587, 0.114], np.float32)
    n, bg = normal[y0:y1, x0:x1], clean[y0:y1, x0:x1]
    a = np.clip((lum(bg) - lum(n)) / np.maximum(lum(bg) - lum(c), 1), 0, 1)[..., None]
    dst_ = out[y0:y1, x0 + shift:x1 + shift]
    out[y0:y1, x0 + shift:x1 + shift] = a * c + (1 - a) * dst_
    return out

def save(arr, name):
    im = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    im.save(f'{dst}/{name}.webp', quality=82, method=6)
    im.save(f'{prev}/{name}.png')
    return im.size

def back_without_phone(pdf, centred):
    """a business-card back: the e-mail line loses ' · +55 …'; centred lines keep the e-mail centred"""
    doc = pymupdf.open(pdf); page = doc[1]
    normal = render(page)
    lines = {}
    for b in page.get_text('rawdict')['blocks']:
        for ln in b.get('lines', []):
            t = ''.join(c['c'] for sp in ln['spans'] for c in sp['chars'])
            if any(p in t for p in PHONE): lines[round(ln['bbox'][1], 1)] = ln['bbox']
    assert lines, pdf
    ymid = (min(r[1] for r in lines.values()) + max(r[3] for r in lines.values())) / 2
    chars = [c for c in chars_on_line(page, ymid) if c['c'].strip()]
    text = ''.join(c['c'] for c in chars)
    if centred:  # 'e-mail · +55 11 …' on one line
        cut = text.index('+55') - 1  # the '·' before the phone
        assert chars[cut]['c'] in '·•', text
        email = chars[:cut]
        lx0, ly0, lx1, ly1 = chars[0]['bbox'][0], min(c['bbox'][1] for c in chars), chars[-1]['bbox'][2], max(c['bbox'][3] for c in chars)
    else:  # the phone has a line of its own
        email = []
        lx0, ly0, lx1, ly1 = min(c['bbox'][0] for c in chars), min(c['bbox'][1] for c in chars), max(c['bbox'][2] for c in chars), max(c['bbox'][3] for c in chars)
    page.add_redact_annot(pymupdf.Rect(lx0 - 0.3, ly0, lx1 + 0.3, ly1), fill=False)
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
    clean = render(page)
    assert not any(p in page.get_text() for p in PHONE), pdf
    if not email: return clean
    ex0, ex1 = email[0]['bbox'][0], email[-1]['bbox'][2]
    shift = round(((lx0 + lx1) / 2 - (ex0 + ex1) / 2) * Z) if centred else 0
    color = normal[int((ly0 + ly1) / 2 * Z)].min(axis=0)  # darkest pixel on the line ≈ ink
    box = (int(ex0 * Z) - 2, int(ly0 * Z), int(ex1 * Z) + 3, int(ly1 * Z) + 2)
    return move_text(normal, clean, box, shift, color)

def raster_front_without_phone(pdf):
    """a flat-image front (736x1024 art) with 'e-mail • +55 …' bottom right: drop the phone, set the e-mail flush right
    where the line ended. Line measured on both Wanted arts: rows 976-994, e-mail x 376-564, phone ends at x 692."""
    doc = pymupdf.open(pdf)
    raw = Image.open(io.BytesIO(doc.extract_image(doc[0].get_images()[0][0])['image'])).convert('RGB')
    assert raw.size == (736, 1024), raw.size
    normal = np.asarray(raw).astype(np.float32)
    y0, y1, ex0, ex1, lx1 = 975, 995, 376, 564, 693
    lum = normal @ np.array([0.299, 0.587, 0.114], np.float32)
    assert (lum[y0:y1, 566:lx1] < 90).sum() > 100 and (lum[y0:y1, lx1:lx1 + 20] < 90).sum() == 0, 'phone not where expected'
    clean = normal.copy()
    clean[y0:y1, ex0:lx1] = normal[y1 + 1:y1 + 1 + (y1 - y0), ex0:lx1]  # the parchment just below the line, moved up
    color = normal[y0:y1, ex0:ex1].reshape(-1, 3)[lum[y0:y1, ex0:ex1].argmin()]
    out = move_text(normal, clean, (ex0, y0, ex1, y1), lx1 - ex1, color)
    im = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    return np.asarray(im.resize((W, round(1024 * W / 736)), Image.LANCZOS)).astype(np.float32)

H = f'{src}'
cards = {
    'mtg-card-archengineer': ('Cartao_de_Visita/meishi-mtg-hikaru-cartao-archengineer.pdf', 'text', True),
    'mtg-card-wanted': ('Cartao_de_Visita/meishi-mtg-hikaru-cartao-wanted.pdf', 'raster', False),
    'mtg-card-pulp': ('Cartao_de_Visita/meishi-mtg-hikaru-cartao-pulp.pdf', 'text', True),
}
for name, (pdf, front, centred) in cards.items():
    p = f'{H}/{pdf}'
    f = raster_front_without_phone(p) if front == 'raster' else render(pymupdf.open(p)[0])
    print(name, 'front', save(f, f'{name}-front'), 'back', save(back_without_phone(p, centred), f'{name}-back'))
singles = {
    'mtg-archengineer': ('Archengineer_Prompter/meishi-mtg-hikaru-archengineer.pdf', False),
    'mtg-wanted': ('Wanted_Engenheiro/meishi-mtg-hikaru-wanted.pdf', True),
    'mtg-pulp': ('Pulp_Grand_Artificer/meishi-mtg-hikaru-pulp.pdf', False),
}
for name, (pdf, phone) in singles.items():
    p = f'{H}/{pdf}'
    f = raster_front_without_phone(p) if phone else render(pymupdf.open(p)[0])
    print(name, 'front', save(f, f'{name}-front'))
