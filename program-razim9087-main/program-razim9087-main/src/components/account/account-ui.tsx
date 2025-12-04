'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { LAMPORTS_PER_SOL, PublicKey, Message, VersionedMessage } from '@solana/web3.js'
import { RefreshCw } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState, useEffect } from 'react'

type TxDetail = {
  signature: string;
  timestamp: string;
  fee: string;
  confirmationStatus: string;
  transferAmount: string;
  creditOrDebit: string;
  err: unknown;
};
import { useConnection } from '@solana/wallet-adapter-react'

import { useCluster } from '../cluster/cluster-data-access'
import { ExplorerLink } from '../cluster/cluster-ui'
import {
  useGetBalance,
  useGetSignatures,
  useGetTokenAccounts,
  useRequestAirdrop,
  useTransferSol,
} from './account-data-access'
import { ellipsify } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AppAlert } from '@/components/app-alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AppModal } from '@/components/app-modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Client-only date cell to avoid SSR hydration mismatch
function ClientDateCell({ blockTime }: { blockTime?: number }) {
  const [date, setDate] = useState<string>("");
  useEffect(() => {
    if (blockTime) {
      setDate(new Date(blockTime * 1000).toISOString());
    } else {
      setDate("");
    }
  }, [blockTime]);
  return <span suppressHydrationWarning>{date}</span>;
}

export function AccountBalance({ address }: { address: PublicKey }) {
  const query = useGetBalance({ address })

  return (
    <h1 className="text-5xl font-bold cursor-pointer" onClick={() => query.refetch()}>
      {query.data ? <BalanceSol balance={query.data} /> : '...'} SOL
    </h1>
  )
}

export function AccountChecker() {
  const { publicKey } = useWallet()
  if (!publicKey) {
    return null
  }
  return <AccountBalanceCheck address={publicKey} />
}

export function AccountBalanceCheck({ address }: { address: PublicKey }) {
  const { cluster } = useCluster()
  const mutation = useRequestAirdrop({ address })
  const query = useGetBalance({ address })

  if (query.isLoading) {
    return null
  }
  if (query.isError || !query.data) {
    return (
      <AppAlert
        action={
          <Button variant="outline" onClick={() => mutation.mutateAsync(1).catch((err) => console.log(err))}>
            Request Airdrop
          </Button>
        }
      >
        You are connected to <strong>{cluster.name}</strong> but your account is not found on this cluster.
      </AppAlert>
    )
  }
  return null
}

export function AccountButtons({ address }: { address: PublicKey }) {
  const { cluster } = useCluster()
  return (
    <div>
      <div className="space-x-2">
        {cluster.network?.includes('mainnet') ? null : <ModalAirdrop address={address} />}
        <ModalSend address={address} />
        <ModalReceive address={address} />
      </div>
    </div>
  )
}

