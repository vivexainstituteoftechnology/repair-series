import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Badge, Button, Card, Field, Input, Modal, PageHeader, SearchInput, Select } from '../components/ui'
import { useApp } from '../context/useApp'
import { formatDateTime } from '../utils/helpers'

const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'New', label: 'New' },
  { value: 'Assigned', label: 'Assigned' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Started', label: 'Started' },
  { value: 'Paused', label: 'Paused' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Cancelled', label: 'Cancelled' },
  { value: 'Failed', label: 'Failed' },
]

function statusTone(status) {
  const s = String(status || '').toLowerCase()
  if (s === 'completed') return 'success'
  if (s === 'cancelled' || s === 'canceled' || s === 'failed') return 'danger'
  if (s === 'assigned' || s === 'started' || s === 'inprogress' || s === 'in progress') return 'info'
  if (s === 'paused') return 'warning'
  return 'warning'
}

function hasRevisitHistory(booking) {
  return Array.isArray(booking?.revisitHistory) && booking.revisitHistory.length > 0
}

function remainingRevisitsLabel(booking) {
  const remaining =
    booking?.revisitRemaining ??
    booking?.remainingRevisits ??
    booking?.freeRevisitsRemaining ??
    booking?.revisitEligibility?.remaining
  if (remaining == null || remaining === '') return null
  const n = Number(remaining)
  if (!Number.isFinite(n)) return String(remaining)
  return String(n)
}

export function RevisitsPage() {
  const { bookings, customers, loading, mutating, updateBookingRevisitRemaining } = useApp()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [remainingInput, setRemainingInput] = useState('')

  const customerMap = useMemo(
    () => Object.fromEntries((customers || []).map((c) => [c.id, c])),
    [customers],
  )

  const revisitRows = useMemo(() => {
    const rows = (bookings || []).filter(
      (b) => b?.isRevisit === true || Boolean(b?.parentBookingId) || hasRevisitHistory(b),
    )
    const q = search.trim().toLowerCase()
    return rows
      .filter((b) => {
        if (statusFilter !== 'all') {
          const status = String(b.status || '')
          if (statusFilter === 'InProgress') {
            const s = status.toLowerCase()
            if (s !== 'inprogress' && s !== 'in progress' && s !== 'started') return false
          } else if (status.toLowerCase() !== statusFilter.toLowerCase()) {
            return false
          }
        }
        if (!q) return true
        const customer = customerMap[b.customerId]
        const hay = [
          b.id,
          b.bookingCode,
          b.serviceName,
          b.parentBookingId,
          b.originalBookingId,
          b.revisitReason,
          b.revisitNotes,
          customer?.name,
          customer?.phone,
          customer?.email,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => {
        const aDate = a.scheduledAt?.toDate?.() || a.dateTime || a.createdAt?.toDate?.() || a.createdAt || 0
        const bDate = b.scheduledAt?.toDate?.() || b.dateTime || b.createdAt?.toDate?.() || b.createdAt || 0
        return new Date(bDate) - new Date(aDate)
      })
  }, [bookings, search, statusFilter, customerMap])

  return (
    <div className="space-y-4">
      <PageHeader
        title="Revisits"
        description="Bookings claimed as free revisits, plus parents that have revisit history."
        actions={
          <>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search booking, customer, reason…"
            />
            <Field label="Status">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                {STATUS_FILTERS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        }
      />

      {loading.bookings ? (
        <Card>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Loading revisits…</p>
        </Card>
      ) : null}

      {!loading.bookings && !revisitRows.length ? (
        <Card>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">No revisit bookings found.</p>
        </Card>
      ) : null}

      <div className="grid gap-4">
        {revisitRows.map((booking) => {
          const customer = customerMap[booking.customerId]
          const parentId = booking.parentBookingId || booking.originalBookingId
          const remaining = remainingRevisitsLabel(booking)
          const images = Array.isArray(booking.revisitImages) ? booking.revisitImages.filter(Boolean) : []
          return (
            <Card key={booking.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      {booking.bookingCode || booking.id}
                    </h3>
                    {booking.isRevisit === true || parentId ? (
                      <Badge tone="info">Revisit</Badge>
                    ) : null}
                    {hasRevisitHistory(booking) && booking.isRevisit !== true ? (
                      <Badge tone="warning">Has revisit history</Badge>
                    ) : null}
                    <Badge tone={statusTone(booking.status)}>{booking.status || 'Unknown'}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {booking.serviceName || 'Service'} · {customer?.name || booking.customerId || '—'}
                  </p>
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    <span className="font-semibold text-slate-900 dark:text-white">Scheduled: </span>
                    {formatDateTime(
                      booking.scheduledAt?.toDate?.() || booking.dateTime || booking.scheduledAt,
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  onClick={() => {
                    setSelected(booking)
                    setRemainingInput(remainingRevisitsLabel(booking) ?? '')
                  }}
                >
                  View details
                </button>
              </div>

              {parentId ? (
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-semibold text-slate-900 dark:text-white">Original booking: </span>
                  <Link className="font-semibold text-primary-600 underline" to="/bookings">
                    {parentId}
                  </Link>
                </p>
              ) : null}

              {remaining != null ? (
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-semibold text-slate-900 dark:text-white">Remaining free revisits: </span>
                  <span className="font-bold text-slate-900 dark:text-white">{remaining}</span>
                </p>
              ) : null}

              {booking.revisitReason ? (
                <p className="text-sm text-slate-800 dark:text-slate-200">
                  <span className="font-semibold text-slate-900 dark:text-white">Reason: </span>
                  <span className="font-medium text-slate-900 dark:text-white">{booking.revisitReason}</span>
                </p>
              ) : null}

              {booking.revisitNotes ? (
                <p className="whitespace-pre-wrap text-sm font-medium text-slate-800 dark:text-slate-200">{booking.revisitNotes}</p>
              ) : null}

              {images.length ? (
                <div className="flex flex-wrap gap-2">
                  {images.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt=""
                        className="h-16 w-16 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />
                    </a>
                  ))}
                </div>
              ) : null}

              {hasRevisitHistory(booking) ? (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Revisit history entries: {booking.revisitHistory.length}
                </p>
              ) : null}
            </Card>
          )
        })}
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected ? `Revisit ${selected.bookingCode || selected.id}` : 'Revisit'}
        onClose={() => {
          setSelected(null)
          setRemainingInput('')
        }}
        className="max-w-3xl"
      >
        {selected ? (
          <div className="space-y-4 text-sm text-slate-800 dark:text-slate-200">
            <div className="grid gap-3 sm:grid-cols-2">
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Status: </span>
                {selected.status || '—'}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Service: </span>
                {selected.serviceName || '—'}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Customer: </span>
                {customerMap[selected.customerId]?.name || selected.customerId || '—'}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Parent booking: </span>
                {selected.parentBookingId || selected.originalBookingId || '—'}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Reason: </span>
                {selected.revisitReason || '—'}
              </p>
              <p>
                <span className="font-semibold text-slate-900 dark:text-white">Remaining: </span>
                {remainingRevisitsLabel(selected) ?? '—'}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <Field label="Adjust remaining free revisits">
                <div className="flex flex-wrap items-end gap-2">
                  <Input
                    type="number"
                    min="0"
                    className="max-w-[140px]"
                    value={remainingInput}
                    onChange={(e) => setRemainingInput(e.target.value)}
                  />
                  <Button
                    type="button"
                    disabled={Boolean(mutating.bookingRevisitRemaining)}
                    onClick={async () => {
                      try {
                        await updateBookingRevisitRemaining({
                          bookingId: selected.id,
                          remaining: remainingInput,
                        })
                        setSelected((cur) =>
                          cur
                            ? {
                                ...cur,
                                revisitRemaining: Math.max(0, Math.round(Number(remainingInput))),
                                remainingRevisits: Math.max(0, Math.round(Number(remainingInput))),
                                freeRevisitsRemaining: Math.max(0, Math.round(Number(remainingInput))),
                              }
                            : cur,
                        )
                      } catch (e) {
                        toast.error(e.message)
                      }
                    }}
                  >
                    {mutating.bookingRevisitRemaining ? 'Saving…' : 'Save'}
                  </Button>
                </div>
              </Field>
              <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                Syncs <code>revisitRemaining</code>, <code>remainingRevisits</code>, and{' '}
                <code>freeRevisitsRemaining</code>.
              </p>
            </div>
            {selected.revisitNotes ? (
              <div>
                <p className="mb-1 font-bold text-slate-900 dark:text-white">Notes</p>
                <p className="whitespace-pre-wrap font-medium text-slate-800 dark:text-slate-200">{selected.revisitNotes}</p>
              </div>
            ) : null}
            {Array.isArray(selected.revisitImages) && selected.revisitImages.length ? (
              <div>
                <p className="mb-2 font-bold text-slate-900 dark:text-white">Images</p>
                <div className="flex flex-wrap gap-2">
                  {selected.revisitImages.filter(Boolean).map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt=""
                        className="h-24 w-24 rounded-xl border border-slate-200 object-cover dark:border-slate-700"
                      />
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
            {Array.isArray(selected.revisitHistory) && selected.revisitHistory.length ? (
              <div>
                <p className="mb-2 font-bold text-slate-900 dark:text-white">Revisit history</p>
                <ul className="space-y-2">
                  {selected.revisitHistory.map((entry, idx) => (
                    <li
                      key={entry?.revisitBookingId || entry?.id || idx}
                      className="rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    >
                      {entry?.revisitBookingId || entry?.id || `Entry ${idx + 1}`}
                      {entry?.reason ? ` · ${entry.reason}` : ''}
                      {entry?.createdAt
                        ? ` · ${formatDateTime(entry.createdAt?.toDate?.() || entry.createdAt)}`
                        : ''}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
