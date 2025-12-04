### **Project Description**

### **Over-the-Counter Equity Options on Solana**

**Deployed Frontend URL:** <https://otc-options.vercel.app/>

**Solana Program ID:** AhcabRVb9LjuirKvfpeJatRsJFq3zsrrp8vAKGTaTTr4

### **Project Overview**

**Description**

This Solana-based application enables users to create, manage, and exercise over-the-counter (OTC) options contracts in a decentralized manner. Leveraging the Anchor framework, it provides secure smart contract logic for creating options, depositing collateral, exercising contracts, and settling payouts between buyers and sellers. The frontend offers an intuitive interface for users to interact with the protocol, manage their positions, and view contract details. By utilizing Solana's high-speed blockchain, the platform delivers fast, low-cost transactions for decentralized options trading.

This program makes extensive use of Program Derived Addresses (PDAs) to securely manage and segregate user and contract data on Solana. In this application, PDAs are used to create unique accounts for contracts, user profiles, and escrow accounts. For example, each option contract, user account, and escrow account is associated with a PDA derived from a combination of constants and user public keys. This approach guarantees that account addresses are unique, predictable, and cannot be claimed or manipulated by external actors. By leveraging PDAs, the program enforces strict access control, ensures the integrity of funds and contract data, and enables seamless management of multiple contracts and escrows per user without manual address management.

### **Key Features**

- **OTC Options Contracts:** Create, exercise, and settle over-the-counter options between buyers and sellers.
- **PDA-Based Account Management:** Securely manages user, escrow, and contract accounts using Solana Program Derived Addresses (PDAs).
- **User & Escrow Initialization:** Users can initialize their accounts and escrows for secure fund management.
- **Deposits & Withdrawals:** Users can deposit to and withdraw from their escrow accounts.
- **Lifecycle Management:** Supports contract creation, exercising by buyers, and settlement by either party.
- **Role Tracking:** Tracks user roles (buyer/seller) and contract status (active, exercised, settled).
- **Validation & Security:** Enforces business logic and security through custom errors and account checks.
- **Efficient On-Chain Storage:** Stores contract and user data efficiently using custom structs and enums.

### **How to Use the dApp**

#### Prerequisite

**Phantom wallet extension must be added to the browser.**

#### Steps

**1. Connect Your Wallet**

- User Open the app in your browser.
- Click the "Connect Wallet" button in the navbar.
- Approve the connection in your Solana wallet (e.g., Phantom).

**2. Initialize Your Account**

- If you're a new user, the app will prompt you to initialize your account.
- Click "Initialize Account" to create your on-chain user profile and escrow account.

**3. Deposit Funds**

- Navigate to the "Account" or "Escrow" section.
- Enter the amount of SOL you want to deposit.
- Click "Deposit" and approve the transaction in your wallet.
- Your escrow balance will update after confirmation.

**5. View and Manage Contracts**

- Visit the "My Workspace" or "Contracts" tab.
- See a list of your active, exercised, and settled contracts.
- Click on a contract to view details, including counterparties, status, and balances.

**6. Exercise an Option**

- If you are the buyer and the contract is active, select the contract.
- Click "Exercise Option."
- Enter the current underlying asset price and SOL price (as required).
- Approve the transaction to exercise the contract.

**7. Settle a Contract**

- After an option is exercised, either party can settle the contract.
- Click "Settle" on the contract details page and approve the transaction.
- Funds will be distributed according to the contract terms.

**8. Withdraw Funds**

- Go to the "Account" or "Escrow" section.
- Enter the amount you wish to withdraw from escrow.
- Click "Withdraw" and approve the transaction.

**9. Monitor Activity**

- Use the dashboard and notifications to track contract status, balances, and recent actions.

### **Program Architecture**

### The architecture leverages Solana's PDAs for secure, deterministic account management, with Anchor providing structure, validation, and serialization. The program cleanly separates user, escrow, and contract logic, supporting a full OTC options lifecycle with robust error handling and efficient on-chain storage

### **PDA Usage**

This program uses Program Derived Addresses (PDAs) extensively to securely manage and isolate on-chain accounts for users, escrows, and contracts. PDAs are deterministic addresses generated from seeds and the program ID, ensuring only the program can sign for them.

### **PDAs Used:**

- **User Accounts:**

Each user has a UserAccount PDA, derived from the seed \["user", user_pubkey\]. This account tracks the user's contracts and roles.

- **Escrow Accounts:**

Each user also has an escrow PDA, derived from \["escrow", user_pubkey\]. This account securely holds the user's deposited funds, ensuring only the program can move funds in or out.

- **Option Contracts:**

Each contract is stored in a PDA derived from \["contract", buyer_pubkey, seller_pubkey, buyer_account.contract_count\]. This ensures every contract has a unique, predictable address based on the involved parties and the contract count.

- **Instruction Enforcement:**

All instructions (e.g., create_contract, deposit, exercise, settle, withdraw) require the correct PDA accounts as inputs. This ensures that only the intended accounts are modified and that users cannot spoof or access others' data.

### Program Instructions

#### Instructions Implemented

