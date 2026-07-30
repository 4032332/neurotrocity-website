#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# VALE & VINE — reproducible image pipeline
#
# Two sources, one look:
#   src/*.jpeg   the pavilion, generated. The seasons are already in these
#                frames, so they only get the shared house pass.
#   raw/*.jpg    stock (vines, tables, detail). Region-neutral on purpose —
#                the building is the only thing that has to be Australian,
#                and that is the set we generated. These get the house pass
#                plus a seasonal shift so they sit with the venue shots.
#
# The house pass is what makes a generated pavilion and a stock vine row
# look like one photographer's day: same contrast curve, same slight
# desaturation, same sharpening.
# ═══════════════════════════════════════════════════════════════
set -e
cd "$(dirname "$0")"
mkdir -p img

HOUSE="eq=contrast=1.05:gamma=1.0:saturation=0.94,unsharp=5:5:0.45"

# venue(src, out, width) — house pass only
venue () {
  ffmpeg -y -loglevel error -i "src/$1.jpeg" \
    -vf "scale=$3:-2,${HOUSE},curves=r='0/0.012 0.5/0.52 1/0.99':b='0/0.02 0.5/0.49 1/0.985'" \
    -q:v 3 "img/$2.jpg"
}

# season(profile, src, out, W, H) — house pass + seasonal shift
season () {
  case "$1" in
    bud) hue=-6;  sat=0.74; rc='0/0 0.5/0.48 1/1';    bc='0/0.02 0.5/0.52 1/1' ;;
    rip) hue=4;   sat=0.70; rc='0/0.02 0.5/0.55 1/1'; bc='0/0 0.5/0.46 1/0.97' ;;
    vin) hue=6;   sat=0.72; rc='0/0.03 0.5/0.55 1/1'; bc='0/0 0.5/0.46 1/0.97' ;;
    pru) hue=-10; sat=0.48; rc='0/0 0.5/0.47 1/0.99'; bc='0/0.04 0.5/0.54 1/1' ;;
  esac
  ffmpeg -y -loglevel error -i "raw/$2.jpg" \
    -vf "scale=$4:$5:force_original_aspect_ratio=increase,crop=$4:$5,\
hue=h=${hue}:s=${sat},curves=r='${rc}':b='${bc}',${HOUSE},eq=brightness=-0.055:contrast=1.04" -q:v 3 "img/$3.jpg"
}

# ── the pavilion, one per season, plus the two set pieces ──────
venue venue-bud  stage-bud  2000
venue ceremony   stage-rip  2000     # prompt 5 was summer light — doubles as Ripening
venue venue-vin  stage-vin  2000
venue venue-pru  stage-pru  2000
venue interior   stage-eve  2000
venue ceremony   ceremony   1600
venue interior   interior   1600

# ── supporting stock, graded into each season ─────────────────
season bud 31953696 sup-bud  1400 1000
season rip 19986468 sup-rip  1400 1000
season vin 34513554 sup-vin  1400 1000
season pru 30367678 sup-pru  1400 1000
season pru 30755942 sup-pru2 1400 1000
season vin 27559006 detail-table 1400 1000
season rip 4622288  detail-candles 1400 1000

echo "built:"; ls -la img | tail -n +4
