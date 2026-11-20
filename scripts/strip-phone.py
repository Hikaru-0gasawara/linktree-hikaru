# Removes the phone number from the contact line of each site résumé, re-typesetting the line with the PDF's own font.
import sys, re, pymupdf
site, out = sys.argv[1], sys.argv[2]
PHONE = re.compile(r'(\(11\) 97119-2311|\+55 11 97119-2311)')
for lang in ['pt', 'en', 'ja']:
    path = f'{site}/hikaru-{lang}.pdf'
    doc = pymupdf.open(path)
    page = doc[0]
    target = None
    for b in page.get_text('dict')['blocks']:
        for ln in b.get('lines', []):
            for s in ln['spans']:
                if PHONE.search(s['text']): target = s
    assert target, lang
    t = target['text']
    if lang == 'ja':
        new = re.sub(r'電話：[^　]+　｜　', '', t)
    else:
        new = re.sub(r'\xa0\|\xa0 ' + PHONE.pattern + r' ', '', t)
    assert '97119' not in new and new != t, (lang, new)
    # grab the embedded font used by the span
    xref = next(f[0] for f in page.get_fonts() if f[3].split('+')[-1] == target['font'] or target['font'] in f[3])
    name, ext, _, buf = doc.extract_font(xref)
    # the embedded subsets lack glyphs for the new text; Calibri ships with Windows, YuGothic subset covers its line
    font = pymupdf.Font(fontfile='C:/Windows/Fonts/calibri.ttf') if target['font'] == 'Calibri' else pymupdf.Font(fontbuffer=buf)
    x0, y0, x1, y1 = target['bbox']
    page.add_redact_annot(pymupdf.Rect(x0 - 1, y0 + 0.3, x1 + 1, y1 - 0.3))
    page.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE, graphics=pymupdf.PDF_REDACT_LINE_ART_NONE)
    size = target['size']
    w = font.text_length(new, fontsize=size)
    ox, oy = target['origin']
    if lang != 'ja':
        ox = (x0 + x1) / 2 - w / 2  # line is centered
    tw = pymupdf.TextWriter(page.rect, color=pymupdf.sRGB_to_pdf(target['color']))
    tw.append((ox, oy), new, font=font, fontsize=size)
    tw.write_text(page)
    doc.subset_fonts()
    doc.save(f'{out}/hikaru-{lang}.pdf', garbage=3, deflate=True)
    check = pymupdf.open(f'{out}/hikaru-{lang}.pdf')
    alltext = ''.join(p.get_text() for p in check)
    assert '97119' not in alltext and '2311@outlook' in alltext, lang
    check[0].get_pixmap(dpi=150, clip=pymupdf.Rect(40, y0 - 30, 560, y1 + 30)).save(f'{out}/{lang}.png')
    print(lang, 'ok:', repr(new))