export function AccountTokens({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false)
  const query = useGetTokenAccounts({ address })
  const client = useQueryClient()
  const items = useMemo(() => {
    if (showAll) return query.data
    return query.data?.slice(0, 5)
  }, [query.data, showAll])

  return (
    <div className="space-y-2">
      <div className="justify-between">
        <div className="flex justify-between">
          <h2 className="text-2xl font-bold">Token Accounts</h2>
          <div className="space-x-2">
            {query.isLoading ? (
              <span className="loading loading-spinner"></span>
            ) : (
              <Button
                variant="outline"
                className="font-bold text-black bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#00D18C] bg-clip-text text-transparent border-none shadow-none"
                onClick={async () => {
                  await query.refetch();
                  await client.invalidateQueries({
                    queryKey: ['getTokenAccountBalance'],
                  });
                }}
              >
                <RefreshCw size={16} />
              </Button>
            )}
          </div>
        
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No token accounts found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="!text-white font-bold">Public Key</TableHead>
                  <TableHead className="!text-white font-bold">Mint</TableHead>
                  <TableHead className="text-right !text-white font-bold">Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items?.map(({ account, pubkey }) => (
                  <TableRow key={pubkey.toString()}>
                    <TableCell>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink label={ellipsify(pubkey.toString())} path={`account/${pubkey.toString()}`} />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <span className="font-mono">
                          <ExplorerLink
                            label={ellipsify(account.data.parsed.info.mint)}
                            path={`account/${account.data.parsed.info.mint.toString()}`}
                          />
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-mono">{account.data.parsed.info.tokenAmount.uiAmount}</span>
                    </TableCell>
                  </TableRow>
                ))}

                {(query.data?.length ?? 0) > 5 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

export function AccountTransactions({ address }: { address: PublicKey }) {
  const [showAll, setShowAll] = useState(false);
  const query = useGetSignatures({ address });
  const { connection } = useConnection();
  const [txDetails, setTxDetails] = useState<TxDetail[]>([]);
  const [loading, setLoading] = useState(false);

  const items = useMemo(() => {
    if (showAll) return query.data;
    return query.data?.slice(0, 5);
  }, [query.data, showAll]);

  useEffect(() => {
    const fetchTransactionDetails = async () => {
      if (!items || items.length === 0) {
        setTxDetails([]);
        return;
      }

      setLoading(true);
      try {
        const details = await Promise.all(
          items.map(async (sig) => {
            try {
              const tx = await connection.getTransaction(sig.signature, {
                maxSupportedTransactionVersion: 0,
              });

              // Find the account index for the current wallet
              let creditOrDebit = '-';
              let transferAmount = 0;
              if (tx?.meta?.postBalances && tx?.meta?.preBalances && tx?.transaction?.message) {
                let keys: PublicKey[] = [];
                const message = tx.transaction.message;
                // VersionedMessage has getAccountKeys(), Message has accountKeys
                if ('getAccountKeys' in message && typeof message.getAccountKeys === 'function') {
                  // VersionedMessage
                  keys = message.getAccountKeys().staticAccountKeys;
                } else if ('accountKeys' in message && Array.isArray((message as Message).accountKeys)) {
                  // Legacy Message
                  keys = (message as Message).accountKeys;
                }
                const accountIndex = keys.findIndex(
                  (k) => k.toBase58 && address && k.toBase58() === address.toBase58()
                );
                if (accountIndex !== -1) {
                  const pre = tx.meta.preBalances[accountIndex] || 0;
                  const post = tx.meta.postBalances[accountIndex] || 0;
                  const diff = post - pre;
                  transferAmount = Math.abs(diff) / LAMPORTS_PER_SOL;
                  if (diff > 0) creditOrDebit = 'Credit';
                  else if (diff < 0) creditOrDebit = 'Debit';
                  else creditOrDebit = '-';
                }
              }

              return {
                signature: sig.signature,
                timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Pending',
                fee: tx?.meta?.fee ? (tx.meta.fee / LAMPORTS_PER_SOL).toFixed(6) : '0',
                confirmationStatus: sig.confirmationStatus || 'finalized',
                transferAmount: transferAmount.toFixed(6),
                creditOrDebit,
                err: sig.err,
              };
            } catch (err) {
              return {
                signature: sig.signature,
                timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toLocaleString() : 'Pending',
                fee: '0',
                confirmationStatus: sig.confirmationStatus || 'finalized',
                transferAmount: '0',
                creditOrDebit: '-',
                err: sig.err,
              };
            }
          })
        );
        setTxDetails(details);
      } catch (error) {
        console.error('Error fetching transaction details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactionDetails();
  }, [items, connection, address]);

  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold">Transaction History</h2>
        <div className="space-x-2">
          {query.isLoading ? (
            <span className="loading loading-spinner"></span>
          ) : (
            <Button
              variant="outline"
              className="font-bold text-white bg-gradient-to-r from-[#9945FF] via-[#14F195] to-[#00D18C] bg-clip-text text-transparent border-none shadow-none"
              onClick={() => query.refetch()}
            >
              <RefreshCw size={16} />
            </Button>
          )}
        </div>
      </div>
      {query.isError && <pre className="alert alert-error">Error: {query.error?.message.toString()}</pre>}
      {query.isSuccess && (
        <div>
          {query.data.length === 0 ? (
            <div>No transactions found.</div>
          ) : loading ? (
            <div className="flex justify-center items-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="!text-white font-bold">Timestamp</TableHead>
                  <TableHead className="!text-white font-bold">Transaction Fees</TableHead>
                  <TableHead className="!text-white font-bold">Confirmation Status</TableHead>
                  <TableHead className="!text-white font-bold">Transfer Amount (SOL)</TableHead>
                  <TableHead className="!text-white font-bold">Credit/Debit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txDetails.map((item) => (
                  <TableRow key={item.signature}>
                    <TableCell className="!text-white font-mono">{item.timestamp}</TableCell>
                    <TableCell className="!text-white font-mono">{item.fee} SOL</TableCell>
                    <TableCell className="!text-white font-mono">
                      <span className={item.err ? 'text-red-500' : 'text-green-500'}>
                        {item.err ? 'Failed' : item.confirmationStatus}
                      </span>
                    </TableCell>
                    <TableCell className="!text-white font-mono">{item.transferAmount}</TableCell>
                    <TableCell className="!text-white font-mono">
                      <span className={
                        item.creditOrDebit === 'Credit'
                          ? 'text-green-400 font-bold'
                          : item.creditOrDebit === 'Debit'
                          ? 'text-red-400 font-bold'
                          : ''
                      }>
                        {item.creditOrDebit}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {(query.data?.length ?? 0) > 5 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      <Button variant="outline" onClick={() => setShowAll(!showAll)}>
                        {showAll ? 'Show Less' : 'Show All'}
                      </Button>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  );
}

function BalanceSol({ balance }: { balance: number }) {
  return <span>{Math.round((balance / LAMPORTS_PER_SOL) * 100000) / 100000}</span>;
}

function ModalReceive({ address }: { address: PublicKey }) {
  return (
    <AppModal title="Receive">
      <p>Receive assets by sending them to your public key:</p>
      <code>{address.toString()}</code>
    </AppModal>
  )
}

function ModalAirdrop({ address }: { address: PublicKey }) {
  const mutation = useRequestAirdrop({ address })
  const [amount, setAmount] = useState('2')

  return (
    <AppModal
      title="Airdrop"
      submitDisabled={!amount || mutation.isPending}
      submitLabel="Request Airdrop"
      submit={() => mutation.mutateAsync(parseFloat(amount))}
    >
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  )
}

function ModalSend({ address }: { address: PublicKey }) {
  const wallet = useWallet()
  const mutation = useTransferSol({ address })
  const [destination, setDestination] = useState('')
  const [amount, setAmount] = useState('1')

  if (!address || !wallet.sendTransaction) {
    return <div>Wallet not connected</div>
  }

  return (
    <AppModal
      title="Send"
      submitDisabled={!destination || !amount || mutation.isPending}
      submitLabel="Send"
      submit={() => {
        mutation.mutateAsync({
          destination: new PublicKey(destination),
          amount: parseFloat(amount),
        })
      }}
    >
      <Label htmlFor="destination">Destination</Label>
      <Input
        disabled={mutation.isPending}
        id="destination"
        onChange={(e) => setDestination(e.target.value)}
        placeholder="Destination"
        type="text"
        value={destination}
      />
      <Label htmlFor="amount">Amount</Label>
      <Input
        disabled={mutation.isPending}
        id="amount"
        min="1"
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount"
        step="any"
        type="number"
        value={amount}
      />
    </AppModal>
  )
}
