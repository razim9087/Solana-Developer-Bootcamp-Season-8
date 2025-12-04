use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::solana_program::rent::Rent;

declare_id!("AhcabRVb9LjuirKvfpeJatRsJFq3zsrrp8vAKGTaTTr4");

const MAX_CONTRACTS: usize = 100;
const MAX_TICKER_LENGTH: usize = 32;
const LAMPORTS_PER_SOL: u64 = 1_000_000_000;

#[program]
pub mod basic {
    use super::*;

    pub fn initialize_user(ctx: Context<InitializeUser>) -> Result<()> {
        let user_account = &mut ctx.accounts.user_account;
        user_account.bump = ctx.bumps.user_account;
        user_account.owner = ctx.accounts.user.key();
        user_account.contract_count = 0;
        user_account.contracts = Vec::new();
        Ok(())
    }

    pub fn initialize_escrow(ctx: Context<InitializeEscrow>) -> Result<()> {
        let rent = Rent::get()?;
        let space = 0;
        let lamports = rent.minimum_balance(space);
        
        let user_key = ctx.accounts.user.key();
        let (escrow_pda, bump) = Pubkey::find_program_address(
            &[b"escrow", user_key.as_ref()],
            ctx.program_id,
        );
        
        let seeds = &[b"escrow".as_ref(), user_key.as_ref(), &[bump]];
        let signer_seeds = &[&seeds[..]];
        
        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::create_account(
                ctx.accounts.user.key,
                &escrow_pda,
                lamports,
                space as u64,
                &anchor_lang::solana_program::system_program::ID,
            ),
            &[
                ctx.accounts.user.to_account_info(),
                ctx.accounts.user_escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            signer_seeds,
        )?;
        
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
        require!(amount > 0, ErrorCode::InvalidDepositAmount);

        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.user_escrow.to_account_info(),
                },
            ),
            amount,
        )?;

        Ok(())
    }

    pub fn create_contract(
        ctx: Context<CreateContract>,
        underlying_asset: String,
        num_units: u64,
        strike_price: u64,
        expiration_date: i64,
        option_type: OptionType,
        premium: u64,
        margin_requirement_bps: u16,
        is_test: bool,
    ) -> Result<()> {
        require!(
            underlying_asset.len() <= MAX_TICKER_LENGTH,
            ErrorCode::AssetTickerTooLong
        );

        let buyer_account = &mut ctx.accounts.buyer_account;
        let seller_account = &mut ctx.accounts.seller_account;

        require!(
            buyer_account.contracts.len() < MAX_CONTRACTS,
            ErrorCode::MaxContractsReached
        );
        require!(
            seller_account.contracts.len() < MAX_CONTRACTS,
            ErrorCode::MaxContractsReached
        );

        // Calculate margin amount
        let margin_amount = num_units
            .checked_mul(strike_price)
            .ok_or(ErrorCode::CalculationError)?
            .checked_mul(margin_requirement_bps as u64)
            .ok_or(ErrorCode::CalculationError)?
            .checked_div(10000)
            .ok_or(ErrorCode::CalculationError)?;

        // Check buyer escrow has sufficient premium
        let buyer_escrow_balance = ctx.accounts.buyer_escrow.lamports();
        require!(
            buyer_escrow_balance >= premium,
            ErrorCode::InsufficientBalance
        );

        // Check seller escrow has sufficient margin
        let seller_escrow_balance = ctx.accounts.seller_escrow.lamports();
        require!(
            seller_escrow_balance >= margin_amount,
            ErrorCode::InsufficientBalance
        );

        // Transfer premium from buyer escrow to seller wallet using PDA signing
        let buyer_key = ctx.accounts.buyer.key();
        let buyer_escrow_seeds = &[
            b"escrow".as_ref(),
            buyer_key.as_ref(),
            &[ctx.bumps.buyer_escrow],
        ];
        let buyer_escrow_signer = &[&buyer_escrow_seeds[..]];
        
        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                ctx.accounts.buyer_escrow.key,
                ctx.accounts.seller.key,
                premium,
            ),
            &[
                ctx.accounts.buyer_escrow.to_account_info(),
                ctx.accounts.seller.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            buyer_escrow_signer,
        )?;

        // Initialize contract
        let contract = &mut ctx.accounts.contract;
        contract.bump = ctx.bumps.contract;
        contract.contract_id = buyer_account.contract_count;
        contract.creation_date = Clock::get()?.unix_timestamp;
        contract.underlying_asset = underlying_asset;
        contract.num_units = num_units;
        contract.strike_price = strike_price;
        contract.expiration_date = expiration_date;
        contract.option_type = option_type;
        contract.premium = premium;
        contract.buyer = ctx.accounts.buyer.key();
        contract.seller = ctx.accounts.seller.key();
        contract.buyer_escrow = ctx.accounts.buyer_escrow.key();
        contract.seller_escrow = ctx.accounts.seller_escrow.key();
        contract.seller_pending_balance = 0;
        contract.buyer_pending_balance = 0;
        contract.status = ContractStatus::Active;
        contract.margin_requirement_bps = margin_requirement_bps;
        contract.margin_amount = margin_amount;
        contract.is_test = is_test;

        // Add contract to buyer's account
        buyer_account.contracts.push(UserContract {
            contract_address: contract.key(),
            role: UserRole::Buyer,
            status: ContractStatus::Active,
        });
        buyer_account.contract_count += 1;

        // Add contract to seller's account
        seller_account.contracts.push(UserContract {
            contract_address: contract.key(),
            role: UserRole::Seller,
            status: ContractStatus::Active,
        });

        Ok(())
    }

    pub fn exercise(
        ctx: Context<Exercise>,
        underlying_price_usd: u64,
        sol_price_usd: u64,
    ) -> Result<()> {
        let contract = &mut ctx.accounts.contract;

        require!(
            contract.status == ContractStatus::Active,
            ErrorCode::ContractNotActive
        );
        require!(
            contract.buyer == ctx.accounts.buyer.key(),
            ErrorCode::UnauthorizedExercise
        );

        let current_time = Clock::get()?.unix_timestamp;
        require!(
            contract.is_test || current_time >= contract.expiration_date,
            ErrorCode::ContractNotExpired
        );

        // Calculate position
        let position_lamports = match contract.option_type {
            OptionType::Call => {
                if underlying_price_usd > contract.strike_price {
                    let profit_per_share = underlying_price_usd - contract.strike_price;
                    let total_profit_usd = profit_per_share
                        .checked_mul(contract.num_units)
                        .ok_or(ErrorCode::CalculationError)?;
                    total_profit_usd
                        .checked_mul(LAMPORTS_PER_SOL)
                        .ok_or(ErrorCode::CalculationError)?
                        .checked_div(sol_price_usd)
                        .ok_or(ErrorCode::CalculationError)?
                } else {
                    0
                }
            }
            OptionType::Put => {
                if contract.strike_price > underlying_price_usd {
                    let profit_per_share = contract.strike_price - underlying_price_usd;
                    let total_profit_usd = profit_per_share
                        .checked_mul(contract.num_units)
                        .ok_or(ErrorCode::CalculationError)?;
                    total_profit_usd
                        .checked_mul(LAMPORTS_PER_SOL)
                        .ok_or(ErrorCode::CalculationError)?
                        .checked_div(sol_price_usd)
                        .ok_or(ErrorCode::CalculationError)?
                } else {
                    0
                }
            }
        };

        contract.seller_pending_balance = position_lamports;
        contract.buyer_pending_balance = position_lamports;
        contract.status = ContractStatus::Exercised;

        // Update status in user accounts
        let buyer_account = &mut ctx.accounts.buyer_account;
        for user_contract in buyer_account.contracts.iter_mut() {
            if user_contract.contract_address == contract.key() {
                user_contract.status = ContractStatus::Exercised;
                break;
            }
        }

        let seller_account = &mut ctx.accounts.seller_account;
        for user_contract in seller_account.contracts.iter_mut() {
            if user_contract.contract_address == contract.key() {
                user_contract.status = ContractStatus::Exercised;
                break;
            }
        }

        Ok(())
    }

    pub fn settle(ctx: Context<Settle>) -> Result<()> {
        let contract = &mut ctx.accounts.contract;

        require!(
            contract.status == ContractStatus::Exercised,
            ErrorCode::NotExercised
        );
        require!(
            contract.seller_pending_balance > 0,
            ErrorCode::NoPendingBalance
        );

        let seller_escrow_balance = ctx.accounts.seller_escrow.lamports();
        require!(
            seller_escrow_balance >= contract.seller_pending_balance,
            ErrorCode::InsufficientSellerEscrow
        );

        // Transfer from seller escrow to buyer escrow using PDA signing
        let seller_escrow_seeds = &[
            b"escrow".as_ref(),
            contract.seller.as_ref(),
            &[ctx.bumps.seller_escrow],
        ];
        let seller_escrow_signer = &[&seller_escrow_seeds[..]];
        
        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                ctx.accounts.seller_escrow.key,
                ctx.accounts.buyer_escrow.key,
                contract.seller_pending_balance,
            ),
            &[
                ctx.accounts.seller_escrow.to_account_info(),
                ctx.accounts.buyer_escrow.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            seller_escrow_signer,
        )?;

        contract.seller_pending_balance = 0;
        contract.buyer_pending_balance = 0;
        contract.status = ContractStatus::Settled;

        // Update status in user accounts
        let buyer_account = &mut ctx.accounts.buyer_account;
        for user_contract in buyer_account.contracts.iter_mut() {
            if user_contract.contract_address == contract.key() {
                user_contract.status = ContractStatus::Settled;
                break;
            }
        }

        let seller_account = &mut ctx.accounts.seller_account;
        for user_contract in seller_account.contracts.iter_mut() {
            if user_contract.contract_address == contract.key() {
                user_contract.status = ContractStatus::Settled;
                break;
            }
        }

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let escrow_balance = ctx.accounts.user_escrow.lamports();
        require!(escrow_balance >= amount, ErrorCode::InsufficientBalance);

        // Transfer from user escrow to user wallet using PDA signing
        let user_key = ctx.accounts.user.key();
        let escrow_seeds = &[
            b"escrow".as_ref(),
            user_key.as_ref(),
            &[ctx.bumps.user_escrow],
        ];
        let escrow_signer = &[&escrow_seeds[..]];
        
        anchor_lang::solana_program::program::invoke_signed(
            &anchor_lang::solana_program::system_instruction::transfer(
                ctx.accounts.user_escrow.key,
                ctx.accounts.user.key,
                amount,
            ),
            &[
                ctx.accounts.user_escrow.to_account_info(),
                ctx.accounts.user.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
            escrow_signer,
        )?;

        Ok(())
    }
}

