import { useState } from 'react'
import { toast } from 'sonner'
import { Field, Input, Select } from './ui'
import { uploadToCloudinary } from '../services/cloudinary'

export function CatalogImageField({
  label = 'Image',
  image,
  imageSource = 'upload',
  onChange,
  uploadOptions,
  required = false,
}) {
  const [busy, setBusy] = useState(false)
  const source = imageSource === 'url' ? 'url' : 'upload'

  return (
    <div className="grid gap-3">
      <Field label="Image source">
        <Select
          value={source}
          onChange={(e) => onChange({ image, imageSource: e.target.value })}
        >
          <option value="upload">Upload</option>
          <option value="url">URL</option>
        </Select>
      </Field>
      {source === 'url' ? (
        <Field label={required ? `${label} URL *` : `${label} URL`}>
          <Input
            value={image || ''}
            placeholder="https://… (image or animated .gif)"
            onChange={(e) => onChange({ image: e.target.value, imageSource: source })}
          />
        </Field>
      ) : (
        <Field label={required ? `${label} *` : label}>
          <div className="rounded-2xl border border-dashed border-[var(--outline-variant)] p-3">
            <input
              className="w-full text-sm"
              type="file"
              accept="image/*,image/gif,.gif"
              disabled={busy}
              onChange={async (e) => {
                const file = e.target.files?.[0]
                if (!file) return
                setBusy(true)
                try {
                  const url = await uploadToCloudinary(file, uploadOptions)
                  onChange({ image: url, imageSource: 'upload' })
                } catch (err) {
                  toast.error(err?.message || 'Image upload failed')
                } finally {
                  setBusy(false)
                  e.target.value = ''
                }
              }}
            />
            {busy ? (
              <p className="mt-2 text-xs text-[var(--on-surface-variant)]">Uploading…</p>
            ) : null}
          </div>
        </Field>
      )}
      {image ? (
        <img src={image} alt="" className="h-28 w-full rounded-xl object-cover" />
      ) : (
        <p className="text-xs text-[var(--on-surface-variant)]">No image yet</p>
      )}
    </div>
  )
}
