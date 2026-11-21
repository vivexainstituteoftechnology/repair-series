/** Shared catalog helpers for the 5-level service hierarchy. */

export const CATALOG_STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
}

export function slugify(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function catalogTitle(row) {
  return String(row?.title ?? row?.name ?? '').trim()
}

export function catalogImage(row) {
  return String(
    row?.image ?? row?.imageUrl ?? row?.icon ?? row?.homeImage ?? row?.detailImage ?? '',
  ).trim()
}

export function normalizeCatalogStatus(raw) {
  const s = String(raw ?? '').trim().toLowerCase()
  if (s === 'inactive' || s === 'disabled' || s === 'deleted') return CATALOG_STATUS.INACTIVE
  return CATALOG_STATUS.ACTIVE
}

export function isCatalogActive(row) {
  if (!row || typeof row !== 'object') return false
  if (row.active === false || row.isActive === false) return false
  const s = String(row.status ?? '').trim().toLowerCase()
  if (s === 'inactive' || s === 'disabled' || s === 'deleted') return false
  return true
}

export function displayOrderOf(row) {
  const n = Number(row?.displayOrder ?? row?.order ?? 0)
  return Number.isFinite(n) ? n : 0
}

export function sortByDisplayOrder(list) {
  return [...(Array.isArray(list) ? list : [])].sort((a, b) => {
    const oa = displayOrderOf(a)
    const ob = displayOrderOf(b)
    if (oa !== ob) return oa - ob
    return catalogTitle(a).localeCompare(catalogTitle(b))
  })
}

export function catalogEntityFields({
  title,
  image = '',
  imageSource = 'upload',
  status = CATALOG_STATUS.ACTIVE,
  displayOrder = 0,
} = {}) {
  const name = String(title || '').trim()
  const img = String(image || '').trim()
  const order = Number(displayOrder)
  const safeOrder = Number.isFinite(order) ? order : 0
  const normalizedStatus = normalizeCatalogStatus(status)
  const source = String(imageSource || '').trim().toLowerCase() === 'url' ? 'url' : 'upload'
  return {
    title: name,
    name,
    image: img,
    imageUrl: img,
    icon: img,
    imageSource: source,
    status: normalizedStatus,
    displayOrder: safeOrder,
    order: safeOrder,
    active: normalizedStatus === CATALOG_STATUS.ACTIVE,
    slug: slugify(name),
  }
}

export function bookableUnitPrice(service, variation = null) {
  if (service?.hasVariations) {
    const p = Number(variation?.price)
    if (!Number.isFinite(p) || p < 0) return null
    return p
  }
  const p = Number(service?.price)
  if (!Number.isFinite(p) || p < 0) return null
  return p
}

export const DEFAULT_SERVICE_TYPE_ID = 'home_appliance'
export const DEFAULT_SERVICE_TYPE_TITLE = 'Home Appliance'
export const DEFAULT_SERVICE_CATEGORY_TITLE = 'General'

export const CATALOG_KINDS = {
  SERVICE_TYPE: 'serviceType',
  CATEGORY: 'category',
  SERVICE_CATEGORY: 'serviceCategory',
  SERVICE: 'service',
  VARIATION: 'variation',
}

export const CATALOG_KIND_META = {
  serviceType: {
    collection: 'serviceTypes',
    label: 'Service Type',
    parentKind: null,
    parentIdField: null,
  },
  category: {
    collection: 'categories',
    label: 'Category',
    parentKind: 'serviceType',
    parentIdField: 'serviceTypeId',
  },
  serviceCategory: {
    collection: 'serviceCategories',
    label: 'Service Category',
    parentKind: 'category',
    parentIdField: 'categoryId',
  },
  service: {
    collection: 'services',
    label: 'Service',
    parentKind: 'serviceCategory',
    parentIdField: 'serviceCategoryId',
  },
  variation: {
    collection: 'variations',
    label: 'Variation',
    parentKind: 'service',
    parentIdField: 'serviceId',
  },
}

function indexById(rows) {
  return Object.fromEntries((Array.isArray(rows) ? rows : []).map((row) => [row.id, row]))
}

export function findCatalogNode(catalog, kind, id) {
  const want = String(id || '').trim()
  if (!want) return null
  if (kind === CATALOG_KINDS.SERVICE_TYPE) {
    return (catalog.serviceTypes || []).find((row) => row.id === want) || null
  }
  if (kind === CATALOG_KINDS.CATEGORY) {
    return (catalog.categories || []).find((row) => row.id === want) || null
  }
  if (kind === CATALOG_KINDS.SERVICE_CATEGORY) {
    return (catalog.serviceCategories || []).find((row) => row.id === want) || null
  }
  if (kind === CATALOG_KINDS.SERVICE) {
    return (catalog.services || []).find((row) => row.id === want) || null
  }
  if (kind === CATALOG_KINDS.VARIATION) {
    const fromCol = (catalog.variations || []).find((row) => row.id === want)
    if (fromCol) return fromCol
    for (const service of catalog.services || []) {
      const embedded = (Array.isArray(service.variations) ? service.variations : []).find(
        (row) => String(row?.id) === want,
      )
      if (embedded) return { ...embedded, id: want, serviceId: service.id }
    }
  }
  return null
}

export function catalogAncestry(catalog, kind, id) {
  const types = indexById(catalog.serviceTypes)
  const cats = indexById(catalog.categories)
  const issues = indexById(catalog.serviceCategories)
  const svcs = indexById(catalog.services)
  const node = findCatalogNode(catalog, kind, id)
  if (!node) return []

  const push = (k, row) => {
    if (!row) return null
    return { kind: k, id: row.id, title: catalogTitle(row) }
  }

  if (kind === CATALOG_KINDS.SERVICE_TYPE) return [push(kind, node)].filter(Boolean)

  if (kind === CATALOG_KINDS.CATEGORY) {
    return [push(CATALOG_KINDS.SERVICE_TYPE, types[node.serviceTypeId]), push(kind, node)].filter(Boolean)
  }

  if (kind === CATALOG_KINDS.SERVICE_CATEGORY) {
    const category = cats[node.categoryId]
    const type = types[node.serviceTypeId || category?.serviceTypeId]
    return [
      push(CATALOG_KINDS.SERVICE_TYPE, type),
      push(CATALOG_KINDS.CATEGORY, category),
      push(kind, node),
    ].filter(Boolean)
  }

  if (kind === CATALOG_KINDS.SERVICE) {
    const issue = issues[node.serviceCategoryId]
    const category = cats[node.categoryId || issue?.categoryId]
    const type = types[node.serviceTypeId || issue?.serviceTypeId || category?.serviceTypeId]
    return [
      push(CATALOG_KINDS.SERVICE_TYPE, type),
      push(CATALOG_KINDS.CATEGORY, category),
      push(CATALOG_KINDS.SERVICE_CATEGORY, issue),
      push(kind, node),
    ].filter(Boolean)
  }

  const service = svcs[node.serviceId] || (catalog.services || []).find((row) =>
    (row.variations || []).some((v) => String(v.id) === String(node.id)),
  )
  const issue = issues[service?.serviceCategoryId]
  const category = cats[service?.categoryId || issue?.categoryId]
  const type = types[service?.serviceTypeId || issue?.serviceTypeId || category?.serviceTypeId]
  return [
    push(CATALOG_KINDS.SERVICE_TYPE, type),
    push(CATALOG_KINDS.CATEGORY, category),
    push(CATALOG_KINDS.SERVICE_CATEGORY, issue),
    push(CATALOG_KINDS.SERVICE, service),
    push(kind, node),
  ].filter(Boolean)
}

export function catalogPathLabel(steps) {
  return (Array.isArray(steps) ? steps : [])
    .map((step) => step.title)
    .filter(Boolean)
    .join(' → ')
}

export function currentParentId(kind, node) {
  if (!node) return ''
  if (kind === CATALOG_KINDS.CATEGORY) return String(node.serviceTypeId || '').trim()
  if (kind === CATALOG_KINDS.SERVICE_CATEGORY) return String(node.categoryId || '').trim()
  if (kind === CATALOG_KINDS.SERVICE) return String(node.serviceCategoryId || '').trim()
  if (kind === CATALOG_KINDS.VARIATION) return String(node.serviceId || '').trim()
  return ''
}

export function pathLabelAfterMove(catalog, kind, item, parentId) {
  const title = catalogTitle(item)
  if (kind === CATALOG_KINDS.SERVICE_TYPE) return title
  if (kind === CATALOG_KINDS.CATEGORY) {
    const type = findCatalogNode(catalog, CATALOG_KINDS.SERVICE_TYPE, parentId)
    return catalogPathLabel([{ title: catalogTitle(type) }, { title }])
  }
  if (kind === CATALOG_KINDS.SERVICE_CATEGORY) {
    const category = findCatalogNode(catalog, CATALOG_KINDS.CATEGORY, parentId)
    const type = findCatalogNode(catalog, CATALOG_KINDS.SERVICE_TYPE, category?.serviceTypeId)
    return catalogPathLabel([{ title: catalogTitle(type) }, { title: catalogTitle(category) }, { title }])
  }
  if (kind === CATALOG_KINDS.SERVICE) {
    const issue = findCatalogNode(catalog, CATALOG_KINDS.SERVICE_CATEGORY, parentId)
    const category = findCatalogNode(catalog, CATALOG_KINDS.CATEGORY, issue?.categoryId)
    const type = findCatalogNode(catalog, CATALOG_KINDS.SERVICE_TYPE, issue?.serviceTypeId || category?.serviceTypeId)
    return catalogPathLabel([
      { title: catalogTitle(type) },
      { title: catalogTitle(category) },
      { title: catalogTitle(issue) },
      { title },
    ])
  }
  const service = findCatalogNode(catalog, CATALOG_KINDS.SERVICE, parentId)
  const issue = findCatalogNode(catalog, CATALOG_KINDS.SERVICE_CATEGORY, service?.serviceCategoryId)
  const category = findCatalogNode(catalog, CATALOG_KINDS.CATEGORY, service?.categoryId || issue?.categoryId)
  const type = findCatalogNode(
    catalog,
    CATALOG_KINDS.SERVICE_TYPE,
    service?.serviceTypeId || issue?.serviceTypeId || category?.serviceTypeId,
  )
  return catalogPathLabel([
    { title: catalogTitle(type) },
    { title: catalogTitle(category) },
    { title: catalogTitle(issue) },
    { title: catalogTitle(service) },
    { title },
  ])
}

export function mergeVariationsList(embeddedList, collectionList) {
  const embedded = Array.isArray(embeddedList) ? embeddedList : []
  const fromCol = Array.isArray(collectionList) ? collectionList : []
  const map = new Map()

  for (let i = 0; i < embedded.length; i++) {
    const v = embedded[i]
    if (!v || typeof v !== 'object') continue
    const id = String(v.id || v.variationId || '').trim()
    const title = String(v.title || v.name || '').trim()
    const key = id || title || `embedded-${i}`
    map.set(key, { ...v, id: id || key })
  }

  for (const v of fromCol) {
    if (!v || typeof v !== 'object') continue
    const id = String(v.id || v.variationId || '').trim()
    const title = String(v.title || v.name || '').trim()

    let targetKey = null
    if (id && map.has(id)) {
      targetKey = id
    } else if (title) {
      for (const [k, existing] of map.entries()) {
        const exTitle = String(existing?.title || existing?.name || '').trim()
        if (exTitle && exTitle.toLowerCase() === title.toLowerCase()) {
          targetKey = k
          break
        }
      }
    }

    if (targetKey) {
      const existing = map.get(targetKey)
      map.set(targetKey, { ...existing, ...v, id: id || existing.id })
    } else {
      const key = id || title || `col-${map.size}`
      map.set(key, { ...v, id: id || key })
    }
  }

  return sortByDisplayOrder(Array.from(map.values()))
}

export function mergeServiceVariations(service, variationDocs) {
  if (!service) return service
  const sId = String(service?.id || '').trim().toLowerCase()
  const sSlug = String(service?.slug || '').trim().toLowerCase()
  const sTitle = String(service?.title || service?.name || '').trim().toLowerCase()

  const fromCol = (Array.isArray(variationDocs) ? variationDocs : []).filter((v) => {
    const vSvc = String(v?.serviceId ?? v?.service_id ?? '').trim().toLowerCase()
    return vSvc && (vSvc === sId || (sSlug && vSvc === sSlug) || (sTitle && vSvc === sTitle))
  })
  const embedded = Array.isArray(service.variations) ? service.variations : []
  const merged = mergeVariationsList(embedded, fromCol)
  return {
    ...service,
    variations: merged,
    hasVariations: merged.length > 0 || Boolean(service.hasVariations),
  }
}
