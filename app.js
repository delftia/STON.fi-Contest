const $ = (id) => document.getElementById(id);

const state = {
  walletAddress: "",
  walletMode: "none",
  tonConnectedAddress: "",
  recipients: [
    {
      id: crypto.randomUUID(),
      name: "Alice Builder",
      wallet: "UQDemoRecipientWalletAddressReplaceMe000001",
      amount: "25",
      token: "USDT",
      status: "idle",
      route: "Not quoted yet",
    },
    {
      id: crypto.randomUUID(),
      name: "Bob Designer",
      wallet: "UQDemoRecipientWalletAddressReplaceMe000002",
      amount: "10",
      token: "TON",
      status: "idle",
      route: "Not quoted yet",
    },
    {
      id: crypto.randomUUID(),
      name: "Kate Mentor",
      wallet: "UQDemoRecipientWalletAddressReplaceMe000003",
      amount: "50",
      token: "STON",
      status: "idle",
      route: "Not quoted yet",
    },
  ],
};

let tonConnectUI = null;
let dragDepth = 0;

function shortAddress(address) {
  if (!address) return "Not connected";
  if (address.length <= 18) return address;
  return `${address.slice(0, 8)}…${address.slice(-8)}`;
}

function toast(message, type = "") {
  const el = $("toast");
  el.textContent = message;
  el.className = `toast show ${type}`.trim();
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => {
    el.className = "toast";
  }, 4200);
}

function isDemoRecipient(wallet) {
  return String(wallet || "").startsWith("UQDemoRecipientWalletAddressReplaceMe");
}

function getTreasuryToken() {
  return $("treasuryToken").value;
}

function statusLabel(status) {
  const labels = {
    idle: "Waiting",
    quoting: "Quoting",
    quoted: "Quoted",
    building: "Building tx",
    paying: "Wallet review",
    paid: "Paid / submitted",
    error: "Error",
  };
  return labels[status] || status;
}

function renderWallet() {
  const label = $("walletLabel");
  const hint = $("walletHint");
  const demoBtn = $("demoWalletBtn");

  label.textContent = shortAddress(state.walletAddress);

  if (state.walletMode === "tonconnect") {
    hint.textContent = "Real wallet connected. Quotes and wallet-review transactions can be built through Omniston.";
    demoBtn.textContent = "Use demo wallet";
    demoBtn.dataset.demoActive = "false";
  } else if (state.walletMode === "demo") {
    hint.textContent = "Demo wallet is active. Click Exit demo wallet to return to the connected wallet or empty state.";
    demoBtn.textContent = "Exit demo wallet";
    demoBtn.dataset.demoActive = "true";
  } else {
    hint.textContent = "Connect Tonkeeper/Tonhub or use the demo wallet for a UI-only preview.";
    demoBtn.textContent = "Use demo wallet";
    demoBtn.dataset.demoActive = "false";
  }
}

function renderRecipients() {
  const tbody = $("recipientRows");
  tbody.innerHTML = "";

  state.recipients.forEach((r) => {
    const tr = document.createElement("tr");
    const quoted = r.status === "quoted" || r.status === "paid";
    const payingDisabled = !quoted || r.status === "paid" || r.status === "paying" || r.status === "building";
    const quoteDisabled = r.status === "quoting" || r.status === "paying" || r.status === "building";

    tr.innerHTML = `
      <td>
        <span class="recipient-name">${escapeHtml(r.name)}</span>
        <span class="recipient-wallet" title="${escapeHtml(r.wallet)}">${escapeHtml(r.wallet)}</span>
      </td>
      <td><strong>${escapeHtml(r.amount)} ${escapeHtml(r.token)}</strong></td>
      <td class="route-cell">${escapeHtml(r.route || "Not quoted yet")}${r.txHash ? `<br><small>${escapeHtml(r.txHash)}</small>` : ""}</td>
      <td><span class="status ${statusClass(r.status)}">${statusLabel(r.status)}</span></td>
      <td>
        <div class="row-actions">
          <button class="secondary" data-action="quote" data-id="${r.id}" ${quoteDisabled ? "disabled" : ""}>Quote</button>
          <button class="primary" data-action="pay" data-id="${r.id}" ${payingDisabled ? "disabled" : ""}>Pay</button>
          <button class="ghost" data-action="remove" data-id="${r.id}" aria-label="Remove recipient">×</button>
        </div>
      </td>
    `;
    tbody.appendChild(tr);
  });

  renderSummary();
}

function statusClass(status) {
  if (["quoting", "building", "paying"].includes(status)) return "working";
  if (status === "quoted") return "quoted";
  if (status === "paid") return "paid";
  if (status === "error") return "error";
  return "";
}

