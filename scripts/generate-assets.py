"""生成 DSChat 的 PWA 图标和 Capacitor 启动图资源。

设计：深色底 + 渐变对话气泡 + 白色分支图标。
运行：python scripts/generate-assets.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_ICONS = ROOT / 'public' / 'icons'
RESOURCES = ROOT / 'resources'

SIZE = 1024
BG = (18, 19, 23, 255)
BLUE_START = (58, 107, 255)
BLUE_END = (122, 162, 255)
WHITE = (255, 255, 255, 255)


def gradient(size: int) -> Image.Image:
    image = Image.new('RGB', (size, size))
    pixels = image.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * (size - 1))
            pixels[x, y] = tuple(
                round(BLUE_START[i] + (BLUE_END[i] - BLUE_START[i]) * t) for i in range(3)
            )
    return image.convert('RGBA')


def rounded_mask(size: int) -> Image.Image:
    mask = Image.new('L', (size, size), 0)
    draw = ImageDraw.Draw(mask)
    # 气泡主体
    draw.rounded_rectangle((170, 180, 854, 700), radius=150, fill=255)
    # 左下角尾巴，与主体连通
    draw.polygon([(290, 650), (290, 800), (430, 680)], fill=255)
    return mask


def branch_layer(size: int) -> Image.Image:
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    width = 34
    # 竖线 + 两条分支曲线
    draw.line([(390, 390), (390, 630)], fill=WHITE, width=width)
    draw.line([(390, 390), (500, 405), (590, 455), (640, 510)], fill=WHITE, width=width, joint='curve')
    draw.line([(390, 630), (500, 615), (590, 565), (640, 510)], fill=WHITE, width=width, joint='curve')
    for x, y in ((390, 390), (390, 630), (640, 510)):
        draw.ellipse((x - 48, y - 48, x + 48, y + 48), fill=WHITE)
    return layer


def logo_layer(size: int) -> Image.Image:
    logo = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    bubble = gradient(size)
    logo.paste(bubble, (0, 0), rounded_mask(size))
    logo.alpha_composite(branch_layer(size))
    return logo


def icon(size: int, maskable: bool = False) -> Image.Image:
    base = Image.new('RGBA', (size, size), BG)
    logo = logo_layer(SIZE)
    if maskable:
        # 安全区：整体缩到 80%，四周留出裁切余量
        scaled_size = round(size * 0.8)
        logo = logo.resize((scaled_size, scaled_size), Image.LANCZOS)
        offset = (size - scaled_size) // 2
        base.alpha_composite(logo, (offset, offset))
    else:
        base.alpha_composite(logo.resize((size, size), Image.LANCZOS))
    return base


def main() -> None:
    PUBLIC_ICONS.mkdir(parents=True, exist_ok=True)
    RESOURCES.mkdir(parents=True, exist_ok=True)

    master = icon(SIZE)
    master.save(PUBLIC_ICONS / 'icon-512.png')
    master.resize((192, 192), Image.LANCZOS).save(PUBLIC_ICONS / 'icon-192.png')
    icon(512, maskable=True).save(PUBLIC_ICONS / 'icon-maskable-512.png')
    master.resize((180, 180), Image.LANCZOS).save(PUBLIC_ICONS / 'apple-touch-icon-180.png')
    master.resize((64, 64), Image.LANCZOS).save(PUBLIC_ICONS / 'favicon-64.png')
    master.resize((32, 32), Image.LANCZOS).save(PUBLIC_ICONS / 'favicon-32.png')

    # Capacitor 资源：1024 图标 + 2732 启动图（亮/暗共用同一深色底）
    master.save(RESOURCES / 'icon.png')
    splash = Image.new('RGBA', (2732, 2732), BG)
    splash_icon = master.resize((900, 900), Image.LANCZOS)
    splash.alpha_composite(splash_icon, ((2732 - 900) // 2, (2732 - 900) // 2))
    splash.save(RESOURCES / 'splash.png')
    splash.save(RESOURCES / 'splash-dark.png')

    print('Generated PWA and Capacitor assets.')


if __name__ == '__main__':
    main()
