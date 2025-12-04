#!/bin/bash
# Anchor test setup: generate Solana keypair only if missing
KEYPAIR_PATH="$HOME/.config/solana/id.json"

if [ ! -f "$KEYPAIR_PATH" ]; then
  echo "Solana keypair not found. Generating a new one..."
  mkdir -p "$(dirname "$KEYPAIR_PATH")"
  solana-keygen new --no-bip39-passphrase -o "$KEYPAIR_PATH"
else
  echo "Solana keypair already exists. Skipping generation."
fi
