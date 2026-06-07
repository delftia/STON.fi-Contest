# STONPayouts

**Any-token mass payouts for TON teams, hackathons, DAOs and bounty programs — powered by STON.fi Omniston.**

STONPayouts helps TON ecosystem teams distribute rewards to many contributors from one treasury token, while each recipient can receive the asset they prefer.

Example:

```text
Treasury spends: TON

Recipients receive:
- Alice → USDT
- Bob → TON
- Kate → STON
```

STON.fi Omniston is used as the routing layer between the treasury token and each recipient’s target token.

---

## Links

**Live app:** https://stonpayouts.vercel.app/  
**Video demo:** https://drive.google.com/file/d/1ZZIuTPnCMZzDAFv0qjkkXhpvJTHgSQ5p/view?usp=sharing  
**Repository:** https://github.com/delftia/STON.fi-Contest

---

## Problem

TON teams, hackathons, DAOs and bounty programs often need to pay multiple contributors.

In practice, this is painful:

- the treasury may hold only one token, for example TON;
- different recipients may want different assets, such as USDT, TON or STON;
- manually swapping and sending every payment one by one is slow;
- payout records are hard to manage and share;
- mistakes in wallet addresses, amounts or assets are easy to make.

STONPayouts solves this by turning STON.fi Omniston into payout infrastructure.

---

## Solution

STONPayouts provides a simple payout workflow:

```text
Create payout list
→ Import recipients from Excel / CSV
→ Connect TON wallet
→ Quote each payout through STON.fi Omniston
→ Review payment in wallet
→ Track payout status
→ Export payout receipt
```

The sender can spend one treasury token, while each recipient receives their requested token.

---

## Key Features

### Treasury token setup

The payout organizer chooses the token held by the treasury wallet.

Example:

```text
Treasury token: TON
```

This token is used as the source asset for payout routing.

---

### Multi-recipient payout list

Recipients can be added manually or imported from Excel / CSV.

Supported recipient fields:

```text
Name
Wallet
Amount
Receive Token
```

Example:

```text
Alice Builder | UQ... | 25 | USDT
Bob Designer  | UQ... | 10 | TON
Kate Mentor   | UQ... | 50 | STON
```

---

### Excel / CSV import

STONPayouts supports drag-and-drop import.

Users can drop an `.xlsx`, `.xls` or `.csv` file anywhere on the page, and the app will load the payout list automatically.

---

### TON wallet connection

The app supports TON wallet connection through TonConnect.

The connected wallet acts as the treasury wallet that reviews and confirms payout transactions.

---

### STON.fi Omniston quote flow

For each recipient, STONPayouts requests a route from the treasury token to the recipient’s desired token.

Example:

```text
TON → USDT
TON → STON
TON → TON
```

This makes STON.fi Omniston the core routing layer of the product.

---

### Payment review

After a payout is quoted, the organizer can review the transaction in their TON wallet.

The goal is to make mass payouts safer and more structured than manual swaps and transfers.

---

### Payout receipt export

After quoting or executing payouts, the organizer can export a readable Excel receipt.

The exported file includes:

```text
Recipient name
Wallet address
Amount
Receive token
Route
Status
Transaction hash
```

---

## Hackathon Requirements Coverage

| Requirement | How STONPayouts covers it |
|---|---|
| Functional working app | The app has a working UI, recipient import, payout quote flow, wallet connection, payout status UI and receipt export. |
| TON integration | The app connects a TON wallet through TonConnect and uses TON wallet addresses for payout routing. |
| STON.fi integration | STONPayouts uses STON.fi Omniston as the routing layer for converting one treasury token into recipient-preferred assets. |
| Omniston SDK v1beta8 track | The backend API is structured around STON.fi Omniston SDK integration for quote, transaction building and tracking flows. |
| Clear use case | Mass payouts for TON teams, DAOs, hackathons, bounty programs and ecosystem rewards. |
| Video presentation | The demo flow shows import, wallet connect, Omniston quote, payment review and receipt export. |
| GitHub repository | The project is public and includes source code, README and deployment instructions. |
| Live production URL | The app is deployed to Vercel as a static frontend with serverless API functions. |

