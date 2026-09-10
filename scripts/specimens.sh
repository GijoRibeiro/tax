#!/usr/bin/env bash
# Renders every catalog component in the iOS simulator and crops it out of the screenshot.
# Output: public/specimens/<name>.png (3x). Needs the app built and installed on the booted
# simulator (see README). Usage: npm run specimens
set -euo pipefail
BUNDLE=co.cloover.TaxfixExpert
OUT="$(cd "$(dirname "$0")/.." && pwd)/public/specimens"
TMP="$(mktemp -d)"
NAMES=$(grep -A4 'static let names' ios/Sources/Views/ComponentGalleryView.swift | grep -o '"[a-z-]*"' | tr -d '"')
for n in $NAMES; do
  xcrun simctl terminate booted "$BUNDLE" >/dev/null 2>&1 || true
  env SIMCTL_CHILD_GALLERY="$n" SIMCTL_CHILD_OFFLINE=1 xcrun simctl launch booted "$BUNDLE" >/dev/null
  sleep 1.6
  xcrun simctl io booted screenshot "$TMP/$n.png" >/dev/null 2>&1
  python3 - "$TMP/$n.png" "$OUT/$n.png" <<'PY'
import sys
from PIL import Image, ImageChops
src, dst = sys.argv[1], sys.argv[2]
im = Image.open(src).convert('RGB')
bg = Image.new('RGB', im.size, im.getpixel((8, im.height // 2)))
mask = ImageChops.difference(im, bg).convert('L').point(lambda v: 255 if v > 8 else 0)
# The Dynamic Island and the home indicator are device chrome, not the component.
from PIL import ImageDraw
d = ImageDraw.Draw(mask)
d.rectangle((0, 0, im.width, 230), fill=0)
d.rectangle((0, im.height - 100, im.width, im.height), fill=0)
box = mask.getbbox() or (0, 0, im.width, im.height)
pad = 36
box = (max(0, box[0] - pad), max(0, box[1] - pad), min(im.width, box[2] + pad), min(im.height, box[3] + pad))
im.crop(box).save(dst, optimize=True)
PY
  echo "specimen $n"
done
xcrun simctl terminate booted "$BUNDLE" >/dev/null 2>&1 || true
rm -rf "$TMP"
