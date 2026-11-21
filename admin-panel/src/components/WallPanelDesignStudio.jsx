import { useEffect, useMemo, useState } from 'react'
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore'
import { toast } from 'sonner'
import { Upload, Link2, Plus, Trash2, RefreshCw } from 'lucide-react'
import { db } from '../firebase/config'
import { Button, Card, Field, Input, Modal, Textarea, Badge } from './ui'
import { removeDoc, setDocumentReplace } from '../services/firestore'
import { uploadToCloudinary } from '../services/cloudinary'

const emptyForm = {
  id: '',
  designCode: '',
  name: '',
  description: '',
  features: '',
  active: true,
  sortOrder: '0',
  images: [],
}

function coverOf(design) {
  const images = Array.isArray(design?.images) ? design.images : []
  const cover = images.find((img) => img.isCover) || images[0]
  return cover?.url || design?.imageUrl || ''
}

function slugId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48)
}

export function WallPanelDesignStudio() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [imageInputMode, setImageInputMode] = useState('upload') // 'upload' | 'url'
  const [urlInput, setUrlInput] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'wallPanelDesigns'),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
        setRows(list)
        setLoading(false)
      },
      () => {
        setLoading(false)
        toast.error('Could not load wall panel designs.')
      },
    )
    return () => unsub()
  }, [])

  const photoCount = useMemo(
    () => Object.fromEntries(rows.map((row) => [row.id, (row.images || []).length || (row.imageUrl ? 1 : 0)])),
    [rows],
  )

  const publishCategory = async (coverUrl = '') => {
    try {
      const existing = await getDocs(
        query(collection(db, 'serviceTypes'), where('bookingFlow', '==', 'wallPanel')),
      )
      const id = existing.empty ? 'wallPanel' : existing.docs[0].id
      const img = String(coverUrl || rows.find((r) => r.imageUrl)?.imageUrl || '').trim()
      await setDocumentReplace('serviceTypes', id, {
        title: 'Wall Panel',
        name: 'Wall Panel',
        slug: 'wall-panel',
        bookingFlow: 'wallPanel',
        department: 'wallPanel',
        image: img,
        imageUrl: img,
        icon: img,
        status: 'Active',
        active: true,
        displayOrder: 12,
        order: 12,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
    } catch {
      // Non-blocking sync
    }
  }

  const handleManualPublish = async () => {
    setBusy(true)
    try {
      const topCover = rows.find((r) => r.active !== false && coverOf(r))
      await publishCategory(topCover ? coverOf(topCover) : '')
      toast.success('Wall Panel category published and synced to app & website.')
    } catch (err) {
      toast.error(err?.message || 'Could not sync category')
    } finally {
      setBusy(false)
    }
  }

  const openCreate = () => {
    setForm({ ...emptyForm, sortOrder: String(rows.length + 1) })
    setImageInputMode('upload')
    setUrlInput('')
    setOpen(true)
  }

  const openEdit = (row) => {
    const images = Array.isArray(row.images) && row.images.length
      ? row.images.map((img, index) => ({
          url: img.url,
          isCover: Boolean(img.isCover) || index === 0,
          sortOrder: Number(img.sortOrder ?? index),
        }))
      : row.imageUrl
        ? [{ url: row.imageUrl, isCover: true, sortOrder: 0 }]
        : []
    setForm({
      id: row.id,
      designCode: row.designCode || row.id,
      name: row.name || '',
      description: row.description || '',
      features: Array.isArray(row.features) ? row.features.join('\n') : '',
      active: row.active !== false,
      sortOrder: String(row.sortOrder ?? 0),
      images,
    })
    setImageInputMode('upload')
    setUrlInput('')
    setOpen(true)
  }

  // --- Image Option 1: File Upload via Cloudinary ---
  const appendFiles = async (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith('image/'))
    if (!files.length) {
      toast.error('Choose image files only.')
      return
    }
    setBusy(true)
    const added = []
    try {
      for (let i = 0; i < files.length; i += 1) {
        setProgress(`Uploading ${i + 1} of ${files.length}…`)
        const url = await uploadToCloudinary(files[i])
        added.push({ url, isCover: false, sortOrder: form.images.length + added.length })
      }
      setForm((current) => {
        const images = [...current.images, ...added]
        if (images.length && !images.some((img) => img.isCover)) images[0].isCover = true
        return { ...current, images }
      })
      toast.success(`${added.length} photo${added.length === 1 ? '' : 's'} uploaded and added.`)
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setProgress('')
      setBusy(false)
    }
  }

  // --- Image Option 2: Add by URL ---
  const addUrlImage = (e) => {
    if (e) e.preventDefault()
    const raw = String(urlInput || '').trim()
    if (!raw) {
      toast.error('Please enter an image URL')
      return
    }

    // Support single or multiple URLs (newline / comma separated)
    const candidates = raw
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean)

    const validUrls = []
    const invalidUrls = []

    for (const url of candidates) {
      if (/^(https?:\/\/|data:image\/|\/)/i.test(url)) {
        validUrls.push(url)
      } else {
        invalidUrls.push(url)
      }
    }

    if (invalidUrls.length > 0) {
      toast.error(`Invalid URL: ${invalidUrls[0]}. Must start with http:// or https://`)
      if (!validUrls.length) return
    }

    if (!validUrls.length) {
      toast.error('No valid image URLs provided.')
      return
    }

    const newEntries = validUrls.map((url, i) => ({
      url,
      isCover: false,
      sortOrder: form.images.length + i,
    }))

    setForm((current) => {
      const images = [...current.images, ...newEntries]
      if (images.length && !images.some((img) => img.isCover)) {
        images[0].isCover = true
      }
      return { ...current, images }
    })

    setUrlInput('')
    toast.success(`${validUrls.length} image URL${validUrls.length === 1 ? '' : 's'} added to gallery.`)
  }

  const setCover = (url) => {
    setForm((current) => ({
      ...current,
      images: current.images.map((img) => ({ ...img, isCover: img.url === url })),
    }))
  }

  const removeImage = (url) => {
    setForm((current) => {
      const images = current.images.filter((img) => img.url !== url)
      if (images.length && !images.some((img) => img.isCover)) {
        images[0] = { ...images[0], isCover: true }
      }
      return { ...current, images }
    })
  }

  const moveImage = (index, direction) => {
    setForm((current) => {
      const images = [...current.images]
      const next = index + direction
      if (next < 0 || next >= images.length) return current
      const [item] = images.splice(index, 1)
      images.splice(next, 0, item)
      return { ...current, images: images.map((img, i) => ({ ...img, sortOrder: i })) }
    })
  }

  const save = async (event) => {
    event.preventDefault()
    const name = form.name.trim()
    const code = slugId(form.designCode || name)
    if (!name || !code) {
      toast.error('Design name and unique ID are required.')
      return
    }
    if (!form.images.length) {
      toast.error('Add at least one photo (upload or via URL).')
      return
    }
    const images = form.images.map((img, index) => ({
      url: img.url,
      isCover: img.isCover,
      sortOrder: index,
    }))
    if (!images.some((img) => img.isCover)) images[0].isCover = true
    const cover = images.find((img) => img.isCover)?.url || images[0].url
    const id = form.id || code
    setBusy(true)
    try {
      await setDocumentReplace('wallPanelDesigns', id, {
        name,
        designCode: code,
        description: form.description.trim(),
        features: form.features.split('\n').map((line) => line.trim()).filter(Boolean),
        images,
        imageUrl: cover,
        active: form.active,
        sortOrder: Number(form.sortOrder) || 0,
        department: 'wallPanel',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
      await publishCategory(cover)
      toast.success('Wall panel design saved.')
      setOpen(false)
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (row) => {
    try {
      await setDocumentReplace('wallPanelDesigns', row.id, {
        ...row,
        active: row.active === false,
        updatedAt: serverTimestamp(),
      })
    } catch (err) {
      toast.error(err?.message || 'Could not update status')
    }
  }

  const removeDesign = async (row) => {
    if (!window.confirm(`Delete ${row.name}? Existing bookings keep their saved design IDs.`)) return
    try {
      await removeDoc('wallPanelDesigns', row.id)
      toast.success('Design deleted.')
    } catch (err) {
      toast.error(err?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-[var(--on-surface-variant)]">
          {rows.length} design{rows.length === 1 ? '' : 's'} published. Add photos by file upload or image URL.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="ghost" disabled={busy} onClick={() => void handleManualPublish()}>
            <RefreshCw className="mr-1.5 size-3.5" />
            Sync to Customer Home
          </Button>
          <Button type="button" onClick={openCreate}>
            <Plus className="mr-1.5 size-4" />
            Add Wall Panel Design
          </Button>
        </div>
      </div>

      {loading ? <Card>Loading designs…</Card> : null}
      {!loading && rows.length === 0 ? (
        <Card>
          <p className="text-sm text-[var(--on-surface-variant)]">
            No wall panel designs yet. Click "Add Wall Panel Design" to add your first design with photos.
          </p>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => {
          const cover = coverOf(row)
          return (
            <Card key={row.id} className="overflow-hidden p-0">
              {cover ? (
                <img src={cover} alt="" className="h-44 w-full object-cover" />
              ) : (
                <div className="h-44 bg-[var(--surface-high)]" />
              )}
              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">{row.name}</h3>
                    <p className="text-xs text-[var(--on-surface-variant)]">{row.designCode || row.id}</p>
                  </div>
                  <Badge tone={row.active === false ? 'warning' : 'success'}>
                    {row.active === false ? 'Inactive' : 'Active'}
                  </Badge>
                </div>
                {row.description ? (
                  <p className="line-clamp-2 text-xs text-[var(--on-surface-variant)]">{row.description}</p>
                ) : null}
                <p className="text-xs font-semibold text-[var(--primary)]">{photoCount[row.id] || 0} photos</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button variant="ghost" onClick={() => openEdit(row)}>Edit</Button>
                  <Button variant="ghost" onClick={() => void toggleActive(row)}>
                    {row.active === false ? 'Activate' : 'Deactivate'}
                  </Button>
                  <Button variant="danger" onClick={() => void removeDesign(row)}>Delete</Button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      <Modal open={open} onClose={() => !busy && setOpen(false)} title={form.id ? 'Edit Wall Panel Design' : 'Add Wall Panel Design'}>
        <form className="space-y-4" onSubmit={(event) => void save(event)}>
          <Field label="Design name *">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Fluted Oak Acoustic" required />
          </Field>
          <Field label="Unique ID / Code *">
            <Input
              value={form.designCode}
              onChange={(e) => setForm((f) => ({ ...f, designCode: e.target.value }))}
              placeholder="e.g. oak-fluted-01"
              disabled={Boolean(form.id)}
              required
            />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Short overview of the wall panel finish and wood grade..." />
          </Field>
          <Field label="Features (one per line)">
            <Textarea value={form.features} onChange={(e) => setForm((f) => ({ ...f, features: e.target.value }))} placeholder="Moisture resistant&#10;Acoustic dampening&#10;Easy click installation" />
          </Field>
          <Field label="Sort order">
            <Input type="number" value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
          </Field>
          <label className="flex items-center gap-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            <span>Show design in customer mobile app & website</span>
          </label>

          {/* Photo Management Section (Upload files + Add via URL) */}
          <div className="space-y-3 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-lowest)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--outline-variant)]/60 pb-3">
              <div>
                <p className="text-sm font-bold text-[var(--on-surface)]">Design Photos</p>
                <p className="text-xs text-[var(--on-surface-variant)]">Add photos via file upload or direct URL.</p>
              </div>

              {/* Toggle: Upload vs URL */}
              <div className="inline-flex rounded-xl bg-[var(--surface-high)] p-1">
                <button
                  type="button"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    imageInputMode === 'upload'
                      ? 'bg-[var(--primary)] text-white shadow'
                      : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
                  }`}
                  onClick={() => setImageInputMode('upload')}
                >
                  <Upload className="size-3.5" />
                  Upload
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                    imageInputMode === 'url'
                      ? 'bg-[var(--primary)] text-white shadow'
                      : 'text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
                  }`}
                  onClick={() => setImageInputMode('url')}
                >
                  <Link2 className="size-3.5" />
                  Add URL
                </button>
              </div>
            </div>

            {/* Option A: File Upload Dropzone */}
            {imageInputMode === 'upload' ? (
              <div
                className={`rounded-2xl border-2 border-dashed p-4 text-center transition ${
                  dragOver
                    ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_8%,transparent)]'
                    : 'border-[var(--outline-variant)] hover:border-[var(--primary)]'
                }`}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOver(false)
                  void appendFiles(event.dataTransfer.files)
                }}
              >
                <p className="text-xs font-bold text-[var(--on-surface)]">Upload Image Files</p>
                <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                  Drag and drop files here, or click below to select photos.
                </p>
                <input
                  className="mt-3 block w-full text-xs text-[var(--on-surface-variant)] file:mr-3 file:rounded-xl file:border-0 file:bg-[var(--surface-high)] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[var(--on-surface)] hover:file:bg-[var(--surface-highest)]"
                  type="file"
                  accept="image/*,image/gif,.gif"
                  multiple
                  disabled={busy}
                  onChange={(event) => {
                    void appendFiles(event.target.files)
                    event.target.value = ''
                  }}
                />
                {progress ? <p className="mt-2 text-xs font-bold text-[var(--primary)]">{progress}</p> : null}
              </div>
            ) : (
              /* Option B: Add by URL */
              <div className="space-y-2 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-low)] p-3">
                <p className="text-xs font-bold text-[var(--on-surface)]">Paste Image URL</p>
                <p className="text-xs text-[var(--on-surface-variant)]">
                  Enter an image web address (https://...). You can also paste multiple URLs separated by commas or lines.
                </p>
                <div className="flex gap-2">
                  <Input
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addUrlImage()
                      }
                    }}
                    placeholder="https://example.com/wall-panel-image.jpg"
                    className="text-xs"
                  />
                  <Button
                    type="button"
                    variant="primary"
                    className="shrink-0 px-4 py-2 text-xs font-bold"
                    onClick={addUrlImage}
                  >
                    Add URL
                  </Button>
                </div>
              </div>
            )}

            {/* Gallery of Added Images */}
            {form.images.length > 0 ? (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs text-[var(--on-surface-variant)]">
                  <span className="font-semibold">{form.images.length} photo{form.images.length === 1 ? '' : 's'} in gallery</span>
                  <span>Click "Set Cover" to choose the main card photo</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 max-h-64 overflow-y-auto p-1">
                  {form.images.map((img, index) => (
                    <div
                      key={`${img.url}-${index}`}
                      className={`group relative overflow-hidden rounded-xl border transition ${
                        img.isCover ? 'border-[var(--primary)] ring-2 ring-[var(--primary)]/30' : 'border-[var(--outline-variant)]'
                      }`}
                    >
                      <img src={img.url} alt="" className="h-24 w-full object-cover" />
                      {img.isCover ? (
                        <span className="absolute top-1 left-1 rounded bg-[var(--primary)] px-1.5 py-0.5 text-[9px] font-bold text-white shadow">
                          COVER
                        </span>
                      ) : null}
                      <div className="space-y-1 bg-[var(--surface-lowest)] p-1.5">
                        <button
                          type="button"
                          className={`w-full rounded px-1.5 py-1 text-[10px] font-bold transition ${
                            img.isCover
                              ? 'bg-[var(--primary)]/10 text-[var(--primary)]'
                              : 'bg-[var(--surface-high)] text-[var(--on-surface)] hover:bg-[var(--surface-highest)]'
                          }`}
                          onClick={() => setCover(img.url)}
                        >
                          {img.isCover ? 'Primary Cover' : 'Set as Cover'}
                        </button>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            disabled={index === 0}
                            className="flex-1 rounded bg-[var(--surface-high)] px-1 py-1 text-[10px] font-bold disabled:opacity-30 hover:bg-[var(--surface-highest)]"
                            onClick={() => moveImage(index, -1)}
                            title="Move earlier"
                          >
                            ◀
                          </button>
                          <button
                            type="button"
                            disabled={index === form.images.length - 1}
                            className="flex-1 rounded bg-[var(--surface-high)] px-1 py-1 text-[10px] font-bold disabled:opacity-30 hover:bg-[var(--surface-highest)]"
                            onClick={() => moveImage(index, 1)}
                            title="Move later"
                          >
                            ▶
                          </button>
                          <button
                            type="button"
                            className="flex-1 rounded bg-red-50 text-red-600 px-1 py-1 text-[10px] font-bold hover:bg-red-100"
                            onClick={() => removeImage(img.url)}
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-center text-xs text-[var(--on-surface-variant)] py-2">
                No photos added yet. Upload from files or add an image URL above.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" disabled={busy} onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save Design'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
