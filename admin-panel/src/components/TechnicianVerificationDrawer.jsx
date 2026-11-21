import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Copy, X } from 'lucide-react'
import { Badge, Button, Field, Modal, Textarea } from './ui'
import { ImageLightbox } from './ImageLightbox'
import { useApp } from '../context/useApp'
import { subscribeTechnicianKycSubdocs } from '../services/technicianKyc'
import { ROLES } from '../utils/rbac'
import {
  kycStatusBadge,
  maskAccountNumber,
  normalizeVerificationStatus,
  pickAadhaarImageUrl,
  verificationAccountBadge,
} from '../utils/technicianVerification'
import { cn, formatDateTime } from '../utils/helpers'
import { PartnerApprovalServicesModal } from './PartnerApprovalServicesModal'

async function copyText(text, label) {
  const t = String(text || '').trim()
  if (!t) return
  try {
    await navigator.clipboard.writeText(t)
    toast.success('Copied', { description: label })
  } catch {
    toast.error('Copy failed')
  }
}

function Row({ label, value, masked, reveal, actions, mono }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 dark:border-slate-800 py-2.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">{label}</p>
        <p
          className={cn(
            'mt-0.5 break-words text-sm font-semibold text-[#171717] dark:text-white',
            mono ? 'font-mono text-[13px] tracking-tight' : '',
          )}
        >
          {reveal ? value ?? '—' : masked ?? '—'}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

function KycImageCard({ title, url, onPreview }) {
  if (!url) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--outline-variant)] bg-[var(--surface-low)]/60 p-6 text-center">
        <p className="text-sm font-semibold text-[var(--on-surface)]">{title}</p>
        <p className="mt-2 text-sm text-[var(--on-surface-variant)]">KYC image unavailable</p>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={() => onPreview(url, title)}
      className={cn(
        'group relative w-full overflow-hidden rounded-2xl border border-[var(--outline-variant)] bg-black/40 text-left shadow-lg transition',
        'ring-offset-2 ring-offset-[var(--surface-lowest)] hover:ring-2 hover:ring-[var(--primary)]/50',
      )}
    >
      <div className="absolute left-3 top-3 z-[1] rounded-lg bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
        {title}
      </div>
      <img src={url} alt={title} className="aspect-[4/3] w-full object-contain" />
      <span className="block px-3 py-2 text-center text-[11px] text-[var(--on-surface-variant)] group-hover:text-[var(--on-surface)]">
        Tap to enlarge · zoom in viewer
      </span>
    </button>
  )
}

