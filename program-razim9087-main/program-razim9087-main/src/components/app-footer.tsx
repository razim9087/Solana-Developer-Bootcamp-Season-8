
import React from 'react'
import SolanaIcon from './solana/SolanaIcon'

export function AppFooter() {
  return (
    <footer className="text-center p-2 bg-black text-white text-xs flex items-center justify-center gap-2">
      Powered by
      <span className="inline-flex align-middle"><SolanaIcon size={20} /></span>
    </footer>
  )
}
