import React, { useState } from 'react'
import {
  Bell,
  CalendarCheck,
  CalendarClock,
  Clock3,
  FileText,
  IndianRupee,
  LayoutDashboard,
  LayoutGrid,
  Layers,
  LogOut,
  Map,
  MapPinned,
  Megaphone,
  Menu,
  MoonStar,
  PackagePlus,
  PanelLeftClose,
  PanelLeftOpen,
  PauseCircle,
  Receipt,
  RotateCcw,
  Search,
  Settings,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Star,
  SunMedium,
  Tag,
  TicketPercent,
  Upload,
  User,
  Users,
  Wallet,
  Wrench,
  X,
  ChevronDown,
  Activity,
} from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../context/useApp'
import { cn } from '../utils/helpers'
import { canAccessPath, formatRoleLabel } from '../utils/rbac'
import { Badge } from './ui'

const navGroups = [
  {
    category: 'MAIN MENU',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/bookings', label: 'Bookings', icon: CalendarCheck, badgeKey: 'pendingBookings' },
      { to: '/customers', label: 'Customers', icon: User },
      { to: '/technicians', label: 'Technicians', icon: Wrench },
    ],
  },
  {
    category: 'SERVICES & CATALOG',
    items: [
      { to: '/services', label: 'Catalog & Services', icon: Layers },
      { to: '/additional-services', label: 'Add-on Services', icon: PackagePlus },
      { to: '/import-services', label: 'Import Services', icon: Upload },
      { to: '/wall-panel/designs', label: 'Wall Panel Studio', icon: LayoutGrid },
      { to: '/wall-panel/bookings', label: 'Wall Panel Bookings', icon: CalendarCheck },
      { to: '/wall-panel/employees', label: 'Wall Panel Team', icon: Users },
      { to: '/wall-panel/my-jobs', label: 'My Wall Panel Jobs', icon: Wrench },
    ],
  },
  {
    category: 'OPERATIONS',
    items: [
      { to: '/revisits', label: 'Revisit Policy', icon: RotateCcw },
      { to: '/paused-jobs', label: 'Paused Jobs', icon: PauseCircle },
      { to: '/location-history', label: 'Location History', icon: MapPinned },
      { to: '/service-areas', label: 'Service Areas', icon: Map },
      { to: '/scheduling-settings', label: 'Scheduling', icon: CalendarClock },
      { to: '/peak-hours', label: 'Peak Hours & Scoring', icon: Clock3 },
    ],
  },
  {
    category: 'FINANCE & BILLING',
    items: [
      { to: '/invoices', label: 'Invoices', icon: Receipt },
      { to: '/finance-reports', label: 'Financial Reports', icon: IndianRupee },
      { to: '/partner-wallets', label: 'Partner Wallets', icon: Wallet },
      { to: '/invoice-settings', label: 'Invoice Settings', icon: FileText },
    ],
  },
  {
    category: 'MARKETING & APP',
    items: [
      { to: '/home-sections', label: 'Home Screen Builder', icon: LayoutGrid },
      { to: '/coupons', label: 'Coupons & Discounts', icon: TicketPercent },
      { to: '/banners', label: 'Banners', icon: Tag },
      { to: '/reviews', label: 'Customer Reviews', icon: Star },
      { to: '/notifications', label: 'Broadcast Push', icon: Megaphone },
    ],
  },
  {
    category: 'CONFIGURATION',
    items: [
      { to: '/platform-settings', label: 'Platform Settings', icon: SlidersHorizontal },
      { to: '/support-legal', label: 'Support & Legal', icon: Shield },
      { to: '/users', label: 'Admin Accounts', icon: ShieldCheck },
    ],
  },
]

