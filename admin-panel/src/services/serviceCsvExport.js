import Papa from 'papaparse'
import { downloadCsv } from '../utils/helpers'

/** Stable column order for round-trip import/export. */
export const SERVICE_CSV_EXPORT_COLUMNS = [
  'id',
  'name',
  'serviceTypeId',
  'serviceType',
  'categoryId',
  'category',
  'serviceCategoryId',
  'serviceCategory',
  'description',
  'hasVariations',
  'variations',
  'price',
  'visitingCharge',
  'duration',
  'revisitDays',
  'displayOrder',
  'status',
  'extraPoint',
  'homeImage',
  'listImage',
  'detailImage',
  'imageUrl',
  'keyPoints',
  'brands',
  'processSteps',
  'additionalServices',
  'createdAt',
  'updatedAt',
]

function timestampToCsv(value) {
  if (value == null || value === '') return ''
  try {
    if (typeof value.toDate === 'function') {
      const d = value.toDate()
      return Number.isNaN(d.getTime()) ? '' : d.toISOString()
    }
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString()
  } catch {
    return ''
  }
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString()
}

/**
 * Variations as JSON string for one CSV cell (id, title, price, image, status).
 */
export function serializeServiceVariationsJson(service) {
  const vars = Array.isArray(service?.variations) ? service.variations : []
  if (!vars.length) return '[]'
  const normalized = vars.map((v) => {
    if (!v || typeof v !== 'object') return null
    const id = String(v.id ?? '').trim()
    const title = String(v.title ?? v.name ?? '').trim()
    const price = Number(v.price)
    const image = String(v.image ?? '').trim()
    const status = String(v.status ?? 'Active').trim() || 'Active'
    if (!title || !Number.isFinite(price) || price < 0 || !image) return null
    return { id, title, price, image, status }
  })
  const kept = normalized.filter(Boolean)
  return JSON.stringify(kept.length ? kept : [])
}

function stringifyJsonArray(value) {
  if (!Array.isArray(value)) return '[]'
  try {
    return JSON.stringify(value)
  } catch {
    return '[]'
  }
}

/**
 * One flat row for CSV (nested data as JSON strings).
 * @param {object} service — Firestore service doc with id
 * @param {string|object} metaOrCategory — category name or { serviceType, category, serviceCategory }
 */
export function serviceToCsvRow(service, metaOrCategory = '') {
  const meta =
    typeof metaOrCategory === 'object' && metaOrCategory !== null
      ? metaOrCategory
      : { category: String(metaOrCategory || '') }

  const hasVariations = Boolean(service.hasVariations)
  const variationsCell = serializeServiceVariationsJson(service)
  const price = hasVariations ? 0 : Number(service.price ?? 0)

  return {
    id: service.id ?? '',
    name: service.name ?? service.title ?? '',
    serviceTypeId: service.serviceTypeId ?? '',
    serviceType: meta.serviceType || '',
    categoryId: service.categoryId ?? '',
    category: meta.category || '',
    serviceCategoryId: service.serviceCategoryId ?? '',
    serviceCategory: meta.serviceCategory || '',
    description: service.description ?? '',
    hasVariations: hasVariations ? 'true' : 'false',
    variations: variationsCell,
    price: Number.isFinite(price) ? String(price) : '0',
    visitingCharge: String(service.visitingCharge ?? 0),
    duration: String(service.duration ?? 0),
    revisitDays: String(service.revisitDays ?? 30),
    displayOrder: String(service.displayOrder ?? 0),
    status: service.status ?? 'Active',
    extraPoint: service.extraPoint ?? '',
    homeImage: service.homeImage ?? '',
    listImage: service.listImage ?? '',
    detailImage: service.detailImage ?? '',
    imageUrl: service.imageUrl ?? '',
    keyPoints: stringifyJsonArray(service.keyPoints),
    brands: stringifyJsonArray(service.brands),
    processSteps: stringifyJsonArray(service.processSteps),
    additionalServices: stringifyJsonArray(service.additionalServices),
    createdAt: timestampToCsv(service.createdAt),
    updatedAt: timestampToCsv(service.updatedAt),
  }
}

export function buildServiceExportRows(services, mapsOrCategoryMap = {}) {
  let typeMap = {}
  let categoryMap = {}
  let issueMap = {}

  if (
    mapsOrCategoryMap &&
    typeof mapsOrCategoryMap === 'object' &&
    (mapsOrCategoryMap.categoryMap || mapsOrCategoryMap.typeMap || mapsOrCategoryMap.issueMap)
  ) {
    typeMap = mapsOrCategoryMap.typeMap || {}
    categoryMap = mapsOrCategoryMap.categoryMap || {}
    issueMap = mapsOrCategoryMap.issueMap || {}
  } else if (mapsOrCategoryMap && typeof mapsOrCategoryMap === 'object') {
    categoryMap = mapsOrCategoryMap
  }

  return (services || []).map((s) =>
    serviceToCsvRow(s, {
      serviceType: typeMap[s.serviceTypeId] ?? '',
      category: categoryMap[s.categoryId] ?? '',
      serviceCategory: issueMap[s.serviceCategoryId] ?? '',
    }),
  )
}

