export const DEFAULT_HOME_CHROME_STICKY = {
  stickyLocation: false,
  stickyCart: false,
  stickyServiceType: false,
}

export const DEFAULT_CATALOG_CHROME = {
  backgroundColor: '#FDE7DD',
}

export function normalizeCatalogChrome(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  const bg = String(s.backgroundColor || s.containerBackground || '').trim()
  return {
    backgroundColor: bg || DEFAULT_CATALOG_CHROME.backgroundColor,
  }
}

export function normalizeHomeChromeSticky(raw) {
  const s = raw && typeof raw === 'object' ? raw : {}
  return {
    stickyLocation: s.stickyLocation === true,
    stickyCart: s.stickyCart === true,
    stickyServiceType: s.stickyServiceType === true,
  }
}
