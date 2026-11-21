import {
  CATALOG_KIND_META,
  CATALOG_KINDS,
  catalogTitle,
  currentParentId,
  findCatalogNode,
} from '../utils/catalogHierarchy'

function variationEmbedRow(variation, serviceId) {
  const image = String(variation.image || variation.imageUrl || '').trim()
  return {
    id: variation.id,
    title: catalogTitle(variation),
    tagline: String(variation.tagline || '').trim(),
    price: Number(variation.price),
    image,
    imageUrl: image,
    imageSource: String(variation.imageSource || 'upload'),
    status: variation.status || 'Active',
    displayOrder: Number.isFinite(Number(variation.displayOrder)) ? Number(variation.displayOrder) : 0,
    serviceId,
  }
}

export function validateCatalogMove(catalog, { kind, id, parentId }) {
  const meta = CATALOG_KIND_META[kind]
  if (!meta) throw new Error('Unknown catalog item type.')
  const item = findCatalogNode(catalog, kind, id)
  if (!item) throw new Error('Catalog item not found.')

  if (!meta.parentKind) {
    throw new Error(
      'Service types sit at the top of the catalog and have no parent. Move a category into another service type instead.',
    )
  }

  const nextParentId = String(parentId || '').trim()
  if (!nextParentId) throw new Error('Select a new parent.')
  if (nextParentId === String(id)) throw new Error('An item cannot be moved under itself.')

  const parent = findCatalogNode(catalog, meta.parentKind, nextParentId)
  if (!parent) throw new Error('Selected parent was not found.')

  const fromParent = currentParentId(kind, item)
  if (fromParent && fromParent === nextParentId) {
    throw new Error('This item is already under the selected parent.')
  }

  if (kind === CATALOG_KINDS.VARIATION && String(parent.status || '') === 'Coming Soon') {
    throw new Error('Cannot attach a variation to a Coming Soon service.')
  }
  if (kind === CATALOG_KINDS.SERVICE && String(item.status || '') === 'Coming Soon') {
    throw new Error('Coming Soon services are managed on the Coming Soon page.')
  }

  return { item, parent, meta, nextParentId, fromParent }
}

/**
 * Parent-id patches only. Existing document IDs, images, prices and settings stay in place.
 * Denormalized type/category ids on descendants are updated so browse queries stay consistent.
 */
export function buildCatalogMovePlan(catalog, args) {
  const { item, parent, meta, nextParentId, fromParent } = validateCatalogMove(catalog, args)
  const patches = []
  const itemId = item.id

  if (args.kind === CATALOG_KINDS.CATEGORY) {
    const serviceTypeId = parent.id
    patches.push({ collection: 'categories', id: itemId, fields: { serviceTypeId } })
    for (const sc of catalog.serviceCategories || []) {
      if (String(sc.categoryId) !== String(itemId)) continue
      patches.push({ collection: 'serviceCategories', id: sc.id, fields: { serviceTypeId } })
    }
    for (const service of catalog.services || []) {
      if (String(service.categoryId) !== String(itemId)) continue
      patches.push({ collection: 'services', id: service.id, fields: { serviceTypeId } })
    }
    return {
      patches,
      navigation: { typeId: serviceTypeId, categoryId: '', serviceCategoryId: '', serviceId: '' },
      itemTitle: catalogTitle(item),
    }
  }

  if (args.kind === CATALOG_KINDS.SERVICE_CATEGORY) {
    const categoryId = parent.id
    const serviceTypeId = String(parent.serviceTypeId || '').trim()
    if (!serviceTypeId) throw new Error('Target category is missing a service type.')
    patches.push({
      collection: 'serviceCategories',
      id: itemId,
      fields: { categoryId, serviceTypeId },
    })
    for (const service of catalog.services || []) {
      if (String(service.serviceCategoryId) !== String(itemId)) continue
      patches.push({
        collection: 'services',
        id: service.id,
        fields: { categoryId, serviceTypeId, serviceCategoryId: itemId },
      })
    }
    return {
      patches,
      navigation: { typeId: serviceTypeId, categoryId, serviceCategoryId: '', serviceId: '' },
      itemTitle: catalogTitle(item),
    }
  }

  if (args.kind === CATALOG_KINDS.SERVICE) {
    const serviceCategoryId = parent.id
    const categoryId = String(parent.categoryId || '').trim()
    const serviceTypeId = String(parent.serviceTypeId || '').trim()
    if (!categoryId || !serviceTypeId) throw new Error('Target service category is missing parent ids.')
    patches.push({
      collection: 'services',
      id: itemId,
      fields: { serviceCategoryId, categoryId, serviceTypeId },
    })
    return {
      patches,
      navigation: { typeId: serviceTypeId, categoryId, serviceCategoryId, serviceId: '' },
      itemTitle: catalogTitle(item),
    }
  }

  if (args.kind === CATALOG_KINDS.VARIATION) {
    const newServiceId = parent.id
    const oldServiceId = fromParent
    if (!oldServiceId) throw new Error('This variation has no parent service.')
    const oldService = findCatalogNode(catalog, CATALOG_KINDS.SERVICE, oldServiceId)
    const newService = parent
    const row = variationEmbedRow(item, newServiceId)

    patches.push({
      collection: 'variations',
      id: itemId,
      fields: {
        serviceId: newServiceId,
        title: row.title,
        tagline: row.tagline,
        price: row.price,
        image: row.image,
        imageUrl: row.imageUrl,
        imageSource: row.imageSource,
        status: row.status,
        displayOrder: row.displayOrder,
      },
    })

    const oldEmbed = (Array.isArray(oldService?.variations) ? oldService.variations : []).filter(
      (v) => String(v.id) !== String(itemId),
    )
    patches.push({
      collection: 'services',
      id: oldServiceId,
      fields: {
        variations: oldEmbed,
        hasVariations: oldEmbed.length > 0,
      },
    })

    const newEmbed = (Array.isArray(newService.variations) ? newService.variations : []).filter(
      (v) => String(v.id) !== String(itemId),
    )
    newEmbed.push(row)
    patches.push({
      collection: 'services',
      id: newServiceId,
      fields: {
        hasVariations: true,
        price: null,
        variations: newEmbed,
      },
    })

    return {
      patches,
      navigation: {
        typeId: String(newService.serviceTypeId || '').trim(),
        categoryId: String(newService.categoryId || '').trim(),
        serviceCategoryId: String(newService.serviceCategoryId || '').trim(),
        serviceId: newServiceId,
      },
      itemTitle: catalogTitle(item),
    }
  }

  throw new Error(`${meta.label} cannot be moved.`)
}

export function buildMultipleCatalogMovePlan(catalog, { kind, ids, parentId }) {
  if (!Array.isArray(ids) || !ids.length) {
    throw new Error('No items selected to move.')
  }

  const allPatches = []
  const movedTitles = []
  let navigation = null

  for (const id of ids) {
    const plan = buildCatalogMovePlan(catalog, { kind, id, parentId })
    allPatches.push(...plan.patches)
    movedTitles.push(plan.itemTitle)
    if (!navigation) {
      navigation = plan.navigation
    }
  }

  return {
    patches: allPatches,
    navigation,
    count: movedTitles.length,
    itemTitles: movedTitles,
  }
}
