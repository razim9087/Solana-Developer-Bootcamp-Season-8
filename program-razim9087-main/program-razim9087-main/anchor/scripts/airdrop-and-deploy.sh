#!/bin/bash
# Request airdrop for the current Solana keypair before Anchor deploy
KEYPAIR_PATH="$HOME/.config/solana/id.json"
export SOLANA_KEYPAIR="$KEYPAIR_PATH"
AMOUNT=3

if [ ! -f "$KEYPAIR_PATH" ]; then
  echo "Keypair not found at $KEYPAIR_PATH. Exiting."
  exit 1
fi

PUBKEY=$(solana-keygen pubkey "$KEYPAIR_PATH")
BALANCE=$(solana balance "$PUBKEY" --url https://api.devnet.solana.com | awk '{print $1}')
echo "Checking balance for keypair: $KEYPAIR_PATH (pubkey: $PUBKEY)"



if (( $(echo "$BALANCE < $AMOUNT" | bc -l) )); then
  echo "Balance ($BALANCE SOL) is less than $AMOUNT SOL. Requesting airdrop..."
  solana airdrop $AMOUNT "$PUBKEY" --url https://api.devnet.solana.com
  echo "Waiting 10 seconds for airdrop to finalize..."
  sleep 10
else
  echo "Sufficient balance ($BALANCE SOL) for deployment. Skipping airdrop."
fi

# Proceed with Anchor deploy
anchor deploy --provider.cluster devnet --provider.wallet "$KEYPAIR_PATH"