---

## Why STON.fi Omniston Is Core

STONPayouts is not a regular swap interface.

The main product value is:

```text
One treasury token → many recipient-preferred tokens
```

Without STON.fi Omniston, the organizer would have to manually swap and send every payout separately.

With Omniston, each payout can be routed from the treasury asset to the recipient’s target asset.

---

## Tech Stack

```text
Frontend: HTML, CSS, JavaScript
Backend: Vercel Serverless Functions / Node.js
TON wallet: TonConnect
Routing: STON.fi Omniston SDK
Deployment: Vercel
Import/export: Excel / CSV support
```

The project intentionally avoids a heavy frontend framework to keep the hackathon MVP simple, fast and easy to deploy.

---

## Local Development

Install dependencies:

```bash
pnpm install
```

Run locally:

```bash
pnpm run dev
```

Open:

```text
http://localhost:3000
```

Check API:

```text
http://localhost:3000/api/assets
```

---

## Environment Variables

Create `.env` locally:

```env
OMNISTON_API_URL=wss://omni-ws.ston.fi
ALLOW_DEMO_FALLBACK=true
PORT=3000
```

For production, use:

```env
OMNISTON_API_URL=wss://omni-ws.ston.fi
ALLOW_DEMO_FALLBACK=false
```

`ALLOW_DEMO_FALLBACK=true` can be used during testing to keep the UI available if an external API request fails.

For the final hackathon demo, the recommended mode is:

```env
ALLOW_DEMO_FALLBACK=false
```

---

## Vercel Deployment

This project is designed to work on Vercel without a build step.

Recommended Vercel settings:

```text
Framework Preset: Other
Install Command: npx --yes pnpm@10.17.1 install --no-frozen-lockfile --ignore-scripts
Build Command: echo "No build step"
Output Directory: .
```

Required environment variables:

```env
OMNISTON_API_URL=wss://omni-ws.ston.fi
ALLOW_DEMO_FALLBACK=true
```

After deployment, update `tonconnect-manifest.json` with the production URL:

```json
{
  "url": "https://stonpayouts.vercel.app",
  "name": "STONPayouts",
  "iconUrl": "https://stonpayouts.vercel.app/icon.svg"
}
```

The manifest should be available at:

```text
https://stonpayouts.vercel.app/tonconnect-manifest.json
```

---

## Demo Flow

Recommended demo steps:

```text
1. Open the live app.
2. Import the demo Excel payout file.
3. Select TON as the treasury token.
4. Connect TON wallet.
5. Quote a recipient payout through STON.fi Omniston.
6. Review the payment in wallet.
7. Show payout status.
8. Export the payout receipt.
```

Recommended demo scenario:

```text
STON.fi Vibe Coding Rewards

Treasury spends:
TON

Recipients receive:
- Demo Winner → USDT
- Design Contributor → TON
- Community Helper → STON
```

---

## Example Use Cases

STONPayouts can be used for:

- hackathon reward distribution;
- ecosystem grants;
- DAO contributor payments;
- bounty payouts;
- community reward programs;
- team payroll experiments;
- mentor and ambassador rewards.

---

## Status

STONPayouts was built as a weekend MVP for the STON.fi Vibe Coding Hackathon Cohort 2.

The current version focuses on one clear use case:

```text
Mass payouts from one TON treasury token into multiple recipient-preferred assets.
```

Future improvements may include:

- batch execution;
- payout templates;
- recipient claim links;
- team accounts;
- Telegram Mini App version;
- public payout pages;
- deeper transaction status tracking.

---

## Submission Summary

**Project name:** STONPayouts

**One-liner:**  
Any-token mass payouts for TON teams, hackathons, DAOs and bounty programs, powered by STON.fi Omniston.

**Core integration:**  
STON.fi Omniston is used to route payouts from one treasury token into different recipient-preferred assets.

**Target users:**  
TON teams, hackathon organizers, DAOs, bounty programs and ecosystem communities.

**Main value:**  
STONPayouts reduces manual swaps, payout errors and operational friction when distributing rewards to many contributors.

---

## License

MIT License

Copyright (c) 2026 delftia

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
