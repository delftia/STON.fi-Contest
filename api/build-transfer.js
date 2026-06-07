import { allowCors, publicError, requirePost, sendJson } from "./_http.js";
import { getToken, toUnits } from "./_tokens.js";
import { getOmniston, toTonAddress, toTonConnectMessage } from "./_omniston.js";

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (!requirePost(req, res)) return;

  try {
    const body = req.body || {};
    const quote = body.quote;
    const sourceAddress = body.sourceAddress;
    const destinationAddress = body.destinationAddress;
    const quoteId = body.quoteId || quote?.quoteId;

    if (!sourceAddress) throw new Error("sourceAddress is required");
    if (!destinationAddress) throw new Error("destinationAddress is required");
    if (!quoteId) throw new Error("quoteId is required");

    if (quote?.directTransfer) {
      const token = getToken(body.receiveToken || body.treasuryToken || "TON");
      if (token.symbol !== "TON") {
        throw new Error("Direct transfer fallback is only implemented for native TON in this MVP. Use Omniston for token conversion.");
      }
      const amountNano = quote.inputUnits || quote.bidUnits || toUnits(body.receiveAmount || body.amount, token.decimals);
      return sendJson(res, 200, {
        ok: true,
        source: "direct-transfer",
        tx: {
          messages: [
            {
              targetAddress: destinationAddress,
              sendAmount: amountNano,
              payload: "",
            },
          ],
        },
        tonConnect: {
          validUntil: Math.floor(Date.now() / 1000) + 600,
          messages: [
            {
              address: destinationAddress,
              amount: String(amountNano),
            },
          ],
        },
      });
    }

    const omniston = getOmniston();
    const tx = await omniston.tonBuildSwap({
      quoteId,
      transferSrcAddress: toTonAddress(sourceAddress),
      traderDstAddress: toTonAddress(destinationAddress),
      gasExcessAddress: toTonAddress(sourceAddress),
      refundSrcAddress: toTonAddress(sourceAddress),
      useRecommendedSlippage: true,
    });

    const messages = tx?.messages || tx?.ton?.messages || [];
    const tonConnectMessages = messages.map(toTonConnectMessage).filter((msg) => msg.address && msg.amount);

    if (!tonConnectMessages.length) {
      throw new Error("Omniston tonBuildSwap did not return TON messages.");
    }

    sendJson(res, 200, {
      ok: true,
      source: "omniston-v1beta8",
      tx,
      tonConnect: {
        validUntil: Math.floor(Date.now() / 1000) + 600,
        messages: tonConnectMessages,
      },
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      source: "omniston-v1beta8",
      error: publicError(error),
    });
  }
}
