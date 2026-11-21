import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useApp } from '../context/useApp'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  Field,
  Modal,
  PageHeader,
  SearchInput,
  Select,
} from '../components/ui'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Filter,
  MessageSquare,
  ShieldCheck,
  Star,
} from 'lucide-react'

export function ReviewsPage() {
  const { services, session } = useApp()
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [serviceFilter, setServiceFilter] = useState('ALL')
  const [ratingFilter, setRatingFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [selectedReview, setSelectedReview] = useState(null)
  const [moderatingId, setModeratingId] = useState(null)

  const canModerate =
    session?.role === 'superAdmin' ||
    session?.role === 'serviceManager' ||
    session?.role === 'bookingManager'

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const unsub = onSnapshot(
      collection(db, 'reviews'),
      (snap) => {
        if (cancelled) return
        const rows = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }))
        // Sort newest first
        rows.sort((a, b) => {
          const tA =
            a.createdAt?.toDate?.()?.getTime?.() ||
            new Date(a.createdAt || 0).getTime()
          const tB =
            b.createdAt?.toDate?.()?.getTime?.() ||
            new Date(b.createdAt || 0).getTime()
          return tB - tA
        })
        setReviews(rows)
        setLoading(false)
      },
      (err) => {
        console.error('Error loading reviews:', err)
        if (!cancelled) {
          toast.error('Failed to load reviews')
          setLoading(false)
        }
      },
    )

    return () => {
      cancelled = true
      unsub()
    }
  }, [])

  // Moderation handler: toggle published / hidden and recompute service ratings
  const handleToggleStatus = async (review) => {
    if (!canModerate) {
      toast.error('Only authorized managers can moderate reviews.')
      return
    }

    const newStatus = review.status === 'hidden' ? 'published' : 'hidden'
    const actionLabel = newStatus === 'hidden' ? 'hide' : 'publish'

    if (
      !window.confirm(
        `Are you sure you want to ${actionLabel} this review? ${
          newStatus === 'hidden'
            ? 'It will be excluded from public service ratings and hidden from the website.'
            : 'It will be restored and included in public service ratings.'
        }`,
      )
    ) {
      return
    }

    setModeratingId(review.id)
    try {
      const reviewRef = doc(db, 'reviews', review.id)
      await updateDoc(reviewRef, {
        status: newStatus,
        moderatedAt: serverTimestamp(),
        moderatedBy: session?.email || session?.uid || 'admin',
        updatedAt: serverTimestamp(),
      })

      // Recalculate service rating if serviceId is present
      const serviceId = review.serviceId
      if (serviceId) {
        const q = query(
          collection(db, 'reviews'),
          where('serviceId', '==', serviceId),
          where('status', '==', 'published'),
        )
        const snap = await getDocs(q)
        const publishedReviews = snap.docs.map((d) => d.data())
        const total = publishedReviews.length

        if (total === 0) {
          await updateDoc(doc(db, 'services', serviceId), {
            rating: null,
            reviewCount: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            updatedAt: serverTimestamp(),
          })
        } else {
          const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
          let sum = 0
          for (const r of publishedReviews) {
            const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)))
            sum += star
            distribution[star] = (distribution[star] || 0) + 1
          }
          const avg = Math.round((sum / total) * 10) / 10
          await updateDoc(doc(db, 'services', serviceId), {
            rating: avg,
            reviewCount: total,
            ratingDistribution: distribution,
            updatedAt: serverTimestamp(),
          })
        }
      }

      toast.success(
        `Review has been ${newStatus === 'hidden' ? 'hidden' : 'published'}.`,
      )
      if (selectedReview?.id === review.id) {
        setSelectedReview((prev) => (prev ? { ...prev, status: newStatus } : null))
      }
    } catch (err) {
      console.error('Failed to moderate review:', err)
      toast.error(err?.message || 'Failed to update review status.')
    } finally {
      setModeratingId(null)
    }
  }

  // Filtered reviews
  const filtered = useMemo(() => {
    return reviews.filter((r) => {
      if (serviceFilter !== 'ALL' && r.serviceId !== serviceFilter) return false
      if (ratingFilter !== 'ALL' && Number(r.rating) !== Number(ratingFilter))
        return false
      if (statusFilter !== 'ALL' && (r.status || 'published') !== statusFilter)
        return false

      if (search.trim()) {
        const q = search.toLowerCase().trim()
        const match =
          String(r.customerName || '').toLowerCase().includes(q) ||
          String(r.customerPhone || '').includes(q) ||
          String(r.bookingId || '').toLowerCase().includes(q) ||
          String(r.serviceName || '').toLowerCase().includes(q) ||
          String(r.comment || '').toLowerCase().includes(q)
        if (!match) return false
      }

      return true
    })
  }, [reviews, serviceFilter, ratingFilter, statusFilter, search])

  // Aggregate stats across all reviews
  const stats = useMemo(() => {
    const total = reviews.length
    const published = reviews.filter((r) => (r.status || 'published') === 'published')
    const hidden = reviews.filter((r) => r.status === 'hidden').length
    const fiveStar = reviews.filter((r) => Number(r.rating) === 5).length

    const sum = published.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    const avg = published.length ? (sum / published.length).toFixed(1) : '—'

    return {
      total,
      publishedCount: published.length,
      hiddenCount: hidden,
      fiveStarCount: fiveStar,
      avgRating: avg,
    }
  }, [reviews])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reviews & Ratings"
        subtitle="Manage customer feedback, ratings, and moderation across all completed bookings."
      />

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Total Reviews
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.total}
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              ({stats.publishedCount} active)
            </span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Average Rating
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white">
              {stats.avgRating}
            </span>
            <Star className="size-6 fill-[#F59E0B] text-[#F59E0B]" />
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            5-Star Reviews
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
              {stats.fiveStarCount}
            </span>
            {stats.total > 0 && (
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                ({Math.round((stats.fiveStarCount / stats.total) * 100)}%)
              </span>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Moderated / Hidden
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-3xl font-black ${
                stats.hiddenCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'
              }`}
            >
              {stats.hiddenCount}
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              excluded from score
            </span>
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, booking, review..."
          />

          <Select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
          >
            <option value="ALL">All Services</option>
            {(services || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name || s.title || s.id}
              </option>
            ))}
          </Select>

          <Select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
          >
            <option value="ALL">All Star Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </Select>

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="published">Published</option>
            <option value="hidden">Hidden</option>
          </Select>
        </div>
      </Card>

      {/* Reviews Table / Cards */}
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-12 text-center text-sm text-[var(--on-surface-variant)]">
            Loading customer reviews…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="mx-auto size-12 text-slate-400 opacity-60" />
            <div className="mt-3 text-base font-bold text-slate-900 dark:text-white">
              No reviews found
            </div>
            <div className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Try adjusting your search query or filters.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Service</th>
                  <th className="px-4 py-3">Rating</th>
                  <th className="px-4 py-3">Review Comment</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((rev) => {
                  const dateStr = rev.createdAt?.toDate
                    ? rev.createdAt.toDate().toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : rev.createdAt
                      ? new Date(rev.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '—'

                  const isHidden = rev.status === 'hidden'
                  const isBusy = moderatingId === rev.id

                  return (
                    <tr
                      key={rev.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {rev.customerName || 'Customer'}
                        </div>
                        {rev.customerPhone ? (
                          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {rev.customerPhone}
                          </div>
                        ) : null}
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold">
                          <ShieldCheck className="size-3" />
                          <span>Verified Booking</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900 dark:text-white max-w-[200px] truncate">
                          {rev.serviceName || rev.serviceId || 'Service'}
                        </div>
                        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
                          Booking #{String(rev.bookingId || '').slice(-6).toUpperCase()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {rev.rating}
                          </span>
                          <Star className="size-4 fill-[#F59E0B] text-[#F59E0B]" />
                        </div>
                      </td>

                      <td className="px-4 py-3 max-w-xs">
                        {rev.comment ? (
                          <p className="line-clamp-2 text-xs font-medium text-slate-800 dark:text-slate-200">
                            &ldquo;{rev.comment}&rdquo;
                          </p>
                        ) : (
                          <span className="text-xs italic font-medium text-slate-600 dark:text-slate-400">
                            No written review
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="px-4 py-3">
                        <Badge
                          tone={isHidden ? 'neutral' : 'success'}
                          className="text-xs"
                        >
                          {isHidden ? 'Hidden' : 'Published'}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedReview(rev)}
                          >
                            Details
                          </Button>

                          {canModerate ? (
                            <Button
                              type="button"
                              variant={isHidden ? 'primary' : 'secondary'}
                              size="sm"
                              disabled={isBusy}
                              onClick={() => handleToggleStatus(rev)}
                              title={
                                isHidden
                                  ? 'Publish this review'
                                  : 'Hide review from public display'
                              }
                            >
                              {isHidden ? (
                                <>
                                  <Eye className="mr-1 size-3.5" /> Publish
                                </>
                              ) : (
                                <>
                                  <EyeOff className="mr-1 size-3.5" /> Hide
                                </>
                              )}
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Review Details Modal */}
      {selectedReview ? (
        <Modal
          open={Boolean(selectedReview)}
          onClose={() => setSelectedReview(null)}
          title="Customer Review Details"
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between border-b border-[var(--outline-variant)]/40 pb-3">
              <div>
                <div className="text-base font-bold text-slate-900 dark:text-white">
                  {selectedReview.customerName || 'Customer'}
                </div>
                <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  {selectedReview.customerPhone || 'No phone recorded'}
                </div>
              </div>
              <Badge
                tone={selectedReview.status === 'hidden' ? 'neutral' : 'success'}
              >
                {selectedReview.status === 'hidden' ? 'Hidden' : 'Published'}
              </Badge>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Service
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  {selectedReview.serviceName || selectedReview.serviceId || 'Service'}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Booking Reference
                </span>
                <p className="font-semibold text-slate-900 dark:text-white">
                  #{String(selectedReview.bookingId || '').toUpperCase()}
                </p>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Rating
                </span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-lg font-black text-slate-900 dark:text-white">
                    {selectedReview.rating} / 5
                  </span>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`size-4 ${
                          s <= Number(selectedReview.rating)
                            ? 'fill-[#F59E0B] text-[#F59E0B]'
                            : 'fill-gray-200 text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Verification
                </span>
                <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold text-xs mt-1">
                  <CheckCircle2 className="size-4" />
                  Verified Completed Booking
                </div>
              </div>
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Review Comment
              </span>
              <div className="mt-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 text-sm font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-white italic">
                {selectedReview.comment ? (
                  `“${selectedReview.comment}”`
                ) : (
                  <span className="text-slate-600 dark:text-slate-400 not-italic font-normal">
                    No written comment provided. Customer gave a star rating only.
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-[var(--outline-variant)]/40 pt-4">
              {canModerate ? (
                <Button
                  type="button"
                  variant={selectedReview.status === 'hidden' ? 'primary' : 'secondary'}
                  disabled={moderatingId === selectedReview.id}
                  onClick={() => handleToggleStatus(selectedReview)}
                >
                  {selectedReview.status === 'hidden' ? (
                    <>
                      <Eye className="mr-1.5 size-4" /> Publish Review
                    </>
                  ) : (
                    <>
                      <EyeOff className="mr-1.5 size-4" /> Hide Review
                    </>
                  )}
                </Button>
              ) : <div />}

              <Button
                type="button"
                variant="outline"
                onClick={() => setSelectedReview(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  )
}
