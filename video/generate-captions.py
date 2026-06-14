#!/usr/bin/env python3
# Transparent 1920x1080 caption overlays (verbatim to voiceover) for video compositing.
import os
from PIL import Image, ImageDraw, ImageFont

BASE = os.path.expanduser("~/Projects/verigate-arbitrum/video")
OUT = f"{BASE}/captions"
os.makedirs(OUT, exist_ok=True)
W, H = 1920, 1080

CAPTIONS = {
    "01-hook": "A tokenized Tesla share. It only moves to a wallet that's allowed to hold it.",
    "02-problem": "Tokenized stocks are securities. They can't legally reach a wallet that isn't verified, or one in a sanctioned country.",
    "03-engine": "Behind it sits a compliance engine. Country rules, accreditation, a holder cap, all enforced on every transfer.",
    "04-registry": "Investors get verified on-chain. Each wallet earns a KYC credential, its jurisdiction and accreditation read from the chain.",
    "05-activity": "Every compliance decision is a public record. Each settled transfer, each block, each reason. None of it off-chain.",
    "06-gate": "Send to an unverified wallet and it reverts, with the reason on-chain. Verify that investor, and the same transfer settles.",
    "07-close": "Live and source-verified on Robinhood Chain and Arbitrum. Covenant. Compliance, enforced at the token.",
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

FONT = load_font(44)

def wrap(draw, text, font, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=font) <= max_w: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

for name, text in CAPTIONS.items():
    img = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    margin = 220
    lines = wrap(d, text, FONT, W - 2*margin)
    lh = 58
    box_h = lh*len(lines) + 44
    box_y0 = H - box_h - 84
    maxw = max(d.textlength(l, font=FONT) for l in lines)
    bx0 = (W - maxw)//2 - 44
    bx1 = (W + maxw)//2 + 44
    # subtle drop shadow then warm-dark pill
    d.rounded_rectangle([bx0+3, box_y0+4, bx1+3, box_y0+box_h+4], radius=16, fill=(0, 0, 0, 70))
    d.rounded_rectangle([bx0, box_y0, bx1, box_y0+box_h], radius=16, fill=(20, 17, 14, 224))
    y = box_y0 + 22
    for l in lines:
        lw = d.textlength(l, font=FONT)
        d.text(((W-lw)//2, y), l, font=FONT, fill=(247, 243, 236, 255))
        y += lh
    img.save(f"{OUT}/{name}.png")
    print("caption", name, f"({len(lines)} lines)")
print("done")
