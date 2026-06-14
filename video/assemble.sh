#!/usr/bin/env zsh
setopt +o nomatch
D=~/Projects/verigate-arbitrum/video
COMP=$D/composites; AUD=$D/audio; SEG=$D/segments
mkdir -p $SEG; rm -f $SEG/*.mp4
VFADE_IN=0.2; AUDIO_DELAY=0.5; BREATH=0.3; VFADE_OUT=0.2; GAP=0.3
clips=(01-hook 02-problem 03-solution 04-blocked 05-verify 06-hardpart 07-close)

# black gap segment
ffmpeg -y -f lavfi -i color=c=0x0a0a0a:s=1920x1080:d=$GAP -f lavfi -i anullsrc=r=44100:cl=stereo \
  -t $GAP -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 128k -r 30 $SEG/gap.mp4 2>/dev/null

for c in $clips; do
  adur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $AUD/$c.mp3)
  TOTAL=$(python3 -c "print(round($AUDIO_DELAY+$adur+$BREATH,3))")
  FO_START=$(python3 -c "print(round($TOTAL-$VFADE_OUT,3))")
  AFO_START=$(python3 -c "print(round($AUDIO_DELAY+$adur-0.25,3))")
  ffmpeg -y -loop 1 -i $COMP/$c.png -i $AUD/$c.mp3 -filter_complex "
    anullsrc=r=44100:cl=stereo,atrim=0:${AUDIO_DELAY}[s];
    [s][1:a]concat=n=2:v=0:a=1[j];
    [j]afade=t=in:st=${AUDIO_DELAY}:d=0.15,afade=t=out:st=${AFO_START}:d=0.25,apad=whole_dur=${TOTAL}[a];
    [0:v]scale=1920:1080,fade=t=in:st=0:d=${VFADE_IN},fade=t=out:st=${FO_START}:d=${VFADE_OUT}[v]
  " -map "[v]" -map "[a]" -t $TOTAL -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 128k -r 30 $SEG/$c.mp4 2>/dev/null
  echo "seg $c (${TOTAL}s)"
done

# concat with gaps between
list=$D/concat.txt; : > $list
first=1
for c in $clips; do
  [ $first -eq 0 ] && echo "file '$SEG/gap.mp4'" >> $list
  echo "file '$SEG/$c.mp4'" >> $list
  first=0
done
ffmpeg -y -f concat -safe 0 -i $list -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p -c:a aac -b:a 128k $D/_novo.mp4 2>/dev/null
echo "concatenated"

# mix background music (low) + color grade -> final
vdur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $D/_novo.mp4)
mfo=$(python3 -c "print(round($vdur-3,3))")
ffmpeg -y -i $D/_novo.mp4 -i $D/music/bg.mp3 -filter_complex "
  [0:v]eq=contrast=1.05:saturation=1.06:brightness=0.01[v];
  [1:a]volume=0.11,afade=t=out:st=${mfo}:d=3[bg];
  [0:a][bg]amix=inputs=2:duration=first:dropout_transition=0[a]
" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 21 -pix_fmt yuv420p -c:a aac -b:a 160k $D/covenant-demo.mp4 2>/dev/null
rm -f $D/_novo.mp4
echo "FINAL: $D/covenant-demo.mp4 (${vdur}s)"
