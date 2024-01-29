import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { Account, AccountBalance, Token } from "../generated/schema";

export function getOrCreateAccount(accountAddress: Address): Account {
  let accountId = accountAddress.toHexString();
  let existingAccount = Account.load(accountId);

  if (existingAccount) {
    return existingAccount as Account;
  }

  let newAccount = new Account(accountId);
  newAccount.address = accountAddress;

  return newAccount;
}

function getOrCreateAccountBalance(account: Account, token: Token): AccountBalance {
  let balanceId = account.id + "-" + token.id;
  let previousBalance = AccountBalance.load(balanceId);

  if (previousBalance) {
    return previousBalance as AccountBalance;
  }

  let newBalance = new AccountBalance(balanceId);
  newBalance.account = account.id;
  newBalance.token = token.id;
  newBalance.amount = BigDecimal.zero();

  return newBalance;
}

export function increaseAccountBalance(account: Account, token: Token, amount: BigDecimal): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token);
  balance.amount = balance.amount.plus(amount);

  return balance;
}

export function decreaseAccountBalance(account: Account, token: Token, amount: BigDecimal): AccountBalance {
  let balance = getOrCreateAccountBalance(account, token);
  balance.amount = balance.amount.minus(amount);

  return balance;
}
