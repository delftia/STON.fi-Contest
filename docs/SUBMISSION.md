# STON.fi Hackathon Submission

## Project name

STONPayouts

## One-liner

STONPayouts lets TON teams pay many contributors from one treasury token, while each recipient receives the asset they prefer through STON.fi Omniston routing.

## Problem

Hackathons, DAOs, bounty programs and Telegram-native teams frequently need to distribute rewards to many people. The treasury may hold TON, but recipients often want USDT, STON or another asset. Manual swaps and transfers are slow, error-prone and hard to audit.

## Solution

STONPayouts turns STON.fi Omniston into reward distribution infrastructure:

1. Organizer creates a payout run.
2. Recipients are added manually or by CSV.
3. The treasury token is selected.
4. Every payout is quoted through Omniston.
5. The organizer reviews and sends wallet transactions via TonConnect.
6. A receipt CSV is exported for transparency.

## STON.fi integration

The app uses the official `@ston-fi/omniston-sdk` server-side:

- `requestForQuote` for real RFQ quote streaming.
- `buildTransfer` to prepare TON wallet messages.
- `trackTrade` endpoint is included for follow-up status tracking.

## TON integration

The frontend uses TonConnect UI from CDN, plus a `tonconnect-manifest.json` at the public root. Real wallet transactions are reviewed and submitted through the connected wallet.

## Scope

This is intentionally not a full payroll SaaS. It is a focused MVP:

`payout run → recipients → Omniston quote → TonConnect review → receipt`

## Future extensions

- Recipient claim links.
- Telegram Mini App wrapper.
- Multi-signature treasury approvals.
- Public receipt page with tx hashes.
- Batch execution support if supported by wallet limits.

## Safety note

The MVP is designed for wallet-reviewable transactions, not blind automated transfers. Real payouts should be tested with tiny amounts first.
