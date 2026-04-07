#!/bin/zsh
setopt +o nomatch

SCRIPT_DIR="${0:a:h}"
COMPOSITES_DIR="$SCRIPT_DIR/composites"
AUDIO_DIR="$SCRIPT_DIR/audio"
SEGMENTS_DIR="$SCRIPT_DIR/segments"
mkdir -p "$SEGMENTS_DIR"

CLIPS=(01-hook 02-problem 03-solution 04-blocked 05-approved 06-issuer 07-close)

# Timing constants
VFADE_IN=0.2
AUDIO_DELAY=0.5
BREATH=0.3
VFADE_OUT=0.2
GAP=0.3

echo "=== Assembling Verigate demo video ==="

# Build each segment
for clip in $CLIPS; do
  COMP="$COMPOSITES_DIR/$clip.png"
  AUD="$AUDIO_DIR/$clip.mp3"
  SEG="$SEGMENTS_DIR/$clip.mp4"

  if [[ ! -f "$COMP" ]]; then echo "MISSING composite: $clip"; exit 1; fi
  if [[ ! -f "$AUD" ]]; then echo "MISSING audio: $clip"; exit 1; fi

  # Get audio duration
  ADUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$AUD")
  echo "  $clip: audio=${ADUR}s"

  # Total segment duration
  TOTAL=$(echo "$AUDIO_DELAY + $ADUR + $BREATH + $VFADE_OUT" | bc)
  FO_START=$(echo "$TOTAL - $VFADE_OUT" | bc)
  AFO_START=$(echo "$AUDIO_DELAY + $ADUR - 0.25" | bc)

  ffmpeg -y \
    -loop 1 -i "$COMP" \
    -i "$AUD" \
    -filter_complex "
      anullsrc=r=44100:cl=stereo,atrim=0:${AUDIO_DELAY}[silence];
      [silence][1:a]concat=n=2:v=0:a=1[joined];
      [joined]afade=t=in:st=${AUDIO_DELAY}:d=0.15,afade=t=out:st=${AFO_START}:d=0.25,apad=whole_dur=${TOTAL}[a];
      [0:v]scale=1920:1080,fade=t=in:st=0:d=${VFADE_IN},fade=t=out:st=${FO_START}:d=${VFADE_OUT}[v]
    " \
    -map "[v]" -map "[a]" \
    -t "$TOTAL" \
    -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
    -c:a aac -b:a 128k \
    -r 30 "$SEG" 2>/dev/null

  if [[ $? -ne 0 ]]; then echo "FAILED: $clip"; exit 1; fi
  echo "  -> $clip.mp4"
done

# Create black gap segment
echo "Creating gap..."
ffmpeg -y \
  -f lavfi -i "color=c=black:s=1920x1080:d=${GAP}:r=30" \
  -f lavfi -i "anullsrc=r=44100:cl=stereo" \
  -t "$GAP" \
  -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  "$SEGMENTS_DIR/gap.mp4" 2>/dev/null

# Build concat list
CONCAT_FILE="$SEGMENTS_DIR/concat.txt"
rm -f "$CONCAT_FILE"

for i in {1..${#CLIPS}}; do
  clip="${CLIPS[$i]}"
  echo "file '$clip.mp4'" >> "$CONCAT_FILE"
  if [[ $i -lt ${#CLIPS} ]]; then
    echo "file 'gap.mp4'" >> "$CONCAT_FILE"
  fi
done

# Final concat (re-encode to avoid drift)
OUTPUT="$SCRIPT_DIR/verigate-demo.mp4"
echo "Concatenating..."
ffmpeg -y \
  -f concat -safe 0 -i "$CONCAT_FILE" \
  -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  "$OUTPUT" 2>/dev/null

if [[ $? -ne 0 ]]; then echo "CONCAT FAILED"; exit 1; fi

DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUTPUT")
SIZE=$(du -h "$OUTPUT" | cut -f1)
echo ""
echo "=== DONE ==="
echo "Output: $OUTPUT"
echo "Duration: ${DURATION}s"
echo "Size: $SIZE"
