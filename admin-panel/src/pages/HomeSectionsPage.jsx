import { useEffect, useMemo, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  ClipboardPaste,
  Copy,
  Eye,
  EyeOff,
  FolderInput,
  GripVertical,
  LayoutGrid,
  Pencil,
  Plus,
  Trash2,
  Sparkles,
  ShoppingBag,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Badge,
  Button,
  Card,
  Field,
  Input,
  Modal,
  PageHeader,
  Select,
  Textarea,
} from '../components/ui'
import {
  HOME_SECTION_CONTENT_LABELS,
  HOME_SECTION_CONTENT_TYPES,
  HOME_SECTION_LAYOUT_LABELS,
  HOME_SECTION_LAYOUTS,
  HOME_SECTION_SELECTION_MODES,
  emptyHomeSectionForm,
  normalizeHomeSectionBannerImages,
} from '../constants/homeSections'
import {
  DEFAULT_HOME_CHROME_STICKY,
  DEFAULT_CATALOG_CHROME,
  normalizeCatalogChrome,
  normalizeHomeChromeSticky,
} from '../utils/homeChromeSettings'
import { HomeSectionBannerSlidesEditor } from '../components/HomeSectionBannerSlidesEditor'
import { MarketplaceSectionEditor } from '../components/MarketplaceSectionEditor'
import { uploadToCloudinary } from '../services/cloudinary'
import { useApp } from '../context/useApp'
import { catalogTitle } from '../utils/catalogHierarchy'

function selectionModesFor(contentType) {
  if (['static', 'search', 'banners', 'fullWidthBanner'].includes(contentType)) return []
  if (['categories', 'serviceTypes', 'serviceCategories', 'variations'].includes(contentType)) {
    return HOME_SECTION_SELECTION_MODES.filter((m) => ['manual', 'all'].includes(m.value))
  }
  return HOME_SECTION_SELECTION_MODES
}

const GLOBAL_KEY = '__global__'

