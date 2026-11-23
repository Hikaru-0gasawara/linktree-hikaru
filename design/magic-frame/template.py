# The Magic frame's geometry, drawn flat for Higgsfield to finish (docs/adr/0001). One template per card: the boxes are the
# same on every card (site/styles.css places the live text in them), the placeholder text and colour differ.
# usage: python design/magic-frame/template.py <card> <out.png> [--blank]
#   --blank: the same geometry with every text area empty, the plaques blank and the art window plain: the frame the site uses
import sys
from PIL import Image, ImageDraw, ImageFont

W, H = 736, 1024          # Higgsfield size (multiples of 16), the card's 460x642 proportion
S = W / 460               # card px -> template px
# the geometry, in card px (460x642); keep in sync with the .mframe rules in site/styles.css
# proportions of a real Magic card (modern frame): title bar at 4-9 % of the height, art window 10-55 % (about 1.4:1),
# type line 56-61 %, text box 62-91 %, the power/toughness box over the text box's bottom right corner
GEO = {
    'title': (22, 24, 438, 58),
    'art': (30, 64, 430, 350),
    'type': (22, 356, 438, 388),
    'text': (28, 394, 432, 586),
    'pt': (354, 570, 440, 604),   # Hikaru's card only
    'collector': (22, 606, 438, 634),
}
CARDS = {
    'hikaru': dict(color='gold', name='Hikaru Ogasawara', mana='W U B R G', pt='*/*',
                   type='Legendary Creature — Computer Engineering Student · Ibmec SP · 21',
                   lines=['Focus  Infra · Security · Data', 'Speaks  PT · EN · JP', 'Base  São Paulo, BR',
                          'Curious since childhood, I learn by doing: build, test, measure', 'and redo until I understand why.',
                          'Calm under pressure · Initiative · Teamwork · Leadership', 'Deadlines · Fast learner · Re-tests until it works'],
                   buttons=['E-mail', 'LinkedIn', 'GitHub', 'Résumé'], collector='HKR • 0001 • EN    ● open to projects    SP · BR'),
    'portfolio': dict(color='red', name='Portfolio', mana='R U', type='Project — Interactive web',
        lines=['A pixel-art portfolio: an explorable room with projects, a', 'lab, a skill tree, minigames, résumés and a fast lane for', 'recruiters. In PT, EN and JA.', 'Stack  HTML · CSS · JS · WebGL', 'Highlights  3D TV, boot, secret passages', 'Status  live'],
        buttons=['Play', 'Code'], slots=3, collector='HKR • 0002 • EN    ● live    2026'),
    'aquasense': dict(color='blue', name='AquaSense', mana='U G', type='Team project — IoT',
        lines=['A pool monitor with solar heating: the ESP32 firmware reads', 'pH, chlorine, ORP and temperatures, runs the pump on the', 'temperature difference and streams it all over MQTT to a live', 'dashboard.', 'Stack  ESP32 · C++ · MQTT · React · TS', 'Highlights  live dashboard, Alexa skill, TLS', 'Status  live demo'],
        buttons=['Play', 'Code'], slots=3, collector='HKR • 0003 • EN    ● live demo    2026'),
    'ecos': dict(color='black', name='ECOS', mana='B', type='Project — Desktop game',
        lines=['A quiz race inside a dying giant computer: 1 to 4 players on', 'one screen and a new dungeon every run. The pixel art and the', 'sound are made by the code itself.', 'Stack  Python · Tkinter', 'Highlights  seeded dungeons, no dependencies, PT and EN', 'Status  playable'],
        buttons=['Code'], slots=3, collector='HKR • 0004 • EN    ● playable    2026'),
    'ferrovia': dict(color='white', name='Ferrovia', mana='W R', type='Team project — Desktop app',
        lines=['A rail operations centre for Windows: it simulates 13 historic', 'São Paulo lines, 173 stations and 26 trains, with fleet,', 'incidents and a live map.', 'Stack  Java · Spring Boot · React · Electron', 'Highlights  installer, bundled Java, H2 or PostgreSQL', 'Status  v1.0'],
        buttons=['Code'], slots=3, collector='HKR • 0005 • EN    ● v1.0    2026'),
    'fabio': dict(color='blue', name='Procurando o Fábio', mana='U B', type='Project — 3D web game',
        lines=['A 3D sea adventure in the browser: Nikolau, a patriotic', 'piranha, follows a trail of clues after the missing leader', 'Fábio and faces Zed the orca.', 'Stack  TypeScript · Three.js · Vite', 'Highlights  3D models built by script, prologue and act 1', 'Status  in development'],
        buttons=['Code'], slots=3, collector='HKR • 0006 • EN    ● in development    2026'),
    'cofre': dict(color='artifact', name='IoT Safe', mana='2', type='Project — Embedded system',
        lines=['An electronic safe on an ESP32: a 4-digit code on a 3×4', 'keypad, an LCD with custom icons and a servo that locks and', 'releases. Adapted from Uri Shaked.', 'Stack  ESP32 · C++ · MicroPython', 'Highlights  NVS storage, jitter-free servo, Pico port', 'Status  prototype'],
        buttons=['Code'], slots=3, collector='HKR • 0007 • EN    ● prototype    2026'),
}
FILL = {'gold': (201, 164, 72), 'white': (226, 220, 200), 'blue': (70, 110, 170), 'black': (60, 56, 64), 'red': (176, 70, 52),
        'green': (60, 120, 70), 'artifact': (150, 150, 156)}

