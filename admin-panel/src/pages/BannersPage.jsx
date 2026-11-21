import { useMemo, useState } from 'react'
import { Pencil, Plus, Trash2, Sparkles, MoveHorizontal, Sliders } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Card, PageHeader, SearchInput, Select } from '../components/ui'
import { BANNER_SECTION_LABELS, BANNER_SECTIONS, normalizeBannerSection } from '../constants/catalog'
import { useApp } from '../context/useApp'
import { DynamicBannerEditor } from '../components/DynamicBannerEditor'

const toDateTimeLocal = (ts) => {
  const d = ts?.toDate?.() ? ts.toDate() : ts instanceof Date ? ts : ts ? new Date(ts) : null
  if (!d || Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function BannersPage() {
  const { banners, loading, mutating, upsertBanner, deleteBanner, serviceTypes, categories, services } = useApp()
  const [search, setSearch] = useState('')
  const [sectionFilter, setSectionFilter] = useState('all')
  const [editingBanner, setEditingBanner] = useState(null)
  const [editorOpen, setEditorOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return (banners || [])
      .filter((b) => sectionFilter === 'all' || normalizeBannerSection(b.section) === sectionFilter)
      .filter((b) => {
        if (!q) return true
        const hay = [b.title, b.tagline, b.section, b.redirectLink, b.buttonText, BANNER_SECTION_LABELS[b.section], b.id]
          .join(' ')
          .toLowerCase()
        return hay.includes(q)
      })
      .sort((a, b) => {
        const oa = Number(a.displayOrder ?? 0)
        const ob = Number(b.displayOrder ?? 0)
        if (oa !== ob) return oa - ob
        return String(a.title || '').localeCompare(String(b.title || ''))
      })
  }, [banners, search, sectionFilter])

  const openNewBanner = () => {
    setEditingBanner({
      id: '',
      title: '',
      tagline: '',
      buttonText: 'Book Service',
      buttonLink: '/services',
      section: 'home',
      mobileImage: '',
      websiteImage: '',
      image: '',
      redirectLink: '',
      displayOrder: (banners?.length || 0) + 1,
      enabled: true,
      active: true,
      startAt: '',
      endAt: '',
      serviceTypeId: '',
      categoryId: '',
      serviceId: '',
      clickAction: 'none',
      slideDuration: 3500,
      contentPosition: 'left',
      contentVerticalAlign: 'center',
      elementOrder: ['title', 'tagline', 'button'],
      animations: {
        title: 'slideUp',
        tagline: 'slideUp',
        button: 'fadeIn',
        duration: 0.6,
        stagger: 0.15,
      },
      overlay: {
        enabled: true,
        color: '#000000',
        opacity: 45,
        gradientDirection: 'to-r',
        gradientIntensity: 70,
        backdropBlur: false,
      },
      styling: {
        titleColor: '#FFFFFF',
        titleWeight: '800',
        titleLineHeight: 'tight',
        titleShadow: 'medium',
        titleOutline: false,
        taglineColor: '#F3F4F6',
        taglineWeight: '500',
        taglineLineHeight: 'normal',
        taglineShadow: 'subtle',
        taglineOutline: false,
        buttonBgColor: '#C86A37',
        buttonTextColor: '#FFFFFF',
        buttonRadius: 'rounded-xl',
        contentGap: 12,
        maxWidth: 650,
      },
      responsive: {
        desktop: {
          titleSize: 32,
          taglineSize: 16,
          position: 'left',
          verticalAlign: 'center',
          buttonSize: 'md',
          maxWidth: 650,
        },
        tablet: {
          titleSize: 26,
          taglineSize: 14,
          position: 'left',
          verticalAlign: 'center',
          buttonSize: 'md',
          maxWidth: 500,
        },
        mobile: {
          titleSize: 20,
          taglineSize: 13,
          position: 'center',
          verticalAlign: 'center',
          buttonSize: 'sm',
          maxWidth: 340,
        },
      },
    })
    setEditorOpen(true)
  }

  const openEditBanner = (row) => {
    setEditingBanner({
      ...row,
      startAt: toDateTimeLocal(row.startAt),
      endAt: toDateTimeLocal(row.endAt),
    })
    setEditorOpen(true)
  }

  const handleSaveBanner = async (savedBanner) => {
    try {
      await upsertBanner(savedBanner)
      setEditorOpen(false)
      setEditingBanner(null)
    } catch (err) {
      toast.error(err?.message || 'Could not save banner.')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Banners & Dynamic Offers"
        description="Build responsive interactive promotional banners with custom overlay text, animations, and live desktop/mobile preview."
        actions={
          <>
            <SearchInput value={search} onChange={setSearch} placeholder="Search banners…" />
            <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="min-w-[160px]">
              <option value="all">All sections</option>
              {BANNER_SECTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              className="gap-2"
              onClick={openNewBanner}
            >
              <Plus className="size-4" /> Add Dynamic Banner
            </Button>
          </>
        }
      />

      <Card className="overflow-hidden p-0">
        {loading.banners ? (
          <div className="flex items-center justify-center p-12 text-sm font-medium text-slate-700 dark:text-slate-300">
            Loading banners…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-800 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200">
                <tr>
                  <th className="px-4 py-3 font-bold">Preview</th>
                  <th className="px-4 py-3 font-bold">Section</th>
                  <th className="px-4 py-3 font-bold">Title & Content</th>
                  <th className="px-4 py-3 font-bold">Position & Overlay</th>
                  <th className="px-4 py-3 font-bold">Order</th>
                  <th className="px-4 py-3 font-bold">Status</th>
                  <th className="px-4 py-3 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((row) => {
                  const enabled = row.enabled !== false && row.active !== false
                  const thumb = row.websiteImage || row.mobileImage || row.image || row.imageUrl
                  const hasOverlay = row.overlay?.enabled !== false
                  const position = row.contentPosition || row.responsive?.desktop?.position || 'left'

                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        {thumb ? (
                          <div className="relative h-14 w-28 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 dark:border-slate-800">
                            <img src={thumb} alt="" className="h-full w-full object-cover" />
                            {row.title ? (
                              <div className="absolute inset-0 bg-black/40 p-1 flex items-end">
                                <span className="line-clamp-1 text-[10px] font-bold text-white drop-shadow-xs">
                                  {row.title}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex h-14 w-28 items-center justify-center rounded-xl bg-slate-100 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {BANNER_SECTION_LABELS[row.section] || row.section || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {row.title || <span className="text-slate-400 font-normal italic">Image only</span>}
                          </p>
                          {row.tagline ? (
                            <p className="text-xs text-slate-500 line-clamp-1 font-medium">{row.tagline}</p>
                          ) : null}
                          {row.buttonText ? (
                            <span className="inline-block mt-1 text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950/40 px-2 py-0.5 rounded-md border border-primary-200 dark:border-primary-800">
                              Button: {row.buttonText}
                            </span>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 text-xs font-semibold capitalize text-slate-700 dark:text-slate-300">
                            <MoveHorizontal className="size-3 text-slate-400" />
                            {position}
                          </span>
                          <div>
                            <span className="text-[11px] font-mono text-slate-500">
                              {hasOverlay ? `Overlay (${row.overlay?.opacity ?? 45}%)` : 'No overlay'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {Number(row.displayOrder ?? 0)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={enabled ? 'success' : 'neutral'}>{enabled ? 'Enabled' : 'Disabled'}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            title="Edit banner with dynamic editor"
                            className="rounded-xl border border-slate-200 p-2 text-primary-700 hover:bg-primary-50 dark:border-slate-700 dark:text-primary-300 dark:hover:bg-primary-950/40 transition-colors"
                            onClick={() => openEditBanner(row)}
                          >
                            <Pencil className="size-4" />
                          </button>
                          <button
                            type="button"
                            title="Delete banner"
                            className="rounded-xl border border-slate-200 p-2 text-red-600 hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-950/30 transition-colors"
                            disabled={Boolean(mutating.bannerDelete)}
                            onClick={async () => {
                              if (!window.confirm(`Delete banner for "${BANNER_SECTION_LABELS[row.section] || row.section}"?`)) return
                              try {
                                await deleteBanner(row.id)
                              } catch (err) {
                                toast.error(err?.message || 'Delete failed.')
                              }
                            }}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {!filtered.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center font-medium text-slate-600 dark:text-slate-400">
                      No banners found. Click <strong>"Add Dynamic Banner"</strong> above to create your first dynamic banner.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Dynamic Banner Editor Modal Overlay */}
      {editorOpen && editingBanner ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/75 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-7xl animate-in fade-in zoom-in-95 duration-200">
            <DynamicBannerEditor
              banner={editingBanner}
              saving={Boolean(mutating.banner)}
              onSave={handleSaveBanner}
              onCancel={() => {
                setEditorOpen(false)
                setEditingBanner(null)
              }}
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
