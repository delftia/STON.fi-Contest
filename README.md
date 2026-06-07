# STONPayouts

**Any-token mass payouts for TON teams, hackathons and DAOs — powered by STON.fi Omniston.**

STONPayouts lets an organizer create a payout run, add recipients who want different payout assets, quote every payment through STON.fi Omniston, then prepare wallet-reviewable transactions through TonConnect.

## Why this fits the STON.fi Vibe Coding Hackathon

- Functional working app: static UI + Vercel/Node API bridge.
- TON integration: TonConnect wallet connection and wallet transaction review.
- STON.fi track: uses `@ston-fi/omniston-sdk` to request quotes and build transfer transactions against Omniston v1beta8 flow.
- Clear use case: hackathon, DAO, bounty and ecosystem reward distributions.
- Live URL: deploys directly to Vercel without Vite/build tooling.

## Architecture

```txt
index.html / styles.css / app.js      static frontend, no Vite
api/quote.js                          real Omniston RFQ quote
api/build-transfer.js                 real Omniston buildTransfer -> TonConnect messages
api/track-trade.js                    optional Omniston trade tracking endpoint
server.js                             local Node server for static + API testing
```

## Run locally without Vite

```bash
npm install
cp .env.example .env
npm run dev
```

Open:

```txt
http://localhost:3000
```

## Local demo buttons

- **Use demo wallet / Exit demo wallet**: toggle a UI-only wallet on and off. When a real TonConnect wallet is connected, exiting demo mode restores it.
- **Quote**: tries real `/api/quote` first. If Omniston is unavailable, the UI may use a clearly marked demo fallback.
- **Pay**: with a real TonConnect wallet and a real recipient address, it calls `/api/build-transfer` and opens wallet review.
- **Import file / drag-and-drop anywhere**: accepts `.csv`, `.xls`, and `.xlsx` recipient lists. Expected columns: `name`, `wallet`, `amount`, `token`.
- **Export Excel receipt**: downloads `stonpayouts-receipt.xlsx` with readable column widths, receipt metadata and recipient payout statuses.

For final submission video, show at least one real quote and wallet review, not only demo fallback.

## Deploy to Vercel

1. Push this folder to GitHub.
2. Import the repository in Vercel.
3. Framework preset: **Other**.
4. Build command: leave empty.
5. Output directory: leave empty / `.`.
6. Add environment variable:

```env
OMNISTON_API_URL=wss://omni-ws.ston.fi
ALLOW_DEMO_FALLBACK=true
```

7. Deploy.
8. After deploy, edit `tonconnect-manifest.json`:

```json
{
  "url": "https://YOUR-PROJECT.vercel.app",
  "name": "STONPayouts",
  "iconUrl": "https://YOUR-PROJECT.vercel.app/icon.svg"
}
```

Commit and redeploy.

## Demo script

1. Open the live URL.
2. Connect TON wallet.
3. Create payout run: `STON.fi Vibe Coding Rewards`.
4. Add a real recipient address for a small test payout.
5. Click **Quote**.
6. Show `TON → Omniston → USDT/STON` route.
7. Click **Pay**.
8. Review the transaction in wallet.
9. Export a readable Excel receipt.

## Important notes

The default recipients use placeholder addresses. Replace them with real TON addresses before attempting a real wallet transaction.

This MVP executes payouts one by one. That is intentional: it is simpler, safer and easier to demonstrate in a weekend-build hackathon.

## Financial risk warning

This project can generate real wallet transactions. Bugs, incorrect token addresses, incorrect recipient addresses, bad routing assumptions or misuse can cause partial or total irreversible loss of assets. Test only with tiny amounts first. You are responsible for validating the implementation before using it with real funds.
