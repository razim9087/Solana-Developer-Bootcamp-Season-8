//-------------------------------------------------------------------------------
///
/// TASK: Implement the withdraw functionality for the on-chain vault
/// 
/// Requirements:
/// - Verify that the vault is not locked
/// - Verify that the vault has enough balance to withdraw
/// - Transfer lamports from vault to vault authority
/// - Emit a withdraw event after successful transfer
/// 
///-------------------------------------------------------------------------------

use anchor_lang::prelude::*;
use crate::state::Vault;
use crate::errors::VaultError;
use crate::events::WithdrawEvent;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    // TODO: Add required accounts and constraints
    #[account(mut)]
    pub vault_authority: Signer<'info>,
    #[account(mut,has_one=vault_authority)]
    pub vault: Account<'info,Vault>,
    pub system_program: Program<'info,System>,
}

pub fn _withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
    // TODO: Implement withdraw functionality
    let vault = &mut ctx.accounts.vault;
    let vault_authority = &mut ctx.accounts.vault_authority;
    require!(!vault.locked, VaultError::VaultLocked);
    let vault_lamports = vault.to_account_info().lamports();
    require!(vault_lamports >= amount, VaultError::InsufficientBalance);
    **vault.to_account_info().try_borrow_mut_lamports()? -= amount;
    **vault_authority.to_account_info().try_borrow_mut_lamports()? += amount;
    
    
    emit!(WithdrawEvent{
            amount: amount,
            vault_authority: ctx.accounts.vault_authority.key(),
            vault: ctx.accounts.vault.key()
    });
    Ok(())
}