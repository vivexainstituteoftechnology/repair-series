import { useState, useMemo, useEffect } from 'react'
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
  Wrench,
  Layers,
  FolderTree,
  Tag,
  Sparkles,
  LayoutGrid,
} from 'lucide-react'
import { toast } from 'sonner'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { uploadToCloudinary } from '../services/cloudinary'
import { catalogTitle } from '../utils/catalogHierarchy'

export const DEFAULT_HERO_ITEMS = [
  {
    id: 'hero_1',
    itemType: 'category',
    targetId: 'ac-appliance',
    title: 'AC & Appliance Repair',
    badge: '30 mins',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=150&auto=format&fit=crop&q=80',
    visible: true,
    displayOrder: 1,
  },
  {
    id: 'hero_2',
    itemType: 'category',
    targetId: 'electrician-plumber',
    title: 'Electrician, Plumber & Carpenter',
    badge: '25 mins',
    image: 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=150&auto=format&fit=crop&q=80',
    visible: true,
    displayOrder: 2,
  },
  {
    id: 'hero_3',
    itemType: 'category',
    targetId: 'washing-fridge',
    title: 'Washing Machine & Refrigerator',
    badge: '45 mins',
    image: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=150&auto=format&fit=crop&q=80',
    visible: true,
    displayOrder: 3,
  },
  {
    id: 'hero_4',
    itemType: 'category',
    targetId: 'cleaning-pest',
    title: 'Cleaning & Pest Control',
    badge: '45 mins',
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=150&auto=format&fit=crop&q=80',
    visible: true,
    displayOrder: 4,
  },
  {
    id: 'hero_5',
    itemType: 'category',
    targetId: 'wall-panels',
    title: 'Wall Panels by Repair Series',
    badge: '★ Studio',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=150&auto=format&fit=crop&q=80',
    visible: true,
    displayOrder: 5,
  },
  {
    id: 'hero_6',
    itemType: 'category',
    targetId: 'kitchen-chimney',
    title: 'Kitchen & Chimney Service',
    badge: '30 mins',
    image: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=150&auto=format&fit=crop&q=80',
    visible: true,
    displayOrder: 6,
  },
  {
    id: 'hero_7',
    itemType: 'category',
    targetId: 'ro-water',
    title: 'RO Water Purifier Repair',
    badge: '20 mins',
    image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=150&auto=format&fit=crop&q=80',
    visible: true,
    displayOrder: 7,
  },
  {
    id: 'hero_8',
    itemType: 'category',
    targetId: 'painting-upgrade',
    title: 'Home Painting & Waterproofing',
    badge: 'Same day',
    image: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=150&auto=format&fit=crop&q=80',
    visible: true,
    displayOrder: 8,
  },
]

