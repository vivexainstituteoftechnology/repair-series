/**
 * Local booking charge helpers for Admin (same rules as Website / User App).
 * No API — used for display / estimates only; stored booking fields remain source of truth.
 */
export function convenienceRateForItemCount(itemCount) {
  const n = Math.max(0, Math.floor(Number(itemCount) || 0))
  if (n <= 0) return 0
  if (n === 1) return 10
  if (n === 2) return 7
  return 5
}

function toPaise(rupees) {
  const n = Number(rupees)
  if (!Number.isFinite(n) || n <= 0) return 0
  return Math.round(n * 100)
}

function toRupees(paise) {
  const p = Number(paise)
  if (!Number.isFinite(p) || p <= 0) return 0
  return Math.round(p) / 100
}

function percentOfPaise(paise, percent) {
  const p = Math.max(0, Math.round(Number(paise) || 0))
  const pct = Math.min(100, Math.max(0, Number(percent) || 0))
  if (p === 0 || pct === 0) return 0
  return Math.round((p * pct) / 100)
}

/**
 * @param {Array<{ categoryId?: string, categoryName?: string, price?: number, unitPrice?: number, quantity?: number }>} items
 */
export function calculateBookingCharges(items) {
  const rows = (Array.isArray(items) ? items : []).map((item, index) => {
    const q = Number(item?.quantity)
    const quantity = !Number.isFinite(q) || q <= 0 ? 0 : Math.min(99, Math.round(q))
    const unitPaise = toPaise(item?.unitPrice ?? item?.price)
    const categoryId = String(item?.categoryId || '').trim() || 'uncategorized'
    return {
      index,
      categoryId,
      categoryName: String(item?.categoryName || '').trim(),
      quantity,
      subtotalPaise: unitPaise * quantity,
    }
  })

  const order = []
  const groups = new Map()
  const names = new Map()
  for (const row of rows) {
    if (row.quantity <= 0) continue
    if (!groups.has(row.categoryId)) {
      groups.set(row.categoryId, [])
      order.push(row.categoryId)
    }
    groups.get(row.categoryId).push(row)
    if (row.categoryName && !names.has(row.categoryId)) names.set(row.categoryId, row.categoryName)
  }

  const categoryBreakdown = []
  let feeTotalPaise = 0
  for (const categoryId of order) {
    const group = groups.get(categoryId)
    const itemCount = group.reduce((s, r) => s + r.quantity, 0)
    const subtotalPaise = group.reduce((s, r) => s + r.subtotalPaise, 0)
    const rate = convenienceRateForItemCount(itemCount)
    const feePaise = percentOfPaise(subtotalPaise, rate)
    feeTotalPaise += feePaise
    categoryBreakdown.push({
      categoryId,
      categoryName: names.get(categoryId) || '',
      itemCount,
      subtotal: toRupees(subtotalPaise),
      convenienceRate: rate,
      convenienceFee: toRupees(feePaise),
    })
  }

  const servicePaise = rows.reduce((s, r) => s + (r.quantity > 0 ? r.subtotalPaise : 0), 0)
  const visitingPaise = servicePaise > 0 && servicePaise < 10000 ? 9900 : 0
  const serviceSubtotal = toRupees(servicePaise)
  const convenienceFee = toRupees(feeTotalPaise)
  const visitingCharge = toRupees(visitingPaise)

  return {
    serviceSubtotal,
    convenienceFee,
    visitingCharge,
    gst: 0,
    customerTotal: toRupees(servicePaise + feeTotalPaise + visitingPaise),
    categoryBreakdown,
  }
}

/** Partner commission is only on service amount. */
export function calculatePartnerPayout(serviceAmount, commissionPercent) {
  const servicePaise = toPaise(serviceAmount)
  const commissionPaise = percentOfPaise(servicePaise, Number(commissionPercent) || 0)
  return {
    partnerCommission: toRupees(commissionPaise),
    partnerPayout: toRupees(servicePaise - commissionPaise),
    gst: 0,
  }
}
