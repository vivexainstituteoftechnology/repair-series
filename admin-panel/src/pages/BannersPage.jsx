import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Upload, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, Field, Input, Modal, PageHeader, SearchInput, Select } from '../components/ui'
import { BANNER_SECTION_LABELS, BANNER_SECTIONS, normalizeBannerSection } from '../constants/catalog'
import { BANNER_CLICK_ACTIONS } from '../constants/homeSections'
import { uploadToCloudinary } from '../services/cloudinary'
import { useApp } from '../context/useApp'
import { catalogTitle } from '../utils/catalogHierarchy'

const emptyForm = () => ({
  id: '',
  title: '',
  section: 'home',
  mobileImage: '',
  websiteImage: '',
  image: '',
  redirectLink: '',
  displayOrder: 0,
  enabled: true,
  startAt: '',
  endAt: '',
  serviceTypeId: '',
  categoryId: '',
  serviceId: '',
  clickAction: 'none',
  slideDuration: 3000,
})

const toDateTimeLocal = (ts) => {
  const d = ts?.toDate?.() ? ts.toDate() : ts instanceof Date ? ts : ts ? new Date(ts) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function BannersPage() {
  const { banners, loading, mutating, upsertBanner, deleteBanner, serviceTypes, categories, services } = useApp()
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [uploading, setUploading] = useState(false)
  const [mobileSourceMode, setMobileSourceMode] = useState('upload') // 'upload' | 'url'
  const [websiteSourceMode, setWebsiteSourceMode] = useState('upload') // 'upload' | 'url'

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (banners || [])
      .filter((b) => sectionFilter === 'all' || normalizeBannerSection(b.section) === sectionFilter)
      .filter((b) => {
        if (!q) return true
        const hay = [b.title, b.section, b.redirectLink, BANNER_SECTION_LABELS[b.section], b.id]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => {
        const oa = Number(a.displayOrder ?? 0)
        const ob = Number(b.displayOrder ?? 0)
        if (oa !== ob) return oa - ob
        return String(a.title || '').localeCompare(String(b.title || ''))
      })
  }, [banners, search, sectionFilter])

  const reset = () => {
    setForm(emptyForm())
    setOpen(false)
    setUploading(false)
    setMobileSourceMode('upload')
    setWebsiteSourceMode('upload')
  }

  const uploadField = async (file, field) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, {
        kind: 'banner',
        section: form.section,
        bannerId: form.id,
        slot: field,
      })
      setForm((c) => {
        const next = { ...c, [field]: url }
        if (!next.image && (field === 'mobileImage' || field === 'websiteImage')) next.image = url
        return next
      })
      toast.success(file.type === 'image/gif' ? 'Animated GIF banner uploaded.' : 'Image banner uploaded.')
    } catch (err) {
      toast.error(err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      await upsertBanner(form)
      reset()
    } catch (err) {
      toast.error(err?.message || 'Could not save banner.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners & Offers"
        description="Manage promotional banners, carousel slides, and animated GIFs for the app and website."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search banners…" />
            <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="min-w-[160px]">
              <option value="all">All sections</option>
              {BANNER_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              className="gap-2"
              onClick={() => {
                setForm(emptyForm())
                setMobileSourceMode('upload')
                setWebsiteSourceMode('upload')
                setOpen(true)
              }}
            >
              <Plus className="size-4" /> Add banner
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden p-0">
        {loading.banners ? (
          <div className="flex items-center justify-center p-12 text-sm font-medium text-slate-700 dark:text-slate-300">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold">Preview</th>
                  <th className="px-4 py-3 font-bold">Section</th>
                  <th className="px-4 py-3 font-bold">Title</th>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((row) => {
                  const enabled = row.enabled !== false
                  const thumb = row.mobileImage || row.websiteImage || row.image || row.imageUrl
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        {thumb ? (
                          <img src={thumb} alt="" className="h-12 w-24 rounded-lg object-cover" />
                        ) : (
                          <div className="flex h-12 w-24 items-center justify-center rounded-lg bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {BANNER_SECTION_LABELS[row.section] || row.section || '—'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{row.title || '—'}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{Number(row.displayOrder ?? 0)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={enabled ? 'success' : 'neutral'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                            onClick={() => {
                              setForm({
                                id: row.id,
                                title: row.title ?? '',
                                section: normalizeBannerSection(row.section || 'home'),
                                mobileImage: row.mobileImage || '',
                                websiteImage: row.websiteImage || '',
                                image: row.image || row.mobileImage || row.websiteImage || '',
                                redirectLink: row.redirectLink || '',
                                displayOrder: Number(row.displayOrder ?? 0),
                                enabled,
                                startAt: toDateTimeLocal(row.startAt),
                                endAt: toDateTimeLocal(row.endAt),
                                serviceTypeId: row.serviceTypeId || '',
                                categoryId: row.categoryId || '',
                                serviceId: row.serviceId || '',
                                clickAction: row.clickAction || (row.redirectLink ? 'external' : 'none'),
                                slideDuration: Number(row.slideDuration ?? 3000),
                              })
                              setMobileSourceMode(row.mobileImage && !row.mobileImage.includes('res.cloudinary.com') ? 'url' : 'upload')
                              setWebsiteSourceMode(row.websiteImage && !row.websiteImage.includes('res.cloudinary.com') ? 'url' : 'upload')
                              setOpen(true)
                            }}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-xl border border-slate-200 p-2 text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30"
                            disabled={Boolean(mutating.bannerDelete)}
                            onClick={async () => {
                              if (!window.confirm(`Delete banner for "${BANNER_SECTION_LABELS[row.section] || row.section}"?`)) return
                              try {
                                await deleteBanner(row.id)
                              } catch (err) {
                                toast.error(err?.message || 'Delete failed.')
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center font-medium text-slate-600 dark:text-slate-400">
                      No banners yet. Add banners for Home, Services, Bookings, Account, Categories, Coming Soon, and more.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={open} title={form.id ? 'Edit banner' : 'Add banner'} onClose={reset} className="max-w-2xl">
        <form className="space-y-4" onSubmit={submit}>
          <Field label="Section">
            <Select value={form.section} onChange={(e) => setForm((c) => ({ ...c, section: e.target.value }))} required>
              {BANNER_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Title (optional)">
            <Input value={form.title} onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))} placeholder="Summer offer" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Display order">
              <Input
                type="number"
                value={form.displayOrder}
                onChange={(e) => setForm((c) => ({ ...c, displayOrder: Number(e.target.value) || 0 }))}
              />
            </Field>
            <Field label="Status">
              <Select
                value={form.enabled ? 'true' : 'false'}
                onChange={(e) => setForm((c) => ({ ...c, enabled: e.target.value === 'true' }))}
              >
                <option value="true">Enabled</option>
                <option value="false">Disabled</option>
              </Select>
            </Field>
          </div>
          <Field label="Redirect link (optional)">
            <Input
              value={form.redirectLink}
              onChange={(e) => setForm((c) => ({ ...c, redirectLink: e.target.value }))}
              placeholder="/services or https://…"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Click action">
              <Select
                value={form.clickAction || 'none'}
                onChange={(e) => setForm((c) => ({ ...c, clickAction: e.target.value }))}
              >
                {BANNER_CLICK_ACTIONS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Slide duration (ms)">
              <Input
                type="number"
                value={form.slideDuration}
                onChange={(e) => setForm((c) => ({ ...c, slideDuration: Number(e.target.value) || 3000 }))}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Service type (optional)">
              <Select
                value={form.serviceTypeId}
                onChange={(e) => setForm((c) => ({ ...c, serviceTypeId: e.target.value, categoryId: '', serviceId: '' }))}
              >
                <option value="">Any</option>
                {(serviceTypes || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {catalogTitle(t)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Category (optional)">
              <Select
                value={form.categoryId}
                onChange={(e) => setForm((c) => ({ ...c, categoryId: e.target.value, serviceId: '' }))}
              >
                <option value="">None</option>
                {(categories || [])
                  .filter((c) => !form.serviceTypeId || String(c.serviceTypeId) === form.serviceTypeId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {catalogTitle(c)}
                    </option>
                  ))}
              </Select>
            </Field>
            <Field label="Service (optional)">
              <Select
                value={form.serviceId}
                onChange={(e) => setForm((c) => ({ ...c, serviceId: e.target.value }))}
              >
                <option value="">None</option>
                {(services || [])
                  .filter((s) => !form.serviceTypeId || String(s.serviceTypeId) === form.serviceTypeId)
                  .filter((s) => !form.categoryId || String(s.categoryId) === form.categoryId)
                  .slice(0, 200)
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {catalogTitle(s)}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start at (optional)">
              <Input
                type="datetime-local"
                value={form.startAt || ''}
                onChange={(e) => setForm((c) => ({ ...c, startAt: e.target.value }))}
              />
            </Field>
            <Field label="End at (optional)">
              <Input
                type="datetime-local"
                value={form.endAt || ''}
                onChange={(e) => setForm((c) => ({ ...c, endAt: e.target.value }))}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Mobile Image / GIF Slot */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Mobile image / GIF</div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">File upload or direct URL</div>
                </div>
                <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5 text-xs">
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md font-bold transition ${mobileSourceMode === 'upload' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                    onClick={() => setMobileSourceMode('upload')}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md font-bold transition ${mobileSourceMode === 'url' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'}`}
                    onClick={() => setMobileSourceMode('url')}
                  >
                    URL
                  </button>
                </div>
              </div>

              {mobileSourceMode === 'upload' ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
                  <input
                    className="w-full text-xs font-medium text-slate-800 dark:text-slate-200"
                    type="file"
                    accept="image/*,image/gif,.gif"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      void uploadField(file, 'mobileImage')
                    }}
                  />
                  <p className="mt-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">Supports JPEG, PNG, WebP, and animated GIF (up to 12 MB)</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    value={form.mobileImage || ''}
                    placeholder="https://… (image or .gif URL)"
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((c) => {
                        const next = { ...c, mobileImage: val }
                        if (!next.image) next.image = val
                        return next
                      })
                    }}
                    className="text-xs"
                  />
                </div>
              )}

              {form.mobileImage ? (
                <div className="relative mt-2 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
                  <img src={form.mobileImage} alt="" className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white hover:bg-black/80"
                    onClick={() =>
                      setForm((c) => {
                        const next = { ...c, mobileImage: '' }
                        if (c.image === c.mobileImage) next.image = c.websiteImage || ''
                        return next
                      })
                    }
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>

            {/* Website Image / GIF Slot */}
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/60">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">Website image / GIF</div>
                  <div className="text-xs font-medium text-slate-600 dark:text-slate-400">File upload or direct URL</div>
                </div>
                <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-700 p-0.5 text-xs">
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md font-bold transition ${websiteSourceMode === 'upload' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'}`}
                    onClick={() => setWebsiteSourceMode('upload')}
                  >
                    Upload
                  </button>
                  <button
                    type="button"
                    className={`px-2.5 py-1 rounded-md font-bold transition ${websiteSourceMode === 'url' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-700 dark:text-slate-300 hover:text-slate-900'}`}
                    onClick={() => setWebsiteSourceMode('url')}
                  >
                    URL
                  </button>
                </div>
              </div>

              {websiteSourceMode === 'upload' ? (
                <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-3">
                  <input
                    className="w-full text-xs font-medium text-slate-800 dark:text-slate-200"
                    type="file"
                    accept="image/*,image/gif,.gif"
                    disabled={uploading}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      e.target.value = ''
                      void uploadField(file, 'websiteImage')
                    }}
                  />
                  <p className="mt-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">Supports JPEG, PNG, WebP, and animated GIF (up to 12 MB)</p>
                </div>
              ) : (
                <div className="space-y-1">
                  <Input
                    value={form.websiteImage || ''}
                    placeholder="https://… (image or .gif URL)"
                    onChange={(e) => {
                      const val = e.target.value
                      setForm((c) => {
                        const next = { ...c, websiteImage: val }
                        if (!next.image) next.image = val
                        return next
                      })
                    }}
                    className="text-xs"
                  />
                </div>
              )}

              {form.websiteImage ? (
                <div className="relative mt-2 overflow-hidden rounded-xl border border-[var(--outline-variant)]">
                  <img src={form.websiteImage} alt="" className="h-28 w-full object-cover" />
                  <button
                    type="button"
                    className="absolute top-1.5 right-1.5 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] text-white hover:bg-black/80"
                    onClick={() =>
                      setForm((c) => {
                        const next = { ...c, websiteImage: '' }
                        if (c.image === c.websiteImage) next.image = c.mobileImage || ''
                        return next
                      })
                    }
                  >
                    Clear
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={reset}>
              Cancel
            </Button>
            <Button type="submit" disabled={uploading || Boolean(mutating.banner)}>
              {uploading || mutating.banner ? 'Saving…' : 'Save banner'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
