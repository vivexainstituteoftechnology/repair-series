import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '../firebase/config'
import { Button, Field, Input, Modal, Select } from '../components/ui'
import { currency, formatDateTime } from '../utils/helpers'
import { recordPartnerWalletPayout } from '../services/websiteApi'

const PAYOUT_METHODS = [
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CASH', label: 'Cash' },
]

function walletStatusLabel(balancePaise) {
  const rupees = balancePaise / 100
  if (balancePaise > 0) return `Company owes partner ${currency(rupees)}`
  if (balancePaise < 0) return `Partner owes company ${currency(Math.abs(rupees))}`
  return 'No settlement due'
}

export function PartnerWalletsPage() {
  const [wallets, setWallets] = useState([])
  const [names, setNames] = useState({})
  const [loading, setLoading] = useState(true)
  const [payoutPartner, setPayoutPartner] = useState(null)
  const [amountStr, setAmountStr] = useState('')
  const [method, setMethod] = useState('UPI')
  const [reference, setReference] = useState('')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'partnerWallets'),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        rows.sort((a, b) => (Number(b.balancePaise) || 0) - (Number(a.balancePaise) || 0))
        setWallets(rows)
        setLoading(false)
      },
      () => {
        setLoading(false)
        toast.error('Could not load partner wallets.')
      },
    )
    return () => unsub()
  }, [])

  const fetchedIdsRef = useRef(new Set())

  useEffect(() => {
    wallets.forEach((w) => {
      const pid = w.partnerId || w.id
      if (!pid || names[pid] || fetchedIdsRef.current.has(pid)) return
      fetchedIdsRef.current.add(pid)
      void getDoc(doc(db, 'technicians', pid)).then((snap) => {
        const label = snap.exists()
          ? String(snap.data()?.name || snap.data()?.displayName || pid).trim()
          : pid
        setNames((prev) => ({
          ...prev,
          [pid]: label,
        }))
      }).catch(() => {
        setNames((prev) => ({
          ...prev,
          [pid]: pid,
        }))
      })
    })
  }, [wallets, names])

  const rows = useMemo(
    () =>
      wallets.map((w) => {
        const partnerId = w.partnerId || w.id
        const balancePaise = Math.round(Number(w.balancePaise) || 0)
        return {
          partnerId,
          name: names[partnerId] || partnerId,
          balancePaise,
          balanceRupees: balancePaise / 100,
          status: walletStatusLabel(balancePaise),
          lastPayoutAt: w.lastPayoutAt,
          lastPayoutMethod: w.lastPayoutMethod,
        }
      }),
    [wallets, names],
  )

  const openPayout = (row) => {
    setPayoutPartner(row)
    setAmountStr(row.balancePaise > 0 ? String((row.balancePaise / 100).toFixed(2)) : '')
    setMethod('UPI')
    setReference('')
    setNotes('')
  }

  const submitPayout = async (event) => {
    event.preventDefault()
    if (!payoutPartner) return
    const amountRupees = Number(String(amountStr).replace(/,/g, '').trim())
    if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
      toast.error('Enter a valid payout amount.')
      return
    }
    setBusy(true)
    try {
      await recordPartnerWalletPayout({
        partnerId: payoutPartner.partnerId,
        amountRupees,
        paymentMethod: method,
        transactionReference: reference,
        notes,
        idempotencyKey: `admin_ui:${payoutPartner.partnerId}:${amountRupees}:${method}:${Date.now()}`,
      })
      toast.success('Payout recorded.')
      setPayoutPartner(null)
    } catch (err) {
      toast.error(err?.message || 'Payout failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--on-surface)]">Partner settlement wallets</h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--on-surface-variant)]">
          Net settlement ledger (not a customer wallet). Positive balance = company owes the partner. Cash
          collections debit only the company share. Payouts are recorded after you pay via UPI, bank, or cash —
          no Razorpay involved.
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--on-surface-variant)]">Loading wallets…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[var(--on-surface-variant)]">
          No wallet summaries yet. Wallets appear after verified online payments or cash collection.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--outline-variant)]/40">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-700 dark:bg-slate-900/60 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Partner</th>
                <th className="px-4 py-3">Balance</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last payout</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.partnerId} className="border-t border-[var(--outline-variant)]/30">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-[var(--on-surface)]">{row.name}</div>
                    <div className="text-xs text-[var(--on-surface-variant)]">{row.partnerId}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold">{currency(row.balanceRupees)}</td>
                  <td className="px-4 py-3">{row.status}</td>
                  <td className="px-4 py-3 text-xs text-[var(--on-surface-variant)]">
                    {row.lastPayoutAt ? formatDateTime(row.lastPayoutAt) : '—'}
                    {row.lastPayoutMethod ? ` · ${row.lastPayoutMethod}` : ''}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.balancePaise > 0 ? (
                      <Button type="button" className="px-3 py-1.5 text-xs" onClick={() => openPayout(row)}>
                        Record payout
                      </Button>
                    ) : (
                      <span className="text-xs text-[var(--on-surface-variant)]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(payoutPartner)} onClose={() => setPayoutPartner(null)} title="Record payout">
        {payoutPartner ? (
          <form className="space-y-4" onSubmit={submitPayout}>
            <p className="text-sm text-[var(--on-surface-variant)]">
              Partner: <span className="font-semibold text-[var(--on-surface)]">{payoutPartner.name}</span>
            </p>
            <p className="text-sm">
              Current balance:{' '}
              <span className="font-bold text-emerald-700 dark:text-emerald-400">
                {currency(payoutPartner.balanceRupees)}
              </span>
            </p>
            <Field label="Amount to pay (₹)">
              <Input value={amountStr} onChange={(e) => setAmountStr(e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Payment method">
              <Select value={method} onChange={(e) => setMethod(e.target.value)} options={PAYOUT_METHODS} />
            </Field>
            <Field label="Transaction reference (optional)">
              <Input value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
            <Field label="Notes (optional)">
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setPayoutPartner(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Confirm payout'}
              </Button>
            </div>
          </form>
        ) : null}
      </Modal>
    </div>
  )
}