function renderSummary() {
  const quoted = state.recipients.filter((r) => r.status === "quoted" || r.status === "paid").length;
  const paid = state.recipients.filter((r) => r.status === "paid").length;
  const treasuryToken = getTreasuryToken();
  const total = state.recipients.reduce((sum, r) => {
    const value = Number.parseFloat(r.treasuryPays || "0");
    return Number.isFinite(value) ? sum + value : sum;
  }, 0);

  $("sumRecipients").textContent = String(state.recipients.length);
  $("sumQuoted").textContent = String(quoted);
  $("sumPaid").textContent = String(paid);
  $("sumTreasury").textContent = total > 0 ? `${trimNumber(total)} ${treasuryToken}` : "—";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function trimNumber(value) {
  return Number(value).toLocaleString("en-US", {
    maximumFractionDigits: 6,
  });
}

function shortRouteLabel(fromToken, toToken, treasuryPays, source = "") {
  const amount = treasuryPays ? `${trimNumber(treasuryPays)} ${fromToken}` : "quote ready";
  if (fromToken === toToken) return `${fromToken} direct · ${amount}`;
  const prefix = source === "demo-fallback" ? "Demo" : `${fromToken} → ${toToken}`;
  return `${prefix} · ${amount}`;
}

async function api(path, payload) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `API error: ${response.status}`);
  }
  return data;
}

async function quoteRecipient(id, allowDemoFallback = true) {
  const r = state.recipients.find((item) => item.id === id);
  if (!r) return;

  const treasuryToken = getTreasuryToken();
  r.status = "quoting";
  r.route = "Requesting real Omniston quote…";
  renderRecipients();

  try {
    const data = await api("/api/quote", {
      treasuryToken,
      receiveToken: r.token,
      receiveAmount: r.amount,
      maxPriceSlippageBps: 100,
    });

    r.status = "quoted";
    r.quote = data.quote;
    r.rfqId = data.rfqId;
    r.quoteSource = data.source;
    r.treasuryPays = data.display?.treasuryPays || "";
    r.route = shortRouteLabel(treasuryToken, r.token, data.display?.treasuryPays, data.source);
    toast(`Real quote received for ${r.name}`, "good");
  } catch (error) {
    if (!allowDemoFallback) {
      r.status = "error";
      r.route = error.message;
      toast(error.message, "error");
    } else {
      applyDemoQuote(r, treasuryToken, error.message);
    }
  }

  renderRecipients();
}

function applyDemoQuote(r, treasuryToken, reason) {
  const rates = {
    TON_USDT: 3.2,
    TON_STON: 0.065,
    USDT_TON: 0.31,
    USDT_STON: 0.02,
    STON_USDT: 48,
    STON_TON: 15.4,
  };
  const key = `${treasuryToken}_${r.token}`;
  const amount = Number.parseFloat(r.amount || "0");
  let treasuryPays = amount;
  if (treasuryToken !== r.token) {
    treasuryPays = amount * (rates[key] || 1.25);
  }

  r.status = "quoted";
  r.quoteSource = "demo-fallback";
  r.treasuryPays = String(Number(treasuryPays.toFixed(6)));
  r.quote = {
    quoteId: `demo-${crypto.randomUUID()}`,
    directTransfer: treasuryToken === r.token,
    demoFallback: true,
    bidUnits: "0",
    askUnits: "0",
  };
  r.route = shortRouteLabel(treasuryToken, r.token, r.treasuryPays, "demo-fallback");
  r.errorNote = reason;
  toast(`Demo fallback quote used for ${r.name}`, "error");
}

async function payRecipient(id) {
  const r = state.recipients.find((item) => item.id === id);
  if (!r) return;

  if (!state.walletAddress) {
    toast("Connect a TON wallet first, or use demo wallet for UI-only preview.", "error");
    return;
  }

  if (!r.quote) {
    await quoteRecipient(id);
  }

  if (state.walletMode !== "tonconnect" || r.quote?.demoFallback) {
    r.status = "paid";
    r.txHash = `demo_tx_${Date.now().toString(36)}`;
    r.route = `${r.route} · demo paid`;
    renderRecipients();
    toast("Demo payment marked as submitted. Connect a real wallet for final video.", "good");
    return;
  }

  if (isDemoRecipient(r.wallet)) {
    toast("Replace the demo recipient address with a real TON wallet before sending a real transaction.", "error");
    return;
  }

  r.status = "building";
  r.route = r.route || "Building wallet transaction…";
  renderRecipients();

  try {
    const build = await api("/api/build-transfer", {
      quote: r.quote,
      sourceAddress: state.walletAddress,
      destinationAddress: r.wallet,
      treasuryToken: getTreasuryToken(),
      receiveToken: r.token,
      receiveAmount: r.amount,
    });

    r.status = "paying";
    r.route = r.route || "Review in wallet";
    renderRecipients();

    const result = await tonConnectUI.sendTransaction(build.tonConnect);
    r.status = "paid";
    r.txHash = result?.boc ? "wallet_boc_returned" : "wallet_submitted";
    r.route = `${r.route} · submitted`;
    toast(`Transaction submitted for ${r.name}`, "good");
  } catch (error) {
    r.status = "error";
    r.route = error.message;
    toast(error.message, "error");
  }

  renderRecipients();
}

