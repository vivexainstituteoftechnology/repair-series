import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightLeft, ChevronRight, Download, FileSpreadsheet, Plus, Sparkles, Upload } from 'lucide-react'
import Papa from 'papaparse'
import { toast } from 'sonner'
import { Button, Card, Field, Input, Modal, PageHeader, SearchInput, Select, Textarea, Badge } from '../components/ui'
import { CatalogImageField } from '../components/CatalogImageField'
import { CatalogMoveModal } from '../components/CatalogMoveModal'
import { ConvertVariationModal } from '../components/ConvertVariationModal'
import { KeyPointsInput } from '../components/KeyPointsInput'
import {
  DEFAULT_REVISIT_POLICY,
  REVISIT_TYPES,
  REVISIT_VALIDITY_UNITS,
  normalizeRevisitPolicy,
} from '../constants/revisitPolicy'
import { useApp } from '../context/useApp'
import {
  exportServicesCsv,
  exportServicesJson,
  downloadSampleServiceCsv,
} from '../services/serviceCsvExport'
import { parseServiceCsvRow, normalizeCsvHeader } from '../services/serviceCsvImport'
import { currency } from '../utils/helpers'
import { catalogImage, catalogTitle, isCatalogActive, mergeVariationsList, sortByDisplayOrder } from '../utils/catalogHierarchy'
import { emptyServiceTypeThemeForm, normalizeServiceTypeTheme } from '../utils/serviceTypeTheme'
import { ServiceTypeThemeEditor } from '../components/ServiceTypeThemeEditor'
import { WallPanelDesignStudio } from '../components/WallPanelDesignStudio'

const initialNode = {
  id: '',
  title: '',
  image: '',
  imageSource: 'upload',
  status: 'Active',
  displayOrder: 1,
  videoUrl: '',
  videoEnabled: true,
  theme: emptyServiceTypeThemeForm(),
}

const initialService = {
  id: '',
  name: '',
  description: '',
  keyPoints: [],
  hasVariations: false,
  price: '',
  visitingCharge: '0',
  duration: '60',
  revisitDays: '30',
  extraPoint: '',
  imageUrl: '',
  homeImage: '',
  listImage: '',
  detailImage: '',
  brandImage: '',
  imageSource: 'upload',
  brands: [],
  processSteps: [],
  status: 'Active',
  displayOrder: 1,
  revisitPolicy: {
    enabled: false,
    type: 'fixed_count',
    freeRevisitCount: '2',
    maxRevisitsInPeriod: '0',
    validityValue: '30',
    validityUnit: 'days',
  },
}

const initialVariation = {
  id: '',
  title: '',
  tagline: '',
  price: '',
  image: '',
  imageSource: 'upload',
  status: 'Active',
  displayOrder: 1,
}

const initialFaq = { id: '', question: '', answer: '' }

function isWallPanelType(type) {
  if (!type) return false
  const flow = String(type.bookingFlow || type.department || '').toLowerCase()
  if (flow === 'wallpanel' || flow === 'wall_panel') return true
  const name = catalogTitle(type).toLowerCase()
  return name.includes('wall panel') || String(type.slug || '').toLowerCase().includes('wall-panel')
}

function statusTone(status) {
  return isCatalogActive({ status }) ? 'success' : 'warning'
}