- **create_contract:** Creates a new OTC option contract between a buyer and a seller.
- **Deposit:** Allows a user to deposit funds into their escrow account.
- **Exercise:** Allows the buyer to exercise an active option contract.
- **initialize_escrow:** Initializes an escrow account for a user.
- **initialize_user:** Initializes a user account for tracking contracts and roles.
- **Settle:** Settles an exercised contract, distributing funds accordingly.
- **Withdraw:** Allows a user to withdraw funds from their escrow account.

### **Account Structure**

##### OptionContract

Stores all data for a single OTC option contract.

pub struct OptionContract {

pub bump: u8,

pub contract_id: u64,

pub creation_date: i64,

pub underlying_asset: String,

pub num_units: u64,

pub strike_price: u64,

pub expiration_date: i64,

pub option_type: OptionType, // Call or Put

pub premium: u64,

pub buyer: Pubkey,

pub seller: Pubkey,

pub buyer_escrow: Pubkey,

pub seller_escrow: Pubkey,

pub seller_pending_balance: u64,

pub buyer_pending_balance: u64,

pub status: ContractStatus, // Active, Exercised, Settled

pub margin_requirement_bps: u16,

pub margin_amount: u64,

pub is_test: bool,

}

- **bump (u8):** PDA bump seed for address derivation.
- **contract_id (u64):** Unique identifier for this contract.
- **creation_date (i64):** Timestamp when the contract was created.
- **underlying_asset (string):** Ticker or name of the asset (e.g., "BTC").
- **num_units (u64):** Number of units of the underlying asset in the contract.
- **strike_price (u64):** Strike price for the option (in smallest units, e.g., lamports).
- **expiration_date (i64):** Timestamp when the contract expires.
- **option_type (OptionType):** Enum, either Call or Put.
- **premium (u64):** Premium amount paid for the option.
- **buyer (pubkey):** Public key of the buyer.
- **seller (pubkey):** Public key of the seller.
- **buyer_escrow (pubkey):** PDA of the buyer's escrow account.
- **seller_escrow (pubkey):** PDA of the seller's escrow account.
- **seller_pending_balance (u64):** Amount pending for the seller after exercise/settlement.
- **buyer_pending_balance (u64):** Amount pending for the buyer after exercise/settlement.
- **status (ContractStatus):** Enum, can be Active, Exercised, or Settled.
- **margin_requirement_bps (u16):** Margin requirement in basis points (1/100 of a percent).
- **margin_amount (u64):** Calculated margin amount required for the contract.
- **is_test (bool):** Flag indicating if this is a test contract.

##### UserAccount

Tracks a user's participation and contract history.

pub struct UserAccount {

pub bump: u8,

pub owner: Pubkey,

pub contract_count: u64,

pub contracts: Vec&lt;UserContract&gt;,

}

- **bump (u8):** PDA bump seed for address derivation.
- **owner (pubkey):** Public key of the user.
- **contract_count (u64):** Number of contracts the user has created or participated in.
- **contracts (Vec&lt;UserContract&gt;):** List of contracts the user is involved in, with role and status.

##### UserContract

Represents a user's involvement in a specific contract.

pub struct UserContract {

pub contract_address: Pubkey,

pub role: UserRole, // Buyer or Seller

pub status: ContractStatus, // Active, Exercised, Settled

}

- **contract_address (pubkey):** Address of the associated OptionContract.
- **role (UserRole):** Enum, either Buyer or Seller.
- **status (ContractStatus):** Enum, current status of the contract for this user.

##### Enums

pub enum OptionType {

Call,

Put,

}

pub enum ContractStatus {

Active,

Exercised,

Settled,

}

pub enum UserRole {

Buyer,

Seller,

}

### **Testing**

#### Test Coverage

Comprehensive test suite covering all instructions with both successful operations and error conditions to ensure program security and reliability.

#### Happy Path Tests

- **User Initialization**
  - Verifies that a new user account and escrow can be successfully initialized.
- **Deposit Funds**
  - Checks that a user can deposit a valid amount into their escrow account and the balance updates correctly.
- **Create Contract**
  - Ensures a contract can be created between a buyer and seller with valid parameters, and all related PDAs are set up.
- **Exercise Contract**
  - Verifies that the buyer can exercise an active contract with valid price inputs.
- **Settle Contract**
  - Confirms that a contract can be settled after being exercised, and funds are distributed as expected.
- **Withdraw Funds**
  - Checks that a user can withdraw available funds from their escrow account.

#### Unhappy Path Tests

- **Insufficient Balance on Deposit/Settlement**
  - Attempts to deposit zero or negative amounts, or settle a contract when the seller's escrow has insufficient funds, expecting failure with InsufficientBalance or InsufficientSellerEscrow.
- **Unauthorized Exercise**
  - Tries to exercise a contract as a non-buyer, expecting failure with UnauthorizedExercise.
- **Contract Not Active/Expired**
  - Attempts to exercise or settle a contract that is not in the active state, or before expiration, expecting ContractNotActive or ContractNotExpired.
- **No Pending Balance**
  - Tries to settle a contract with no pending balance, expecting NoPendingBalance.
