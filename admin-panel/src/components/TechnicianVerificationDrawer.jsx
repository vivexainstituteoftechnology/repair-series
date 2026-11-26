import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertCircle,
  Briefcase,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  History,
  MapPin,
  Phone,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react'
import { Badge, Button, Field, Modal, Textarea } from './ui'
import { ImageLightbox } from './ImageLightbox'
import { useApp } from '../context/useApp'
import { subscribeTechnicianKycSubdocs } from '../services/technicianKyc'
import { verifyPartnerKyc } from '../services/websiteApi'
import { ROLES } from '../utils/rbac'
import {
  isTechnicianAssignable,
  kycStatusBadge,
  maskAccountNumber,
  maskAadhaarNumber,
  maskPanNumber,
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
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-slate-200 py-2.5 last:border-0 dark:border-slate-800">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p
          className={cn(
            'mt-0.5 break-words text-sm font-semibold text-slate-900 dark:text-slate-100',
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

function KycImageCard({ title, url, onPreview, status, onStatusChange }) {
  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-100/60 p-6 text-center dark:border-slate-700 dark:bg-slate-800/40">
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Document image not uploaded</p>
      </div>
    )
  }
  return (
    <div className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900/60">
      <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 dark:border-slate-800 dark:text-slate-300">
        <span>{title}</span>
        {status ? (
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
              status === 'approved' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
              status === 'rejected' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
              status === 'correction_requested' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
              status === 'pending' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
            )}
          >
            {status.replace('_', ' ')}
          </span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => onPreview(url, title)}
        className="relative block w-full bg-black/5 p-2 text-left"
      >
        <img src={url} alt={title} className="aspect-[4/3] w-full rounded-xl object-contain bg-white dark:bg-black/30" />
        <span className="mt-1.5 block text-center text-[11px] font-medium text-slate-500 group-hover:text-primary dark:text-slate-400">
          Click to zoom in lightbox
        </span>
      </button>
      {onStatusChange ? (
        <div className="flex items-center justify-between gap-1 border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
          <button
            type="button"
            onClick={() => onStatusChange('approved')}
            className={cn(
              'flex-1 rounded-lg py-1 text-[11px] font-bold transition',
              status === 'approved'
                ? 'bg-emerald-600 text-white'
                : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40',
            )}
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('correction_requested')}
            className={cn(
              'flex-1 rounded-lg py-1 text-[11px] font-bold transition',
              status === 'correction_requested'
                ? 'bg-amber-600 text-white'
                : 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40',
            )}
          >
            Correction
          </button>
          <button
            type="button"
            onClick={() => onStatusChange('rejected')}
            className={cn(
              'flex-1 rounded-lg py-1 text-[11px] font-bold transition',
              status === 'rejected'
                ? 'bg-rose-600 text-white'
                : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40',
            )}
          >
            Reject
          </button>
        </div>
      ) : null}
    </div>
  )
}

const TABS = [
  { id: 'overview', label: 'Overview & Audit', icon: ShieldCheck },
  { id: 'personal', label: 'Personal', icon: User },
  { id: 'address', label: 'Address & GPS', icon: MapPin },
  { id: 'identity', label: 'Identity Documents', icon: FileText },
  { id: 'bank', label: 'Bank Details', icon: CreditCard },
  { id: 'professional', label: 'Professional', icon: Briefcase },
]

