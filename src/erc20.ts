import { BigDecimal } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/yETH/ERC20";
import { TransferEvent } from "../generated/schema";
import { getOrCreateAccount, increaseAccountBalance, decreaseAccountBalance } from "./account";
import { getOrCreateToken } from "./token";
import { toDecimal, isMint, isBurn } from "./helper";

export function handleTransfer(event: Transfer): void {
  let token = getOrCreateToken(event.address);
  let amountDecimal = toDecimal(event.params.amount, token.decimals);

  let transferEvent = new TransferEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  transferEvent.blockNumber = event.block.number;
  transferEvent.blockTime = event.block.timestamp;
  transferEvent.token = token.id;
  transferEvent.from = event.params.from;
  transferEvent.to = event.params.to;
  transferEvent.amount = amountDecimal;
  transferEvent.save();

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
    if (fromAccountBalance.amount == BigDecimal.zero()) {
      token.holdersCount = token.holdersCount - 1;
    }
    fromAccount.save();
    fromAccountBalance.save();
  }
  if (!isBurn(event)) {
    let toAccount = getOrCreateAccount(event.params.to);
    let toAccountBalance = increaseAccountBalance(toAccount, token, amountDecimal);
    if (toAccountBalance.amount == amountDecimal) {
      token.holdersCount = token.holdersCount + 1;
    }
    toAccount.save();
    toAccountBalance.save();
  }
  token.save();
}
