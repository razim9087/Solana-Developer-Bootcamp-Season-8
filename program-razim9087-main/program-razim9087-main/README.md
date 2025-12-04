# OTC_Options_v1

## Overview

OTC_Options_v1 is a decentralized application (dApp) built on Solana using the Anchor framework for the on-chain program and Next.js/React for the frontend. The project demonstrates a full-stack workflow for building, testing, and deploying a Solana program with a modern web interface.

### Features
- **Anchor Solana Program**: Written in Rust, using PDAs and Anchor macros for security and composability.
- **Comprehensive TypeScript Tests**: Each instruction is tested for both success and failure scenarios.
- **Next.js Frontend**: Modern React-based UI for interacting with the Solana program.
- **Wallet Integration**: Supports Solana wallet adapters for seamless user experience.
- **Automated Scripts**: For keypair setup, airdrop, deployment, and testing.
- **Vercel Deployment Ready**: Easily deploy the frontend to Vercel or any static hosting provider.

---

## Project Structure

```
OTC_Options_v1/
├── anchor/                # Anchor program (Rust)
│   ├── programs/
│   ├── src/
│   ├── tests/
│   ├── target/
│   ├── Anchor.toml
│   └── Cargo.toml
├── public/                # Static assets for frontend
├── src/                   # Next.js frontend source
│   ├── app/               # App directory (Next.js 13+)
│   ├── components/        # Reusable React components
│   ├── lib/               # Utility functions
│   └── ...
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── README.md              # Project documentation
└── ...
```

---

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- pnpm (or npm/yarn)
- Rust & Anchor CLI
- Solana CLI

### Installation

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd OTC_Options_v1
pnpm install
```

### Anchor Program

Build and test the Anchor program:

```bash
cd anchor
anchor build
anchor test
```

Deploy to Devnet:

```bash
anchor deploy --provider.cluster devnet
```

### Frontend

Start the development server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

---

## Scripts

- `solana-keypair-setup.sh`: Automates keypair creation and configuration.
- `airdrop-and-deploy.sh`: Requests airdrop and deploys the program to Devnet.
- `test-with-keypair.sh`: Runs tests with a specific keypair.

---

## Testing

TypeScript tests are located in `anchor/tests/`. Each instruction is covered with both happy and unhappy path scenarios.

Run all tests:

```bash
cd anchor
anchor test
```

---

## Deployment

Frontend can be deployed to Vercel or any static hosting provider. For Vercel:

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root and follow the prompts.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

---

## License

MIT
