//-------------------------------------------------------------------------------
///
/// TASK: Implement the add reaction functionality for the Twitter program
/// 
/// Requirements:
/// - Initialize a new reaction account with proper PDA seeds
/// - Increment the appropriate counter (likes or dislikes) on the tweet
/// - Set reaction fields: type, author, parent tweet, and bump
/// - Handle both Like and Dislike reaction types
/// 
///-------------------------------------------------------------------------------
use anchor_lang::prelude::*;

use crate::errors::TwitterError;
use crate::instruction::LikeTweet;
use crate::{accounts, states::*};

pub fn add_reaction(ctx: Context<AddReactionContext>, reaction: ReactionType) -> Result<()> {
    // TODO: Implement add reaction functionality
    let tweet_reaction1=&mut ctx.accounts.tweet_reaction;
    tweet_reaction1.parent_tweet=ctx.accounts.tweet.key();
    tweet_reaction1.reaction_author=ctx.accounts.reaction_author.key();
    tweet_reaction1.reaction=reaction;
    tweet_reaction1.bump=ctx.bumps.tweet_reaction;

    match tweet_reaction1.reaction {
        ReactionType::Like=> ctx.accounts.tweet.likes+=1,
        ReactionType::Dislike=>ctx.accounts.tweet.dislikes+=1
    }

    Ok(())
}

#[derive(Accounts)]
pub struct AddReactionContext<'info> {
    // TODO: Add required account constraints
    #[account(mut)]
    pub reaction_author: Signer<'info>,
    #[account(
        init,
        payer=reaction_author,
        space = 8 + Reaction::INIT_SPACE,
        seeds=[TWEET_REACTION_SEED.as_bytes(), reaction_author.key().as_ref(), tweet.key().as_ref()],
        bump,
    )]
    pub tweet_reaction: Account<'info, Reaction>,
    #[account(mut)]
    pub tweet: Account<'info, Tweet>,
    pub system_program: Program<'info, System>,
}
