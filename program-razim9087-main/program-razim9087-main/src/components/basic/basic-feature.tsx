'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletButton } from '../solana/solana-provider'
import { UserAccountStatus, EscrowManagement, CreateContractForm, ContractsList } from './basic-ui'
import { AppHero } from '../app-hero'

function ContractsHeaderWithActiveCount() {
  const result = ContractsList()
  return (
    <>
      <h2 className="text-2xl font-bold mb-1">Your Contracts</h2>
      <p className="text-sm text-muted-foreground mb-4">Active: {result.activeCount}</p>
      {result.element}
    </>
  )
}

export default function BasicFeature() {
  const { publicKey } = useWallet()

  return publicKey ? (
    <div className="flex flex-col items-center justify-center min-h-[80vh] space-y-6 text-black">
      <div className="max-w-7xl w-full flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          <div className="lg:col-span-1 space-y-6 flex flex-col items-center w-full">
            <div className="w-full"><UserAccountStatus /></div>
            <div className="w-full"><EscrowManagement /></div>
          </div>
          <div className="lg:col-span-2 space-y-6 flex flex-col items-center">
            <CreateContractForm />
            <div className="w-full flex flex-col items-center">
              <ContractsHeaderWithActiveCount />
            </div>
          </div>
        </div>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center min-h-[80vh] max-w-4xl mx-auto">
      <div className="hero py-[64px] bg-black text-white w-full flex flex-col items-center">
        <div className="hero-content text-center w-full flex flex-col items-center">
          <div className="max-w-md space-y-8 w-full flex flex-col items-center">
            <h1 className="text-5xl font-bold solana-gradient-text leading-tight" style={{overflow: 'visible'}}>
              OTC Options Trading
            </h1>
            <p className="solana-gradient-text pt-4">Create, manage, and trade European-style call and put options on Solana</p>
            <WalletButton />
          </div>
        </div>
      </div>
    </div>
  )
}
