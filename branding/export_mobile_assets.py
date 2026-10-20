import subprocess
from pathlib import Path

BASE_DIR = Path("/home/alves/projetos/shortstory")
BRANDING_DIR = BASE_DIR / "branding"
MOBILE_ASSETS = BASE_DIR / "apps/mobile/assets/images"
MASCOT_DIR = MOBILE_ASSETS / "mascot"

MASCOT_DIR.mkdir(parents=True, exist_ok=True)

# 1. Copy and render mascot files
mascot_files = [
    ("spooky-mascot-idle.svg", "spooky-idle"),
    ("spooky-mascot-excited.svg", "spooky-excited"),
    ("spooky-mascot-listening.svg", "spooky-listening"),
    ("spooky-mascot-mono-dark.svg", "spooky-mono-dark"),
    ("spooky-mascot-mono-light.svg", "spooky-mono-light"),
]

for src_name, dst_base in mascot_files:
    src_svg = BRANDING_DIR / src_name
    dst_svg = MASCOT_DIR / f"{dst_base}.svg"
    dst_png = MASCOT_DIR / f"{dst_base}.png"
    
    # Copy SVG
    dst_svg.write_text(src_svg.read_text())
    
    # Render PNG 512x512
    cmd = ["rsvg-convert", "-w", "512", "-h", "512", str(src_svg), "-o", str(dst_png)]
    subprocess.run(cmd, check=True)
    print(f"Rendered {dst_png}")

# 2. Main App Icon 1024x1024
icon_src = BRANDING_DIR / "spooky-duo-style.svg"
icon_png = MOBILE_ASSETS / "icon.png"
subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", str(icon_src), "-o", str(icon_png)], check=True)
print(f"Rendered {icon_png}")

# 3. Splash Icon (Full body idle mascot) 512x512
splash_src = BRANDING_DIR / "spooky-mascot-idle.svg"
splash_png = MOBILE_ASSETS / "splash-icon.png"
subprocess.run(["rsvg-convert", "-w", "512", "-h", "512", str(splash_src), "-o", str(splash_png)], check=True)
print(f"Rendered {splash_png}")

# 4. Favicon 64x64
favicon_png = MOBILE_ASSETS / "favicon.png"
subprocess.run(["rsvg-convert", "-w", "64", "-h", "64", str(icon_src), "-o", str(favicon_png)], check=True)
print(f"Rendered {favicon_png}")

# 5. Android Adaptive Icon Foreground & Background
# Adaptive icon needs content centered within 66% (diameter ~675px out of 1024px)
adaptive_fg_svg = BRANDING_DIR / "android-adaptive-foreground.svg"
adaptive_fg_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Scaled and centered to fit within safe zone of Android adaptive icon -->
  <g transform="translate(172, 172) scale(1.328)">
    <image href="{BRANDING_DIR / 'spooky-duo-style.svg'}" x="0" y="0" width="512" height="512" />
  </g>
</svg>"""
adaptive_fg_svg.write_text(adaptive_fg_content)
adaptive_fg_png = MOBILE_ASSETS / "android-icon-foreground.png"
subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", str(adaptive_fg_svg), "-o", str(adaptive_fg_png)], check=True)
print(f"Rendered {adaptive_fg_png}")

adaptive_bg_svg = BRANDING_DIR / "android-adaptive-background.svg"
adaptive_bg_content = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="85%" stop-color="#F0F9FF" />
      <stop offset="100%" stop-color="#E0F2FE" />
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bgGlow)" />
</svg>"""
adaptive_bg_svg.write_text(adaptive_bg_content)
adaptive_bg_png = MOBILE_ASSETS / "android-icon-background.png"
subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", str(adaptive_bg_svg), "-o", str(adaptive_bg_png)], check=True)
print(f"Rendered {adaptive_bg_png}")

# Android monochrome adaptive icon
adaptive_mono_svg = BRANDING_DIR / "android-adaptive-monochrome.svg"
adaptive_mono_content = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <g transform="translate(172, 172) scale(1.328)">
    <image href="{BRANDING_DIR / 'spooky-duo-mono-light.svg'}" x="0" y="0" width="512" height="512" />
  </g>
</svg>"""
adaptive_mono_svg.write_text(adaptive_mono_content)
adaptive_mono_png = MOBILE_ASSETS / "android-icon-monochrome.png"
subprocess.run(["rsvg-convert", "-w", "1024", "-h", "1024", str(adaptive_mono_svg), "-o", str(adaptive_mono_png)], check=True)
print(f"Rendered {adaptive_mono_png}")

print("All assets successfully created!")
