"""Generate dashboard frames for Verigate demo video.
These simulate the connected wallet state since we can't use Puppeteer for that."""

from PIL import Image, ImageDraw, ImageFont
import os

W, H = 1920, 1080
FRAMES = os.path.join(os.path.dirname(__file__), 'frames')

# Colors
BLACK = (11, 13, 17)
SURFACE1 = (18, 20, 26)
SURFACE2 = (26, 29, 37)
TEXT1 = (236, 230, 219)
TEXT2 = (170, 165, 155)
TEXT3 = (130, 125, 115)
AMBER = (201, 165, 92)
GREEN = (52, 211, 153)
RED = (248, 113, 113)
BORDER = (35, 38, 47)
AMBER_BORDER = (55, 48, 30)

# Fonts
def get_font(size, bold=False):
    for name in ['HelveticaNeue.ttc', 'Helvetica.ttc', '/System/Library/Fonts/Helvetica.ttc',
                 '/System/Library/Fonts/SFNSMono.ttf', '/Library/Fonts/Arial.ttf']:
        try:
            return ImageFont.truetype(name, size, index=1 if bold and name.endswith('.ttc') else 0)
        except:
            continue
    return ImageFont.load_default()

def get_mono(size):
    for name in ['/System/Library/Fonts/SFNSMono.ttf', '/System/Library/Fonts/Menlo.ttc',
                 '/Library/Fonts/Courier New.ttf']:
        try:
            return ImageFont.truetype(name, size)
        except:
            continue
    return ImageFont.load_default()

font_lg = get_font(28, bold=True)
font_md = get_font(18)
font_sm = get_font(14)
font_xs = get_font(12)
mono_lg = get_mono(36)
mono_md = get_mono(16)
mono_sm = get_mono(13)
mono_xs = get_mono(11)

def draw_panel(draw, x, y, w, h, border_color=BORDER):
    draw.rectangle([x, y, x+w, y+h], fill=SURFACE1, outline=border_color)

def draw_header(draw):
    draw.rectangle([0, 0, W, 56], fill=(11, 13, 17, 230))
    draw.line([(0, 56), (W, 56)], fill=BORDER, width=1)
    draw.text((24, 14), "VG", fill=AMBER, font=get_font(22, bold=True))
    draw.text((60, 18), "Verigate", fill=TEXT1, font=get_font(17))
    # Testnet badge
    draw.rectangle([140, 18, 210, 38], fill=(40, 35, 22), outline=AMBER_BORDER)
    draw.text((148, 22), "TESTNET", fill=AMBER, font=mono_xs)
    # Wallet
    draw.rectangle([1700, 12, 1896, 44], fill=SURFACE2, outline=BORDER)
    draw.ellipse([1710, 22, 1718, 30], fill=GREEN)
    draw.text((1724, 17), "0xf994...4355", fill=TEXT2, font=mono_sm)

def draw_section_title(draw, x, y, text):
    draw.text((x, y), text, fill=TEXT1, font=get_font(22))


# ============================================================
# CLIP 03: Dashboard — Token + Compliance panels
# ============================================================
img = Image.new('RGB', (W, H), BLACK)
draw = ImageDraw.Draw(img)
draw_header(draw)

draw.text((64, 88), "Compliance Dashboard", fill=TEXT1, font=get_font(26))

# Token panel (left)
draw_panel(draw, 64, 140, 880, 340)
draw_section_title(draw, 88, 164, "Token")
draw.text((88, 204), "Verigate Demo Token", fill=TEXT2, font=font_md)
draw.text((310, 206), "VGATE", fill=TEXT3, font=mono_sm)
draw.text((88, 244), "YOUR BALANCE", fill=TEXT3, font=mono_xs)
draw.text((88, 268), "999,999.00", fill=AMBER, font=mono_lg)
draw.line([(88, 330), (920, 330)], fill=BORDER, width=1)
draw.text((88, 348), "TOTAL SUPPLY", fill=TEXT3, font=mono_xs)
draw.text((88, 368), "1,000,000", fill=TEXT2, font=mono_md)
draw.text((500, 348), "COMPLIANCE ENGINE", fill=TEXT3, font=mono_xs)
draw.text((500, 368), "0x5Bf71E...FDba7", fill=AMBER, font=mono_md)