#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + UserAccount::INIT_SPACE,
        seeds = [b"user", user.key().as_ref()],
        bump
    )]
    pub user_account: Account<'info, UserAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeEscrow<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", user.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as an escrow account
    pub user_escrow: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", user.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as an escrow account
    pub user_escrow: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateContract<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    /// CHECK: Seller does not need to sign
    #[account(mut)]
    pub seller: AccountInfo<'info>,
    #[account(
        init,
        payer = buyer,
        space = 8 + OptionContract::INIT_SPACE,
        seeds = [
            b"contract",
            buyer.key().as_ref(),
            seller.key().as_ref(),
            buyer_account.contract_count.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub contract: Account<'info, OptionContract>,
    #[account(
        mut,
        seeds = [b"user", buyer.key().as_ref()],
        bump = buyer_account.bump
    )]
    pub buyer_account: Account<'info, UserAccount>,
    #[account(
        mut,
        seeds = [b"user", seller.key().as_ref()],
        bump = seller_account.bump
    )]
    pub seller_account: Account<'info, UserAccount>,
    #[account(
        mut,
        seeds = [b"escrow", buyer.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as an escrow account
    pub buyer_escrow: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"escrow", seller.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as an escrow account
    pub seller_escrow: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Exercise<'info> {
    pub buyer: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"contract",
            contract.buyer.as_ref(),
            contract.seller.as_ref(),
            contract.contract_id.to_le_bytes().as_ref()
        ],
        bump = contract.bump
    )]
    pub contract: Account<'info, OptionContract>,
    #[account(
        mut,
        seeds = [b"user", contract.buyer.as_ref()],
        bump = buyer_account.bump
    )]
    pub buyer_account: Account<'info, UserAccount>,
    #[account(
        mut,
        seeds = [b"user", contract.seller.as_ref()],
        bump = seller_account.bump
    )]
    pub seller_account: Account<'info, UserAccount>,
}

