#!/usr/bin/env zsh
VOICE=nPczCjzI2devNBz1zQrb
DIR=~/Projects/verigate-arbitrum/video/audio
mkdir -p $DIR

typeset -A CLIPS
CLIPS[01-hook]="This is a tokenized Tesla share. It can't move to a wallet that isn't allowed to hold it."
CLIPS[02-problem]="Tokenized stocks are securities. By law, they can't reach an unverified wallet, a sanctioned country, or a non-accredited investor."
CLIPS[03-overview]="An issuer runs the whole thing from one console. Supply, holders against the regulatory cap, every compliance rule."
CLIPS[04-registry]="Investors are verified on-chain. Each wallet earns a KYC credential. Jurisdiction, accreditation, decoded straight from the chain."
CLIPS[05-activity]="And every compliance decision is a public record. Each settled transfer, each block, with its reason. Nothing off-chain."
CLIPS[06-gate]="Send to an unverified wallet, and it reverts. Verify the investor, and the same transfer settles."
CLIPS[07-close]="Live and source-verified on Robinhood Chain and Arbitrum. Covenant. Compliance, enforced at the token."

for name in ${(k)CLIPS}; do
  out=$DIR/$name.mp3
  payload=$(python3 -c "import json,sys; print(json.dumps({'text':sys.argv[1],'model_id':'eleven_multilingual_v2','voice_settings':{'stability':0.82,'similarity_boost':0.65,'style':0.03}}))" "$CLIPS[$name]")
  curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" -H "content-type: application/json" -d "$payload" -o "$out"
  file "$out" | grep -qiE "audio|mpeg" && echo "ok $name ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out" 2>/dev/null | cut -d. -f1)s)" || { echo "FAIL $name"; head -c 160 "$out"; }
done
