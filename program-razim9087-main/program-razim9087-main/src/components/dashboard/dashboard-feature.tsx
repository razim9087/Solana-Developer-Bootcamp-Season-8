import { AppHero } from '@/components/app-hero'
import Link from 'next/link'

const features = [
  {
    title: '🎯 European-Style Options',
    description: 'Trade call and put options that can only be exercised at expiration',
  },
  {
    title: '🔐 Secure Escrow System',
    description: 'Program-controlled escrow accounts ensure safe custody of funds',
  },
  {
    title: '⚡ On-Chain Settlement',
    description: 'Fully decentralized contract creation, exercise, and settlement',
  },
  {
    title: '📊 Multi-Asset Support',
    description: 'Create options for NASDAQ equities and other supported assets',
  },
]

const links: { label: string; href: string }[] = [
  { label: 'Solana Docs', href: 'https://docs.solana.com/' },
  { label: 'Anchor Framework', href: 'https://www.anchor-lang.com/' },
  { label: 'Options Trading Guide', href: 'https://www.investopedia.com/options-basics-tutorial-4583012' },
]

export function DashboardFeature() {
  return (
    <div>
      <AppHero
        title="Introducing Over-the-Counter Options Trading on Solana"
        subtitle={<span className="solana-gradient-text pt-8 block">Decentralized options trading platform built with Anchor</span>}
      />
      <div className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8 bg-black text-white">
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <p className="text-lg solana-gradient-text">
              A fully on-chain options trading platform enabling European-style call and put options
              with secure escrow management and automated settlement.
            </p>
            <Link
              href="/basic"
              className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Launch App
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mt-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm"
              >
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 space-y-4">
            <h3 className="text-xl font-semibold text-center">Learn More</h3>
            <div className="flex flex-wrap justify-center gap-4">
              {links.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="text-primary hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