export function TechnicianVerificationDrawer({
  open,
  onClose,
  technician,
  categoryLabel,
  bookingStats,
}) {
  const {
    session,
    categories,
    serviceTypes,
    serviceCategories,
    loading,
    refreshTechnicians,
  } = useApp()

  const [activeTab, setActiveTab] = useState('overview')
  const [subdocBankDetails, setSubdocBankDetails] = useState(null)
  const [subdocAadhaar, setSubdocAadhaar] = useState(null)
  const [lightbox, setLightbox] = useState({ open: false, url: '', title: '' })
  const [revealSensitive, setRevealSensitive] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // Document level statuses
  const [docStatuses, setDocStatuses] = useState({
    aadhaar: 'pending',
    pan: 'pending',
    bank: 'pending',
    address: 'pending',
    professional: 'pending',
  })

  // Action Modals
  const [approveModal, setApproveModal] = useState(false)
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [correctionModal, setCorrectionModal] = useState(false)
  const [correctionReason, setCorrectionReason] = useState('')
  const [suspendModal, setSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

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
    if (technician?.kyc?.documentStatus) {
      setDocStatuses((prev) => ({
        ...prev,
        ...technician.kyc.documentStatus,
      }))
    } else {
      setDocStatuses({
        aadhaar: technician?.kyc?.aadhaar ? 'approved' : 'pending',
        pan: technician?.kyc?.panNumber ? 'approved' : 'pending',
        bank: technician?.kyc?.bankDetails ? 'approved' : 'pending',
        address: technician?.kyc?.address ? 'approved' : 'pending',
        professional: technician?.kyc?.professional ? 'approved' : 'pending',
      })
    }
  }, [technician])

  useEffect(() => {
    if (!open) {
      setActiveTab('overview')
      setRejectModal(false)
      setRejectReason('')
      setCorrectionModal(false)
      setCorrectionReason('')
      setSuspendModal(false)
      setSuspendReason('')
      setRevealSensitive(false)
      setLightbox({ open: false, url: '', title: '' })
    }
  }, [open])

  // Data resolvers
  const kyc = technician?.kyc || {}
  const personal = kyc?.personal || {}
  const address = kyc?.address || {}
  const identity = kyc?.identity || {}
  const bank = kyc?.bank || kyc?.bankDetails || subdocBankDetails || {}
  const professional = kyc?.professional || {}

  const fullName = personal?.fullName || technician?.name || '—'
  const phone = personal?.phone || technician?.phone || '—'
  const email = personal?.email || technician?.email || '—'
  const dob = personal?.dob || technician?.dob || '—'
  const gender = personal?.gender || technician?.gender || '—'
  const profilePhotoUrl =
    personal?.profilePhotoUrl || technician?.photoUrl || technician?.profilePhotoUrl || ''

  // Address
  const houseFlat = address?.houseFlat || ''
  const streetArea = address?.streetArea || ''
  const city = address?.city || ''
  const stateName = address?.state || ''
  const pincode = address?.pincode || ''
  const fullAddress =
    address?.fullAddress ||
    [houseFlat, streetArea, city, stateName, pincode].filter(Boolean).join(', ') ||
    technician?.areaAddress ||
    '—'

  const locationLat =
    address?.location?.lat != null
      ? Number(address.location.lat)
      : technician?.location?.lat != null
        ? Number(technician.location.lat)
        : technician?.latitude != null
          ? Number(technician.latitude)
          : null
  const locationLng =
    address?.location?.lng != null
      ? Number(address.location.lng)
      : technician?.location?.lng != null
        ? Number(technician.location.lng)
        : technician?.longitude != null
          ? Number(technician.longitude)
          : null
  const hasCoordinates = Number.isFinite(locationLat) && Number.isFinite(locationLng)

  // Identity
  const aadhaarNumber =
    identity?.aadhaarNumber || kyc?.aadhaarNumber || subdocAadhaar?.aadhaarNumber || ''
  const aadhaarFrontUrl =
    identity?.aadhaarFrontUrl || pickAadhaarImageUrl(kyc?.aadhaar || subdocAadhaar, 'front')
  const aadhaarBackUrl =
    identity?.aadhaarBackUrl || pickAadhaarImageUrl(kyc?.aadhaar || subdocAadhaar, 'back')

  const panNumber = identity?.panNumber || kyc?.panNumber || subdocAadhaar?.panNumber || ''
  const panCardUrl = identity?.panCardUrl || kyc?.panCardUrl || ''

  // Bank
  const bankHolder = bank?.accountHolderName || ''
  const bankName = bank?.bankName || ''
  const rawAccount = bank?.accountNumber != null ? String(bank.accountNumber).trim() : ''
  const rawIfsc = bank?.ifscCode || bank?.ifsc || ''
  const rawUpi = bank?.upiId || bank?.upi || bank?.vpa || ''
  const chequeUrl = bank?.chequeOrPassbookUrl || bank?.chequeUrl || bank?.passbookUrl || ''

  // Professional
  const expYears = professional?.experienceYears ?? technician?.experienceYears ?? '—'
  const expDesc = professional?.experienceDescription || technician?.experienceDescription || ''
  const skillsLine = Array.isArray(professional?.skills)
    ? professional.skills.filter(Boolean).join(', ')
    : Array.isArray(technician?.skills)
      ? technician.skills.filter(Boolean).join(', ')
      : String(technician?.skills ?? '').trim() || '—'
  const certificates = Array.isArray(professional?.certificateUrls) ? professional.certificateUrls : []
  const workPhotos = Array.isArray(professional?.workPhotos) ? professional.workPhotos : []

  // Mandatory KYC Checklist Check
  const checklist = useMemo(() => {
    return [
      {
        id: 'personal',
        label: 'Personal Details & Profile Photo',
        satisfied: Boolean(fullName && fullName !== '—' && phone && phone !== '—' && profilePhotoUrl),
        hint: !profilePhotoUrl ? 'Profile photo missing' : 'Name and phone provided',
      },
      {
        id: 'address',
        label: 'Residential Address with GPS Coordinates',
        satisfied: Boolean(fullAddress && fullAddress !== '—' && hasCoordinates),
        hint: !hasCoordinates ? 'GPS location pin missing' : 'Address and pin recorded',
      },
      {
        id: 'aadhaar',
        label: 'Aadhaar Number & Documents (Front & Back)',
        satisfied: Boolean(aadhaarNumber && aadhaarFrontUrl && aadhaarBackUrl),
        hint: !aadhaarNumber
          ? 'Aadhaar number missing'
          : !aadhaarFrontUrl || !aadhaarBackUrl
            ? 'Aadhaar document photo missing'
            : 'Aadhaar submitted',
      },
      {
        id: 'pan',
        label: 'PAN Card Number & Card Photo',
        satisfied: Boolean(panNumber && panCardUrl),
        hint: !panNumber ? 'PAN number missing' : !panCardUrl ? 'PAN card photo missing' : 'PAN submitted',
      },
      {
        id: 'bank',
        label: 'Bank Account & Cheque/Passbook Proof',
        satisfied: Boolean(bankHolder && rawAccount && rawIfsc && chequeUrl),
        hint: !chequeUrl ? 'Cancelled cheque/passbook proof missing' : 'Bank details recorded',
      },
      {
        id: 'professional',
        label: 'Service Categories & Skills',
        satisfied: Boolean(categoryLabel && categoryLabel !== '— Set in edit'),
        hint: 'Trade categories assigned',
      },
    ]
  }, [
    fullName,
    phone,
    profilePhotoUrl,
    fullAddress,
    hasCoordinates,
    aadhaarNumber,
    aadhaarFrontUrl,
    aadhaarBackUrl,
    panNumber,
    panCardUrl,
    bankHolder,
    rawAccount,
    rawIfsc,
    chequeUrl,
    categoryLabel,
  ])

  const allMandatorySatisfied = checklist.every((item) => item.satisfied)
  const accountBadge = useMemo(() => verificationAccountBadge(technician), [technician])
  const kBadge = useMemo(() => kycStatusBadge(technician), [technician])
  const verification = normalizeVerificationStatus(technician)

  const joined = technician?.createdAt?.toDate?.()
    ? formatDateTime(technician.createdAt.toDate())
    : '—'
  const lastActive =
    technician?.lastActiveAt?.toDate?.()?.getTime?.() ||
    technician?.updatedAt?.toDate?.()?.getTime?.()
  const lastActiveLabel = lastActive ? formatDateTime(new Date(lastActive)) : '—'

  const auditLog = useMemo(() => {
    const list = Array.isArray(technician?.auditLog) ? [...technician.auditLog] : []
    return list.reverse()
  }, [technician?.auditLog])

  const handleDocStatusChange = (docKey, status) => {
    setDocStatuses((prev) => ({
      ...prev,
      [docKey]: status,
    }))
  }

  const handleApprove = async (services) => {
    try {
      setActionLoading(true)
      const categoriesById = Object.fromEntries((categories || []).map((c) => [c.id, c]))
      const categoryIds = services.map((s) => s.categoryId).filter(Boolean)
      const payload = {
        partnerId: technician.id,
        decision: 'approve',
        remarks: 'KYC verified and approved by operations admin.',
        documentStatus: docStatuses,
        services,
        categoryIds,
        categoryId: categoryIds[0] || technician?.categoryId || '',
      }
      await verifyPartnerKyc(payload)
      toast.success('Partner KYC approved and services activated!')
      setApproveModal(false)
      onClose?.()
      refreshTechnicians?.()
    } catch (err) {
      toast.error(err?.message || 'Approval failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Rejection reason is required.')
      return
    }
    try {
      setActionLoading(true)
      await verifyPartnerKyc({
        partnerId: technician.id,
        decision: 'reject',
        remarks: rejectReason.trim(),
        documentStatus: docStatuses,
      })
      toast.success('Application rejected.')
      setRejectModal(false)
      onClose?.()
      refreshTechnicians?.()
    } catch (err) {
      toast.error(err?.message || 'Rejection failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRequestCorrection = async () => {
    if (!correctionReason.trim()) {
      toast.error('Correction instructions are required.')
      return
    }
    try {
      setActionLoading(true)
      await verifyPartnerKyc({
        partnerId: technician.id,
        decision: 'request_correction',
        remarks: correctionReason.trim(),
        documentStatus: docStatuses,
      })
      toast.success('Correction request sent to partner.')
      setCorrectionModal(false)
      onClose?.()
      refreshTechnicians?.()
    } catch (err) {
      toast.error(err?.message || 'Request correction failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSuspendToggle = async () => {
    const isSuspended = technician?.suspended === true
    try {
      setActionLoading(true)
      await verifyPartnerKyc({
        partnerId: technician.id,
        decision: isSuspended ? 'reactivate' : 'suspend',
        remarks: isSuspended ? 'Reactivated by admin' : suspendReason.trim() || 'Suspended by admin',
      })
      toast.success(isSuspended ? 'Partner reactivated.' : 'Partner suspended.')
      setSuspendModal(false)
      onClose?.()
      refreshTechnicians?.()
    } catch (err) {
      toast.error(err?.message || 'Action failed')
    } finally {
      setActionLoading(false)
    }
  }

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
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
          onClick={() => !actionLoading && onClose?.()}
        />

        <aside
          className={cn(
            'absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-hidden',
            'border-slate-300 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900',
            'md:rounded-l-3xl md:border-l',
          )}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-6 py-4 dark:border-slate-800">
            <div className="flex items-center gap-3 min-w-0">
              {profilePhotoUrl ? (
                <button
                  type="button"
                  onClick={() => setLightbox({ open: true, url: profilePhotoUrl, title: `${fullName} Profile Photo` })}
                  className="size-12 shrink-0 overflow-hidden rounded-full border-2 border-primary/30 ring-2 ring-primary/10"
                >
                  <img src={profilePhotoUrl} alt={fullName} className="size-full object-cover" />
                </button>
              ) : (
                <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  <User className="size-6" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="truncate text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
                    {fullName}
                  </h2>
                  <Badge tone={accountBadge.tone}>{accountBadge.label}</Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span>{phone}</span>
                  <span>•</span>
                  <span>{email}</span>
                  <Badge tone={kBadge.tone} className="ml-1 text-[11px]">
                    {kBadge.label}
                  </Badge>
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={actionLoading}
              className="rounded-xl border border-slate-300 p-2 text-slate-600 transition hover:bg-slate-100 hover:text-black dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              onClick={() => onClose?.()}
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Tabs bar */}
          <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-6 py-2 no-scrollbar dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex gap-1.5">
              {TABS.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      'flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition',
                      isActive
                        ? 'bg-primary text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-200/70 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
                    )}
                  >
                    <Icon className="size-3.5" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Drawer Body */}
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {/* TAB 1: OVERVIEW & AUDIT */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Status KPI Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-[11px] font-bold uppercase text-slate-500">Completed</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                      {bookingStats?.completed ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-[11px] font-bold uppercase text-slate-500">Pending</p>
                    <p className="mt-1 text-xl font-extrabold text-amber-600">
                      {bookingStats?.pending ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-[11px] font-bold uppercase text-slate-500">Earnings</p>
                    <p className="mt-1 text-xl font-extrabold text-emerald-600">
                      ₹{bookingStats?.technicianEarnings ?? 0}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-900/60">
                    <p className="text-[11px] font-bold uppercase text-slate-500">Commission</p>
                    <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                      ₹{bookingStats?.platformDeduction ?? 0}
                    </p>
                  </div>
                </div>

                {/* Suspension / Rejection Alerts */}
                {technician?.suspended ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-rose-900 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
                    <AlertCircle className="size-5 shrink-0 text-rose-600" />
                    <div>
                      <p className="text-sm font-bold">Partner is Suspended</p>
                      <p className="mt-0.5 text-xs text-rose-800 dark:text-rose-300">
                        {technician.suspensionReason || 'Suspended by operations team.'}
                      </p>
                    </div>
                  </div>
                ) : null}

                {technician?.rejectionReason ? (
                  <div className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200">
                    <AlertCircle className="size-5 shrink-0 text-amber-600" />
                    <div>
                      <p className="text-sm font-bold">Previous Rejection Note</p>
                      <p className="mt-0.5 text-xs text-amber-800 dark:text-amber-300">
                        {technician.rejectionReason}
                      </p>
                    </div>
                  </div>
                ) : null}

                {/* Mandatory KYC Checklist */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Mandatory KYC Verification Checklist
                    </h3>
                    <Badge tone={allMandatorySatisfied ? 'success' : 'warning'}>
                      {allMandatorySatisfied ? 'All Requirements Met' : 'Incomplete KYC'}
                    </Badge>
                  </div>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    A partner cannot be approved or dispatched until all mandatory requirements are submitted and satisfied.
                  </p>

                  <div className="mt-3 space-y-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          'flex items-center justify-between rounded-xl border p-2.5 text-xs',
                          item.satisfied
                            ? 'border-emerald-200 bg-emerald-50/70 text-emerald-950 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300'
                            : 'border-amber-200 bg-amber-50/70 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300',
                        )}
                      >
                        <div className="flex items-center gap-2.5">
                          {item.satisfied ? (
                            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <XCircle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                          )}
                          <span className="font-bold">{item.label}</span>
                        </div>
                        <span className="text-[11px] font-medium opacity-80">{item.hint}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Trail & History */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center gap-2">
                    <History className="size-4 text-slate-500" />
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Verification History & Audit Trail
                    </h3>
                  </div>

                  <div className="mt-3 divide-y divide-slate-200 dark:divide-slate-800">
                    <div className="py-2 text-xs">
                      <span className="font-bold text-slate-500">Joined on: </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{joined}</span>
                    </div>
                    <div className="py-2 text-xs">
                      <span className="font-bold text-slate-500">Last active: </span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">{lastActiveLabel}</span>
                    </div>

                    {auditLog.length > 0 ? (
                      auditLog.map((log, index) => (
                        <div key={log.id || index} className="py-2.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span
                              className={cn(
                                'rounded px-2 py-0.5 text-[10px] font-extrabold uppercase',
                                log.action === 'approve' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                                log.action === 'reject' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                                log.action === 'request_correction' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                                log.action === 'suspend' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                                log.action === 'reactivate' && 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300',
                              )}
                            >
                              {log.action?.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {log.timestamp ? formatDateTime(new Date(log.timestamp)) : '—'}
                            </span>
                          </div>
                          <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">
                            {log.remarks || 'No remarks entered'}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">
                            Reviewed by: <span className="font-mono">{log.adminName || log.adminId || 'Admin'}</span>
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="py-3 text-center text-xs text-slate-500">No prior audit logs recorded.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: PERSONAL */}
            {activeTab === 'personal' && (
              <div className="space-y-5">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  {profilePhotoUrl ? (
                    <button
                      type="button"
                      onClick={() => setLightbox({ open: true, url: profilePhotoUrl, title: 'Profile Photo' })}
                      className="group relative size-20 shrink-0 overflow-hidden rounded-2xl border border-slate-300 shadow-sm"
                    >
                      <img src={profilePhotoUrl} alt="Profile" className="size-full object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                        <Eye className="size-5 text-white" />
                      </div>
                    </button>
                  ) : (
                    <div className="flex size-20 shrink-0 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-200 text-slate-400 dark:border-slate-700 dark:bg-slate-800">
                      <User className="size-8" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">{fullName}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {personal?.dob ? `DOB: ${personal.dob}` : 'DOB not provided'}
                    </p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Gender: <span className="capitalize">{gender}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Contact & Personal Verification
                  </h4>
                  <div className="mt-3 space-y-0">
                    <Row label="Full Legal Name" value={fullName} reveal />
                    <Row
                      label="Mobile Number"
                      value={phone}
                      reveal
                      actions={
                        phone && phone !== '—' ? (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => copyText(phone, 'Phone number')}
                            >
                              <Copy className="size-3" />
                              Copy
                            </Button>
                            <a
                              href={`tel:${phone}`}
                              className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-300 px-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              <Phone className="size-3" />
                              Call
                            </a>
                          </div>
                        ) : null
                      }
                    />
                    <Row
                      label="Email Address"
                      value={email}
                      reveal
                      actions={
                        email && email !== '—' ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => copyText(email, 'Email address')}
                          >
                            <Copy className="size-3" />
                            Copy
                          </Button>
                        ) : null
                      }
                    />
                    <Row label="Date of Birth" value={dob} reveal />
                    <Row label="Gender" value={gender} reveal />
                    <Row label="Phone Verified" value={personal?.phoneVerified ? 'Yes (OTP Verified)' : 'No'} reveal />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: ADDRESS & GPS */}
            {activeTab === 'address' && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Residential Address
                    </h4>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        docStatuses.address === 'approved' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                        docStatuses.address === 'rejected' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                        docStatuses.address === 'correction_requested' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                        docStatuses.address === 'pending' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      {docStatuses.address?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-0">
                    <Row label="House / Flat / Building" value={houseFlat || '—'} reveal />
                    <Row label="Street / Area / Landmark" value={streetArea || '—'} reveal />
                    <Row label="City" value={city || '—'} reveal />
                    <Row label="State" value={stateName || '—'} reveal />
                    <Row label="PIN Code" value={pincode || '—'} reveal />
                    <Row label="Complete Address Line" value={fullAddress} reveal />
                    <Row
                      label="GPS Coordinates"
                      value={hasCoordinates ? `${locationLat}, ${locationLng}` : '—'}
                      reveal
                      mono
                      actions={
                        hasCoordinates ? (
                          <div className="flex gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-8 px-2 text-xs"
                              onClick={() => copyText(`${locationLat},${locationLng}`, 'Coordinates')}
                            >
                              <Copy className="size-3" />
                              Copy
                            </Button>
                            <a
                              href={`https://www.google.com/maps?q=${locationLat},${locationLng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 items-center gap-1 rounded-xl border border-slate-300 px-2 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                            >
                              <ExternalLink className="size-3" />
                              Open Maps
                            </a>
                          </div>
                        ) : null
                      }
                    />
                  </div>

                  {/* Document approval toggles */}
                  <div className="mt-3 flex gap-2 border-t border-slate-200 pt-3 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => handleDocStatusChange('address', 'approved')}
                      className={cn(
                        'flex-1 rounded-lg py-1.5 text-xs font-bold transition',
                        docStatuses.address === 'approved'
                          ? 'bg-emerald-600 text-white'
                          : 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300',
                      )}
                    >
                      Approve Address
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocStatusChange('address', 'correction_requested')}
                      className={cn(
                        'flex-1 rounded-lg py-1.5 text-xs font-bold transition',
                        docStatuses.address === 'correction_requested'
                          ? 'bg-amber-600 text-white'
                          : 'border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300',
                      )}
                    >
                      Correction
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDocStatusChange('address', 'rejected')}
                      className={cn(
                        'flex-1 rounded-lg py-1.5 text-xs font-bold transition',
                        docStatuses.address === 'rejected'
                          ? 'bg-rose-600 text-white'
                          : 'border border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300',
                      )}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                {/* Google Map Embed Preview */}
                {hasCoordinates ? (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-xs dark:border-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-900/60">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-primary" />
                        <span className="text-xs font-extrabold uppercase tracking-wide text-slate-900 dark:text-white">
                          Partner Base Location on Google Maps
                        </span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${locationLat},${locationLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-bold text-primary hover:underline"
                      >
                        View Full Map →
                      </a>
                    </div>
                    <div className="h-64 w-full bg-slate-100 dark:bg-slate-800">
                      <iframe
                        title="Partner Location Map"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        src={`https://www.google.com/maps?q=${locationLat},${locationLng}&z=15&output=embed`}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 p-6 text-center text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/20 dark:text-amber-200">
                    <MapPin className="mx-auto size-8 text-amber-600" />
                    <p className="mt-2 text-sm font-bold">No GPS Location Selected</p>
                    <p className="mt-1 text-xs">
                      Partner did not pick their exact location pin on Google Maps during registration.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: IDENTITY DOCUMENTS */}
            {activeTab === 'identity' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Government identity documents are securely masked by default.
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => setRevealSensitive((r) => !r)}
                  >
                    {revealSensitive ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {revealSensitive ? 'Mask sensitive' : 'Reveal numbers'}
                  </Button>
                </div>

                {/* Aadhaar Section */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Aadhaar Card
                    </h4>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        docStatuses.aadhaar === 'approved' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                        docStatuses.aadhaar === 'rejected' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                        docStatuses.aadhaar === 'correction_requested' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                        docStatuses.aadhaar === 'pending' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      {docStatuses.aadhaar?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-0">
                    <Row
                      label="Aadhaar Number"
                      value={aadhaarNumber || '—'}
                      masked={maskAadhaarNumber(aadhaarNumber)}
                      reveal={revealSensitive}
                      mono
                      actions={
                        aadhaarNumber ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => copyText(aadhaarNumber, 'Aadhaar Number')}
                          >
                            <Copy className="size-3" />
                            Copy
                          </Button>
                        ) : null
                      }
                    />
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <KycImageCard
                      title="Aadhaar Front"
                      url={aadhaarFrontUrl}
                      onPreview={(url, title) => setLightbox({ open: true, url, title })}
                      status={docStatuses.aadhaar}
                      onStatusChange={(status) => handleDocStatusChange('aadhaar', status)}
                    />
                    <KycImageCard
                      title="Aadhaar Back"
                      url={aadhaarBackUrl}
                      onPreview={(url, title) => setLightbox({ open: true, url, title })}
                      status={docStatuses.aadhaar}
                      onStatusChange={(status) => handleDocStatusChange('aadhaar', status)}
                    />
                  </div>
                </div>

                {/* PAN Section */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      PAN Card
                    </h4>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        docStatuses.pan === 'approved' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                        docStatuses.pan === 'rejected' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                        docStatuses.pan === 'correction_requested' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                        docStatuses.pan === 'pending' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      {docStatuses.pan?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 space-y-0">
                    <Row
                      label="PAN Card Number"
                      value={panNumber || '—'}
                      masked={maskPanNumber(panNumber)}
                      reveal={revealSensitive}
                      mono
                      actions={
                        panNumber ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => copyText(panNumber, 'PAN Card Number')}
                          >
                            <Copy className="size-3" />
                            Copy
                          </Button>
                        ) : null
                      }
                    />
                  </div>

                  <div className="mt-4 max-w-sm">
                    <KycImageCard
                      title="PAN Card Photo"
                      url={panCardUrl}
                      onPreview={(url, title) => setLightbox({ open: true, url, title })}
                      status={docStatuses.pan}
                      onStatusChange={(status) => handleDocStatusChange('pan', status)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: BANK DETAILS */}
            {activeTab === 'bank' && (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Bank Account & Payout Details
                  </h4>
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-8 gap-1.5 px-3 text-xs"
                    onClick={() => setRevealSensitive((r) => !r)}
                  >
                    {revealSensitive ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {revealSensitive ? 'Mask sensitive' : 'Reveal numbers'}
                  </Button>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="space-y-0">
                    <Row label="Account Holder Name" value={bankHolder || '—'} reveal />
                    <Row label="Bank Name" value={bankName || '—'} reveal />
                    <Row
                      label="Account Number"
                      value={rawAccount || '—'}
                      masked={maskAccountNumber(rawAccount)}
                      reveal={revealSensitive}
                      mono
                      actions={
                        rawAccount ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => copyText(rawAccount, 'Account Number')}
                          >
                            <Copy className="size-3" />
                            Copy
                          </Button>
                        ) : null
                      }
                    />
                    <Row
                      label="IFSC Code"
                      value={rawIfsc || '—'}
                      reveal
                      mono
                      actions={
                        rawIfsc ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => copyText(rawIfsc, 'IFSC Code')}
                          >
                            <Copy className="size-3" />
                            Copy
                          </Button>
                        ) : null
                      }
                    />
                    <Row
                      label="UPI ID (VPA)"
                      value={rawUpi || '—'}
                      reveal
                      mono
                      actions={
                        rawUpi ? (
                          <Button
                            type="button"
                            variant="ghost"
                            className="h-8 px-2 text-xs"
                            onClick={() => copyText(rawUpi, 'UPI ID')}
                          >
                            <Copy className="size-3" />
                            Copy
                          </Button>
                        ) : null
                      }
                    />
                  </div>
                </div>

                {/* Cancelled Cheque / Bank Passbook Photo */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                      Bank Proof (Cancelled Cheque / Passbook)
                    </h4>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase',
                        docStatuses.bank === 'approved' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300',
                        docStatuses.bank === 'rejected' && 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300',
                        docStatuses.bank === 'correction_requested' && 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300',
                        docStatuses.bank === 'pending' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
                      )}
                    >
                      {docStatuses.bank?.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-3 max-w-sm">
                    <KycImageCard
                      title="Cheque / Passbook Document"
                      url={chequeUrl}
                      onPreview={(url, title) => setLightbox({ open: true, url, title })}
                      status={docStatuses.bank}
                      onStatusChange={(status) => handleDocStatusChange('bank', status)}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: PROFESSIONAL */}
            {activeTab === 'professional' && (
              <div className="space-y-5">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Trade Categories & Skills
                  </h4>

                  <div className="mt-3 space-y-0">
                    <Row label="Assigned Categories" value={categoryLabel || '—'} reveal />
                    <Row label="Years of Experience" value={String(expYears)} reveal />
                    <Row label="Specialized Skills" value={skillsLine} reveal />
                    <Row label="Work Experience Description" value={expDesc || '—'} reveal />
                  </div>
                </div>

                {/* Certificates */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Training & Skill Certificates ({certificates.length})
                  </h4>
                  {certificates.length > 0 ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {certificates.map((url, i) => (
                        <KycImageCard
                          key={i}
                          title={`Certificate #${i + 1}`}
                          url={url}
                          onPreview={(u, t) => setLightbox({ open: true, url: u, title: t })}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No certificates uploaded.</p>
                  )}
                </div>

                {/* Past Work Photos */}
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                    Past Work Photos ({workPhotos.length})
                  </h4>
                  {workPhotos.length > 0 ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {workPhotos.map((url, i) => (
                        <KycImageCard
                          key={i}
                          title={`Work Photo #${i + 1}`}
                          url={url}
                          onPreview={(u, t) => setLightbox({ open: true, url: u, title: t })}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs text-slate-500">No work photos uploaded.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Bar Footer */}
          {canManage && (
            <div className="border-t border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="danger"
                    disabled={actionLoading}
                    onClick={() => {
                      setRejectReason('')
                      setRejectModal(true)
                    }}
                  >
                    Reject Application
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionLoading}
                    onClick={() => {
                      setCorrectionReason('')
                      setCorrectionModal(true)
                    }}
                  >
                    Request Correction
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400"
                    disabled={actionLoading}
                    onClick={() => {
                      setSuspendReason('')
                      setSuspendModal(true)
                    }}
                  >
                    {technician?.suspended ? 'Reactivate Partner' : 'Suspend Partner'}
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  className={cn('min-w-[150px] shadow-sm', !allMandatorySatisfied && 'opacity-70')}
                  disabled={actionLoading}
                  onClick={() => {
                    if (!allMandatorySatisfied) {
                      toast.warning('Mandatory KYC details are missing, but you may review and assign services.')
                    }
                    setApproveModal(true)
                  }}
                >
                  Approve Partner
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* Services Assignment on Approval Modal */}
      <PartnerApprovalServicesModal
        open={approveModal}
        onClose={() => !actionLoading && setApproveModal(false)}
        categories={categories}
        serviceTypes={serviceTypes}
        serviceCategories={serviceCategories}
        loading={loading?.categories || loading?.serviceTypes || loading?.serviceCategories}
        onConfirm={handleApprove}
      />

      {/* Reject Application Modal */}
      <Modal
        open={rejectModal}
        title="Reject Partner Application"
        onClose={() => !actionLoading && setRejectModal(false)}
      >
        <div className="space-y-4">
          <Field label="Rejection Reason *">
            <p className="mb-2 text-xs text-slate-500">
              This message will be shown clearly to the partner in the Partner App.
            </p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Identity document name does not match bank account..."
              rows={4}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={actionLoading}
              onClick={() => setRejectModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="danger"
              disabled={actionLoading || !rejectReason.trim()}
              onClick={handleReject}
            >
              {actionLoading ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Request Correction Modal */}
      <Modal
        open={correctionModal}
        title="Request KYC Document Correction"
        onClose={() => !actionLoading && setCorrectionModal(false)}
      >
        <div className="space-y-4">
          <Field label="Correction Instructions for Partner *">
            <p className="mb-2 text-xs text-slate-500">
              Explain which documents or fields need correction. The partner will see this message and be prompted to re-upload.
            </p>
            <Textarea
              value={correctionReason}
              onChange={(e) => setCorrectionReason(e.target.value)}
              placeholder="e.g. Aadhaar Back photo is blurred. Please upload a clear photo of your Aadhaar card..."
              rows={4}
            />
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={actionLoading}
              onClick={() => setCorrectionModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={actionLoading || !correctionReason.trim()}
              onClick={handleRequestCorrection}
            >
              {actionLoading ? 'Sending...' : 'Send Correction Request'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Suspend / Reactivate Modal */}
      <Modal
        open={suspendModal}
        title={technician?.suspended ? 'Reactivate Partner' : 'Suspend Partner'}
        onClose={() => !actionLoading && setSuspendModal(false)}
      >
        <div className="space-y-4">
          {technician?.suspended ? (
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Reactivating this partner will restore their account status to active and allow them to receive booking dispatches again.
            </p>
          ) : (
            <Field label="Suspension Reason">
              <p className="mb-2 text-xs text-slate-500">
                Provide a reason for suspending this partner. They will not be able to receive new bookings.
              </p>
              <Textarea
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                placeholder="e.g. Repeated policy violation / customer complaint under investigation..."
                rows={3}
              />
            </Field>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={actionLoading}
              onClick={() => setSuspendModal(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant={technician?.suspended ? 'primary' : 'danger'}
              disabled={actionLoading}
              onClick={handleSuspendToggle}
            >
              {actionLoading
                ? 'Processing...'
                : technician?.suspended
                  ? 'Confirm Reactivate'
                  : 'Confirm Suspension'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Lightbox */}
      <ImageLightbox
        open={lightbox.open}
        url={lightbox.url}
        title={lightbox.title}
        onClose={() => setLightbox((s) => ({ ...s, open: false }))}
      />
    </>
  )
}
