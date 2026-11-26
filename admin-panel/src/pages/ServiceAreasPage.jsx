import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  Download,
  ExternalLink,
  Eye,
  Edit3,
  CheckCircle2,
  MapPin,
  Layers,
  Globe,
  Sparkles,
  Filter,
  Search,
  Check,
  X,
  RefreshCw,
} from 'lucide-react'
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
  SearchInput,
} from '../components/ui'
import { useApp } from '../context/useApp'
import { GURGAON_ZONES, GURGAON_LOCATIONS, APPLIANCE_SERVICES } from '../data/gurgaonLocations'

const emptyForm = {
  id: '',
  name: '',
  slug: '',
  active: true,
  pincodePrefixesText: '',
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function ServiceAreasPage() {
  const {
    platformSettings,
    loading,
    mutating,
    updateServiceAreas,
    updateGurgaonSeoOverrides,
  } = useApp()

  const [activeTab, setActiveTab] = useState('gurgaon') // 'gurgaon' | 'cities'
  const [areas, setAreas] = useState([])
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editIndex, setEditIndex] = useState(-1)

  // Gurgaon SEO State
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedZone, setSelectedZone] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'inactive' | 'overridden'
  const [page, setPage] = useState(1)
  const itemsPerPage = 15

  // Modals for Gurgaon SEO
  const [previewLoc, setPreviewLoc] = useState(null)
  const [editOverrideLoc, setEditOverrideLoc] = useState(null)
  const [overrideForm, setOverrideForm] = useState({
    customTitle: '',
    customDescription: '',
    active: true,
  })
  const [savingOverride, setSavingOverride] = useState(false)

  // Overrides map from platformSettings
  const seoOverrides = useMemo(() => {
    return platformSettings?.gurgaonSeoOverrides || {}
  }, [platformSettings?.gurgaonSeoOverrides])

  useEffect(() => {
    const list = Array.isArray(platformSettings?.serviceAreas) ? platformSettings.serviceAreas : []
    setAreas(
      list.map((row, index) => ({
        id: String(row?.id || row?.slug || `area-${index + 1}`),
        name: String(row?.name || ''),
        slug: String(row?.slug || ''),
        active: row?.active !== false,
        pincodePrefixes: Array.isArray(row?.pincodePrefixes) ? row.pincodePrefixes : [],
      })),
    )
  }, [platformSettings?.serviceAreas, platformSettings?.updatedAt])

  const persist = async (next) => {
    try {
      const saved = await updateServiceAreas(next)
      setAreas(saved)
    } catch (err) {
      toast.error(err?.message || 'Could not save service areas.')
      throw err
    }
  }

  const resetModal = () => {
    setForm(emptyForm)
    setEditIndex(-1)
    setOpen(false)
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    const name = String(form.name || '').trim()
    if (!name) {
      toast.error('City / area name is required.')
      return
    }
    const slug = slugify(form.slug || name)
    if (!slug) {
      toast.error('Slug is required.')
      return
    }
    const pincodePrefixes = String(form.pincodePrefixesText || '')
      .split(/[\s,]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    const row = {
      id: form.id || slug,
      name,
      slug,
      active: Boolean(form.active),
      pincodePrefixes,
    }
    const next = [...areas]
    if (editIndex >= 0) next[editIndex] = row
    else {
      if (next.some((a) => a.slug === slug)) {
        toast.error('A service area with this slug already exists.')
        return
      }
      next.push(row)
    }
    try {
      await persist(next)
      resetModal()
    } catch {
      /* toasted */
    }
  }

  const toggleActive = async (index) => {
    const next = areas.map((row, i) => (i === index ? { ...row, active: !row.active } : row))
    try {
      await persist(next)
    } catch {
      /* toasted */
    }
  }

  const removeArea = async (index) => {
    const target = areas[index]
    if (!window.confirm(`Remove service area “${target?.name || target?.slug}”?`)) return
    const next = areas.filter((_, i) => i !== index)
    try {
      await persist(next)
    } catch {
      /* toasted */
    }
  }

  // --- Gurgaon SEO Handlers ---
  const filteredGurgaonLocations = useMemo(() => {
    return GURGAON_LOCATIONS.filter((loc) => {
      const override = seoOverrides[loc.slug]
      const isActive = override?.active !== false // default true

      // Status filter
      if (statusFilter === 'active' && !isActive) return false
      if (statusFilter === 'inactive' && isActive) return false
      if (statusFilter === 'overridden' && !override?.customTitle && !override?.customDescription) {
        return false
      }

      // Zone filter
      if (selectedZone !== 'all') {
        const matchesPrimary = loc.zoneId === selectedZone
        const matchesSecondary = loc.secondaryZoneIds?.includes(selectedZone)
        if (!matchesPrimary && !matchesSecondary) return false
      }

      // Search filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim()
        const matchesName = loc.name.toLowerCase().includes(term)
        const matchesSlug = loc.slug.toLowerCase().includes(term)
        const matchesPincode = loc.pincode.includes(term)
        const matchesLandmark = loc.landmarks.some((l) => l.toLowerCase().includes(term))
        if (!matchesName && !matchesSlug && !matchesPincode && !matchesLandmark) return false
      }

      return true
    })
  }, [seoOverrides, statusFilter, selectedZone, searchTerm])

  const totalPages = Math.ceil(filteredGurgaonLocations.length / itemsPerPage) || 1
  const paginatedLocations = useMemo(() => {
    const start = (page - 1) * itemsPerPage
    return filteredGurgaonLocations.slice(start, start + itemsPerPage)
  }, [filteredGurgaonLocations, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchTerm, selectedZone, statusFilter])

  const handleToggleGurgaonLocationActive = async (loc) => {
    const current = seoOverrides[loc.slug] || {}
    const currentlyActive = current.active !== false
    const nextOverrides = {
      ...seoOverrides,
      [loc.slug]: {
        ...current,
        active: !currentlyActive,
      },
    }
    try {
      if (updateGurgaonSeoOverrides) {
        await updateGurgaonSeoOverrides(nextOverrides)
      } else {
        toast.error('Update function not available.')
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to update location status')
    }
  }

  const handleOpenEditOverride = (loc) => {
    const current = seoOverrides[loc.slug] || {}
    setEditOverrideLoc(loc)
    setOverrideForm({
      customTitle: current.customTitle || '',
      customDescription: current.customDescription || '',
      active: current.active !== false,
    })
  }

  const handleSaveOverride = async (e) => {
    e.preventDefault()
    if (!editOverrideLoc) return
    setSavingOverride(true)
    const nextOverrides = {
      ...seoOverrides,
      [editOverrideLoc.slug]: {
        ...seoOverrides[editOverrideLoc.slug],
        customTitle: overrideForm.customTitle.trim(),
        customDescription: overrideForm.customDescription.trim(),
        active: overrideForm.active,
      },
    }

    try {
      if (updateGurgaonSeoOverrides) {
        await updateGurgaonSeoOverrides(nextOverrides)
        toast.success(`SEO override saved for ${editOverrideLoc.name}`)
        setEditOverrideLoc(null)
      } else {
        toast.error('Update function not available.')
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to save SEO override')
    } finally {
      setSavingOverride(false)
    }
  }

  const handleResetOverride = async () => {
    if (!editOverrideLoc) return
    const nextOverrides = { ...seoOverrides }
    delete nextOverrides[editOverrideLoc.slug]

    setSavingOverride(true)
    try {
      if (updateGurgaonSeoOverrides) {
        await updateGurgaonSeoOverrides(nextOverrides)
        toast.success(`Reset ${editOverrideLoc.name} to system SEO defaults`)
        setEditOverrideLoc(null)
      }
    } catch (err) {
      toast.error(err?.message || 'Failed to reset override')
    } finally {
      setSavingOverride(false)
    }
  }

  const handleExportCsv = () => {
    const headers = [
      'ID',
      'Name',
      'Slug',
      'Zone',
      'Zone Name',
      'Pincode',
      'Response Time',
      'Status',
      'Canonical URL',
      'Meta Title',
      'Meta Description',
    ]

    const rows = GURGAON_LOCATIONS.map((loc) => {
      const override = seoOverrides[loc.slug] || {}
      const isActive = override.active !== false ? 'Active' : 'Inactive'
      const zone = GURGAON_ZONES.find((z) => z.id === loc.zoneId)
      const canonicalUrl = `https://repairseries.com/service-areas/${loc.slug}`
      const metaTitle =
        override.customTitle ||
        `Best Appliance Repair in ${loc.name}, Gurgaon | Fast 45-Mins Service - Repair Series`
      const metaDesc =
        override.customDescription ||
        `Doorstep appliance repair service in ${loc.name}, Gurgaon. Certified technicians for AC, Refrigerator, Washing Machine, RO, Microwave & Geyser with 30-day warranty.`

      return [
        loc.id,
        `"${loc.name.replace(/"/g, '""')}"`,
        loc.slug,
        loc.zoneId,
        `"${(zone?.name || '').replace(/"/g, '""')}"`,
        loc.pincode,
        `"${loc.responseTime}"`,
        isActive,
        canonicalUrl,
        `"${metaTitle.replace(/"/g, '""')}"`,
        `"${metaDesc.replace(/"/g, '""')}"`,
      ].join(',')
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `repair-series-gurgaon-188-seo-locations-${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Gurgaon 188 SEO locations exported to CSV.')
  }

  const busy = Boolean(mutating?.serviceAreas)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coverage & Local SEO"
        description="Manage Gurgaon (Gurugram) 188 hyper-local SEO landing zones and general application service areas."
        badge={
          <Badge tone="success" className="px-2.5 py-1">
            Gurgaon SEO: 188 Areas Live
          </Badge>
        }
        actions={
          activeTab === 'gurgaon' ? (
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={handleExportCsv} className="gap-1.5 text-xs">
                <Download className="h-4 w-4" /> Export 188 Locations (CSV)
              </Button>
              <a
                href="/service-areas"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--outline)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--on-surface)] shadow-xs transition hover:bg-[var(--surface-container-high)]"
              >
                <Globe className="h-4 w-4 text-[var(--primary)]" /> View Public Hub
              </a>
            </div>
          ) : (
            <Button onClick={() => setOpen(true)}>Add city</Button>
          )
        }
      />

      {/* Tabs Switcher */}
      <div className="flex border-b border-[var(--outline)]">
        <button
          type="button"
          onClick={() => setActiveTab('gurgaon')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'gurgaon'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
          }`}
        >
          <MapPin className="h-4 w-4" />
          Gurgaon Local SEO Directory
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            188 Areas
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cities')}
          className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-semibold transition ${
            activeTab === 'cities'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-[var(--on-surface-variant)] hover:text-[var(--on-surface)]'
          }`}
        >
          <Layers className="h-4 w-4" />
          App Service Cities (Geo-Gating)
          <span className="rounded-full bg-[var(--surface-container-high)] px-2 py-0.5 text-xs text-[var(--on-surface-variant)]">
            {areas.length}
          </span>
        </button>
      </div>

      {/* TAB 1: GURGAON LOCAL SEO DIRECTORY */}
      {activeTab === 'gurgaon' && (
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
                Total Localities
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--on-surface)]">188</span>
                <span className="text-xs text-emerald-600 font-medium">100% Covered</span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--on-surface-variant)]">
                All 9 municipal Gurgaon zones
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
                Core Appliance Services
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-[var(--on-surface)]">9 Services</span>
                <span className="text-xs text-amber-600 font-medium">1,692 URLs</span>
              </div>
              <p className="mt-1 text-[11px] text-[var(--on-surface-variant)]">
                Dynamic combinations live
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
                Sitemap Indexing
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-2xl font-black text-emerald-600">340+ URLs</span>
                <Badge tone="success" size="sm">
                  Priority 0.8
                </Badge>
              </div>
              <p className="mt-1 text-[11px] text-[var(--on-surface-variant)]">
                Included in sitemap.xml
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[var(--on-surface-variant)]">
                Structured Schema
              </p>
              <div className="mt-1 flex items-baseline justify-between">
                <span className="text-sm font-bold text-[var(--on-surface)]">LocalBusiness + FAQ</span>
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="mt-1 text-[11px] text-[var(--on-surface-variant)]">
                Sector 37D coordinates verified
              </p>
            </Card>
          </div>

          {/* Filters & Search Control */}
          <Card className="p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 flex-wrap items-center gap-3">
                <div className="relative min-w-[240px] flex-1">
                  <SearchInput
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onClear={() => setSearchTerm('')}
                    placeholder="Search by sector, locality, slug, or pincode..."
                  />
                </div>

                <Select
                  value={selectedZone}
                  onChange={(e) => setSelectedZone(e.target.value)}
                  className="w-full sm:w-auto text-xs"
                >
                  <option value="all">All 9 Gurgaon Zones ({GURGAON_LOCATIONS.length})</option>
                  {GURGAON_ZONES.map((z) => (
                    <option key={z.id} value={z.id}>
                      Zone {z.zoneNumber}: {z.name}
                    </option>
                  ))}
                </Select>

                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full sm:w-auto text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                  <option value="overridden">With Custom SEO Overrides</option>
                </Select>
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--on-surface-variant)]">
                <span>
                  Showing{' '}
                  <strong className="text-[var(--on-surface)]">
                    {filteredGurgaonLocations.length}
                  </strong>{' '}
                  of 188 locations
                </span>
              </div>
            </div>
          </Card>

          {/* Locations Table */}
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--outline)] bg-[var(--surface-container)] text-[var(--on-surface-variant)]">
                    <th className="px-4 py-3 font-semibold">Location / Sector</th>
                    <th className="px-4 py-3 font-semibold">Zone</th>
                    <th className="px-4 py-3 font-semibold">Pincode</th>
                    <th className="px-4 py-3 font-semibold">Response Time</th>
                    <th className="px-4 py-3 font-semibold">Sitemap & Schema</th>
                    <th className="px-4 py-3 font-semibold">SEO Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--outline)]">
                  {paginatedLocations.map((loc) => {
                    const override = seoOverrides[loc.slug] || {}
                    const isActive = override.active !== false
                    const hasCustomSeo = Boolean(override.customTitle || override.customDescription)
                    const zone = GURGAON_ZONES.find((z) => z.id === loc.zoneId)

                    return (
                      <tr
                        key={loc.id}
                        className="transition hover:bg-[var(--surface-container-high)]/40"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--on-surface)]">{loc.name}</span>
                            {hasCustomSeo && (
                              <span
                                title="Custom SEO override active"
                                className="inline-flex items-center rounded-sm bg-purple-100 px-1 py-0.2 text-[10px] font-semibold text-purple-700 dark:bg-purple-950/60 dark:text-purple-300"
                              >
                                Custom SEO
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-[var(--on-surface-variant)]">
                            /service-areas/{loc.slug}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block rounded-md bg-[var(--surface-container-highest)] px-2 py-0.5 text-[11px] font-medium text-[var(--on-surface)]">
                            Zone {zone?.zoneNumber}: {zone?.name}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px]">{loc.pincode}</td>
                        <td className="px-4 py-3 text-[11px] text-[var(--on-surface-variant)]">
                          {loc.responseTime}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                              <CheckCircle2 className="h-3 w-3" /> Indexed in Sitemap
                            </span>
                            <span className="text-[10px] text-[var(--on-surface-variant)]">
                              LocalBusiness + FAQ
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => handleToggleGurgaonLocationActive(loc)}
                            className="cursor-pointer"
                            title="Click to toggle active status"
                          >
                            <Badge tone={isActive ? 'success' : 'neutral'} size="sm">
                              {isActive ? 'Active' : 'Paused'}
                            </Badge>
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => setPreviewLoc(loc)}
                              title="Preview Google SERP & Schema"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Preview</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              className="h-7 px-2 text-[11px]"
                              onClick={() => handleOpenEditOverride(loc)}
                              title="Edit Custom SEO Title & Description"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Edit SEO</span>
                            </Button>
                            <a
                              href={`/service-areas/${loc.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex h-7 items-center justify-center rounded-md border border-[var(--outline)] bg-[var(--surface)] px-2 text-[11px] font-medium text-[var(--on-surface)] transition hover:bg-[var(--surface-container-high)]"
                              title="Open live landing page"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                  {!paginatedLocations.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-[var(--on-surface-variant)]">
                        No locations matched the selected filter. Try adjusting your search term.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-[var(--outline)] px-4 py-3 text-xs text-[var(--on-surface-variant)]">
                <div>
                  Page {page} of {totalPages}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: GENERAL APP SERVICE CITIES (ORIGINAL GEO GATING) */}
      {activeTab === 'cities' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--on-surface-variant)]">
              Cities configured on <code className="font-mono">settings/general.serviceAreas</code>{' '}
              for general geo-gating in mobile and web apps.
            </p>
            <Button onClick={() => setOpen(true)} size="sm">
              Add city
            </Button>
          </div>

          {loading.platformSettings ? (
            <Card>
              <p className="text-sm text-[var(--on-surface-variant)]">Loading service areas…</p>
            </Card>
          ) : null}

          {!loading.platformSettings && !areas.length ? (
            <Card>
              <p className="text-sm text-[var(--on-surface-variant)]">
                No service areas configured yet. Add your first city.
              </p>
            </Card>
          ) : null}

          <div className="grid gap-4">
            {areas.map((area, index) => (
              <Card key={area.id || area.slug}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--on-surface)]">{area.name}</p>
                    <p className="mt-1 text-xs text-[var(--on-surface-variant)]">
                      slug: {area.slug}
                    </p>
                    <p className="mt-2 text-sm text-[var(--on-surface-variant)]">
                      Pincode prefixes:{' '}
                      {(area.pincodePrefixes || []).length
                        ? area.pincodePrefixes.join(', ')
                        : '—'}
                    </p>
                  </div>
                  <Badge tone={area.active ? 'success' : 'warning'}>
                    {area.active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={busy}
                    onClick={() => {
                      setEditIndex(index)
                      setForm({
                        id: area.id,
                        name: area.name,
                        slug: area.slug,
                        active: area.active,
                        pincodePrefixesText: (area.pincodePrefixes || []).join(', '),
                      })
                      setOpen(true)
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={busy}
                    onClick={() => void toggleActive(index)}
                  >
                    {area.active ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={busy}
                    onClick={() => void removeArea(index)}
                  >
                    Remove
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT APP SERVICE CITY */}
      <Modal
        open={open}
        title={editIndex >= 0 ? 'Edit service area' : 'Add service area'}
        onClose={resetModal}
        className="max-w-lg"
      >
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Name">
            <Input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((cur) => ({
                  ...cur,
                  name,
                  slug: cur.slug && editIndex >= 0 ? cur.slug : slugify(name),
                }))
              }}
              placeholder="e.g. Aligarh"
              required
            />
          </Field>
          <Field label="Slug">
            <Input
              value={form.slug}
              onChange={(e) => setForm((cur) => ({ ...cur, slug: slugify(e.target.value) }))}
              placeholder="aligarh"
              required
            />
          </Field>
          <Field label="Pincode prefixes (optional, comma-separated)">
            <Input
              value={form.pincodePrefixesText}
              onChange={(e) => setForm((cur) => ({ ...cur, pincodePrefixesText: e.target.value }))}
              placeholder="e.g. 202, 203"
            />
          </Field>
          <Field label="Active">
            <Select
              value={form.active ? 'true' : 'false'}
              onChange={(e) => setForm((cur) => ({ ...cur, active: e.target.value === 'true' }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={resetModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: GOOGLE SERP & SCHEMA PREVIEW FOR GURGAON LOCATION */}
      {previewLoc && (
        <Modal
          open={Boolean(previewLoc)}
          title={`Google SERP Preview: ${previewLoc.name}`}
          onClose={() => setPreviewLoc(null)}
          className="max-w-2xl"
        >
          {(() => {
            const override = seoOverrides[previewLoc.slug] || {}
            const title =
              override.customTitle ||
              `Best Appliance Repair in ${previewLoc.name}, Gurgaon | Fast 45-Mins Service - Repair Series`
            const desc =
              override.customDescription ||
              `Looking for doorstep home appliance repair in ${previewLoc.name}, Gurgaon? Repair Series provides certified repair for AC, Refrigerator, Washing Machine, RO & Microwave with 30-day warranty.`
            const url = `https://repairseries.com/service-areas/${previewLoc.slug}`

            return (
              <div className="space-y-5">
                {/* Google Search Simulator Card */}
                <div className="rounded-xl border border-gray-200 bg-white p-5 font-sans text-left shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
                  <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-neutral-400">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-800">
                      RS
                    </span>
                    <div>
                      <div className="font-medium text-gray-800 dark:text-neutral-200">
                        Repair Series
                      </div>
                      <div className="text-[11px] text-gray-500 dark:text-neutral-400">
                        https://repairseries.com &rsaquo; service-areas &rsaquo; {previewLoc.slug}
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-2 text-lg font-medium leading-snug text-blue-700 hover:underline dark:text-blue-400">
                    {title}
                  </h3>

                  <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-neutral-300">
                    {desc}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-gray-500">
                    <span className="rounded-sm bg-gray-100 px-2 py-0.5 dark:bg-neutral-800">
                      Response: Within 45–60 mins
                    </span>
                    <span className="rounded-sm bg-gray-100 px-2 py-0.5 dark:bg-neutral-800">
                      Warranty: 30 Days
                    </span>
                    <span className="rounded-sm bg-gray-100 px-2 py-0.5 dark:bg-neutral-800">
                      Rating: 4.8 &star; (1,250+ reviews)
                    </span>
                  </div>
                </div>

                {/* Schema Information */}
                <div className="rounded-lg bg-[var(--surface-container)] p-4 text-xs space-y-2">
                  <p className="font-semibold text-[var(--on-surface)] flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Structured Data (JSON-LD) Embedded
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-[var(--on-surface-variant)]">
                    <li>
                      <strong>LocalBusiness:</strong> Repair Series Gurgaon (Sector 37D, Lat 28.4012, Lng 76.9558, AreaServed: {previewLoc.name})
                    </li>
                    <li>
                      <strong>BreadcrumbList:</strong> Home &gt; Service Areas &gt; {previewLoc.name}
                    </li>
                    <li>
                      <strong>FAQPage:</strong> 3 hyper-localized Q&amp;As addressing response time, pricing, and warranty in {previewLoc.name}.
                    </li>
                    <li>
                      <strong>Service Schemas:</strong> 9 dedicated appliance service records with starting prices from &#8377;199.
                    </li>
                  </ul>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setPreviewLoc(null)}>
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      const targetLoc = previewLoc
                      setPreviewLoc(null)
                      handleOpenEditOverride(targetLoc)
                    }}
                  >
                    Edit SEO Meta
                  </Button>
                </div>
              </div>
            )
          })()}
        </Modal>
      )}

      {/* MODAL 3: EDIT SEO OVERRIDE FOR LOCATION */}
      {editOverrideLoc && (
        <Modal
          open={Boolean(editOverrideLoc)}
          title={`Edit SEO Metadata: ${editOverrideLoc.name}`}
          onClose={() => setEditOverrideLoc(null)}
          className="max-w-xl"
        >
          <form className="space-y-4" onSubmit={handleSaveOverride}>
            <div className="rounded-lg bg-[var(--surface-container)] p-3 text-xs text-[var(--on-surface-variant)]">
              Editing SEO configuration for <strong>{editOverrideLoc.name}</strong> (Slug:{' '}
              <code>{editOverrideLoc.slug}</code>). Leaving fields blank will automatically revert to
              the optimized system defaults.
            </div>

            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span>Custom Meta Title (Optimal: 50–60 chars)</span>
                  <span
                    className={`text-xs ${
                      overrideForm.customTitle.length > 65
                        ? 'text-red-500 font-bold'
                        : 'text-[var(--on-surface-variant)]'
                    }`}
                  >
                    {overrideForm.customTitle.length} chars
                  </span>
                </div>
              }
            >
              <Input
                value={overrideForm.customTitle}
                onChange={(e) =>
                  setOverrideForm((cur) => ({ ...cur, customTitle: e.target.value }))
                }
                placeholder={`Best Appliance Repair in ${editOverrideLoc.name}, Gurgaon | Fast 45-Mins Service - Repair Series`}
              />
            </Field>

            <Field
              label={
                <div className="flex justify-between items-center w-full">
                  <span>Custom Meta Description (Optimal: 140–160 chars)</span>
                  <span
                    className={`text-xs ${
                      overrideForm.customDescription.length > 165
                        ? 'text-red-500 font-bold'
                        : 'text-[var(--on-surface-variant)]'
                    }`}
                  >
                    {overrideForm.customDescription.length} chars
                  </span>
                </div>
              }
            >
              <Textarea
                rows={3}
                value={overrideForm.customDescription}
                onChange={(e) =>
                  setOverrideForm((cur) => ({ ...cur, customDescription: e.target.value }))
                }
                placeholder={`Looking for doorstep home appliance repair in ${editOverrideLoc.name}, Gurgaon? Repair Series provides certified repair for AC, Refrigerator, Washing Machine, RO & Microwave with 30-day warranty.`}
              />
            </Field>

            <Field label="Landing Page Status">
              <Select
                value={overrideForm.active ? 'true' : 'false'}
                onChange={(e) =>
                  setOverrideForm((cur) => ({ ...cur, active: e.target.value === 'true' }))
                }
              >
                <option value="true">Active (Indexed and accessible)</option>
                <option value="false">Paused (Temporarily de-prioritized)</option>
              </Select>
            </Field>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="danger"
                onClick={handleResetOverride}
                disabled={savingOverride}
                className="text-xs"
              >
                Reset to System Defaults
              </Button>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditOverrideLoc(null)}
                  disabled={savingOverride}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingOverride}>
                  {savingOverride ? 'Saving…' : 'Save Override'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
