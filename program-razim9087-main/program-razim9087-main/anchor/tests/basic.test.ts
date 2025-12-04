import * as anchor from '@coral-xyz/anchor'
import type { Basic } from '../target/types/basic.js'
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import { BN } from 'bn.js'
import { expect } from 'chai'

describe('OTC Options Trading', () => {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.Basic as anchor.Program<Basic>
  
  // Test keypairs
  let buyer: Keypair
  let seller: Keypair
  
  // PDAs
  let buyerAccount: PublicKey
  let sellerAccount: PublicKey
  let buyerEscrow: PublicKey
  let sellerEscrow: PublicKey
  
  // Helper function to get PDAs
  const getUserAccountPDA = (user: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('user'), user.toBuffer()],
      program.programId
    )
  }
  
  const getEscrowPDA = (user: PublicKey): [PublicKey, number] => {
    return PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), user.toBuffer()],
      program.programId
    )
  }
  
  const getContractPDA = (buyer: PublicKey, seller: PublicKey, contractCount: number): [PublicKey, number] => {
    const countBuffer = Buffer.alloc(8)
    countBuffer.writeBigUInt64LE(BigInt(contractCount))
    
    return PublicKey.findProgramAddressSync(
      [Buffer.from('contract'), buyer.toBuffer(), seller.toBuffer(), countBuffer],
      program.programId
    )
  }
  
  // Helper to airdrop SOL
  const airdrop = async (pubkey: PublicKey, amount: number) => {
    const signature = await provider.connection.requestAirdrop(
      pubkey,
      amount * LAMPORTS_PER_SOL
    )
    await provider.connection.confirmTransaction(signature)
  }
  
  before(async () => {
    // Create test keypairs
    buyer = Keypair.generate()
    seller = Keypair.generate()
    
    // Airdrop SOL to test accounts
    await airdrop(buyer.publicKey, 10)
    await airdrop(seller.publicKey, 50)
    
    // Derive PDAs
    ;[buyerAccount] = getUserAccountPDA(buyer.publicKey)
    ;[sellerAccount] = getUserAccountPDA(seller.publicKey)
    ;[buyerEscrow] = getEscrowPDA(buyer.publicKey)
    ;[sellerEscrow] = getEscrowPDA(seller.publicKey)
  })

  describe('User Account Initialization', () => {
    it('should initialize buyer user account', async () => {
      await program.methods
        .initializeUser()
        .accounts({
          user: buyer.publicKey,
          userAccount: buyerAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const account = await program.account.userAccount.fetch(buyerAccount)
      expect(account.owner.toString()).to.equal(buyer.publicKey.toString())
      expect(account.contractCount.toNumber()).to.equal(0)
      expect(account.contracts.length).to.equal(0)
    })
    
    it('should initialize seller user account', async () => {
      await program.methods
        .initializeUser()
        .accounts({
          user: seller.publicKey,
          userAccount: sellerAccount,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc()
      
      const account = await program.account.userAccount.fetch(sellerAccount)
      expect(account.owner.toString()).to.equal(seller.publicKey.toString())
      expect(account.contractCount.toNumber()).to.equal(0)
    })
  })

  describe('Escrow Initialization and Deposits', () => {
    it('should initialize buyer escrow', async () => {
      await program.methods
        .initializeEscrow()
        .accounts({
          user: buyer.publicKey,
          userEscrow: buyerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const escrowInfo = await provider.connection.getAccountInfo(buyerEscrow)
      expect(escrowInfo).to.not.be.null
    })
    
    it('should initialize seller escrow', async () => {
      await program.methods
        .initializeEscrow()
        .accounts({
          user: seller.publicKey,
          userEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc()
      
      const escrowInfo = await provider.connection.getAccountInfo(sellerEscrow)
      expect(escrowInfo).to.not.be.null
    })
    
    it('should deposit to buyer escrow', async () => {
      const depositAmount = new BN(2 * LAMPORTS_PER_SOL)
      
      await program.methods
        .deposit(depositAmount)
        .accounts({
          user: buyer.publicKey,
          userEscrow: buyerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const balance = await provider.connection.getBalance(buyerEscrow)
      expect(balance).to.be.greaterThan(0)
    })
    
    it('should deposit to seller escrow', async () => {
      const depositAmount = new BN(25 * LAMPORTS_PER_SOL)
      
      await program.methods
        .deposit(depositAmount)
        .accounts({
          user: seller.publicKey,
          userEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc()
      
      const balance = await provider.connection.getBalance(sellerEscrow)
      expect(balance).to.be.greaterThan(0)
    })
    
    it('should fail to deposit zero amount', async () => {
      try {
        await program.methods
          .deposit(new BN(0))
          .accounts({
            user: buyer.publicKey,
            userEscrow: buyerEscrow,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer])
          .rpc()
        
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.include('InvalidDepositAmount')
      }
    })
  })

  describe('Call Option - In The Money (ITM)', () => {
    let contractPDA: PublicKey
    const strikePrice = new BN(15000) // $150.00
    const underlyingPrice = new BN(17000) // $170.00 (ITM for call)
    const numUnits = new BN(100)
    const premium = new BN(0.1 * LAMPORTS_PER_SOL)
    const marginRequirementBps = 2000 // 20%
    const solPrice = new BN(10000) // $100.00 per SOL
    
    it('should create a call option contract', async () => {
      const buyerAccountData = await program.account.userAccount.fetch(buyerAccount)
      const contractCount = buyerAccountData.contractCount.toNumber()
      
      ;[contractPDA] = getContractPDA(buyer.publicKey, seller.publicKey, contractCount)
      
      const expirationDate = new BN(Math.floor(Date.now() / 1000) - 3600) // 1 hour ago (expired)
      
      await program.methods
        .createContract(
          'AAPL',
          numUnits,
          strikePrice,
          expirationDate,
          { call: {} },
          premium,
          marginRequirementBps,
          true // is_test mode
        )
        .accounts({
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
          buyerEscrow: buyerEscrow,
          sellerEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.underlyingAsset).to.equal('AAPL')
      expect(contract.strikePrice.toNumber()).to.equal(strikePrice.toNumber())
      expect(contract.numUnits.toNumber()).to.equal(numUnits.toNumber())
      expect(contract.buyer.toString()).to.equal(buyer.publicKey.toString())
      expect(contract.seller.toString()).to.equal(seller.publicKey.toString())
      expect(contract.status).to.deep.equal({ active: {} })
    })
    
    it('should exercise the ITM call option', async () => {
      await program.methods
        .exercise(underlyingPrice, solPrice)
        .accounts({
          buyer: buyer.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.status).to.deep.equal({ exercised: {} })
      
      // Calculate expected profit
      // Profit per share = $170 - $150 = $20
      // Total profit = $20 * 100 = $2000
      // In lamports = ($2000 / $100) * 1e9 = 20 * 1e9
      const expectedProfit = new BN(20 * LAMPORTS_PER_SOL)
      expect(contract.buyerPendingBalance.toString()).to.equal(expectedProfit.toString())
    })
    
    it('should settle the call option', async () => {
      const buyerEscrowBefore = await provider.connection.getBalance(buyerEscrow)
      const sellerEscrowBefore = await provider.connection.getBalance(sellerEscrow)
      
      await program.methods
        .settle()
        .accounts({
          caller: buyer.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
          buyerEscrow: buyerEscrow,
          sellerEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.status).to.deep.equal({ settled: {} })
      expect(contract.buyerPendingBalance.toNumber()).to.equal(0)
      expect(contract.sellerPendingBalance.toNumber()).to.equal(0)
      
      const buyerEscrowAfter = await provider.connection.getBalance(buyerEscrow)
      const sellerEscrowAfter = await provider.connection.getBalance(sellerEscrow)
      
      expect(buyerEscrowAfter).to.be.greaterThan(buyerEscrowBefore)
      expect(sellerEscrowAfter).to.be.lessThan(sellerEscrowBefore)
    })
  })

  describe('Call Option - Out of The Money (OTM)', () => {
    let contractPDA: PublicKey
    const strikePrice = new BN(20000) // $200.00
    const underlyingPrice = new BN(18000) // $180.00 (OTM for call)
    const numUnits = new BN(50)
    const premium = new BN(0.05 * LAMPORTS_PER_SOL)
    const marginRequirementBps = 2000
    const solPrice = new BN(10000)
    
    it('should create an OTM call option contract', async () => {
      const buyerAccountData = await program.account.userAccount.fetch(buyerAccount)
      const contractCount = buyerAccountData.contractCount.toNumber()
      
      ;[contractPDA] = getContractPDA(buyer.publicKey, seller.publicKey, contractCount)
      
      const expirationDate = new BN(Math.floor(Date.now() / 1000) - 3600)
      
      await program.methods
        .createContract(
          'TSLA',
          numUnits,
          strikePrice,
          expirationDate,
          { call: {} },
          premium,
          marginRequirementBps,
          true
        )
        .accounts({
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
          buyerEscrow: buyerEscrow,
          sellerEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.status).to.deep.equal({ active: {} })
    })
    
    it('should exercise the OTM call option with zero profit', async () => {
      await program.methods
        .exercise(underlyingPrice, solPrice)
        .accounts({
          buyer: buyer.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.status).to.deep.equal({ exercised: {} })
      expect(contract.buyerPendingBalance.toNumber()).to.equal(0)
      expect(contract.sellerPendingBalance.toNumber()).to.equal(0)
    })
  })

  describe('Put Option - In The Money (ITM)', () => {
    let contractPDA: PublicKey
    const strikePrice = new BN(25000) // $250.00
    const underlyingPrice = new BN(22000) // $220.00 (ITM for put)
    const numUnits = new BN(75)
    const premium = new BN(0.15 * LAMPORTS_PER_SOL)
    const marginRequirementBps = 2000
    const solPrice = new BN(10000)
    
    before(async () => {
      // Refill seller escrow for put option test
      const depositAmount = new BN(25 * LAMPORTS_PER_SOL)
      await program.methods
        .deposit(depositAmount)
        .accounts({
          user: seller.publicKey,
          userEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc()
    })
    
    it('should create a put option contract', async () => {
      const buyerAccountData = await program.account.userAccount.fetch(buyerAccount)
      const contractCount = buyerAccountData.contractCount.toNumber()
      
      ;[contractPDA] = getContractPDA(buyer.publicKey, seller.publicKey, contractCount)
      
      const expirationDate = new BN(Math.floor(Date.now() / 1000) - 3600)
      
      await program.methods
        .createContract(
          'NVDA',
          numUnits,
          strikePrice,
          expirationDate,
          { put: {} },
          premium,
          marginRequirementBps,
          true
        )
        .accounts({
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
          buyerEscrow: buyerEscrow,
          sellerEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.underlyingAsset).to.equal('NVDA')
      expect(contract.optionType).to.deep.equal({ put: {} })
      expect(contract.status).to.deep.equal({ active: {} })
    })
    
    it('should exercise the ITM put option', async () => {
      await program.methods
        .exercise(underlyingPrice, solPrice)
        .accounts({
          buyer: buyer.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.status).to.deep.equal({ exercised: {} })
      
      // Calculate expected profit
      // Profit per share = $250 - $220 = $30
      // Total profit = $30 * 75 = $2250
      // In lamports = ($2250 / $100) * 1e9 = 22.5 * 1e9
      const expectedProfit = new BN(22.5 * LAMPORTS_PER_SOL)
      expect(contract.buyerPendingBalance.toString()).to.equal(expectedProfit.toString())
    })
    
    it('should settle the put option', async () => {
      const buyerEscrowBefore = await provider.connection.getBalance(buyerEscrow)
      
      await program.methods
        .settle()
        .accounts({
          caller: seller.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
          buyerEscrow: buyerEscrow,
          sellerEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.status).to.deep.equal({ settled: {} })
      
      const buyerEscrowAfter = await provider.connection.getBalance(buyerEscrow)
      expect(buyerEscrowAfter).to.be.greaterThan(buyerEscrowBefore)
    })
  })

  describe('Put Option - Out of The Money (OTM)', () => {
    let contractPDA: PublicKey
    const strikePrice = new BN(18000) // $180.00
    const underlyingPrice = new BN(20000) // $200.00 (OTM for put)
    const numUnits = new BN(60)
    const premium = new BN(0.08 * LAMPORTS_PER_SOL)
    const marginRequirementBps = 2000
    const solPrice = new BN(10000)
    
    it('should create an OTM put option contract', async () => {
      const buyerAccountData = await program.account.userAccount.fetch(buyerAccount)
      const contractCount = buyerAccountData.contractCount.toNumber()
      
      ;[contractPDA] = getContractPDA(buyer.publicKey, seller.publicKey, contractCount)
      
      const expirationDate = new BN(Math.floor(Date.now() / 1000) - 3600)
      
      await program.methods
        .createContract(
          'GOOGL',
          numUnits,
          strikePrice,
          expirationDate,
          { put: {} },
          premium,
          marginRequirementBps,
          true
        )
        .accounts({
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
          buyerEscrow: buyerEscrow,
          sellerEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.status).to.deep.equal({ active: {} })
    })
    
    it('should exercise the OTM put option with zero profit', async () => {
      await program.methods
        .exercise(underlyingPrice, solPrice)
        .accounts({
          buyer: buyer.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
        })
        .signers([buyer])
        .rpc()
      
      const contract = await program.account.optionContract.fetch(contractPDA)
      expect(contract.status).to.deep.equal({ exercised: {} })
      expect(contract.buyerPendingBalance.toNumber()).to.equal(0)
    })
  })

  describe('Withdraw Functionality', () => {
    it('should allow buyer to withdraw from escrow', async () => {
      const buyerWalletBefore = await provider.connection.getBalance(buyer.publicKey)
      const withdrawAmount = new BN(0.5 * LAMPORTS_PER_SOL)
      
      await program.methods
        .withdraw(withdrawAmount)
        .accounts({
          user: buyer.publicKey,
          userEscrow: buyerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      const buyerWalletAfter = await provider.connection.getBalance(buyer.publicKey)
      expect(buyerWalletAfter).to.be.greaterThan(buyerWalletBefore)
    })
    
    it('should allow seller to withdraw from escrow', async () => {
      const sellerWalletBefore = await provider.connection.getBalance(seller.publicKey)
      const withdrawAmount = new BN(0.3 * LAMPORTS_PER_SOL)
      
      await program.methods
        .withdraw(withdrawAmount)
        .accounts({
          user: seller.publicKey,
          userEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([seller])
        .rpc()
      
      const sellerWalletAfter = await provider.connection.getBalance(seller.publicKey)
      expect(sellerWalletAfter).to.be.greaterThan(sellerWalletBefore)
    })
  })

  describe('Error Cases', () => {
    it('should fail when non-buyer tries to exercise', async () => {
      const buyerAccountData = await program.account.userAccount.fetch(buyerAccount)
      const contractCount = buyerAccountData.contractCount.toNumber()
      
      const [contractPDA] = getContractPDA(buyer.publicKey, seller.publicKey, contractCount)
      
      const expirationDate = new BN(Math.floor(Date.now() / 1000) - 3600)
      
      await program.methods
        .createContract(
          'MSFT',
          new BN(100),
          new BN(30000),
          expirationDate,
          { call: {} },
          new BN(0.1 * LAMPORTS_PER_SOL),
          2000,
          true
        )
        .accounts({
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
          buyerEscrow: buyerEscrow,
          sellerEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      try {
        await program.methods
          .exercise(new BN(32000), new BN(10000))
          .accounts({
            buyer: seller.publicKey,
            contract: contractPDA,
            buyerAccount: buyerAccount,
            sellerAccount: sellerAccount,
          })
          .signers([seller])
          .rpc()
        
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.include('UnauthorizedExercise')
      }
    })
    
    it('should fail to settle before exercise', async () => {
      const buyerAccountData = await program.account.userAccount.fetch(buyerAccount)
      const contractCount = buyerAccountData.contractCount.toNumber()
      
      const [contractPDA] = getContractPDA(buyer.publicKey, seller.publicKey, contractCount)
      
      const expirationDate = new BN(Math.floor(Date.now() / 1000) - 3600)
      
      await program.methods
        .createContract(
          'AMZN',
          new BN(50),
          new BN(35000),
          expirationDate,
          { call: {} },
          new BN(0.05 * LAMPORTS_PER_SOL),
          2000,
          true
        )
        .accounts({
          buyer: buyer.publicKey,
          seller: seller.publicKey,
          contract: contractPDA,
          buyerAccount: buyerAccount,
          sellerAccount: sellerAccount,
          buyerEscrow: buyerEscrow,
          sellerEscrow: sellerEscrow,
          systemProgram: SystemProgram.programId,
        })
        .signers([buyer])
        .rpc()
      
      try {
        await program.methods
          .settle()
          .accounts({
            caller: buyer.publicKey,
            contract: contractPDA,
            buyerAccount: buyerAccount,
            sellerAccount: sellerAccount,
            buyerEscrow: buyerEscrow,
            sellerEscrow: sellerEscrow,
            systemProgram: SystemProgram.programId,
          })
          .signers([buyer])
          .rpc()
        
        expect.fail('Should have thrown an error')
      } catch (error) {
        expect(error.message).to.include('NotExercised')
      }
    })
  })

  describe('Contract Tracking', () => {
    it('should track contracts in user accounts', async () => {
      const buyerAccountData = await program.account.userAccount.fetch(buyerAccount)
      expect(buyerAccountData.contracts.length).to.be.greaterThan(0)
      
      const sellerAccountData = await program.account.userAccount.fetch(sellerAccount)
      expect(sellerAccountData.contracts.length).to.be.greaterThan(0)
    })
    
    it('should have correct contract count for buyer', async () => {
      const buyerAccountData = await program.account.userAccount.fetch(buyerAccount)
      expect(buyerAccountData.contractCount.toNumber()).to.be.greaterThan(0)
    })
  })
})
