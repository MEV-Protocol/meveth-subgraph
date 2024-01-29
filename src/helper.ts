import { Address, BigDecimal, BigInt } from "@graphprotocol/graph-ts";
import { Transfer } from "../generated/MevEth/MevEth";

export function toDecimal(value: BigInt, decimals: u32): BigDecimal {
  let precision = BigInt.fromI32(10)
    .pow(<u8>decimals)
    .toBigDecimal();

  return value.divDecimal(precision);
}

export function isMint(event: Transfer): boolean {
  return event.params.from == Address.zero();
}

export function isBurn(event: Transfer): boolean {
  return event.params.to == Address.zero();
}
