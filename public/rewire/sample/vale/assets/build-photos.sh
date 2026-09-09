#!/usr/bin/env bash
# Venue detail photography → AVIF + WebP at three widths.
#
# The season stage is computed now, so the only photographs left on the page
# are the ones that show something a render cannot: the actual room, the
# actual table, the actual rows. They sit below the fold, so they are lazy
# and they are never on the critical path — but they are still the largest
# files the page can ask for, and a 600 KB JPEG for a 640 px plate is how a
# venue site ends up at a 28 second LCP.
set -euo pipefail
cd "$(dirname "$0")/img"

SRC=(ceremony interior sup-pru2 detail-table)
WIDTHS=(640 1024 1600)

for name in "${SRC[@]}"; do
  src="$name.jpg"
  [ -f "$src" ] || { echo "missing $src"; exit 1; }
  for w in "${WIDTHS[@]}"; do
    ffmpeg -y -hide_banner -loglevel error -i "$src" \
      -vf "scale=$w:-2:flags=lanczos" -c:v libsvtav1 -crf 40 -f avif "$name-$w.avif"
    cwebp -quiet -q 72 -resize "$w" 0 "$src" -o "$name-$w.webp"
  done
done

echo
printf '%-28s %10s\n' file bytes
for name in "${SRC[@]}"; do
  printf '%-28s %10s\n' "$name.jpg (source)" "$(stat -f%z "$name.jpg")"
  for w in "${WIDTHS[@]}"; do
    printf '%-28s %10s\n' "$name-$w.avif" "$(stat -f%z "$name-$w.avif")"
    printf '%-28s %10s\n' "$name-$w.webp" "$(stat -f%z "$name-$w.webp")"
  done
done
