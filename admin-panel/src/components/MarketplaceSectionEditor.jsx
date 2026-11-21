import { useState, useMemo } from 'react'
import {
  GripVertical,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Pencil,
  ArrowUp,
  ArrowDown,
  Monitor,
  Tablet,
  Smartphone,
  Save,
  X,
  Upload,
  Check,
  Wrench,
  Star,
  Sparkles,
  Layers,
  FolderTree,
  Tag,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import { uploadToCloudinary } from '../services/cloudinary'
import { catalogTitle } from '../utils/catalogHierarchy'

export function MarketplaceSectionEditor({
  section,
  onSave,
  onClose,
  services = [],
  categories = [],
  serviceTypes = [],
  serviceCategories = [],
}) {
  const [title, setTitle] = useState(section?.title || 'Marketplace Spotlight')
  const [subtitle, setSubtitle] = useState(
    section?.subtitle || 'Top booked home repairs, appliance care & curated categories',
  )
  const [layout, setLayout] = useState(section?.layout || 'grid')
  const [columns, setColumns] = useState(Number(section?.columns) || 4)
  const [enabled, setEnabled] = useState(section?.enabled !== false && section?.visible !== false)
  const [device, setDevice] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
  const [saving, setSaving] = useState(false)

  // Drag and drop state
  const [draggedId, setDraggedId] = useState(null)

  // Active items list
  const [items, setItems] = useState(() => {
    if (Array.isArray(section?.items) && section.items.length > 0) {
      return section.items.map((it, idx) => ({
        ...it,
        id: it.id || `mkt_${Date.now()}_${idx}`,
        displayOrder: it.displayOrder ?? idx + 1,
      }))
    }
    return []
  })

  // Add Item Modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItemType, setNewItemType] = useState('service') // 'service' | 'category' | 'serviceType' | 'serviceCategory'
  const [newItemTargetId, setNewItemTargetId] = useState('')
  const [newItemSearch, setNewItemSearch] = useState('')

  // Edit Single Item Modal state
  const [editingItem, setEditingItem] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Filter available items for the Add modal
  const selectableCandidates = useMemo(() => {
    const q = newItemSearch.toLowerCase().trim()
    let list = []
    if (newItemType === 'service') {
      list = services.map((s) => ({
        id: s.id,
        title: s.name || s.title || 'Untitled Service',
        image: s.image || s.imageUrl || s.homeImage || '',
        meta: s.price ? `₹${s.price}` : 'Service',
      }))
    } else if (newItemType === 'category') {
      list = categories.map((c) => ({
        id: c.id,
        title: catalogTitle(c),
        image: c.image || c.imageUrl || c.homeImage || c.icon || '',
        meta: 'Category',
      }))
    } else if (newItemType === 'serviceType') {
      list = serviceTypes.map((st) => ({
        id: st.id,
        title: catalogTitle(st),
        image: st.image || st.imageUrl || st.homeImage || st.icon || '',
        meta: 'Service Type',
      }))
    } else if (newItemType === 'serviceCategory') {
      list = serviceCategories.map((sc) => ({
        id: sc.id,
        title: catalogTitle(sc),
        image: sc.image || sc.imageUrl || sc.homeImage || sc.icon || '',
        meta: 'Category Type',
      }))
    }

    if (!q) return list
    return list.filter((item) => item.title.toLowerCase().includes(q))
  }, [newItemType, newItemSearch, services, categories, serviceTypes, serviceCategories])

  // Helper to resolve an item's current display data
  const resolveItemData = (item) => {
    let fallback = { title: 'Unknown', image: '', price: '' }
    if (item.itemType === 'service') {
      const s = services.find((x) => x.id === item.targetId)
      if (s) {
        fallback = {
          title: s.name || s.title || 'Service',
          image: s.image || s.imageUrl || s.homeImage || '',
          price: s.price ? `₹${s.price}` : '₹499',
        }
      }
    } else if (item.itemType === 'category') {
      const c = categories.find((x) => x.id === item.targetId)
      if (c) {
        fallback = {
          title: catalogTitle(c),
          image: c.image || c.imageUrl || c.homeImage || c.icon || '',
          price: '',
        }
      }
    } else if (item.itemType === 'serviceType') {
      const st = serviceTypes.find((x) => x.id === item.targetId)
      if (st) {
        fallback = {
          title: catalogTitle(st),
          image: st.image || st.imageUrl || st.homeImage || st.icon || '',
          price: '',
        }
      }
    } else if (item.itemType === 'serviceCategory') {
      const sc = serviceCategories.find((x) => x.id === item.targetId)
      if (sc) {
        fallback = {
          title: catalogTitle(sc),
          image: sc.image || sc.imageUrl || sc.homeImage || sc.icon || '',
          price: '',
        }
      }
    }

    return {
      title: item.title || fallback.title,
      image: item.image || fallback.image,
      price: fallback.price,
    }
  }

  // Handle adding an item from the modal
  const handleAddItem = (candidate) => {
    const newItem = {
      id: `mkt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      itemType: newItemType,
      targetId: candidate.id,
      title: candidate.title,
      image: candidate.image,
      visible: true,
      displayOrder: items.length + 1,
      badge: newItemType === 'service' ? '45 MINS' : '30 mins',
      styling: {},
    }

    setItems((prev) => [...prev, newItem])
    setShowAddModal(false)
    setNewItemSearch('')
    toast.success(`Added ${candidate.title} to marketplace!`)
  }

  // Handle removing item
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    toast.info('Item removed from marketplace layout (database record preserved).')
  }

  // Handle toggle visibility
  const handleToggleVisible = (id) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, visible: !it.visible } : it)),
    )
  }

  // Move item up / down
  const moveItem = (index, direction) => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= items.length) return
    const next = [...items]
    const [moved] = next.splice(index, 1)
    next.splice(targetIndex, 0, moved)
    setItems(next.map((it, idx) => ({ ...it, displayOrder: idx + 1 })))
  }

  // Drag and drop handlers
  const handleDragStart = (e, id) => {
    setDraggedId(id)
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e, targetId) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) return
    const fromIndex = items.findIndex((it) => it.id === draggedId)
    const toIndex = items.findIndex((it) => it.id === targetId)
    if (fromIndex === -1 || toIndex === -1) return

    const next = [...items]
    const [moved] = next.splice(fromIndex, 1)
    next.splice(toIndex, 0, moved)
    setItems(next.map((it, idx) => ({ ...it, displayOrder: idx + 1 })))
    setDraggedId(null)
  }

  // Handle image upload for editing item
  const handleImageUpload = async (file) => {
    if (!file || !editingItem) return
    setUploadingImage(true)
    try {
      const url = await uploadToCloudinary(file)
      setEditingItem((prev) => ({ ...prev, image: url }))
      toast.success('Image uploaded!')
    } catch {
      toast.error('Image upload failed.')
    } finally {
      setUploadingImage(false)
    }
  }

  // Save the editing item back into items array
  const handleSaveItemEdit = () => {
    if (!editingItem) return
    setItems((prev) =>
      prev.map((it) => (it.id === editingItem.id ? editingItem : it)),
    )
    setEditingItem(null)
    toast.success('Item settings updated.')
  }

  // Save & Publish to homepage
  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('Please enter a section title.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...section,
        title: title.trim(),
        subtitle: subtitle.trim(),
        contentType: 'marketplace',
        layout,
        columns: layout === 'grid2' ? 2 : columns,
        enabled,
        visible: enabled,
        showOnWebsite: true,
        showOnDesktopWeb: true,
        showOnMobileWeb: true,
        items,
      }

      await onSave(payload)
      toast.success('Marketplace section saved & published successfully!')
      if (onClose) onClose()
    } catch (err) {
      toast.error(err?.message || 'Failed to save marketplace section.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 min-h-[85vh]">
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-white border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-xl bg-[#FFF7ED] text-[#C45508] border border-orange-200">
              <ShoppingBag className="size-4" />
            </span>
            <h2 className="text-xl font-black text-slate-900">Marketplace Editor</h2>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
              Dynamic Builder
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Build custom mixed marketplace sections with Services, Categories, Service Types & Category Types.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {/* Device Preview Switcher */}
          <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setDevice('desktop')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                device === 'desktop'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="size-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('tablet')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                device === 'tablet'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Tablet className="size-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice('mobile')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                device === 'mobile'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="size-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          {/* Close Button */}
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          ) : null}

          {/* Save & Publish Button */}
          <button
            type="button"
            onClick={handlePublish}
            disabled={saving}
            className="flex items-center gap-2 rounded-xl bg-[#C45508] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#a84706] active:scale-95 transition disabled:opacity-50"
          >
            <Save className="size-3.5" />
            <span>{saving ? 'Publishing...' : 'Save & Publish to Homepage'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Left Editor Controls & Right Live Preview */}
      <div className="grid grid-cols-12 flex-1 gap-6 p-6 overflow-hidden">
        
        {/* Left Column (Col 6): Controls & Items List */}
        <div className="col-span-12 xl:col-span-6 flex flex-col gap-5 overflow-y-auto pr-1">
          
          {/* 1. Section Settings Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
              Section Settings
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Section Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Most Booked Home Appliance Repairs"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Subtitle (Optional)
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Certified technicians at your doorstep in 45 minutes"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-[#C45508] focus:ring-1 focus:ring-[#C45508] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Layout Style
                </label>
                <select
                  value={layout}
                  onChange={(e) => setLayout(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#C45508] outline-none"
                >
                  <option value="grid">Grid (Responsive Columns)</option>
                  <option value="grid2">2-Column Grid</option>
                  <option value="slider">Horizontal Slider (Carousel)</option>
                  <option value="list">List View</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Desktop Columns
                </label>
                <select
                  value={columns}
                  onChange={(e) => setColumns(Number(e.target.value))}
                  disabled={layout === 'grid2' || layout === 'list'}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-900 focus:border-[#C45508] outline-none disabled:opacity-50"
                >
                  <option value="2">2 Columns</option>
                  <option value="3">3 Columns</option>
                  <option value="4">4 Columns</option>
                </select>
              </div>
            </div>
          </div>

          {/* 2. Drag & Drop Items List */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex-1 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Marketplace Items ({items.length})
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Drag items to reorder. You can add multiple items of any type.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 rounded-xl bg-[#FFF7ED] text-[#C45508] border border-orange-200 px-3 py-1.5 text-xs font-bold hover:bg-orange-100 transition"
              >
                <Plus className="size-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {/* List */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center border-2 border-dashed border-slate-200 rounded-xl my-4">
                <ShoppingBag className="size-10 text-slate-300 mb-2" />
                <p className="text-xs font-bold text-slate-700">No items in this marketplace section yet</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                  Click "+ Add Item" above to choose services, categories, or service types from the database.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#C45508] text-white px-4 py-2 text-xs font-bold shadow-xs hover:bg-[#a84706] transition"
                >
                  <Plus className="size-3.5" />
                  <span>Add First Item</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-4 max-h-[460px] overflow-y-auto pr-1">
                {items.map((item, idx) => {
                  const resolved = resolveItemData(item)

                  const typeColor =
                    item.itemType === 'service'
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : item.itemType === 'category'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : item.itemType === 'serviceType'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-purple-50 text-purple-700 border-purple-200'

                  const typeLabel =
                    item.itemType === 'service'
                      ? 'Service'
                      : item.itemType === 'category'
                      ? 'Category'
                      : item.itemType === 'serviceType'
                      ? 'Service Type'
                      : 'Category Type'

                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, item.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        item.visible
                          ? 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                          : 'border-slate-200/60 bg-slate-50 opacity-60'
                      }`}
                    >
                      {/* Drag Handle */}
                      <div className="cursor-grab text-slate-300 hover:text-slate-500">
                        <GripVertical className="size-4" />
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative size-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                        {resolved.image ? (
                          <img
                            src={resolved.image}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          <Wrench className="size-5 text-slate-300" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${typeColor}`}>
                            {typeLabel}
                          </span>
                          {item.badge ? (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs font-bold text-slate-900 truncate mt-1">
                          {resolved.title}
                        </p>
                        {resolved.price ? (
                          <p className="text-[11px] font-semibold text-slate-500">
                            {resolved.price}
                          </p>
                        ) : null}
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Move Up */}
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          title="Move up"
                        >
                          <ArrowUp className="size-3.5" />
                        </button>
                        {/* Move Down */}
                        <button
                          type="button"
                          onClick={() => moveItem(idx, 'down')}
                          disabled={idx === items.length - 1}
                          className="p-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                          title="Move down"
                        >
                          <ArrowDown className="size-3.5" />
                        </button>
                        {/* Toggle Visibility */}
                        <button
                          type="button"
                          onClick={() => handleToggleVisible(item.id)}
                          className={`p-1 rounded transition ${
                            item.visible ? 'text-slate-500 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-200'
                          }`}
                          title={item.visible ? 'Visible' : 'Hidden'}
                        >
                          {item.visible ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                        </button>
                        {/* Edit Item Settings */}
                        <button
                          type="button"
                          onClick={() => setEditingItem({ ...item })}
                          className="p-1 rounded text-slate-500 hover:bg-slate-100"
                          title="Edit Title & Image"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        {/* Delete from section */}
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1 rounded text-red-500 hover:bg-red-50"
                          title="Remove from marketplace section (keeps DB record)"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Col 6): Interactive Live Device Preview */}
        <div className="col-span-12 xl:col-span-6 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Live Device Preview</h3>
              <p className="text-[11px] text-slate-400">
                Instantly reflects live website appearance on {device} view
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              {device === 'desktop' ? '1024px Wide' : device === 'tablet' ? '768px Wide' : '390px Mobile'}
            </span>
          </div>

          {/* Interactive Preview Canvas */}
          <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 rounded-xl flex justify-center items-start">
            <div
              className={`transition-all duration-300 bg-white rounded-2xl p-5 shadow-md border border-slate-200/80 ${
                device === 'desktop'
                  ? 'w-full max-w-2xl'
                  : device === 'tablet'
                  ? 'w-full max-w-md'
                  : 'w-full max-w-[340px]'
              }`}
            >
              {/* Header */}
              <div className="mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#C45508]">
                  Marketplace
                </span>
                <h4 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                  {title || 'Marketplace Title'}
                </h4>
                {subtitle ? (
                  <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
                ) : null}
              </div>

              {/* Items Grid / Slider in Preview */}
              {items.filter((it) => it.visible).length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No visible items to preview.
                </div>
              ) : layout === 'slider' ? (
                /* Slider Horizontal Carousel Preview */
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {items
                    .filter((it) => it.visible)
                    .map((item) => {
                      const resolved = resolveItemData(item)
                      return (
                        <div
                          key={item.id}
                          className="w-[150px] shrink-0 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs"
                        >
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2">
                            {resolved.image ? (
                              <img
                                src={resolved.image}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <Wrench className="size-6 text-slate-300 m-auto mt-6" />
                            )}
                            {item.itemType === 'service' ? (
                              <div className="absolute -bottom-1.5 right-1.5 bg-white text-[#5B21B6] px-2 py-0.5 text-[10px] font-black rounded border border-slate-200 shadow-xs">
                                Add
                              </div>
                            ) : null}
                          </div>
                          <p className="text-xs font-bold text-slate-900 line-clamp-1">
                            {resolved.title}
                          </p>
                          {resolved.price ? (
                            <p className="text-[11px] font-bold text-slate-800 mt-1">
                              {resolved.price}
                            </p>
                          ) : null}
                        </div>
                      )
                    })}
                </div>
              ) : (
                /* Grid Preview (Responsive 2, 3, or 4 cols) */
                <div
                  className={`grid gap-3 ${
                    device === 'mobile'
                      ? 'grid-cols-2'
                      : layout === 'grid2'
                      ? 'grid-cols-2'
                      : columns === 2
                      ? 'grid-cols-2'
                      : columns === 3
                      ? 'grid-cols-3'
                      : 'grid-cols-2 sm:grid-cols-4'
                  }`}
                >
                  {items
                    .filter((it) => it.visible)
                    .map((item) => {
                      const resolved = resolveItemData(item)
                      const isService = item.itemType === 'service'

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col rounded-2xl border border-slate-200/80 bg-white p-2 shadow-2xs"
                        >
                          {/* Image */}
                          <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-slate-100 mb-2">
                            {resolved.image ? (
                              <img
                                src={resolved.image}
                                alt=""
                                className="size-full object-cover"
                              />
                            ) : (
                              <div className="size-full flex items-center justify-center">
                                <Wrench className="size-6 text-slate-300" />
                              </div>
                            )}

                            {/* Overlapping Add Button for services */}
                            {isService ? (
                              <div className="absolute -bottom-1.5 right-1.5 bg-white text-[#5B21B6] px-2.5 py-0.5 text-[11px] font-black rounded-md border border-slate-200 shadow-xs">
                                Add
                              </div>
                            ) : null}
                          </div>

                          {/* Details */}
                          <div className="pt-1 flex flex-col flex-1 justify-between">
                            <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight">
                              {resolved.title}
                            </p>

                            {isService ? (
                              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                                <Star className="size-2.5 fill-slate-800 text-slate-800" />
                                <span className="font-bold text-slate-800">4.8</span>
                                <span>·</span>
                                <span>45 MINS</span>
                              </div>
                            ) : null}

                            {resolved.price ? (
                              <div className="mt-1 text-xs font-black text-slate-900">
                                {resolved.price}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* ADD ITEM MODAL                                                 */}
      {/* ============================================================== */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add Item to Marketplace
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Step 1: Choose Item Type */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                1. Select Item Type
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: 'service', label: 'Service', icon: Wrench },
                  { id: 'category', label: 'Category', icon: Layers },
                  { id: 'serviceType', label: 'Service Type', icon: FolderTree },
                  { id: 'serviceCategory', label: 'Category Type', icon: Tag },
                ].map((t) => {
                  const Icon = t.icon
                  const active = newItemType === t.id
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => {
                        setNewItemType(t.id)
                        setNewItemSearch('')
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        active
                          ? 'border-[#C45508] bg-[#FFF7ED] text-[#C45508] shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="size-4 mb-1" />
                      <span className="text-[11px]">{t.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: Search & Pick from DB */}
            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                2. Pick from Database ({selectableCandidates.length} available)
              </label>
              <input
                type="text"
                value={newItemSearch}
                onChange={(e) => setNewItemSearch(e.target.value)}
                placeholder="Search by title..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C45508] mb-2"
              />

              <div className="max-h-60 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-2 bg-slate-50">
                {selectableCandidates.length === 0 ? (
                  <p className="p-4 text-center text-xs text-slate-400">
                    No matching items found.
                  </p>
                ) : (
                  selectableCandidates.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleAddItem(c)}
                      className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200/80 hover:border-[#C45508] hover:bg-orange-50/40 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="size-8 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                          {c.image ? (
                            <img src={c.image} alt="" className="size-full object-cover" />
                          ) : (
                            <Wrench className="size-4 text-slate-300 m-auto mt-2" />
                          )}
                        </div>
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {c.title}
                          </p>
                          <span className="text-[10px] text-slate-400">{c.meta}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-[#C45508] text-white text-[10px] font-bold shadow-2xs hover:bg-[#a84706]"
                      >
                        Add
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* ============================================================== */}
      {/* EDIT SINGLE ITEM MODAL                                         */}
      {/* ============================================================== */}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Item in Marketplace
              </h3>
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Image Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Image
                </label>
                <div className="flex items-center gap-3">
                  <div className="size-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                    {editingItem.image ? (
                      <img src={editingItem.image} alt="" className="size-full object-cover" />
                    ) : (
                      <Wrench className="size-6 text-slate-300 m-auto mt-5" />
                    )}
                  </div>
                  <div>
                    <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer">
                      <Upload className="size-3.5" />
                      <span>{uploadingImage ? 'Uploading...' : 'Upload New Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => void handleImageUpload(e.target.files?.[0] || null)}
                      />
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">Replaces image in marketplace card</p>
                  </div>
                </div>
              </div>

              {/* Title Override */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Custom Title (Optional)
                </label>
                <input
                  type="text"
                  value={editingItem.title || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="Leave empty to use database title"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C45508]"
                />
              </div>

              {/* Badge Text */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Badge Text (e.g. "Popular", "30 mins", "Top Rated")
                </label>
                <input
                  type="text"
                  value={editingItem.badge || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                  placeholder="Badge text"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-900 outline-none focus:border-[#C45508]"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveItemEdit}
                  className="flex-1 rounded-xl bg-[#C45508] py-2.5 text-xs font-bold text-white shadow-xs hover:bg-[#a84706]"
                >
                  Save Item
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

    </div>
  )
}
