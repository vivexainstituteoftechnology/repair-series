import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Card, Modal, PageHeader, SearchInput } from '../components/ui'
import { DEFAULT_INVOICE_SETTINGS, normalizeInvoiceSettings } from '../constants/invoiceSettings'
import { useApp } from '../context/useApp'
import { isFirebaseConfigured } from '../firebase/config'
import { subscribeDoc } from '../services/firestore'
import { regenerateInvoice, resendInvoiceEmail, downloadInvoicePdf } from '../services/invoiceFunctions'
import { currency, formatDateTime } from '../utils/helpers'

function invoiceCustomerLabel(invoice, customers) {
  const byId = customers?.find((c) => c.id === invoice.customerId)
  if (byId?.name) return byId.name
  return (
    invoice.customerName ||
    invoice.customerEmail ||
    invoice.customerPhone ||
    invoice.customerId ||
    '—'
  )
}

function invoiceHasPdf(invoice) {
  return Boolean(
    /res\.cloudinary\.com/i.test(String(invoice?.pdfUrl || invoice?.invoicePdfUrl || '')) ||
      String(invoice?.invoiceNumber || '').trim(),
  )
}

function isCloudinaryPdfUrl(url) {
  return /res\.cloudinary\.com/i.test(String(url || ''))
}

export function InvoicesPage() {
  const { invoices, customers, loading } = useApp()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const [invoiceSettings, setInvoiceSettings] = useState({ ...DEFAULT_INVOICE_SETTINGS })
  const [busyKey, setBusyKey] = useState('')

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined
    const unsub = subscribeDoc(
      'settings',
      'invoice',
      (row) => setInvoiceSettings(normalizeInvoiceSettings(row || {})),
      () => {},
    )
    return () => unsub?.()
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const rows = [...(invoices || [])].sort((a, b) => {
      const aDate = a.createdAt?.toDate?.() || a.issuedAt?.toDate?.() || a.createdAt || a.issuedAt || 0
      const bDate = b.createdAt?.toDate?.() || b.issuedAt?.toDate?.() || b.createdAt || b.issuedAt || 0
      return new Date(bDate) - new Date(aDate)
    })
    if (!q) return rows
    return rows.filter((inv) => {
      const customer = invoiceCustomerLabel(inv, customers)
      const hay = [
        inv.id,
        inv.invoiceNumber,
        inv.bookingId,
        inv.bookingCode,
        customer,
        inv.customerEmail,
        inv.customerPhone,
        inv.status,
        inv.invoiceStatus,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return hay.includes(q)
    })
  }, [invoices, customers, search])

  const openPdf = async (invoice) => {
    const stored = String(invoice?.pdfUrl || invoice?.invoicePdfUrl || '').trim()
    if (isCloudinaryPdfUrl(stored)) {
      window.open(stored, '_blank', 'noopener,noreferrer')
      return
    }
    if (!invoice?.bookingId) {
      toast.error('Invoice PDF is not ready yet.')
      return
    }
    try {
      await downloadInvoicePdf({
        bookingId: invoice.bookingId,
        fileName: invoice.fileName || `${invoice.invoiceNumber || invoice.bookingId}.pdf`,
      })
    } catch (err) {
      toast.error(err?.message || 'Could not open invoice PDF.')
    }
  }

  const onDownloadPdf = (invoice) => {
    openPdf(invoice)
  }

  const onPrint = (invoice) => {
    openPdf(invoice)
    toast.message('Use the PDF viewer’s print button.')
  }

  const onCopyUrl = async (invoice) => {
    const stored = String(invoice?.pdfUrl || invoice?.invoicePdfUrl || '').trim()
    if (isCloudinaryPdfUrl(stored)) {
      try {
        await navigator.clipboard.writeText(stored)
        toast.success('Invoice URL copied.')
      } catch {
        toast.error('Could not copy URL.')
      }
      return
    }
    if (!invoice?.bookingId) {
      toast.error('No invoice file on this record.')
      return
    }
    toast.message('Download the PDF while signed in if a Cloudinary URL is not stored yet.')
  }

  const onResendEmail = async (invoice) => {
    const key = `email:${invoice.id}`
    setBusyKey(key)
    try {
      const result = await resendInvoiceEmail({
        bookingId: invoice.bookingId,
        invoiceId: invoice.id,
      })
      if (result?.skipped) {
        toast.message(`Email skipped: ${result.reason || 'no email'}`)
      } else {
        toast.success('Invoice email sent.')
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to resend email.')
    } finally {
      setBusyKey('')
    }
  }

  const onRegenerate = async (invoice) => {
    if (!invoice.bookingId) {
      toast.error('Missing booking ID.')
      return
    }
    const key = `regen:${invoice.id}`
    setBusyKey(key)
    try {
      const result = await regenerateInvoice({
        bookingId: invoice.bookingId,
        sendEmail: true,
      })
      toast.success(
        result?.reused
          ? 'Invoice already up to date.'
          : `Invoice regenerated: ${result?.invoiceNumber || ''}`,
      )
    } catch (err) {
      toast.error(err?.message || 'Failed to regenerate invoice.')
    } finally {
      setBusyKey('')
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoices & Billing"
        description="Invoice PDF for every booking — view, download, print, resend, or regenerate with clear audit trail."
        actions={
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search invoice #, booking, customer…"
            className="w-72 sm:w-80"
          />
        }
      />

      {loading.invoices ? (
        <Card>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Loading invoices…</p>
        </Card>
      ) : null}

      {!loading.invoices && !filtered.length ? (
        <Card>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No invoices found matching your query.</p>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {filtered.map((invoice) => {
          const customer = invoiceCustomerLabel(invoice, customers)
          const hasPdf = invoiceHasPdf(invoice)
          const status = invoice.invoiceStatus || invoice.status || (hasPdf ? 'issued' : 'pending')
          return (
            <Card key={invoice.id} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between hover:border-slate-300">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-extrabold text-[#171717] dark:text-white">
                    {invoice.invoiceNumber || invoice.id}
                  </h3>
                  <Badge tone={hasPdf ? 'success' : status === 'failed' ? 'danger' : 'info'}>
                    {status}
                  </Badge>
                  {invoice.isRevisit ? <Badge tone="success">Revisit</Badge> : null}
                </div>
                <div className="space-y-0.5 text-sm">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    <span className="font-bold text-slate-900 dark:text-white">Booking:</span>{' '}
                    <span className="font-mono">{invoice.bookingCode || invoice.bookingId || '—'}</span>
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    <span className="font-bold text-slate-900 dark:text-white">Customer:</span> {customer}
                  </p>
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    <span className="font-bold text-slate-900 dark:text-white">Invoice date:</span>{' '}
                    {formatDateTime(
                      invoice.generatedAt?.toDate?.() ||
                        invoice.createdAt?.toDate?.() ||
                        invoice.issuedAt?.toDate?.() ||
                        invoice.generatedAt ||
                        invoice.createdAt ||
                        invoice.issuedAt,
                    )}
                  </p>
                </div>
                {invoice.grandTotal != null || invoice.totalAmount != null || invoice.amount != null ? (
                  <p className="text-base font-extrabold text-[#171717] dark:text-white pt-1">
                    {currency(invoice.grandTotal ?? invoice.totalAmount ?? invoice.amount)}
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2 pt-2 lg:pt-0">
                <Button variant="outline" size="sm" onClick={() => setSelected(invoice)}>
                  Details
                </Button>
                <Button variant="outline" size="sm" disabled={!hasPdf} onClick={() => void openPdf(invoice)}>
                  View Invoice
                </Button>
                <Button variant="outline" size="sm" disabled={!hasPdf} onClick={() => void onDownloadPdf(invoice)}>
                  Download PDF
                </Button>
                <Button variant="outline" size="sm" disabled={!hasPdf} onClick={() => void onPrint(invoice)}>
                  Print
                </Button>
                <Button variant="outline" size="sm" disabled={!hasPdf} onClick={() => void onCopyUrl(invoice)}>
                  Copy URL
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busyKey === `email:${invoice.id}` || !hasPdf}
                  onClick={() => onResendEmail(invoice)}
                >
                  {busyKey === `email:${invoice.id}` ? 'Sending…' : 'Resend Email'}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={busyKey === `regen:${invoice.id}` || !invoice.bookingId}
                  onClick={() => onRegenerate(invoice)}
                >
                  {busyKey === `regen:${invoice.id}` ? 'Regenerating…' : 'Regenerate'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected ? `Invoice ${selected.invoiceNumber || selected.id}` : 'Invoice'}
        onClose={() => setSelected(null)}
        className="max-w-3xl"
      >
        {selected ? (
          <div className="space-y-6 text-sm">
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Booking Code:</span>{' '}
                <span className="font-mono">{selected.bookingCode || selected.bookingId || '—'}</span>
              </p>
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Customer:</span>{' '}
                {invoiceCustomerLabel(selected, customers)}
              </p>
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Email:</span>{' '}
                {selected.customerEmail || '—'}
              </p>
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Total Amount:</span>{' '}
                <span className="font-extrabold text-[#171717] dark:text-white">
                  {currency(selected.grandTotal ?? selected.totalAmount ?? selected.amount ?? 0)}
                </span>
              </p>
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Service:</span>{' '}
                {selected.serviceName || '—'}
              </p>
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Technician:</span>{' '}
                {selected.technicianName || '—'}
              </p>
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Payment Method:</span>{' '}
                {selected.paymentMethod || '—'}
              </p>
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Payment Status:</span>{' '}
                <span className="font-semibold">{selected.paymentStatus || '—'}</span>
              </p>
              <p className="sm:col-span-2 break-all text-slate-800 dark:text-slate-200">
                <span className="font-bold text-[#171717] dark:text-white">Invoice PDF:</span>{' '}
                <span className="font-mono text-xs">{selected.pdfUrl || selected.invoicePdfUrl || selected.pdfFileKey || selected.fileKey || '—'}</span>
              </p>
            </div>

            {Array.isArray(selected.lines) && selected.lines.length ? (
              <div className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <h4 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-[#171717] dark:text-white">
                  Invoice Items
                </h4>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {selected.lines.map((line, i) => (
                    <li key={i} className="flex justify-between py-2 text-sm text-slate-800 dark:text-slate-200 font-medium">
                      <span className="font-semibold text-[#171717] dark:text-white">{line.title || line.label || 'Service'}</span>
                      <span className="font-extrabold text-[#171717] dark:text-white">{currency(line.amount ?? 0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {selected.amountInWords ? (
              <p className="italic font-medium text-slate-700 dark:text-slate-300">
                {selected.amountInWords}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button variant="outline" size="sm" disabled={!invoiceHasPdf(selected)} onClick={() => void openPdf(selected)}>
                View Invoice
              </Button>
              <Button variant="outline" size="sm" disabled={!invoiceHasPdf(selected)} onClick={() => void onDownloadPdf(selected)}>
                Download PDF
              </Button>
              <Button variant="outline" size="sm" disabled={!invoiceHasPdf(selected)} onClick={() => void onPrint(selected)}>
                Print
              </Button>
              <Button variant="outline" size="sm" disabled={!invoiceHasPdf(selected)} onClick={() => void onCopyUrl(selected)}>
                Copy URL
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busyKey === `email:${selected.id}` || !invoiceHasPdf(selected)}
                onClick={() => onResendEmail(selected)}
              >
                Resend Email
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={busyKey === `regen:${selected.id}` || !selected.bookingId}
                onClick={() => onRegenerate(selected)}
              >
                Regenerate Invoice
              </Button>
            </div>
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Company defaults: {invoiceSettings.companyName} · GSTIN {invoiceSettings.gstin || '—'}
            </p>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
