const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

let tables = [
  { id: '1', tableNumber: '01', qrUrl: '', active: true },
  { id: '2', tableNumber: '02', qrUrl: '', active: true },
  { id: '3', tableNumber: '03', qrUrl: '', active: false },
]

const buildQrUrl = (tableNumber) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `https://foodify.app/order?table=${tableNumber}`,
  )}`

export const qrService = {
  async list() {
    await delay()
    return tables.map((t) => ({
      ...t,
      qrUrl: t.qrUrl || buildQrUrl(t.tableNumber),
    }))
  },
  async generate(tableNumber) {
    await delay()
    const existing = tables.find((t) => t.tableNumber === tableNumber)
    const qrUrl = buildQrUrl(tableNumber)
    if (existing) {
      tables = tables.map((t) =>
        t.tableNumber === tableNumber ? { ...t, qrUrl, active: true } : t,
      )
      return tables.find((t) => t.tableNumber === tableNumber)
    }
    const entry = {
      id: String(Date.now()),
      tableNumber,
      qrUrl,
      active: true,
    }
    tables = [...tables, entry]
    return entry
  },
  async regenerate(id) {
    await delay()
    tables = tables.map((t) =>
      t.id === id ? { ...t, qrUrl: buildQrUrl(t.tableNumber) } : t,
    )
    return tables.find((t) => t.id === id)
  },
  async remove(id) {
    await delay()
    tables = tables.filter((t) => t.id !== id)
  },
}
