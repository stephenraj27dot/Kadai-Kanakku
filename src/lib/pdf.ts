import { formatMoney } from "./i18n";
import type { Customer } from "./store";

export function generateCustomerStatementPdf(
  customer: Customer,
  balance: number,
  shopName: string,
  shopPhone: string,
  lang: "ta" | "en"
) {
  const ta = lang === "ta";
  const title = ta ? "பரிவர்த்தனை அறிக்கை" : "Transaction Statement";
  const balLabel = ta ? "மொத்த பாக்கி" : "Total Pending";
  const nameLabel = ta ? "பெயர்" : "Name";
  const phoneLabel = ta ? "தொலைபேசி" : "Phone";
  const dateLabel = ta ? "தேதி" : "Date";
  const descLabel = ta ? "விவரம்" : "Description";
  const debitLabel = ta ? "பாக்கி (+)" : "Debit (+)";
  const creditLabel = ta ? "வரவு (-)" : "Credit (-)";

  // Open a new window for printing
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to print statements.");
    return;
  }

  const sortedTxns = [...customer.txns].sort((a, b) => a.at - b.at); // chronological
  
  let rows = "";
  for (const tx of sortedTxns) {
    const isDebit = tx.type === "debit";
    const dateStr = new Date(tx.at).toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
    const desc = tx.note || (isDebit ? (ta ? "பாக்கி" : "Pending") : (ta ? "பணம் பெற்றது" : "Payment"));
    
    rows += `
      <tr>
        <td>${dateStr}</td>
        <td>${desc}</td>
        <td style="text-align: right;">${isDebit ? formatMoney(tx.amount) : ""}</td>
        <td style="text-align: right;">${!isDebit ? formatMoney(tx.amount) : ""}</td>
      </tr>
    `;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="${lang}">
    <head>
      <meta charset="UTF-8">
      <title>${customer.name} - Statement</title>
      <style>
        body { font-family: system-ui, sans-serif; color: #1f2937; padding: 20px; max-width: 800px; margin: 0 auto; }
        h1 { color: #16a34a; margin-bottom: 5px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }
        .shop-info { text-align: right; }
        .balance-box { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin-bottom: 30px; text-align: center; }
        .balance-val { font-size: 32px; font-weight: bold; color: ${balance > 0 ? '#ef4444' : '#16a34a'}; margin-top: 10px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th { background: #16a34a; color: white; text-align: left; padding: 12px; font-weight: 600; }
        td { padding: 10px 12px; border-bottom: 1px solid #e5e7eb; }
        tr:nth-child(even) { background: #f9fafb; }
        @media print {
          body { padding: 0; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1>${title}</h1>
          <p><strong>${nameLabel}:</strong> ${customer.name}</p>
          ${customer.phone ? `<p><strong>${phoneLabel}:</strong> ${customer.phone}</p>` : ''}
          ${customer.address ? `<p><strong>Address:</strong> ${customer.address}</p>` : ''}
        </div>
        <div class="shop-info">
          <h2>${shopName}</h2>
          <p>${shopPhone}</p>
        </div>
      </div>

      <div class="balance-box">
        <div>${balLabel}</div>
        <div class="balance-val">${formatMoney(balance > 0 ? balance : 0)}</div>
      </div>

      <table>
        <thead>
          <tr>
            <th>${dateLabel}</th>
            <th>${descLabel}</th>
            <th style="text-align: right;">${debitLabel}</th>
            <th style="text-align: right;">${creditLabel}</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <script>
        window.onload = function() {
          window.print();
          // Optional: close after print
          // setTimeout(() => window.close(), 500);
        }
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