def box(k):
    x0, y0, x1, y1 = GEO[k]
    return (round(x0 * S), round(y0 * S), round(x1 * S), round(y1 * S))

def font(size, bold=False):
    return ImageFont.truetype('C:/Windows/Fonts/' + ('georgiab.ttf' if bold else 'georgia.ttf'), round(size * S))

def draw(card, blank):
    c = CARDS[card]; col = FILL[c['color']]
    im = Image.new('RGB', (W, H), (0, 0, 0))
    d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, W - 1, H - 1), radius=round(18 * S), fill=(18, 16, 14))       # the black border
    d.rounded_rectangle((round(10 * S), round(10 * S), W - round(10 * S), round(602 * S)), radius=round(8 * S), fill=col)  # frame
    for k in ('title', 'type'):
        d.rounded_rectangle(box(k), radius=round(6 * S), fill=(236, 228, 206), outline=(40, 34, 28), width=2)
    d.rectangle(box('art'), fill=(40, 40, 44), outline=(20, 18, 16), width=3)
    d.rectangle(box('text'), fill=(240, 232, 212), outline=(40, 34, 28), width=2)
    if c.get('pt'): d.rounded_rectangle(box('pt'), radius=round(6 * S), fill=(236, 228, 206), outline=(40, 34, 28), width=2)
    x0, y0, x1, y1 = box('title')
    if not blank: d.text((x0 + 10, (y0 + y1) / 2), c['name'], font=font(20, True), fill=(20, 16, 12), anchor='lm')
    if not blank: d.text((x1 - 10, (y0 + y1) / 2), c['mana'], font=font(13, True), fill=(20, 16, 12), anchor='rm')
    x0, y0, x1, y1 = box('art')
    if not blank: d.text(((x0 + x1) / 2, (y0 + y1) / 2), 'ART', font=font(18), fill=(120, 120, 128), anchor='mm')
    x0, y0, x1, y1 = box('type')
    if not blank: d.text((x0 + 10, (y0 + y1) / 2), c['type'], font=font(11.5, True), fill=(20, 16, 12), anchor='lm')
    x0, y0, x1, y1 = box('text'); y = y0 + 14
    for ln in ([] if blank else c['lines']):
        d.text((x0 + 14, y), ln, font=font(11.5), fill=(28, 22, 16)); y += round(19 * S)
    right = box('pt')[0] - 12 if c.get('pt') else x1 - 14  # the row stops short of the P/T box
    n = c.get('slots', 4)  # plaque width: a quarter of the row on Hikaru's card, a third on a project
    bw = (right - x0 - 14 - (n - 1) * 10) / n
    for i, b in enumerate(c['buttons']):
        bx = x0 + 14 + i * (bw + 10)
        d.rounded_rectangle((bx, y1 - 56, bx + bw, y1 - 16), radius=8, fill=(210, 196, 160), outline=(60, 48, 30), width=2)
        if not blank: d.text((bx + bw / 2, y1 - 41), b, font=font(11, True), fill=(28, 22, 16), anchor='mm')
    if c.get('pt') and not blank:
        x0, y0, x1, y1 = box('pt'); d.text(((x0 + x1) / 2, (y0 + y1) / 2), c['pt'], font=font(15, True), fill=(20, 16, 12), anchor='mm')
    x0, y0, x1, y1 = box('collector')
    if not blank: d.text((x0 + 4, (y0 + y1) / 2), c['collector'], font=font(9), fill=(230, 224, 210), anchor='lm')
    return im

if __name__ == '__main__':
    card, out = sys.argv[1], sys.argv[2]
    draw(card, '--blank' in sys.argv).save(out)