function removeRecipient(id) {
  state.recipients = state.recipients.filter((item) => item.id !== id);
  renderRecipients();
}

async function quoteAll() {
  for (const r of state.recipients) {
    if (r.status !== "quoted" && r.status !== "paid") {
      await quoteRecipient(r.id);
    }
  }
}

function addRecipient({ name, wallet, amount, token }) {
  const cleanName = String(name || "").trim();
  const cleanWallet = String(wallet || "").trim();
  const cleanAmount = String(amount || "").trim().replace(",", ".");
  const cleanToken = String(token || "USDT").trim().toUpperCase();

  if (!cleanName || !cleanWallet || !cleanAmount) {
    toast("Fill name, wallet and amount.", "error");
    return false;
  }

  if (!/^\d+(\.\d+)?$/.test(cleanAmount)) {
    toast("Amount must be a number.", "error");
    return false;
  }

  state.recipients.push({
    id: crypto.randomUUID(),
    name: cleanName,
    wallet: cleanWallet,
    amount: cleanAmount,
    token: cleanToken,
    status: "idle",
    route: "Not quoted yet",
  });
  renderRecipients();
  return true;
}

function normalizeRecipientRow(row) {
  const normalized = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    const cleanKey = String(key || "").trim().toLowerCase().replace(/[\s-]+/g, "_");
    normalized[cleanKey] = value;
  });

  return {
    name: normalized.name || normalized.recipient || normalized.recipient_name,
    wallet: normalized.wallet || normalized.address || normalized.ton_wallet || normalized.recipient_wallet,
    amount: normalized.amount || normalized.value || normalized.payout_amount,
    token: normalized.token || normalized.receive_token || normalized.asset || normalized.receive_asset || "USDT",
  };
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return [];

  const header = parseCsvLine(lines[0]).map((cell) => cell.trim().toLowerCase().replace(/[\s-]+/g, "_"));
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = Object.fromEntries(header.map((key, index) => [key, values[index] || ""]));
    return normalizeRecipientRow(row);
  });
}

async function parseImportFile(file) {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv") || name.endsWith(".txt")) {
    return parseCsv(await file.text());
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    if (!window.XLSX) {
      throw new Error("Excel parser is still loading. Try again in a few seconds.");
    }
    const buffer = await file.arrayBuffer();
    const workbook = window.XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows = window.XLSX.utils.sheet_to_json(sheet, { defval: "" });
    return rows.map(normalizeRecipientRow);
  }

  throw new Error("Unsupported file type. Use CSV, XLS or XLSX.");
}

async function importRecipientsFile(file) {
  if (!file) return;
  try {
    const rows = await parseImportFile(file);
    let count = 0;
    rows.forEach((row) => {
      if (addRecipient(row)) count += 1;
    });
    toast(`Imported ${count} recipients from ${file.name}`, "good");
  } catch (error) {
    toast(error.message, "error");
  }
}

function xmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildReceiptRows() {
  return [
    ["STONPayouts receipt"],
    [],
    ["Payout batch", "STON.fi Vibe Coding Rewards"],
    ["Treasury token", getTreasuryToken()],
    ["Generated at", new Date().toISOString()],
    ["Recipients", state.recipients.length],
    ["Quoted", state.recipients.filter((r) => r.status === "quoted" || r.status === "paid").length],
    ["Paid", state.recipients.filter((r) => r.status === "paid").length],
    [],
    ["Name", "Wallet", "Amount", "Receive token", "Status", "Treasury pays", "Route", "Transaction hash"],
    ...state.recipients.map((r) => [
      r.name,
      r.wallet,
      Number(r.amount) || r.amount,
      r.token,
      statusLabel(r.status),
      r.treasuryPays ? `${r.treasuryPays} ${getTreasuryToken()}` : "",
      r.route || "",
      r.txHash || "",
    ]),
  ];
}

function excelCell(value, style = "") {
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const type = isNumber ? "Number" : "String";
  const data = isNumber ? String(value) : xmlEscape(value);
  const styleAttr = style ? ` ss:StyleID="${style}"` : "";
  return `<Cell${styleAttr}><Data ss:Type="${type}">${data}</Data></Cell>`;
}

