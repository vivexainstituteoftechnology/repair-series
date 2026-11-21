/**
 * Home layout CMS — keep field names in sync with user app + website clients.
 *
 * Platform visibility fields on each section:
 * - showOnApp          → native mobile app
 * - showOnWebsite      → legacy / master website flag (fallback when web-surface
 *                        flags below are undefined)
 * - showOnMobileWeb    → phone-width website home (MobileAppHome)
 * - showOnDesktopWeb   → desktop marketing homepage
 *
 * Clients fall back to showOnWebsite when showOnMobileWeb / showOnDesktopWeb
 * are omitted (backward compatible with older documents).
 */

/** Each home layout belongs to one service type. Empty id is legacy/unassigned only. */
export const HOME_SECTION_GLOBAL_TYPE_ID = ''

export const HOME_SECTION_LAYOUTS = [
  { value: 'slider', label: 'Horizontal Slider' },
  { value: 'autoSlider', label: 'Auto Slider' },
  { value: 'grid', label: 'Grid' },
  { value: 'grid2', label: '2 Column Grid' },
  { value: 'list', label: 'List' },
  { value: 'single', label: 'Single Banner' },
  { value: 'fullWidth', label: 'Full Width (Edge-to-Edge)' },
  { value: 'static', label: 'Custom / Static' },
]

const LAYOUT_ALIASES = {
  horizontal: 'slider',
  carousel: 'autoSlider',
  slideshow: 'autoSlider',
  two_column: 'grid2',
  '2col': 'grid2',
  full_width: 'fullWidth',
  fullWidth: 'fullWidth',
  edgeToEdge: 'fullWidth',
  fullwidth: 'fullWidth',
}

export const HOME_SECTION_CONTENT_TYPES = [
  { value: 'serviceTypes', label: 'Service Types' },
  { value: 'search', label: 'Search' },
  { value: 'banners', label: 'Banner / Slideshow' },
  { value: 'fullWidthBanner', label: 'Full Width Container (Image / Slideshow)' },
  { value: 'categories', label: 'Categories' },
  { value: 'serviceCategories', label: 'Service Categories' },
  { value: 'services', label: 'Services' },
  { value: 'variations', label: 'Variations' },
  { value: 'marketplace', label: 'Marketplace Section' },
  { value: 'static', label: 'Custom Content' },
]

const CONTENT_TYPE_ALIASES = {
  type: 'serviceTypes',
  banner: 'banners',
  slideshow: 'banners',
  custom: 'static',
  customContent: 'static',
  fullWidthBanner: 'fullWidthBanner',
  fullWidthContainer: 'fullWidthBanner',
  fullWidthImage: 'fullWidthBanner',
  fullWidth: 'fullWidthBanner',
  full_width_banner: 'fullWidthBanner',
  full_width_container: 'fullWidthBanner',
  full_width: 'fullWidthBanner',
}

export const HOME_SECTION_SELECTION_MODES = [
  { value: 'manual', label: 'Manual pick (selected IDs)' },
  { value: 'all', label: 'All matching active items' },
  { value: 'featured', label: 'Featured services' },
  { value: 'coming_soon', label: 'Coming soon (all)' },
  { value: 'coming_soon_main', label: 'Coming soon — Main' },
  { value: 'coming_soon_commercial', label: 'Coming soon — Commercial' },
]

export const BANNER_CLICK_ACTIONS = [
  { value: 'none', label: 'No action' },
  { value: 'serviceType', label: 'Service Type' },
  { value: 'category', label: 'Category' },
  { value: 'serviceCategory', label: 'Service Category' },
  { value: 'service', label: 'Service details' },
  { value: 'book', label: 'Booking flow (service)' },
  { value: 'search', label: 'Search results' },
  { value: 'services', label: 'Services tab' },
  { value: 'cart', label: 'Cart' },
  { value: 'bookings', label: 'Bookings tab' },
  { value: 'external', label: 'External URL' },
]

