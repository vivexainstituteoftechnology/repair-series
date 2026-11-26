import React, { useEffect, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { toast } from 'sonner'
import {
  Sparkles,
  Layers,
  FolderTree,
  LayoutGrid,
  Image as ImageIcon,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Plus,
  Upload,
  Link2,
} from 'lucide-react'
import { db } from '../firebase/config'
import { Button, Card, Badge, Modal, Field, Input, Textarea } from './ui'
import { setDocumentReplace, removeDoc } from '../services/firestore'
import { uploadToCloudinary } from '../services/cloudinary'
import { websiteApiOrigin } from '../services/websiteOrigin'
import { WallPanelCategoriesTab } from './wall-panel/WallPanelCategoriesTab'
import { WallPanelProductsTab } from './wall-panel/WallPanelProductsTab'
import { WallPanelSectionsTab } from './wall-panel/WallPanelSectionsTab'
import { WallPanelBannersTab } from './wall-panel/WallPanelBannersTab'
import { WallPanelLivePreviewTab } from './wall-panel/WallPanelLivePreviewTab'
import { seedWallPanelsData } from './wall-panel/WallPanelSeedData'

export function WallPanelDesignStudio() {
  const [activeTab, setActiveTab] = useState('products') // 'products' | 'categories' | 'sections' | 'banners' | 'preview' | 'legacy'
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [sections, setSections] = useState([])
  const [banners, setBanners] = useState([])
  const [legacyDesigns, setLegacyDesigns] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)

  // Legacy design modal state
  const [legacyModalOpen, setLegacyModalOpen] = useState(false)
  const [legacyForm, setLegacyForm] = useState({
    id: '',
    name: '',
    designCode: '',
    description: '',
    active: true,
    sortOrder: '0',
    imageUrl: '',
  })

  // 1. Subscribe to all collections
  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    const unsubCategories = onSnapshot(collection(db, 'wallPanelCategories'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
      setCategories(list)
    })

    const unsubProducts = onSnapshot(collection(db, 'wallPanelProducts'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
      setProducts(list)
    })

    const unsubSections = onSnapshot(collection(db, 'wallPanelSections'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
      setSections(list)
    })

    const unsubBanners = onSnapshot(collection(db, 'wallPanelBanners'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
      setBanners(list)
    })

    const unsubLegacy = onSnapshot(collection(db, 'wallPanelDesigns'), (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => Number(a.sortOrder ?? 0) - Number(b.sortOrder ?? 0))
      setLegacyDesigns(list)
      setLoading(false)
    })

    return () => {
      unsubCategories()
      unsubProducts()
      unsubSections()
      unsubBanners()
      unsubLegacy()
    }
  }, [])

  // 2. Seed showcase data
  const handleSeedShowcase = async () => {
    const hasData = categories.length > 0 || products.length > 0 || sections.length > 0
    if (
      hasData &&
      !window.confirm(
        'Populate / Sync official showroom data (Categories, Products, Sections, Hero Banners)? Existing matching items will be updated.',
      )
    ) {
      return
    }

    setSeeding(true)
    try {
      await seedWallPanelsData(db)
      toast.success('Showroom data seeded successfully! All collections synced.')
    } catch (err) {
      toast.error(err?.message || 'Seeding failed')
    } finally {
      setSeeding(false)
    }
  }

  const tabs = [
    {
      id: 'products',
      label: 'Products & Designs',
      icon: Layers,
      count: products.length,
    },
    {
      id: 'categories',
      label: 'Categories',
      icon: FolderTree,
      count: categories.length,
    },
    {
      id: 'sections',
      label: 'Dynamic Sections',
      icon: LayoutGrid,
      count: sections.length,
    },
    {
      id: 'banners',
      label: 'Hero Banners',
      icon: ImageIcon,
      count: banners.length,
    },
    {
      id: 'preview',
      label: 'Live Preview',
      icon: Smartphone,
      badge: 'Interactive',
    },
    {
      id: 'legacy',
      label: 'Legacy Designs',
      icon: Sparkles,
      count: legacyDesigns.length,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Top Banner Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-orange-950 via-stone-900 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-orange-900/40">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Wall Panels Studio Management
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-600/40 text-orange-200 border border-orange-500/30">
              v2.0 Architectural
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-300 mt-1 max-w-2xl leading-relaxed">
            Manage Wall Panels categories, products, starting prices with dimensions, configurable components, dynamic layout sections (Slider, Slideshow, List, Grid), and hero banners.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSeedShowcase}
            loading={seeding}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs font-bold"
          >
            <RefreshCw className="size-3.5 mr-1.5" />
            Seed Showcase Data
          </Button>

          <a
            href={`${websiteApiOrigin()}/wall-panel`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-[#C45508] text-white text-xs font-bold hover:bg-[#A84504] shadow-md transition-all"
          >
            <span>Live Customer Studio</span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'border-[#C45508] text-[#C45508]'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {tab.count != null ? (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                    isActive
                      ? 'bg-orange-100 text-[#C45508] dark:bg-orange-950/80 dark:text-orange-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              ) : tab.badge ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {/* Tab Panels */}
      {loading ? (
        <Card className="py-12 text-center text-sm text-slate-500">
          Loading Wall Panels Studio collections from Firestore...
        </Card>
      ) : (
        <div>
          {activeTab === 'products' ? (
            <WallPanelProductsTab
              products={products}
              categories={categories}
              onReload={() => {}}
            />
          ) : null}

          {activeTab === 'categories' ? (
            <WallPanelCategoriesTab
              categories={categories}
              onReload={() => {}}
            />
          ) : null}

          {activeTab === 'sections' ? (
            <WallPanelSectionsTab
              sections={sections}
              categories={categories}
              products={products}
              onReload={() => {}}
            />
          ) : null}

          {activeTab === 'banners' ? (
            <WallPanelBannersTab
              banners={banners}
              onReload={() => {}}
            />
          ) : null}

          {activeTab === 'preview' ? (
            <WallPanelLivePreviewTab
              banners={banners}
              categories={categories}
              products={products}
              sections={sections}
            />
          ) : null}

          {activeTab === 'legacy' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Legacy Designs Collection (wallPanelDesigns)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Maintained for 100% backward compatibility with legacy orders and booking references.
                  </p>
                </div>
                <Badge tone="neutral">{legacyDesigns.length} records</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {legacyDesigns.map((row) => (
                  <Card key={row.id} className="overflow-hidden p-0">
                    <img
                      src={row.imageUrl || row.images?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600'}
                      alt=""
                      className="h-36 w-full object-cover"
                    />
                    <div className="p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm">{row.name}</h4>
                        <Badge tone={row.active === false ? 'warning' : 'success'} size="sm">
                          {row.active === false ? 'Inactive' : 'Active'}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1">{row.description}</p>
                      <p className="text-[11px] font-semibold text-[#C45508]">ID: {row.designCode || row.id}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
