'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'

import { redirect } from 'next/navigation'

export default function AccountListFeature() {
  const { publicKey } = useWallet()

  if (publicKey) {
    return redirect(`/account/${publicKey.toString()}`)
  }

  return (
    <div className="hero py-[64px] bg-black text-white">
      <div className="hero-content text-center">
        <WalletButton />
        <h1 className="text-5xl font-bold solana-gradient-text mt-6">Connect your Solana Wallet</h1>
      </div>
    </div>
  )
}
