import React from 'react';

export default function DocumentationPage() {
  return (
    <main className="max-w-3xl mx-auto py-10 px-4 text-white">
      <h1 className="text-4xl font-bold mb-6">OTC Options dApp Documentation</h1>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Overview</h2>
        <p>
          This decentralized application (dApp) provides a user interface for interacting with Solana-based OTC options contracts and account management. It includes wallet integration, token and SOL management, and a transaction explorer.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">Main Features</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li><b>Wallet Connection:</b> Connect your Solana wallet to access account features.</li>
          <li><b>Account Overview:</b> View your SOL balance, token accounts, and account status.</li>
          <li><b>Token Accounts:</b> List all SPL token accounts, including mint and balance details.</li>
          <li><b>Transaction History:</b> See recent transactions with timestamp, fees, confirmation status, and transfer amount.</li>
          <li><b>Airdrop:</b> Request SOL airdrops on devnet/testnet for testing.</li>
          <li><b>Send/Receive:</b> Send SOL to other addresses or display your address for receiving funds.</li>
          <li><b>Contract Management:</b> (If enabled) View and interact with OTC options contracts.</li>
          <li><b>Network Cluster:</b> Switch between Solana clusters (mainnet, devnet, testnet).</li>
          <li><b>Explorer Links:</b> Quick access to Solana explorer for accounts and transactions.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-2">How to Use</h2>
        <ol className="list-decimal pl-6 space-y-2">
          <li>Connect your wallet using the wallet adapter.</li>
          <li>Navigate to the Account page to view balances and transaction history.</li>
          <li>Use the Token Accounts section to view and manage SPL tokens.</li>
          <li>Request airdrops or send/receive SOL as needed.</li>
          <li>Review your transaction history for details on recent activity.</li>
        </ol>
      </section>
      <section>
        <h2 className="text-2xl font-semibold mb-2">Support</h2>
        <p>
          For more information, visit the project repository or contact the maintainers.
        </p>
      </section>
    </main>
  );
}
