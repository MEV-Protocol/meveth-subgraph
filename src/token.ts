import { Address, BigDecimal } from "@graphprotocol/graph-ts";
import { ERC20 } from "../generated/yETH/ERC20";
import { Token } from "../generated/schema";
import { toDecimal } from "./helper";

export function getOrCreateToken(tokenAddress: Address): Token {
  let token = Token.load(tokenAddress.toHexString());
  if (token) {
    return token as Token;
  }

  token = new Token(tokenAddress.toHexString());
  let tokenContract = ERC20.bind(tokenAddress);
  let symbol = tokenContract.try_symbol();
  token.symbol = symbol.reverted ? "unknown" : symbol.value;
  let decimals = tokenContract.try_decimals();
  token.decimals = decimals.reverted ? 18 : decimals.value;
  let totalSupply = tokenContract.try_totalSupply();
  if (!totalSupply.reverted) {
    token.totalSupply = toDecimal(totalSupply.value, token.decimals);
  } else {
    token.totalSupply = BigDecimal.zero();
  }
  return token;
}
