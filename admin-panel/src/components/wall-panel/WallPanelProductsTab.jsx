import React, { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Link2,
  ArrowUp,
  ArrowDown,
  Layers,
  Lightbulb,
  Shield,
  Palette,
  Hammer,
  Sparkles,
  Box,
  Star,
  CheckCircle2,
  Image as ImageIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { serverTimestamp } from 'firebase/firestore'
import { Button, Card, Field, Input, Modal, Textarea, Badge, Select } from '../ui'
import { websiteApiOrigin } from '../../services/websiteOrigin'
import { setDocumentReplace, removeDoc } from '../../services/firestore'
import { uploadToCloudinary } from '../../services/cloudinary'

const AVAILABLE_ICONS = [
  { id: 'layers', label: 'Layers (Panels)', icon: Layers },
  { id: 'lightbulb', label: 'Lightbulb (Lighting)', icon: Lightbulb },
  { id: 'shield', label: 'Shield (Edge / Protection)', icon: Shield },
  { id: 'palette', label: 'Palette (Inlays / Finish)', icon: Palette },
  { id: 'hammer', label: 'Hammer (Fitting / Structure)', icon: Hammer },
  { id: 'sparkles', label: 'Sparkles (Acoustic / Luxury)', icon: Sparkles },
  { id: 'box', label: 'Box (Accessories)', icon: Box },
]

const emptyProductForm = {
  id: '',
  title: '',
  name: '',
  tagline: '',
  categoryId: '',
  categoryName: '',
  price: '16999',
  dimensions: '9.5 × 6 ft wall',
  description: '',
  tags: '',
  images: [],
  components: [
    {
      id: 'comp-base',
      name: 'Base Wall Design',
      description: 'Standard high-density panels with precision interlocking.',
      icon: 'layers',
      price: '16999',
      isDefault: true,
    },
  ],
  similarProductIds: [],
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

export function WallPanelProductsTab({ products = [], categories = [], onReload }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyProductForm)
  const [busy, setBusy] = useState(false)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')

  // Image management state
  const [imageInputMode, setImageInputMode] = useState('upload')
  const [urlInput, setUrlInput] = useState('')
  const [uploadProgress, setUploadProgress] = useState('')

  // New component temporary form
  const [newComp, setNewComp] = useState({
    name: '',
    price: '',
    description: '',
    icon: 'lightbulb',
    isDefault: false,
  })

  const filteredProducts = products.filter((p) => {
    const matchCat = filterCategory === 'all' || p.categoryId === filterCategory
    const matchSearch =
      !search ||
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.tagline?.toLowerCase().includes(search.toLowerCase()) ||
      p.tags?.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    return matchCat && matchSearch
  })

  const handleOpenCreate = () => {
    const defaultCat = categories[0] || { id: '', name: '' }
    setForm({
      ...emptyProductForm,
      categoryId: defaultCat.id,
      categoryName: defaultCat.name || defaultCat.title || '',
      sortOrder: String(products.length + 1),
      images: [],
    })
    setUrlInput('')
    setImageInputMode('upload')
    setOpen(true)
  }

  const handleOpenEdit = (prod) => {
    const images = Array.isArray(prod.images) ? [...prod.images] : prod.imageUrl ? [prod.imageUrl] : []
    const comps = Array.isArray(prod.components) && prod.components.length
      ? prod.components.map((c) => ({
          ...c,
          price: String(c.price ?? ''),
          isDefault: Boolean(c.isDefault),
        }))
      : [
          {
            id: 'comp-base',
            name: 'Base Wall Design',
            description: 'Standard panels with interlocking system',
            icon: 'layers',
            price: String(prod.price || 16999),
            isDefault: true,
          },
        ]

    setForm({
      id: prod.id,
      title: prod.title || prod.name || '',
      name: prod.name || prod.title || '',
      tagline: prod.tagline || '',
      categoryId: prod.categoryId || categories[0]?.id || '',
      categoryName: prod.categoryName || '',
      price: String(prod.price ?? '16999'),
      dimensions: prod.dimensions || '9.5 × 6 ft wall',
      description: prod.description || '',
      tags: Array.isArray(prod.tags) ? prod.tags.join(', ') : '',
      images,
      components: comps,
      similarProductIds: Array.isArray(prod.similarProductIds) ? prod.similarProductIds : [],
      active: prod.active !== false,
      sortOrder: String(prod.sortOrder ?? 0),
    })
    setUrlInput('')
    setOpen(true)
  }

  // --- Image Handlers ---
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setBusy(true)
    const newUrls = []
    try {
      for (let i = 0; i < files.length; i++) {
        setUploadProgress(`Uploading photo ${i + 1} of ${files.length}...`)
        const url = await uploadToCloudinary(files[i])
        newUrls.push(url)
      }
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newUrls],
      }))
      toast.success(`${newUrls.length} image(s) uploaded!`)
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
    if (!clean) return
    setForm((prev) => ({
      ...prev,
      images: [...prev.images, clean],
    }))
    setUrlInput('')
    toast.success('Image URL added to gallery')
  }

  const handleRemoveImage = (index) => {
    setForm((prev) => {
      const next = [...prev.images]
      next.splice(index, 1)
      return { ...prev, images: next }
    })
  }

  const handleSetCover = (index) => {
    setForm((prev) => {
      const next = [...prev.images]
      const [chosen] = next.splice(index, 1)
      next.unshift(chosen)
      return { ...prev, images: next }
    })
    toast.success('Set as primary cover image')
  }

  const handleMoveImage = (index, dir) => {
    setForm((prev) => {
      const next = [...prev.images]
      const target = index + dir
      if (target < 0 || target >= next.length) return prev
      const temp = next[index]
      next[index] = next[target]
      next[target] = temp
      return { ...prev, images: next }
    })
  }

  // --- Component Handlers ---
  const handleAddComponent = () => {
    const name = newComp.name.trim()
    if (!name) {
      toast.error('Component name is required')
      return
    }
    const priceNum = Number(newComp.price) || 0
    const id = `comp-${slugify(name)}-${Date.now()}`

    setForm((prev) => ({
      ...prev,
      components: [
        ...prev.components,
        {
          id,
          name,
          price: String(priceNum),
          description: newComp.description.trim(),
          icon: newComp.icon || 'lightbulb',
          isDefault: Boolean(newComp.isDefault),
        },
      ],
    }))

    setNewComp({
      name: '',
      price: '',
      description: '',
      icon: 'lightbulb',
      isDefault: false,
    })
    toast.success(`Component "${name}" added!`)
  }

  const handleRemoveComponent = (id) => {
    setForm((prev) => {
      // Keep at least one base component
      if (prev.components.length <= 1) {
        toast.error('Each product must have at least one base component')
        return prev
      }
      return {
        ...prev,
        components: prev.components.filter((c) => c.id !== id),
      }
    })
  }

  // --- Similar Products toggle ---
  const handleToggleSimilarProduct = (prodId) => {
    setForm((prev) => {
      const set = new Set(prev.similarProductIds)
      if (set.has(prodId)) {
        set.delete(prodId)
      } else {
        set.add(prodId)
      }
      return { ...prev, similarProductIds: Array.from(set) }
    })
  }

  // --- Save Product ---
  const handleSave = async (e) => {
    e.preventDefault()
    const title = form.title.trim()
    const id = form.id || slugify(title)

    if (!title || !id) {
      toast.error('Product title is required')
      return
    }
    if (!form.images.length) {
      toast.error('Add at least one product photo')
      return
    }

    const cat = categories.find((c) => c.id === form.categoryId)
    const categoryName = cat?.name || cat?.title || form.categoryName || 'General'

    setBusy(true)
    try {
      const tags = form.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const parsedComponents = form.components.map((c, i) => ({
        id: c.id || `comp-${i}`,
        name: c.name,
        price: Number(c.price) || 0,
        description: c.description || '',
        icon: c.icon || 'layers',
        isDefault: Boolean(c.isDefault),
      }))

      await setDocumentReplace('wallPanelProducts', id, {
        id,
        title,
        name: title,
        tagline: form.tagline.trim(),
        categoryId: form.categoryId,
        categoryName,
        price: Number(form.price) || 16999,
        dimensions: form.dimensions.trim() || '9.5 × 6 ft wall',
        description: form.description.trim(),
        tags,
        images: form.images,
        imageUrl: form.images[0] || '',
        components: parsedComponents,
        similarProductIds: form.similarProductIds,
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
        updatedAt: serverTimestamp(),
      })

      toast.success(`Product "${title}" saved successfully!`)
      setOpen(false)
      onReload?.()
    } catch (err) {
      toast.error(err?.message || 'Could not save product')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleActive = async (prod) => {
    try {
      await setDocumentReplace('wallPanelProducts', prod.id, {
        ...prod,
        active: prod.active === false,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Product "${prod.title}" is now ${prod.active === false ? 'Active' : 'Hidden'}`)
      onReload?.()
    } catch (err) {
      toast.error(err?.message || 'Status update failed')
    }
  }

  const handleDelete = async (prod) => {
    if (!window.confirm(`Delete product "${prod.title}" permanently?`)) return
    try {
      await removeDoc('wallPanelProducts', prod.id)
      toast.success('Product deleted')
      onReload?.()
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title, tagline, tags..."
            className="w-full sm:w-72 text-xs"
          />
          <Select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full sm:w-56 text-xs"
          >
            <option value="all">All Categories ({products.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.title}
              </option>
            ))}
          </Select>
        </div>

        <Button onClick={handleOpenCreate} className="bg-[#C45508] hover:bg-[#A84504] text-white">
          <Plus className="size-4 mr-1.5" />
          Add Product Design
        </Button>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-slate-500">
            {products.length === 0
              ? 'No products found. Click "Add Product Design" or "Seed Showcase Data" above.'
              : 'No products match your search or filter.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredProducts.map((prod, idx) => {
            const coverImage = prod.images?.[0] || prod.imageUrl || ''
            return (
              <div
                key={prod.id}
                className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
              >
                {/* Product Cover and Slideshow Indicators */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {coverImage ? (
                    <img
                      src={coverImage}
                      alt={prod.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-slate-400">
                      No photo
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                  {/* Active Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <Badge tone={prod.active !== false ? 'success' : 'neutral'} size="sm">
                      {prod.active !== false ? 'Active' : 'Hidden'}
                    </Badge>
                  </div>

                  {/* Photo Count Pill */}
                  <div className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2 py-0.5 rounded-md border border-white/20 flex items-center gap-1">
                    <ImageIcon className="size-3" />
                    <span>{prod.images?.length || 1} photos</span>
                  </div>

                  {/* Category Pill at bottom left */}
                  <div className="absolute bottom-2.5 left-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white/90 text-slate-900 px-2 py-0.5 rounded-full shadow-xs">
                      {prod.categoryName || 'Wall Panel'}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">
                      {prod.title || prod.name}
                    </h3>
                    {prod.tagline ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                        {prod.tagline}
                      </p>
                    ) : null}

                    {/* Price and Dimensions Highlight */}
                    <div className="mt-2.5 flex items-baseline gap-1.5">
                      <span className="text-xs font-semibold text-slate-500">Starts at</span>
                      <span className="text-base font-extrabold text-[#C45508]">
                        ₹{Number(prod.price || 0).toLocaleString('en-IN')}
                      </span>
                      {prod.dimensions ? (
                        <span className="text-xs text-slate-500">for {prod.dimensions}</span>
                      ) : null}
                    </div>

                    {/* Configurable Components count & tags */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 text-[11px] font-bold text-[#C45508] border border-orange-200 dark:border-orange-900/60">
                        {prod.components?.length || 1} components
                      </span>
                      {prod.tags?.slice(0, 2).map((t) => (
                        <span
                          key={t}
                          className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-3">
                    <a
                      href={`${websiteApiOrigin()}/wall-panel/${prod.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#C45508] hover:underline"
                    >
                      View on Store →
                    </a>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleToggleActive(prod)}
                        title={prod.active !== false ? 'Hide from website' : 'Make Active'}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer"
                      >
                        {prod.active !== false ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-slate-400" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(prod)}
                        title="Edit Product"
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 cursor-pointer"
                      >
                        <Edit2 className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(prod)}
                        title="Delete Product"
                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-600 dark:hover:bg-rose-950/40 cursor-pointer"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit / Create Product Modal */}
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={form.id ? `Edit Design: ${form.title}` : 'Add Wall Panel Design'}
        className="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          {/* 1. Basic Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              1. Basic Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Design Title *" required>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Noir Radiance Fluted Accent"
                  required
                />
              </Field>

              <Field label="Category *">
                <Select
                  value={form.categoryId}
                  onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.title}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>

            <Field label="Tagline / Short Subtitle" description="Displayed prominently below the title on product card & details">
              <Input
                value={form.tagline}
                onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                placeholder="Matte charcoal polymer flutes with integrated warm cove lighting channel."
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Starting Price (₹) *" required>
                <Input
                  type="number"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="16999"
                  required
                />
              </Field>

              <Field label="Dimensions Tagline *" required description="E.g. 'for 9.5 × 6 ft wall'">
                <Input
                  value={form.dimensions}
                  onChange={(e) => setForm((p) => ({ ...p, dimensions: e.target.value }))}
                  placeholder="9.5 × 6 ft wall"
                  required
                />
              </Field>
            </div>

            <Field label="Full Description">
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Full details of construction, acoustic dampening, materials, warranty, and installation..."
                rows={3}
              />
            </Field>

            <Field label="Tags (comma-separated)">
              <Input
                value={form.tags}
                onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="Charcoal, Fluted, Cove Lighting, Waterproof, Living Room"
              />
            </Field>
          </div>

          {/* 2. Photo Slideshow Gallery */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              2. Product Image Slideshow Gallery ({form.images.length} photos)
            </h4>

            {/* Upload or Add by URL */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Add Photos
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
                    Add URL
                  </button>
                </div>
              </div>

              {imageInputMode === 'upload' ? (
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
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
                    placeholder="https://images.unsplash.com/photo-..."
                    className="text-xs"
                  />
                  <Button type="button" size="sm" onClick={handleApplyUrl} variant="secondary">
                    Add
                  </Button>
                </div>
              )}

              {/* Gallery Image Thumbnails */}
              {form.images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {form.images.map((url, i) => (
                    <div
                      key={i}
                      className="group/img relative aspect-[4/3] rounded-xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-slate-900"
                    >
                      <img src={url} alt={`Slide ${i + 1}`} className="h-full w-full object-cover" />
                      {i === 0 ? (
                        <div className="absolute top-1 left-1 bg-[#C45508] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                          <Star className="size-2.5 fill-white" /> Cover
                        </div>
                      ) : null}

                      {/* Hover overlay actions */}
                      <div className="absolute inset-0 bg-black/75 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(i)}
                            className="p-1 rounded bg-rose-600 text-white hover:bg-rose-700"
                            title="Remove Photo"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between text-white text-[10px]">
                          {i !== 0 ? (
                            <button
                              type="button"
                              onClick={() => handleSetCover(i)}
                              className="px-1.5 py-0.5 rounded bg-emerald-600 font-bold hover:bg-emerald-700"
                            >
                              Make Cover
                            </button>
                          ) : (
                            <span />
                          )}
                          <div className="flex gap-0.5">
                            <button
                              type="button"
                              disabled={i === 0}
                              onClick={() => handleMoveImage(i, -1)}
                              className="p-1 bg-white/20 rounded hover:bg-white/40 disabled:opacity-20"
                            >
                              ←
                            </button>
                            <button
                              type="button"
                              disabled={i === form.images.length - 1}
                              onClick={() => handleMoveImage(i, 1)}
                              className="p-1 bg-white/20 rounded hover:bg-white/40 disabled:opacity-20"
                            >
                              →
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No images added yet.</p>
              )}
            </div>
          </div>

          {/* 3. Configurable Components / Items */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              3. Configurable Wall Components & Add-ons
            </h4>
            <p className="text-xs text-slate-500">
              Customers can check/uncheck these components on the product detail page to customize their design quotation.
            </p>

            {/* List of existing components */}
            <div className="space-y-2.5">
              {form.components.map((comp, idx) => {
                const IconComp =
                  AVAILABLE_ICONS.find((ic) => ic.id === comp.icon)?.icon || Layers
                return (
                  <div
                    key={comp.id || idx}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-xl bg-orange-50 dark:bg-orange-950/60 text-[#C45508] flex items-center justify-center border border-orange-200 dark:border-orange-900">
                        <IconComp className="size-4.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {comp.name}
                          </span>
                          {comp.isDefault ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300">
                              Selected by Default
                            </span>
                          ) : null}
                        </div>
                        {comp.description ? (
                          <p className="text-xs text-slate-500 line-clamp-1">{comp.description}</p>
                        ) : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-[#C45508]">
                        ₹{Number(comp.price || 0).toLocaleString('en-IN')}
                      </span>
                      {form.components.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => handleRemoveComponent(comp.id)}
                          className="p-1 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Remove Component"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Add new component box */}
            <div className="p-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                + Add Another Component (e.g. Cove Light, Trims, Acoustic Felt)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <Input
                  value={newComp.name}
                  onChange={(e) => setNewComp((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Component Name (e.g. Cove Light)"
                  className="text-xs"
                />
                <Input
                  type="number"
                  value={newComp.price}
                  onChange={(e) => setNewComp((p) => ({ ...p, price: e.target.value }))}
                  placeholder="Price in ₹ (e.g. 2499)"
                  className="text-xs"
                />
                <Select
                  value={newComp.icon}
                  onChange={(e) => setNewComp((p) => ({ ...p, icon: e.target.value }))}
                  className="text-xs"
                >
                  {AVAILABLE_ICONS.map((ic) => (
                    <option key={ic.id} value={ic.id}>
                      {ic.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Input
                  value={newComp.description}
                  onChange={(e) => setNewComp((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Description of material / specification..."
                  className="text-xs flex-1"
                />
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newComp.isDefault}
                      onChange={(e) => setNewComp((p) => ({ ...p, isDefault: e.target.checked }))}
                      className="size-3.5 accent-[#C45508]"
                    />
                    Default
                  </label>
                  <Button type="button" size="sm" onClick={handleAddComponent} variant="secondary">
                    Add
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Similar Products Selection */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 border-b pb-1">
              4. Similar Products ("Explore Similar Looks")
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-44 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl">
              {products
                .filter((p) => p.id !== form.id)
                .map((p) => {
                  const isChecked = form.similarProductIds.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      onClick={() => handleToggleSimilarProduct(p.id)}
                      className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-[#C45508] bg-orange-50/50 text-[#C45508] font-bold dark:bg-orange-950/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="size-3.5 accent-[#C45508]"
                      />
                      <span className="truncate">{p.title || p.name}</span>
                    </label>
                  )
                })}
            </div>
          </div>

          {/* 5. Visibility and Save */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="prod-active"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                className="size-4 accent-[#C45508]"
              />
              <label htmlFor="prod-active" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Publish Design (Active)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" loading={busy} className="bg-[#C45508] hover:bg-[#A84504] text-white">
                Save Product
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  )
}
