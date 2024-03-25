import { Address, BigDecimal, Bytes } from "@graphprotocol/graph-ts";
import { RewardPool, Staked, Withdrawn } from "../generated/AuraPool/RewardPool";
import { ERC20 } from "../generated/AuraPool/ERC20";
import { Token, TransferEvent } from "../generated/schema";
import { getOrCreateAccount, increaseAccountBalance, decreaseAccountBalance } from "./account";
import { toDecimal } from "./helper";

export function handleStaked(event: Staked): void {
  let token = getOrCreatePoolToken(event.address);
  let amountDecimal = toDecimal(event.params.amount, token.decimals);

  let transferEvent = new TransferEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  transferEvent.blockNumber = event.block.number;
  transferEvent.blockTime = event.block.timestamp;
  transferEvent.token = token.id;
  transferEvent.from = Bytes.empty();
  transferEvent.to = event.params.user;
  transferEvent.amount = amountDecimal;
  transferEvent.save();

  // update total supply
  token.totalSupply = token.totalSupply.plus(amountDecimal);

  // update account balance

  let toAccount = getOrCreateAccount(event.params.user);
  let toAccountBalance = increaseAccountBalance(toAccount, token, amountDecimal);
  if (toAccountBalance.amount == amountDecimal) {
    token.holdersCount = token.holdersCount + 1;
  }
  toAccount.save();
  toAccountBalance.save();
  token.save();
}

export function handleWithdrawn(event: Withdrawn): void {
  let token = getOrCreatePoolToken(event.address);
  let amountDecimal = toDecimal(event.params.amount, token.decimals);

  let transferEvent = new TransferEvent(event.transaction.hash.toHex() + "-" + event.logIndex.toString());
  transferEvent.blockNumber = event.block.number;
  transferEvent.blockTime = event.block.timestamp;
  transferEvent.token = token.id;
  transferEvent.from = event.params.user;
  transferEvent.to = Bytes.empty();
  transferEvent.amount = amountDecimal;
  transferEvent.save();

  // update total supply
  token.totalSupply = token.totalSupply.minus(amountDecimal);

  // update account balance
  let fromAccount = getOrCreateAccount(event.params.user);
  let fromAccountBalance = decreaseAccountBalance(fromAccount, token, amountDecimal);
  if (fromAccountBalance.amount == BigDecimal.zero()) {
    token.holdersCount = token.holdersCount - 1;
  }
  fromAccount.save();
  fromAccountBalance.save();
  token.save();
}

function getOrCreatePoolToken(poolAddress: Address): Token {
  let token = Token.load(poolAddress.toHexString());
  if (token) {
    return token as Token;
  }

  token = new Token(poolAddress.toHexString());
  let poolContract = RewardPool.bind(poolAddress);
  let stakingToken = poolContract.try_stakingToken();
  if (stakingToken.reverted) {
    token.symbol = "unknown";
    token.decimals = 18;
    token.totalSupply = BigDecimal.zero();
    return token as Token;
  }
  let stakingTokenContract = ERC20.bind(stakingToken.value);
  let symbol = stakingTokenContract.try_symbol();
  token.symbol = symbol.reverted ? "unknown" : symbol.value;
  let decimals = stakingTokenContract.try_decimals();
  token.decimals = decimals.reverted ? 18 : decimals.value;
  let totalSupply = stakingTokenContract.try_totalSupply();
  if (!totalSupply.reverted) {
    token.totalSupply = toDecimal(totalSupply.value, token.decimals);
  } else {
    token.totalSupply = BigDecimal.zero();
  }
  return token;
}
