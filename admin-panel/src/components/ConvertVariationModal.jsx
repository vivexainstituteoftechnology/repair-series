import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, Sparkles } from 'lucide-react'
import { Button, Field, Input, Modal, Select } from './ui'
import { catalogTitle, sortByDisplayOrder } from '../utils/catalogHierarchy'

export function ConvertVariationModal({
  open,
  variation,
  parentService,
  catalog = {},
  busy = false,
  onClose,
  onConfirm,
}) {
  const [title, setTitle] = useState('')
  const [price, setPrice] = useState('')
  const [destTypeId, setDestTypeId] = useState('')
  const [destCategoryId, setDestCategoryId] = useState('')
  const [destIssueId, setDestIssueId] = useState('')
  const [deleteOriginal, setDeleteOriginal] = useState(true)

  const parentTitle = parentService ? catalogTitle(parentService) : 'Parent Service'
  const varTitle = variation ? catalogTitle(variation) : ''

  const types = useMemo(
    () => sortByDisplayOrder(catalog.serviceTypes || []),
    [catalog.serviceTypes],
  )

  const categories = useMemo(
    () =>
      sortByDisplayOrder(
        (catalog.categories || []).filter(
          (row) => !destTypeId || String(row.serviceTypeId) === String(destTypeId),
        ),
      ),
    [catalog.categories, destTypeId],
  )

  const issues = useMemo(
    () =>
      sortByDisplayOrder(
        (catalog.serviceCategories || []).filter(
          (row) => !destCategoryId || String(row.categoryId) === String(destCategoryId),
        ),
      ),
    [catalog.serviceCategories, destCategoryId],
  )

  useEffect(() => {
    if (!open || !variation) return
    setTitle(varTitle || '')
    setPrice(variation.price !== undefined && variation.price !== null ? String(variation.price) : '')
    setDestTypeId(String(parentService?.serviceTypeId || ''))
    setDestCategoryId(String(parentService?.categoryId || ''))
    setDestIssueId(String(parentService?.serviceCategoryId || ''))
    setDeleteOriginal(true)
  }, [open, variation, parentService, varTitle])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    if (!destTypeId || !destCategoryId || !destIssueId) return

    await onConfirm?.({
      variation,
      title: title.trim(),
      price: Number(price) || 0,
      serviceTypeId: destTypeId,
      categoryId: destCategoryId,
      serviceCategoryId: destIssueId,
      deleteOriginal,
    })
  }

  const varImage = variation?.image || variation?.imageUrl || parentService?.image || parentService?.homeImage || ''

  return (
    <Modal
      open={open}
      title="Convert Variation to Service"
      onClose={onClose}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl border border-[var(--outline-variant)] bg-[var(--surface-container-low)] p-3.5">
          <div className="flex items-center gap-3">
            {varImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={varImage}
                alt=""
                className="size-12 shrink-0 rounded-xl object-cover border border-[var(--outline-variant)]"
              />
            ) : (
              <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-high)] text-[var(--primary)]">
                <Sparkles className="size-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <span>From: <strong className="font-bold text-slate-900 dark:text-white">{parentTitle}</strong></span>
                <ArrowRight className="size-3 text-slate-400" />
                <span className="font-bold text-primary-600 dark:text-primary-400">New Service</span>
              </div>
              <p className="mt-0.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                {varTitle}
              </p>
            </div>
          </div>
        </div>

        <Field label="Service Title">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Split AC 1.5 Ton Deep Clean"
            required
          />
        </Field>

        <Field label="Base Price (₹)">
          <Input
            type="number"
            min={0}
            step="1"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Base service price"
            required
          />
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Service Type">
            <Select
              value={destTypeId}
              onChange={(e) => {
                setDestTypeId(e.target.value)
                setDestCategoryId('')
                setDestIssueId('')
              }}
              required
            >
              <option value="">Select type</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {catalogTitle(t)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Category">
            <Select
              value={destCategoryId}
              disabled={!destTypeId}
              onChange={(e) => {
                setDestCategoryId(e.target.value)
                setDestIssueId('')
              }}
              required
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {catalogTitle(c)}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Service Category">
            <Select
              value={destIssueId}
              disabled={!destCategoryId}
              onChange={(e) => setDestIssueId(e.target.value)}
              required
            >
              <option value="">Select issue</option>
              {issues.map((sc) => (
                <option key={sc.id} value={sc.id}>
                  {catalogTitle(sc)}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700">
          <input
            type="checkbox"
            checked={deleteOriginal}
            onChange={(e) => setDeleteOriginal(e.target.checked)}
            className="mt-0.5 size-4 rounded text-primary-600 accent-primary-600"
          />
          <div className="text-xs">
            <p className="font-bold text-slate-900 dark:text-white">
              Remove variation from “{parentTitle}”
            </p>
            <p className="mt-0.5 font-medium text-slate-600 dark:text-slate-400">
              {deleteOriginal
                ? `Extracts this variation so it no longer appears as a sub-option under ${parentTitle}.`
                : `Keeps this variation under ${parentTitle} and creates a separate service as a duplicate.`}
            </p>
          </div>
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={busy || !title.trim() || !destTypeId || !destCategoryId || !destIssueId}
            className="gap-2"
          >
            <Sparkles className="size-4" />
            {busy ? 'Converting…' : 'Convert to Service'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
