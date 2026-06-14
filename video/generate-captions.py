#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.expanduser("~/Projects/verigate-arbitrum/video")
FRAMES, OUT = f"{BASE}/frames", f"{BASE}/composites"
os.makedirs(OUT, exist_ok=True)

CAPTIONS = {
    "01-hook": "A tokenized Tesla share that can't reach the wrong hands.",
    "02-problem": "Tokenized stocks are securities. They can't move to an unverified, sanctioned, or non-accredited wallet.",
    "03-solution": "Covenant enforces the rules at the token. Every transfer checks an on-chain KYC attestation before it settles.",
    "04-blocked": "An investor's wallet carries a live on-chain KYC credential: jurisdiction, accreditation, the issuer.",
    "05-verify": "The issuer onboards investors here. One attestation, linked to a wallet, lets it hold the security.",
    "06-hardpart": "Unverified, or wrong jurisdiction? It reverts. Verified? The same transfer settles.",
    "07-close": "Live and source-verified on Robinhood Chain and Arbitrum. Covenant — compliance, enforced at the token.",
}

FONT_PATHS = [
    "/System/Library/Fonts/Supplemental/Arial.ttf",
    "/System/Library/Fonts/Helvetica.ttc",
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
]
def load_font(size):
    for p in FONT_PATHS:
        if os.path.exists(p):
            try: return ImageFont.truetype(p, size)
            except Exception: pass
    return ImageFont.load_default()

FONT = load_font(46)

def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= max_w: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

for name, text in CAPTIONS.items():
    src = f"{FRAMES}/{name}.png"
    if not os.path.exists(src):
        print("missing frame", name); continue
    img = Image.open(src).convert("RGBA")
    W, H = img.size
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    margin = 200
    lines = wrap(d, text, FONT, W - 2*margin)
    lh = 60
    box_h = lh*len(lines) + 48
    box_y0 = H - box_h - 70
    # centered pill
    maxw = max(d.textlength(l, font=FONT) for l in lines)
    bx0 = (W - maxw)//2 - 40
    bx1 = (W + maxw)//2 + 40
    d.rounded_rectangle([bx0, box_y0, bx1, box_y0+box_h], radius=14, fill=(20, 17, 14, 210))
    y = box_y0 + 24
    for l in lines:
        lw = d.textlength(l, font=FONT)
        d.text(((W-lw)//2, y), l, font=FONT, fill=(247, 243, 236, 255))
        y += lh
    Image.alpha_composite(img, overlay).convert("RGB").save(f"{OUT}/{name}.png")
    print("captioned", name)
print("done")
