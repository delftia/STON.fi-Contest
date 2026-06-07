import { Omniston } from "@ston-fi/omniston-sdk";

if (!globalThis.__STONPAYOUTS_OMNISTON_ERROR_GUARD__) {
  globalThis.__STONPAYOUTS_OMNISTON_ERROR_GUARD__ = true;
  process.on("uncaughtException", (error) => {
    const msg = error?.message || String(error);
    if (msg.includes("omni-ws") || msg.includes("WebSocket") || msg.includes("getaddrinfo")) {
      console.error("[Omniston transport error]", msg);
      return;
    }
    throw error;
  });
  process.on("unhandledRejection", (error) => {
    console.error("[Unhandled rejection]", error?.message || error);
  });
}

let omniston;

export function getOmniston() {
  if (!omniston) {
    omniston = new Omniston({
      apiUrl: process.env.OMNISTON_API_URL || "wss://omni-ws.ston.fi",
    });
  }
  return omniston;
}

export function waitForFirstQuote(observable, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    let subscription;
    const timer = setTimeout(() => {
      try { subscription?.unsubscribe?.(); } catch {}
      reject(new Error("Omniston quote timeout. Try a larger amount or another token pair."));
    }, timeoutMs);

    subscription = observable.subscribe({
      next(event) {
        const eventType = event?.type || event?.$case;
        const quote = event?.quote || event?.value;
        const rfqId = event?.rfqId || event?.value?.rfqId;

        if (eventType === "quoteUpdated" && quote) {
          clearTimeout(timer);
          try { subscription?.unsubscribe?.(); } catch {}
          resolve({ rfqId, quote });
        }

        if (eventType === "noQuote") {
          clearTimeout(timer);
          try { subscription?.unsubscribe?.(); } catch {}
          reject(new Error("Omniston returned no quote for this pair/amount."));
        }
      },
      error(err) {
        clearTimeout(timer);
        try { subscription?.unsubscribe?.(); } catch {}
        reject(err);
      },
    });
  });
}

export function waitForTradeStatus(observable, timeoutMs = 12000) {
  return new Promise((resolve, reject) => {
    let subscription;
    const timer = setTimeout(() => {
      try { subscription?.unsubscribe?.(); } catch {}
      reject(new Error("Omniston trade tracking timeout."));
    }, timeoutMs);

    subscription = observable.subscribe({
      next(status) {
        clearTimeout(timer);
        try { subscription?.unsubscribe?.(); } catch {}
        resolve(status);
      },
      error(err) {
        clearTimeout(timer);
        try { subscription?.unsubscribe?.(); } catch {}
        reject(err);
      },
    });
  });
}

export function toTonAddress(address) {
  return {
    chain: {
      $case: "ton",
      value: String(address || "").trim(),
    },
  };
}

function bufferToBase64(value) {
  return Buffer.from(value).toString("base64");
}

function looksLikeBase64(value) {
  const text = String(value || "").trim();
  return text.length > 0 && text.length % 4 === 0 && /^[A-Za-z0-9+/]+={0,2}$/.test(text);
}

function maybeHexToBase64(value) {
  const text = String(value || "").trim().replace(/^0x/i, "");
  if (text.length >= 2 && text.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(text)) {
    return Buffer.from(text, "hex").toString("base64");
  }
  return null;
}

export function normalizeTonPayload(payload) {
  if (!payload) return undefined;

  if (typeof payload?.toBoc === "function") {
    return bufferToBase64(payload.toBoc());
  }

  if (typeof payload === "string") {
    const text = payload.trim();
    if (!text) return undefined;
    if (looksLikeBase64(text)) return text;
    const hex = maybeHexToBase64(text);
    if (hex) return hex;
    const commaBytes = text.split(",").map((part) => Number(part.trim()));
    if (commaBytes.length > 1 && commaBytes.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
      return bufferToBase64(Uint8Array.from(commaBytes));
    }
    return undefined;
  }

  if (payload instanceof Uint8Array) return bufferToBase64(payload);
  if (payload instanceof ArrayBuffer) return bufferToBase64(new Uint8Array(payload));
  if (ArrayBuffer.isView(payload)) return bufferToBase64(new Uint8Array(payload.buffer));
  if (Array.isArray(payload)) return bufferToBase64(Uint8Array.from(payload));

  if (typeof payload === "object") {
    const candidates = [
      payload.boc,
      payload.bytes,
      payload.data,
      payload.cell,
      payload.payload,
      payload.value,
      payload.$case && payload.value,
    ];
    for (const candidate of candidates) {
      const normalized = normalizeTonPayload(candidate);
      if (normalized) return normalized;
    }
  }

  return undefined;
}

export function toTonConnectMessage(message) {
  const address = message.targetAddress || message.address || message.to;
  const amount = message.sendAmount || message.amount || message.value;
  const payload = normalizeTonPayload(message.payload);
  const stateInit = normalizeTonPayload(message.jettonWalletStateInit || message.stateInit);

  const result = {
    address: String(address || ""),
    amount: String(amount || "0"),
  };
  if (payload) result.payload = payload;
  if (stateInit) result.stateInit = stateInit;
  return result;
}
