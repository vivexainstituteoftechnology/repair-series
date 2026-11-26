import React, { useState } from 'react'
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Sliders,
  LayoutGrid,
  List,
  Layers,
  ArrowUp,
  ArrowDown,
  Upload,
  Link2,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { serverTimestamp } from 'firebase/firestore'
import { Button, Card, Field, Input, Modal, Select, Badge } from '../ui'
import { setDocumentReplace, removeDoc } from '../../services/firestore'
import { uploadToCloudinary } from '../../services/cloudinary'

const DISPLAY_TYPES = [
  { id: 'slider', label: 'Horizontal Slider', icon: Sliders },
  { id: 'slideshow', label: 'Slideshow / Banner', icon: Layers },
  { id: 'grid', label: 'Grid (2 or 4 Column)', icon: LayoutGrid },
  { id: 'list', label: 'Vertical List', icon: List },
]

const CONTENT_TYPES = [
  { id: 'categories', label: 'Category Cards' },
  { id: 'products', label: 'Product Cards' },
  { id: 'customCards', label: 'Custom Architectural Cards' },
]

const emptySectionForm = {
  id: '',
  title: '',
  showTitle: true,
  displayType: 'slider',
  contentType: 'products',
  selectedItemIds: [],
  customCards: [],
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

export function WallPanelSectionsTab({ sections = [], categories = [], products = [], onReload }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptySectionForm)
  const [busy, setBusy] = useState(false)

  // Custom card temporary form
  const [openCustomCardModal, setOpenCustomCardModal] = useState(false)
  const [customCardForm, setCustomCardForm] = useState({
    id: '',
    title: '',
    serialNumber: '',
    image: '',
    productId: '',
    active: true,
  })
  const [customCardImageMode, setCustomCardImageMode] = useState('upload')
  const [customCardUrlInput, setCustomCardUrlInput] = useState('')
  const [cardUploadProgress, setCardUploadProgress] = useState('')

  const handleOpenCreate = () => {
    setForm({
      ...emptySectionForm,
      sortOrder: String(sections.length + 1),
      selectedItemIds: products.slice(0, 4).map((p) => p.id),
    })
    setOpen(true)
  }

  const handleOpenEdit = (sec) => {
    setForm({
      id: sec.id,
      title: sec.title || '',
      showTitle: sec.showTitle !== false,
      displayType: sec.displayType || 'slider',
      contentType: sec.contentType || 'products',
      selectedItemIds: Array.isArray(sec.selectedItemIds) ? sec.selectedItemIds : [],
      customCards: Array.isArray(sec.customCards) ? sec.customCards : [],
      active: sec.active !== false,
      sortOrder: String(sec.sortOrder ?? 0),
    })
    setOpen(true)
  }

  // --- Item Selection Handlers ---
  const handleToggleItem = (itemId) => {
    setForm((prev) => {
      const set = new Set(prev.selectedItemIds)
      if (set.has(itemId)) {
        set.delete(itemId)
      } else {
        set.add(itemId)
      }
      return { ...prev, selectedItemIds: Array.from(set) }
    })
  }

  // --- Custom Card Handlers ---
  const handleOpenAddCustomCard = () => {
    setCustomCardForm({
      id: `custom-${Date.now()}`,
      title: '',
      serialNumber: `0${form.customCards.length + 1}`,
      image: '',
      productId: products[0]?.id || '',
      active: true,
    })
    setCustomCardUrlInput('')
    setCustomCardImageMode('upload')
    setOpenCustomCardModal(true)
  }

  const handleCustomCardUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    setCardUploadProgress('Uploading...')
    try {
      const url = await uploadToCloudinary(file)
      setCustomCardForm((p) => ({ ...p, image: url }))
      toast.success('Card photo uploaded!')
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setBusy(false)
      setCardUploadProgress('')
    }
  }

  const handleApplyCustomCardUrl = (e) => {
    e?.preventDefault()
    if (!customCardUrlInput.trim()) return
    setCustomCardForm((p) => ({ ...p, image: customCardUrlInput.trim() }))
    toast.success('Card photo URL applied!')
  }

  const handleSaveCustomCard = () => {
    if (!customCardForm.title.trim()) {
      toast.error('Card title is required')
      return
    }
    if (!customCardForm.image) {
      toast.error('Card photo is required')
      return
    }

    setForm((prev) => {
      const existingIdx = prev.customCards.findIndex((c) => c.id === customCardForm.id)
      const nextCards = [...prev.customCards]
      if (existingIdx >= 0) {
        nextCards[existingIdx] = customCardForm
      } else {
        nextCards.push(customCardForm)
      }
      return { ...prev, customCards: nextCards }
    })

    setOpenCustomCardModal(false)
    toast.success('Custom card saved')
  }

  const handleRemoveCustomCard = (cardId) => {
    setForm((prev) => ({
      ...prev,
      customCards: prev.customCards.filter((c) => c.id !== cardId),
    }))
  }

  // --- Save Section ---
  const handleSave = async (e) => {
    e.preventDefault()
    const title = form.title.trim()
    const id = form.id || `sec-${slugify(title || form.contentType)}-${Date.now()}`

    if (!title && form.showTitle) {
      toast.error('Section title is required when Show Title is enabled')
      return
    }

    setBusy(true)
    try {
      await setDocumentReplace('wallPanelSections', id, {
        id,
        title: title || 'Curated Wall Panels',
        showTitle: form.showTitle,
        displayType: form.displayType,
        contentType: form.contentType,
        selectedItemIds: form.selectedItemIds,
        customCards: form.customCards,
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
        updatedAt: serverTimestamp(),
      })

      toast.success('Section saved!')
      setOpen(false)
      onReload?.()
    } catch (err) {
      toast.error(err?.message || 'Could not save section')
    } finally {
      setBusy(false)
    }
  }

  const handleToggleActive = async (sec) => {
    try {
      await setDocumentReplace('wallPanelSections', sec.id, {
        ...sec,
        active: sec.active === false,
        updatedAt: serverTimestamp(),
      })
      toast.success(`Section is now ${sec.active === false ? 'Active' : 'Hidden'}`)
      onReload?.()
    } catch (err) {
      toast.error('Status update failed')
    }
  }

  const handleDelete = async (sec) => {
    if (!window.confirm(`Delete section "${sec.title}"?`)) return
    try {
      await removeDoc('wallPanelSections', sec.id)
      toast.success('Section deleted')
      onReload?.()
    } catch (err) {
      toast.error('Delete failed')
    }
  }

  const handleMoveSort = async (index, dir) => {
    const targetIdx = index + dir
    if (targetIdx < 0 || targetIdx >= sections.length) return
    const cur = sections[index]
    const tgt = sections[targetIdx]

    try {
      await setDocumentReplace('wallPanelSections', cur.id, {
        ...cur,
        sortOrder: tgt.sortOrder ?? targetIdx,
        updatedAt: serverTimestamp(),
      })
      await setDocumentReplace('wallPanelSections', tgt.id, {
        ...tgt,
        sortOrder: cur.sortOrder ?? index,
        updatedAt: serverTimestamp(),
      })
      onReload?.()
    } catch {
      toast.error('Reorder failed')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            Dynamic Sections Builder
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-[#C45508] dark:bg-orange-950/60 dark:text-orange-300">
              {sections.length} sections
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Admin can create unlimited dynamic sections with Horizontal Slider, Slideshow/Banner, List, or Grid layout.
          </p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-[#C45508] hover:bg-[#A84504] text-white">
          <Plus className="size-4 mr-1.5" />
          Add Section
        </Button>
      </div>

      {/* Sections List */}
      {sections.length === 0 ? (
        <Card className="text-center py-12">
          <p className="text-sm text-slate-500">
            No dynamic sections configured. Click "Add Section" or "Seed Showcase Data" above.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sections.map((sec, idx) => {
            const DisplayIcon = DISPLAY_TYPES.find((d) => d.id === sec.displayType)?.icon || Sliders
            const itemsCount =
              sec.contentType === 'customCards'
                ? sec.customCards?.length || 0
                : sec.selectedItemIds?.length || 0

            return (
              <div
                key={sec.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="size-11 rounded-2xl bg-orange-50 dark:bg-orange-950/60 text-[#C45508] flex items-center justify-center border border-orange-200 dark:border-orange-900">
                    <DisplayIcon className="size-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black text-slate-400">#{sec.sortOrder ?? idx + 1}</span>
                      <h3 className="font-bold text-base text-slate-900 dark:text-white">
                        {sec.title}
                      </h3>
                      {!sec.showTitle ? (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-500 dark:bg-slate-800">
                          Title Hidden
                        </span>
                      ) : null}
                      <Badge tone={sec.active !== false ? 'success' : 'neutral'} size="sm">
                        {sec.active !== false ? 'Active' : 'Hidden'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                      <span className="capitalize font-semibold text-[#C45508]">
                        Layout: {sec.displayType}
                      </span>
                      <span>•</span>
                      <span className="capitalize">
                        Type: {sec.contentType} ({itemsCount} items)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end border-t md:border-t-0 pt-3 md:pt-0">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveSort(idx, -1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 disabled:opacity-30"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === sections.length - 1}
                    onClick={() => handleMoveSort(idx, 1)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 disabled:opacity-30"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleActive(sec)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
                  >
                    {sec.active !== false ? <Eye className="size-4 text-emerald-600" /> : <EyeOff className="size-4 text-slate-400" />}
                  </button>
                  <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(sec)}>
                    <Edit2 className="size-3.5 mr-1" />
                    Edit
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(sec)}>
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Section Modal */}
      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title={form.id ? `Edit Section: ${form.title}` : 'Create Dynamic Section'}
        className="max-w-3xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Section Title">
              <Input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Bestselling Wall Designs"
              />
            </Field>

            <Field label="Sort Order">
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((p) => ({ ...p, sortOrder: e.target.value }))}
                placeholder="1"
              />
            </Field>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="sec-showtitle"
              checked={form.showTitle}
              onChange={(e) => setForm((p) => ({ ...p, showTitle: e.target.checked }))}
              className="size-4 accent-[#C45508]"
            />
            <label htmlFor="sec-showtitle" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Show section title on the website
            </label>
          </div>

          {/* Display Type & Content Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Display Type">
              <Select
                value={form.displayType}
                onChange={(e) => setForm((p) => ({ ...p, displayType: e.target.value }))}
              >
                {DISPLAY_TYPES.map((dt) => (
                  <option key={dt.id} value={dt.id}>
                    {dt.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Content Type">
              <Select
                value={form.contentType}
                onChange={(e) => setForm((p) => ({ ...p, contentType: e.target.value }))}
              >
                {CONTENT_TYPES.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* Content Selection depending on Content Type */}
          {form.contentType === 'categories' ? (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Select Categories to Include ({form.selectedItemIds.length} selected)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl">
                {categories.map((c) => {
                  const isChecked = form.selectedItemIds.includes(c.id)
                  return (
                    <label
                      key={c.id}
                      onClick={() => handleToggleItem(c.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-[#C45508] bg-orange-50/60 text-[#C45508] font-bold dark:bg-orange-950/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="size-4 accent-[#C45508]"
                      />
                      <span className="truncate">{c.name || c.title}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          ) : form.contentType === 'products' ? (
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Select Products to Include ({form.selectedItemIds.length} selected)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-xl">
                {products.map((p) => {
                  const isChecked = form.selectedItemIds.includes(p.id)
                  return (
                    <label
                      key={p.id}
                      onClick={() => handleToggleItem(p.id)}
                      className={`flex items-center gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-[#C45508] bg-orange-50/60 text-[#C45508] font-bold dark:bg-orange-950/40'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="size-4 accent-[#C45508]"
                      />
                      <div className="truncate">
                        <p className="truncate font-bold">{p.title || p.name}</p>
                        <p className="text-[11px] opacity-75 font-normal">₹{p.price}</p>
                      </div>
                    </label>
                  )
                })}
              </div>
            </div>
          ) : (
            /* Custom Cards Manager */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Custom Architectural Cards ({form.customCards.length})
                  </span>
                  <p className="text-xs text-slate-500">
                    Cards with image, title at bottom-left, serial number pill, and product redirect.
                  </p>
                </div>
                <Button size="sm" type="button" onClick={handleOpenAddCustomCard} variant="secondary">
                  <Plus className="size-3.5 mr-1" />
                  Add Custom Card
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {form.customCards.map((card, i) => (
                  <div
                    key={card.id || i}
                    className="relative rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 flex gap-3"
                  >
                    <img
                      src={card.image}
                      alt={card.title}
                      className="size-16 rounded-lg object-cover bg-slate-200"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {card.serialNumber ? (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800">
                            #{card.serialNumber}
                          </span>
                        ) : null}
                        <h4 className="font-bold text-xs truncate">{card.title}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        Links to:{' '}
                        {products.find((p) => p.id === card.productId)?.title || card.productId}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomCard(card.id)}
                      className="text-rose-500 hover:text-rose-700 p-1"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active and Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sec-active"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                className="size-4 accent-[#C45508]"
              />
              <label htmlFor="sec-active" className="text-sm font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                Publish Section (Active)
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button type="submit" loading={busy} className="bg-[#C45508] hover:bg-[#A84504] text-white">
                Save Section
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Submodal for creating/editing a custom card */}
      <Modal
        open={openCustomCardModal}
        onClose={() => setOpenCustomCardModal(false)}
        title="Add Custom Architectural Card"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Field label="Card Title (Overlaid at bottom-left) *" required>
            <Input
              value={customCardForm.title}
              onChange={(e) => setCustomCardForm((p) => ({ ...p, title: e.target.value }))}
              placeholder="e.g. The Penthouse Suite Look"
            />
          </Field>

          <Field label="Serial Number (e.g. 01, 02, 03)">
            <Input
              value={customCardForm.serialNumber}
              onChange={(e) => setCustomCardForm((p) => ({ ...p, serialNumber: e.target.value }))}
              placeholder="01"
            />
          </Field>

          <Field label="Target Product (Redirect on click) *" required>
            <Select
              value={customCardForm.productId}
              onChange={(e) => setCustomCardForm((p) => ({ ...p, productId: e.target.value }))}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title || p.name} (₹{p.price})
                </option>
              ))}
            </Select>
          </Field>

          {/* Photo */}
          <div className="space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-900">
            <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
              Card Image *
            </span>
            <div className="flex gap-2">
              <Input
                value={customCardUrlInput}
                onChange={(e) => setCustomCardUrlInput(e.target.value)}
                placeholder="Image URL or upload below..."
                className="text-xs"
              />
              <Button size="sm" type="button" onClick={handleApplyCustomCardUrl} variant="secondary">
                Apply
              </Button>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleCustomCardUpload}
              className="text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-[#C45508] file:text-white"
            />
            {cardUploadProgress ? <p className="text-xs text-[#C45508]">{cardUploadProgress}</p> : null}

            {customCardForm.image ? (
              <img
                src={customCardForm.image}
                alt="Preview"
                className="mt-2 h-32 w-full object-cover rounded-lg"
              />
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t">
            <Button variant="ghost" onClick={() => setOpenCustomCardModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCustomCard} className="bg-[#C45508] text-white">
              Save Card
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
