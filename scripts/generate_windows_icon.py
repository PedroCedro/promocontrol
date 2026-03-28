from pathlib import Path

from PIL import Image, ImageDraw


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[index:index + 2], 16) for index in (0, 2, 4))


def lerp_color(start: tuple[int, int, int], end: tuple[int, int, int], factor: float) -> tuple[int, int, int, int]:
    return tuple(int(start[i] + (end[i] - start[i]) * factor) for i in range(3)) + (255,)


def draw_diagonal_gradient(draw: ImageDraw.ImageDraw, size: int, start: tuple[int, int, int], end: tuple[int, int, int]) -> None:
    span = max(size - 1, 1)
    for y in range(size):
        for x in range(size):
            factor = (x + y) / (2 * span)
            draw.point((x, y), fill=lerp_color(start, end, factor))


def create_promocontrol_icon(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gradient = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    gradient_draw = ImageDraw.Draw(gradient)
    draw_diagonal_gradient(gradient_draw, size, hex_to_rgb("#2f6df6"), hex_to_rgb("#234fc0"))

    mask = Image.new("L", (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    padding = max(round(size * 0.046875), 1)
    radius = max(round(size * 0.21875), 1)
    mask_draw.rounded_rectangle(
        (padding, padding, size - padding - 1, size - padding - 1),
        radius=radius,
        fill=255,
    )
    image.alpha_composite(gradient)
    image.putalpha(mask)

    draw = ImageDraw.Draw(image)

    p_points = [
        (0.34375, 0.6875),
        (0.34375, 0.3125),
        (0.546875, 0.3125),
    ]
    p_path = [
        (round(size * x), round(size * y))
        for x, y in [
            (0.34375, 0.6875),
            (0.34375, 0.3125),
            (0.546875, 0.3125),
            (0.640625, 0.3125),
            (0.71875, 0.375),
            (0.71875, 0.46875),
            (0.71875, 0.5625),
            (0.640625, 0.625),
            (0.546875, 0.625),
            (0.4375, 0.625),
            (0.4375, 0.6875),
        ]
    ]
    draw.polygon(p_path, fill="white")

    hole_path = [
        (round(size * x), round(size * y))
        for x, y in [
            (0.4375, 0.53125),
            (0.4375, 0.40625),
            (0.53125, 0.40625),
            (0.578125, 0.40625),
            (0.609375, 0.4375),
            (0.609375, 0.46875),
            (0.609375, 0.5),
            (0.578125, 0.53125),
            (0.53125, 0.53125),
        ]
    ]
    draw.polygon(hole_path, fill=None, outline=None)
    draw.polygon(hole_path, fill=(0, 0, 0, 0))

    accent = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    accent_draw = ImageDraw.Draw(accent)
    accent_start = hex_to_rgb("#ff7a59")
    accent_end = hex_to_rgb("#ff9f5a")
    line_width = max(round(size * 0.0625), 2)
    check_points = [
        (round(size * 0.375), round(size * 0.734375)),
        (round(size * 0.453125), round(size * 0.8125)),
        (round(size * 0.625), round(size * 0.640625)),
    ]
    for index in range(len(check_points) - 1):
        segment_start = check_points[index]
        segment_end = check_points[index + 1]
        steps = 32
        for step in range(steps + 1):
            factor = (index + step / steps) / (len(check_points) - 1)
            color = lerp_color(accent_start, accent_end, factor)
            x = round(segment_start[0] + (segment_end[0] - segment_start[0]) * (step / steps))
            y = round(segment_start[1] + (segment_end[1] - segment_start[1]) * (step / steps))
            accent_draw.ellipse(
                (x - line_width // 2, y - line_width // 2, x + line_width // 2, y + line_width // 2),
                fill=color,
            )
        accent_draw.line([segment_start, segment_end], fill=accent_end, width=line_width)

    image.alpha_composite(accent)
    return image


def main() -> None:
    project_root = Path(__file__).resolve().parent.parent
    output_path = project_root / "assets" / "release" / "promocontrol.ico"
    output_path.parent.mkdir(parents=True, exist_ok=True)

    icon = create_promocontrol_icon(256)
    icon.save(
        output_path,
        format="ICO",
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    print(output_path)


if __name__ == "__main__":
    main()