#[derive(Accounts)]
pub struct Settle<'info> {
    pub caller: Signer<'info>,
    #[account(
        mut,
        seeds = [
            b"contract",
            contract.buyer.as_ref(),
            contract.seller.as_ref(),
            contract.contract_id.to_le_bytes().as_ref()
        ],
        bump = contract.bump
    )]
    pub contract: Account<'info, OptionContract>,
    #[account(
        mut,
        seeds = [b"user", contract.buyer.as_ref()],
        bump = buyer_account.bump
    )]
    pub buyer_account: Account<'info, UserAccount>,
    #[account(
        mut,
        seeds = [b"user", contract.seller.as_ref()],
        bump = seller_account.bump
    )]
    pub seller_account: Account<'info, UserAccount>,
    #[account(
        mut,
        seeds = [b"escrow", contract.buyer.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as an escrow account
    pub buyer_escrow: AccountInfo<'info>,
    #[account(
        mut,
        seeds = [b"escrow", contract.seller.as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as an escrow account
    pub seller_escrow: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"escrow", user.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA used as an escrow account
    pub user_escrow: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct OptionContract {
    pub bump: u8,
    pub contract_id: u64,
    pub creation_date: i64,
    #[max_len(32)]
    pub underlying_asset: String,
    pub num_units: u64,
    pub strike_price: u64,
    pub expiration_date: i64,
    pub option_type: OptionType,
    pub premium: u64,
    pub buyer: Pubkey,
    pub seller: Pubkey,
    pub buyer_escrow: Pubkey,
    pub seller_escrow: Pubkey,
    pub seller_pending_balance: u64,
    pub buyer_pending_balance: u64,
    pub status: ContractStatus,
    pub margin_requirement_bps: u16,
    pub margin_amount: u64,
    pub is_test: bool,
}

#[account]
#[derive(InitSpace)]
pub struct UserAccount {
    pub bump: u8,
    pub owner: Pubkey,
    pub contract_count: u64,
    #[max_len(100)]
    pub contracts: Vec<UserContract>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct UserContract {
    pub contract_address: Pubkey,
    pub role: UserRole,
    pub status: ContractStatus,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum OptionType {
    Call,
    Put,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum ContractStatus {
    Active,
    Exercised,
    Settled,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum UserRole {
    Buyer,
    Seller,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Insufficient balance in escrow")]
    InsufficientBalance,
    #[msg("Contract has not expired yet")]
    ContractNotExpired,
    #[msg("Contract is not in active state")]
    ContractNotActive,
    #[msg("Only buyer can exercise the contract")]
    UnauthorizedExercise,
    #[msg("Contract must be exercised before settlement")]
    NotExercised,
    #[msg("No pending balance to settle")]
    NoPendingBalance,
    #[msg("Seller escrow has insufficient funds for settlement")]
    InsufficientSellerEscrow,
    #[msg("Calculation error: overflow or division by zero")]
    CalculationError,
    #[msg("Maximum number of contracts reached")]
    MaxContractsReached,
    #[msg("Asset ticker exceeds maximum length")]
    AssetTickerTooLong,
    #[msg("Deposit amount must be greater than zero")]
    InvalidDepositAmount,
}
