#!/usr/bin/env zsh
# Composite per-page motion clips + caption overlays + delayed voiceover, then
# concat, mix a music bed, and color-grade → covenant-demo.mp4
set -e
cd ~/Projects/verigate-arbitrum/video
WORK=.work; rm -rf $WORK; mkdir -p $WORK

ORDER=(01-hook 02-problem 03-overview 04-registry 05-activity 06-gate 07-close)
LEAD=0.5        # audio starts 0.5s into each segment
TAIL=0.5        # breath after audio before cut
FADE=0.2

for name in $ORDER; do
  adur=$(python3 -c "import json;print(json.load(open('durations.json'))['$name'])")
  seg=$(python3 -c "print(round($LEAD + $adur + $TAIL, 2))")
  fout=$(python3 -c "print(round($seg - $FADE, 2))")
  fg="[0:v]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,trim=0:$seg,setpts=PTS-STARTPTS,fps=30,fade=in:st=0:d=$FADE,fade=out:st=$fout:d=${FADE}[vb];[vb][1:v]overlay=0:0[v];anullsrc=r=44100:cl=stereo,atrim=0:${LEAD}[lead];[2:a]aresample=44100[av];[lead][av]concat=n=2:v=0:a=1,apad,atrim=0:${seg}[a]"
  ffmpeg -y -loglevel error -i clips/$name.webm -i captions/$name.png -i audio/$name.mp3 \
    -filter_complex "$fg" -map "[v]" -map "[a]" -t $seg -r 30 \
    -c:v libx264 -preset medium -pix_fmt yuv420p -c:a aac -ar 44100 $WORK/seg-$name.mp4
  echo "seg $name (${seg}s)"
done

: > $WORK/list.txt
for name in $ORDER; do echo "file 'seg-$name.mp4'" >> $WORK/list.txt; done
ffmpeg -y -loglevel error -f concat -safe 0 -i $WORK/list.txt \
  -c:v libx264 -preset medium -pix_fmt yuv420p -c:a aac -ar 44100 $WORK/joined.mp4

total=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $WORK/joined.mp4)
mout=$(python3 -c "print(round($total - 2, 2))")
mfg="[1:a]volume=0.10,afade=in:st=0:d=1.5,afade=out:st=$mout:d=2[m];[0:a][m]amix=inputs=2:duration=first:dropout_transition=3[mx];[mx]loudnorm=I=-16:TP=-1.5:LRA=11[a];[0:v]eq=contrast=1.05:saturation=1.06:brightness=0.01[v]"
# (the [m]/[a]/[v] labels follow literals here, not bare $vars, so no brace needed)
ffmpeg -y -loglevel error -i $WORK/joined.mp4 -i music/bg.mp3 \
  -filter_complex "$mfg" -map "[v]" -map "[a]" -shortest -movflags +faststart covenant-demo.mp4

rm -rf $WORK
echo "=== done: covenant-demo.mp4 ($(ffprobe -v error -show_entries format=duration -of csv=p=0 covenant-demo.mp4)s) ==="
