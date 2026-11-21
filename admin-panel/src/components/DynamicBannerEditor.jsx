import { useState, useMemo } from 'react'
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCcw,
  Upload,
  Link2,
  ArrowUp,
  ArrowDown,
  Layers,
  Type,
  Palette,
  Play,
  Sparkles,
  Sliders,
  Check,
  Eye,
  EyeOff,
  MoveHorizontal,
  MoveVertical,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button, Field, Input, Select, Badge } from './ui'
import { BANNER_SECTIONS, BANNER_SECTION_LABELS, normalizeBannerSection } from '../constants/catalog'
import { BANNER_CLICK_ACTIONS } from '../constants/homeSections'
import { uploadToCloudinary } from '../services/cloudinary'
import { catalogTitle } from '../utils/catalogHierarchy'

const COLOR_SWATCHES = [
  '#FFFFFF',
  '#000000',
  '#0A0F1C',
  '#C86A37',
  '#7E1926',
  '#F59E0B',
  '#10B981',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#EC4899',
  '#F43F5E',
]

const OVERLAY_COLORS = [
  '#000000',
  '#0A0F1C',
  '#1E293B',
  '#431407',
  '#7E1926',
  '#0F172A',
  '#172554',
  '#14532D',
]

const SHADOW_PRESETS = [
  { value: 'none', label: 'None' },
  { value: 'subtle', label: 'Subtle' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
  { value: 'glow', label: 'Glow' },
]

const ANIMATION_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'slideUp', label: 'Slide Up' },
  { value: 'slideDown', label: 'Slide Down' },
  { value: 'slideLeft', label: 'Slide Left' },
  { value: 'slideRight', label: 'Slide Right' },
  { value: 'fadeIn', label: 'Fade In' },
]

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0,0,0,${alpha})`
  let c = hex.replace('#', '').trim()
  if (c.length === 3) c = c.split('').map((x) => x + x).join('')
  const num = parseInt(c, 16)
  if (Number.isNaN(num)) return `rgba(0,0,0,${alpha})`
  const r = (num >> 16) & 255
  const g = (num >> 8) & 255
  const b = num & 255
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function DynamicBannerEditor({
  banner,
  onSave,
  onCancel,
  saving = false,
  serviceTypes = [],
  categories = [],
  services = [],
  title: customTitle,
  subtitle: customSubtitle,
}) {
  // Deep copy banner with sensible defaults
  const [form, setForm] = useState(() => {
    const rawUrl = String(banner?.url || banner?.image || banner?.websiteImage || banner?.mobileImage || '').trim()
    return {
      id: banner?.id || '',
      title: banner?.title || '',
      tagline: banner?.tagline || '',
      buttonText: banner?.buttonText || '',
      buttonLink: banner?.buttonLink || banner?.redirectLink || '',
      section: normalizeBannerSection(banner?.section || 'home'),
      mobileImage: banner?.mobileImage || (banner?.source !== 'url' ? rawUrl : '') || '',
      websiteImage: banner?.websiteImage || rawUrl || '',
      image: banner?.image || rawUrl || '',
      url: rawUrl,
      redirectLink: banner?.redirectLink || banner?.buttonLink || '',
      displayOrder: Number(banner?.displayOrder ?? 0),
      enabled: banner?.enabled !== false && banner?.active !== false,
      startAt: banner?.startAt || '',
      endAt: banner?.endAt || '',
      serviceTypeId: banner?.serviceTypeId || '',
      categoryId: banner?.categoryId || '',
      serviceId: banner?.serviceId || '',
      clickAction: banner?.clickAction || (banner?.redirectLink ? 'external' : 'none'),
      slideDuration: Number(banner?.slideDuration ?? 3000),
      contentPosition: banner?.contentPosition || 'left',
      contentVerticalAlign: banner?.contentVerticalAlign || 'center',
      elementOrder: Array.isArray(banner?.elementOrder) && banner.elementOrder.length > 0
        ? banner.elementOrder
        : ['title', 'tagline', 'button'],
      animations: {
        title: banner?.animations?.title || 'slideUp',
        tagline: banner?.animations?.tagline || 'slideUp',
        button: banner?.animations?.button || 'fadeIn',
        duration: banner?.animations?.duration ?? 0.6,
        stagger: banner?.animations?.stagger ?? 0.15,
      },
      overlay: {
        enabled: banner?.overlay?.enabled !== false,
        color: banner?.overlay?.color || '#000000',
        opacity: banner?.overlay?.opacity ?? 45,
        gradientDirection: banner?.overlay?.gradientDirection || 'to-r',
        gradientIntensity: banner?.overlay?.gradientIntensity ?? 70,
        backdropBlur: Boolean(banner?.overlay?.backdropBlur),
      },
      styling: {
        titleColor: banner?.styling?.titleColor || '#FFFFFF',
        titleWeight: banner?.styling?.titleWeight || '800',
        titleLineHeight: banner?.styling?.titleLineHeight || 'tight',
        titleShadow: banner?.styling?.titleShadow || 'medium',
        titleOutline: Boolean(banner?.styling?.titleOutline),
        taglineColor: banner?.styling?.taglineColor || '#F3F4F6',
        taglineWeight: banner?.styling?.taglineWeight || '500',
        taglineLineHeight: banner?.styling?.taglineLineHeight || 'normal',
        taglineShadow: banner?.styling?.taglineShadow || 'subtle',
        taglineOutline: Boolean(banner?.styling?.taglineOutline),
        buttonBgColor: banner?.styling?.buttonBgColor || '#C86A37',
        buttonTextColor: banner?.styling?.buttonTextColor || '#FFFFFF',
        buttonRadius: banner?.styling?.buttonRadius || 'rounded-xl',
        contentGap: banner?.styling?.contentGap ?? 12,
        maxWidth: banner?.styling?.maxWidth ?? 650,
      },
      responsive: {
        desktop: {
          titleSize: banner?.responsive?.desktop?.titleSize ?? 32,
          taglineSize: banner?.responsive?.desktop?.taglineSize ?? 16,
          position: banner?.responsive?.desktop?.position ?? 'left',
          verticalAlign: banner?.responsive?.desktop?.verticalAlign ?? 'center',
          maxWidth: banner?.responsive?.desktop?.maxWidth ?? 650,
          buttonSize: banner?.responsive?.desktop?.buttonSize ?? 'md',
        },
        tablet: {
          titleSize: banner?.responsive?.tablet?.titleSize ?? 26,
          taglineSize: banner?.responsive?.tablet?.taglineSize ?? 14,
          position: banner?.responsive?.tablet?.position ?? 'left',
          verticalAlign: banner?.responsive?.tablet?.verticalAlign ?? 'center',
          maxWidth: banner?.responsive?.tablet?.maxWidth ?? 500,
          buttonSize: banner?.responsive?.tablet?.buttonSize ?? 'md',
        },
        mobile: {
          titleSize: banner?.responsive?.mobile?.titleSize ?? 20,
          taglineSize: banner?.responsive?.mobile?.taglineSize ?? 13,
          position: banner?.responsive?.mobile?.position ?? 'center',
          verticalAlign: banner?.responsive?.mobile?.verticalAlign ?? 'center',
          maxWidth: banner?.responsive?.mobile?.maxWidth ?? 340,
          buttonSize: banner?.responsive?.mobile?.buttonSize ?? 'sm',
        },
      },
    }
  })

  const [activeTab, setActiveTab] = useState('content') // 'content' | 'layout' | 'styling' | 'animations'
  const [devicePreview, setDevicePreview] = useState('desktop') // 'desktop' | 'tablet' | 'mobile'
  const [responsiveDeviceTab, setResponsiveDeviceTab] = useState('desktop') // for styling tab
  const [replayKey, setReplayKey] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [mobileSourceMode, setMobileSourceMode] = useState(
    form.mobileImage && !form.mobileImage.includes('res.cloudinary.com') ? 'url' : 'upload',
  )
  const [websiteSourceMode, setWebsiteSourceMode] = useState(
    form.websiteImage && !form.websiteImage.includes('res.cloudinary.com') ? 'url' : 'upload',
  )

  const handleUpload = async (file, field) => {
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file, {
        kind: 'banner',
        section: form.section,
        bannerId: form.id,
        slot: field,
      })
      setForm((c) => {
        const next = { ...c, [field]: url }
        if (!next.image && (field === 'mobileImage' || field === 'websiteImage')) next.image = url
        return next
      })
      toast.success(file.type === 'image/gif' ? 'Animated GIF uploaded.' : 'Banner image uploaded.')
    } catch (err) {
      toast.error(err?.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  // Element ordering handlers
  const moveElement = (element, direction) => {
    const list = [...form.elementOrder]
    const idx = list.indexOf(element)
    if (idx < 0) return
    const swap = direction === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= list.length) return
    const [moved] = list.splice(idx, 1)
    list.splice(swap, 0, moved)
    setForm((c) => ({ ...c, elementOrder: list }))
    setReplayKey((k) => k + 1)
  }

  // Active settings based on current preview device
  const currentDeviceSettings = form.responsive[devicePreview] || form.responsive.desktop

  // Preview overlay CSS calculation
  const previewOverlayStyle = useMemo(() => {
    if (form.overlay.enabled === false) return { display: 'none' }
    const color = form.overlay.color || '#000000'
    const opacity = (form.overlay.opacity ?? 45) / 100
    const intensity = (form.overlay.gradientIntensity ?? 70) / 100
    const direction = form.overlay.gradientDirection || 'to-r'

    let bg = hexToRgba(color, opacity)
    if (direction !== 'none') {
      const edgeOpacity = Math.max(0, opacity * (1 - intensity))
      const start = hexToRgba(color, opacity)
      const end = hexToRgba(color, edgeOpacity)

      switch (direction) {
        case 'to-r':
          bg = `linear-gradient(to right, ${start} 0%, ${end} 100%)`
          break
        case 'to-l':
          bg = `linear-gradient(to left, ${start} 0%, ${end} 100%)`
          break
        case 'to-t':
          bg = `linear-gradient(to top, ${start} 0%, ${end} 100%)`
          break
        case 'to-b':
          bg = `linear-gradient(to bottom, ${start} 0%, ${end} 100%)`
          break
        case 'to-br':
          bg = `linear-gradient(to bottom right, ${start} 0%, ${end} 100%)`
          break
        case 'to-tr':
          bg = `linear-gradient(to top right, ${start} 0%, ${end} 100%)`
          break
        case 'radial':
          bg = `radial-gradient(circle at center, ${end} 0%, ${start} 100%)`
          break
        default:
          bg = hexToRgba(color, opacity)
      }
    }

    return {
      background: bg,
      backdropFilter: form.overlay.backdropBlur ? 'blur(6px)' : undefined,
      WebkitBackdropFilter: form.overlay.backdropBlur ? 'blur(6px)' : undefined,
    }
  }, [form.overlay])

  // Background image based on device preview
  const previewBgImage =
    devicePreview === 'mobile'
      ? form.mobileImage || form.image || form.websiteImage
      : form.websiteImage || form.image || form.mobileImage

  // Text shadow mapping
  const getShadow = (preset) => {
    switch (preset) {
      case 'subtle':
        return '0 1px 3px rgba(0,0,0,0.5)'
      case 'medium':
        return '0 2px 6px rgba(0,0,0,0.75), 0 1px 3px rgba(0,0,0,0.5)'
      case 'strong':
        return '0 4px 14px rgba(0,0,0,0.95), 0 2px 4px rgba(0,0,0,0.85)'
      case 'glow':
        return '0 0 12px rgba(255,255,255,0.75), 0 2px 6px rgba(0,0,0,0.9)'
      default:
        return 'none'
    }
  }

  // Animation mapping
  const getAnimName = (anim) => {
    switch (anim) {
      case 'slideUp':
        return 'dynEditorSlideUp'
      case 'slideDown':
        return 'dynEditorSlideDown'
      case 'slideLeft':
        return 'dynEditorSlideLeft'
      case 'slideRight':
        return 'dynEditorSlideRight'
      case 'fadeIn':
        return 'dynEditorFadeIn'
      default:
        return 'none'
    }
  }

  const duration = form.animations.duration ?? 0.6
  const stagger = form.animations.stagger ?? 0.15

  const hPos = currentDeviceSettings.position || form.contentPosition || 'left'
  const vPos = currentDeviceSettings.verticalAlign || form.contentVerticalAlign || 'center'

  const hAlignClass =
    hPos === 'center'
      ? 'items-center text-center mx-auto'
      : hPos === 'right'
      ? 'items-end text-right ml-auto'
      : 'items-start text-left mr-auto'

  const vAlignClass =
    vPos === 'top' ? 'justify-start pt-6' : vPos === 'bottom' ? 'justify-end pb-6' : 'justify-center'

  return (
    <div className="flex flex-col h-[calc(90vh-40px)] max-h-[850px] overflow-hidden rounded-3xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl">
      <style>{`
        @keyframes dynEditorSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dynEditorSlideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes dynEditorSlideLeft {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes dynEditorSlideRight {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes dynEditorFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              {customTitle || (form.id ? 'Edit Dynamic Banner' : 'Create Dynamic Banner')}
            </h2>
            <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
              {customSubtitle || 'Real-time responsive typography, overlays, animations & multi-device preview.'}
            </p>
          </div>
        </div>

        {/* Device preview toggles */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setDevicePreview('desktop')
                setResponsiveDeviceTab('desktop')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                devicePreview === 'desktop'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Monitor className="size-3.5" />
              <span>Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDevicePreview('tablet')
                setResponsiveDeviceTab('tablet')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                devicePreview === 'tablet'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Tablet className="size-3.5" />
              <span>Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDevicePreview('mobile')
                setResponsiveDeviceTab('mobile')
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                devicePreview === 'mobile'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Smartphone className="size-3.5" />
              <span>Mobile</span>
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReplayKey((k) => k + 1)}
            className="gap-1.5 text-xs font-bold"
            title="Replay slide animations"
          >
            <Play className="size-3.5 text-primary-600" />
            <span>Replay</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-xs font-bold text-slate-600"
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving || uploading}
            onClick={() => {
              const finalImage = form.websiteImage || form.image || form.mobileImage || form.url || ''
              const payload = {
                ...form,
                image: finalImage,
                websiteImage: form.websiteImage || finalImage,
                mobileImage: form.mobileImage || finalImage,
                url: form.url || finalImage,
                buttonLink: form.buttonLink || form.redirectLink || '',
                redirectLink: form.buttonLink || form.redirectLink || '',
              }
              onSave(payload)
            }}
            className="gap-1.5 text-xs font-extrabold"
          >
            <Check className="size-4" />
            <span>{saving ? 'Saving…' : 'Save Banner'}</span>
          </Button>
        </div>
      </div>

      {/* Main split work area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Config Tabs & Controls (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          {/* Navigation Tab Header */}
          <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-4 pt-2 gap-1 bg-slate-50/60 dark:bg-slate-900/60 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('content')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'content'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Layers className="size-3.5" />
              <span>Content & Media</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('layout')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'layout'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <MoveHorizontal className="size-3.5" />
              <span>Layout & Order</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('styling')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'styling'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Type className="size-3.5" />
              <span>Styling & Readability</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('animations')}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold border-b-2 transition-all ${
                activeTab === 'animations'
                  ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Sparkles className="size-3.5" />
              <span>Animations</span>
            </button>
          </div>

          {/* Tab Content Panel (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* TAB 1: Content & Media */}
            {activeTab === 'content' ? (
              <div className="space-y-4">
                <Field label="Section">
                  <Select
                    value={form.section}
                    onChange={(e) => setForm((c) => ({ ...c, section: e.target.value }))}
                    required
                  >
                    {BANNER_SECTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Select>
                </Field>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Banner Title (Multiline)
                    </label>
                    <span className="text-[11px] font-medium text-slate-500">
                      Shift+Enter or Enter for new line
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    value={form.title}
                    onChange={(e) => {
                      setForm((c) => ({ ...c, title: e.target.value }))
                      setReplayKey((k) => k + 1)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                      }
                    }}
                    placeholder="e.g. Professional Home Repair&#10;Services at Your Doorstep"
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y transition-all leading-relaxed whitespace-pre-wrap"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tagline / Subtitle (Multiline)
                    </label>
                    <span className="text-[11px] font-medium text-slate-500">
                      Shift+Enter or Enter for new line
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={form.tagline}
                    onChange={(e) => {
                      setForm((c) => ({ ...c, tagline: e.target.value }))
                      setReplayKey((k) => k + 1)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.stopPropagation()
                      }
                    }}
                    placeholder="e.g. Expert doorstep appliance repair&#10;with unconditional 30-day warranty"
                    className="w-full rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-y transition-all leading-relaxed whitespace-pre-wrap"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Button Text
                    </label>
                    <Input
                      value={form.buttonText}
                      onChange={(e) => {
                        setForm((c) => ({ ...c, buttonText: e.target.value }))
                        setReplayKey((k) => k + 1)
                      }}
                      placeholder="e.g. Book Service"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Button Link / URL
                    </label>
                    <Input
                      value={form.buttonLink}
                      onChange={(e) => setForm((c) => ({ ...c, buttonLink: e.target.value }))}
                      placeholder="/services or https://..."
                    />
                  </div>
                </div>

                {/* Banner Images */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Desktop / Website Image
                    </h4>
                    <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setWebsiteSourceMode('upload')}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          websiteSourceMode === 'upload' ? 'bg-white dark:bg-slate-700 text-slate-900 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setWebsiteSourceMode('url')}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          websiteSourceMode === 'url' ? 'bg-white dark:bg-slate-700 text-slate-900 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        URL
                      </button>
                    </div>
                  </div>

                  {websiteSourceMode === 'upload' ? (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-4 text-center hover:bg-slate-50/50 cursor-pointer">
                        <Upload className="size-6 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {uploading ? 'Uploading to Cloudinary…' : 'Upload Desktop Banner (PNG, JPG, GIF)'}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">Recommended: 1920×600 or 16:9 ratio</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => handleUpload(e.target.files?.[0], 'websiteImage')}
                        />
                      </label>
                      {form.websiteImage ? (
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                          <span className="truncate max-w-[280px] font-mono">{form.websiteImage}</span>
                          <button
                            type="button"
                            onClick={() => setForm((c) => ({ ...c, websiteImage: '' }))}
                            className="text-red-500 font-bold hover:underline ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <Input
                      value={form.websiteImage}
                      onChange={(e) => setForm((c) => ({ ...c, websiteImage: e.target.value, image: c.image || e.target.value }))}
                      placeholder="https://images.unsplash.com/..."
                    />
                  )}

                  {/* Mobile Image */}
                  <div className="flex items-center justify-between pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Mobile Banner Image (Optional)
                    </h4>
                    <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setMobileSourceMode('upload')}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          mobileSourceMode === 'upload' ? 'bg-white dark:bg-slate-700 text-slate-900 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        Upload
                      </button>
                      <button
                        type="button"
                        onClick={() => setMobileSourceMode('url')}
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          mobileSourceMode === 'url' ? 'bg-white dark:bg-slate-700 text-slate-900 shadow-2xs' : 'text-slate-500'
                        }`}
                      >
                        URL
                      </button>
                    </div>
                  </div>

                  {mobileSourceMode === 'upload' ? (
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-3 text-center hover:bg-slate-50/50 cursor-pointer">
                        <Upload className="size-5 text-slate-400 mb-1" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {uploading ? 'Uploading…' : 'Upload Mobile Banner'}
                        </span>
                        <span className="text-[11px] text-slate-600 font-medium">Recommended: 800×600 or 4:3 ratio</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={uploading}
                          onChange={(e) => handleUpload(e.target.files?.[0], 'mobileImage')}
                        />
                      </label>
                      {form.mobileImage ? (
                        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                          <span className="truncate max-w-[280px] font-mono">{form.mobileImage}</span>
                          <button
                            type="button"
                            onClick={() => setForm((c) => ({ ...c, mobileImage: '' }))}
                            className="text-red-500 font-bold hover:underline ml-2"
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <Input
                      value={form.mobileImage}
                      onChange={(e) => setForm((c) => ({ ...c, mobileImage: e.target.value }))}
                      placeholder="https://..."
                    />
                  )}
                </div>

                {/* Additional Settings */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Display Order
                    </label>
                    <Input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) => setForm((c) => ({ ...c, displayOrder: Number(e.target.value) }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Slide Duration (ms)
                    </label>
                    <Input
                      type="number"
                      value={form.slideDuration}
                      step={500}
                      onChange={(e) => setForm((c) => ({ ...c, slideDuration: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="bannerEnabled"
                    checked={form.enabled}
                    onChange={(e) => setForm((c) => ({ ...c, enabled: e.target.checked }))}
                    className="size-4 rounded-md text-primary-600"
                  />
                  <label htmlFor="bannerEnabled" className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Banner Active / Enabled
                  </label>
                </div>
              </div>
            ) : null}

            {/* TAB 2: Layout & Positioning */}
            {activeTab === 'layout' ? (
              <div className="space-y-5">
                {/* Horizontal Alignment */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Horizontal Content Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['left', 'center', 'right'].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          setForm((c) => ({
                            ...c,
                            contentPosition: pos,
                            responsive: {
                              ...c.responsive,
                              [devicePreview]: {
                                ...c.responsive[devicePreview],
                                position: pos,
                              },
                            },
                          }))
                          setReplayKey((k) => k + 1)
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                          (form.responsive[devicePreview]?.position || form.contentPosition) === pos
                            ? 'bg-primary-50 text-primary-700 border-primary-400 dark:bg-primary-950/60 dark:text-primary-300 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    Adjusts alignment specifically for currently selected{' '}
                    <strong className="text-slate-700 dark:text-slate-300">{devicePreview}</strong> preview.
                  </p>
                </div>

                {/* Vertical Alignment */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Vertical Content Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['top', 'center', 'bottom'].map((pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          setForm((c) => ({
                            ...c,
                            contentVerticalAlign: pos,
                            responsive: {
                              ...c.responsive,
                              [devicePreview]: {
                                ...c.responsive[devicePreview],
                                verticalAlign: pos,
                              },
                            },
                          }))
                          setReplayKey((k) => k + 1)
                        }}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                          (form.responsive[devicePreview]?.verticalAlign || form.contentVerticalAlign) === pos
                            ? 'bg-primary-50 text-primary-700 border-primary-400 dark:bg-primary-950/60 dark:text-primary-300 shadow-2xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                        }`}
                      >
                        {pos}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Element Order */}
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Element Display Order
                    </label>
                    <span className="text-[11px] text-slate-600">Reorder with arrows</span>
                  </div>
                  <div className="space-y-2">
                    {form.elementOrder.map((elem, idx) => (
                      <div
                        key={elem}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <div className="flex items-center gap-2">
                          <span className="size-5 flex items-center justify-center rounded-full bg-slate-200 dark:bg-slate-700 text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold capitalize text-slate-900 dark:text-white">
                            {elem === 'title' ? 'Banner Title' : elem === 'tagline' ? 'Tagline / Subtitle' : 'Action Button'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => moveElement(elem, 'up')}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === form.elementOrder.length - 1}
                            onClick={() => moveElement(elem, 'down')}
                            className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Spacing & Content Max Width */}
                <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Element Spacing (Gap)</span>
                      <span className="text-primary-600 font-mono">{form.styling.contentGap}px</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="36"
                      step="2"
                      value={form.styling.contentGap}
                      onChange={(e) =>
                        setForm((c) => ({
                          ...c,
                          styling: { ...c.styling, contentGap: Number(e.target.value) },
                        }))
                      }
                      className="w-full accent-primary-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Max Content Width ({devicePreview})</span>
                      <span className="text-primary-600 font-mono">
                        {form.responsive[devicePreview]?.maxWidth || form.styling.maxWidth}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="280"
                      max="1000"
                      step="20"
                      value={form.responsive[devicePreview]?.maxWidth || form.styling.maxWidth}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setForm((c) => ({
                          ...c,
                          styling: { ...c.styling, maxWidth: val },
                          responsive: {
                            ...c.responsive,
                            [devicePreview]: {
                              ...c.responsive[devicePreview],
                              maxWidth: val,
                            },
                          },
                        }))
                      }}
                      className="w-full accent-primary-600"
                    />
                  </div>
                </div>
              </div>
            ) : null}

            {/* TAB 3: Styling & Readability */}
            {activeTab === 'styling' ? (
              <div className="space-y-5">
                {/* Device Selector Sub-Tabs for Responsive Tuning */}
                <div className="flex items-center justify-between p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-extrabold uppercase px-2 text-slate-600">Editing for:</span>
                  <div className="flex gap-1">
                    {['desktop', 'tablet', 'mobile'].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => {
                          setResponsiveDeviceTab(d)
                          setDevicePreview(d)
                        }}
                        className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all ${
                          responsiveDeviceTab === d
                            ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Section A: Title Typography */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Title Typography ({responsiveDeviceTab})
                    </h4>
                    <span className="text-xs font-bold text-primary-600 font-mono">
                      {form.responsive[responsiveDeviceTab]?.titleSize || 32}px
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min="16"
                      max="56"
                      step="1"
                      value={form.responsive[responsiveDeviceTab]?.titleSize || 32}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setForm((c) => ({
                          ...c,
                          responsive: {
                            ...c.responsive,
                            [responsiveDeviceTab]: {
                              ...c.responsive[responsiveDeviceTab],
                              titleSize: val,
                            },
                          },
                        }))
                      }}
                      className="w-full accent-primary-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Weight</label>
                      <Select
                        value={form.styling.titleWeight}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, titleWeight: e.target.value },
                          }))
                        }
                      >
                        <option value="500">Medium (500)</option>
                        <option value="600">Semi-Bold (600)</option>
                        <option value="700">Bold (700)</option>
                        <option value="800">Extra Bold (800)</option>
                        <option value="900">Black (900)</option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Shadow</label>
                      <Select
                        value={form.styling.titleShadow}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, titleShadow: e.target.value },
                          }))
                        }
                      >
                        {SHADOW_PRESETS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  {/* Title Color & Outline */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Color:</span>
                      <input
                        type="color"
                        value={form.styling.titleColor}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, titleColor: e.target.value },
                          }))
                        }
                        className="size-7 rounded-lg border border-slate-300 cursor-pointer"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.styling.titleOutline}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, titleOutline: e.target.checked },
                          }))
                        }
                        className="size-3.5 rounded text-primary-600"
                      />
                      <span>Text Outline Stroke</span>
                    </label>
                  </div>
                </div>

                {/* Section B: Tagline Typography */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                      Tagline Typography ({responsiveDeviceTab})
                    </h4>
                    <span className="text-xs font-bold text-primary-600 font-mono">
                      {form.responsive[responsiveDeviceTab]?.taglineSize || 16}px
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <input
                      type="range"
                      min="11"
                      max="32"
                      step="1"
                      value={form.responsive[responsiveDeviceTab]?.taglineSize || 16}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setForm((c) => ({
                          ...c,
                          responsive: {
                            ...c.responsive,
                            [responsiveDeviceTab]: {
                              ...c.responsive[responsiveDeviceTab],
                              taglineSize: val,
                            },
                          },
                        }))
                      }}
                      className="w-full accent-primary-600"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Weight</label>
                      <Select
                        value={form.styling.taglineWeight}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, taglineWeight: e.target.value },
                          }))
                        }
                      >
                        <option value="400">Regular (400)</option>
                        <option value="500">Medium (500)</option>
                        <option value="600">Semi-Bold (600)</option>
                        <option value="700">Bold (700)</option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Shadow</label>
                      <Select
                        value={form.styling.taglineShadow}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, taglineShadow: e.target.value },
                          }))
                        }
                      >
                        {SHADOW_PRESETS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Color:</span>
                      <input
                        type="color"
                        value={form.styling.taglineColor}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, taglineColor: e.target.value },
                          }))
                        }
                        className="size-7 rounded-lg border border-slate-300 cursor-pointer"
                      />
                    </div>
                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.styling.taglineOutline}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, taglineOutline: e.target.checked },
                          }))
                        }
                        className="size-3.5 rounded text-primary-600"
                      />
                      <span>Text Outline Stroke</span>
                    </label>
                  </div>
                </div>

                {/* Section C: Overlay & Background Readability */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="overlayToggle"
                        checked={form.overlay.enabled}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            overlay: { ...c.overlay, enabled: e.target.checked },
                          }))
                        }
                        className="size-4 rounded text-primary-600"
                      />
                      <label htmlFor="overlayToggle" className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                        Image Background Overlay
                      </label>
                    </div>
                    <span className="text-xs font-bold text-primary-600 font-mono">
                      {form.overlay.opacity}% Opacity
                    </span>
                  </div>

                  {form.overlay.enabled ? (
                    <div className="space-y-3 pt-1">
                      <div className="space-y-1">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={form.overlay.opacity}
                          onChange={(e) =>
                            setForm((c) => ({
                              ...c,
                              overlay: { ...c.overlay, opacity: Number(e.target.value) },
                            }))
                          }
                          className="w-full accent-primary-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Gradient Direction</label>
                          <Select
                            value={form.overlay.gradientDirection}
                            onChange={(e) =>
                              setForm((c) => ({
                                ...c,
                                overlay: { ...c.overlay, gradientDirection: e.target.value },
                              }))
                            }
                          >
                            <option value="none">Solid (No gradient)</option>
                            <option value="to-r">Left to Right</option>
                            <option value="to-l">Right to Left</option>
                            <option value="to-b">Top to Bottom</option>
                            <option value="to-t">Bottom to Top</option>
                            <option value="to-br">Top-Left to Bottom-Right</option>
                            <option value="radial">Radial Spotlight</option>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-600">Gradient Intensity</label>
                          <input
                            type="range"
                            min="20"
                            max="100"
                            step="5"
                            value={form.overlay.gradientIntensity ?? 70}
                            onChange={(e) =>
                              setForm((c) => ({
                                ...c,
                                overlay: { ...c.overlay, gradientIntensity: Number(e.target.value) },
                              }))
                            }
                            className="w-full accent-primary-600"
                          />
                        </div>
                      </div>

                      {/* Swatches and Blur */}
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5">
                          {OVERLAY_COLORS.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() =>
                                setForm((f) => ({
                                  ...f,
                                  overlay: { ...f.overlay, color: c },
                                }))
                              }
                              className={`size-5 rounded-full border ${
                                form.overlay.color === c ? 'ring-2 ring-primary-500 scale-110' : 'border-slate-300'
                              }`}
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.overlay.backdropBlur}
                            onChange={(e) =>
                              setForm((c) => ({
                                ...c,
                                overlay: { ...c.overlay, backdropBlur: e.target.checked },
                              }))
                            }
                            className="size-3.5 rounded text-primary-600"
                          />
                          <span>Backdrop Blur</span>
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Section D: Button Styling */}
                <div className="space-y-3 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                    Action Button Styling
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Button Corner Radius</label>
                      <Select
                        value={form.styling.buttonRadius}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, buttonRadius: e.target.value },
                          }))
                        }
                      >
                        <option value="rounded-md">Rounded (MD)</option>
                        <option value="rounded-xl">Rounded (XL)</option>
                        <option value="rounded-2xl">Rounded (2XL)</option>
                        <option value="rounded-full">Pill / Stadium</option>
                      </Select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-600">Button Size ({responsiveDeviceTab})</label>
                      <Select
                        value={form.responsive[responsiveDeviceTab]?.buttonSize || 'md'}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            responsive: {
                              ...c.responsive,
                              [responsiveDeviceTab]: {
                                ...c.responsive[responsiveDeviceTab],
                                buttonSize: e.target.value,
                              },
                            },
                          }))
                        }
                      >
                        <option value="sm">Small (Compact)</option>
                        <option value="md">Medium (Standard)</option>
                        <option value="lg">Large (Prominent)</option>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Background:</span>
                      <input
                        type="color"
                        value={form.styling.buttonBgColor}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, buttonBgColor: e.target.value },
                          }))
                        }
                        className="size-7 rounded-lg border border-slate-300 cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-600">Text Color:</span>
                      <input
                        type="color"
                        value={form.styling.buttonTextColor}
                        onChange={(e) =>
                          setForm((c) => ({
                            ...c,
                            styling: { ...c.styling, buttonTextColor: e.target.value },
                          }))
                        }
                        className="size-7 rounded-lg border border-slate-300 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* TAB 4: Animations */}
            {activeTab === 'animations' ? (
              <div className="space-y-4">
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200 dark:border-amber-900 text-xs font-medium text-amber-800 dark:text-amber-300">
                  Animations play when the banner slide appears. Click <strong>"Replay"</strong> in the top header to preview.
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Title Animation
                    </label>
                    <Select
                      value={form.animations.title}
                      onChange={(e) => {
                        setForm((c) => ({
                          ...c,
                          animations: { ...c.animations, title: e.target.value },
                        }))
                        setReplayKey((k) => k + 1)
                      }}
                    >
                      {ANIMATION_OPTIONS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Tagline Animation
                    </label>
                    <Select
                      value={form.animations.tagline}
                      onChange={(e) => {
                        setForm((c) => ({
                          ...c,
                          animations: { ...c.animations, tagline: e.target.value },
                        }))
                        setReplayKey((k) => k + 1)
                      }}
                    >
                      {ANIMATION_OPTIONS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Button Animation
                    </label>
                    <Select
                      value={form.animations.button}
                      onChange={(e) => {
                        setForm((c) => ({
                          ...c,
                          animations: { ...c.animations, button: e.target.value },
                        }))
                        setReplayKey((k) => k + 1)
                      }}
                    >
                      {ANIMATION_OPTIONS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.label}
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Animation Duration</span>
                      <span className="text-primary-600 font-mono">{form.animations.duration}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="2.0"
                      step="0.1"
                      value={form.animations.duration}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setForm((c) => ({
                          ...c,
                          animations: { ...c.animations, duration: val },
                        }))
                        setReplayKey((k) => k + 1)
                      }}
                      className="w-full accent-primary-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                      <span>Stagger Delay</span>
                      <span className="text-primary-600 font-mono">{form.animations.stagger}s</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.05"
                      value={form.animations.stagger}
                      onChange={(e) => {
                        const val = Number(e.target.value)
                        setForm((c) => ({
                          ...c,
                          animations: { ...c.animations, stagger: val },
                        }))
                        setReplayKey((k) => k + 1)
                      }}
                      className="w-full accent-primary-600"
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Right Column: Dynamic Live Preview Frame (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col bg-slate-100 dark:bg-slate-950 p-6 overflow-hidden">
          <div className="flex items-center justify-between pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Live Interactive Preview ({devicePreview.toUpperCase()})
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-600">
              {devicePreview === 'desktop' ? '1920×600 (Desktop Scale)' : devicePreview === 'tablet' ? '768×480 (Tablet Scale)' : '375×480 (Mobile Scale)'}
            </span>
          </div>

          {/* Interactive Screen Simulation Container */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-2">
            <div
              key={replayKey}
              className={`relative overflow-hidden transition-all duration-300 shadow-2xl ${
                devicePreview === 'desktop'
                  ? 'w-full aspect-[16/7] max-h-[380px] rounded-3xl border border-slate-300/80 dark:border-slate-800'
                  : devicePreview === 'tablet'
                  ? 'w-[480px] h-[360px] rounded-3xl border-4 border-slate-800'
                  : 'w-[320px] h-[480px] rounded-[36px] border-[6px] border-slate-900 shadow-2xl'
              }`}
            >
              {/* Background Image */}
              {previewBgImage ? (
                <img
                  src={previewBgImage}
                  alt={form.title || 'Banner'}
                  className="absolute inset-0 size-full object-cover transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#0A0F1C] flex items-center justify-center text-slate-400 text-xs font-medium">
                  Upload an image in the Content tab
                </div>
              )}

              {/* Overlay Layer */}
              {form.overlay.enabled !== false ? (
                <div
                  className="absolute inset-0 pointer-events-none transition-all duration-300"
                  style={previewOverlayStyle}
                />
              ) : null}

              {/* Overlay Content */}
              <div
                className={`relative z-10 size-full flex flex-col p-6 sm:p-8 ${vAlignClass}`}
              >
                <div
                  className={`flex flex-col ${hAlignClass} transition-all duration-300`}
                  style={{
                    gap: `${form.styling.contentGap ?? 12}px`,
                    maxWidth: `${currentDeviceSettings.maxWidth || 650}px`,
                    width: '100%',
                  }}
                >
                  {form.elementOrder.map((elem, idx) => {
                    const delay = `${idx * stagger}s`
                    const animType = form.animations[elem] || 'none'
                    const animName = getAnimName(animType)
                    const animStyle =
                      animName !== 'none'
                        ? {
                            animationName: animName,
                            animationDuration: `${duration}s`,
                            animationDelay: delay,
                            animationFillMode: 'both',
                            animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
                          }
                        : {}

                    if (elem === 'title' && form.title) {
                      return (
                        <h2
                          key={`preview-title-${idx}`}
                          className="font-black tracking-tight leading-tight transition-all duration-300 whitespace-pre-line break-words"
                          style={{
                            color: form.styling.titleColor || '#FFFFFF',
                            fontWeight: form.styling.titleWeight || '800',
                            textShadow: getShadow(form.styling.titleShadow),
                            fontSize: `${currentDeviceSettings.titleSize || 28}px`,
                            WebkitTextStroke: form.styling.titleOutline ? '1px rgba(0,0,0,0.85)' : undefined,
                            paintOrder: form.styling.titleOutline ? 'stroke fill' : undefined,
                            ...animStyle,
                          }}
                        >
                          {form.title}
                        </h2>
                      )
                    }

                    if (elem === 'tagline' && form.tagline) {
                      return (
                        <p
                          key={`preview-tagline-${idx}`}
                          className="font-medium transition-all duration-300 whitespace-pre-line break-words"
                          style={{
                            color: form.styling.taglineColor || '#F3F4F6',
                            fontWeight: form.styling.taglineWeight || '500',
                            textShadow: getShadow(form.styling.taglineShadow),
                            fontSize: `${currentDeviceSettings.taglineSize || 15}px`,
                            WebkitTextStroke: form.styling.taglineOutline ? '0.5px rgba(0,0,0,0.8)' : undefined,
                            paintOrder: form.styling.taglineOutline ? 'stroke fill' : undefined,
                            ...animStyle,
                          }}
                        >
                          {form.tagline}
                        </p>
                      )
                    }

                    if (elem === 'button' && (form.buttonText || form.buttonLink)) {
                      const btnSize = currentDeviceSettings.buttonSize || 'md'
                      const isSm = btnSize === 'sm'
                      const isLg = btnSize === 'lg'
                      const radius = form.styling.buttonRadius || 'rounded-xl'

                      return (
                        <div key={`preview-btn-${idx}`} style={animStyle} className="pt-1">
                          <span
                            className={`inline-flex items-center gap-1.5 font-bold shadow-md cursor-pointer transition-transform active:scale-95 ${radius} ${
                              isSm ? 'px-3 py-1.5 text-xs' : isLg ? 'px-6 py-2.5 text-base' : 'px-4 py-2 text-xs sm:text-sm'
                            }`}
                            style={{
                              backgroundColor: form.styling.buttonBgColor || '#C86A37',
                              color: form.styling.buttonTextColor || '#FFFFFF',
                            }}
                          >
                            <span>{form.buttonText || 'Explore Now'}</span>
                            <span className="text-xs">→</span>
                          </span>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
