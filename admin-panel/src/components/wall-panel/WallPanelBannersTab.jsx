import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, Link2, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import { serverTimestamp } from 'firebase/firestore'
import { Button, Card, Field, Input, Modal, Textarea, Badge } from '../ui'
import { setDocumentReplace, removeDoc } from '../../services/firestore'
import { uploadToCloudinary } from '../../services/cloudinary'

const emptyBannerForm = {
  id: '',
  title: '',
  subtitle: '',
  imageUrl: '',
  ctaText: 'Book Consultation – ₹49',
  ctaLink: '/wall-panel/book',
  active: true,
  sortOrder: '1',
}

export function WallPanelBannersTab({ banners = [], onReload }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyBannerForm)
  const [busy, setBusy] = useState(false)
  const [imageInputMode, setImageInputMode] = useState('upload')
  const [urlInput, setUrlInput] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  const handleOpenCreate = () => {
    setForm({
      ...emptyBannerForm,
      sortOrder: String(banners.length + 1),
    })
    setUrlInput('')
    setImageInputMode('upload')
    setOpen(true)
  }

  const handleOpenEdit = (b) => {
    setForm({
      id: b.id,
      title: b.title || '',
      subtitle: b.subtitle || '',
      imageUrl: b.imageUrl || '',
      ctaText: b.ctaText || 'Book Consultation – ₹49',
      ctaLink: b.ctaLink || '/wall-panel/book',
      active: b.active !== false,
      sortOrder: String(b.sortOrder ?? 0),
    })
    setUrlInput(b.imageUrl || '')
    setOpen(true)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setUploadProgress('Uploading banner to Cloudinary...')
    try {
      const url = await uploadToCloudinary(file)
      setForm((p) => ({ ...p, imageUrl: url }))
      toast.success('Banner photo uploaded!')
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setBusy(false)
      setUploadProgress('')
    }
  }

  const handleApplyUrl = (e) => {
    e?.preventDefault()
    if (!urlInput.trim()) return
    setForm((p) => ({ ...p, imageUrl: urlInput.trim() }))
    toast.success('Banner URL applied!')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.imageUrl) {
      toast.error('Banner image is required')
      return
    }

    const id = form.id || `banner-${Date.now()}`
    setBusy(true)
    try {
      await setDocumentReplace('wallPanelBanners', id, {
        id,
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        imageUrl: form.imageUrl,
        ctaText: form.ctaText.trim(),
        ctaLink: form.ctaLink.trim(),
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
        updatedAt: serverTimestamp(),
      })

      toast.success('Hero banner saved!')
      setOpen(false)
      onReload?.()
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleActive = async (b) => {
    try {
      await setDocumentReplace('wallPanelBanners', b.id, {
        ...b,
        active: b.active === false,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Banner is now ${b.active === false ? 'Active' : 'Hidden'}`)
      onReload?.()
    } catch {
      toast.error('Status update failed')
    }
  }

  const handleDelete = async (b) => {
    if (!window.confirm('Delete this hero banner?')) return
    try {
      await removeDoc('wallPanelBanners', b.id)
      toast.success('Banner deleted')
      onReload?.()
    } catch {
      toast.error('Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Wall Panel Hero Banners
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#C45508] dark:bg-orange-950/60 dark:text-orange-300">
              {banners.length} slides
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Slideshow shown at the top of the Wall Panels Studio screen (/wall-panel).
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#C45508] hover:bg-[#A84504] text-white">
          <Plus className="size-4 mr-1.5" />
          Add Hero Banner
        </Button>
      </div>

      {banners.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-slate-500">
            No hero banners configured. Click "Add Hero Banner" or "Seed Showcase Data" above.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {banners.map((b, idx) => (
            <div
              key={b.id}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              <div className="relative aspect-[16/8] w-full overflow-hidden bg-slate-900">
                <img src={b.imageUrl} alt={b.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/20" />

                <div className="absolute top-2.5 right-2.5">
                  <Badge tone={b.active !== false ? 'success' : 'neutral'} size="sm">
                    {b.active !== false ? 'Active' : 'Hidden'}
                  </Badge>
                </div>

                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                  Slide #{b.sortOrder ?? idx + 1}
                </div>

                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="font-extrabold text-lg leading-tight drop-shadow-md">
                    {b.title || 'Architectural Wall Panels'}
                  </h3>
                  {b.subtitle ? (
                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">{b.subtitle}</p>
                  ) : null}
                  {b.ctaText ? (
                    <span className="inline-block mt-2 px-3 py-1 rounded-lg bg-[#C45508] text-white text-xs font-bold shadow-sm">
                      {b.ctaText}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="p-3.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 truncate max-w-[200px]">
                  Link: {b.ctaLink || '/wall-panel/book'}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(b)}
                    className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {b.active !== false ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-slate-400" />}
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(b)}>
                    <Edit2 className="size-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(b)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Banner Modal */}
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={form.id ? 'Edit Hero Banner' : 'Create Hero Banner'}
        className="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Banner Title">
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Luxury Wall Panels & Architectural Studio"
            />
          </Field>

          <Field label="Banner Subtitle">
            <Textarea
              value={form.subtitle}
              onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
              placeholder="Architect-grade acoustic fluting, charcoal louvers & Italian marble acrylics."
              rows={2}
            />
          </Field>

          {/* Image */}
          <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                Banner Image *
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded-lg ${
                    imageInputMode === 'upload' ? 'bg-[#C45508] text-white font-bold' : 'bg-white border'
                  }`}
                >
                  <Upload className="size-3 inline mr-1" /> File
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded-lg ${
                    imageInputMode === 'url' ? 'bg-[#C45508] text-white font-bold' : 'bg-white border'
                  }`}
                >
                  <Link2 className="size-3 inline mr-1" /> URL
                </button>
              </div>
            </div>

            {imageInputMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:bg-[#C45508] file:text-white file:border-0"
                />
                {uploadProgress ? <p className="text-xs text-[#C45508] mt-1">{uploadProgress}</p> : null}
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://..."
                  className="text-xs"
                />
                <Button size="sm" type="button" onClick={handleApplyUrl} variant="secondary">
                  Apply
                </Button>
              </div>
            )}

            {form.imageUrl ? (
              <img
                src={form.imageUrl}
                alt="Banner Preview"
                className="mt-2 h-36 w-full object-cover rounded-xl"
              />
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Button CTA Text">
              <Input
                value={form.ctaText}
                onChange={(e) => setForm((p) => ({ ...p, ctaText: e.target.value }))}
                placeholder="Book Consultation – ₹49"
              />
            </Field>

            <Field label="Button CTA Link">
              <Input
                value={form.ctaLink}
                onChange={(e) => setForm((p) => ({ ...p, ctaLink: e.target.value }))}
                placeholder="/wall-panel/book"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Sort Order">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                placeholder="1"
              />
            </Field>

            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="banner-active"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                className="size-4 accent-[#C45508]"
              />
              <label htmlFor="banner-active" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Active Slide
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} className="bg-[#C45508] hover:bg-[#A84504] text-white">
              Save Banner
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
