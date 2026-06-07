import { allowCors, publicError, requirePost, sendJson } from "./_http.js";
import { assetId, fromUnits, getToken, legacyAddress, toUnits } from "./_tokens.js";
import { getOmniston, waitForFirstQuote } from "./_omniston.js";

export default async function handler(req, res) {
  if (allowCors(req, res)) return;
  if (!requirePost(req, res)) return;

  try {
    const body = req.body || {};
    const treasuryToken = getToken(body.treasuryToken || body.sourceToken || "TON");
    const receiveToken = getToken(body.receiveToken || body.targetToken || "USDT");
    const receiveAmount = body.receiveAmount || body.amount;

    if (!receiveAmount) {
      throw new Error("receiveAmount is required");
    }

    const outputUnits = toUnits(receiveAmount, receiveToken.decimals);

    if (treasuryToken.symbol === receiveToken.symbol) {
      const directQuote = {
        quoteId: `direct-${Date.now()}`,
        resolverName: "Direct TON transfer",
        inputUnits: outputUnits,
        outputUnits,
        bidUnits: outputUnits,
        askUnits: outputUnits,
        inputAsset: assetId(treasuryToken.symbol),
        outputAsset: assetId(receiveToken.symbol),
        bidAssetAddress: legacyAddress(treasuryToken.symbol),
        askAssetAddress: legacyAddress(receiveToken.symbol),
        directTransfer: true,
      };

      return sendJson(res, 200, {
        ok: true,
        source: "direct-transfer",
        rfqId: null,
        quote: directQuote,
        display: {
          treasuryPays: fromUnits(outputUnits, treasuryToken.decimals),
          recipientGets: fromUnits(outputUnits, receiveToken.decimals),
          treasuryToken: treasuryToken.symbol,
          receiveToken: receiveToken.symbol,
          resolverName: directQuote.resolverName,
          routeLabel: `${treasuryToken.symbol} direct transfer`,
        },
      });
    }

    const omniston = getOmniston();
    const observable = omniston.requestForQuote({
      inputAsset: assetId(treasuryToken.symbol),
      outputAsset: assetId(receiveToken.symbol),
      amount: {
        $case: "outputUnits",
        value: outputUnits,
      },
      settlementParams: [
        {
          params: {
            $case: "swap",
            value: {
              maxPriceSlippagePips: Number(body.maxPriceSlippagePips ?? 10000),
              maxRoutes: 4,
              flexibleIntegratorFee: true,
              allowRiskyRoutes: false,
            },
          },
        },
      ],
    });

    const { rfqId, quote } = await waitForFirstQuote(observable);
    const inputUnits = quote.inputUnits || quote.bidUnits;
    const receivedUnits = quote.outputUnits || quote.askUnits;

    sendJson(res, 200, {
      ok: true,
      source: "omniston-v1beta8",
      rfqId,
      quote,
      display: {
        treasuryPays: fromUnits(inputUnits, treasuryToken.decimals),
        recipientGets: fromUnits(receivedUnits, receiveToken.decimals),
        treasuryToken: treasuryToken.symbol,
        receiveToken: receiveToken.symbol,
        resolverName: quote.resolverName || "Omniston resolver",
        routeLabel: `${treasuryToken.symbol} → Omniston → ${receiveToken.symbol}`,
      },
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      source: "omniston-v1beta8",
      error: publicError(error),
      hint: "Check token pair, amount, OMNISTON_API_URL and network connectivity. You can enable demo fallback in UI only for local presentation safety.",
    });
  }
}
