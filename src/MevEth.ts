import { BigDecimal } from "@graphprotocol/graph-ts";
import { Rewards, Transfer } from "../generated/MevEth/MevEth";
import { MevEth, RewardEvent } from "../generated/schema";
import { getOrCreateAccount, increaseAccountBalance, decreaseAccountBalance } from "./account";
import { getOrCreateToken } from "./token";
import { toDecimal, isMint, isBurn } from "./helper";

export function handleRewards(event: Rewards): void {
  let mevEth = MevEth.load("1");
  let token = getOrCreateToken(event.address);
  let rewardAmountDecimal = toDecimal(event.params.amount, token.decimals);
  if (!mevEth) {
    mevEth = new MevEth("1");
    mevEth.token = token.id;
    mevEth.totalRewards = BigDecimal.zero();
    mevEth.save();
  }
  mevEth.totalRewards = mevEth.totalRewards.plus(rewardAmountDecimal);
  mevEth.save();

  let rewardEvent = new RewardEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  rewardEvent.blockNumber = event.block.number;
  rewardEvent.blockTime = event.block.timestamp;
  rewardEvent.amount = rewardAmountDecimal;
  rewardEvent.save();
}

export function handleTransfer(event: Transfer): void {
  let token = getOrCreateToken(event.address);
  let amountDecimal = toDecimal(event.params.amount, token.decimals);

  // update total supply
  if (isMint(event)) {
    token.totalSupply = token.totalSupply.plus(amountDecimal);
  } else if (isBurn(event)) {
    token.totalSupply = token.totalSupply.minus(amountDecimal);
  }

  // update account balance
  if (!isMint(event)) {
    let fromAccount = getOrCreateAccount(event.params.from);
    let fromAccountBalance = decreaseAccountBalance(fromAccount, token, amountDecimal);
    fromAccount.save();
    fromAccountBalance.save();
  }
  if (!isBurn(event)) {
    let toAccount = getOrCreateAccount(event.params.to);
    let toAccountBalance = increaseAccountBalance(toAccount, token, amountDecimal);
    toAccount.save();
    toAccountBalance.save();
  }
  token.save();
}
