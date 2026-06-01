export const buildQrPrintHtml = ({ restaurantName, logoUrl, tables }) => {
  const pages = tables
    .map(
      (table) => `
    <section class="page">
      ${logoUrl ? `<img class="logo" src="${logoUrl}" alt="" />` : ''}
      <h1 class="restaurant">${restaurantName}</h1>
      <h2 class="table-num">Table ${table.tableNumber}</h2>
      <p class="table-name">${table.tableName}</p>
      <img class="qr" src="${table.qrImageUrl}" alt="QR Table ${table.tableNumber}" width="280" height="280" />
      <p class="hint">Scan to order</p>
    </section>
  `,
    )
    .join('')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>QR Codes - ${restaurantName}</title>
  <style>
    @page { margin: 12mm; }
    body { margin: 0; font-family: system-ui, sans-serif; color: #111; }
    .page {
      page-break-after: always;
      min-height: 90vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .page:last-child { page-break-after: auto; }
    .logo { width: 72px; height: 72px; object-fit: cover; border-radius: 12px; margin-bottom: 12px; }
    .restaurant { font-size: 22px; margin: 0 0 8px; }
    .table-num { font-size: 18px; margin: 0 0 4px; }
    .table-name { color: #666; margin: 0 0 20px; font-size: 14px; }
    .qr { border: 1px solid #e5e5e5; border-radius: 12px; }
    .hint { margin-top: 16px; font-size: 12px; color: #888; }
  </style>
</head>
<body>${pages}</body>
</html>`
}

export const printAllQrCodes = ({ restaurantName, logoUrl, tables }) => {
  const w = window.open('', '_blank')
  if (!w) return false
  w.document.write(buildQrPrintHtml({ restaurantName, logoUrl, tables }))
  w.document.close()
  w.focus()
  w.print()
  return true
}
