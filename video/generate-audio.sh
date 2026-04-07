#!/bin/zsh
setopt +o nomatch

SCRIPT_DIR="${0:a:h}"
AUDIO_DIR="$SCRIPT_DIR/audio"
mkdir -p "$AUDIO_DIR"

VOICE_ID="nPczCjzI2devNBz1zQrb"
MODEL="eleven_multilingual_v2"
API_KEY="$ELEVENLABS_API_KEY"

if [[ -z "$API_KEY" ]]; then
  echo "ERROR: ELEVENLABS_API_KEY not set"
  exit 1
fi

typeset -A clips
clips=(
  "01-hook"    "Three billion dollars in tokenized real-world assets on BNB Chain. And right now, there's no native way to enforce who can hold them."
  "02-problem" "Existing projects use simple address whitelisting. That works for minting. But the moment those tokens hit a DEX or a lending protocol. The whitelist can't follow."
  "03-solution" "Verigate checks every transfer against on-chain attestations from BAS. The BNB Attestation Service. Three compliance modules run on every transfer. Country restrictions. Accredited investor verification. Holder cap enforcement."
  "04-blocked" "Try to transfer without a valid attestation. And the transaction reverts. The compliance engine tells you exactly why. Which module blocked it. What's missing."
  "05-approved" "Add the attestation. Try again. And the transfer goes through. That's the core loop. Verify. Then transfer."
  "06-issuer"  "Token issuers get a full admin panel. Mint tokens. Map attestations to wallets. Freeze addresses. Configure country restrictions. All on-chain. All modular."
  "07-close"   "Verigate. Built on BAS. Native to BNB Chain. Open source. Compliance infrastructure for the next wave of tokenized assets."
)

for clip in 01-hook 02-problem 03-solution 04-blocked 05-approved 06-issuer 07-close; do
  OUT="$AUDIO_DIR/$clip.mp3"
  if [[ -f "$OUT" ]]; then
    echo "SKIP $clip (exists)"
    continue
  fi

  TEXT="${clips[$clip]}"
  echo "Generating $clip..."

  curl -s -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
    -H "xi-api-key: $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"text\": \"$TEXT\",
      \"model_id\": \"$MODEL\",
      \"voice_settings\": {
        \"stability\": 0.75,
        \"similarity_boost\": 0.65,
        \"style\": 0.05
      }
    }" \
    -o "$OUT"

  # Verify it's audio, not error JSON
  if file "$OUT" | grep -q "JSON\|text\|ASCII"; then
    echo "ERROR: $clip returned JSON instead of audio:"
    cat "$OUT"
    rm -f "$OUT"
    exit 1
  fi

  SIZE=$(stat -f%z "$OUT" 2>/dev/null || stat -c%s "$OUT" 2>/dev/null)
  echo "  -> $clip.mp3 (${SIZE} bytes)"
done

echo "Audio generation complete."
