import { Field, Input } from './ui'
import { DEFAULT_SERVICE_TYPE_THEME } from '../utils/serviceTypeTheme'

const THEME_FIELDS = [
  { key: 'primary', label: 'Primary color' },
  { key: 'secondary', label: 'Secondary color' },
  { key: 'background', label: 'Background color' },
  { key: 'cardBackground', label: 'Card background' },
  { key: 'text', label: 'Text color' },
  { key: 'secondaryText', label: 'Secondary text' },
  { key: 'accent', label: 'Accent color' },
  { key: 'border', label: 'Border color' },
  { key: 'gradientStart', label: 'Gradient start (optional)' },
  { key: 'gradientEnd', label: 'Gradient end (optional)' },
]

function ColorRow({ label, value, onChange }) {
  const hex = value || DEFAULT_SERVICE_TYPE_THEME.primary
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={hex.length === 7 ? hex : DEFAULT_SERVICE_TYPE_THEME.primary}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-lg border border-[var(--outline-variant)] bg-transparent"
        />
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#RRGGBB"
          className="font-mono text-sm"
        />
      </div>
    </Field>
  )
}

export function ServiceTypeThemeEditor({ theme, onChange, title = 'Service type' }) {
  const t = theme || DEFAULT_SERVICE_TYPE_THEME

  const patch = (key, val) => onChange({ ...t, [key]: val })

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[var(--outline-variant)] p-4">
        <p className="mb-3 text-sm font-semibold text-[var(--on-surface)]">Theme settings</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {THEME_FIELDS.map((f) => (
            <ColorRow key={f.key} label={f.label} value={t[f.key]} onChange={(v) => patch(f.key, v)} />
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--outline-variant)] p-4">
        <p className="mb-3 text-sm font-semibold text-[var(--on-surface)]">Live preview</p>
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            background: `linear-gradient(165deg, ${t.gradientStart}, ${t.gradientEnd} 45%, ${t.background})`,
            borderColor: t.border,
          }}
        >
          <div className="flex gap-2 px-3 py-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex w-[4.5rem] flex-col items-center rounded-xl px-1 py-2"
                style={{
                  background: i === 0 ? t.cardBackground : 'rgba(255,255,255,0.45)',
                  border: i === 0 ? `2px solid ${t.primary}` : '1px solid transparent',
                }}
              >
                <div
                  className="mb-1.5 h-10 w-10 rounded-xl"
                  style={{ background: `${t.primary}22`, border: i === 0 ? `2px solid ${t.primary}` : 'none' }}
                />
                <span
                  className="text-center text-[10px] font-bold leading-tight"
                  style={{ color: i === 0 ? t.text : t.secondaryText }}
                >
                  {i === 0 ? title || 'Type' : 'Other'}
                </span>
              </div>
            ))}
          </div>
          <div className="px-3 pb-3">
            <div
              className="flex h-11 items-center gap-2 rounded-2xl px-3 text-sm"
              style={{ background: t.cardBackground, border: `1px solid ${t.border}`, color: t.secondaryText }}
            >
              <span style={{ color: t.primary }}>⌕</span>
              Search {title || 'services'}…
            </div>
            <p className="mt-3 text-base font-extrabold" style={{ color: t.text }}>
              Section heading
            </p>
            <div
              className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold"
              style={{ background: t.accent, color: t.cardBackground }}
            >
              Price highlight
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
