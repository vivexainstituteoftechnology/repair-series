import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Card, Field, Input, PageHeader } from '../components/ui'
import { DEFAULT_INVOICE_SETTINGS, normalizeInvoiceSettings } from '../constants/invoiceSettings'
import { useApp } from '../context/useApp'
import { isFirebaseConfigured } from '../firebase/config'
import { exportRows } from '../services/csv'
import { subscribeDoc } from '../services/firestore'
import { getStoredBookingTotalAmount } from '../utils/bookingStoredAmounts'
import { computeFinanceBreakdown } from '../utils/bookingFinance'
import { isBookingCompleted } from '../utils/helpers'

function toDate(value) {
  if (!value) return null
  if (typeof value?.toDate === 'function') {
    const d = value.toDate()
    return Number.isNaN(d.getTime()) ? null : d
  }
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

function bookingReportDate(booking) {
  return (
    toDate(booking.completedAt) ||
    toDate(booking.updatedAt) ||
    toDate(booking.createdAt) ||
    toDate(booking.scheduledAt) ||
    toDate(booking.dateTime)
  )
}

function startOfDay(isoDate) {
  if (!isoDate) return null
  const d = new Date(`${isoDate}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

function endOfDay(isoDate) {
  if (!isoDate) return null
  const d = new Date(`${isoDate}T23:59:59.999`)
  return Number.isNaN(d.getTime()) ? null : d
}

function money(n) {
  return Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function defaultRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 30)
  const pad = (n) => String(n).padStart(2, '0')
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  return { from: fmt(start), to: fmt(end) }
}

export function FinanceReportsPage() {
  const { bookings, loading, session } = useApp()
  const initial = defaultRange()
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [gstPercent, setGstPercent] = useState(DEFAULT_INVOICE_SETTINGS.gstPercent)

  useEffect(() => {
    if (!isFirebaseConfigured || !session?.id) return undefined
    const unsub = subscribeDoc(
      'settings',
      'invoice',
      (row) => {
        const normalized = normalizeInvoiceSettings(row || {})
        setGstPercent(normalized.gstPercent)
      },
      () => {
        /* keep default */
      },
    )
    return () => unsub?.()
  }, [session?.id])

  const report = useMemo(() => {
    const fromD = startOfDay(from)
    const toD = endOfDay(to)
    const rows = (bookings || []).filter((b) => {
      if (!isBookingCompleted(b)) return false
      const d = bookingReportDate(b)
      if (!d) return false
      if (fromD && d < fromD) return false
      if (toD && d > toD) return false
      return true
    })

    const rate = Number(gstPercent)
    const safeRate = Number.isFinite(rate) && rate >= 0 ? rate : 18
    const lineItems = rows.map((b) => {
      const amount = getStoredBookingTotalAmount(b)
      const d = bookingReportDate(b)
      const fin = computeFinanceBreakdown(b)
      const storedGst = Number(b.gstAmount)
      // New (v3) bookings carry no GST; legacy unstamped totals are treated as GST-inclusive.
      const gst =
        b.financeFormulaVersion === 'v3'
          ? 0
          : Number.isFinite(storedGst) && b.gstAmount !== '' && b.gstAmount != null
            ? storedGst
            : safeRate > 0
              ? amount - amount / (1 + safeRate / 100)
              : 0
      return {
        bookingId: b.id,
        serviceName: b.serviceName || '',
        customerId: b.customerId || '',
        status: b.status || '',
        completedAt: d ? d.toISOString() : '',
        serviceAmount: fin.servicePrice,
        convenienceFee: fin.customerConvenienceFee,
        visitingCharge: fin.visitingCharge,
        totalAmount: amount,
        partnerCommission: Number(b.platformFeeAmount) || fin.platformFeeAmount,
        partnerPayout: Number(b.technicianFinalEarning) || fin.technicianFinalEarning,
        gstAmount: Math.max(0, Math.round(gst * 100) / 100),
      }
    })
    const gross = lineItems.reduce((sum, row) => sum + Number(row.totalAmount || 0), 0)
    const gstEstimate = lineItems.reduce((sum, row) => sum + row.gstAmount, 0)
    const taxable = Math.max(0, gross - gstEstimate)

    return {
      count: rows.length,
      gross,
      taxable,
      gstEstimate,
      gstPercent: safeRate,
      lineItems,
    }
  }, [bookings, from, to, gstPercent])

  const onExport = () => {
    if (!report.lineItems.length) {
      toast.message('No completed bookings in this range.')
      return
    }
    exportRows(`finance-report-${from}_to_${to}.csv`, [
      ...report.lineItems.map((r) => ({
        bookingId: r.bookingId,
        serviceName: r.serviceName,
        customerId: r.customerId,
        status: r.status,
        completedAt: r.completedAt,
        serviceAmount: r.serviceAmount,
        convenienceFee: r.convenienceFee,
        visitingCharge: r.visitingCharge,
        totalAmount: r.totalAmount,
        partnerCommission: r.partnerCommission,
        partnerPayout: r.partnerPayout,
        gstAmount: r.gstAmount,
        gstPercent: report.gstPercent,
      })),
      {},
      {
        bookingId: 'SUMMARY',
        serviceName: '',
        customerId: '',
        status: '',
        completedAt: '',
        totalAmount: report.gross,
        gstPercent: report.gstPercent,
      },
      {
        bookingId: 'GST_ESTIMATE_INCLUSIVE',
        serviceName: '',
        customerId: '',
        status: '',
        completedAt: '',
        totalAmount: report.gstEstimate,
        gstPercent: report.gstPercent,
      },
      {
        bookingId: 'TAXABLE_ESTIMATE',
        serviceName: '',
        customerId: '',
        status: '',
        completedAt: '',
        totalAmount: report.taxable,
        gstPercent: report.gstPercent,
      },
    ])
    toast.success('CSV exported.')
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance reports"
        description="GST / date-range summary from completed bookings already loaded in this session (newest ~500 by createdAt)."
        actions={
          <Button type="button" onClick={onExport} disabled={!report.lineItems.length}>
            Export CSV
          </Button>
        }
      />

      <Card className="space-y-4 p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="From">
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <Field label="GST % (from invoice settings)">
            <Input
              type="number"
              min="0"
              step="0.1"
              value={gstPercent}
              onChange={(e) => setGstPercent(e.target.value)}
            />
          </Field>
        </div>
        {loading.bookings ? (
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Loading bookings…</p>
        ) : null}
      </Card>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Completed bookings</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{report.count}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Gross (customer totals)</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">₹{money(report.gross)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">Taxable estimate</p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">₹{money(report.taxable)}</p>
        </Card>
        <Card className="p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            GST (older bookings only, {report.gstPercent}% estimate)
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">₹{money(report.gstEstimate)}</p>
        </Card>
      </div>

      <Card className="overflow-x-auto p-0">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
            <tr>
              <th className="px-4 py-3">Booking</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Completed</th>
              <th className="px-4 py-3">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {!report.lineItems.length ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 font-medium text-slate-600 dark:text-slate-400">
                  No completed bookings in this range.
                </td>
              </tr>
            ) : (
              report.lineItems.map((row) => (
                <tr key={row.bookingId} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900 dark:text-white">{row.bookingId}</td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{row.serviceName || '—'}</td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                    {row.completedAt ? new Date(row.completedAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">₹{money(row.totalAmount)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
