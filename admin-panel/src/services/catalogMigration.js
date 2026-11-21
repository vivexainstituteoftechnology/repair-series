import { catalogEntityFields, catalogTitle, DEFAULT_SERVICE_TYPE_ID, DEFAULT_SERVICE_TYPE_TITLE, DEFAULT_SERVICE_CATEGORY_TITLE } from '../utils/catalogHierarchy'
import { createDoc, fetchDocsWhere, upsertDoc } from './firestore'

function newId(prefix) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Safe, additive migration:
 * - Creates a default Service Type if none exist
 * - Attaches existing categories to that type when serviceTypeId is missing
 * - Creates a "General" service category per category when none exist
 * - Backfills services with parent IDs
 * - Copies embedded variations into the `variations` collection
 * Never deletes existing documents.
 */
export async function migrateCatalogHierarchy({ serviceTypes, categories, serviceCategories, services, variations }) {
  const types = Array.isArray(serviceTypes) ? serviceTypes : []
  const cats = Array.isArray(categories) ? categories : []
  const scs = Array.isArray(serviceCategories) ? serviceCategories : []
  const svcs = Array.isArray(services) ? services : []
  const vars = Array.isArray(variations) ? variations : []

  const summary = {
    serviceTypesCreated: 0,
    categoriesUpdated: 0,
    serviceCategoriesCreated: 0,
    servicesUpdated: 0,
    variationsCopied: 0,
    defaultServiceTypeId: '',
  }

  let defaultTypeId = ''
  const existingHome = types.find(
    (t) =>
      t.id === DEFAULT_SERVICE_TYPE_ID ||
      String(t.title || t.name || '').trim().toLowerCase() === DEFAULT_SERVICE_TYPE_TITLE.toLowerCase(),
  )
  if (existingHome) {
    defaultTypeId = existingHome.id
  } else if (types.length === 1) {
    defaultTypeId = types[0].id
  } else if (types.length > 1) {
    defaultTypeId = types[0].id
  } else {
    const payload = catalogEntityFields({
      title: DEFAULT_SERVICE_TYPE_TITLE,
      displayOrder: 1,
      status: 'Active',
    })
    await upsertDoc('serviceTypes', DEFAULT_SERVICE_TYPE_ID, payload)
    defaultTypeId = DEFAULT_SERVICE_TYPE_ID
    summary.serviceTypesCreated = 1
  }
  summary.defaultServiceTypeId = defaultTypeId

  const scByCategory = new Map()
  for (const sc of scs) {
    const cid = String(sc.categoryId || '').trim()
    if (!cid) continue
    const list = scByCategory.get(cid) || []
    list.push(sc)
    scByCategory.set(cid, list)
  }

  const defaultScByCategory = {}

  for (const cat of cats) {
    const patch = {}
    if (!String(cat.serviceTypeId || '').trim()) {
      patch.serviceTypeId = defaultTypeId
    }
    if (!catalogTitle(cat)) {
      patch.title = String(cat.name || cat.id)
      patch.name = patch.title
    }
    if (patch.serviceTypeId || patch.title) {
      await upsertDoc('categories', cat.id, patch)
      summary.categoriesUpdated += 1
    }

    const typeId = String(patch.serviceTypeId || cat.serviceTypeId || defaultTypeId)
    const existing = scByCategory.get(cat.id) || []
    if (existing.length === 0) {
      const scPayload = {
        ...catalogEntityFields({
          title: DEFAULT_SERVICE_CATEGORY_TITLE,
          image: String(cat.image || cat.icon || cat.imageUrl || ''),
          displayOrder: 1,
          status: cat.status || 'Active',
        }),
        serviceTypeId: typeId,
        categoryId: cat.id,
      }
      const scId = await createDoc('serviceCategories', scPayload)
      defaultScByCategory[cat.id] = scId
      summary.serviceCategoriesCreated += 1
    } else {
      const general = existing.find(
        (sc) =>
          String(sc.title || sc.name || '').trim().toLowerCase() ===
          DEFAULT_SERVICE_CATEGORY_TITLE.toLowerCase(),
      )
      defaultScByCategory[cat.id] = (general || existing[0]).id
    }
  }

  const variationIds = new Set(vars.map((v) => v.id))

  for (const service of svcs) {
    if (String(service.status || '') === 'Coming Soon') continue
    const categoryId = String(service.categoryId || '').trim()
    const patch = {}
    if (!String(service.serviceTypeId || '').trim()) patch.serviceTypeId = defaultTypeId
    if (categoryId && !String(service.serviceCategoryId || '').trim()) {
      patch.serviceCategoryId = defaultScByCategory[categoryId] || ''
    }
    if (!service.title && service.name) patch.title = service.name
    if (service.revisitDays == null) {
      const days = Number(service.revisit ?? service.revisitPolicy?.validityValue)
      if (Number.isFinite(days) && days > 0) patch.revisitDays = days
    }
    if (Object.keys(patch).length) {
      await upsertDoc('services', service.id, patch)
      summary.servicesUpdated += 1
    }

    if (service.hasVariations && Array.isArray(service.variations)) {
      for (let i = 0; i < service.variations.length; i += 1) {
        const v = service.variations[i]
        if (!v || typeof v !== 'object') continue
        const id = String(v.id || '').trim() || newId('var')
        if (variationIds.has(id)) continue
        await upsertDoc('variations', id, {
          serviceId: service.id,
          title: String(v.title || v.name || '').trim(),
          tagline: String(v.tagline || '').trim(),
          price: Number(v.price) || 0,
          image: String(v.image || v.imageUrl || '').trim(),
          imageUrl: String(v.image || v.imageUrl || '').trim(),
          imageSource: String(v.imageSource || 'upload'),
          status: String(v.status || 'Active'),
          displayOrder: Number.isFinite(Number(v.displayOrder)) ? Number(v.displayOrder) : i + 1,
        })
        variationIds.add(id)
        summary.variationsCopied += 1
      }
    }
  }

  return summary
}

export async function deleteChildVariations(serviceId) {
  const rows = await fetchDocsWhere('variations', 'serviceId', serviceId)
  return rows
}