function HierarchyCard({ item, onOpen, onEdit, onMove, onConvert, onToggleStatus, onDelete, subtitle, priceLabel, selectable = false, selected = false, onSelect }) {
  const img = catalogImage(item)
  const active = isCatalogActive(item)
  return (
    <Card className={`overflow-hidden p-0 transition-all ${selected ? 'ring-2 ring-[var(--primary)] shadow-md' : ''}`}>
      <div className="relative">
        {img ? <img src={img} alt="" className="h-40 w-full object-cover" /> : <div className="h-24 bg-[var(--surface-high)]" />}
        {selectable ? (
          <div className="absolute top-2.5 left-2.5 z-10" onClick={(e) => e.stopPropagation()}>
            <label
              className={`flex items-center justify-center size-7 rounded-lg shadow-md border cursor-pointer transition-all ${
                selected
                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white'
                  : 'bg-[var(--surface-lowest)]/95 border-[var(--border)] text-[var(--on-surface)] hover:bg-[var(--surface-lowest)]'
              }`}
              title={selected ? 'Deselect service' : 'Select service to move'}
            >
              <input
                type="checkbox"
                checked={Boolean(selected)}
                onChange={() => onSelect && onSelect(item.id)}
                className="size-4 rounded text-[var(--primary)] accent-[var(--primary)] cursor-pointer"
                aria-label={`Select ${catalogTitle(item)}`}
              />
            </label>
          </div>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <button type="button" className="text-left" onClick={onOpen}>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{catalogTitle(item)}</h3>
            {subtitle ? <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">{subtitle}</p> : null}
            {priceLabel ? <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{priceLabel}</p> : null}
          </button>
          <Badge tone={statusTone(item.status)}>{item.status || 'Active'}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ghost" onClick={onOpen}>
            Open
          </Button>
          <Button variant="ghost" onClick={onEdit}>
            Edit
          </Button>
          {onMove ? (
            <Button variant="ghost" onClick={onMove}>
              Move / Reassign
            </Button>
          ) : null}
          {onConvert ? (
            <Button variant="ghost" onClick={onConvert} title="Convert this variation into an independent service">
              <Sparkles className="mr-1.5 size-3.5 text-[var(--primary)]" />
              Convert to service
            </Button>
          ) : null}
          {onToggleStatus ? (
            <Button variant="ghost" onClick={onToggleStatus}>
              {active ? 'Deactivate' : 'Activate'}
            </Button>
          ) : null}
          <Button variant="danger" onClick={onDelete}>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function ServicesPage() {
  const {
    services,
    categories,
    serviceTypes,
    serviceCategories,
    variations,
    faqs,
    upsertService,
    deleteService,
    upsertCategory,
    deleteCategory,
    upsertServiceType,
    deleteServiceType,
    upsertServiceCategory,
    deleteServiceCategory,
    upsertVariation,
    deleteVariation,
    convertVariationToService,
    moveCatalogNode,
    moveMultipleCatalogNodes,
    importServicesFromCsv,
    setCatalogNodeStatus,
    runCatalogHierarchyMigration,
    upsertFaq,
    deleteFaq,
    loading,
    mutating,
  } = useApp()

  const [tab, setTab] = useState('catalog')
  const [search, setSearch] = useState('')
  const [typeId, setTypeId] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [serviceCategoryId, setServiceCategoryId] = useState('')
  const [serviceId, setServiceId] = useState('')

  const [nodeForm, setNodeForm] = useState(initialNode)
  const [nodeKind, setNodeKind] = useState('')
  const [nodeOpen, setNodeOpen] = useState(false)
  const [serviceForm, setServiceForm] = useState(initialService)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [variationForm, setVariationForm] = useState(initialVariation)
  const [variationOpen, setVariationOpen] = useState(false)
  const [faqForm, setFaqForm] = useState(initialFaq)
  const [faqOpen, setFaqOpen] = useState(false)
  const [moveTarget, setMoveTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState(() => new Set())

  // Convert Variation to Service state
  const [convertModalOpen, setConvertModalOpen] = useState(false)
  const [variationToConvert, setVariationToConvert] = useState(null)
  const [converting, setConverting] = useState(false)

  const handleConfirmConvert = async (data) => {
    setConverting(true)
    try {
      await convertVariationToService(data)
      setConvertModalOpen(false)
      setVariationToConvert(null)
    } catch (err) {
      toast.error(err?.message || 'Could not convert variation.')
    } finally {
      setConverting(false)
    }
  }

  // Export Modal state
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [exportScope, setExportScope] = useState('all') // 'all' | 'current' | 'selected'
  const [exportFormat, setExportFormat] = useState('csv') // 'csv' | 'json'

  // Import Modal state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [importRows, setImportRows] = useState([])
  const [importFileName, setImportFileName] = useState('')
  const [importParseError, setImportParseError] = useState('')
  const [importProgress, setImportProgress] = useState(null)

  const catalog = useMemo(
    () => ({ serviceTypes, categories, serviceCategories, services, variations }),
    [serviceTypes, categories, serviceCategories, services, variations],
  )

  const sortedTypes = useMemo(() => sortByDisplayOrder(serviceTypes || []), [serviceTypes])
  const selectedType = sortedTypes.find((t) => t.id === typeId) || null
  const typeCategories = useMemo(
    () => sortByDisplayOrder((categories || []).filter((c) => !typeId || String(c.serviceTypeId || '') === typeId || !c.serviceTypeId)),
    [categories, typeId],
  )
  const selectedCategory = typeCategories.find((c) => c.id === categoryId) || null
  const issueTypes = useMemo(
    () =>
      sortByDisplayOrder(
        (serviceCategories || []).filter((sc) => String(sc.categoryId || '') === String(categoryId)),
      ),
    [serviceCategories, categoryId],
  )
  const selectedIssue = issueTypes.find((sc) => sc.id === serviceCategoryId) || null
  const issueServices = useMemo(
    () =>
      sortByDisplayOrder(
        (services || []).filter((s) => {
          if (String(s.status || '') === 'Coming Soon') return false
          if (serviceCategoryId) return String(s.serviceCategoryId || '') === serviceCategoryId
          if (categoryId) return String(s.categoryId || '') === categoryId && !s.serviceCategoryId
          return false
        }),
      ),
    [services, serviceCategoryId, categoryId],
  )
  const selectedService = issueServices.find((s) => s.id === serviceId) || (services || []).find((s) => s.id === serviceId) || null
  const serviceVars = useMemo(() => {
    if (!serviceId && !selectedService) return []
    const sId = String(serviceId || selectedService?.id || '').trim().toLowerCase()
    const sSlug = String(selectedService?.slug || '').trim().toLowerCase()
    const sTitle = String(selectedService?.title || selectedService?.name || '').trim().toLowerCase()

    const fromCol = (variations || []).filter((v) => {
      const vSvc = String(v?.serviceId ?? v?.service_id ?? '').trim().toLowerCase()
      return vSvc && (vSvc === sId || (sSlug && vSvc === sSlug) || (sTitle && vSvc === sTitle))
    })
    const embedded = Array.isArray(selectedService?.variations) ? selectedService.variations : []
    return mergeVariationsList(embedded, fromCol)
  }, [variations, serviceId, selectedService])

  const typeMap = useMemo(
    () => Object.fromEntries((serviceTypes || []).map((t) => [t.id, catalogTitle(t)])),
    [serviceTypes],
  )
  const categoryMap = useMemo(
    () => Object.fromEntries((categories || []).map((c) => [c.id, catalogTitle(c)])),
    [categories],
  )
  const issueMap = useMemo(
    () => Object.fromEntries((serviceCategories || []).map((sc) => [sc.id, catalogTitle(sc)])),
    [serviceCategories],
  )
  const metaMaps = useMemo(() => ({ typeMap, categoryMap, issueMap }), [typeMap, categoryMap, issueMap])

  // Services in current level/view
  const currentViewServices = useMemo(() => {
    return (services || []).filter((s) => {
      if (serviceCategoryId) return String(s.serviceCategoryId || '') === serviceCategoryId
      if (categoryId) return String(s.categoryId || '') === categoryId
      if (typeId) return String(s.serviceTypeId || '') === typeId
      return true
    })
  }, [services, serviceCategoryId, categoryId, typeId])

  // Selected services
  const selectedServices = useMemo(() => {
    return (services || []).filter((s) => selectedIds.has(s.id))
  }, [services, selectedIds])

  const handleExport = () => {
    let toExport = services || []
    let suffix = 'all'
    if (exportScope === 'current') {
      toExport = currentViewServices
      suffix = selectedIssue
        ? catalogTitle(selectedIssue).toLowerCase().replace(/\s+/g, '-')
        : selectedCategory
          ? catalogTitle(selectedCategory).toLowerCase().replace(/\s+/g, '-')
          : selectedType
            ? catalogTitle(selectedType).toLowerCase().replace(/\s+/g, '-')
            : 'current-view'
    } else if (exportScope === 'selected') {
      toExport = selectedServices
      suffix = 'selected'
    }

    if (!toExport.length) {
      toast.error('No services found to export in the chosen scope.')
      return
    }

    const dateStr = new Date().toISOString().split('T')[0]
    const filename = `services-${suffix}-${dateStr}`

    if (exportFormat === 'json') {
      exportServicesJson(filename, toExport)
    } else {
      exportServicesCsv(`${filename}.csv`, toExport, metaMaps)
    }

    toast.success(`Exported ${toExport.length} services as ${exportFormat.toUpperCase()}.`)
    setExportModalOpen(false)
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!/\.csv$/i.test(file.name) && file.type && !String(file.type).includes('csv')) {
      toast.error('Please upload a .csv file.')
      return
    }
    setImportParseError('')
    setImportFileName(file.name)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      transformHeader: normalizeCsvHeader,
      complete: (results) => {
        if (results.errors?.length) {
          const msg = results.errors.map((err) => err.message).join('; ')
          setImportParseError(msg)
          setImportRows([])
          toast.error('Could not parse CSV.', { description: msg })
          return
        }
        const data = results.data.filter((r) => r && Object.values(r).some((v) => String(v ?? '').trim() !== ''))
        if (!data.length) {
          setImportRows([])
          setImportParseError('No data rows found in CSV.')
          toast.error('CSV has no data rows.')
          return
        }
        setImportRows(data)
        toast.success(`Loaded ${data.length} rows from CSV. Review preview below.`)
      },
      error: (err) => {
        setImportRows([])
        setImportParseError(err.message)
        toast.error('Failed to read file.')
      },
    })
  }

  const importPreview = useMemo(() => {
    if (!importRows.length) return []
    const existingIdSet = new Set((services || []).map((s) => s.id))
    return importRows.map((row, idx) => {
      const parsed = parseServiceCsvRow(row, categories, { serviceTypes, serviceCategories })
      if (!parsed.ok) {
        return {
          rowNum: idx + 2,
          status: 'skipped',
          id: row?.id || '',
          name: row?.name || row?.title || 'Unknown',
          reason: parsed.error,
          variationCount: 0,
        }
      }
      return {
        rowNum: idx + 2,
        status: existingIdSet.has(parsed.id) ? 'update' : 'create',
        id: parsed.id,
        name: parsed.payload.name,
        variationCount: parsed.variationCount,
      }
    })
  }, [importRows, services, categories, serviceTypes, serviceCategories])

  const importCounts = useMemo(() => {
    let create = 0
    let update = 0
    let skipped = 0
    for (const p of importPreview) {
      if (p.status === 'create') create++
      else if (p.status === 'update') update++
      else skipped++
    }
    return { create, update, skipped }
  }, [importPreview])

  const handleExecuteImport = async () => {
    if (!importRows.length) return
    const validCount = importCounts.create + importCounts.update
    if (validCount === 0) {
      toast.error('No valid rows to import.')
      return
    }
    setImportProgress({ current: 0, total: importRows.length })
    try {
      const res = await importServicesFromCsv(importRows, {
        onProgress: (p) => setImportProgress(p),
      })
      toast.success(`Import complete! ${res.imported ?? 0} created, ${res.updated ?? 0} updated.`)
      setImportModalOpen(false)
      setImportRows([])
      setImportFileName('')
    } catch (err) {
      toast.error(err?.message || 'Import failed.')
    } finally {
      setImportProgress(null)
    }
  }

  const q = search.trim().toLowerCase()
  const filterTitle = (rows) =>
    !q ? rows : rows.filter((row) => catalogTitle(row).toLowerCase().includes(q) || String(row.status || '').toLowerCase().includes(q))

  const openNode = (kind, existing = null, extras = {}) => {
    setNodeKind(kind)
    setNodeForm(
      existing
        ? {
            ...initialNode,
            id: existing.id,
            title: catalogTitle(existing),
            image: catalogImage(existing),
            imageSource: existing.imageSource || 'upload',
            status: existing.status || 'Active',
            displayOrder: existing.displayOrder ?? existing.order ?? 1,
            videoUrl: existing.videoUrl || '',
            videoEnabled: existing.videoEnabled !== false,
            theme: normalizeServiceTypeTheme(existing.theme),
            ...extras,
          }
        : { ...initialNode, displayOrder: 1, theme: emptyServiceTypeThemeForm(), ...extras },
    )
    setNodeOpen(true)
  }

  const saveNode = async (event) => {
    event.preventDefault()
    try {
      if (nodeKind === 'serviceType') {
        await upsertServiceType(nodeForm)
      } else if (nodeKind === 'category') {
        await upsertCategory({ ...nodeForm, name: nodeForm.title, serviceTypeId: typeId, icon: nodeForm.image })
      } else if (nodeKind === 'serviceCategory') {
        await upsertServiceCategory({
          ...nodeForm,
          serviceTypeId: selectedCategory?.serviceTypeId || typeId,
          categoryId,
        })
      }
      setNodeOpen(false)
      setNodeForm(initialNode)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const openServiceForm = (existing = null) => {
    if (existing) {
      const p = normalizeRevisitPolicy(existing.revisitPolicy || DEFAULT_REVISIT_POLICY)
      setServiceForm({
        ...initialService,
        ...existing,
        name: existing.name || existing.title || '',
        price: existing.hasVariations ? '' : String(existing.price ?? ''),
        visitingCharge: String(existing.visitingCharge ?? 0),
        duration: String(existing.duration ?? 60),
        revisitDays: String(existing.revisitDays ?? p.validityValue ?? 30),
        displayOrder: existing.displayOrder ?? 1,
        homeImage: existing.homeImage || existing.imageUrl || existing.image || '',
        listImage: existing.listImage || '',
        detailImage: existing.detailImage || '',
        brandImage: existing.brandImage || '',
        imageSource: existing.imageSource || 'upload',
        brands: existing.brands?.length ? existing.brands : [],
        processSteps: existing.processSteps?.length ? existing.processSteps : [],
        keyPoints: existing.keyPoints || [],
        revisitPolicy: {
          enabled: p.enabled,
          type: p.type,
          freeRevisitCount: String(p.freeRevisitCount),
          maxRevisitsInPeriod: String(p.maxRevisitsInPeriod),
          validityValue: String(p.validityValue),
          validityUnit: p.validityUnit,
        },
      })
    } else {
      setServiceForm({ ...initialService })
    }
    setServiceOpen(true)
  }

  const saveService = async (event) => {
    event.preventDefault()
    const homeImage = String(serviceForm.homeImage || serviceForm.imageUrl || serviceForm.image || '').trim()
    if (!homeImage) {
      toast.error('Add a service image.')
      return
    }
    if (!serviceForm.hasVariations) {
      if (Number.isNaN(Number(serviceForm.price)) || Number(serviceForm.price) < 0) {
        toast.error('Enter a valid base price, or switch to variations.')
        return
      }
    }
    try {
      await upsertService({
        ...serviceForm,
        title: serviceForm.name,
        homeImage,
        listImage: serviceForm.listImage || homeImage,
        detailImage: serviceForm.detailImage || homeImage,
        imageUrl: homeImage,
        image: homeImage,
        serviceTypeId: selectedCategory?.serviceTypeId || typeId,
        categoryId,
        serviceCategoryId,
        price: serviceForm.hasVariations ? null : Number(serviceForm.price),
        visitingCharge: Number(serviceForm.visitingCharge || 0),
        duration: Number(serviceForm.duration || 0),
        revisitDays: Number(serviceForm.revisitDays || 0),
        displayOrder: Number(serviceForm.displayOrder || 0),
        variations: serviceVars,
        revisitPolicy: normalizeRevisitPolicy(serviceForm.revisitPolicy || DEFAULT_REVISIT_POLICY),
      })
      setServiceOpen(false)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const saveVariation = async (event) => {
    event.preventDefault()
    try {
      await upsertVariation({ ...variationForm, serviceId })
      setVariationOpen(false)
      setVariationForm(initialVariation)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmDelete = async (label, fn) => {
    if (!window.confirm(`Delete this ${label}? Child records must be removed first.`)) return
    try {
      await fn()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const applyMoveNavigation = (nav) => {
    if (!nav) return
    setTypeId(nav.typeId || '')
    setCategoryId(nav.categoryId || '')
    setServiceCategoryId(nav.serviceCategoryId || '')
    setServiceId(nav.serviceId || '')
  }

  const toggleStatus = async (kind, item) => {
    try {
      await setCatalogNodeStatus(kind, item.id, isCatalogActive(item) ? 'Inactive' : 'Active')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const confirmMove = async (parentId) => {
    if (!moveTarget) return
    const targetItems = moveTarget.items || (moveTarget.item ? [moveTarget.item] : [])
    if (!targetItems.length) return

    const isMultiple = targetItems.length > 1
    const confirmMessage = isMultiple
      ? `Move ${targetItems.length} selected items to the selected destination?`
      : 'Move this item to the selected parent?'

    if (!window.confirm(confirmMessage)) return
    try {
      let nav
      if (isMultiple) {
        nav = await moveMultipleCatalogNodes({
          kind: moveTarget.kind,
          ids: targetItems.map((it) => it.id),
          parentId,
        })
        setSelectedIds(new Set())
      } else {
        nav = await moveCatalogNode({
          kind: moveTarget.kind,
          id: targetItems[0].id,
          parentId,
        })
      }
      setMoveTarget(null)
      applyMoveNavigation(nav)
    } catch (err) {
      toast.error(err.message)
    }
  }

  const crumbs = [
    { label: 'Service Types', onClick: () => { setTypeId(''); setCategoryId(''); setServiceCategoryId(''); setServiceId('') } },
  ]
  if (selectedType) crumbs.push({ label: catalogTitle(selectedType), onClick: () => { setCategoryId(''); setServiceCategoryId(''); setServiceId('') } })
  if (selectedCategory) crumbs.push({ label: catalogTitle(selectedCategory), onClick: () => { setServiceCategoryId(''); setServiceId('') } })
  if (selectedIssue) crumbs.push({ label: catalogTitle(selectedIssue), onClick: () => setServiceId('') })
  if (selectedService) crumbs.push({ label: catalogTitle(selectedService), onClick: () => {} })

  const level = selectedService
    ? 'service'
    : selectedIssue
      ? 'services'
      : selectedCategory
        ? 'serviceCategories'
        : selectedType
          ? 'categories'
          : 'serviceTypes'

  useEffect(() => {
    setSelectedIds(new Set())
  }, [level, typeId, categoryId, serviceCategoryId, serviceId])

  const wallPanelOpen = Boolean(selectedType && isWallPanelType(selectedType) && level === 'categories')

  const addLabel = wallPanelOpen
    ? 'Add Wall Panel Design'
    : {
        serviceTypes: 'Add Service Type',
        categories: 'Add Category',
        serviceCategories: 'Add Service Category',
        services: 'Add Service',
        service: 'Add Variation',
      }[level]

  const onAdd = () => {
    if (level === 'serviceTypes') openNode('serviceType')
    else if (level === 'categories') openNode('category')
    else if (level === 'serviceCategories') openNode('serviceCategory')
    else if (level === 'services') openServiceForm(null)
    else {
      setVariationForm({ ...initialVariation, displayOrder: serviceVars.length + 1 })
      setVariationOpen(true)
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Services"
        description="Manage Service Type → Category → Service Category → Service → Variation."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <SearchInput value={search} onChange={setSearch} placeholder="Search this level..." />
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setExportScope(selectedIds.size > 0 ? 'selected' : 'all')
                setExportModalOpen(true)
              }}
            >
              <Download className="mr-1.5 size-4" />
              Export
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setImportModalOpen(true)
                setImportRows([])
                setImportFileName('')
                setImportParseError('')
              }}
            >
              <Upload className="mr-1.5 size-4" />
              Import
            </Button>
            <Button
              variant="ghost"
              disabled={mutating.catalogMigration}
              onClick={async () => {
                if (!window.confirm('Run a safe catalog migration? Existing documents are updated, not deleted.')) return
                try {
                  await runCatalogHierarchyMigration()
                } catch (err) {
                  toast.error(err.message)
                }
              }}
            >
              Migrate existing catalog
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-low)]/40 p-2">
        <Button type="button" variant={tab === 'catalog' ? 'primary' : 'ghost'} onClick={() => setTab('catalog')}>
          Hierarchy
        </Button>
        <Button type="button" variant={tab === 'faqs' ? 'primary' : 'ghost'} onClick={() => setTab('faqs')}>
          Global FAQs
        </Button>
      </div>

      {tab === 'catalog' ? (
        <>
          <div className="flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-800 dark:text-slate-200">
            {crumbs.map((c, i) => (
              <span key={`${c.label}-${i}`} className="inline-flex items-center gap-1">
                {i > 0 ? <ChevronRight className="size-4 text-slate-400 dark:text-slate-500" /> : null}
                <button type="button" className="text-slate-700 hover:text-primary-600 dark:text-slate-200 dark:hover:text-primary-400 transition-colors" onClick={c.onClick}>
                  {c.label}
                </button>
              </span>
            ))}
          </div>

          {wallPanelOpen ? null : (
            <div className="flex justify-end">
              <Button onClick={onAdd}>
                <Plus className="mr-1 size-4" />
                {addLabel}
              </Button>
            </div>
          )}

          {level === 'serviceTypes' ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {loading.serviceTypes ? <Card>Loading service types…</Card> : null}
              {!loading.serviceTypes && !filterTitle(sortedTypes).length ? (
                <Card>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    No service types yet. Add Home Appliance, Electrician, and others, or run migration to wrap existing categories.
                  </p>
                </Card>
              ) : null}
              {filterTitle(sortedTypes).map((item) => (
                <HierarchyCard
                  key={item.id}
                  item={item}
                  subtitle={`${(categories || []).filter((c) => String(c.serviceTypeId) === item.id).length} categories`}
                  onOpen={() => { setTypeId(item.id); setCategoryId(''); setServiceCategoryId(''); setServiceId('') }}
                  onEdit={() => openNode('serviceType', item)}
                  onMove={() => setMoveTarget({ kind: 'serviceType', item })}
                  onToggleStatus={() => toggleStatus('serviceType', item)}
                  onDelete={() => confirmDelete('service type', () => deleteServiceType(item.id))}
                />
              ))}
            </div>
          ) : null}

          {wallPanelOpen ? <WallPanelDesignStudio /> : null}

          {level === 'categories' && !wallPanelOpen ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filterTitle(typeCategories).map((item) => (
                <HierarchyCard
                  key={item.id}
                  item={item}
                  subtitle={`${(serviceCategories || []).filter((sc) => String(sc.categoryId) === item.id).length} service categories`}
                  onOpen={() => { setCategoryId(item.id); setServiceCategoryId(''); setServiceId('') }}
                  onEdit={() => openNode('category', item)}
                  onMove={() => setMoveTarget({ kind: 'category', item })}
                  onToggleStatus={() => toggleStatus('category', item)}
                  onDelete={() => confirmDelete('category', () => deleteCategory(item.id))}
                />
              ))}
              {!filterTitle(typeCategories).length ? <Card>No categories in this service type.</Card> : null}
            </div>
          ) : null}

          {level === 'serviceCategories' ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {filterTitle(issueTypes).map((item) => (
                <HierarchyCard
                  key={item.id}
                  item={item}
                  subtitle={`${(services || []).filter((s) => String(s.serviceCategoryId) === item.id).length} services`}
                  onOpen={() => { setServiceCategoryId(item.id); setServiceId('') }}
                  onEdit={() => openNode('serviceCategory', item)}
                  onMove={() => setMoveTarget({ kind: 'serviceCategory', item })}
                  onToggleStatus={() => toggleStatus('serviceCategory', item)}
                  onDelete={() => confirmDelete('service category', () => deleteServiceCategory(item.id))}
                />
              ))}
              {!filterTitle(issueTypes).length ? (
                <Card>No service categories (Cleaning, Repair, Service…). Add one to continue.</Card>
              ) : null}
            </div>
          ) : null}

          {level === 'services' ? (
            <div className="space-y-4">
              {filterTitle(issueServices).length > 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-lowest)] dark:bg-slate-900 dark:border-slate-800 px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-slate-900 dark:text-white">
                      <input
                        type="checkbox"
                        checked={
                          filterTitle(issueServices).length > 0 &&
                          filterTitle(issueServices).every((item) => selectedIds.has(item.id))
                        }
                        onChange={() => {
                          const items = filterTitle(issueServices)
                          const allSelected = items.length > 0 && items.every((it) => selectedIds.has(it.id))
                          if (allSelected) {
                            setSelectedIds(new Set())
                          } else {
                            setSelectedIds(new Set(items.map((it) => it.id)))
                          }
                        }}
                        className="size-4.5 rounded text-[var(--primary)] accent-[var(--primary)] cursor-pointer"
                      />
                      <span>Select All ({filterTitle(issueServices).length})</span>
                    </label>

                    {selectedIds.size > 0 ? (
                      <Badge tone="primary" className="text-xs">
                        {selectedIds.size} selected
                      </Badge>
                    ) : null}
                  </div>

                  {selectedIds.size > 0 ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={() => {
                          const selectedItems = (issueServices || []).filter((s) => selectedIds.has(s.id))
                          if (selectedItems.length) {
                            setMoveTarget({ kind: 'service', items: selectedItems })
                          }
                        }}
                      >
                        <ArrowRightLeft className="mr-1.5 size-4" />
                        Move / Reassign Selected ({selectedIds.size})
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          const toExport = (issueServices || []).filter((s) => selectedIds.has(s.id))
                          const dateStr = new Date().toISOString().split('T')[0]
                          exportServicesCsv(`services-selected-${dateStr}.csv`, toExport, metaMaps)
                          toast.success(`Exported ${toExport.length} selected services.`)
                        }}
                      >
                        <Download className="mr-1.5 size-4" />
                        Export Selected ({selectedIds.size})
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSelectedIds(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                  ) : (
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Select multiple services to move or reassign them together
                    </span>
                  )}
                </div>
              ) : null}

              <div className="grid gap-4 xl:grid-cols-2">
                {filterTitle(issueServices).map((item) => {
                  const itemColVars = (variations || []).filter((v) => String(v.serviceId) === String(item.id))
                  const allItemVars = mergeVariationsList(item.variations, itemColVars)
                  const hasVars = Boolean(item.hasVariations) || allItemVars.length > 0
                  const prices = (hasVars ? allItemVars : [])
                    .map((v) => Number(v.price))
                    .filter((n) => Number.isFinite(n))
                  const priceLabel = hasVars
                    ? prices.length
                      ? `Variations from ${currency(Math.min(...prices))}`
                      : 'With variations'
                    : `Price: ${currency(item.price)}`
                  return (
                    <HierarchyCard
                      key={item.id}
                      item={item}
                      subtitle={`${item.duration || 0} min · ${item.revisitDays || 0} days revisit`}
                      priceLabel={priceLabel}
                      selectable={true}
                      selected={selectedIds.has(item.id)}
                      onSelect={(id) => {
                        setSelectedIds((prev) => {
                          const next = new Set(prev)
                          if (next.has(id)) next.delete(id)
                          else next.add(id)
                          return next
                        })
                      }}
                      onOpen={() => setServiceId(item.id)}
                      onEdit={() => openServiceForm(item)}
                      onMove={() => setMoveTarget({ kind: 'service', item })}
                      onToggleStatus={() => toggleStatus('service', item)}
                      onDelete={() => confirmDelete('service', () => deleteService(item.id))}
                    />
                  )
                })}
                {!filterTitle(issueServices).length ? <Card>No services in this service category.</Card> : null}
              </div>
            </div>
          ) : null}

          {level === 'service' && selectedService ? (
            <div className="space-y-4">
              <Card>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{catalogTitle(selectedService)}</h3>
                    <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{selectedService.description}</p>
                    <div className="mt-3 grid gap-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                      <p>
                        <span className="font-semibold text-slate-900 dark:text-white">Price: </span>
                        {selectedService.hasVariations
                          ? 'From selected variation'
                          : currency(selectedService.price)}
                      </p>
                      <p><span className="font-semibold text-slate-900 dark:text-white">Duration: </span>{selectedService.duration || 0} min</p>
                      <p><span className="font-semibold text-slate-900 dark:text-white">Revisit: </span>{selectedService.revisitDays || 0} days</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="ghost" onClick={() => openServiceForm(selectedService)}>
                      Edit
                    </Button>
                    <Button variant="ghost" onClick={() => setMoveTarget({ kind: 'service', item: selectedService })}>
                      Move / Reassign
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => toggleStatus('service', selectedService)}
                    >
                      {isCatalogActive(selectedService) ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </div>
              </Card>
              <h4 className="text-lg font-semibold">Variations</h4>
              <div className="grid gap-4 xl:grid-cols-2">
                {serviceVars.map((item) => (
                  <HierarchyCard
                    key={item.id}
                    item={item}
                    subtitle={item.tagline || ''}
                    priceLabel={currency(item.price)}
                    onOpen={() => {
                      setVariationForm({
                        ...initialVariation,
                        ...item,
                        image: catalogImage(item),
                        price: String(item.price ?? ''),
                      })
                      setVariationOpen(true)
                    }}
                    onEdit={() => {
                      setVariationForm({
                        ...initialVariation,
                        ...item,
                        image: catalogImage(item),
                        price: String(item.price ?? ''),
                      })
                      setVariationOpen(true)
                    }}
                    onMove={() => setMoveTarget({ kind: 'variation', item })}
                    onConvert={() => {
                      setVariationToConvert(item)
                      setConvertModalOpen(true)
                    }}
                    onToggleStatus={() => toggleStatus('variation', item)}
                    onDelete={() => confirmDelete('variation', () => deleteVariation(item.id))}
                  />
                ))}
                {!serviceVars.length ? (
                  <Card>
                    {selectedService.hasVariations
                      ? 'This service requires variations before it can be booked.'
                      : 'No variations. This service uses its base price.'}
                  </Card>
                ) : null}
              </div>
            </div>
          ) : null}
        </>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setFaqForm(initialFaq)
                setFaqOpen(true)
              }}
            >
              Add FAQ
            </Button>
          </div>
          {(faqs || []).map((faq) => (
            <Card key={faq.id}>
              <h3 className="font-bold text-slate-900 dark:text-white">{faq.question}</h3>
              <p className="mt-2 text-sm font-medium text-slate-700 dark:text-slate-300">{faq.answer}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={() => { setFaqForm(faq); setFaqOpen(true) }}>
                  Edit
                </Button>
                <Button variant="danger" onClick={() => deleteFaq(faq.id)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CatalogMoveModal
        open={Boolean(moveTarget)}
        kind={moveTarget?.kind}
        item={moveTarget?.item}
        items={moveTarget?.items}
        catalog={catalog}
        busy={Boolean(mutating.catalogMove)}
        onClose={() => setMoveTarget(null)}
        onConfirm={(parentId) => void confirmMove(parentId)}
      />

      <ConvertVariationModal
        open={convertModalOpen}
        variation={variationToConvert}
        parentService={selectedService}
        catalog={catalog}
        busy={converting}
        onClose={() => {
          setConvertModalOpen(false)
          setVariationToConvert(null)
        }}
        onConfirm={handleConfirmConvert}
      />

      {/* Export Services Modal */}
      <Modal
        open={exportModalOpen}
        title="Export Services"
        onClose={() => setExportModalOpen(false)}
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Export services data for offline backup, spreadsheet editing, or bulk transfer.
          </p>

          <Field label="Export Scope">
            <div className="space-y-2 mt-1">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50">
                <input
                  type="radio"
                  name="exportScope"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={() => setExportScope('all')}
                  className="text-primary-600 accent-primary-600"
                />
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">All Services in Catalog</span>
                  <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">({services.length} services across all categories)</span>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50">
                <input
                  type="radio"
                  name="exportScope"
                  value="current"
                  checked={exportScope === 'current'}
                  onChange={() => setExportScope('current')}
                  className="text-primary-600 accent-primary-600"
                />
                <div className="text-sm">
                  <span className="font-semibold text-slate-900 dark:text-white">Current View / Filtered</span>
                  <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    ({currentViewServices.length} services
                    {selectedIssue ? ` in ${catalogTitle(selectedIssue)}` : selectedCategory ? ` in ${catalogTitle(selectedCategory)}` : selectedType ? ` in ${catalogTitle(selectedType)}` : ''})
                  </span>
                </div>
              </label>

              {selectedIds.size > 0 ? (
                <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50">
                  <input
                    type="radio"
                    name="exportScope"
                    value="selected"
                    checked={exportScope === 'selected'}
                    onChange={() => setExportScope('selected')}
                    className="text-primary-600 accent-primary-600"
                  />
                  <div className="text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white">Selected Services Only</span>
                    <span className="ml-2 text-xs font-medium text-slate-600 dark:text-slate-400">({selectedServices.length} selected with checkboxes)</span>
                  </div>
                </label>
              ) : null}
            </div>
          </Field>

          <Field label="Export Format">
            <div className="grid grid-cols-2 gap-3 mt-1">
              <label className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
                exportFormat === 'csv'
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="csv"
                    checked={exportFormat === 'csv'}
                    onChange={() => setExportFormat('csv')}
                    className="text-primary-600 accent-primary-600"
                  />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">CSV Spreadsheet</span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 pl-5">
                  Standard format for Excel, Google Sheets, and re-importing.
                </p>
              </label>

              <label className={`flex flex-col p-3 rounded-xl border cursor-pointer transition-colors ${
                exportFormat === 'json'
                  ? 'border-primary-500 bg-primary-50/50 dark:bg-primary-950/20'
                  : 'border-slate-200 hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800'
              }`}>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="exportFormat"
                    value="json"
                    checked={exportFormat === 'json'}
                    onChange={() => setExportFormat('json')}
                    className="text-primary-600 accent-primary-600"
                  />
                  <span className="font-semibold text-sm text-slate-900 dark:text-white">JSON Backup</span>
                </div>
                <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400 pl-5">
                  Complete hierarchical document structure and raw fields.
                </p>
              </label>
            </div>
          </Field>

          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Need to see the required column headers for bulk upload?
            </span>
            <Button
              type="button"
              variant="ghost"
              className="text-xs"
              onClick={() => downloadSampleServiceCsv({ serviceTypes, categories, serviceCategories })}
            >
              <Download className="mr-1 size-3.5" />
              Sample CSV Template
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
            <Button type="button" variant="secondary" onClick={() => setExportModalOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleExport}>
              <Download className="mr-1.5 size-4" />
              Download {exportFormat.toUpperCase()} ({exportScope === 'selected' ? selectedServices.length : exportScope === 'current' ? currentViewServices.length : services.length})
            </Button>
          </div>
        </div>
      </Modal>

      {/* Import Services Modal */}
      <Modal
        open={importModalOpen}
        title="Import Services"
        onClose={() => setImportModalOpen(false)}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Upload a .csv file to bulk create or update services in Firestore.
            </p>
            <Button
              type="button"
              variant="ghost"
              className="text-xs"
              onClick={() => downloadSampleServiceCsv({ serviceTypes, categories, serviceCategories })}
            >
              <Download className="mr-1 size-3.5" />
              Download Sample Template
            </Button>
          </div>

          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/50 p-6 text-center hover:bg-slate-50 transition-colors dark:border-slate-700 dark:bg-slate-900/40">
            <FileSpreadsheet className="mx-auto size-9 text-primary-600 opacity-90" />
            <label className="mt-3 block text-sm font-semibold text-slate-900 dark:text-white cursor-pointer">
              <span>Choose a CSV file</span>
              <input
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                disabled={Boolean(mutating.serviceCsvImport)}
                onChange={handleFileSelect}
              />
            </label>
            <p className="mt-1 text-xs font-medium text-slate-600 dark:text-slate-400">
              {importFileName ? `Selected: ${importFileName}` : 'Supports .csv exported from Excel or Google Sheets'}
            </p>
          </div>

          {importParseError ? (
            <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-700 dark:border-red-500/30 dark:bg-red-950/30 dark:text-red-300">
              {importParseError}
            </div>
          ) : null}

          {importRows.length > 0 ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge tone="success">{importCounts.create} New</Badge>
                <Badge tone="info">{importCounts.update} Updated</Badge>
                <Badge tone={importCounts.skipped ? 'warning' : 'neutral'}>{importCounts.skipped} Skipped</Badge>
              </div>

              <div className="max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                    <tr>
                      <th className="p-2 font-bold text-slate-800 dark:text-slate-200">Row</th>
                      <th className="p-2 font-bold text-slate-800 dark:text-slate-200">Status</th>
                      <th className="p-2 font-bold text-slate-800 dark:text-slate-200">ID</th>
                      <th className="p-2 font-bold text-slate-800 dark:text-slate-200">Name / Note</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {importPreview.slice(0, 50).map((p, idx) => (
                      <tr key={`prev-${p.rowNum}-${idx}`}>
                        <td className="p-2 tabular-nums font-semibold text-slate-800 dark:text-slate-200">{p.rowNum}</td>
                        <td className="p-2">
                          <Badge tone={p.status === 'create' ? 'success' : p.status === 'update' ? 'info' : 'warning'}>
                            {p.status}
                          </Badge>
                        </td>
                        <td className="p-2 font-mono text-[11px] font-medium text-slate-800 dark:text-slate-200">{p.id || '—'}</td>
                        <td className="p-2">
                          {p.status === 'skipped' ? (
                            <span className="font-medium text-red-600 dark:text-red-400">{p.reason}</span>
                          ) : (
                            <span className="font-medium text-slate-800 dark:text-slate-200">{p.name}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {importProgress && importProgress.total > 0 ? (
                <div className="space-y-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className="h-full bg-primary-600 transition-all duration-150"
                      style={{
                        width: `${Math.min(100, Math.round((importProgress.current / importProgress.total) * 100))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Importing {importProgress.current} / {importProgress.total}…
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
            <Link
              to="/import-services"
              className="text-xs text-[var(--primary)] hover:underline"
              onClick={() => setImportModalOpen(false)}
            >
              Open Fullscreen Import Page →
            </Link>
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={() => setImportModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={
                  !importRows.length ||
                  importCounts.create + importCounts.update === 0 ||
                  Boolean(mutating.serviceCsvImport)
                }
                onClick={handleExecuteImport}
              >
                <Upload className="mr-1.5 size-4" />
                {mutating.serviceCsvImport ? 'Importing…' : `Import ${importCounts.create + importCounts.update} Services`}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={nodeOpen}
        title={nodeKind === 'serviceType' ? 'Service Type' : nodeKind === 'category' ? 'Category' : 'Service Category'}
        onClose={() => setNodeOpen(false)}
      >
        <form className="grid gap-4" onSubmit={saveNode}>
          <Field label="Title">
            <Input value={nodeForm.title} onChange={(e) => setNodeForm({ ...nodeForm, title: e.target.value })} required />
          </Field>
          <CatalogImageField
            image={nodeForm.image}
            imageSource={nodeForm.imageSource}
            onChange={(next) => setNodeForm({ ...nodeForm, ...next })}
          />
          {nodeKind === 'category' ? (
            <Field label="Category video URL (optional)">
              <Input
                value={nodeForm.videoUrl}
                onChange={(e) => setNodeForm({ ...nodeForm, videoUrl: e.target.value })}
              />
            </Field>
          ) : null}
          <Field label="Status">
            <Select value={nodeForm.status} onChange={(e) => setNodeForm({ ...nodeForm, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Display order">
            <Input
              type="number"
              value={nodeForm.displayOrder}
              onChange={(e) => setNodeForm({ ...nodeForm, displayOrder: e.target.value })}
            />
          </Field>
          {nodeKind === 'serviceType' ? (
            <ServiceTypeThemeEditor
              title={nodeForm.title}
              theme={nodeForm.theme}
              onChange={(theme) => setNodeForm({ ...nodeForm, theme })}
            />
          ) : null}
          <Button type="submit">Save</Button>
        </form>
      </Modal>

      <Modal open={serviceOpen} title="Service" onClose={() => setServiceOpen(false)} className="max-w-3xl">
        <form className="grid gap-4" onSubmit={saveService}>
          <Field label="Title">
            <Input value={serviceForm.name} onChange={(e) => setServiceForm({ ...serviceForm, name: e.target.value })} required />
          </Field>
          <Field label="Description">
            <Textarea value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Duration (minutes)">
              <Input type="number" value={serviceForm.duration} onChange={(e) => setServiceForm({ ...serviceForm, duration: e.target.value })} />
            </Field>
            <Field label="Revisit days">
              <Input type="number" value={serviceForm.revisitDays} onChange={(e) => setServiceForm({ ...serviceForm, revisitDays: e.target.value })} />
            </Field>
          </div>
          <CatalogImageField
            image={serviceForm.homeImage || serviceForm.imageUrl}
            imageSource={serviceForm.imageSource}
            required
            onChange={(next) =>
              setServiceForm({
                ...serviceForm,
                homeImage: next.image,
                imageUrl: next.image,
                imageSource: next.imageSource,
              })
            }
          />
          <Field label="Pricing mode">
            <Select
              value={serviceForm.hasVariations ? 'variations' : 'base'}
              onChange={(e) => setServiceForm({ ...serviceForm, hasVariations: e.target.value === 'variations' })}
            >
              <option value="base">No variations — use base price</option>
              <option value="variations">With variations — each option has its own price</option>
            </Select>
          </Field>
          {serviceForm.hasVariations ? (
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Base price is disabled. Save this service, then add variations. Booking uses the selected variation price.
            </p>
          ) : (
            <Field label="Base price">
              <Input type="number" value={serviceForm.price} onChange={(e) => setServiceForm({ ...serviceForm, price: e.target.value })} />
            </Field>
          )}
          <Field label="Display order">
            <Input type="number" value={serviceForm.displayOrder} onChange={(e) => setServiceForm({ ...serviceForm, displayOrder: e.target.value })} />
          </Field>
          <Field label="Status">
            <Select value={serviceForm.status} onChange={(e) => setServiceForm({ ...serviceForm, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </Field>
          <p className="text-sm font-medium">Key points</p>
          <KeyPointsInput
            value={serviceForm.keyPoints}
            onChange={(keyPoints) => setServiceForm({ ...serviceForm, keyPoints })}
          />
          <Field label="Process steps (one per line: title | description)">
            <Textarea
              value={(serviceForm.processSteps || []).map((s) => [s.title, s.description].filter(Boolean).join(' | ')).join('\n')}
              onChange={(e) =>
                setServiceForm({
                  ...serviceForm,
                  processSteps: e.target.value
                    .split('\n')
                    .map((line) => {
                      const [title, ...rest] = line.split('|')
                      return { title: String(title || '').trim(), description: rest.join('|').trim(), image: '' }
                    })
                    .filter((s) => s.title || s.description),
                })
              }
            />
          </Field>
          <Field label="Brand image URL (optional)">
            <Input value={serviceForm.brandImage} onChange={(e) => setServiceForm({ ...serviceForm, brandImage: e.target.value })} />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={Boolean(serviceForm.revisitPolicy?.enabled)}
              onChange={(e) =>
                setServiceForm({
                  ...serviceForm,
                  revisitPolicy: { ...serviceForm.revisitPolicy, enabled: e.target.checked },
                })
              }
            />
            Enable revisit policy
          </label>
          {serviceForm.revisitPolicy?.enabled ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Revisit type">
                <Select
                  value={serviceForm.revisitPolicy.type}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      revisitPolicy: { ...serviceForm.revisitPolicy, type: e.target.value },
                    })
                  }
                >
                  {REVISIT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Validity unit">
                <Select
                  value={serviceForm.revisitPolicy.validityUnit}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      revisitPolicy: { ...serviceForm.revisitPolicy, validityUnit: e.target.value },
                    })
                  }
                >
                  {REVISIT_VALIDITY_UNITS.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
          ) : null}
          <Button type="submit">Save service</Button>
        </form>
      </Modal>

      <Modal open={variationOpen} title="Variation" onClose={() => setVariationOpen(false)}>
        <form className="grid gap-4" onSubmit={saveVariation}>
          <Field label="Title">
            <Input value={variationForm.title} onChange={(e) => setVariationForm({ ...variationForm, title: e.target.value })} required />
          </Field>
          <Field label="Short tagline">
            <Input value={variationForm.tagline} onChange={(e) => setVariationForm({ ...variationForm, tagline: e.target.value })} />
          </Field>
          <Field label="Price">
            <Input type="number" value={variationForm.price} onChange={(e) => setVariationForm({ ...variationForm, price: e.target.value })} required />
          </Field>
          <CatalogImageField
            image={variationForm.image}
            imageSource={variationForm.imageSource}
            onChange={(next) => setVariationForm({ ...variationForm, ...next })}
          />
          <Field label="Status">
            <Select value={variationForm.status} onChange={(e) => setVariationForm({ ...variationForm, status: e.target.value })}>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </Select>
          </Field>
          <Field label="Display order">
            <Input
              type="number"
              value={variationForm.displayOrder}
              onChange={(e) => setVariationForm({ ...variationForm, displayOrder: e.target.value })}
            />
          </Field>
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            {variationForm.id ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const v = { ...variationForm }
                  setVariationOpen(false)
                  setVariationToConvert(v)
                  setConvertModalOpen(true)
                }}
              >
                <Sparkles className="mr-1.5 size-4 text-[var(--primary)]" />
                Convert to service
              </Button>
            ) : <span />}
            <Button type="submit">Save variation</Button>
          </div>
        </form>
      </Modal>

      <Modal open={faqOpen} title="FAQ" onClose={() => setFaqOpen(false)}>
        <form
          className="grid gap-4"
          onSubmit={async (e) => {
            e.preventDefault()
            try {
              await upsertFaq(faqForm)
              setFaqOpen(false)
            } catch (err) {
              toast.error(err.message)
            }
          }}
        >
          <Field label="Question">
            <Input value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} />
          </Field>
          <Field label="Answer">
            <Textarea value={faqForm.answer} onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })} />
          </Field>
          <Button type="submit">Save FAQ</Button>
        </form>
      </Modal>
    </div>
  )
}