# Compliance panel (right)
draw_panel(draw, 968, 140, 880, 340)
draw_section_title(draw, 992, 164, "Compliance")
# Status rows
draw.text((992, 210), "BAS Attestation", fill=TEXT2, font=font_md)
draw.text((1680, 210), "Verified", fill=GREEN, font=mono_sm)
draw.line([(992, 242), (1824, 242)], fill=BORDER, width=1)
draw.text((992, 256), "Freeze Status", fill=TEXT2, font=font_md)
draw.text((1700, 256), "Active", fill=GREEN, font=mono_sm)
draw.line([(992, 288), (1824, 288)], fill=BORDER, width=1)
# Modules
draw.text((992, 308), "ACTIVE MODULES", fill=TEXT3, font=mono_xs)
for i, (name, addr) in enumerate([
    ("CountryRestriction", "0x742D...41f8"),
    ("AccreditedInvestor", "0x77C3...ED26"),
    ("MaxHolders", "0xE5c8...1424"),
]):
    y = 336 + i * 36
    draw.rectangle([992, y, 1824, y+30], fill=SURFACE2)
    draw.ellipse([1002, y+11, 1010, y+19], fill=GREEN)
    draw.text((1020, y+6), name, fill=TEXT1, font=mono_sm)
    draw.text((1700, y+8), addr, fill=TEXT3, font=mono_xs)

img.save(os.path.join(FRAMES, '03-solution.png'))
print('  -> 03-solution.png')


# ============================================================
# CLIP 04: Transfer blocked
# ============================================================
img = Image.new('RGB', (W, H), BLACK)
draw = ImageDraw.Draw(img)
draw_header(draw)

draw.text((64, 88), "Compliance Dashboard", fill=TEXT1, font=get_font(26))

# Transfer panel with amber border
draw_panel(draw, 64, 140, 1784, 500, border_color=AMBER_BORDER)
draw_section_title(draw, 88, 164, "Transfer")

# Recipient input
draw.text((88, 210), "RECIPIENT", fill=TEXT3, font=mono_xs)
draw.rectangle([88, 234, 920, 278], fill=SURFACE2, outline=BORDER)
draw.text((100, 244), "0x3333333333333333333333333333333333333333", fill=TEXT1, font=mono_sm)

# Amount input
draw.text((88, 300), "AMOUNT", fill=TEXT3, font=mono_xs)
draw.rectangle([88, 324, 400, 368], fill=SURFACE2, outline=BORDER)
draw.text((100, 334), "100.00", fill=TEXT1, font=mono_md)

# BLOCKED result
draw.rectangle([88, 400, 920, 460], fill=(40, 16, 16), outline=(80, 30, 30))
draw.text((110, 410), "X", fill=RED, font=get_font(22, bold=True))
draw.text((140, 415), "Blocked: CountryRestriction: recipient has no attestation", fill=RED, font=mono_sm)

# Buttons
draw.rectangle([88, 490, 400, 538], fill=SURFACE1, outline=BORDER)
draw.text((190, 505), "Pre-Check", fill=TEXT2, font=font_md)
draw.rectangle([420, 490, 730, 538], fill=AMBER)
draw.text((530, 505), "Transfer", fill=BLACK, font=font_md)

img.save(os.path.join(FRAMES, '04-blocked.png'))
print('  -> 04-blocked.png')


# ============================================================
# CLIP 05: Transfer approved
# ============================================================
img = Image.new('RGB', (W, H), BLACK)
draw = ImageDraw.Draw(img)
draw_header(draw)

draw.text((64, 88), "Compliance Dashboard", fill=TEXT1, font=get_font(26))

# Transfer panel
draw_panel(draw, 64, 140, 1784, 500, border_color=AMBER_BORDER)
draw_section_title(draw, 88, 164, "Transfer")

# Recipient
draw.text((88, 210), "RECIPIENT", fill=TEXT3, font=mono_xs)
draw.rectangle([88, 234, 920, 278], fill=SURFACE2, outline=BORDER)
draw.text((100, 244), "0x2222222222222222222222222222222222222222", fill=TEXT1, font=mono_sm)

