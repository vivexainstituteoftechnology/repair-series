import { useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  Sparkles,
  MoveHorizontal,
  Layers,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'
import { BANNER_CLICK_ACTIONS, newHomeSectionBannerSlide } from '../constants/homeSections'
import { uploadToCloudinary } from '../services/cloudinary'
import { catalogTitle } from '../utils/catalogHierarchy'
import { Button, Field, Input, Select, Badge } from './ui'
import { DynamicBannerEditor } from './DynamicBannerEditor'

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
  const [activeSlideForEditor, setActiveSlideForEditor] = useState(null)

  const slides = useMemo(() => sortedSlides(images), [images])

  const patchSlides = (next) => onChange(reindex(next))

  const updateSlide = (id, patch) => {
    patchSlides(slides.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  }

  const addSlide = () => {
    const slide = newHomeSectionBannerSlide({
      displayOrder: slides.length + 1,
      source: 'upload',
      title: '',
      tagline: '',
      buttonText: 'Book Service',
      buttonLink: '/services',
    })
    patchSlides([...slides, slide])
    setActiveSlideForEditor(slide)
  }

  const removeSlide = (id) => {
    patchSlides(slides.filter((s) => s.id !== id))
    if (editingId === id) setEditingId('')
    if (activeSlideForEditor?.id === id) setActiveSlideForEditor(null)
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
      updateSlide(id, { url, image: url, websiteImage: url, source: 'upload' })
    } catch (err) {
      toast.error(err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="size-4 text-primary-600" />
            <span>Slideshow & Banner Slides ({slides.length})</span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mt-0.5">
            Every slide supports independent multiline text, overlays, animations, custom button links, and multi-device preview.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          className="gap-1.5 px-3.5 py-2 text-xs font-bold"
          onClick={addSlide}
        >
          <Plus className="size-4" />
          <span>Add Slide with Editor</span>
        </Button>
      </div>

      {!slides.length ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900">
          <Sparkles className="size-8 text-primary-500 mb-2" />
          <p className="text-sm font-bold text-slate-900 dark:text-white">No slides added yet</p>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            Click <strong>"Add Slide with Editor"</strong> to upload an image and customize multiline titles, animations, and overlays.
          </p>
        </div>
      ) : null}

      <ul className="space-y-3.5">
        {slides.map((slide, index) => {
          const editing = editingId === slide.id
          const action = slide.clickAction || 'none'
          const typeFilter = String(slide.serviceTypeId || defaultServiceTypeId || '')
          const slideImage = slide.url || slide.websiteImage || slide.image || slide.mobileImage
          const hasDynamicContent = Boolean(slide.title || slide.tagline || slide.buttonText || slide.overlay)

          return (
            <li
              key={slide.id}
              draggable
              onDragStart={() => setSlideDragId(slide.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onSlideDrop(slide.id)}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              <div className="flex flex-wrap items-start gap-3.5">
                <GripVertical className="mt-2.5 size-4 shrink-0 cursor-grab text-slate-400" />
                <span className="mt-2 flex size-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">
                  {index + 1}
                </span>

                {/* Thumbnail Preview */}
                <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800">
                  {slideImage ? (
                    <img src={slideImage} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400 font-medium">
                      No image
                    </div>
                  )}
                  {slide.title ? (
                    <div className="absolute inset-0 bg-black/40 p-1 flex items-end">
                      <span className="line-clamp-1 text-[9px] font-bold text-white drop-shadow-xs whitespace-pre-line">
                        {slide.title}
                      </span>
                    </div>
                  ) : null}
                </div>

                {/* Middle Content Summary & Quick Controls */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      {slide.title ? (
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white whitespace-pre-line line-clamp-2">
                          {slide.title}
                        </h4>
                      ) : (
                        <span className="text-xs font-medium text-slate-400 italic">No title configured</span>
                      )}
                      {slide.tagline ? (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 font-medium whitespace-pre-line">
                          {slide.tagline}
                        </p>
                      ) : null}
                    </div>

                    {/* Advanced Customizer Trigger Button */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setActiveSlideForEditor(slide)}
                      className="gap-1.5 text-xs font-bold bg-primary-600 hover:bg-primary-700 text-white shrink-0 shadow-xs"
                    >
                      <Sparkles className="size-3.5" />
                      <span>Customize Slide (Advanced Editor)</span>
                    </Button>
                  </div>

                  {/* Dynamic badges row */}
                  {hasDynamicContent ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                      <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                        Position: {slide.contentPosition || 'left'}
                      </span>
                      {slide.overlay?.enabled !== false ? (
                        <span className="rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          Overlay: {slide.overlay?.opacity ?? 45}%
                        </span>
                      ) : null}
                      {slide.animations?.title && slide.animations.title !== 'none' ? (
                        <span className="rounded-md bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:text-primary-300">
                          Anim: {slide.animations.title}
                        </span>
                      ) : null}
                      {slide.buttonText ? (
                        <span className="rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                          Btn: {slide.buttonText}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Quick Upload / URL selection */}
                  <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-slate-600 dark:text-slate-400">
                    <label className="flex cursor-pointer items-center gap-1 font-semibold">
                      <input
                        type="radio"
                        name={`src-${slide.id}`}
                        checked={slide.source !== 'url'}
                        onChange={() => updateSlide(slide.id, { source: 'upload' })}
                        className="size-3.5 text-primary-600"
                      />
                      Upload file
                    </label>
                    <label className="flex cursor-pointer items-center gap-1 font-semibold">
                      <input
                        type="radio"
                        name={`src-${slide.id}`}
                        checked={slide.source === 'url'}
                        onChange={() => updateSlide(slide.id, { source: 'url' })}
                        className="size-3.5 text-primary-600"
                      />
                      Direct URL
                    </label>

                    {slide.source === 'url' ? (
                      <Input
                        className="max-w-md h-8 text-xs font-mono"
                        value={slide.url || ''}
                        onChange={(e) => updateSlide(slide.id, { url: e.target.value, image: e.target.value, websiteImage: e.target.value })}
                        placeholder="https://… (image or .gif)"
                      />
                    ) : (
                      <input
                        type="file"
                        accept="image/*,image/gif,.gif"
                        disabled={uploading}
                        className="text-xs file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-slate-100 dark:file:bg-slate-800 file:text-slate-800 dark:file:text-slate-200 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          void uploadForSlide(slide.id, file)
                          e.target.value = ''
                        }}
                      />
                    )}
                  </div>
                </div>

                {/* Action buttons on the right */}
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 p-2 text-primary-600 hover:bg-primary-50 dark:border-slate-700 dark:text-primary-300 dark:hover:bg-primary-950/40 transition-colors"
                    onClick={() => setActiveSlideForEditor(slide)}
                    title="Open Advanced Dynamic Banner Editor"
                    aria-label="Edit with Advanced Banner Editor"
                  >
                    <Sparkles className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setEditingId(editing ? '' : slide.id)}
                    title="Quick routing settings"
                    aria-label="Quick routing settings"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => moveSlide(slide.id, 'up')}
                    disabled={index === 0}
                    title="Move slide up"
                    aria-label="Move up"
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 p-2 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => moveSlide(slide.id, 'down')}
                    disabled={index === slides.length - 1}
                    title="Move slide down"
                    aria-label="Move down"
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 p-2 text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                    onClick={() => {
                      if (!window.confirm(`Delete slide #${index + 1}?`)) return
                      removeSlide(slide.id)
                    }}
                    title="Delete slide"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Collapsible Click Action Details */}
              {editing ? (
                <div className="mt-3.5 grid gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 sm:grid-cols-2">
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
                        value={slide.redirectLink || slide.buttonLink || ''}
                        onChange={(e) => updateSlide(slide.id, { redirectLink: e.target.value, buttonLink: e.target.value })}
                        placeholder="https://…"
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

      {/* Advanced Dynamic Banner Editor Modal for this slide */}
      {activeSlideForEditor ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-7xl animate-in fade-in zoom-in-95 duration-200">
            <DynamicBannerEditor
              banner={activeSlideForEditor}
              title={`Customize Slide #${slides.findIndex((s) => s.id === activeSlideForEditor.id) + 1}`}
              subtitle="Full multiline typography, overlays, animations, element ordering, and live multi-device preview."
              onSave={(updatedSlide) => {
                updateSlide(activeSlideForEditor.id, updatedSlide)
                setActiveSlideForEditor(null)
                toast.success('Slide customized successfully.')
              }}
              onCancel={() => setActiveSlideForEditor(null)}
              serviceTypes={serviceTypes}
              categories={categories}
              services={services}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
