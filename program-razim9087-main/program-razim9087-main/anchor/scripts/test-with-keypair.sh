#!/bin/bash
# Run this script to setup Solana keypair and then run Anchor tests
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Setup Solana keypair if needed
"$SCRIPT_DIR/solana-keypair-setup.sh"

# Run Anchor tests
anchor test
