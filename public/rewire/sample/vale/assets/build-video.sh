#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# VALE & VINE — background loops
#
# Same house grade as the stills, so a moving plate and a still plate
# read as one shoot. Two things worth knowing:
#
#  · Boomerang. Both clips are slow one-direction camera moves, so the
#    last frame is nowhere near the first and a plain loop would jump.
#    Forward + reversed gives a genuinely seamless cycle at the cost of
#    doubling the duration, which is free — it is the same frames.
#
#  · faststart. The moov atom goes at the head so the browser can begin
#    playing before the whole file lands.
# ═══════════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")"
mkdir -p video

HOUSE="eq=contrast=1.05:gamma=1.0:saturation=0.94,unsharp=5:5:0.45"
GRADE="${HOUSE},curves=r='0/0.012 0.5/0.52 1/0.99':b='0/0.02 0.5/0.49 1/0.985'"

# loop(src, out)
loop () {
  ffmpeg -y -loglevel error -i "$1" \
    -filter_complex "[0:v]${GRADE},split[f][r];[r]reverse[rv];[f][rv]concat=n=2:v=1:a=0[v]" \
    -map "[v]" -an -c:v libx264 -profile:v high -pix_fmt yuv420p \
    -crf 30 -preset slow -movflags +faststart "video/$2.mp4"
  # a still from the graded loop, so the poster and the first frame match
  ffmpeg -y -loglevel error -i "video/$2.mp4" -frames:v 1 -q:v 4 "video/$2.jpg"
}

loop "img/Event_pavilion_in_vineyard_202607301031.mp4"       venue-pru
loop "img/Event_pavilion_in_vineyard_202607301031 (1).mp4"   interior

ls -la video
