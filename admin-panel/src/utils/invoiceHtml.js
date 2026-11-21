/**
 * Renders a print-ready (A4) commercial invoice from a structured invoice document
 * plus company settings (settings/invoice). Used for Print / Save-as-PDF in
 * the browser — no server-side PDF generation.
 */

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inr(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return '₹0.00'
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function toDateLabel(value) {
  const date = value?.toDate?.() || (value ? new Date(value) : null)
  if (!date || Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function companyAddress(settings) {
  return [
    settings.addressLine1,
    settings.addressLine2,
    [settings.city, settings.state, settings.pincode].filter(Boolean).join(', '),
  ]
    .filter(Boolean)
    .join('<br/>')
}

function isTaxRow(title) {
  return /gst|cgst|sgst|igst|taxable|tax amount|total tax|\btax\b/i.test(String(title || ''))
}

function money(value) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 0) return 0
  return Math.round(n * 100) / 100
}

function paymentStatusLabel(status) {
  const key = String(status || '').trim().toLowerCase()
  if (key === 'paid') return 'Paid'
  if (key === 'pending') return 'Pending'
  if (key === 'free') return 'Free'
  return status || ''
}

export function renderInvoiceHtml(invoice = {}, settings = {}) {
  const rawLines = Array.isArray(invoice.lines) && invoice.lines.length
    ? invoice.lines
    : invoice.commercial?.lines?.map((line) => ({
        title: line.label,
        quantity: 1,
        rate: line.amount,
        amount: line.amount,
      })) || []

  const lines = rawLines.filter((line) => {
    const amount = money(line.amount ?? line.rate)
    return amount > 0 && !isTaxRow(line.title || line.label)
  })

  const displayLines = lines.length
    ? lines
    : [
        {
          title: invoice.serviceName || 'Service',
          quantity: 1,
          rate: invoice.subtotal ?? 0,
          amount: invoice.subtotal ?? 0,
        },
      ].filter((line) => money(line.amount) > 0 && !isTaxRow(line.title))

  const summed = displayLines.reduce((sum, line) => sum + money(line.amount ?? line.rate), 0)
  const grandTotal = money(invoice.commercial?.finalAmount ?? summed)
  const paymentStatus = paymentStatusLabel(invoice.paymentStatus)
  const rows = `${displayLines
    .map(
      (line) => `
        <tr>
          <td>${esc(line.title || line.label || 'Service')}</td>
          <td class="num">${inr(line.amount ?? line.rate ?? 0)}</td>
        </tr>`,
    )
    .join('')}
        <tr>
          <td><strong>Total Amount</strong></td>
          <td class="num"><strong>${inr(grandTotal)}</strong></td>
        </tr>`

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<title>Invoice ${esc(invoice.invoiceNumber || invoice.id || '')}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; background: #fff; padding: 24px; font-size: 12px; }
  .sheet { max-width: 800px; margin: 0 auto; }
  .head { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0f4c81; padding-bottom: 12px; }
  .brand h1 { font-size: 20px; color: #0f4c81; }
  .brand p { color: #555; margin-top: 4px; line-height: 1.45; }
  .meta { text-align: right; }
  .meta h2 { font-size: 18px; letter-spacing: 2px; color: #0f4c81; }
  .meta p { margin-top: 4px; color: #555; }
  .parties { display: flex; justify-content: space-between; gap: 24px; margin: 14px 0; }
  .party h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-bottom: 6px; }
  .party p { line-height: 1.55; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { background: #0f4c81; color: #fff; text-align: left; padding: 7px 10px; font-size: 12px; }
  td { padding: 7px 10px; border-bottom: 1px solid #e5e5e5; }
  .num { text-align: right; }
  .totals { margin-top: 10px; margin-left: auto; width: 280px; }
  .totals .row { display: flex; justify-content: space-between; padding: 4px 0; }
  .totals .grand { border-top: 2px solid #0f4c81; margin-top: 6px; padding-top: 8px; font-size: 15px; font-weight: 700; color: #0f4c81; }
  .words { margin-top: 8px; font-style: italic; color: #555; }
  .terms { margin-top: 16px; padding-top: 10px; border-top: 1px solid #e5e5e5; color: #777; font-size: 11px; line-height: 1.5; }
  .thanks { margin-top: 12px; text-align: center; color: #0f4c81; font-weight: 600; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 999px; background: #e8f5e9; color: #2e7d32; font-size: 11px; font-weight: 600; margin-top: 6px; }
  @media print {
    body { padding: 0; }
    .sheet { page-break-after: avoid; page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="sheet">
  <div class="head">
    <div class="brand">
      ${settings.logoUrl ? `<img src="${esc(settings.logoUrl)}" alt="logo" style="height:44px;margin-bottom:8px"/>` : ''}
      <h1>${esc(settings.companyName || 'Repair Series')}</h1>
      <p>
        ${companyAddress(settings)}
        ${settings.phone ? `<br/>Phone: ${esc(settings.phone)}` : ''}
        ${settings.email ? `<br/>Email: ${esc(settings.email)}` : ''}
      </p>
    </div>
    <div class="meta">
      <h2>INVOICE</h2>
      <p><strong>${esc(invoice.invoiceNumber || invoice.id || '')}</strong></p>
      <p>Date: ${esc(toDateLabel(invoice.paymentDate || invoice.createdAt) || invoice.invoiceDate || '—')}</p>
      <p>Booking: ${esc(invoice.bookingCode || invoice.bookingId || '—')}</p>
      ${invoice.paymentMethod ? `<p>Payment Method: ${esc(invoice.paymentMethod)}</p>` : ''}
      ${paymentStatus ? `<p>Payment Status: ${esc(paymentStatus)}</p>` : ''}
      ${String(invoice.paymentStatus || '').toLowerCase() === 'paid' ? '<span class="badge">Paid</span>' : ''}
      ${invoice.isRevisit ? '<span class="badge">FREE REVISIT</span>' : ''}
    </div>
  </div>

  <div class="parties">
    <div class="party">
      <h3>Billed To</h3>
      <p>
        <strong>${esc(invoice.customerName || 'Customer')}</strong><br/>
        ${esc(invoice.customerAddress || '')}<br/>
        ${invoice.customerPhone ? `Phone: ${esc(invoice.customerPhone)}<br/>` : ''}
        ${invoice.customerEmail ? `Email: ${esc(invoice.customerEmail)}` : ''}
      </p>
    </div>
    <div class="party" style="text-align:right">
      <h3>Order Details</h3>
      <p>
        ${invoice.serviceName ? `Service: ${esc(invoice.serviceName)}<br/>` : ''}
        ${invoice.technicianName ? `Technician: ${esc(invoice.technicianName)}<br/>` : ''}
      </p>
    </div>
  </div>

  <table>
    <thead>
      <tr><th>Particular</th><th class="num">Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  ${invoice.amountInWords ? `<p class="words">${esc(invoice.amountInWords)}</p>` : ''}
  ${settings.signatureUrl || invoice.signatureUrl ? `<p style="text-align:right;margin-top:16px"><img src="${esc(settings.signatureUrl || invoice.signatureUrl)}" alt="signature" style="height:48px;object-fit:contain"/></p>` : ''}

  <div class="terms">
    <strong>Terms &amp; Conditions</strong><br/>
    ${esc(settings.terms || 'This is a computer-generated invoice.')}
  </div>

  <p class="thanks">${esc(settings.thankYouMessage || 'Thank you for choosing Repair Series.')}</p>
</div>
</body>
</html>`
}
