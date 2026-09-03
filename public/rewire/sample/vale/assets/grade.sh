#!/bin/bash
# Vale & Vine — one house look, four seasonal shifts.
# Every image gets the same contrast/sharpen base so the sets read as one shoot;
# only hue, saturation and the red/blue curve move per season.
# usage: grade.sh <season> <src.jpg> <out.jpg> [W] [H]
set -e
season=$1; src=$2; out=$3; W=${4:-1800}; H=${5:-1200}

case "$season" in
  bud)  hue=-6;  sat=0.72; gam=1.02; rc='0/0 0.5/0.48 1/1';    bc='0/0.02 0.5/0.52 1/1' ;;
  rip)  hue=4;   sat=0.66; gam=1.05; rc='0/0.02 0.5/0.55 1/1'; bc='0/0 0.5/0.46 1/0.97' ;;
  vin)  hue=6;   sat=0.70; gam=1.00; rc='0/0.03 0.5/0.56 1/1'; bc='0/0 0.5/0.45 1/0.96' ;;
  pru)  hue=-10; sat=0.42; gam=1.04; rc='0/0 0.5/0.47 1/0.99'; bc='0/0.04 0.5/0.55 1/1' ;;
  *) echo "season must be one of: bud rip vin pru" >&2; exit 1 ;;
esac

ffmpeg -y -loglevel error -i "$src" -vf \
"scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},\
hue=h=${hue}:s=${sat},curves=r='${rc}':b='${bc}',\
eq=gamma=${gam}:contrast=1.06,unsharp=5:5:0.5" -q:v 3 "$out"
