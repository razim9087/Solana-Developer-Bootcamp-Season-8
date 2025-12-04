'use client'

import { getBasicProgram, getBasicProgramId } from '@project/anchor'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { Cluster, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../use-transaction-toast'
import { toast } from 'sonner'
import { BN } from '@coral-xyz/anchor'

export function useBasicProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const { publicKey } = useWallet()
  const programId = useMemo(() => getBasicProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getBasicProgram(provider, programId), [provider, programId])

  const accounts = useMemo(() => {
    if (!publicKey) return null
    const [userAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from('user'), publicKey.toBuffer()],
      programId
    )
    const [userEscrow] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), publicKey.toBuffer()],
      programId
    )
    return { userAccount, userEscrow }
  }, [publicKey, programId])

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const getUserAccount = useQuery({
    queryKey: ['get-user-account', { cluster, publicKey: publicKey?.toString() }],
    queryFn: async () => {
      if (!accounts) return null
      try {
        return await program.account.userAccount.fetch(accounts.userAccount)
      } catch {
        return null
      }
    },
    enabled: !!publicKey && !!accounts,
  })

  const getEscrowBalance = useQuery({
    queryKey: ['get-escrow-balance', { cluster, publicKey: publicKey?.toString() }],
    queryFn: async () => {
      if (!accounts) return 0
      try {
        const balance = await connection.getBalance(accounts.userEscrow)
        return balance
      } catch {
        return 0
      }
    },
    enabled: !!publicKey && !!accounts,
  })

  const getAllContracts = useQuery({
    queryKey: ['get-all-contracts', { cluster, publicKey: publicKey?.toString() }],
    queryFn: async () => {
      if (!getUserAccount.data?.contracts) return []
      const contracts = await Promise.all(
        getUserAccount.data.contracts.map(async (uc) => {
          try {
            const contractData = await program.account.optionContract.fetch(uc.contractAddress)
            return { address: uc.contractAddress, data: contractData, userRole: uc.role, userStatus: uc.status }
          } catch {
            return null
          }
        })
      )
      return contracts.filter((c) => c !== null)
    },
    enabled: !!getUserAccount.data,
  })

  const initializeUser = useMutation({
    mutationKey: ['initialize-user', { cluster }],
    mutationFn: async () => {
      if (!publicKey || !accounts) throw new Error('Wallet not connected')
      return program.methods
        .initializeUser()
        .accounts({
          user: publicKey,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      getUserAccount.refetch()
      toast.success('User account initialized!')
    },
    onError: (error) => {
      toast.error(`Failed to initialize: ${error}`)
    },
  })

  const initializeEscrow = useMutation({
    mutationKey: ['initialize-escrow', { cluster }],
    mutationFn: async () => {
      if (!publicKey || !accounts) throw new Error('Wallet not connected')
      return program.methods
        .initializeEscrow()
        .accounts({
          user: publicKey,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      getEscrowBalance.refetch()
      toast.success('Escrow initialized!')
    },
    onError: (error) => {
      toast.error(`Failed to initialize escrow: ${error}`)
    },
  })

  const deposit = useMutation({
    mutationKey: ['deposit', { cluster }],
    mutationFn: async (amount: number) => {
      if (!publicKey || !accounts) throw new Error('Wallet not connected')
      const lamports = new BN(amount * LAMPORTS_PER_SOL)
      return program.methods
        .deposit(lamports)
        .accounts({
          user: publicKey,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      getEscrowBalance.refetch()
      toast.success('Deposit successful!')
    },
    onError: (error) => {
      toast.error(`Deposit failed: ${error}`)
    },
  })

  const withdraw = useMutation({
    mutationKey: ['withdraw', { cluster }],
    mutationFn: async (amount: number) => {
      if (!publicKey || !accounts) throw new Error('Wallet not connected')
      const lamports = new BN(amount * LAMPORTS_PER_SOL)
      return program.methods
        .withdraw(lamports)
        .accounts({
          user: publicKey,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      getEscrowBalance.refetch()
      toast.success('Withdrawal successful!')
    },
    onError: (error) => {
      toast.error(`Withdrawal failed: ${error}`)
    },
  })

  const createContract = useMutation({
    mutationKey: ['create-contract', { cluster }],
    mutationFn: async (params: {
      seller: PublicKey
      underlyingAsset: string
      numUnits: number
      strikePrice: number
      expirationDate: number
      optionType: 'call' | 'put'
      premium: number
      marginRequirementBps: number
    }) => {
      if (!publicKey || !accounts) throw new Error('Wallet not connected')

      return program.methods
        .createContract(
          params.underlyingAsset,
          new BN(params.numUnits),
          new BN(params.strikePrice),
          new BN(params.expirationDate),
          params.optionType === 'call' ? { call: {} } : { put: {} },
          new BN(params.premium * LAMPORTS_PER_SOL),
          params.marginRequirementBps,
          false // not test mode
        )
        .accounts({
          buyer: publicKey,
          seller: params.seller,
        })
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      getUserAccount.refetch()
      getAllContracts.refetch()
      getEscrowBalance.refetch()
      toast.success('Contract created successfully!')
    },
    onError: (error) => {
      toast.error(`Failed to create contract: ${error}`)
    },
  })

  const exercise = useMutation({
    mutationKey: ['exercise', { cluster }],
    mutationFn: async (params: { contractAddress: PublicKey; underlyingPrice: number; solPrice: number }) => {
      if (!publicKey) throw new Error('Wallet not connected')

      return program.methods
        .exercise(new BN(params.underlyingPrice), new BN(params.solPrice))
        .accounts({
          buyer: publicKey,
        })
        .remainingAccounts([{
          pubkey: params.contractAddress,
          isSigner: false,
          isWritable: true,
        }])
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      getAllContracts.refetch()
      toast.success('Contract exercised!')
    },
    onError: (error) => {
      toast.error(`Exercise failed: ${error}`)
    },
  })

  const settle = useMutation({
    mutationKey: ['settle', { cluster }],
    mutationFn: async (contractAddress: PublicKey) => {
      if (!publicKey) throw new Error('Wallet not connected')

      return program.methods
        .settle()
        .accounts({
          caller: publicKey,
        })
        .remainingAccounts([{
          pubkey: contractAddress,
          isSigner: false,
          isWritable: true,
        }])
        .rpc()
    },
    onSuccess: (signature) => {
      transactionToast(signature)
      getAllContracts.refetch()
      getEscrowBalance.refetch()
      toast.success('Contract settled!')
    },
    onError: (error) => {
      toast.error(`Settlement failed: ${error}`)
    },
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    getUserAccount,
    getEscrowBalance,
    getAllContracts,
    initializeUser,
    initializeEscrow,
    deposit,
    withdraw,
    createContract,
    exercise,
    settle,
  }
}
