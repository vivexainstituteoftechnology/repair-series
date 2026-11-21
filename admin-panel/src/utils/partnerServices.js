/**

 * Partner catalog assignment: Service Type → Category → Service Category

 *

 * @typedef {{

 *   serviceTypeId: string,

 *   categories: Array<{ categoryId: string, serviceCategoryIds: string[] }>,

 * }} PartnerServiceTypeBlock

 */



export const MAX_PARTNER_SERVICE_TYPES = 2

export const MAX_PARTNER_CATEGORIES = 3



function uniqStrings(list) {

  return [...new Set((list || []).map((id) => String(id).trim()).filter(Boolean))]

}



/** @param {unknown} raw @param {Record<string, { serviceTypeId?: string }>} [categoriesById] */

export function normalizePartnerServices(raw, categoriesById = {}) {

  if (!Array.isArray(raw)) return []



  /** @type {Map<string, PartnerServiceTypeBlock>} */

  const byType = new Map()



  const mergeCategory = (serviceTypeId, categoryId, serviceCategoryIds) => {

    const st = String(serviceTypeId || '').trim()

    const cat = String(categoryId || '').trim()

    if (!st || !cat) return

    let block = byType.get(st)

    if (!block) {

      block = { serviceTypeId: st, categories: [] }

      byType.set(st, block)

    }

    let row = block.categories.find((c) => c.categoryId === cat)

    if (!row) {

      row = { categoryId: cat, serviceCategoryIds: [] }

      block.categories.push(row)

    }

    row.serviceCategoryIds = uniqStrings([...row.serviceCategoryIds, ...serviceCategoryIds])

  }



  for (const row of raw) {

    if (!row || typeof row !== 'object') continue



    if (Array.isArray(row.categories) && String(row.serviceTypeId || '').trim()) {

      const st = String(row.serviceTypeId).trim()

      for (const catRow of row.categories) {

        if (!catRow || typeof catRow !== 'object') continue

        const ids = Array.isArray(catRow.serviceCategoryIds)

          ? catRow.serviceCategoryIds

          : Array.isArray(catRow.serviceTypeIds)

            ? catRow.serviceTypeIds

            : []

        mergeCategory(st, catRow.categoryId, ids)

      }

      continue

    }



    const categoryId = String(row.categoryId ?? '').trim()

    if (!categoryId) continue

    const legacyScIds = Array.isArray(row.serviceCategoryIds)

      ? row.serviceCategoryIds

      : Array.isArray(row.serviceTypeIds)

        ? row.serviceTypeIds

        : []

    const catDoc = categoriesById[categoryId]

    const serviceTypeId = String(row.serviceTypeId || catDoc?.serviceTypeId || '').trim()

    if (!serviceTypeId) continue

    mergeCategory(serviceTypeId, categoryId, legacyScIds)

  }



  const blocks = [...byType.values()]

  let categoryCount = 0

  const trimmed = []

  for (const block of blocks) {

    if (trimmed.length >= MAX_PARTNER_SERVICE_TYPES) break

    const cats = []

    for (const c of block.categories) {

      if (categoryCount >= MAX_PARTNER_CATEGORIES) break

      cats.push({

        categoryId: c.categoryId,

        serviceCategoryIds: uniqStrings(c.serviceCategoryIds),

      })

      categoryCount += 1

    }

    if (cats.length) trimmed.push({ serviceTypeId: block.serviceTypeId, categories: cats })

  }

  return trimmed

}



export function partnerServicesToCategoryIds(services, categoriesById) {

  const ids = []

  for (const block of normalizePartnerServices(services, categoriesById)) {

    for (const c of block.categories) ids.push(c.categoryId)

  }

  return uniqStrings(ids)

}



export function partnerServicesToAssignedServiceCategories(services, categoriesById) {

  const map = {}

  for (const block of normalizePartnerServices(services, categoriesById)) {

    for (const c of block.categories) {

      map[c.categoryId] = [...c.serviceCategoryIds]

    }

  }

  return map

}



export function countPartnerCategories(services, categoriesById) {

  return partnerServicesToCategoryIds(services, categoriesById).length

}



/**

 * @param {PartnerServiceTypeBlock[]} services

 * @param {{ serviceTypes?: object[], categories?: object[], serviceCategories?: object[] }} catalog

 */

