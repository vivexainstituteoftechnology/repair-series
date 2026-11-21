import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, GripVertical, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { BANNER_CLICK_ACTIONS, newHomeSectionBannerSlide } from '../constants/homeSections'
import { uploadToCloudinary } from '../services/cloudinary'
import { catalogTitle } from '../utils/catalogHierarchy'
import { Button, Field, Input, Select } from './ui'

function sortedSlides(images) {
  return [...(Array.isArray(images) ? images : [])].sort(
    (a, b) => (a.displayOrder || 0) - (b.displayOrder || 0),
  )
}

function reindex(list) {
  return list.map((row, i) => ({ ...row, displayOrder: i + 1 }))
}

export function HomeSectionBannerSlidesEditor({
  images,
  onChange,
  sectionId,
  uploading,
  setUploading,
  serviceTypes,
  categories,
  serviceCategories,
  services,
  defaultServiceTypeId,
}) {
  const [editingId, setEditingId] = useState('')
  const [slideDragId, setSlideDragId] = useState('')

  const slides = useMemo(() => sortedSlides(images), [images])

  const patchSlides = (next) => onChange(reindex(next))

  const updateSlide = (id, patch) => {
    patchSlides(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const addSlide = () => {
    const slide = newHomeSectionBannerSlide({ displayOrder: slides.length + 1, source: 'upload' })
    patchSlides([...slides, slide])
    setEditingId(slide.id)
  }

  const removeSlide = (id) => {
    patchSlides(slides.filter((s) => s.id !== id))
    if (editingId === id) setEditingId('')
  }

  const moveSlide = (id, direction) => {
    const list = [...slides]
    const idx = list.findIndex((s) => s.id === id)
    const swap = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swap < 0 || swap >= list.length) return
    const [moved] = list.splice(idx, 1)
    list.splice(swap, 0, moved)
    patchSlides(list)
  }

  const onSlideDrop = (targetId) => {
    if (!slideDragId || slideDragId === targetId) return
    const list = [...slides]
    const from = list.findIndex((s) => s.id === slideDragId)
    const to = list.findIndex((s) => s.id === targetId)
    setSlideDragId('')
    if (from < 0 || to < 0) return
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    patchSlides(list)
  }

  const uploadForSlide = async (id, file) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, { kind: 'home-section', sectionId: sectionId || 'new' })
      updateSlide(id, { url, source: 'upload' })
    } catch (err) {
      toast.error(err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--outline-variant)] p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--on-surface)]">Banner images</p>
        <Button type="button" variant="secondary" className="gap-1 px-3 py-2 text-xs" onClick={addSlide}>
          <Plus className="size-4" />
          Add image
        </Button>
      </div>

      {!slides.length ? (
        <p className="text-sm text-[var(--on-surface-variant)]">
          No slides yet. Add images here — no separate banner section needed.
        </p>
      ) : null}

      <ul className="space-y-3">
        {slides.map((slide, index) => {
          const editing = editingId === slide.id
          const action = slide.clickAction || 'none'
          const typeFilter = String(slide.serviceTypeId || defaultServiceTypeId || '')
          return (
            <li
              key={slide.id}
              draggable
              onDragStart={() => setSlideDragId(slide.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onSlideDrop(slide.id)}
              className="rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3"
            >
              <div className="flex flex-wrap items-start gap-3">
                <GripVertical className="mt-2 size-4 shrink-0 cursor-grab text-[var(--on-surface-variant)]" />
                <span className="mt-1.5 text-xs font-medium text-[var(--on-surface-variant)]">{index + 1}.</span>
                <div className="h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-[var(--surface-container)]">
                  {slide.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={slide.url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-[var(--on-surface-variant)]">
                      No preview
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        name={`src-${slide.id}`}
                        checked={slide.source !== 'url'}
                        onChange={() => updateSlide(slide.id, { source: 'upload' })}
                      />
                      Upload
                    </label>
                    <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                      <input
                        type="radio"
                        name={`src-${slide.id}`}
                        checked={slide.source === 'url'}
                        onChange={() => updateSlide(slide.id, { source: 'url' })}
                      />
                      Image URL
                    </label>
                  </div>
                  {slide.source === 'url' ? (
                    <Input
                      className="mt-2"
                      value={slide.url}
                      onChange={(e) => updateSlide(slide.id, { url: e.target.value })}
                      placeholder="https://… (image or animated .gif)"
                    />
                  ) : (
                    <input
                      type="file"
                      accept="image/*,image/gif,.gif"
                      disabled={uploading}
                      className="mt-2 block text-sm"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        void uploadForSlide(slide.id, file)
                        e.target.value = ''
                      }}
                    />
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-[var(--surface-container-highest)]"
                    onClick={() => setEditingId(editing ? '' : slide.id)}
                    aria-label="Edit click action"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-[var(--surface-container-highest)]"
                    onClick={() => moveSlide(slide.id, 'up')}
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 hover:bg-[var(--surface-container-highest)]"
                    onClick={() => moveSlide(slide.id, 'down')}
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    onClick={() => removeSlide(slide.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>

              {editing ? (
                <div className="mt-3 grid gap-3 border-t border-[var(--outline-variant)] pt-3 sm:grid-cols-2">
                  <Field label="Click action">
                    <Select
                      value={action}
                      onChange={(e) => updateSlide(slide.id, { clickAction: e.target.value })}
                    >
                      {BANNER_CLICK_ACTIONS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {action === 'external' ? (
                    <Field label="External URL">
                      <Input
                        value={slide.redirectLink}
                        onChange={(e) => updateSlide(slide.id, { redirectLink: e.target.value })}
                        placeholder="https://… (image or animated .gif)"
                      />
                    </Field>
                  ) : null}
                  {['serviceType', 'category', 'serviceCategory', 'service'].includes(action) ? (
                    <Field label="Service type">
                      <Select
                        value={slide.serviceTypeId || defaultServiceTypeId || ''}
                        onChange={(e) =>
                          updateSlide(slide.id, {
                            serviceTypeId: e.target.value,
                            categoryId: '',
                            serviceCategoryId: '',
                            serviceId: '',
                          })
                        }
                      >
                        <option value="">Select…</option>
                        {(serviceTypes || []).map((t) => (
                          <option key={t.id} value={t.id}>
                            {catalogTitle(t)}
                          </option>
                        ))}
                      </Select>
                    </Field>
                  ) : null}
                  {['category', 'serviceCategory', 'service'].includes(action) ? (
                    <Field label="Category">
                      <Select
                        value={slide.categoryId || ''}
                        onChange={(e) =>
                          updateSlide(slide.id, {
                            categoryId: e.target.value,
                            serviceCategoryId: '',
                            serviceId: '',
                          })
                        }
                      >
                        <option value="">Select…</option>
                        {(categories || [])
                          .filter((c) => !typeFilter || String(c.serviceTypeId) === typeFilter)
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {catalogTitle(c)}
                            </option>
                          ))}
                      </Select>
                    </Field>
                  ) : null}
                  {['serviceCategory', 'service'].includes(action) ? (
                    <Field label="Service category">
                      <Select
                        value={slide.serviceCategoryId || ''}
                        onChange={(e) =>
                          updateSlide(slide.id, { serviceCategoryId: e.target.value, serviceId: '' })
                        }
                      >
                        <option value="">Select…</option>
                        {(serviceCategories || [])
                          .filter(
                            (c) =>
                              (!typeFilter || String(c.serviceTypeId) === typeFilter) &&
                              (!slide.categoryId || String(c.categoryId) === slide.categoryId),
                          )
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {catalogTitle(c)}
                            </option>
                          ))}
                      </Select>
                    </Field>
                  ) : null}
                  {action === 'service' ? (
                    <Field label="Service">
                      <Select
                        value={slide.serviceId || ''}
                        onChange={(e) => updateSlide(slide.id, { serviceId: e.target.value })}
                      >
                        <option value="">Select…</option>
                        {(services || [])
                          .filter((s) => !typeFilter || String(s.serviceTypeId) === typeFilter)
                          .filter((s) => !slide.categoryId || String(s.categoryId) === slide.categoryId)
                          .filter(
                            (s) =>
                              !slide.serviceCategoryId ||
                              String(s.serviceCategoryId) === slide.serviceCategoryId,
                          )
                          .slice(0, 200)
                          .map((s) => (
                            <option key={s.id} value={s.id}>
                              {catalogTitle(s)}
                            </option>
                          ))}
                      </Select>
                    </Field>
                  ) : null}
                </div>
              ) : null}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