export function TechnicianVerificationDrawer({
  open,
  onClose,
  technician,
  categoryLabel,
  bookingStats,
}) {
  const {
    session,
    approveTechnician,
    rejectTechnician,
    mutating,
    categories,
    serviceTypes,
    serviceCategories,
    loading,
  } = useApp()
  // 👇 State name changed for subdocs so they don't override main doc changes
  const [subdocBankDetails, setSubdocBankDetails] = useState(null)
  const [subdocAadhaar, setSubdocAadhaar] = useState(null)
  const [lightbox, setLightbox] = useState({ open: false, url: '', title: '' })
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [revealSensitive, setRevealSensitive] = useState(false)

  const canManage = session?.role === ROLES.SUPER_ADMIN || session?.role === ROLES.TECHNICIAN_MANAGER

  useEffect(() => {
    if (!open || !technician?.id) {
      setSubdocBankDetails(null)
      setSubdocAadhaar(null)
      return undefined
    }
    const unsub = subscribeTechnicianKycSubdocs(
      technician.id,
      ({ bankDetails: b, aadhaar: a }) => {
        setSubdocBankDetails(b)
        setSubdocAadhaar(a)
      },
      () => {},
    )
    return () => unsub()
  }, [open, technician?.id])

  useEffect(() => {
    if (!open) {
      setRejectModal(false)
      setRejectReason('')
      setRevealSensitive(false)
      setLightbox({ open: false, url: '', title: '' })
    }
  }, [open])

  // 👇 Data directly main object se pick karo (agar app waha likh rhi hai), warning fallback to subdoc
  const bankDetails = technician?.kyc?.bankDetails || subdocBankDetails
  const aadhaar = technician?.kyc?.aadhaar || subdocAadhaar
  const aadhaarNumber = technician?.kyc?.aadhaarNumber || subdocAadhaar?.aadhaarNumber
  const panNumber = technician?.kyc?.panNumber || subdocAadhaar?.panNumber

  const accountBadge = useMemo(() => verificationAccountBadge(technician), [technician])
  const kBadge = useMemo(() => kycStatusBadge(technician), [technician])
  const verification = normalizeVerificationStatus(technician)

  const skillsLine = Array.isArray(technician?.skills)
    ? technician.skills.filter(Boolean).join(', ')
    : String(technician?.skills ?? '').trim() || '—'

  const joined = technician?.createdAt?.toDate?.()
    ? formatDateTime(technician.createdAt.toDate())
    : '—'

  const lastActive =
    technician?.lastActiveAt?.toDate?.()?.getTime?.() ||
    technician?.updatedAt?.toDate?.()?.getTime?.()
  const lastActiveLabel = lastActive
    ? formatDateTime(new Date(lastActive))
    : '—'

  const frontUrl = useMemo(() => pickAadhaarImageUrl(aadhaar, 'front'), [aadhaar])
  const backUrl = useMemo(() => pickAadhaarImageUrl(aadhaar, 'back'), [aadhaar])

  const bankHolder =
    bankDetails?.accountHolderName != null ? String(bankDetails.accountHolderName).trim() : ''
  const bankName = bankDetails?.bankName != null ? String(bankDetails.bankName).trim() : ''
  const rawAccount = bankDetails?.accountNumber != null ? String(bankDetails.accountNumber).trim() : ''
  const rawIfsc = bankDetails?.ifscCode ?? bankDetails?.ifsc ?? ''
  const rawUpi =
    bankDetails?.upiId ?? bankDetails?.upi ?? bankDetails?.vpa ?? bankDetails?.UPI ?? ''

  const showActions = canManage && verification !== 'active'

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-[85] transition-[opacity,visibility]',
          open ? 'pointer-events-auto visible opacity-100' : 'pointer-events-none invisible opacity-0',
        )}
      >
        <button
          type="button"
          aria-label="Close panel"
          className="absolute inset-0 bg-[color-mix(in_srgb,var(--on-surface)_55%,transparent)] backdrop-blur-[2px]"
          onClick={() => !mutating?.technicianVerification && onClose?.()}
        />
        <aside
          className={cn(
            'absolute right-0 top-0 flex h-full w-full max-w-full flex-col overflow-hidden',
            'border-slate-300 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900',
            'md:max-w-lg md:rounded-l-3xl md:border-l',
            'max-md:rounded-none',
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Technician verification
              </p>
              <h2 className="mt-1 truncate text-xl font-extrabold tracking-tight text-[#171717] dark:text-white">
                {technician?.name || 'Technician'}
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge tone={accountBadge.tone} className="whitespace-nowrap">
                  {accountBadge.dot} {accountBadge.label}
                </Badge>
                <Badge tone={kBadge.tone} className="whitespace-nowrap">
                  {kBadge.label}
                </Badge>
              </div>
            </div>
            <button
              type="button"
              disabled={Boolean(mutating?.technicianVerification)}
              className="rounded-xl border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-black dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 disabled:opacity-50"
              onClick={() => onClose?.()}
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <section className="rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Personal details
              </h3>
              {technician?.suspended ? (
                <div className="mt-3 rounded-xl border border-amber-500/35 bg-amber-500/10 px-3 py-2 text-sm text-amber-950 dark:text-amber-100">
                  Suspended — they cannot receive new assignments until this is lifted.
                </div>
              ) : null}
              <div className="mt-3 space-y-0">
                <Row label="Name" value={technician?.name} masked={technician?.name} reveal />
                <Row label="Phone" value={technician?.phone} masked={technician?.phone} reveal />
                <Row label="Email" value={technician?.email} masked={technician?.email} reveal />
                <Row label="Skills" value={skillsLine} masked={skillsLine} reveal />
                <Row label="Category" value={categoryLabel || '—'} masked={categoryLabel || '—'} reveal />
                <Row label="Join date" value={joined} masked={joined} reveal />
                <Row label="Current account status" value={accountBadge.label} masked={accountBadge.label} reveal />
                <Row label="Last active" value={lastActiveLabel} masked={lastActiveLabel} reveal />
                <Row
                  label="Pending bookings"
                  value={String(bookingStats?.pending ?? 0)}
                  masked={String(bookingStats?.pending ?? 0)}
                  reveal
                />
                <Row
                  label="Completed bookings"
                  value={String(bookingStats?.completed ?? 0)}
                  masked={String(bookingStats?.completed ?? 0)}
                  reveal
                />
              </div>
              {technician?.rejectionReason ? (
                <p className="mt-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                  Last rejection note:{' '}
                  <span className="font-medium text-[var(--on-surface)]">{String(technician.rejectionReason)}</span>
                </p>
              ) : null}
            </section>

            <section className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                  Bank details (KYC)
                </h3>
                {(rawAccount || String(rawUpi || '').trim()) && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 px-3 text-xs"
                    onClick={() => setRevealSensitive((r) => !r)}
                  >
                    {revealSensitive ? 'Mask sensitive' : 'Reveal'}
                  </Button>
                )}
              </div>
              <div className="mt-3 space-y-0">
                <Row label="Account holder name" value={bankHolder || '—'} masked={bankHolder || '—'} reveal />
                <Row label="Bank name" value={bankName || '—'} masked={bankName || '—'} reveal />
                <Row
                  label="Account number"
                  value={rawAccount || '—'}
                  masked={maskAccountNumber(rawAccount)}
                  reveal={revealSensitive}
                  mono
                  actions={
                    rawAccount ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 px-2 text-xs"
                        onClick={() => copyText(rawAccount, 'Account number')}
                      >
                        <Copy className="size-3.5" />
                        Copy
                      </Button>
                    ) : null
                  }
                />
                <Row
                  label="IFSC code"
                  value={String(rawIfsc || '').trim() || '—'}
                  masked={String(rawIfsc || '').trim() || '—'}
                  reveal
                  mono={Boolean(String(rawIfsc || '').trim())}
                  actions={
                    String(rawIfsc || '').trim() ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 px-2 text-xs"
                        onClick={() => copyText(String(rawIfsc).trim(), 'IFSC')}
                      >
                        <Copy className="size-3.5" />
                        Copy
                      </Button>
                    ) : null
                  }
                />
                <Row
                  label="UPI ID"
                  value={String(rawUpi || '').trim() || '—'}
                  masked={
                    String(rawUpi || '').trim()
                      ? `${String(rawUpi).slice(0, 3)}···${String(rawUpi).slice(-4)}`
                      : '—'
                  }
                  reveal={revealSensitive}
                  mono={Boolean(String(rawUpi || '').trim())}
                  actions={
                    String(rawUpi || '').trim() ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-9 px-2 text-xs"
                        onClick={() => copyText(String(rawUpi).trim(), 'UPI ID')}
                      >
                        <Copy className="size-3.5" />
                        Copy
                      </Button>
                    ) : null
                  }
                />
              </div>
            </section>

            <section className="mt-5 rounded-2xl border border-slate-300 bg-slate-50 p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900/60">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Identity documents (KYC)
              </h3>
              <div className="mt-3 space-y-0">
                <Row
                  label="Aadhaar number"
                  value={aadhaarNumber || '—'}
                  masked={
                    aadhaarNumber
                      ? `XXXX XXXX ${String(aadhaarNumber).slice(-4)}`
                      : '—'
                  }
                  reveal={revealSensitive}
                  mono
                />
                <Row
                  label="PAN number"
                  value={panNumber || '—'}
                  masked={
                    panNumber
                      ? `${String(panNumber).slice(0, 2)}XXXXX${String(panNumber).slice(-1)}`
                      : '—'
                  }
                  reveal={revealSensitive}
                  mono
                />
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <KycImageCard
                  title="Aadhaar front"
                  url={frontUrl}
                  onPreview={(url, title) => setLightbox({ open: true, url, title })}
                />
                <KycImageCard
                  title="Aadhaar back"
                  url={backUrl}
                  onPreview={(url, title) => setLightbox({ open: true, url, title })}
                />
              </div>
            </section>

            {technician?.kyc?.address || technician?.areaAddress ? (
              <section className="mt-5 rounded-2xl border border-[var(--outline-variant)]/60 bg-[var(--surface-low)]/35 p-4 shadow-inner">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--on-surface-variant)]">
                  Address & GPS
                </h3>
                <div className="mt-3 space-y-0">
                  <Row
                    label="Full address"
                    value={technician?.kyc?.address?.fullAddress || technician?.areaAddress}
                    masked={technician?.kyc?.address?.fullAddress || technician?.areaAddress}
                    reveal
                  />
                  <Row
                    label="GPS"
                    value={
                      technician?.location?.lat != null
                        ? `${technician.location.lat}, ${technician.location.lng}`
                        : technician?.latitude != null
                          ? `${technician.latitude}, ${technician.longitude}`
                          : '—'
                    }
                    masked="—"
                    reveal
                  />
                </div>
              </section>
            ) : null}

            {showActions ? (
              <div className="mt-6 flex flex-wrap gap-2 border-t border-[var(--outline-variant)]/60 pt-5">
                <Button
                  type="button"
                  className="min-h-[44px] flex-1 sm:flex-none"
                  disabled={Boolean(mutating?.technicianVerification)}
                  onClick={() => setApproveModal(true)}
                >
                  Approve partner
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  className="min-h-[44px] flex-1 sm:flex-none"
                  disabled={Boolean(mutating?.technicianVerification)}
                  onClick={() => {
                    setRejectReason('')
                    setRejectModal(true)
                  }}
                >
                  Reject
                </Button>
              </div>
            ) : !canManage ? (
              <p className="mt-6 text-sm text-[var(--on-surface-variant)]">
                You do not have permission to approve technicians.
              </p>
            ) : null}
          </div>
        </aside>
      </div>

      <PartnerApprovalServicesModal
        open={approveModal}
        onClose={() => !mutating?.technicianVerification && setApproveModal(false)}
        categories={categories}
        serviceTypes={serviceTypes}
        serviceCategories={serviceCategories}
        loading={loading?.categories || loading?.serviceTypes || loading?.serviceCategories}
        onConfirm={async (services) => {
          try {
            await approveTechnician({ technicianId: technician.id, services })
            setApproveModal(false)
            onClose?.()
          } catch (e) {
            toast.error(e?.message || 'Approve failed.')
          }
        }}
      />

      <Modal
        open={rejectModal}
        title="Reject application"
        onClose={() => !mutating?.technicianVerification && setRejectModal(false)}
      >
        <div className="space-y-4">
          <Field label="Rejection reason *">
            <p className="mb-2 text-xs text-[var(--on-surface-variant)]">Shown to the partner in their app.</p>
            <Textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Bank details incorrect…" rows={4} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={Boolean(mutating?.technicianVerification)}
              onClick={() => setRejectModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={Boolean(mutating?.technicianVerification) || !String(rejectReason || '').trim()}
              onClick={async () => {
                try {
                  await rejectTechnician({
                    technicianId: technician?.id,
                    reason: rejectReason,
                  })
                  setRejectModal(false)
                  onClose?.()
                } catch (e) {
                  toast.error(e?.message || 'Reject failed.')
                }
              }}
            >
              Reject application
            </Button>
          </div>
        </div>
      </Modal>

      <ImageLightbox
        open={lightbox.open}
        url={lightbox.url}
        title={lightbox.title}
        onClose={() => setLightbox((s) => ({ ...s, open: false }))}
      />
    </>
  )
}