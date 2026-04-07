#!/usr/bin/env python3
"""Composite subtitle text onto frames."""

from PIL import Image, ImageDraw, ImageFont
import os, textwrap

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(SCRIPT_DIR, 'frames')
COMPOSITES_DIR = os.path.join(SCRIPT_DIR, 'composites')
os.makedirs(COMPOSITES_DIR, exist_ok=True)

# VERBATIM match to audio script
CLIPS = {
    "01-hook": "Three billion dollars in tokenized real-world assets on BNB Chain. And right now, there's no native way to enforce who can hold them.",
    "02-problem": "Existing projects use simple address whitelisting. That works for minting. But the moment those tokens hit a DEX or a lending protocol, the whitelist can't follow.",
    "03-solution": "Verigate checks every transfer against on-chain attestations from BAS, the BNB Attestation Service. Three compliance modules run on every transfer. Country restrictions. Accredited investor verification. Holder cap enforcement.",
    "04-blocked": "Try to transfer without a valid attestation, and the transaction reverts. The compliance engine tells you exactly why. Which module blocked it. What's missing.",
    "05-approved": "Add the attestation, try again, and the transfer goes through. That's the core loop. Verify, then transfer.",
    "06-issuer": "Token issuers get a full admin panel. Mint tokens. Map attestations to wallets. Freeze addresses. Configure country restrictions. All on-chain. All modular.",
    "07-close": "Verigate. Built on BAS. Native to BNB Chain. Open source. Compliance infrastructure for the next wave of tokenized assets.",
}

def get_font(size):
    candidates = [
        '/System/Library/Fonts/HelveticaNeue.ttc',
        '/System/Library/Fonts/Helvetica.ttc',
        '/Library/Fonts/Arial.ttf',
    ]
    for f in candidates:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except:
                continue
    return ImageFont.load_default()

font = get_font(32)

for clip, text in CLIPS.items():
    frame_path = os.path.join(FRAMES_DIR, f'{clip}.png')
    if not os.path.exists(frame_path):
        print(f'SKIP {clip} (no frame)')
        continue

    img = Image.open(frame_path).convert('RGBA')
    # Resize to 1920x1080 if needed
    if img.size != (1920, 1080):
        img = img.resize((1920, 1080), Image.LANCZOS)

    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    wrapped = textwrap.fill(text, width=70)
    lines = wrapped.split('\n')

    line_height = 42
    padding = 20
    margin_x = 160
    box_h = len(lines) * line_height + padding * 2
    box_y = img.height - box_h - 60
    box_w = img.width - margin_x * 2

    draw.rounded_rectangle(
        [(margin_x, box_y), (margin_x + box_w, box_y + box_h)],
        radius=12,
        fill=(0, 0, 0, 140)
    )

    y = box_y + padding
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = margin_x + (box_w - tw) // 2
        draw.text((x, y), line, fill=(255, 255, 255, 240), font=font)
        y += line_height

    result = Image.alpha_composite(img, overlay)
    result = result.convert('RGB')
    result.save(os.path.join(COMPOSITES_DIR, f'{clip}.png'))
    print(f'OK {clip}')

print('All composites generated')
