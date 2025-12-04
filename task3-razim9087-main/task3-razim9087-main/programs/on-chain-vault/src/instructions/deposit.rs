//-------------------------------------------------------------------------------
///
/// TASK: Implement the deposit functionality for the on-chain vault
/// 
/// Requirements:
/// - Verify that the user has enough balance to deposit
/// - Verify that the vault is not locked
/// - Transfer lamports from user to vault using CPI (Cross-Program Invocation)
/// - Emit a deposit event after successful transfer
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_lang::solana_program::program::invoke;
use anchor_lang::solana_program::system_instruction::transfer;
use crate::state::Vault;
use crate::errors::VaultError;
use crate::events::DepositEvent;

#[derive(Accounts)]
pub struct Deposit<'info> {
    // TODO: Add required accounts and constraints
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(mut, constraint = vault.locked==false @ VaultError::VaultLocked)]
    pub vault: Account<'info,Vault>,
    pub system_program: Program<'info, System>
}

pub fn _deposit(ctx: Context<Deposit>, amount: u64) -> Result<()> {
    // TODO: Implement deposit functionality
    let user_balance = ctx.accounts.user.lamports();
    let rent_minimum = Rent::get()?.minimum_balance(0);
    require!(
        user_balance.checked_sub(amount).unwrap_or(0) >= rent_minimum,
        VaultError::InsufficientBalance
    );
    system_program::transfer(
        CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.user.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            }
        ),
        amount
    ).map_err(|_| error!(VaultError::InsufficientBalance))?;
    emit!(DepositEvent{
            amount: amount,
            user: ctx.accounts.user.key(),
            vault: ctx.accounts.vault.key()
    });
    Ok(())
}