export function validatePartnerServicesForApproval(services, catalog = {}) {

  const types = catalog.serviceTypes || []

  const categories = catalog.categories || []

  const serviceCategories = catalog.serviceCategories || []

  const categoriesById = Object.fromEntries(categories.map((c) => [c.id, c]))

  const list = normalizePartnerServices(services, categoriesById)



  if (!list.length) {

    return { ok: false, error: 'Assign at least one service type and category before approving.' }

  }

  if (list.length > MAX_PARTNER_SERVICE_TYPES) {

    return { ok: false, error: `Maximum ${MAX_PARTNER_SERVICE_TYPES} service types per partner.` }

  }



  const totalCats = countPartnerCategories(list, categoriesById)

  if (totalCats > MAX_PARTNER_CATEGORIES) {

    return { ok: false, error: `Maximum ${MAX_PARTNER_CATEGORIES} categories total per partner.` }

  }



  for (const block of list) {

    const typeRow = types.find((t) => String(t.id) === block.serviceTypeId)

    if (!typeRow) {

      return { ok: false, error: 'Invalid service type in assignment.' }

    }

    if (!block.categories.length) {

      return { ok: false, error: 'Each selected service type needs at least one category.' }

    }

    for (const catRow of block.categories) {

      const cat = categories.find((c) => String(c.id) === catRow.categoryId)

      if (!cat) {

        return { ok: false, error: 'Invalid category in assignment.' }

      }

      if (String(cat.serviceTypeId || '') !== String(block.serviceTypeId)) {

        return { ok: false, error: 'Category does not belong to the selected service type.' }

      }

      if (!catRow.serviceCategoryIds.length) {

        return {

          ok: false,

          error: 'Each selected category needs at least one service category.',

        }

      }

      for (const scId of catRow.serviceCategoryIds) {

        const sc = serviceCategories.find((x) => String(x.id) === scId)

        if (!sc) {

          return { ok: false, error: 'Invalid service category in assignment.' }

        }

        if (String(sc.categoryId || '') !== String(catRow.categoryId)) {

          return { ok: false, error: 'Service category does not belong to the selected category.' }

        }

      }

    }

  }



  return { ok: true, services: list }

}



/**

 * Booking eligibility: service type (Electrician) + category (Fan) + service category (Fan Repair).

 */

export function technicianMatchesPartnerServices(

  technician,

  categoryId,

  serviceTypeId,

  serviceCategoryId,

) {

  const cat = String(categoryId ?? '').trim()

  const st = String(serviceTypeId ?? '').trim()

  const sc = String(serviceCategoryId ?? '').trim()

  if (!cat && !st && !sc) return true



  const categoriesById = {}

  const structured = normalizePartnerServices(technician?.services, categoriesById)

  if (structured.length) {

    if (st) {

      const block = structured.find((b) => b.serviceTypeId === st)

      if (!block) return false

      if (!cat) return true

      const catRow = block.categories.find((c) => c.categoryId === cat)

      if (!catRow) return false

      if (!sc) return true

      if (!catRow.serviceCategoryIds.length) return false

      return catRow.serviceCategoryIds.some((id) => String(id) === sc)

    }

    for (const block of structured) {

      const catRow = block.categories.find((c) => c.categoryId === cat)

      if (!catRow) continue

      if (!sc) return true

      if (catRow.serviceCategoryIds.some((id) => String(id) === sc)) return true

    }

    return false

  }



  const single = String(technician?.categoryId ?? '').trim()

  const arr = Array.isArray(technician?.categoryIds) ? technician.categoryIds : []

  const allowedCats = new Set([...arr.map((id) => String(id).trim()), single].filter(Boolean))

  if (allowedCats.size > 0 && cat && !allowedCats.has(cat)) return false



  const assigned = technician?.assignedServiceCategories

  if (sc && assigned && typeof assigned === 'object' && !Array.isArray(assigned)) {

    const forCat = assigned[cat]

    if (Array.isArray(forCat) && forCat.length > 0) {

      return forCat.some((id) => String(id).trim() === sc)

    }

  }



  const legacyMap = technician?.assignedServiceTypes

  if (st && legacyMap && typeof legacyMap === 'object' && !Array.isArray(legacyMap)) {

    const forCat = legacyMap[cat]

    if (Array.isArray(forCat) && forCat.length > 0) {

      return forCat.some((id) => String(id).trim() === st)

    }

  }



  return true

}


