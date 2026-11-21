export const DEFAULT_SERVICE_TYPE_THEME = {
  primary: '#E85D04',
  secondary: '#C45508',
  background: '#FFF8F3',
  cardBackground: '#FFFFFF',
  text: '#1F1F1F',
  secondaryText: '#6B7280',
  accent: '#FF7A00',
  border: '#E8E4E0',
  gradientStart: '#FFF7ED',
  gradientEnd: '#FFFFFF',
}

function pickHex(raw, fallback) {
  const v = String(raw ?? '').trim()
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(v) ? v : fallback
}

export function normalizeServiceTypeTheme(raw) {
  const t = raw && typeof raw === 'object' ? raw : {}
  const base = DEFAULT_SERVICE_TYPE_THEME
  const primary = pickHex(t.primary, base.primary)
  const secondary = pickHex(t.secondary, base.secondary)
  return {
    primary,
    secondary,
    background: pickHex(t.background, base.background),
    cardBackground: pickHex(t.cardBackground, base.cardBackground),
    text: pickHex(t.text, base.text),
    secondaryText: pickHex(t.secondaryText, base.secondaryText),
    accent: pickHex(t.accent, base.accent),
    border: pickHex(t.border, base.border),
    gradientStart: pickHex(t.gradientStart, base.gradientStart),
    gradientEnd: pickHex(t.gradientEnd, base.gradientEnd),
  }
}

export function emptyServiceTypeThemeForm() {
  return { ...DEFAULT_SERVICE_TYPE_THEME }
}