export function HeroMarketplaceEditor({
  onClose,
  services = [],
  categories = [],
  serviceTypes = [],
  serviceCategories = [],
}) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [device, setDevice] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'

  // Drag and drop state
  const [draggedId, setDraggedId] = useState(null)

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItemType, setNewItemType] = useState('category') // 'service' | 'category' | 'serviceType' | 'serviceCategory'
  const [newItemSearch, setNewItemSearch] = useState('')

  // Edit Single Item Modal
  const [editingItem, setEditingItem] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Fetch initial config from Firestore
  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getDoc(doc(db, 'settings', 'heroMarketplace'))
      .then((snap) => {
        if (cancelled) return
        const data = snap.exists() ? snap.data() : {}
        if (Array.isArray(data.items) && data.items.length > 0) {
          setItems(data.items.map((it, idx) => ({ ...it, displayOrder: it.displayOrder ?? idx + 1 })))
        } else {
          setItems(DEFAULT_HERO_ITEMS)
        }
      })
      .catch(() => {
        if (!cancelled) setItems(DEFAULT_HERO_ITEMS)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  // Filter selectable items for the Add modal
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

  // Resolve item fallback details
  const resolveItemData = (item) => {
    let fallback = { title: item.title || 'Item', image: item.image || '' }
    if (item.itemType === 'service') {
      const s = services.find((x) => x.id === item.targetId)
      if (s) {
        fallback = {
          title: s.name || s.title || fallback.title,
          image: s.image || s.imageUrl || s.homeImage || fallback.image,
        }
      }
    } else if (item.itemType === 'category') {
      const c = categories.find((x) => x.id === item.targetId)
      if (c) {
        fallback = {
          title: catalogTitle(c) || fallback.title,
          image: c.image || c.imageUrl || c.homeImage || c.icon || fallback.image,
        }
      }
    } else if (item.itemType === 'serviceType') {
      const st = serviceTypes.find((x) => x.id === item.targetId)
      if (st) {
        fallback = {
          title: catalogTitle(st) || fallback.title,
          image: st.image || st.imageUrl || st.homeImage || st.icon || fallback.image,
        }
      }
    } else if (item.itemType === 'serviceCategory') {
      const sc = serviceCategories.find((x) => x.id === item.targetId)
      if (sc) {
        fallback = {
          title: catalogTitle(sc) || fallback.title,
          image: sc.image || sc.imageUrl || sc.homeImage || sc.icon || fallback.image,
        }
      }
    }

    return {
      title: item.title || fallback.title,
      image: item.image || fallback.image,
    }
  }

  // Add Item to Hero Marketplace
  const handleAddItem = (candidate) => {
    const newItem = {
      id: `hero_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      itemType: newItemType,
      targetId: candidate.id,
      title: candidate.title,
      image: candidate.image,
      badge: newItemType === 'service' ? '45 mins' : '30 mins',
      visible: true,
      displayOrder: items.length + 1,
    }

    setItems((prev) => [...prev, newItem])
    setShowAddModal(false)
    setNewItemSearch('')
    toast.success(`Added ${candidate.title} to Hero Marketplace!`)
  }

  // Remove Item
  const handleRemoveItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id))
    toast.info('Item removed from Hero Marketplace (database record preserved).')
  }

  // Toggle Visibility
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

  // Image Upload
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

  // Save Item Edit
  const handleSaveItemEdit = () => {
    if (!editingItem) return
    setItems((prev) =>
      prev.map((it) => (it.id === editingItem.id ? editingItem : it)),
    )
    setEditingItem(null)
    toast.success('Item details updated.')
  }

  // Save & Publish to Firestore
  const handlePublish = async () => {
    setSaving(true)
    try {
      await setDoc(
        doc(db, 'settings', 'heroMarketplace'),
        {
          items,
          updatedAt: new Date().toISOString(),
        },
        { merge: true },
      )
      toast.success('Hero Marketplace published! Changes are now live on the website.')
      if (onClose) onClose()
    } catch (err) {
      toast.error(err?.message || 'Failed to save Hero Marketplace.')
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
              <Sparkles className="size-4" />
            </span>
            <h2 className="text-xl font-black text-slate-900">Hero Marketplace Customizer</h2>
            <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold">
              Top Homepage Section
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Customize the signature 4-column Hero Marketplace grid displayed at the top of the homepage.
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

          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
          ) : null}

          <button
            type="button"
            onClick={handlePublish}
            disabled={saving || loading}
            className="flex items-center gap-2 rounded-xl bg-[#C45508] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#a84706] active:scale-95 transition disabled:opacity-50"
          >
            <Save className="size-3.5" />
            <span>{saving ? 'Publishing...' : 'Save & Publish to Homepage'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split: Left Items List & Right Live Preview */}
      <div className="grid grid-cols-12 flex-1 gap-6 p-6 overflow-hidden">
        
        {/* Left Column (Col 6): Drag & Drop Items Management */}
        <div className="col-span-12 xl:col-span-6 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Hero Grid Items ({items.length})
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Drag to reorder. Toggle visibility or edit title, image and arrival badge.
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

          {/* Items List */}
          <div className="space-y-2 flex-1 overflow-y-auto pr-1">
            {items.map((item, idx) => {
              const resolved = resolveItemData(item)

              const typeBadgeColor =
                item.itemType === 'service'
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : item.itemType === 'category'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : item.itemType === 'serviceType'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-purple-50 text-purple-700 border-purple-200'

              const typeBadgeLabel =
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
                  <div className="cursor-grab text-slate-300 hover:text-slate-500">
                    <GripVertical className="size-4" />
                  </div>

                  <div className="relative size-12 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 flex items-center justify-center">
                    {resolved.image ? (
                      <img src={resolved.image} alt="" className="size-full object-cover" />
                    ) : (
                      <Wrench className="size-5 text-slate-300" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${typeBadgeColor}`}>
                        {typeBadgeLabel}
                      </span>
                      {item.badge ? (
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[9px] font-black">
                          {item.badge}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs font-bold text-slate-900 truncate mt-1">
                      {resolved.title}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                      title="Move up"
                    >
                      <ArrowUp className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, 'down')}
                      disabled={idx === items.length - 1}
                      className="p-1 rounded text-slate-400 hover:bg-slate-100 disabled:opacity-30"
                      title="Move down"
                    >
                      <ArrowDown className="size-3.5" />
                    </button>
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
                    <button
                      type="button"
                      onClick={() => setEditingItem({ ...item })}
                      className="p-1 rounded text-slate-500 hover:bg-slate-100"
                      title="Edit Item"
                    >
                      <Pencil className="size-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1 rounded text-red-500 hover:bg-red-50"
                      title="Remove from Hero Marketplace"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column (Col 6): Live Website Hero Marketplace Preview */}
        <div className="col-span-12 xl:col-span-6 flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-xs overflow-hidden">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hero Marketplace Preview</h3>
              <p className="text-[11px] text-slate-400">
                Matches the live website Hero Marketplace appearance on {device}
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-2 py-1 rounded border border-slate-100">
              {device === 'desktop' ? 'Desktop Grid' : device === 'tablet' ? 'Tablet Grid' : 'Mobile Grid'}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-100/70 p-4 rounded-xl flex justify-center items-start">
            <div
              className={`transition-all duration-300 bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 ${
                device === 'desktop'
                  ? 'w-full max-w-xl'
                  : device === 'tablet'
                  ? 'w-full max-w-md'
                  : 'w-full max-w-[340px]'
              }`}
            >
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                {items
                  .filter((it) => it.visible)
                  .map((item, idx) => {
                    const resolved = resolveItemData(item)
                    return (
                      <div
                        key={item.id}
                        className="group relative flex flex-col items-center text-center p-2 rounded-2xl border border-slate-200/80 bg-white hover:shadow-xs transition"
                      >
                        {item.badge ? (
                          <span className="absolute top-1.5 right-1.5 z-10 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] sm:text-[9px] font-black text-emerald-700 border border-emerald-200 shadow-2xs">
                            {item.badge}
                          </span>
                        ) : null}

                        <div className="relative size-12 sm:size-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 mb-1.5 flex items-center justify-center p-1">
                          {resolved.image ? (
                            <img
                              src={resolved.image}
                              alt=""
                              className="size-full object-cover rounded-lg"
                            />
                          ) : (
                            <Wrench className="size-5 text-slate-300" />
                          )}
                        </div>

                        <span className="text-[10px] sm:text-[11px] font-bold text-slate-800 line-clamp-2 leading-tight">
                          {resolved.title}
                        </span>
                      </div>
                    )
                  })}
              </div>

              {/* Bottom Studio Banner */}
              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-900 px-3.5 py-2.5 text-white">
                <div>
                  <span className="text-[11px] font-bold block">Wall Panels Studio</span>
                  <span className="text-[9px] text-slate-400 block">Fluted & charcoal panels</span>
                </div>
                <span className="text-[10px] font-bold text-orange-400">Explore →</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ADD ITEM MODAL */}
      {showAddModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Add Item to Hero Marketplace
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

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

      {/* EDIT SINGLE ITEM MODAL */}
      {editingItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Edit Hero Marketplace Item
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
                    <p className="text-[10px] text-slate-400 mt-1">Replaces icon in Hero Marketplace</p>
                  </div>
                </div>
              </div>

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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Speed / Arrival Badge (e.g. "30 mins", "25 mins", "★ Studio")
                </label>
                <input
                  type="text"
                  value={editingItem.badge || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                  placeholder="e.g. 30 mins"
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
