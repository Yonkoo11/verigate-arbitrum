#!/usr/bin/env zsh
VOICE=nPczCjzI2devNBz1zQrb
DIR=~/Projects/verigate-arbitrum/video/audio
mkdir -p $DIR

typeset -A CLIPS
CLIPS[01-hook]="A tokenized Tesla share. It only moves to a wallet that's allowed to hold it."
CLIPS[02-problem]="Tokenized stocks are securities. They can't legally reach a wallet that isn't verified, or one in a sanctioned country."
CLIPS[03-engine]="Behind it sits a compliance engine. Country rules, accreditation, a holder cap, all enforced on every transfer."
CLIPS[04-registry]="Investors get verified on-chain. Each wallet earns a KYC credential, its jurisdiction and accreditation read straight from the chain."
CLIPS[05-activity]="Every compliance decision is a public record. Each settled transfer, each block, each reason. None of it off-chain."
CLIPS[06-gate]="Send to an unverified wallet and it reverts, with the reason on-chain. Verify that investor, and the same transfer settles."
CLIPS[07-close]="Live and source-verified on Robinhood Chain and Arbitrum. Covenant. Compliance, enforced at the token."

for name in ${(k)CLIPS}; do
  out=$DIR/$name.mp3
  payload=$(python3 -c "import json,sys; print(json.dumps({'text':sys.argv[1],'model_id':'eleven_multilingual_v2','voice_settings':{'stability':0.82,'similarity_boost':0.65,'style':0.03}}))" "$CLIPS[$name]")
  curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" -H "content-type: application/json" -d "$payload" -o "$out"
  file "$out" | grep -qiE "audio|mpeg" && echo "ok $name ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$out" 2>/dev/null | cut -d. -f1)s)" || { echo "FAIL $name"; head -c 160 "$out"; }
done
