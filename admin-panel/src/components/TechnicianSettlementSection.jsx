import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { toast } from 'sonner'
import { Button, Field, Input, Modal, Select } from './ui'
import { useApp } from '../context/useApp'
import { currency, formatDateTime } from '../utils/helpers'
import { db, isFirebaseConfigured } from '../firebase/config'
import { subscribeDoc } from '../services/firestore'
import { subscribeTechnicianTransactions } from '../services/technicianTransactions'
import {
  createdAtToDate,
  sortTransactionsNewestFirst,
  summarizeTechnicianTransactions,
} from '../utils/technicianLedger'

const PAYMENT_MODES = [
  { value: '', label: 'Select karein (optional)' },
  { value: 'Cash', label: 'Cash' },
  { value: 'UPI', label: 'UPI' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
]

export function TechnicianSettlementSection({ technician }) {
  const { recordTechnicianPayout, syncTechnicianLedgerFromBookings, mutating } = useApp()
  const [rows, setRows] = useState([])
  const [txLoading, setTxLoading] = useState(true)
  const [payOpen, setPayOpen] = useState(false)
  const [txOpen, setTxOpen] = useState(false)
  const [amountStr, setAmountStr] = useState('')
  const [note, setNote] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [walletBalancePaise, setWalletBalancePaise] = useState(null)
  const [payoutRequests, setPayoutRequests] = useState([])

  useEffect(() => {
    const unsubWallet = subscribeDoc('partnerWallets', technician.id, (row) => {
      const b = row?.balancePaise
      setWalletBalancePaise(Number.isFinite(Number(b)) ? Math.round(Number(b)) : 0)
    })
    return () => unsubWallet?.()
  }, [technician.id])

  useEffect(() => {
    if (!isFirebaseConfigured || !db) return () => {}
    const q = query(
      collection(db, 'technicians', technician.id, 'payoutRequests'),
      orderBy('createdAt', 'desc'),
    )
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPayoutRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
      },
      () => setPayoutRequests([]),
    )
    return () => unsub()
  }, [technician.id])

  useEffect(() => {
    setTxLoading(true)
    const unsub = subscribeTechnicianTransactions(
      technician.id,
      (list) => {
        setRows(list)
        setTxLoading(false)
      },
      () => {
        setTxLoading(false)
        toast.error('Transactions load nahi ho paye. Firestore rules / network check karein.')
      },
    )
    return () => unsub()
  }, [technician.id])

  const summary = useMemo(() => summarizeTechnicianTransactions(rows), [rows])
  const sortedTx = useMemo(() => sortTransactionsNewestFirst(rows), [rows])
  const walletRupees =
    walletBalancePaise != null ? Math.round(walletBalancePaise) / 100 : null
  const payableFromWallet =
    walletRupees != null ? Math.max(0, walletRupees) : Math.max(0, summary.remaining)
  const partnerOwes =
    walletRupees != null ? Math.max(0, -walletRupees) : 0

  const openPay = () => {
    setAmountStr('')
    setNote('')
    setPaymentMode('')
    setPayOpen(true)
  }

  const submitPay = async (event) => {
    event.preventDefault()
    const n = Number(String(amountStr).replace(/,/g, '').trim())
    try {
      await recordTechnicianPayout({
        technicianId: technician.id,
        amount: n,
        paymentMode,
        note,
        maxAmount: payableFromWallet,
      })
      setPayOpen(false)
    } catch (err) {
      toast.error(err?.message || 'Payout save nahi hua.')
    }
  }

  return (
    <>
      <div className="mt-4 rounded-2xl border border-slate-300 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-900/60">
        <p className="text-xs font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
          Settlement & ledger
        </p>
        {txLoading ? (
          <p className="mt-2 text-sm font-semibold text-slate-600 dark:text-slate-300">Loading ledger…</p>
        ) : (
          <>
            <div className="mt-2.5 space-y-1.5 text-sm">
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Total earning (ledger):</span>{' '}
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  {currency(summary.totalEarned)}
                </span>
              </p>
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Admin paid:</span>{' '}
                <span className="font-bold text-rose-700 dark:text-rose-400">
                  {currency(summary.totalPaid)}
                </span>
              </p>
              {walletRupees != null ? (
                <p className="text-slate-800 dark:text-slate-200">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Net settlement wallet:</span>{' '}
                  <span className="font-bold text-[#171717] dark:text-white">{currency(walletRupees)}</span>
                </p>
              ) : null}
              <p className="text-slate-800 dark:text-slate-200">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Payable to partner (wallet):</span>{' '}
                <span className="font-extrabold text-amber-800 dark:text-amber-300">
                  {currency(payableFromWallet)}
                </span>
              </p>
              {partnerOwes > 0.005 ? (
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">
                  Partner owes company: {currency(partnerOwes)}
                </p>
              ) : null}
              {summary.isOverpaid ? (
                <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                  Warning: payout exceeds earnings — check history.
                </p>
              ) : null}
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 pt-1">
                Last settlement:{' '}
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {summary.lastPayoutAt ? formatDateTime(summary.lastPayoutAt) : 'No payout recorded yet'}
                </span>
              </p>
            </div>
            {payoutRequests.filter((r) => {
              const st = String(r.status || 'PENDING').toUpperCase()
              return st === 'PENDING' || st === 'APPROVED'
            }).length > 0 ? (
              <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-2">
                <p className="text-xs font-semibold uppercase text-amber-800 dark:text-amber-200">
                  Partner payout requests
                </p>
                <ul className="mt-2 space-y-2">
                  {payoutRequests
                    .filter((r) => {
                      const st = String(r.status || 'PENDING').toUpperCase()
                      return st === 'PENDING' || st === 'APPROVED'
                    })
                    .slice(0, 5)
                    .map((r) => (
                      <li key={r.id} className="text-xs text-slate-700 dark:text-slate-200">
                        {currency(Number(r.amount) || 0)} · {String(r.status || 'PENDING')} ·{' '}
                        {r.createdAt?.toDate ? formatDateTime(r.createdAt.toDate()) : '—'}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                type="button"
                className="px-3 py-1.5 text-xs"
                onClick={openPay}
                disabled={txLoading || mutating.technicianPayout || payableFromWallet <= 0.005}
              >
                Record payout
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="px-3 py-1.5 text-xs"
                onClick={() => setTxOpen(true)}
              >
                View Transactions
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="px-3 py-1.5 text-xs"
                disabled={Boolean(mutating.technicianLedgerSync)}
                onClick={async () => {
                  try {
                    await syncTechnicianLedgerFromBookings(technician.id)
                  } catch (e) {
                    toast.error(e?.message || 'Sync fail.')
                  }
                }}
              >
                {mutating.technicianLedgerSync ? 'Sync…' : 'Sync earnings (purane bookings)'}
              </Button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={payOpen}
        title="Payout — Kitna amount pay kiya?"
        onClose={() => !mutating.technicianPayout && setPayOpen(false)}
      >
        <form className="space-y-4" onSubmit={submitPay}>
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Abhi dena baaki: <strong>{currency(Math.max(0, summary.remaining))}</strong>
          </p>
          <Field label="Amount (₹)">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="e.g. 2000"
              required
            />
          </Field>
          <Field label="Payment note (optional)">
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Weekly settlement, UPI ref…"
            />
          </Field>
          <Field label="Payment mode (optional)">
            <Select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)}>
              {PAYMENT_MODES.map((o) => (
                <option key={o.value === '' ? '_empty' : o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPayOpen(false)}
              disabled={mutating.technicianPayout}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutating.technicianPayout}>
              {mutating.technicianPayout ? 'Saving…' : 'Mark as Paid'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        open={txOpen}
        title={`Transactions — ${technician.name}`}
        onClose={() => setTxOpen(false)}
        bodyClassName="max-h-[70vh] overflow-y-auto pr-1"
      >
        {sortedTx.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Abhi koi transaction nahi.</p>
        ) : (
          <ul className="space-y-3">
            {sortedTx.map((tx) => {
              const isEarn = String(tx.type).toLowerCase() === 'earning'
              const amt = Number(tx.amount)
              const line = isEarn ? `+ ${currency(amt)}` : `- ${currency(amt)}`
              const dt = createdAtToDate(tx.createdAt)
              const when = dt ? formatDateTime(dt) : '—'
              return (
                <li
                  key={tx.id}
                  className={`rounded-xl border px-3 py-2 text-sm ${
                    isEarn
                      ? 'border-emerald-500/40 bg-emerald-500/5'
                      : 'border-rose-500/40 bg-rose-500/5'
                  }`}
                >
                  <p
                    className={`font-semibold ${
                      isEarn ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'
                    }`}
                  >
                    {line}
                  </p>
                  <p className="text-slate-700 dark:text-slate-200">
                    {isEarn
                      ? `Booking complete${tx.serviceName ? ` · ${tx.serviceName}` : ''}${tx.bookingId ? ` · ${tx.bookingId}` : ''}`
                      : `Settlement paid${tx.paymentMode ? ` · ${tx.paymentMode}` : ''}${tx.note ? ` · ${tx.note}` : ''}`}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{when}</p>
                </li>
              )
            })}
          </ul>
        )}
      </Modal>
    </>
  )
}
