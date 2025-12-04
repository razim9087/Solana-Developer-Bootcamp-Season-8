'use client'

import { useBasicProgram } from './basic-data-access'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { NASDAQ100 } from './nasdaq100'
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useWallet } from '@solana/wallet-adapter-react'
import { ExplorerLink } from '../cluster/cluster-ui'
import { ellipsify } from '@/lib/utils'

export function UserAccountStatus() {
  const { getUserAccount, getEscrowBalance, initializeUser, initializeEscrow } = useBasicProgram()
  const { publicKey } = useWallet()

  if (!publicKey) return null

  const isInitialized = !!getUserAccount.data
  const escrowBalance = (getEscrowBalance.data || 0) / LAMPORTS_PER_SOL

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Status</CardTitle>
        <CardDescription>Your OTC Options Trading account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">User Account</p>
            <p className="text-xs text-muted-foreground">
              {isInitialized ? '✓ Initialized' : '✗ Not initialized'}
            </p>
          </div>
          {!isInitialized && (
            <Button
              onClick={() => initializeUser.mutateAsync()}
              disabled={initializeUser.isPending}
              size="sm"
            >
              {initializeUser.isPending ? 'Initializing...' : 'Initialize'}
            </Button>
          )}
        </div>

        {isInitialized && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Escrow Balance</p>
                <p className="text-xs text-muted-foreground">
                  {escrowBalance.toFixed(4)} SOL
                </p>
              </div>
              {escrowBalance === 0 && (
                <Button
                  onClick={() => initializeEscrow.mutateAsync()}
                  disabled={initializeEscrow.isPending}
                  size="sm"
                  variant="outline"
                >
                  {initializeEscrow.isPending ? 'Initializing...' : 'Init Escrow'}
                </Button>
              )}
            </div>

            <div>
              <p className="text-sm font-medium">Contracts</p>
              <p className="text-xs text-muted-foreground">
                Total: {getUserAccount.data?.contractCount.toString() || '0'}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function EscrowManagement() {
  const { deposit, withdraw, getEscrowBalance } = useBasicProgram()
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const escrowBalance = (getEscrowBalance.data || 0) / LAMPORTS_PER_SOL

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount <= 0) return
    await deposit.mutateAsync(amount)
    setDepositAmount('')
  }

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount)
    if (isNaN(amount) || amount <= 0) return
    await withdraw.mutateAsync(amount)
    setWithdrawAmount('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Escrow Management</CardTitle>
        <CardDescription>Deposit or withdraw SOL from your escrow</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="deposit">Deposit SOL</Label>
          <div className="flex gap-2">
            <Input
              id="deposit"
              type="number"
              step="0.1"
              placeholder="Amount in SOL"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <Button onClick={handleDeposit} disabled={deposit.isPending}>
              {deposit.isPending ? 'Depositing...' : 'Deposit'}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="withdraw">Withdraw SOL</Label>
          <div className="flex gap-2">
            <Input
              id="withdraw"
              type="number"
              step="0.1"
              placeholder="Amount in SOL"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              max={escrowBalance}
            />
            <Button
              onClick={handleWithdraw}
              disabled={withdraw.isPending || escrowBalance === 0}
              variant="outline"
            >
              {withdraw.isPending ? 'Withdrawing...' : 'Withdraw'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Available: {escrowBalance.toFixed(4)} SOL
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function CreateContractForm() {
  const { createContract } = useBasicProgram()
  const [formData, setFormData] = useState({
    seller: '',
    underlyingAsset: 'AAPL',
    numUnits: '100',
    strikePrice: '15000',
    expirationDays: '30',
    optionType: 'call' as 'call' | 'put',
    premium: '0.5',
    marginRequirementBps: '2000',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const sellerPubkey = new PublicKey(formData.seller)
      // Use client time only on client
      let expirationDate = 0
      if (typeof window !== 'undefined') {
        expirationDate = Math.floor(Date.now() / 1000) + parseInt(formData.expirationDays) * 86400
      }
      await createContract.mutateAsync({
        seller: sellerPubkey,
        underlyingAsset: formData.underlyingAsset,
        numUnits: parseInt(formData.numUnits),
        strikePrice: parseInt(formData.strikePrice),
        expirationDate,
        optionType: formData.optionType,
        premium: parseFloat(formData.premium),
        marginRequirementBps: parseInt(formData.marginRequirementBps),
      })

      // Reset form
      setFormData({
        ...formData,
        seller: '',
      })
    } catch (error) {
      console.error('Invalid form data:', error)
    }
  }

  const updateField = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Option Contract</CardTitle>
        <CardDescription>Create a new call or put option contract</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="seller">Seller Address</Label>
              <Input
                id="seller"
                placeholder="Seller's public key"
                value={formData.seller}
                onChange={(e) => updateField('seller', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset">Underlying Asset</Label>
              <select
                id="asset"
                className="w-full rounded border px-3 py-2 bg-black text-white"
                value={formData.underlyingAsset}
                onChange={(e) => updateField('underlyingAsset', e.target.value)}
                required
              >
                {NASDAQ100.map((eq) => (
                  <option key={eq.symbol} value={eq.symbol}>
                    {eq.symbol} - {eq.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="units">Number of Units</Label>
              <Input
                id="units"
                type="number"
                value={formData.numUnits}
                onChange={(e) => updateField('numUnits', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="strike">Strike Price (cents)</Label>
              <Input
                id="strike"
                type="number"
                placeholder="15000 = $150.00"
                value={formData.strikePrice}
                onChange={(e) => updateField('strikePrice', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiration">Expiration (days)</Label>
              <Input
                id="expiration"
                type="number"
                value={formData.expirationDays}
                onChange={(e) => updateField('expirationDays', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="optionType">Option Type</Label>
              <select
                id="optionType"
                value={formData.optionType}
                onChange={(e) => updateField('optionType', e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
              >
                <option value="call">Call</option>
                <option value="put">Put</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="premium">Premium (SOL)</Label>
              <Input
                id="premium"
                type="number"
                step="0.01"
                value={formData.premium}
                onChange={(e) => updateField('premium', e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="margin">Margin Requirement (bps)</Label>
              <Input
                id="margin"
                type="number"
                placeholder="2000 = 20%"
                value={formData.marginRequirementBps}
                onChange={(e) => updateField('marginRequirementBps', e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" disabled={createContract.isPending} className="w-full">
            {createContract.isPending ? 'Creating Contract...' : 'Create Contract'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function ContractsList() {
  const { getAllContracts, exercise, settle } = useBasicProgram()
  const [selectedContract, setSelectedContract] = useState<string | null>(null)
  const [exerciseData, setExerciseData] = useState({ underlyingPrice: '', solPrice: '10000' })

  if (getAllContracts.isLoading) {
    return {
      activeCount: 0,
      element: (
        <Card>
          <CardContent className="py-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          </CardContent>
        </Card>
      )
    }
  }

  const contracts = getAllContracts.data || []
  // Count active contracts
  const activeCount = contracts.filter(
    (c) => c && c.data && c.data.status && c.data.status.active
  ).length

  if (contracts.length === 0) {
    return {
      activeCount,
      element: (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No contracts found. Create your first contract above!
          </CardContent>
        </Card>
      )
    }
  }

  // Helper to check if a contract is expired
  const isContractExpired = (contract: { data: { expirationDate: { toNumber: () => number } } }) => {
    if (!contract) return false
    const expirationDateObj = new Date(contract.data.expirationDate.toNumber() * 1000)
    return typeof window !== 'undefined' && Date.now() >= expirationDateObj.getTime()
  }

  const handleExercise = async (contractAddress: PublicKey) => {
    const underlying = parseFloat(exerciseData.underlyingPrice)
    const sol = parseFloat(exerciseData.solPrice)
    if (isNaN(underlying) || isNaN(sol)) return

    await exercise.mutateAsync({
      contractAddress,
      underlyingPrice: underlying,
      solPrice: sol,
    })
    setSelectedContract(null)
    setExerciseData({ underlyingPrice: '', solPrice: '10000' })
  }

  const getStatusBadge = (status: { active?: unknown; exercised?: unknown; settled?: unknown }) => {
    if (status.active) return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</span>
    if (status.exercised) return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Exercised</span>
    if (status.settled) return <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Settled</span>
    return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">Unknown</span>
  }

  return {
    activeCount,
    element: (
      <div className="space-y-4">
        {contracts.map((contract: { address: PublicKey; data: { optionType: { call?: unknown; put?: unknown }; strikePrice: { toNumber: () => number }; numUnits: { toString: () => string }; premium: { toNumber: () => number }; expirationDate: { toNumber: () => number }; status: { active?: unknown; exercised?: unknown; settled?: unknown }; sellerPendingBalance: { toNumber: () => number }; underlyingAsset: string }; userRole: { buyer?: unknown; seller?: unknown } } | null, idx: number) => {
          if (!contract) return null
          const { address, data, userRole } = contract
          const isBuyer = userRole.buyer !== undefined
          const optionType = data.optionType.call ? 'Call' : 'Put'
          const strikePrice = data.strikePrice.toNumber() / 100
          const premium = data.premium.toNumber() / LAMPORTS_PER_SOL
          const expirationDateObj = new Date(data.expirationDate.toNumber() * 1000)
          const isExpired = isContractExpired(contract)
          const canExercise = !!(isBuyer && data.status.active && isExpired)
          const canSettle = !!data.status.exercised

          return (
            <Card key={idx}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className={isBuyer ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'}>
                        {isBuyer ? '📈 Buyer' : '📉 Seller'}
                      </span>
                      <span className="text-lg">{data.underlyingAsset}</span>
                      <span className="text-sm font-normal text-muted-foreground">{optionType}</span>
                    </CardTitle>
                    <CardDescription>
                      <ExplorerLink path={`account/${address.toString()}`} label={ellipsify(address.toString())} />
                    </CardDescription>
                  </div>
                  {getStatusBadge(data.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Strike Price</p>
                    <p className="font-medium">${strikePrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Units</p>
                    <p className="font-medium">{data.numUnits.toString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Premium</p>
                    <p className="font-medium">{premium.toFixed(3)} SOL</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expiration</p>
                    <p className="font-medium" suppressHydrationWarning>
                      {expirationDateObj.toLocaleDateString()}
                    </p>
                    <span className="text-xs text-red-500" suppressHydrationWarning>
                      {isExpired && 'Expired'}
                    </span>
                  </div>
                </div>

                {data.status.exercised !== undefined && (
                  <div className="bg-muted p-3 rounded-md text-sm">
                    <p className="font-medium mb-1">Pending Settlement</p>
                    <p className="text-muted-foreground">
                      Amount: {(data.sellerPendingBalance.toNumber() / LAMPORTS_PER_SOL).toFixed(4)} SOL
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {canExercise && selectedContract !== address.toString() && (
                    <Button
                      onClick={() => setSelectedContract(address.toString())}
                      size="sm"
                    >
                      Exercise
                    </Button>
                  )}

                  {canExercise && selectedContract === address.toString() && (
                    <div className="flex gap-2 w-full">
                      <Input
                        placeholder="Underlying price (cents)"
                        type="number"
                        value={exerciseData.underlyingPrice}
                        onChange={(e) => setExerciseData({ ...exerciseData, underlyingPrice: e.target.value })}
                        size={1}
                      />
                      <Input
                        placeholder="SOL price (cents)"
                        type="number"
                        value={exerciseData.solPrice}
                        onChange={(e) => setExerciseData({ ...exerciseData, solPrice: e.target.value })}
                        size={1}
                      />
                      <Button
                        onClick={() => handleExercise(address)}
                        disabled={exercise.isPending}
                        size="sm"
                      >
                        Submit
                      </Button>
                      <Button
                        onClick={() => setSelectedContract(null)}
                        variant="outline"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}

                  {canSettle && (
                    <Button
                      onClick={() => settle.mutateAsync(address)}
                      disabled={settle.isPending}
                      size="sm"
                      variant="outline"
                    >
                      {settle.isPending ? 'Settling...' : 'Settle'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    ),
  }
}
