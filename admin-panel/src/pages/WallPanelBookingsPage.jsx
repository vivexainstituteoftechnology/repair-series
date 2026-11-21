import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '../firebase/config'
import { Button, Field, Select } from '../components/ui'
import { assignWallPanelBooking } from '../services/websiteApi'

const STATUS_LABEL = {
  CONSULTATION_PENDING: 'Pending assignment',
  ASSIGNED: 'Assigned',
  ARRIVAL_OTP_PENDING: 'Arrival OTP',
  CONSULTATION_IN_PROGRESS: 'Consultation',
  QUOTATION_PENDING_CUSTOMER: 'Quotation sent',
  QUOTATION_REJECTED: 'Rejected',
  QUOTATION_ACCEPTED: 'Accepted',
  DELIVERY_OTP_PENDING: 'Delivery OTP',
  COMPLETED: 'Completed',
}

export function WallPanelBookingsPage() {
  const [bookings, setBookings] = useState([])
  const [employees, setEmployees] = useState([])
  const [assignId, setAssignId] = useState(null)
  const [employeeId, setEmployeeId] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const u1 = onSnapshot(collection(db, 'wallPanelBookings'), (snap) => {
      setBookings(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    const u2 = onSnapshot(collection(db, 'wallPanelEmployees'), (snap) => {
      setEmployees(snap.docs.filter((d) => d.data()?.active !== false).map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => {
      u1()
      u2()
    }
  }, [])

  const sorted = useMemo(
    () => [...bookings].sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)),
    [bookings],
  )

  const submitAssign = async () => {
    if (!assignId || !employeeId) return
    setBusy(true)
    try {
      await assignWallPanelBooking({ bookingId: assignId, employeeId })
      toast.success('Employee assigned')
      setAssignId(null)
      setEmployeeId('')
    } catch (e) {
      toast.error(e?.message || 'Assign failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4 p-1">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Wall Panel — Bookings</h1>
      <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-bold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3 text-left">Code</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Customer</th>
              <th className="px-4 py-3 text-left">Slot</th>
              <th className="px-4 py-3 text-left">Employee</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
            {sorted.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white">{b.bookingCode}</td>
                <td className="px-4 py-3">
                  <Badge tone={b.status === 'COMPLETED' ? 'success' : b.status === 'CANCELLED' ? 'danger' : 'info'}>
                    {STATUS_LABEL[b.status] || b.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{b.customerName || b.customerPhone || b.customerId}</td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                  {b.scheduledDate} {b.scheduledSlotLabel}
                </td>
                <td className="px-4 py-3 text-slate-700 dark:text-slate-300">{b.assignedEmployeeName || '—'}</td>
                <td className="px-4 py-3 text-right">
                  {b.status === 'CONSULTATION_PENDING' ? (
                    <Button type="button" size="sm" onClick={() => setAssignId(b.id)}>
                      Assign
                    </Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {assignId ? (
        <div className="max-w-md space-y-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
          <Field label="Wall Panel employee">
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select…</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex gap-2">
            <Button type="button" disabled={busy} onClick={() => void submitAssign()}>
              Confirm assign
            </Button>
            <Button type="button" variant="ghost" onClick={() => setAssignId(null)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
