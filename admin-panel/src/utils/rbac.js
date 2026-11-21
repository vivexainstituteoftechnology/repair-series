/** Firestore + app role keys (must match `adminUsers.role`). */
export const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  TECHNICIAN_MANAGER: 'technicianManager',
  BOOKING_MANAGER: 'bookingManager',
  SERVICE_MANAGER: 'serviceManager',
  WALL_PANEL_MANAGER: 'wallPanelManager',
  WALL_PANEL_EMPLOYEE: 'wallPanelEmployee',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.TECHNICIAN_MANAGER]: 'Technician Manager',
  [ROLES.BOOKING_MANAGER]: 'Booking Manager',
  [ROLES.SERVICE_MANAGER]: 'Service Manager',
  [ROLES.WALL_PANEL_MANAGER]: 'Wall Panel Manager',
  [ROLES.WALL_PANEL_EMPLOYEE]: 'Wall Panel Employee',
  /** Shown for existing Firestore docs until a Super Admin assigns a new role. */
  supportManager: 'Support Manager (legacy)',
}

export const ASSIGNABLE_ROLES = [
  ROLES.SUPER_ADMIN,
  ROLES.TECHNICIAN_MANAGER,
  ROLES.BOOKING_MANAGER,
  ROLES.SERVICE_MANAGER,
  ROLES.WALL_PANEL_MANAGER,
  ROLES.WALL_PANEL_EMPLOYEE,
]

/**
 * Whether the role may open this path (exact path match for non–super-admin).
 * @param {string} role
 * @param {string} pathname
 */
export function canAccessPath(role, pathname) {
  if (!role) return false
  const normalized = (pathname || '/').replace(/\/$/, '') || '/'
  if (
    normalized === '/platform-settings' ||
    normalized === '/support-legal' ||
    normalized === '/invoice-settings' ||
    normalized === '/finance-reports' ||
    normalized === '/partner-wallets' ||
    normalized === '/service-areas'
  ) {
    return role === ROLES.SUPER_ADMIN
  }
  if (normalized === '/notifications') {
    return role === ROLES.SUPER_ADMIN || role === ROLES.BOOKING_MANAGER
  }
  if (role === ROLES.SUPER_ADMIN) return true
  if (role === ROLES.TECHNICIAN_MANAGER) {
    return ['/technicians', '/peak-hours', '/paused-jobs', '/scheduling-settings', '/partner-wallets'].includes(
      normalized,
    )
  }
  if (role === ROLES.BOOKING_MANAGER) {
    return [
      '/bookings',
      '/paused-jobs',
      '/location-history',
      '/revisits',
      '/invoices',
      '/reviews',
      '/notifications',
      '/wall-panel/bookings',
      '/wall-panel/employees',
      '/wall-panel/designs',
    ].includes(normalized)
  }
  if (role === ROLES.SERVICE_MANAGER) {
    return [
      '/services',
      '/coming-soon-services',
      '/additional-services',
      '/import-services',
      '/offers',
      '/banners',
      '/home-sections',
      '/coupons',
      '/reviews',
      '/wall-panel/designs',
    ].includes(normalized)
  }
  if (role === ROLES.WALL_PANEL_MANAGER) {
    return [
      '/wall-panel/designs',
      '/wall-panel/employees',
      '/wall-panel/bookings',
    ].includes(normalized)
  }
  if (role === ROLES.WALL_PANEL_EMPLOYEE) {
    return normalized === '/wall-panel/my-jobs'
  }
  if (role === 'supportManager') {
    return ['/bookings', '/customers', '/paused-jobs', '/location-history', '/revisits'].includes(normalized)
  }
  return false
}

export function getDefaultRoute(role) {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return '/'
    case ROLES.TECHNICIAN_MANAGER:
      return '/technicians'
    case ROLES.BOOKING_MANAGER:
      return '/bookings'
    case ROLES.SERVICE_MANAGER:
      return '/services'
    case ROLES.WALL_PANEL_MANAGER:
      return '/wall-panel/bookings'
    case ROLES.WALL_PANEL_EMPLOYEE:
      return '/wall-panel/my-jobs'
    case 'supportManager':
      return '/bookings'
    default:
      return '/login'
  }
}

export function formatRoleLabel(role) {
  return ROLE_LABELS[role] || role || '—'
}
