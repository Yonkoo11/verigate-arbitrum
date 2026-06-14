#!/usr/bin/env zsh
# Generate per-clip voiceover via ElevenLabs (Brian). Idempotent.
VOICE=nPczCjzI2devNBz1zQrb
DIR=~/Projects/verigate-arbitrum/video/audio
mkdir -p $DIR

typeset -A CLIPS
CLIPS[01-hook]="A tokenized Tesla share that can't reach the wrong hands."
CLIPS[02-problem]="Tokenized stocks are securities. By law, they can't move to an unverified wallet. Not to a sanctioned country. Not to a non-accredited investor. Robinhood Chain ships the assets. The compliance layer was missing."
CLIPS[03-solution]="Covenant is that layer. It enforces the rules at the token. Every transfer checks an on-chain KYC attestation before it can settle."
CLIPS[04-blocked]="Here's an investor's wallet on Robinhood Chain. It carries a live KYC credential. Jurisdiction, accreditation, the issuer. All on-chain, all verifiable."
CLIPS[05-verify]="The issuer onboards investors right here. One attestation, linked to a wallet. Now that wallet can hold the security."
CLIPS[06-hardpart]="Send a tokenized share to an unverified wallet, and it reverts. Verify the investor, and the exact same transfer settles. Even valid KYC in a sanctioned country stays blocked."
CLIPS[07-close]="It's live and source-verified on Robinhood Chain and Arbitrum. Ninety-seven tests. Security-audited. Covenant. Compliance, enforced at the token."

for name in ${(k)CLIPS}; do
  out=$DIR/$name.mp3
  if [ -f "$out" ] && [ -s "$out" ]; then echo "skip $name"; continue; fi
  payload=$(python3 -c "import json,sys; print(json.dumps({'text':sys.argv[1],'model_id':'eleven_multilingual_v2','voice_settings':{'stability':0.82,'similarity_boost':0.65,'style':0.03}}))" "$CLIPS[$name]")
  curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE" \
    -H "xi-api-key: $ELEVENLABS_API_KEY" -H "content-type: application/json" \
    -d "$payload" -o "$out"
  if file "$out" | grep -qiE "audio|mpeg|MPEG"; then
    echo "ok $name ($(du -h "$out" | cut -f1))"
  else
    echo "FAIL $name:"; head -c 200 "$out"; echo
  fi
done