export function newHomeSectionBannerSlide(partial = {}) {
  const id =
    String(partial.id || '').trim() ||
    `banner_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  const url = String(partial.url || partial.image || partial.websiteImage || partial.mobileImage || '').trim()
  return {
    ...partial,
    id,
    source: partial.source === 'url' ? 'url' : 'upload',
    url,
    image: url,
    websiteImage: partial.websiteImage || url,
    mobileImage: partial.mobileImage || url,
    displayOrder: Number(partial.displayOrder) || 0,
    clickAction: String(partial.clickAction || 'none'),
    serviceTypeId: String(partial.serviceTypeId || '').trim(),
    categoryId: String(partial.categoryId || '').trim(),
    serviceCategoryId: String(partial.serviceCategoryId || '').trim(),
    serviceId: String(partial.serviceId || '').trim(),
    redirectLink: String(partial.redirectLink || partial.buttonLink || '').trim(),
    title: String(partial.title || ''),
    tagline: String(partial.tagline || ''),
    buttonText: String(partial.buttonText || ''),
    buttonLink: String(partial.buttonLink || partial.redirectLink || ''),
    contentPosition: partial.contentPosition || 'left',
    contentVerticalAlign: partial.contentVerticalAlign || 'center',
    elementOrder: Array.isArray(partial.elementOrder) && partial.elementOrder.length > 0
      ? partial.elementOrder
      : ['title', 'tagline', 'button'],
    animations: partial.animations || {
      title: 'slideUp',
      tagline: 'slideUp',
      button: 'fadeIn',
      duration: 0.6,
      stagger: 0.15,
    },
    overlay: partial.overlay || {
      enabled: true,
      color: '#000000',
      opacity: 45,
      gradientDirection: 'to-r',
      gradientIntensity: 70,
      backdropBlur: false,
    },
    styling: partial.styling || {
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
    responsive: partial.responsive || {
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
  }
}

/** Ordered slides with URL only; re-indexes displayOrder. */
export function normalizeSectionBackgroundColor(raw) {
  const v = String(raw ?? '').trim()
  if (!v || v.toLowerCase() === 'none' || v.toLowerCase() === 'transparent') return ''
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v)) return v
  return ''
}

export function normalizeSectionBottomSpacing(raw) {
  if (raw === undefined || raw === null || raw === '') return 24
  const n = Number(raw)
  if (!Number.isFinite(n)) return 24
  return Math.min(100, Math.max(0, Math.round(n)))
}

export function normalizeMarketplaceItems(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map((item, idx) => ({
    id: String(item.id || `mkt_${Date.now()}_${idx}`),
    itemType: String(item.itemType || 'service'),
    targetId: String(item.targetId || ''),
    title: String(item.title || ''),
    image: String(item.image || ''),
    visible: item.visible !== false,
    displayOrder: Number(item.displayOrder) || idx + 1,
    badge: String(item.badge || ''),
    styling: typeof item.styling === 'object' && item.styling ? item.styling : {},
  }))
}

export function normalizeHomeSectionBannerImages(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .map((row, i) => newHomeSectionBannerSlide({ ...row, displayOrder: row.displayOrder ?? i + 1 }))
    .filter((row) => row.url || row.image || row.websiteImage || row.mobileImage)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
    .map((row, i) => ({ ...row, displayOrder: i + 1 }))
}

export function normalizeHomeLayout(raw) {
  const key = String(raw || 'grid').trim()
  const mapped = LAYOUT_ALIASES[key] || key
  return HOME_SECTION_LAYOUTS.some((x) => x.value === mapped) ? mapped : 'grid'
}

export function normalizeHomeContentType(raw, layout) {
  let key = String(raw || '').trim()
  if (!key && layout === 'static') return 'static'
  key = CONTENT_TYPE_ALIASES[key] || key
  if (layout === 'static') key = 'static'
  return HOME_SECTION_CONTENT_TYPES.some((x) => x.value === key) ? key : 'categories'
}

export const HOME_SECTION_LAYOUT_LABELS = Object.fromEntries(
  HOME_SECTION_LAYOUTS.map((x) => [x.value, x.label]),
)

export const HOME_SECTION_CONTENT_LABELS = Object.fromEntries(
  HOME_SECTION_CONTENT_TYPES.map((x) => [x.value, x.label]),
)

function platformFlags(input) {
  return {
    enabled: input.enabled !== false && input.visible !== false,
    showOnApp: input.showOnApp !== false,
    showOnWebsite: input.showOnWebsite !== false,
    showOnMobileWeb:
      input.showOnMobileWeb !== undefined
        ? input.showOnMobileWeb !== false
        : input.showOnWebsite !== false,
    showOnDesktopWeb:
      input.showOnDesktopWeb !== undefined
        ? input.showOnDesktopWeb !== false
        : input.showOnWebsite !== false,
  }
}

function baseSection(partial) {
  return {
    subtitle: '',
    itemIds: [],
    columns: 4,
    rows: 2,
    maxItems: 8,
    showViewAll: false,
    viewAllPath: '',
    staticBody: '',
    staticImage: '',
    staticCtaLabel: '',
    staticCtaLink: '',
    categoryId: '',
    serviceCategoryId: '',
    settings: { height: 220, autoplay: false, slideDuration: 3000 },
    ...platformFlags({}),
    ...partial,
  }
}

export function emptyHomeSectionForm(serviceTypeId = '') {
  return {
    id: '',
    title: '',
    subtitle: '',
    layout: 'grid',
    contentType: 'categories',
    selectionMode: 'all',
    itemIds: [],
    columns: 4,
    rows: 2,
    maxItems: 8,
    enabled: true,
    showOnApp: true,
    showOnWebsite: true,
    showOnMobileWeb: true,
    showOnDesktopWeb: true,
    displayOrder: 0,
    showViewAll: false,
    viewAllPath: '',
    staticBody: '',
    staticImage: '',
    staticCtaLabel: '',
    staticCtaLink: '',
    serviceTypeId: String(serviceTypeId || ''),
    sourceServiceTypeId: '',
    categoryId: '',
    serviceCategoryId: '',
    images: [],
    items: [],
    settings: {
      height: 220,
      imageWidth: 'fit',
      imageFit: 'fit',
      autoplay: true,
      slideDuration: 3000,
      manualSwipe: true,
      stickyOnScroll: false,
      enableAsFilter: false,
      backgroundColor: '',
      bottomSpacing: 24,
    },
  }
}

export function normalizeHomeSectionPayload(input) {
  const title = String(input.title || '').trim()
  if (!title) throw new Error('Section title is required.')

  const layout = normalizeHomeLayout(input.layout)
  let contentType = normalizeHomeContentType(input.contentType || input.type, layout)

  const isBannerType = contentType === 'banners' || contentType === 'fullWidthBanner'

  let selectionMode = String(input.selectionMode || input.contentSource || 'all').trim()
  if (selectionMode === 'selected') selectionMode = 'manual'
  if (contentType === 'static' || contentType === 'search' || isBannerType) {
    selectionMode = selectionMode === 'manual' ? 'manual' : 'all'
  }
  if (
    (contentType === 'categories' ||
      contentType === 'serviceTypes' ||
      contentType === 'serviceCategories' ||
      contentType === 'variations') &&
    (selectionMode.startsWith('coming_soon') || selectionMode === 'featured')
  ) {
    selectionMode = 'all'
  }
  if (!HOME_SECTION_SELECTION_MODES.some((x) => x.value === selectionMode)) {
    throw new Error('Invalid selection mode.')
  }

  const itemIds = Array.isArray(input.itemIds)
    ? [...new Set(input.itemIds.map((id) => String(id || '').trim()).filter(Boolean))]
    : []

  const needsManualItems = !['static', 'search', 'banners', 'fullWidthBanner', 'marketplace'].includes(contentType)
  if (needsManualItems && selectionMode === 'manual' && itemIds.length === 0) {
    throw new Error('Select at least one item for manual sections.')
  }

  const columns =
    layout === 'grid2' ? 2 : Math.min(4, Math.max(1, Number(input.columns) || 1))
  const rows = Math.max(0, Number(input.rows) || 0)
  const maxItems = Math.max(0, Number(input.maxItems) || 0)
  const displayOrder = Number.isFinite(Number(input.displayOrder))
    ? Number(input.displayOrder)
    : 0

  const settingsIn = input.settings && typeof input.settings === 'object' ? input.settings : {}
  const height = Number(settingsIn.height ?? input.height)
  const slideDuration = Number(settingsIn.slideDuration ?? input.slideDuration)
  const autoplay = settingsIn.autoplay !== false
  const manualSwipe = settingsIn.manualSwipe !== false
  const slideDurationMs = Number.isFinite(slideDuration) && slideDuration > 0 ? slideDuration : 3000
  const clampedSlideDuration = Math.min(10000, Math.max(1000, slideDurationMs))

  const images =
    isBannerType ? normalizeHomeSectionBannerImages(input.images) : undefined

  return {
    title,
    subtitle: String(input.subtitle || '').trim(),
    layout,
    contentType,
    type: contentType,
    selectionMode,
    contentSource: selectionMode === 'manual' ? 'selected' : selectionMode,
    itemIds: selectionMode === 'manual' ? itemIds : [],
    columns,
    rows,
    maxItems,
    ...platformFlags(input),
    visible: input.enabled !== false && input.visible !== false,
    displayOrder,
    showViewAll: Boolean(input.showViewAll),
    viewAllPath: String(input.viewAllPath || '').trim(),
    staticBody: String(input.staticBody || '').trim(),
    staticImage: String(input.staticImage || '').trim(),
    staticCtaLabel: String(input.staticCtaLabel || '').trim(),
    staticCtaLink: String(input.staticCtaLink || '').trim(),
    serviceTypeId: String(input.serviceTypeId || '').trim(),
    sourceServiceTypeId: String(input.sourceServiceTypeId || '').trim(),
    categoryId: String(input.categoryId || '').trim(),
    serviceCategoryId: String(input.serviceCategoryId || '').trim(),
    ...(isBannerType ? { images } : {}),
    ...(contentType === 'marketplace' ? { items: normalizeMarketplaceItems(input.items) } : {}),
    settings: {
      height: Number.isFinite(height) && height > 0 ? (height <= 188 ? 220 : height) : 220,
      imageWidth: String(settingsIn.imageWidth || (contentType === 'fullWidthBanner' ? 'fit' : 'full')).trim(),
      imageFit: String(settingsIn.imageFit || (contentType === 'fullWidthBanner' ? 'fit' : 'cover')).trim(),
      autoplay,
      slideDuration: clampedSlideDuration,
      manualSwipe,
      stickyOnScroll: settingsIn.stickyOnScroll === true || settingsIn.sticky === true,
      enableAsFilter:
        contentType === 'categories' ? settingsIn.enableAsFilter === true : false,
      backgroundColor: normalizeSectionBackgroundColor(settingsIn.backgroundColor),
      bottomSpacing: normalizeSectionBottomSpacing(settingsIn.bottomSpacing),
    },
  }
}