function exportExcel() {
  const rows = buildReceiptRows();
  const columnWidths = [190, 360, 90, 110, 130, 150, 250, 260];
  const columns = columnWidths.map((width) => `<Column ss:Width="${width}"/>`).join("");
  const xmlRows = rows.map((row, index) => {
    const style = index === 0 ? "Title" : index === 9 ? "Header" : "Body";
    const height = index === 0 ? 30 : index === 9 ? 24 : 22;
    const cells = row.map((cell) => excelCell(cell, style)).join("");
    return `<Row ss:Height="${height}">${cells}</Row>`;
  }).join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Title"><Font ss:Bold="1" ss:Size="16"/><Alignment ss:Vertical="Center"/></Style>
  <Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#F1EEE7" ss:Pattern="Solid"/><Alignment ss:Vertical="Center" ss:WrapText="1"/></Style>
  <Style ss:ID="Body"><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style>
 </Styles>
 <Worksheet ss:Name="Receipt">
  <Table>${columns}${xmlRows}</Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>10</SplitHorizontal>
   <TopRowBottomPane>10</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8" });
  downloadBlob(blob, "stonpayouts-receipt.xls");
  toast("Excel receipt downloaded with separated columns.", "good");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function resetQuotes() {
  state.recipients.forEach((r) => {
    if (r.status !== "paid") {
      r.status = "idle";
      r.route = "Not quoted yet";
      delete r.quote;
      delete r.treasuryPays;
      delete r.rfqId;
      delete r.quoteSource;
    }
  });
  renderRecipients();
}

async function setupTonConnect() {
  try {
    if (!window.TON_CONNECT_UI?.TonConnectUI) {
      throw new Error("TonConnect UI CDN was not loaded");
    }

    tonConnectUI = new window.TON_CONNECT_UI.TonConnectUI({
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
      buttonRootId: "ton-connect-button",
    });

    tonConnectUI.onStatusChange((wallet) => {
      if (wallet?.account?.address) {
        state.tonConnectedAddress = wallet.account.address;
        if (state.walletMode !== "demo") {
          state.walletAddress = wallet.account.address;
          state.walletMode = "tonconnect";
        }
      } else {
        state.tonConnectedAddress = "";
        if (state.walletMode !== "demo") {
          state.walletAddress = "";
          state.walletMode = "none";
        }
      }
      renderWallet();
    });

    const wallet = tonConnectUI.wallet;
    if (wallet?.account?.address) {
      state.tonConnectedAddress = wallet.account.address;
      state.walletAddress = wallet.account.address;
      state.walletMode = "tonconnect";
      renderWallet();
    }
  } catch (error) {
    $("ton-connect-button").innerHTML = "<span class='pill'>TonConnect unavailable</span>";
    toast(error.message, "error");
  }
}

function toggleDemoWallet() {
  if (state.walletMode === "demo") {
    if (state.tonConnectedAddress) {
      state.walletMode = "tonconnect";
      state.walletAddress = state.tonConnectedAddress;
      toast("Demo wallet disabled. Real connected wallet restored.", "good");
    } else {
      state.walletMode = "none";
      state.walletAddress = "";
      toast("Demo wallet disabled.", "good");
    }
  } else {
    state.walletMode = "demo";
    state.walletAddress = "UQDemoTreasuryWalletAddressReplaceWithRealWallet";
    toast("Demo wallet enabled. Click Exit demo wallet to return.");
  }
  renderWallet();
}

function bindEvents() {
  $("recipientForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const ok = addRecipient({
      name: $("recipientName").value,
      wallet: $("recipientWallet").value,
      amount: $("recipientAmount").value,
      token: $("recipientToken").value,
    });
    if (ok) event.currentTarget.reset();
  });

  $("recipientRows").addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const id = button.dataset.id;
    if (action === "quote") quoteRecipient(id);
    if (action === "pay") payRecipient(id);
    if (action === "remove") removeRecipient(id);
  });

  $("quoteAllBtn").addEventListener("click", quoteAll);
  $("exportCsvBtn").addEventListener("click", exportExcel);
  $("treasuryToken").addEventListener("change", resetQuotes);
  $("demoWalletBtn").addEventListener("click", toggleDemoWallet);

  $("csvInput").addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    await importRecipientsFile(file);
    event.target.value = "";
  });

  window.addEventListener("dragenter", (event) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    dragDepth += 1;
    document.body.classList.add("dragging-file");
  });

  window.addEventListener("dragover", (event) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  });

  window.addEventListener("dragleave", (event) => {
    if (!event.dataTransfer?.types?.includes("Files")) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) document.body.classList.remove("dragging-file");
  });

  window.addEventListener("drop", async (event) => {
    if (!event.dataTransfer?.files?.length) return;
    event.preventDefault();
    dragDepth = 0;
    document.body.classList.remove("dragging-file");
    await importRecipientsFile(event.dataTransfer.files[0]);
  });
}

bindEvents();
renderWallet();
renderRecipients();
setupTonConnect();