- **Max Contracts Reached**
  - Attempts to create more contracts than allowed, expecting MaxContractsReached.
- **Asset Ticker Too Long**
  - Tries to create a contract with an asset ticker exceeding the allowed length, expecting AssetTickerTooLong.
- **Invalid Deposit Amount**
  - Attempts to deposit an amount less than or equal to zero, expecting InvalidDepositAmount.
- **Calculation Error**
  - Triggers overflow or division by zero in contract logic, expecting CalculationError.

### **Key for Errors Defined**

- **InsufficientBalance**  
    Code: 6000  
    Message: "Insufficient balance in escrow"
- **ContractNotExpired**  
    Code: 6001  
    Message: "Contract has not expired yet"
- **ContractNotActive**  
    Code: 6002  
    Message: "Contract is not in active state"
- **UnauthorizedExercise**  
    Code: 6003  
    Message: "Only buyer can exercise the contract"
- **NotExercised**  
    Code: 6004  
    Message: "Contract must be exercised before settlement"
- **NoPendingBalance**  
    Code: 6005  
    Message: "No pending balance to settle"
- **InsufficientSellerEscrow**  
    Code: 6006  
    Message: "Seller escrow has insufficient funds for settlement"
- **CalculationError**  
    Code: 6007  
    Message: "Calculation error: overflow or division by zero"
- **MaxContractsReached**  
    Code: 6008  
    Message: "Maximum number of contracts reached"
- **AssetTickerTooLong**  
    Code: 6009  
    Message: "Asset ticker exceeds maximum length"
- **InvalidDepositAmount**  
    Code: 6010  
    Message: "Deposit amount must be greater than zero"

### **Running Tests**

#### Dependencies

- 1. Install Solana Toolchain and dependencies

curl --proto '=https' --tlsv1.2 -sSfL <https://solana-install.solana.workers.dev> | bash

- 1. **Perform build**

export PATH="\$HOME/.local/share/solana/install/active_release/bin:\$PATH" && anchor build

- 1. **Generate new keypair**

solana-keygen new --no-bip39-passphrase --force

- 1. **Anchor test**

export PATH="\$HOME/.local/share/solana/install/active_release/bin:\$PATH" && anchor test

- 1. **Frontend dependencies (Next.js)**

npm install

- 1. **Set Up Solana CLI and Keypair**

\# Set Solana cluster to devnet

solana config set --url devnet

\# Ensure keypair exists

if \[ ! -f "\$HOME/.config/solana/id.json" \]; then

solana-keygen new --no-bip39-passphrase -o "\$HOME/.config/solana/id.json"

fi

\# Airdrop SOL if balance is low

BALANCE=\$(solana balance --keypair "\$HOME/.config/solana/id.json" --url devnet | awk '{print \$1}')

if (( \$(echo "\$BALANCE < 3" | bc -l) )); then

solana airdrop 3 --keypair "\$HOME/.config/solana/id.json" --url devnet

sleep 10

### fi

### **Run Tests**

cd OTC_Options_v1/anchor

anchor test --provider.cluster devnet --provider.wallet "\$HOME/.config/solana/id.json"

anchor test # run tests

### **Additional Notes for Evaluators**

Building my first Solana dApp was a landmark achievement for me. Developing this program teaches the importance of careful account management, robust error handling, and the value of thorough testing. Novices will gain practical experience with Solana's unique architecture, Anchor's developer tools, and the end-to-end workflow of building, testing, and deploying a real-world decentralized application

**Biggest Challenges During Program Development**

- **PDA (Program Derived Address) Management:**  
    Designing and correctly deriving PDAs for users, escrows, and contracts is complex. Ensuring deterministic, collision-free addresses and proper seed usage is critical for security and data integrity.
- **Account Size and Serialization:**  
    Calculating the correct size for on-chain accounts (especially for structs with dynamic fields like vectors and strings) is tricky. Underestimating size leads to runtime errors and wasted SOL.
- **Error Handling and Validation:**  
    Implementing comprehensive error checks (e.g., for insufficient balances, unauthorized actions, or contract state) is essential to prevent exploits and ensure a robust user experience.
- **Instruction and Account Relationships:**  
    Managing the relationships between multiple accounts in each instruction (e.g., linking user, escrow, and contract PDAs) requires careful planning and testing.
- **Testing on Devnet:**  
    Dealing with airdrop limits, network delays, and ensuring the test environment matches production can be frustrating for new developers.

**Key Learnings for myself**

- **Understand Solana Account Model:**  
    Learn how Solana's account system works, especially the difference between system accounts, PDAs, and user wallets.
- **Master Anchor Framework:**  
    Anchor simplifies Solana development but requires understanding of macros, account validation, and IDL structure.
- **Importance of Error Handling:**  
    Always define and handle custom errors to make debugging and user experience better.
- **Test Early and Often:**  
    Write both positive and negative tests to catch edge cases and ensure program safety.
- **Iterative Development:**  
    Start with simple instructions and gradually add complexity, testing each step.
- **Read and Use the IDL:**  
    The IDL is a powerful tool for understanding and integrating with your program from the frontend.
