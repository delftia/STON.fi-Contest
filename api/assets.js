import { allowCors, sendJson } from "./_http.js";
import { TOKENS } from "./_tokens.js";

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  sendJson(res, 200, {
    ok: true,
    mode: "static-token-list",
    note: "This MVP ships a curated TON/USDT/STON list for the payout demo. The Omniston quote/build-transfer calls are real.",
    tokens: Object.values(TOKENS),
  });
}