# Amount
draw.text((88, 300), "AMOUNT", fill=TEXT3, font=mono_xs)
draw.rectangle([88, 324, 400, 368], fill=SURFACE2, outline=BORDER)
draw.text((100, 334), "1,000.00", fill=TEXT1, font=mono_md)

# APPROVED result
draw.rectangle([88, 400, 920, 460], fill=(10, 40, 26), outline=(20, 70, 45))
draw.text((140, 415), "Transfer is compliant", fill=GREEN, font=mono_sm)

# Tx status
draw.rectangle([88, 480, 920, 520], fill=SURFACE2, outline=BORDER)
draw.text((100, 490), "Confirmed", fill=TEXT2, font=font_sm)
draw.text((220, 492), "0xaecf8fc7...e974f80", fill=AMBER, font=mono_xs)

# Buttons
draw.rectangle([88, 540, 400, 588], fill=SURFACE1, outline=BORDER)
draw.text((190, 555), "Pre-Check", fill=TEXT2, font=font_md)
draw.rectangle([420, 540, 730, 588], fill=AMBER)
draw.text((530, 555), "Transfer", fill=BLACK, font=font_md)

img.save(os.path.join(FRAMES, '05-approved.png'))
print('  -> 05-approved.png')


# ============================================================
# CLIP 06: Issuer admin panel
# ============================================================
img = Image.new('RGB', (W, H), BLACK)
draw = ImageDraw.Draw(img)
draw_header(draw)

draw.text((64, 88), "Compliance Dashboard", fill=TEXT1, font=get_font(26))

# Issuer panel with amber border
draw_panel(draw, 64, 140, 1784, 680, border_color=AMBER_BORDER)
draw.text((88, 164), "Issuer Admin", fill=TEXT1, font=get_font(22))
# Owner badge
draw.rectangle([260, 166, 320, 186], fill=(40, 35, 22), outline=AMBER_BORDER)
draw.text((268, 170), "OWNER", fill=AMBER, font=mono_xs)

# Mint section
draw.line([(88, 210), (1824, 210)], fill=BORDER, width=1)
draw.text((88, 226), "Mint Tokens", fill=TEXT1, font=font_md)
draw.text((88, 260), "RECIPIENT", fill=TEXT3, font=mono_xs)
draw.rectangle([88, 280, 800, 318], fill=SURFACE2, outline=BORDER)
draw.text((820, 260), "AMOUNT", fill=TEXT3, font=mono_xs)
draw.rectangle([820, 280, 1050, 318], fill=SURFACE2, outline=BORDER)
draw.rectangle([1070, 280, 1170, 318], fill=AMBER)
draw.text((1095, 292), "Mint", fill=BLACK, font=font_sm)

# Attestation section
draw.line([(88, 346), (1824, 346)], fill=BORDER, width=1)
draw.text((88, 362), "Set Attestation UID", fill=TEXT1, font=font_md)

# Freeze section
draw.line([(88, 420), (1824, 420)], fill=BORDER, width=1)
draw.text((88, 436), "Freeze / Unfreeze", fill=TEXT1, font=font_md)

# Country restrictions
draw.line([(88, 494), (1824, 494)], fill=BORDER, width=1)
draw.text((88, 510), "Country Restrictions", fill=TEXT1, font=font_md)
# Blocked chips
for i, code in enumerate(["KP", "IR", "SY"]):
    x = 88 + i * 70
    draw.rectangle([x, 548, x+54, 574], fill=(40, 16, 16), outline=(80, 30, 30))
    draw.text((x+12, 554), code, fill=RED, font=mono_sm)

# Country input
draw.text((88, 598), "CODE", fill=TEXT3, font=mono_xs)
draw.rectangle([88, 618, 200, 656], fill=SURFACE2, outline=BORDER)
draw.rectangle([220, 618, 310, 656], fill=(40, 16, 16), outline=(80, 30, 30))
draw.text((238, 630), "Block", fill=RED, font=font_sm)
draw.rectangle([330, 618, 440, 656], fill=SURFACE1, outline=BORDER)
draw.text((340, 630), "Unblock", fill=TEXT2, font=font_sm)

img.save(os.path.join(FRAMES, '06-issuer.png'))
print('  -> 06-issuer.png')

print('Dashboard frames generated.')
