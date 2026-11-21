import { useEffect, useMemo, useState } from 'react'
import { Button, Field, Modal, Select } from './ui'
import {
  CATALOG_KIND_META,
  CATALOG_KINDS,
  catalogAncestry,
  catalogPathLabel,
  catalogTitle,
  currentParentId,
  pathLabelAfterMove,
  sortByDisplayOrder,
} from '../utils/catalogHierarchy'

export function CatalogMoveModal({
  open,
  kind,
  item,
  items,
  catalog,
  busy,
  onClose,
  onConfirm,
}) {
  const itemList = useMemo(() => {
    if (Array.isArray(items) && items.length) return items
    if (Array.isArray(item)) return item
    if (item) return [item]
    return []
  }, [item, items])

  const isMultiple = itemList.length > 1
  const firstItem = itemList[0]

  const [destTypeId, setDestTypeId] = useState('')
  const [destCategoryId, setDestCategoryId] = useState('')
  const [destIssueId, setDestIssueId] = useState('')
  const [destServiceId, setDestServiceId] = useState('')

  const types = useMemo(() => sortByDisplayOrder(catalog.serviceTypes || []), [catalog.serviceTypes])
  const categories = useMemo(
    () =>
      sortByDisplayOrder(
        (catalog.categories || []).filter((row) => !destTypeId || String(row.serviceTypeId) === destTypeId),
      ),
    [catalog.categories, destTypeId],
  )
  const issues = useMemo(
    () =>
      sortByDisplayOrder(
        (catalog.serviceCategories || []).filter((row) => !destCategoryId || String(row.categoryId) === destCategoryId),
      ),
    [catalog.serviceCategories, destCategoryId],
  )
  const services = useMemo(
    () =>
      sortByDisplayOrder(
        (catalog.services || []).filter((row) => {
          if (String(row.status || '') === 'Coming Soon') return false
          if (destIssueId) return String(row.serviceCategoryId) === destIssueId
          return false
        }),
      ),
    [catalog.services, destIssueId],
  )

  useEffect(() => {
    if (!open || !firstItem) return
    const ancestry = catalogAncestry(catalog, kind, firstItem.id)
    const typeStep = ancestry.find((s) => s.kind === CATALOG_KINDS.SERVICE_TYPE)
    const catStep = ancestry.find((s) => s.kind === CATALOG_KINDS.CATEGORY)
    const issueStep = ancestry.find((s) => s.kind === CATALOG_KINDS.SERVICE_CATEGORY)
    const svcStep = ancestry.find((s) => s.kind === CATALOG_KINDS.SERVICE)
    setDestTypeId(typeStep?.id || '')
    setDestCategoryId(catStep?.id || '')
    setDestIssueId(issueStep?.id || '')
    setDestServiceId(svcStep?.id || '')
    // Snapshot only when dialog opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, kind, firstItem?.id])

  const meta = CATALOG_KIND_META[kind] || { label: 'Item', parentKind: null }
  const currentLabel = firstItem ? catalogPathLabel(catalogAncestry(catalog, kind, firstItem.id)) : ''
  const parentId =
    kind === CATALOG_KINDS.CATEGORY
      ? destTypeId
      : kind === CATALOG_KINDS.SERVICE_CATEGORY
        ? destCategoryId
        : kind === CATALOG_KINDS.SERVICE
          ? destIssueId
          : kind === CATALOG_KINDS.VARIATION
            ? destServiceId
            : ''

  const canSelectParent = Boolean(meta.parentKind)
  const preview = canSelectParent && parentId && firstItem ? pathLabelAfterMove(catalog, kind, firstItem, parentId) : currentLabel

  const allInSameParent = useMemo(() => {
    if (!itemList.length) return false
    const firstParent = currentParentId(kind, firstItem)
    return itemList.every((it) => currentParentId(kind, it) === firstParent)
  }, [itemList, kind, firstItem])

  const unchanged = Boolean(
    parentId &&
    (isMultiple
      ? allInSameParent && parentId === currentParentId(kind, firstItem)
      : parentId === currentParentId(kind, firstItem))
  )

  return (
    <Modal
      open={open}
      title={isMultiple ? `Move / Reassign (${itemList.length} ${meta.label}s)` : `Move / Reassign ${meta.label}`}
      onClose={onClose}
    >
      <div className="grid gap-4">
        {/* Selected Items summary */}
        {isMultiple ? (
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              <span>{itemList.length} {meta.label}s Selected to Move:</span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
              {itemList.map((it) => (
                <span
                  key={it.id}
                  className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-900 dark:bg-slate-700 dark:text-white"
                >
                  {catalogTitle(it)}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">Current Location</p>
          <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
            {isMultiple && !allInSameParent ? 'Multiple locations' : currentLabel || '—'}
          </p>
        </div>

        {!canSelectParent ? (
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            Service types sit at the top of the catalog and have no parent. To reorganize, open a category and use Move
            / Reassign to place it under a different service type.
          </p>
        ) : (
          <>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Choose a target destination. {isMultiple ? 'All selected items will be moved together.' : 'The item keeps its ID, images, price, and settings.'} Only parent links are updated.
            </p>

            {kind === CATALOG_KINDS.CATEGORY ||
            kind === CATALOG_KINDS.SERVICE_CATEGORY ||
            kind === CATALOG_KINDS.SERVICE ||
            kind === CATALOG_KINDS.VARIATION ? (
              <Field label="Service Type">
                <Select
                  value={destTypeId}
                  onChange={(e) => {
                    setDestTypeId(e.target.value)
                    setDestCategoryId('')
                    setDestIssueId('')
                    setDestServiceId('')
                  }}
                >
                  <option value="">Select service type</option>
                  {types.map((row) => (
                    <option key={row.id} value={row.id}>
                      {catalogTitle(row)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            {kind === CATALOG_KINDS.SERVICE_CATEGORY ||
            kind === CATALOG_KINDS.SERVICE ||
            kind === CATALOG_KINDS.VARIATION ? (
              <Field label="Category">
                <Select
                  value={destCategoryId}
                  disabled={!destTypeId}
                  onChange={(e) => {
                    setDestCategoryId(e.target.value)
                    setDestIssueId('')
                    setDestServiceId('')
                  }}
                >
                  <option value="">Select category</option>
                  {categories.map((row) => (
                    <option key={row.id} value={row.id}>
                      {catalogTitle(row)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            {kind === CATALOG_KINDS.SERVICE || kind === CATALOG_KINDS.VARIATION ? (
              <Field label="Service Category">
                <Select
                  value={destIssueId}
                  disabled={!destCategoryId}
                  onChange={(e) => {
                    setDestIssueId(e.target.value)
                    setDestServiceId('')
                  }}
                >
                  <option value="">Select service category</option>
                  {issues.map((row) => (
                    <option key={row.id} value={row.id}>
                      {catalogTitle(row)}
                    </option>
                  ))}
                </Select>
              </Field>
            ) : null}

            {kind === CATALOG_KINDS.VARIATION ? (
              <Field label="Service">
                <Select
                  value={destServiceId}
                  disabled={!destIssueId}
                  onChange={(e) => setDestServiceId(e.target.value)}
                >
                  <option value="">Select service</option>
                  {services
                    .filter((row) => !itemList.some((it) => it.id === row.id))
                    .map((row) => (
                      <option key={row.id} value={row.id}>
                        {catalogTitle(row)}
                      </option>
                    ))}
                </Select>
              </Field>
            ) : null}

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-800 dark:text-slate-200">Move Destination</p>
              <p className="mt-1 text-sm font-bold text-primary-600 dark:text-primary-400">{preview || 'Select a destination above'}</p>
            </div>
          </>
        )}

        <div className="flex flex-wrap justify-end gap-2 pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancel
          </Button>
          {canSelectParent ? (
            <Button
              type="button"
              disabled={busy || !parentId || unchanged}
              onClick={() => onConfirm(parentId, itemList)}
            >
              {busy ? 'Moving…' : isMultiple ? `Move ${itemList.length} Items` : 'Save Move'}
            </Button>
          ) : null}
        </div>
      </div>
    </Modal>
  )
}
