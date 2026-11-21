import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { toast } from 'sonner'
import { useApp } from '../context/useApp'
import { db } from '../firebase/config'
import { Button, Field, Input } from '../components/ui'
import {
  wallPanelArrived,
  wallPanelMarkDelivered,
  wallPanelSubmitQuotation,
  wallPanelVerifyConsultationOtp,
  wallPanelVerifyDeliveryOtp,
} from '../services/websiteApi'

export function WallPanelMyJobsPage() {
  const { session } = useApp()
  const uid = session?.id
  const [bookings, setBookings] = useState([])
  const [otp, setOtp] = useState('')
  const [activeId, setActiveId] = useState('')
  const [quote, setQuote] = useState({ designId: '', designName: '', quantity: '1', lineTotal: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!uid) return undefined
    const q = query(collection(db, 'wallPanelBookings'), where('assignedEmployeeId', '==', uid))
    const unsub = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [uid])

  const mine = useMemo(
    () => bookings.filter((b) => !['COMPLETED', 'QUOTATION_REJECTED', 'CANCELLED'].includes(String(b.status))),
    [bookings],
  )

  const run = async (fn) => {
    setBusy(true)
    try {
      await fn()
      toast.success('Updated')
    } catch (e) {
      toast.error(e?.message || 'Failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 p-1">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Wall Panel jobs</h1>
      {mine.length === 0 ? <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">No active assignments.</p> : null}
      {mine.map((b) => (
        <div key={b.id} className="space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs">
          <p className="font-bold text-slate-900 dark:text-white">{b.bookingCode}</p>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{b.address?.fullAddress}</p>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Status: {b.status}</p>
          {['ASSIGNED', 'ARRIVAL_OTP_PENDING'].includes(b.status) ? (
            <>
              <Button type="button" disabled={busy} onClick={() => run(() => wallPanelArrived({ bookingId: b.id }))}>
                Arrived at location
              </Button>
              <Field label="Customer consultation OTP">
                <Input value={activeId === b.id ? otp : ''} onChange={(e) => { setActiveId(b.id); setOtp(e.target.value) }} />
              </Field>
              <Button
                type="button"
                disabled={busy}
                onClick={() => run(() => wallPanelVerifyConsultationOtp({ bookingId: b.id, otp }))}
              >
                Verify arrival OTP
              </Button>
            </>
          ) : null}
          {b.status === 'CONSULTATION_IN_PROGRESS' ? (
            <>
              <Field label="Design ID">
                <Input value={quote.designId} onChange={(e) => setQuote((q) => ({ ...q, designId: e.target.value }))} />
              </Field>
              <Field label="Design name">
                <Input value={quote.designName} onChange={(e) => setQuote((q) => ({ ...q, designName: e.target.value }))} />
              </Field>
              <Field label="Quantity">
                <Input value={quote.quantity} onChange={(e) => setQuote((q) => ({ ...q, quantity: e.target.value }))} />
              </Field>
              <Field label="Line total (₹)">
                <Input value={quote.lineTotal} onChange={(e) => setQuote((q) => ({ ...q, lineTotal: e.target.value }))} />
              </Field>
              <Button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    wallPanelSubmitQuotation({
                      bookingId: b.id,
                      lines: [
                        {
                          designId: quote.designId,
                          designName: quote.designName,
                          quantity: Number(quote.quantity) || 1,
                          lineTotalRupees: Number(quote.lineTotal) || 0,
                        },
                      ],
                      totalRupees: Number(quote.lineTotal) || 0,
                    }),
                  )
                }
              >
                Submit quotation
              </Button>
            </>
          ) : null}
          {b.status === 'QUOTATION_ACCEPTED' || b.status === 'DELIVERY_OTP_PENDING' ? (
            <>
              <Button type="button" disabled={busy} onClick={() => run(() => wallPanelMarkDelivered({ bookingId: b.id }))}>
                Wall panel delivered
              </Button>
              <Field label="Delivery OTP">
                <Input value={activeId === b.id ? otp : ''} onChange={(e) => { setActiveId(b.id); setOtp(e.target.value) }} />
              </Field>
              <Button
                type="button"
                disabled={busy}
                onClick={() => run(() => wallPanelVerifyDeliveryOtp({ bookingId: b.id, otp }))}
              >
                Verify delivery OTP
              </Button>
            </>
          ) : null}
        </div>
      ))}
    </div>
  )
}
