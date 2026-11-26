import React, { useState } from 'react'
import { Plus, Edit2, Trash2, Eye, EyeOff, Upload, Link2, ArrowUp, ArrowDown, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { serverTimestamp } from 'firebase/firestore'
import { Button, Card, Field, Input, Modal, Textarea, Badge } from '../ui'
import { setDocumentReplace, removeDoc } from '../../services/firestore'
import { uploadToCloudinary } from '../../services/cloudinary'

const emptyCategoryForm = {
  id: '',
  name: '',
  title: '',
  description: '',
  image: '',
  tags: '',
  active: true,
  sortOrder: '1',
}

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48)
}

export function WallPanelCategoriesTab({ categories = [], onReload }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyCategoryForm)
  const [busy, setBusy] = useState(false)
  const [imageInputMode, setImageInputMode] = useState('upload') // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  const handleOpenCreate = () => {
    setForm({
      ...emptyCategoryForm,
      sortOrder: String(categories.length + 1),
    })
    setUrlInput('')
    setImageInputMode('upload')
    setOpen(true)
  }

  const handleOpenEdit = (cat) => {
    setForm({
      id: cat.id,
      name: cat.name || cat.title || '',
      title: cat.title || cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      tags: Array.isArray(cat.tags) ? cat.tags.join(', ') : '',
      active: cat.active !== false,
      sortOrder: String(cat.sortOrder ?? 0),
    })
    setUrlInput(cat.image || '')
    setOpen(true)
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    setBusy(true)
    setUploadProgress('Uploading to Cloudinary...')
    try {
      const url = await uploadToCloudinary(file)
      setForm((prev) => ({ ...prev, image: url }))
      toast.success('Category image uploaded!')
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setBusy(false)
      setUploadProgress('')
    }
  }

  const handleApplyUrl = (e) => {
    e?.preventDefault()
    const clean = urlInput.trim()
    if (!clean) {
      toast.error('Enter an image URL')
      return
    }
    setForm((prev) => ({ ...prev, image: clean }))
    toast.success('Image URL set!')
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const name = form.name.trim()
    const title = form.title.trim() || name
    const id = form.id || slugify(name)

    if (!name || !id) {
      toast.error('Category name is required')
      return
    }
    if (!form.image) {
      toast.error('Please upload or set an image for this category')
      return
    }

    setBusy(true)
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      await setDocumentReplace('wallPanelCategories', id, {
        id,
        name,
        title,
        description: form.description.trim(),
        image: form.image,
        tags,
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
        updatedAt: serverTimestamp(),
      })

      toast.success(`Category "${name}" saved!`)
      setOpen(false)
      onReload?.()
    } catch (err) {
      toast.error(err?.message || 'Could not save category')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleActive = async (cat) => {
    try {
      await setDocumentReplace('wallPanelCategories', cat.id, {
        ...cat,
        active: cat.active === false,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Category "${cat.name}" is now ${cat.active === false ? 'Active' : 'Hidden'}`)
      onReload?.()
    } catch (err) {
      toast.error(err?.message || 'Could not update status')
    }
  }

  const handleDelete = async (cat) => {
    if (!window.confirm(`Delete category "${cat.name}"? Products will retain their records.`)) return
    try {
      await removeDoc('wallPanelCategories', cat.id)
      toast.success('Category deleted')
      onReload?.()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  const handleMoveSort = async (index, direction) => {
    const targetIdx = index + direction
    if (targetIdx < 0 || targetIdx >= categories.length) return
    const current = categories[index]
    const target = categories[targetIdx]

    try {
      await setDocumentReplace('wallPanelCategories', current.id, {
        ...current,
        sortOrder: target.sortOrder ?? targetIdx,
        updatedAt: serverTimestamp(),
      })
      await setDocumentReplace('wallPanelCategories', target.id, {
        ...target,
        sortOrder: current.sortOrder ?? index,
        updatedAt: serverTimestamp(),
      })
      onReload?.()
    } catch (err) {
      toast.error('Could not reorder')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Wall Panel Categories
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#C45508] dark:bg-orange-950/60 dark:text-orange-300">
              {categories.length} total
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Categories group your designs and power dedicated browsing pages (/wall-panel/category/[id]).
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#C45508] hover:bg-[#A84504] text-white">
          <Plus className="size-4 mr-1.5" />
          Add Category
        </Button>
      </div>

      {/* Grid of Categories */}
      {categories.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-slate-500">No categories found. Click "Add Category" or "Seed Showcase Data" above.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat, idx) => (
            <div
              key={cat.id}
              className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
            >
              {/* Image Preview with overlay title */}
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                    No image
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />

                {/* Status Badge */}
                <div className="absolute top-2.5 right-2.5">
                  <Badge tone={cat.active !== false ? 'success' : 'neutral'} size="sm">
                    {cat.active !== false ? 'Active' : 'Hidden'}
                  </Badge>
                </div>

                {/* Sort Order Badge */}
                <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/20">
                  #{cat.sortOrder ?? idx + 1}
                </div>

                {/* Title overlay at bottom-left */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-bold text-base leading-tight drop-shadow-md">
                    {cat.name || cat.title}
                  </h3>
                  <p className="text-[11px] text-white/80 line-clamp-1 mt-0.5">
                    {cat.description || 'Dedicated collection'}
                  </p>
                </div>
              </div>

              {/* Tags and Controls */}
              <div className="p-3.5 flex-1 flex flex-col justify-between gap-3">
                {cat.tags?.length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {cat.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {/* Action buttons */}
                <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2.5">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveSort(idx, -1)}
                      title="Move Up"
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === categories.length - 1}
                      onClick={() => handleMoveSort(idx, 1)}
                      title="Move Down"
                      className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(cat)}
                      title={cat.active !== false ? 'Hide from store' : 'Publish'}
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                    >
                      {cat.active !== false ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-slate-400" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(cat)}
                      title="Edit Category"
                      className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                    >
                      <Edit2 className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(cat)}
                      title="Delete Category"
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Modal */}
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={form.id ? `Edit Category: ${form.name}` : 'Create Wall Panel Category'}
        className="max-w-xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Field label="Category Name" required description="Appears on cards and section headers">
            <Input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Wooden Louvers"
              required
            />
          </Field>

          <Field label="Custom Title (Optional)" description="Customized heading on category landing page">
            <Input
              value={form.title}
              onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. Solid Natural Timber Louvers"
            />
          </Field>

          <Field label="Category Description">
            <Textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="High-density fluted natural timber slats with acoustic felt backing..."
              rows={3}
            />
          </Field>

          {/* Image Upload / URL Selector */}
          <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Cover Photo *
              </span>
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setImageInputMode('upload')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    imageInputMode === 'upload'
                      ? 'bg-[#C45508] text-white font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Upload className="size-3 inline mr-1" />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageInputMode('url')}
                  className={`px-2.5 py-1 rounded-lg transition-colors ${
                    imageInputMode === 'url'
                      ? 'bg-[#C45508] text-white font-bold'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <Link2 className="size-3 inline mr-1" />
                  Image URL
                </button>
              </div>
            </div>

            {imageInputMode === 'upload' ? (
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={busy}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#C45508] file:text-white hover:file:bg-[#A84504] cursor-pointer"
                />
                {uploadProgress ? (
                  <p className="text-xs text-[#C45508] font-semibold mt-1.5">{uploadProgress}</p>
                ) : null}
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="text-xs"
                />
                <Button type="button" size="sm" onClick={handleApplyUrl} variant="secondary">
                  Apply
                </Button>
              </div>
            )}

            {form.image ? (
              <div className="relative mt-2 aspect-[16/9] w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                <img src={form.image} alt="Preview" className="h-full w-full object-cover" />
                <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Cover Ready
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Tags (comma-separated)">
              <Input
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="Wooden, Louvers, Acoustic"
              />
            </Field>

            <Field label="Display Sort Order">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                placeholder="1"
              />
            </Field>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="cat-active"
              checked={form.active}
              onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
              className="size-4 rounded accent-[#C45508] cursor-pointer"
            />
            <label htmlFor="cat-active" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
              Visible on Wall Panels Studio and navigation
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" loading={busy} className="bg-[#C45508] hover:bg-[#A84504] text-white">
              Save Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
