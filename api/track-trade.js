import { allowCors, publicError, requirePost, sendJson } from "./_http.js";
import { getOmniston, toTonAddress, waitForTradeStatus } from "./_omniston.js";

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (!requirePost(req, res)) return;

  try {
    const body = req.body || {};
    if (!body.quoteId) throw new Error("quoteId is required");
    if (!body.traderWalletAddress) throw new Error("traderWalletAddress is required");
    if (!body.outgoingTxHash && !body.outgoingTxQuery) throw new Error("outgoingTxHash/outgoingTxQuery is required");

    const observable = getOmniston().swapTrack({
      quoteId: body.quoteId,
      traderAddress: toTonAddress(body.traderWalletAddress),
      outgoingTxQuery: body.outgoingTxQuery || body.outgoingTxHash,
    });

    const status = await waitForTradeStatus(observable);
    sendJson(res, 200, {
      ok: true,
      source: "omniston-v1beta8",
      status,
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      source: "omniston-v1beta8",
      error: publicError(error),
    });
  }
}