export function AdminLayout({ children }) {
  const { session, theme, setTheme, logout, metrics } = useApp()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('repair-series-sidebar-collapsed') === 'true'
    } catch {
      return false
    }
  })

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem('repair-series-sidebar-collapsed', String(next))
      } catch {}
      return next
    })
  }

  const sectionTitle = (() => {
    if (location.pathname === '/') return 'Dashboard'
    const slug = location.pathname.replace(/^\//, '').replace(/\/$/, '')
    const map = {
      services: 'Catalog & Services',
      'coming-soon-services': 'Coming Soon Services',
      'additional-services': 'Add-on Services',
      'import-services': 'CSV Bulk Import',
      'platform-settings': 'Platform Settings',
      'support-legal': 'Support & Legal Policies',
      bookings: 'Bookings Management',
      revisits: 'Warranty Revisit Policy',
      invoices: 'Invoices & Billing',
      'invoice-settings': 'Invoice Template & Tax',
      'paused-jobs': 'Paused Service Jobs',
      'location-history': 'Technician GPS History',
      technicians: 'Technicians & Field Partners',
      customers: 'Customer Accounts',
      offers: 'Promotional Offers',
      banners: 'App Banners',
      'home-sections': 'Home Screen Visual Builder',
      coupons: 'Coupon Codes & Discounts',
      notifications: 'Push Notifications Center',
      'finance-reports': 'Financial & Earning Reports',
      'partner-wallets': 'Partner Wallets & Settlements',
      'service-areas': 'Operational Service Areas',
      'peak-hours': 'Peak Hours & Ranking Engine',
      'scheduling-settings': 'Time Slot Scheduling',
      users: 'Admin Roles & Access Control',
      'wall-panel/designs': 'Wall Panel Design Catalog',
      'wall-panel/bookings': 'Wall Panel Bookings',
      'wall-panel/employees': 'Wall Panel Field Team',
      'wall-panel/my-jobs': 'My Assigned Wall Panel Jobs',
    }
    return map[slug] || slug.replace(/-/g, ' ')
  })()

  const handleGlobalSearch = (e) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.toLowerCase().trim()
    if (q.includes('book') || q.includes('order')) navigate('/bookings')
    else if (q.includes('tech') || q.includes('partner') || q.includes('worker')) navigate('/technicians')
    else if (q.includes('cust') || q.includes('user') || q.includes('client')) navigate('/customers')
    else if (q.includes('serv') || q.includes('item') || q.includes('catalog')) navigate('/services')
    else if (q.includes('inv') || q.includes('bill')) navigate('/invoices')
    else if (q.includes('wall')) navigate('/wall-panel/bookings')
    else if (q.includes('rev')) navigate('/reviews')
    else navigate('/bookings')
  }

  const currentDateFormatted = new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] text-[#171717] dark:text-slate-100 transition-colors duration-200">
      {/* Mobile Drawer Overlay */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      ) : null}

      {/* Main Wrapper */}
      <div className="flex min-h-screen">
        {/* Left Sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-[#E5E7EB] bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0',
            collapsed ? 'w-72 lg:w-20' : 'w-72',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {/* Logo & Brand Header */}
          <div
            className={cn(
              'flex h-20 shrink-0 items-center border-b border-[#E5E7EB] dark:border-slate-800 transition-all duration-300',
              collapsed ? 'justify-center px-3' : 'justify-between px-6',
            )}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                onClick={collapsed ? toggleCollapsed : undefined}
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white p-1 shadow-md border border-slate-200 dark:border-slate-800 dark:bg-slate-900 transition-transform',
                  collapsed && 'cursor-pointer hover:scale-105',
                )}
                title={collapsed ? 'Click to expand sidebar' : undefined}
              >
                <img src="/logo.png" alt="RepairSeries Logo" className="size-8 object-contain" />
              </div>
              {!collapsed ? (
                <div className="min-w-0 animate-fade-in">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-lg tracking-tight text-[#171717] dark:text-white truncate">
                      Repair<span className="text-primary-600 dark:text-primary-400">Series</span>
                    </span>
                    <span className="rounded-md bg-primary-50 px-1.5 py-0.2 text-[10px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300 border border-primary-200 dark:border-primary-800 shrink-0">
                      PRO
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">Operations Control</p>
                </div>
              ) : null}
            </div>

            {/* Desktop Collapse Toggle Button (When expanded) */}


            {/* Mobile Close Button */}
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="rounded-xl p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Navigation Items (Scrollable) */}
          <div className={cn('flex-1 overflow-y-auto py-4 space-y-6', collapsed ? 'px-2.5' : 'px-4')}>
            {navGroups.map((group) => {
              const allowedItems = group.items.filter(
                (item) => session?.role && canAccessPath(session.role, item.to),
              )
              if (!allowedItems.length) return null

              return (
                <div key={group.category} className="space-y-1">
                  {!collapsed ? (
                    <p className="px-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 truncate">
                      {group.category}
                    </p>
                  ) : (
                    <div
                      className="mx-2 my-2 border-t border-slate-200 dark:border-slate-800"
                      title={group.category}
                    />
                  )}
                  <div className="mt-1 space-y-1">
                    {allowedItems.map((item) => {
                      const Icon = item.icon
                      const badgeCount = item.badgeKey === 'pendingBookings' ? metrics?.pendingBookings : null

                      return (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          title={collapsed ? item.label : undefined}
                          className={({ isActive }) =>
                            cn(
                              'group relative flex items-center rounded-2xl transition-all duration-150',
                              collapsed ? 'justify-center p-2.5' : 'justify-between px-3.5 py-2.5 text-sm font-semibold',
                              isActive
                                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25 dark:bg-primary-600'
                                : 'text-slate-700 hover:bg-slate-100 hover:text-[#171717] dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <div className={cn('flex items-center', collapsed ? 'justify-center' : 'gap-3')}>
                                <Icon
                                  className={cn(
                                    'shrink-0 transition-colors',
                                    collapsed ? 'size-5' : 'size-4.5',
                                    isActive
                                      ? 'text-white'
                                      : 'text-slate-500 group-hover:text-slate-800 dark:text-slate-400 dark:group-hover:text-slate-200',
                                  )}
                                />
                                {!collapsed ? <span className="truncate">{item.label}</span> : null}
                              </div>
                              {badgeCount && badgeCount > 0 ? (
                                collapsed ? (
                                  <span
                                    className="absolute top-1.5 right-1.5 size-2 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900"
                                    title={`${badgeCount} pending`}
                                  />
                                ) : (
                                  <span
                                    className={cn(
                                      'rounded-full px-2 py-0.5 text-[11px] font-bold border',
                                      isActive
                                        ? 'bg-white/20 text-white border-white/30'
                                        : 'bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800',
                                    )}
                                  >
                                    {badgeCount}
                                  </span>
                                )
                              ) : null}
                            </>
                          )}
                        </NavLink>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          {/* User Profile & Actions Footer */}
          <div
            className={cn(
              'shrink-0 border-t border-[#E5E7EB] dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 transition-all duration-300',
              collapsed ? 'p-2' : 'p-4',
            )}
          >
            {!collapsed ? (
              <div className="flex items-center justify-between rounded-2xl border border-slate-300 bg-white p-3 dark:border-slate-800 dark:bg-slate-900 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7E1926] to-[#C86A37] text-white font-bold text-sm shadow-xs">
                    {session?.name ? session.name[0].toUpperCase() : 'A'}
                    <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-[#171717] dark:text-white">
                      {session?.name || 'Administrator'}
                    </p>
                    <p className="truncate text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {formatRoleLabel(session?.role)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                    className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                  >
                    {theme === 'dark' ? <SunMedium className="size-4" /> : <MoonStar className="size-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    title="Logout"
                  >
                    <LogOut className="size-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 py-1">
                <div
                  className="relative flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7E1926] to-[#C86A37] text-white font-bold text-sm shadow-xs cursor-pointer hover:scale-105 transition-transform"
                  title={`${session?.name || 'Administrator'} (${formatRoleLabel(session?.role)})`}
                  onClick={() => navigate('/platform-settings')}
                >
                  {session?.name ? session.name[0].toUpperCase() : 'A'}
                  <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                </div>
                <button
                  type="button"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                  title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
                >
                  {theme === 'dark' ? <SunMedium className="size-4.5" /> : <MoonStar className="size-4.5" />}
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-xl p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Logout"
                >
                  <LogOut className="size-4.5" />
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Right Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top Header Bar */}
          <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[#E5E7EB] bg-white/95 backdrop-blur-md px-4 sm:px-6 lg:px-8 dark:border-slate-800 dark:bg-slate-900/90 transition-colors">
            <div className="flex items-center gap-3">
              {/* Mobile Drawer Trigger */}
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="rounded-2xl p-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 lg:hidden"
              >
                <Menu className="size-6" />
              </button>

              {/* Desktop Sidebar Collapse / Expand Toggle */}
              <button
                type="button"
                onClick={toggleCollapsed}
                className="hidden lg:flex rounded-2xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {collapsed ? <PanelLeftOpen className="size-5" /> : <PanelLeftClose className="size-5" />}
              </button>

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-[#171717] dark:text-white">
                    {sectionTitle}
                  </h2>
                </div>
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <span>Home</span>
                  <span>/</span>
                  <span className="text-[#171717] dark:text-slate-200 font-bold">{sectionTitle}</span>
                </div>
              </div>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-3">
              {/* Search form */}
              <form onSubmit={handleGlobalSearch} className="relative hidden md:block w-64 lg:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500 dark:text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Quick jump (bookings, techs...)"
                  className="w-full rounded-2xl border border-slate-300 bg-slate-50 py-2 pl-9.5 pr-4 text-xs font-semibold text-[#171717] placeholder:text-slate-500 focus:border-primary-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-600/10 dark:border-slate-700 dark:bg-slate-950/60 dark:text-white dark:placeholder:text-slate-400"
                />
              </form>

              {/* Date Indicator Pill */}
              <div className="hidden xl:flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-[#171717] shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{currentDateFormatted}</span>
              </div>

              {/* Notification icon */}
              <NavLink
                to="/notifications"
                className="relative rounded-2xl border border-slate-300 bg-white p-2.5 text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-black dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                title="Notifications"
              >
                <Bell className="size-4.5" />
                {metrics?.pendingBookings > 0 ? (
                  <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
                    {metrics.pendingBookings}
                  </span>
                ) : null}
              </NavLink>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2.5 rounded-2xl border border-slate-300 bg-white p-1.5 pr-3 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                >
                  <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-[#7E1926] to-[#C86A37] text-white font-bold text-xs shadow-2xs">
                    {session?.name ? session.name[0].toUpperCase() : 'A'}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-extrabold text-[#171717] dark:text-white leading-tight">
                      {session?.name || 'Admin'}
                    </p>
                    <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                      {formatRoleLabel(session?.role)}
                    </p>
                  </div>
                  <ChevronDown className="size-3.5 text-slate-600 dark:text-slate-400" />
                </button>

                {userDropdown ? (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setUserDropdown(false)}
                    />
                    <div className="absolute right-0 mt-2 z-50 w-56 rounded-2xl border border-slate-300 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                      <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800">
                        <p className="text-xs font-bold text-[#171717] dark:text-white">{session?.name}</p>
                        <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300 truncate">{session?.email}</p>
                      </div>

                      <div className="py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdown(false)
                            navigate('/platform-settings')
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          <Settings className="size-3.5 text-slate-500 dark:text-slate-400" />
                          Platform Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setTheme(theme === 'dark' ? 'light' : 'dark')
                            setUserDropdown(false)
                          }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                        >
                          {theme === 'dark' ? <SunMedium className="size-3.5 text-slate-500 dark:text-slate-400" /> : <MoonStar className="size-3.5 text-slate-500 dark:text-slate-400" />}
                          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        </button>
                      </div>

                      <div className="border-t border-slate-200 dark:border-slate-800 pt-1">
                        <button
                          type="button"
                          onClick={logout}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          <LogOut className="size-3.5 text-rose-600" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </header>

          {/* Main Page Viewport */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1600px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