/**
 * Export services with correct escaping for JSON-in-CSV cells.
 */
export function exportServicesCsv(filename, services, mapsOrCategoryMap = {}) {
  const rows = buildServiceExportRows(services, mapsOrCategoryMap)
  const csv = Papa.unparse(rows, { columns: SERVICE_CSV_EXPORT_COLUMNS })
  downloadCsv(filename, csv)
}

/**
 * Export services as a downloadable JSON file.
 */
export function exportServicesJson(filename, services) {
  const jsonStr = JSON.stringify(services || [], null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename.endsWith('.json') ? filename : `${filename}.json`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Download a starter sample CSV template with example services.
 */
export function downloadSampleServiceCsv({ serviceTypes = [], categories = [], serviceCategories = [] } = {}) {
  const sampleType = serviceTypes[0]
  const sampleCat = categories[0]
  const sampleIssue = serviceCategories[0]

  const sampleRows = [
    {
      id: 'sample-service-01',
      name: 'Split AC Deep Cleaning & Servicing',
      serviceTypeId: sampleType?.id || '',
      serviceType: sampleType?.title || sampleType?.name || 'Home Appliances',
      categoryId: sampleCat?.id || '',
      category: sampleCat?.name || sampleCat?.title || 'AC',
      serviceCategoryId: sampleIssue?.id || '',
      serviceCategory: sampleIssue?.title || sampleIssue?.name || 'Service & Repair',
      description: 'Comprehensive foam jet cleaning of indoor and outdoor AC units with deep inspection.',
      hasVariations: 'false',
      variations: '[]',
      price: '499',
      visitingCharge: '0',
      duration: '45',
      revisitDays: '30',
      displayOrder: '1',
      status: 'Active',
      extraPoint: '30 days warranty on service',
      homeImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      listImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      detailImage: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      keyPoints: JSON.stringify([
        'Complete pressure jet wash of cooling coils',
        'Inspection of refrigerant gas and amp load',
        'Drain pipe cleaning and anti-bacterial spray',
      ]),
      brands: JSON.stringify(['Voltas', 'LG', 'Daikin', 'Samsung', 'Hitachi']),
      processSteps: JSON.stringify([
        { title: 'Pre-service check', description: 'Technician checks AC cooling, temperature, and electrical load.' },
        { title: 'Foam jet wash', description: 'Coils and filters cleaned with eco-friendly foam jet.' },
        { title: 'Post-service test', description: 'Testing for cooling performance and airflow.' },
      ]),
      additionalServices: '[]',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'sample-service-02',
      name: 'Full Home Deep Cleaning',
      serviceTypeId: sampleType?.id || '',
      serviceType: sampleType?.title || sampleType?.name || 'Home Cleaning',
      categoryId: sampleCat?.id || '',
      category: sampleCat?.name || sampleCat?.title || 'Cleaning',
      serviceCategoryId: sampleIssue?.id || '',
      serviceCategory: sampleIssue?.title || sampleIssue?.name || 'Deep Cleaning',
      description: 'Intense deep cleaning of all rooms, kitchen degreasing, bathroom scrubbing, and floor buffing.',
      hasVariations: 'true',
      variations: JSON.stringify([
        {
          id: 'v-1bhk',
          title: '1 BHK Deep Cleaning',
          price: 1499,
          image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
          status: 'Active',
        },
        {
          id: 'v-2bhk',
          title: '2 BHK Deep Cleaning',
          price: 2199,
          image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
          status: 'Active',
        },
      ]),
      price: '0',
      visitingCharge: '0',
      duration: '180',
      revisitDays: '7',
      displayOrder: '2',
      status: 'Active',
      extraPoint: 'Includes specialized machine cleaning',
      homeImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      listImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      detailImage: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80',
      keyPoints: JSON.stringify([
        'Floor single-disc buffing machine',
        'Kitchen grease removal from cabinets and tiles',
        'Complete bathroom tile descaling',
      ]),
      brands: '[]',
      processSteps: JSON.stringify([
        { title: 'Dry dusting', description: 'Removal of cobwebs and deep vacuuming.' },
        { title: 'Wet scrubbing', description: 'Machine scrubbing with professional cleaning chemicals.' },
      ]),
      additionalServices: '[]',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]

  const csv = Papa.unparse(sampleRows, { columns: SERVICE_CSV_EXPORT_COLUMNS })
  downloadCsv('sample_services_template.csv', csv)
}
