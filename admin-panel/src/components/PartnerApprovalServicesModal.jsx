import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button, Modal } from './ui'
import {
  MAX_PARTNER_CATEGORIES,
  MAX_PARTNER_SERVICE_TYPES,
} from '../utils/partnerServices'

function sortByName(rows) {
  return [...(rows || [])].sort((a, b) =>
    String(a.name || a.title || '').localeCompare(String(b.name || b.title || '')),
  )
}

export function PartnerApprovalServicesModal({
  open,
  onClose,
  categories,
  serviceTypes,
  serviceCategories,
  loading,
  onConfirm,
}) {
  const [selectedTypeIds, setSelectedTypeIds] = useState([])
  const [selectedCatIds, setSelectedCatIds] = useState([])
  const [scByCategory, setScByCategory] = useState({})

  useEffect(() => {
    if (!open) return
    setSelectedTypeIds([])
    setSelectedCatIds([])
    setScByCategory({})
  }, [open])

  const sortedTypes = useMemo(() => sortByName(serviceTypes), [serviceTypes])

  const categoriesForType = useMemo(() => {
    const map = {}
    for (const st of sortedTypes) {
      map[st.id] = sortByName(
        (categories || []).filter((c) => String(c.serviceTypeId || '') === String(st.id)),
      )
    }
    return map
  }, [categories, sortedTypes])

  const serviceCategoriesForCategory = useMemo(() => {
    const map = {}
    for (const cat of categories || []) {
      map[cat.id] = sortByName(
        (serviceCategories || []).filter((sc) => String(sc.categoryId || '') === String(cat.id)),
      )
    }
    return map
  }, [categories, serviceCategories])

  const buildServices = () => {
    const blocks = selectedTypeIds.map((serviceTypeId) => ({
      serviceTypeId,
      categories: selectedCatIds
        .filter((categoryId) => {
          const cat = (categories || []).find((c) => c.id === categoryId)
          return cat && String(cat.serviceTypeId || '') === String(serviceTypeId)
        })
        .map((categoryId) => ({
          categoryId,
          serviceCategoryIds: Array.isArray(scByCategory[categoryId])
            ? scByCategory[categoryId]
            : [],
        })),
    }))
    return blocks.filter((b) => b.categories.length > 0)
  }

  const toggleServiceType = (id) => {
    setSelectedTypeIds((prev) => {
      if (prev.includes(id)) {
        const nextTypes = prev.filter((x) => x !== id)
        const catsForType = (categoriesForType[id] || []).map((c) => c.id)
        setSelectedCatIds((cats) => cats.filter((cid) => !catsForType.includes(cid)))
        setScByCategory((sc) => {
          const next = { ...sc }
          for (const cid of catsForType) delete next[cid]
          return next
        })
        return nextTypes
      }
      if (prev.length >= MAX_PARTNER_SERVICE_TYPES) {
        toast.error(`Maximum ${MAX_PARTNER_SERVICE_TYPES} service types per partner.`)
        return prev
      }
      return [...prev, id]
    })
  }

  const toggleCategory = (catId, serviceTypeId) => {
    setSelectedCatIds((prev) => {
      if (prev.includes(catId)) {
        setScByCategory((sc) => {
          const next = { ...sc }
          delete next[catId]
          return next
        })
        return prev.filter((x) => x !== catId)
      }
      if (prev.length >= MAX_PARTNER_CATEGORIES) {
        toast.error(`Maximum ${MAX_PARTNER_CATEGORIES} categories total per partner.`)
        return prev
      }
      if (!selectedTypeIds.includes(serviceTypeId)) {
        toast.error('Select the service type first.')
        return prev
      }
      return [...prev, catId]
    })
  }

  const toggleServiceCategory = (catId, scId) => {
    setScByCategory((prev) => {
      const list = Array.isArray(prev[catId]) ? [...prev[catId]] : []
      const next = list.includes(scId) ? list.filter((x) => x !== scId) : [...list, scId]
      return { ...prev, [catId]: next }
    })
  }

  return (
    <Modal open={open} title="Assign services before approval" onClose={onClose}>
      <p className="mb-4 text-sm text-[var(--on-surface-variant)]">
        Service type (max {MAX_PARTNER_SERVICE_TYPES}) → category (max {MAX_PARTNER_CATEGORIES}{' '}
        total) → service categories (no limit).
      </p>
      {loading ? (
        <p className="text-sm text-[var(--on-surface-variant)]">Loading catalog…</p>
      ) : (
        <div className="max-h-[55vh] space-y-5 overflow-y-auto pr-1">
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--on-surface-variant)]">
              1. Service types — {selectedTypeIds.length} / {MAX_PARTNER_SERVICE_TYPES}
            </p>
            <div className="space-y-2 rounded-2xl border border-[var(--outline-variant)] p-3">
              {sortedTypes.map((st) => (
                <label key={st.id} className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={selectedTypeIds.includes(st.id)}
                    onChange={() => toggleServiceType(st.id)}
                  />
                  {st.name || st.title}
                </label>
              ))}
            </div>
          </section>

          {selectedTypeIds.map((typeId) => {
            const st = sortedTypes.find((t) => t.id === typeId)
            const cats = categoriesForType[typeId] || []
            return (
              <section key={typeId} className="rounded-2xl border border-[var(--outline-variant)] p-3">
                <p className="mb-2 text-sm font-semibold text-[var(--on-surface)]">
                  2. Categories — {st?.name || st?.title || typeId}
                </p>
                <p className="mb-2 text-xs text-[var(--on-surface-variant)]">
                  {selectedCatIds.length} / {MAX_PARTNER_CATEGORIES} categories selected (all types)
                </p>
                {!cats.length ? (
                  <p className="text-xs text-[var(--on-surface-variant)]">
                    No categories for this service type in catalog.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {cats.map((cat) => {
                      const catOn = selectedCatIds.includes(cat.id)
                      const scList = serviceCategoriesForCategory[cat.id] || []
                      return (
                        <div key={cat.id} className="rounded-xl bg-[var(--surface-low)]/50 p-2">
                          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <input
                              type="checkbox"
                              checked={catOn}
                              onChange={() => toggleCategory(cat.id, typeId)}
                            />
                            {cat.name || cat.title}
                          </label>
                          {catOn ? (
                            <div className="mt-2 space-y-1 pl-6">
                              <p className="text-[11px] font-semibold uppercase text-[var(--on-surface-variant)]">
                                3. Service categories
                              </p>
                              {scList.length ? (
                                scList.map((sc) => {
                                  const picked = (scByCategory[cat.id] || []).includes(sc.id)
                                  return (
                                    <label
                                      key={sc.id}
                                      className="flex cursor-pointer items-center gap-2 text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={picked}
                                        onChange={() => toggleServiceCategory(cat.id, sc.id)}
                                      />
                                      {sc.title || sc.name}
                                    </label>
                                  )
                                })
                              ) : (
                                <p className="text-xs text-[var(--on-surface-variant)]">
                                  No service categories for this category in catalog.
                                </p>
                              )}
                            </div>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}
      <div className="mt-5 flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={() => {
            const services = buildServices()
            onConfirm?.(services)
          }}
        >
          Approve partner
        </Button>
      </div>
    </Modal>
  )
}
