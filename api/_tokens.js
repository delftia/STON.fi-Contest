export const TOKENS = {
  TON: {
    symbol: "TON",
    name: "Toncoin",
    decimals: 9,
    address: "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
    blockchain: "TON",
    isNative: true,
  },
  USDT: {
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    // Official STON.fi docs use this USDT address in Omniston examples.
    address: "EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs",
    blockchain: "TON",
  },
  STON: {
    symbol: "STON",
    name: "STON",
    decimals: 9,
    // Official STON.fi docs use this STON address in Omniston examples.
    address: "EQA2kCVNwVsil2EM2mB0SkXytxCqQjS4mttjDpnXmwG9T6bO",
    blockchain: "TON",
  },
};

export function getToken(symbol) {
  const key = String(symbol || "").toUpperCase();
  const token = TOKENS[key];
  if (!token) {
    const supported = Object.keys(TOKENS).join(", ");
    throw new Error(`Unsupported token "${symbol}". Supported: ${supported}`);
  }
  return token;
}

export function toUnits(amount, decimals) {
  const value = String(amount ?? "0").trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  const [whole, fraction = ""] = value.split(".");
  const padded = (fraction + "0".repeat(decimals)).slice(0, decimals);
  return `${BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt(padded || "0")}`;
}

export function fromUnits(units, decimals, precision = 6) {
  const raw = BigInt(String(units || "0"));
  const base = 10n ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;
  if (fraction === 0n) return whole.toString();

  const fractionText = fraction.toString().padStart(decimals, "0").slice(0, precision).replace(/0+$/, "");
  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

export function assetId(symbol) {
  const token = getToken(symbol);
  return {
    chain: {
      $case: "ton",
      value: {
        kind: token.isNative
          ? { $case: "native", value: {} }
          : { $case: "jetton", value: token.address },
      },
    },
  };
}

export function legacyAddress(symbol) {
  const token = getToken(symbol);
  return {
    blockchain: "TON",
    address: token.address,
  };
}