export function HomeSectionsPage() {
  const {
    homeSections,
    services,
    categories,
    serviceTypes,
    serviceCategories,
    loading,
    mutating,
    upsertHomeSection,
    upsertHomeConfiguration,
    deleteHomeSection,
    duplicateHomeSection,
    copyHomeSectionsToServiceType,
    deleteMultipleHomeSections,
    reorderHomeSections,
  } = useApp()

  const [scopeId, setScopeId] = useState(GLOBAL_KEY)
  const typeId = scopeId === GLOBAL_KEY ? '' : scopeId
  const currentType = (serviceTypes || []).find((t) => t.id === typeId) || null
  const currentTypeName = currentType ? catalogTitle(currentType) : 'Current Screen'
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(() => emptyHomeSectionForm())
  const [uploading, setUploading] = useState(false)
  const [itemFilter, setItemFilter] = useState('')
  const [dragId, setDragId] = useState('')
  const [chromeSticky, setChromeSticky] = useState(() => ({ ...DEFAULT_HOME_CHROME_STICKY }))
  const [catalogChrome, setCatalogChrome] = useState(() => ({ ...DEFAULT_CATALOG_CHROME }))
  const [marketplaceEditorOpen, setMarketplaceEditorOpen] = useState(false)
  const [editingMarketplaceSection, setEditingMarketplaceSection] = useState(null)

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  // Clipboard for copy & paste across screens
  const [clipboard, setClipboard] = useState(() => {
    try {
      const raw = localStorage.getItem('RS_COPIED_HOME_SECTIONS')
      return raw ? JSON.parse(raw) : []
    } catch {
      return []
    }
  })

  // Copy to Screen Modal state
  const [copyToModalOpen, setCopyToModalOpen] = useState(false)
  const [copyTargetSections, setCopyTargetSections] = useState([])
  const [destTypeId, setDestTypeId] = useState('')
  const [appendCopySuffix, setAppendCopySuffix] = useState(false)

  // Copy from Screen (Import) Modal state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importSourceTypeId, setImportSourceTypeId] = useState('')
  const [importSelectedIds, setImportSelectedIds] = useState(() => new Set())

  // Clear selection when active screen changes
  useEffect(() => {
    setSelectedIds(new Set())
  }, [scopeId])

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    if (sorted.length > 0 && selectedIds.size === sorted.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(sorted.map((r) => r.id)))
    }
  }

  const handleCopySelectedToClipboard = (items) => {
    const toCopy = (items || sorted).filter((s) => selectedIds.has(s.id))
    if (!toCopy.length) return
    setClipboard(toCopy)
    try {
      localStorage.setItem('RS_COPIED_HOME_SECTIONS', JSON.stringify(toCopy))
    } catch {}
    toast.success(
      `Copied ${toCopy.length} section${toCopy.length > 1 ? 's' : ''} to clipboard. Switch to any home screen and click Paste!`,
    )
  }

  const handlePasteFromClipboard = async () => {
    if (!clipboard.length) return
    if (!typeId) {
      toast.error('Select a target service type first.')
      return
    }
  
    const targetName = currentType ? catalogTitle(currentType) : 'current home screen'
    try {
      await copyHomeSectionsToServiceType({
        sections: clipboard,
        targetServiceTypeId: typeId,
        appendCopySuffix: false,
      })
      toast.success(`Pasted ${clipboard.length} section${clipboard.length > 1 ? 's' : ''} to ${targetName}.`)
    } catch (err) {
      toast.error(err?.message || 'Could not paste sections.')
    }
  }

  const clearClipboard = () => {
    setClipboard([])
    try {
      localStorage.removeItem('RS_COPIED_HOME_SECTIONS')
    } catch {}
    toast.info('Clipboard cleared.')
  }

  const openCopyToModal = (sections) => {
    setCopyTargetSections(sections)
    const others = (serviceTypes || []).filter((t) => t.id !== typeId)
    setDestTypeId(others[0]?.id || '')
    setAppendCopySuffix(false)
    setCopyToModalOpen(true)
  }

  const handleConfirmCopyTo = async () => {
    if (!destTypeId) {
      toast.error('Please choose a destination home screen.')
      return
    }
    const destType = (serviceTypes || []).find((t) => t.id === destTypeId)
    const destName = destType ? catalogTitle(destType) : 'target screen'
    try {
      await copyHomeSectionsToServiceType({
        sections: copyTargetSections,
        targetServiceTypeId: destTypeId,
        appendCopySuffix,
      })
      setCopyToModalOpen(false)
      setSelectedIds(new Set())
      toast.success(
        `Copied ${copyTargetSections.length} section${copyTargetSections.length > 1 ? 's' : ''} to ${destName}.`,
        {
          action: {
            label: `View ${destName}`,
            onClick: () => setScopeId(destTypeId),
          },
        },
      )
    } catch (err) {
      toast.error(err?.message || 'Could not copy sections.')
    }
  }

  const openImportModal = () => {
    const othersWithSections = (serviceTypes || []).filter((t) => {
      if (t.id === typeId) return false
      return (homeSections || []).some((s) => String(s.serviceTypeId || '') === t.id)
    })
    const initialSource =
      othersWithSections[0]?.id || (serviceTypes || []).find((t) => t.id !== typeId)?.id || ''
    setImportSourceTypeId(initialSource)
    const sourceSections = (homeSections || []).filter(
      (s) => String(s.serviceTypeId || '') === initialSource,
    )
    setImportSelectedIds(new Set(sourceSections.map((s) => s.id)))
    setImportModalOpen(true)
  }

  const sourceSectionsForImport = useMemo(() => {
    if (!importSourceTypeId) return []
    return (homeSections || [])
      .filter((s) => String(s.serviceTypeId || '') === String(importSourceTypeId))
      .sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0))
  }, [homeSections, importSourceTypeId])

  const handleConfirmImport = async () => {
    const selectedSections = sourceSectionsForImport.filter((s) => importSelectedIds.has(s.id))
    if (!selectedSections.length) {
      toast.error('Select at least one section to copy.')
      return
    }
  
    const targetName = currentType ? catalogTitle(currentType) : 'this home screen'
    try {
      await copyHomeSectionsToServiceType({
        sections: selectedSections,
        targetServiceTypeId: typeId,
        appendCopySuffix: false,
      })
      setImportModalOpen(false)
      toast.success(
        `Copied ${selectedSections.length} section${selectedSections.length > 1 ? 's' : ''} to ${targetName}.`,
      )
    } catch (err) {
      toast.error(err?.message || 'Could not copy sections.')
    }
  }

  const handleDeleteSelected = async () => {
    const count = selectedIds.size
    if (!count) return
    if (!window.confirm(`Delete ${count} selected section${count > 1 ? 's' : ''}? This cannot be undone.`))
      return
    try {
      await deleteMultipleHomeSections([...selectedIds])
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(err?.message || 'Could not delete selected sections.')
    }
  }

  const handleDuplicateSelected = async () => {
    const selected = sorted.filter((s) => selectedIds.has(s.id))
    if (!selected.length) return
    try {
      await copyHomeSectionsToServiceType({
        sections: selected,
        targetServiceTypeId: typeId,
        appendCopySuffix: true,
      })
      setSelectedIds(new Set())
    } catch (err) {
      toast.error(err?.message || 'Could not duplicate selected sections.')
    }
  }



  useEffect(() => {
    if (scopeId !== GLOBAL_KEY) return
    const first = (serviceTypes || [])[0]?.id
    if (first) setScopeId(first)
  }, [serviceTypes, scopeId])

  const hasUnassigned = useMemo(
    () => (homeSections || []).some((row) => !String(row.serviceTypeId || '').trim()),
    [homeSections],
  )


  useEffect(() => {
    if (!typeId) {
      setChromeSticky({ ...DEFAULT_HOME_CHROME_STICKY })
      setCatalogChrome({ ...DEFAULT_CATALOG_CHROME })
      return
    }
    let cancelled = false
    getDoc(doc(db, 'homeConfigurations', typeId))
      .then((snap) => {
        if (cancelled) return
        const data = snap.exists() ? snap.data() : {}
        setChromeSticky(normalizeHomeChromeSticky(data.chrome || data))
        setCatalogChrome(normalizeCatalogChrome(data.catalogChrome))
      })
      .catch(() => {
        if (!cancelled) {
          setChromeSticky({ ...DEFAULT_HOME_CHROME_STICKY })
          setCatalogChrome({ ...DEFAULT_CATALOG_CHROME })
        }
      })
    return () => {
      cancelled = true
    }
  }, [typeId])

  const sorted = useMemo(() => {
    return (homeSections || [])
      .filter((row) => String(row.serviceTypeId || '') === String(typeId))
      .sort((a, b) => {
        const oa = Number(a.displayOrder ?? 0)
        const ob = Number(b.displayOrder ?? 0)
        if (oa !== ob) return oa - ob
        return String(a.title || '').localeCompare(String(b.title || ''))
      })
  }, [homeSections, typeId])

  const selectableItems = useMemo(() => {
    const q = itemFilter.toLowerCase().trim()
    const isManual = form.selectionMode === 'manual'
    const sourceTypeId = String(form.sourceServiceTypeId || '').trim()

    let effectiveTypeId = ''
    if (sourceTypeId === '__all__') {
      effectiveTypeId = ''
    } else if (sourceTypeId) {
      effectiveTypeId = sourceTypeId
    } else if (!isManual) {
      effectiveTypeId = String(form.serviceTypeId || typeId || '')
    }

    const catFilter = String(form.categoryId || '')
    const issueFilter = String(form.serviceCategoryId || '')
    const matchType = (row) => !effectiveTypeId || String(row.serviceTypeId || '') === effectiveTypeId
    const matchCat = (row) => !catFilter || String(row.categoryId || '') === catFilter
    const matchIssue = (row) => !issueFilter || String(row.serviceCategoryId || '') === issueFilter
    const byName = (row) =>
      !q || catalogTitle(row).toLowerCase().includes(q) || String(row.name || '').toLowerCase().includes(q)

    const typeMap = new Map((serviceTypes || []).map((t) => [String(t.id), catalogTitle(t)]))
    const catMap = new Map((categories || []).map((c) => [String(c.id), catalogTitle(c)]))

    if (form.contentType === 'serviceTypes') {
      return (serviceTypes || []).filter(byName)
    }
    if (form.contentType === 'categories') {
      return (categories || [])
        .filter((c) => matchType(c) && byName(c))
        .map((c) => ({
          ...c,
          displaySubtitle: typeMap.get(String(c.serviceTypeId)) || '',
        }))
    }
    if (form.contentType === 'serviceCategories') {
      return (serviceCategories || [])
        .filter((c) => matchType(c) && matchCat(c) && byName(c))
        .map((c) => ({
          ...c,
          displaySubtitle: [
            typeMap.get(String(c.serviceTypeId)),
            catMap.get(String(c.categoryId)),
          ].filter(Boolean).join(' · '),
        }))
    }
    if (form.contentType === 'variations') {
      return (services || [])
        .filter((s) => matchType(s) && matchCat(s) && matchIssue(s))
        .flatMap((s) =>
          (Array.isArray(s.variations) ? s.variations : []).map((v) => ({
            ...v,
            id: v.id,
            name: `${catalogTitle(s)} · ${catalogTitle(v)}`,
            displaySubtitle: [
              typeMap.get(String(s.serviceTypeId)),
              catMap.get(String(s.categoryId)),
            ].filter(Boolean).join(' · '),
          })),
        )
        .filter(byName)
    }
    if (form.contentType === 'services') {
      const mode = form.selectionMode
      return (services || [])
        .filter((s) => {
          const status = String(s.status || 'Active')
          if (String(mode).startsWith('coming_soon')) return status === 'Coming Soon'
          return status === 'Active'
        })
        .filter((s) => matchType(s) && matchCat(s) && matchIssue(s) && byName(s))
        .map((s) => ({
          ...s,
          displaySubtitle: [
            typeMap.get(String(s.serviceTypeId)),
            catMap.get(String(s.categoryId)),
          ].filter(Boolean).join(' · '),
        }))
    }
    return []
  }, [
    categories,
    services,
    serviceTypes,
    serviceCategories,
    form.contentType,
    form.selectionMode,
    form.sourceServiceTypeId,
    form.serviceTypeId,
    form.categoryId,
    form.serviceCategoryId,
    itemFilter,
    typeId,
  ])

  const reset = () => {
    setForm(emptyHomeSectionForm(typeId))
    setItemFilter('')
    setOpen(false)
    setUploading(false)
  }

  const openCreate = () => {
    const nextOrder = sorted.reduce((max, row) => Math.max(max, Number(row.displayOrder) || 0), 0) + 10
    setForm({ ...emptyHomeSectionForm(typeId), displayOrder: nextOrder })
    setItemFilter('')
    setOpen(true)
  }

  const openEdit = (row) => {
    if (row.contentType === 'marketplace' || row.type === 'marketplace') {
      setEditingMarketplaceSection(row)
      setMarketplaceEditorOpen(true)
      return
    }
    setForm({
      ...emptyHomeSectionForm(typeId),
      ...row,
      id: row.id,
      title: row.title ?? '',
      subtitle: row.subtitle ?? '',
      layout: row.layout || 'grid',
      contentType: row.contentType || row.type || 'categories',
      selectionMode: row.selectionMode || 'all',
      itemIds: Array.isArray(row.itemIds) ? row.itemIds : [],
      columns: Number(row.columns ?? 4),
      rows: Number(row.rows ?? 0),
      maxItems: Number(row.maxItems ?? 0),
      enabled: row.enabled !== false,
      showOnApp: row.showOnApp !== false,
      showOnWebsite: row.showOnWebsite !== false,
      showOnMobileWeb:
        row.showOnMobileWeb !== undefined ? row.showOnMobileWeb !== false : row.showOnWebsite !== false,
      showOnDesktopWeb:
        row.showOnDesktopWeb !== undefined ? row.showOnDesktopWeb !== false : row.showOnWebsite !== false,
      displayOrder: Number(row.displayOrder ?? 0),
      showViewAll: Boolean(row.showViewAll),
      viewAllPath: row.viewAllPath || '',
      staticBody: row.staticBody || '',
      staticImage: row.staticImage || '',
      staticCtaLabel: row.staticCtaLabel || '',
      staticCtaLink: row.staticCtaLink || '',
      serviceTypeId: String(row.serviceTypeId || typeId || ''),
      sourceServiceTypeId: String(row.sourceServiceTypeId || ''),
      categoryId: String(row.categoryId || ''),
      serviceCategoryId: String(row.serviceCategoryId || ''),
      images: normalizeHomeSectionBannerImages(row.images),
      settings: {
        height: Number(row.settings?.height ? (Number(row.settings.height) <= 188 ? 220 : Number(row.settings.height)) : 220),
        imageWidth: row.settings?.imageWidth || (row.contentType === 'fullWidthBanner' ? 'fit' : 'full'),
        imageFit: row.settings?.imageFit || (row.contentType === 'fullWidthBanner' ? 'fit' : 'cover'),
        autoplay: row.settings?.autoplay !== false,
        slideDuration: Number(row.settings?.slideDuration ?? 3000),
        manualSwipe: row.settings?.manualSwipe !== false,
        stickyOnScroll: row.settings?.stickyOnScroll === true || row.settings?.sticky === true,
        enableAsFilter: row.settings?.enableAsFilter === true,
        backgroundColor: row.settings?.backgroundColor ?? '',
        bottomSpacing: row.settings?.bottomSpacing ?? 24,
      },
    })
    setItemFilter('')
    setOpen(true)
  }

  const toggleItem = (id) => {
    setForm((c) => {
      const set = new Set(c.itemIds || [])
      if (set.has(id)) set.delete(id)
      else set.add(id)
      return { ...c, itemIds: [...set] }
    })
  }

  const moveOrder = async (row, direction) => {
    const list = [...sorted]
    const idx = list.findIndex((x) => x.id === row.id)
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1
    if (idx < 0 || swapIdx < 0 || swapIdx >= list.length) return
    const next = [...list]
    const [moved] = next.splice(idx, 1)
    next.splice(swapIdx, 0, moved)
    try {
      await reorderHomeSections(next.map((x) => x.id))
    } catch (err) {
      toast.error(err?.message || 'Could not reorder.')
    }
  }

  const onDrop = async (targetId) => {
    if (!dragId || dragId === targetId) return
    const list = [...sorted]
    const from = list.findIndex((x) => x.id === dragId)
    const to = list.findIndex((x) => x.id === targetId)
    setDragId('')
    if (from < 0 || to < 0) return
    const [moved] = list.splice(from, 1)
    list.splice(to, 0, moved)
    try {
      await reorderHomeSections(list.map((x) => x.id))
    } catch (err) {
      toast.error(err?.message || 'Could not reorder.')
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    try {
      await upsertHomeSection({ ...form, serviceTypeId: typeId || form.serviceTypeId })
      reset()
    } catch (err) {
      toast.error(err?.message || 'Could not save section.')
    }
  }

  const modes = selectionModesFor(form.contentType)
  const isStatic = form.layout === 'static' || form.contentType === 'static'
  const isSearchOrBanner =
    form.contentType === 'search' ||
    form.contentType === 'banners' ||
    form.contentType === 'fullWidthBanner'

  return (
    <div className="space-y-4">
      <PageHeader
        title="Home Screen Management"
        description="Starts empty. Add sections for this service type — the user app renders only what you save. Switching type stays on Home and loads that type’s configuration."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {clipboard.length > 0 ? (
              <Button
                type="button"
                variant="secondary"
                onClick={handlePasteFromClipboard}
                disabled={!typeId}
              >
                <ClipboardPaste className="mr-1.5 size-4" />
                Paste Sections ({clipboard.length})
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              onClick={openImportModal}
              disabled={!typeId}
            >
              <FolderInput className="mr-1.5 size-4" />
              Copy from another screen
            </Button>
            <Button
              type="button"
              className="gap-2 bg-[#C45508] text-white hover:bg-[#a84706]"
              onClick={() => {
                setEditingMarketplaceSection(null)
                setMarketplaceEditorOpen(true)
              }}
            >
              <ShoppingBag className="size-4" /> Marketplace Editor
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={openCreate} disabled={!typeId}>
              <Plus className="size-4" /> Add section
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {hasUnassigned ? (
          <button
            type="button"
            onClick={() => setScopeId(GLOBAL_KEY)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              scopeId === GLOBAL_KEY
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'border border-[var(--outline-variant)] bg-[var(--surface-lowest)] text-slate-700 dark:text-slate-200 hover:bg-[var(--surface-low)] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Unassigned (legacy)
          </button>
        ) : null}
        {(serviceTypes || []).map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setScopeId(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              scopeId === t.id
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'border border-[var(--outline-variant)] bg-[var(--surface-lowest)] text-slate-700 dark:text-slate-200 hover:bg-[var(--surface-low)] hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {catalogTitle(t)}
          </button>
        ))}
      </div>

      {typeId ? (
        <Card className="space-y-4 p-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Fixed chrome (user app)</h3>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Sticky on scroll only when enabled. Defaults are off. Location and cart share one header row.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Location — sticky on scroll">
              <Select
                value={chromeSticky.stickyLocation ? 'true' : 'false'}
                onChange={(e) =>
                  setChromeSticky((c) => ({ ...c, stickyLocation: e.target.value === 'true' }))
                }
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </Select>
            </Field>
            <Field label="Cart — sticky on scroll">
              <Select
                value={chromeSticky.stickyCart ? 'true' : 'false'}
                onChange={(e) =>
                  setChromeSticky((c) => ({ ...c, stickyCart: e.target.value === 'true' }))
                }
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </Select>
            </Field>
            <Field label="Service type bar — sticky on scroll">
              <Select
                value={chromeSticky.stickyServiceType ? 'true' : 'false'}
                onChange={(e) =>
                  setChromeSticky((c) => ({ ...c, stickyServiceType: e.target.value === 'true' }))
                }
              >
                <option value="false">Off</option>
                <option value="true">On</option>
              </Select>
            </Field>
          </div>
          <Button
            type="button"
            variant="secondary"
            disabled={Boolean(mutating.homeConfiguration)}
            onClick={() => {
              void upsertHomeConfiguration(typeId, { chrome: chromeSticky, catalogChrome }).catch(
                (err) => toast.error(err?.message || 'Could not save chrome settings.'),
              )
            }}
          >
            Save chrome settings
          </Button>
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Category & search container (user app)
            </h3>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              Background for the service-type bar, category filter, and search block grouped below the
              location header.
            </p>
            <Field label="Container background" className="mt-3 max-w-xs">
              <Input
                type="color"
                value={catalogChrome.backgroundColor}
                onChange={(e) =>
                  setCatalogChrome((c) => ({ ...c, backgroundColor: e.target.value }))
                }
              />
            </Field>
            <Button
              type="button"
              variant="secondary"
              className="mt-3"
              disabled={Boolean(mutating.homeConfiguration)}
              onClick={() => {
                void upsertHomeConfiguration(typeId, { chrome: chromeSticky, catalogChrome }).catch(
                  (err) => toast.error(err?.message || 'Could not save container theme.'),
                )
              }}
            >
              Save container theme
            </Button>
          </div>
        </Card>
      ) : null}

      <Card className="p-0 overflow-hidden">
        {loading.homeSections ? (
          <div className="p-12 text-center text-sm font-medium text-slate-700 dark:text-slate-300">Loading…</div>
        ) : (
          <div>
            {/* Multi-selection Toolbar */}
            {sorted.length > 0 ? (
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--outline-variant)]/40 bg-[var(--surface-lowest)] px-4 py-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-medium text-[var(--on-surface)]">
                    <input
                      type="checkbox"
                      checked={sorted.length > 0 && selectedIds.size === sorted.length}
                      onChange={selectAll}
                      className="size-4 rounded text-[var(--primary)] accent-[var(--primary)] cursor-pointer"
                    />
                    <span>Select All ({sorted.length})</span>
                  </label>
                  {selectedIds.size > 0 ? (
                    <Badge tone="primary" className="text-xs">
                      {selectedIds.size} selected
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {selectedIds.size > 0 ? (
                    <>
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          const selected = sorted.filter((s) => selectedIds.has(s.id))
                          handleCopySelectedToClipboard(selected)
                        }}
                      >
                        <Copy className="mr-1.5 size-4" />
                        Copy Selected ({selectedIds.size})
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const selected = sorted.filter((s) => selectedIds.has(s.id))
                          openCopyToModal(selected)
                        }}
                      >
                        <ArrowRightLeft className="mr-1.5 size-4" />
                        Copy to Screen...
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleDuplicateSelected}
                        title="Duplicate selected sections on this screen"
                      >
                        Duplicate ({selectedIds.size})
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={handleDeleteSelected}
                        title="Delete selected sections"
                      >
                        <Trash2 className="mr-1.5 size-4" />
                        Delete ({selectedIds.size})
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSelectedIds(new Set())}
                      >
                        Clear
                      </Button>
                    </>
                  ) : clipboard.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={handlePasteFromClipboard}
                        disabled={!typeId}
                      >
                        <ClipboardPaste className="mr-1.5 size-4" />
                        Paste {clipboard.length} Copied Section{clipboard.length > 1 ? 's' : ''}
                      </Button>
                      <button
                        type="button"
                        className="text-xs text-[var(--on-surface-variant)] hover:underline"
                        onClick={clearClipboard}
                        title="Clear clipboard"
                      >
                        Clear clipboard
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            <div className="divide-y divide-[var(--outline-variant)]/40">
              {sorted.map((row, idx) => {
                const enabled = row.enabled !== false
                const isSelected = selectedIds.has(row.id)
                return (
                  <div
                    key={row.id}
                    draggable
                    onDragStart={() => setDragId(row.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => void onDrop(row.id)}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3 transition-colors ${
                      isSelected ? 'bg-[var(--primary)]/10 ring-1 ring-inset ring-[var(--primary)]/30' : ''
                    } ${enabled ? '' : 'opacity-60'}`}
                  >
                    <label
                      className="flex items-center justify-center p-1 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                      title={isSelected ? 'Deselect section' : 'Select section'}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(row.id)}
                        className="size-4 rounded text-[var(--primary)] accent-[var(--primary)] cursor-pointer"
                        aria-label={`Select section ${row.title}`}
                      />
                    </label>
                    <GripVertical className="size-4 shrink-0 cursor-grab text-slate-500 dark:text-slate-400" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        ☰ {row.title || 'Untitled'}
                      </p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                        <span>
                          {HOME_SECTION_CONTENT_LABELS[row.contentType] || row.contentType} ·{' '}
                          {HOME_SECTION_LAYOUT_LABELS[row.layout] || row.layout}
                          {row.categoryId ? ' · filtered category' : ''}
                        </span>
                        {(row.contentType === 'banners' || row.contentType === 'fullWidthBanner') && row.images?.length ? (
                          <span className="rounded-md bg-primary-50 dark:bg-primary-950/40 border border-primary-200 dark:border-primary-800 px-1.5 py-0.5 text-[10px] font-bold text-primary-700 dark:text-primary-300">
                            {row.images.length} slide{row.images.length === 1 ? '' : 's'}
                          </span>
                        ) : null}
                      </p>
                    </div>
                    <Badge tone={enabled ? 'success' : 'neutral'}>{enabled ? 'Visible' : 'Hidden'}</Badge>
                    <div className="flex flex-wrap gap-1">
                      {(row.contentType === 'banners' || row.contentType === 'fullWidthBanner') ? (
                        <button
                          type="button"
                          className="rounded-lg border border-primary-200 dark:border-primary-800 p-1.5 text-primary-600 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-950/40 transition-colors"
                          onClick={() => openEdit(row)}
                          title="Customize Banner Slideshow (Advanced Editor)"
                          aria-label="Customize Banner Slideshow"
                        >
                          <Sparkles className="size-3.5" />
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-lg border p-1.5 hover:bg-[var(--surface-high)]"
                        onClick={() => openEdit(row)}
                        title="Edit section"
                        aria-label="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border p-1.5 hover:bg-[var(--surface-high)]"
                        onClick={() => duplicateHomeSection(row).catch((err) => toast.error(err.message))}
                        title="Duplicate in this screen"
                        aria-label="Duplicate"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border p-1.5 hover:bg-[var(--surface-high)]"
                        onClick={() => openCopyToModal([row])}
                        title="Copy to another home screen..."
                        aria-label="Copy to another home screen"
                      >
                        <ArrowRightLeft className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border p-1.5 hover:bg-[var(--surface-high)]"
                        onClick={() =>
                          upsertHomeSection({ ...row, enabled: !enabled, visible: !enabled }).catch((err) =>
                            toast.error(err.message),
                          )
                        }
                        title={enabled ? 'Hide section' : 'Show section'}
                        aria-label={enabled ? 'Hide' : 'Show'}
                      >
                        {enabled ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border p-1.5 hover:bg-[var(--surface-high)] disabled:opacity-40"
                        disabled={idx === 0}
                        onClick={() => void moveOrder(row, 'up')}
                        title="Move up"
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border p-1.5 hover:bg-[var(--surface-high)] disabled:opacity-40"
                        disabled={idx === sorted.length - 1}
                        onClick={() => void moveOrder(row, 'down')}
                        title="Move down"
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border p-1.5 text-[var(--error)] hover:bg-[var(--error)]/10"
                        onClick={async () => {
                          if (!window.confirm(`Delete section "${row.title}"?`)) return
                          try {
                            await deleteHomeSection(row.id)
                          } catch (err) {
                            toast.error(err?.message || 'Delete failed.')
                          }
                        }}
                        title="Delete section"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
              {!sorted.length ? (
                <div className="flex flex-col items-center gap-3 px-4 py-12 text-center text-slate-700 dark:text-slate-300 font-medium">
                  <LayoutGrid className="size-8 text-primary-600" />
                  <p>
                    This Home is empty. Add a section. Until you save a configuration, the user app shows only Location
                    and Cart.
                  </p>
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                    <Button type="button" onClick={openCreate} disabled={!typeId}>
                      <Plus className="mr-1.5 size-4" /> Add first section
                    </Button>
                    <Button type="button" variant="secondary" onClick={openImportModal} disabled={!typeId}>
                      <FolderInput className="mr-1.5 size-4" /> Copy from another screen
                    </Button>
                    {clipboard.length > 0 ? (
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handlePasteFromClipboard}
                        disabled={!typeId}
                      >
                        <ClipboardPaste className="mr-1.5 size-4" />
                        Paste {clipboard.length} Copied Section{clipboard.length > 1 ? 's' : ''}
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </Card>

      <Modal open={open} title={form.id ? 'Edit section' : 'Add section'} onClose={reset} className="max-w-3xl">
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Section title">
              <Input
                value={form.title}
                onChange={(e) => setForm((c) => ({ ...c, title: e.target.value }))}
                required
              />
            </Field>
            <Field label="Section type">
              <Select
                value={isStatic ? 'static' : form.contentType}
                onChange={(e) => {
                  const nextType = e.target.value
                  const isBannerType = nextType === 'banners' || nextType === 'fullWidthBanner'
                  setForm((c) => ({
                    ...c,
                    contentType: nextType,
                    layout:
                      nextType === 'search'
                        ? 'list'
                        : nextType === 'fullWidthBanner'
                          ? 'autoSlider'
                          : nextType === 'banners'
                            ? 'autoSlider'
                            : c.layout,
                    itemIds: [],
                    images: isBannerType ? c.images || [] : c.images,
                    settings:
                      isBannerType
                        ? { ...c.settings, autoplay: c.settings?.autoplay !== false, manualSwipe: c.settings?.manualSwipe !== false }
                        : c.settings,
                  }))
                }}
              >
                {HOME_SECTION_CONTENT_TYPES.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Subtitle (optional)">
            <Input value={form.subtitle} onChange={(e) => setForm((c) => ({ ...c, subtitle: e.target.value }))} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Layout">
              <Select
                value={form.layout}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    layout: e.target.value,
                    contentType: e.target.value === 'static' ? 'static' : c.contentType,
                    settings: {
                      ...c.settings,
                      autoplay: e.target.value === 'autoSlider',
                    },
                  }))
                }
              >
                {HOME_SECTION_LAYOUTS.map((x) => (
                  <option key={x.value} value={x.value}>
                    {x.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Height (px)">
              <Input
                type="number"
                value={form.settings?.height ?? 220}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    settings: { ...c.settings, height: Number(e.target.value) || 220 },
                  }))
                }
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Content source: Service type">
              <Select
                value={form.sourceServiceTypeId || ''}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    sourceServiceTypeId: e.target.value,
                    categoryId: '',
                    serviceCategoryId: '',
                  }))
                }
              >
                <option value="">Current screen ({currentTypeName || 'Default'})</option>
                <option value="__all__">All Service Types (Cross-type)</option>
                {(serviceTypes || []).map((t) => (
                  <option key={t.id} value={t.id}>
                    {catalogTitle(t)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Filter: Category (optional)">
              <Select
                value={form.categoryId}
                onChange={(e) => setForm((c) => ({ ...c, categoryId: e.target.value, serviceCategoryId: '' }))}
              >
                <option value="">
                  {form.sourceServiceTypeId === '__all__'
                    ? 'All categories (all service types)'
                    : form.sourceServiceTypeId
                      ? 'All categories in selected service type'
                      : 'All categories in current screen'}
                </option>
                {(categories || [])
                  .filter((c) => {
                    const st = form.sourceServiceTypeId
                    if (st === '__all__') return true
                    if (st) return String(c.serviceTypeId) === st
                    if (form.selectionMode === 'manual') return true
                    return !typeId || String(c.serviceTypeId) === typeId
                  })
                  .map((c) => {
                    const typeTitle = (serviceTypes || []).find((t) => t.id === c.serviceTypeId)?.title || ''
                    const label = typeTitle ? `${typeTitle} · ${catalogTitle(c)}` : catalogTitle(c)
                    return (
                      <option key={c.id} value={c.id}>
                        {label}
                      </option>
                    )
                  })}
              </Select>
            </Field>
            <Field label="Filter: Service category (optional)">
              <Select
                value={form.serviceCategoryId}
                onChange={(e) => setForm((c) => ({ ...c, serviceCategoryId: e.target.value }))}
              >
                <option value="">Any issue</option>
                {(serviceCategories || [])
                  .filter((c) => !form.categoryId || String(c.categoryId) === form.categoryId)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {catalogTitle(c)}
                    </option>
                  ))}
              </Select>
            </Field>
          </div>

          {!isStatic && !isSearchOrBanner ? (
            <>
              {modes.length ? (
                <Field label="Content selection mode">
                  <Select
                    value={form.selectionMode}
                    onChange={(e) => setForm((c) => ({ ...c, selectionMode: e.target.value, itemIds: [] }))}
                  >
                    {modes.map((x) => (
                      <option key={x.value} value={x.value}>
                        {x.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              ) : null}
              {form.selectionMode === 'manual' ? (
                <Field label={`Selected items (${(form.itemIds || []).length} selected)`}>
                  <div className="flex items-center gap-2">
                    <Input
                      value={itemFilter}
                      onChange={(e) => setItemFilter(e.target.value)}
                      placeholder="Search / filter items by name…"
                      className="flex-1"
                    />
                    {(form.itemIds || []).length > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setForm((c) => ({ ...c, itemIds: [] }))}
                        className="shrink-0 text-xs text-red-500 hover:text-red-600"
                      >
                        Clear selection
                      </Button>
                    ) : null}
                  </div>
                  <div className="mt-2 max-h-56 space-y-1 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/50 p-2 dark:border-slate-700 dark:bg-slate-900/40">
                    {selectableItems.length === 0 ? (
                      <p className="p-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                        No matching items found. Try changing filters or search terms.
                      </p>
                    ) : (
                      selectableItems.map((item) => (
                        <label
                          key={item.id}
                          className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <div className="flex min-w-0 items-center gap-2">
                            <input
                              type="checkbox"
                              checked={(form.itemIds || []).includes(item.id)}
                              onChange={() => toggleItem(item.id)}
                            />
                            <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.name || item.title || item.id}</span>
                          </div>
                          {item.displaySubtitle ? (
                            <span className="shrink-0 rounded bg-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                              {item.displaySubtitle}
                            </span>
                          ) : null}
                        </label>
                      ))
                    )}
                  </div>
                </Field>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Columns">
                  <Input
                    type="number"
                    min={1}
                    max={4}
                    value={form.columns}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, columns: Math.min(4, Math.max(1, Number(e.target.value) || 1)) }))
                    }
                  />
                </Field>
                <Field label="Rows (0 = auto)">
                  <Input
                    type="number"
                    min={0}
                    value={form.rows}
                    onChange={(e) => setForm((c) => ({ ...c, rows: Math.max(0, Number(e.target.value) || 0) }))}
                  />
                </Field>
                <Field label="Max items">
                  <Input
                    type="number"
                    min={0}
                    value={form.maxItems}
                    onChange={(e) =>
                      setForm((c) => ({ ...c, maxItems: Math.max(0, Number(e.target.value) || 0) }))
                    }
                  />
                </Field>
              </div>
            </>
          ) : null}

          {form.contentType === 'banners' || form.contentType === 'fullWidthBanner' ? (
            <>
              <HomeSectionBannerSlidesEditor
                images={form.images}
                onChange={(images) => setForm((c) => ({ ...c, images }))}
                sectionId={form.id}
                uploading={uploading}
                setUploading={setUploading}
                serviceTypes={serviceTypes}
                categories={categories}
                serviceCategories={serviceCategories}
                services={services}
                defaultServiceTypeId={typeId}
              />
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Image width">
                  <Select
                    value={form.settings?.imageWidth || (form.contentType === 'fullWidthBanner' ? 'fit' : 'full')}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        settings: {
                          ...c.settings,
                          imageWidth: e.target.value,
                          imageFit: e.target.value,
                        },
                      }))
                    }
                  >
                    <option value="fit">Fit Width (100% width, auto height)</option>
                    <option value="contain">Contain (Fit inside box)</option>
                    <option value="cover">Cover (Fill fixed height)</option>
                  </Select>
                </Field>
                <Field label="Auto play">
                  <Select
                    value={form.settings?.autoplay !== false ? 'true' : 'false'}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        settings: { ...c.settings, autoplay: e.target.value === 'true' },
                      }))
                    }
                  >
                    <option value="true">On</option>
                    <option value="false">Off</option>
                  </Select>
                </Field>
                <Field label="Slide duration (seconds)">
                  <Select
                    value={String(Math.round((form.settings?.slideDuration ?? 3000) / 1000))}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        settings: {
                          ...c.settings,
                          slideDuration: Math.min(10, Math.max(1, Number(e.target.value) || 3)) * 1000,
                        },
                      }))
                    }
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={String(n)}>
                        {n}s
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Manual swipe">
                  <Select
                    value={form.settings?.manualSwipe !== false ? 'true' : 'false'}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        settings: { ...c.settings, manualSwipe: e.target.value === 'true' },
                      }))
                    }
                  >
                    <option value="true">On</option>
                    <option value="false">Off</option>
                  </Select>
                </Field>
              </div>
            </>
          ) : null}

          {isStatic ? (
            <>
              <Field label="Custom body">
                <Textarea
                  value={form.staticBody}
                  onChange={(e) => setForm((c) => ({ ...c, staticBody: e.target.value }))}
                  rows={4}
                />
              </Field>
              <Field label="Image">
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={async (e) => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    setUploading(true)
                    try {
                      const url = await uploadToCloudinary(file, { kind: 'home-section', sectionId: form.id })
                      setForm((c) => ({ ...c, staticImage: url }))
                    } catch (err) {
                      toast.error(err?.message || 'Upload failed.')
                    } finally {
                      setUploading(false)
                    }
                  }}
                />
              </Field>
            </>
          ) : null}

          <Field label="Enable sticky / fixed on scroll">
            <Select
              value={form.settings?.stickyOnScroll === true ? 'true' : 'false'}
              onChange={(e) =>
                setForm((c) => ({
                  ...c,
                  settings: { ...c.settings, stickyOnScroll: e.target.value === 'true' },
                }))
              }
            >
              <option value="false">Off (default)</option>
              <option value="true">On</option>
            </Select>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Background color">
              <Select
                value={
                  form.settings?.backgroundColor &&
                  String(form.settings.backgroundColor).trim() &&
                  !['none', 'transparent'].includes(
                    String(form.settings.backgroundColor).trim().toLowerCase(),
                  )
                    ? 'custom'
                    : 'none'
                }
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    settings: {
                      ...c.settings,
                      backgroundColor: e.target.value === 'none' ? '' : c.settings?.backgroundColor || '#FFFFFF',
                    },
                  }))
                }
              >
                <option value="none">None / transparent</option>
                <option value="custom">Custom color</option>
              </Select>
            </Field>
            {form.settings?.backgroundColor &&
            String(form.settings.backgroundColor).trim() &&
            !['none', 'transparent'].includes(
              String(form.settings.backgroundColor).trim().toLowerCase(),
            ) ? (
              <Field label="Custom background (HEX)">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={
                      /^#([0-9A-Fa-f]{6})$/.test(String(form.settings.backgroundColor))
                        ? form.settings.backgroundColor
                        : '#FFFFFF'
                    }
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        settings: { ...c.settings, backgroundColor: e.target.value },
                      }))
                    }
                    className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--outline-variant)]"
                  />
                  <Input
                    value={form.settings.backgroundColor || ''}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        settings: { ...c.settings, backgroundColor: e.target.value },
                      }))
                    }
                    placeholder="#FFFFFF"
                    className="font-mono text-sm"
                  />
                </div>
              </Field>
            ) : null}
            <Field label="Bottom spacing (px)">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.settings?.bottomSpacing ?? 24}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    settings: {
                      ...c.settings,
                      bottomSpacing: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                    },
                  }))
                }
              />
            </Field>
          </div>

          {form.contentType === 'categories' ? (
            <Field label="Enable as filter">
              <Select
                value={form.settings?.enableAsFilter === true ? 'true' : 'false'}
                onChange={(e) =>
                  setForm((c) => ({
                    ...c,
                    settings: { ...c.settings, enableAsFilter: e.target.value === 'true' },
                  }))
                }
              >
                <option value="false">Off (default)</option>
                <option value="true">On</option>
              </Select>
            </Field>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Visible">
              <Select
                value={form.enabled ? 'true' : 'false'}
                onChange={(e) => setForm((c) => ({ ...c, enabled: e.target.value === 'true' }))}
              >
                <option value="true">Show</option>
                <option value="false">Hide</option>
              </Select>
            </Field>
            <Field label="User app">
              <Select
                value={form.showOnApp ? 'true' : 'false'}
                onChange={(e) => setForm((c) => ({ ...c, showOnApp: e.target.value === 'true' }))}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Select>
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={reset}>
              Cancel
            </Button>
            <Button type="submit" disabled={Boolean(mutating.homeSection)}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      {/* Copy To Another Screen Modal */}
      <Modal
        open={copyToModalOpen}
        title={`Copy ${copyTargetSections.length} Section${copyTargetSections.length > 1 ? 's' : ''} to another Home Screen`}
        onClose={() => setCopyToModalOpen(false)}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Selected section${copyTargetSections.length > 1 ? 's' : ''} will be cloned into the chosen home screen layout.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-[var(--surface-high)]/50 border border-[var(--outline-variant)]/40">
              {copyTargetSections.map((s) => (
                <Badge key={s.id} tone="neutral" className="text-xs">
                  {s.title || 'Untitled'} ({HOME_SECTION_CONTENT_LABELS[s.contentType] || s.contentType})
                </Badge>
              ))}
            </div>
          </div>

          <Field label="Destination Home Screen (Service Type)">
            <Select
              value={destTypeId}
              onChange={(e) => setDestTypeId(e.target.value)}
            >
              <option value="" disabled>-- Select target home screen --</option>
              {(serviceTypes || []).map((t) => {
                const isCurrent = t.id === typeId
                const count = (homeSections || []).filter((s) => String(s.serviceTypeId || '') === t.id).length
                return (
                  <option key={t.id} value={t.id}>
                    {catalogTitle(t)} ({count} sections){isCurrent ? ' - (Current)' : ''}
                  </option>
                )
              })}
            </Select>
          </Field>

          <label className="flex items-center gap-2 text-sm text-[var(--on-surface)] cursor-pointer select-none">
            <input
              type="checkbox"
              checked={appendCopySuffix}
              onChange={(e) => setAppendCopySuffix(e.target.checked)}
              className="size-4 rounded text-[var(--primary)] accent-[var(--primary)] cursor-pointer"
            />
            <span>Append &quot;(copy)&quot; to section titles</span>
          </label>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline-variant)]/40">
            <Button type="button" variant="secondary" onClick={() => setCopyToModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!destTypeId || Boolean(mutating.homeSectionCopy)}
              onClick={handleConfirmCopyTo}
            >
              Copy {copyTargetSections.length} Section{copyTargetSections.length > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Copy From Another Screen Modal */}
      <Modal
        open={importModalOpen}
        title="Copy Sections from another Home Screen"
        onClose={() => setImportModalOpen(false)}
      >
        <div className="space-y-4">
          <Field label="Source Home Screen (Service Type)">
            <Select
              value={importSourceTypeId}
              onChange={(e) => {
                const nextSource = e.target.value
                setImportSourceTypeId(nextSource)
                const sourceSections = (homeSections || []).filter(
                  (s) => String(s.serviceTypeId || '') === nextSource,
                )
                setImportSelectedIds(new Set(sourceSections.map((s) => s.id)))
              }}
            >
              <option value="" disabled>-- Select source home screen --</option>
              {(serviceTypes || []).map((t) => {
                const count = (homeSections || []).filter((s) => String(s.serviceTypeId || '') === t.id).length
                const isCurrent = t.id === typeId
                return (
                  <option key={t.id} value={t.id} disabled={isCurrent}>
                    {catalogTitle(t)} ({count} sections){isCurrent ? ' - (Current)' : ''}
                  </option>
                )
              })}
            </Select>
          </Field>

          <div>
            <div className="flex items-center justify-between pb-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={
                    sourceSectionsForImport.length > 0 &&
                    importSelectedIds.size === sourceSectionsForImport.length
                  }
                  onChange={() => {
                    if (importSelectedIds.size === sourceSectionsForImport.length) {
                      setImportSelectedIds(new Set())
                    } else {
                      setImportSelectedIds(new Set(sourceSectionsForImport.map((s) => s.id)))
                    }
                  }}
                  className="size-4 rounded text-primary-600 accent-primary-600 cursor-pointer"
                />
                <span>Select Sections ({importSelectedIds.size}/{sourceSectionsForImport.length})</span>
              </label>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-1.5 rounded-xl border border-slate-200 p-2 bg-white dark:border-slate-700 dark:bg-slate-900">
              {sourceSectionsForImport.map((s) => {
                const selected = importSelectedIds.has(s.id)
                return (
                  <label
                    key={s.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors border ${
                      selected
                        ? 'bg-primary-50 border-primary-300 text-slate-900 dark:bg-primary-950/30 dark:border-primary-700 dark:text-white'
                        : 'bg-slate-50 border-transparent hover:bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        setImportSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(s.id)) next.delete(s.id)
                          else next.add(s.id)
                          return next
                        })
                      }}
                      className="size-4 rounded text-primary-600 accent-primary-600 cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{s.title || 'Untitled'}</p>
                      <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                        {HOME_SECTION_CONTENT_LABELS[s.contentType] || s.contentType} ·{' '}
                        {HOME_SECTION_LAYOUT_LABELS[s.layout] || s.layout}
                      </p>
                    </div>
                  </label>
                )
              })}
              {!sourceSectionsForImport.length ? (
                <p className="py-6 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                  No sections in this source home screen.
                </p>
              ) : null}
            </div>
          </div>

          <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
            These sections will be appended to your active screen: <strong className="font-bold text-slate-900 dark:text-white">{currentTypeName}</strong>.
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[var(--outline-variant)]/40">
            <Button type="button" variant="secondary" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={importSelectedIds.size === 0 || Boolean(mutating.homeSectionCopy)}
              onClick={handleConfirmImport}
            >
              Copy {importSelectedIds.size} Section{importSelectedIds.size > 1 ? 's' : ''}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Marketplace Editor Full Modal */}
      {marketplaceEditorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-7xl h-[92vh] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200 flex flex-col">
            <MarketplaceSectionEditor
              section={editingMarketplaceSection}
              services={services}
              categories={categories}
              serviceTypes={serviceTypes}
              serviceCategories={serviceCategories}
              onClose={() => {
                setMarketplaceEditorOpen(false)
                setEditingMarketplaceSection(null)
              }}
              onSave={async (payload) => {
                await upsertHomeSection({ ...payload, serviceTypeId: typeId || payload.serviceTypeId })
                setMarketplaceEditorOpen(false)
                setEditingMarketplaceSection(null)
              }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
