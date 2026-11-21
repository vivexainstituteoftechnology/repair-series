import React, { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  ArrowUpRight,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  IndianRupee,
  Layers,
  Percent,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Wrench,
  Zap,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card, ProgressRing, RadialGauge, StatCard } from '../components/ui'
import { useApp } from '../context/useApp'
import {
  compactNumber,
  currency,
  formatDateTime,
  isBookingCompleted,
} from '../utils/helpers'
import { getStoredBookingTotalDeduction } from '../utils/bookingStoredAmounts'

export function DashboardPage() {
  const { bookings, customers, technicians, services, metrics, loading } = useApp()
  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'analytics' | 'revisits' | 'pulse'
  const [timeRange, setTimeRange] = useState('6m')

  // Revisit analytics
  const revisitAnalytics = useMemo(() => {
    const revisits = bookings.filter(
      (b) => b?.isRevisit === true || Boolean(b?.parentBookingId),
    )
    const statusOf = (b) => String(b.status || '').trim().toLowerCase()
    const completed = revisits.filter((b) => statusOf(b) === 'completed').length
    const failed = revisits.filter((b) =>
      ['failed', 'cancelled', 'canceled'].includes(statusOf(b)),
    ).length
    const serviceCounts = new Map()
    revisits.forEach((b) => {
      const name = String(b.serviceName || 'Standard Service').trim()
      serviceCounts.set(name, (serviceCounts.get(name) || 0) + 1)
    })
    const mostRevisitedServices = [...serviceCounts.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
      .slice(0, 5)

    return {
      total: revisits.length,
      pending: Math.max(0, revisits.length - completed - failed),
      completed,
      failed,
      mostRevisitedServices,
      rate: bookings.length ? Math.round((revisits.length / bookings.length) * 100) : 0,
    }
  }, [bookings])

  // Monthly Revenue & Earnings Chart Data (Dual-tone cylinder bars)
  const monthlyChartData = useMemo(() => {
    const now = new Date()
    const months = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1)
      return {
        key: `${d.getFullYear()}-${d.getMonth()}`,
        month: d.toLocaleString('en-US', { month: 'short' }),
        platformRevenue: 0,
        technicianPayouts: 0,
        totalBookings: 0,
      }
    })

    bookings.forEach((b) => {
      const raw = b.scheduledAt?.toDate?.() || b.dateTime || b.scheduledAt
      if (!raw) return
      const d = new Date(raw)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      const idx = months.findIndex((m) => m.key === key)
      if (idx >= 0) {
        months[idx].totalBookings += 1
        if (isBookingCompleted(b)) {
          const deduction = getStoredBookingTotalDeduction(b)
          months[idx].platformRevenue += deduction
          const techPayout = Number(b.technicianPayout || b.technicianShare || deduction * 0.8)
          months[idx].technicianPayouts += techPayout
        }
      }
    })

    return months
  }, [bookings])

  // Daily transactions for this week
  const dailyTransactions = useMemo(() => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const counts = [0, 0, 0, 0, 0, 0, 0]
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    bookings.forEach((b) => {
      const raw = b.scheduledAt?.toDate?.() || b.dateTime || b.scheduledAt || b.createdAt
      if (!raw) return
      const d = new Date(raw)
      if (d >= oneWeekAgo) {
        counts[d.getDay()] += 1
      }
    })

    return days.map((day, idx) => ({
      day,
      bookings: counts[idx],
    }))
  }, [bookings])

  // Category distribution rings
  const categoryBreakdown = useMemo(() => {
    const counts = new Map()
    bookings.forEach((b) => {
      const cat = String(b.categoryTitle || b.serviceCategoryTitle || b.categoryName || 'General').trim()
      counts.set(cat, (counts.get(cat) || 0) + 1)
    })
    const total = bookings.length || 1
    return [...counts.entries()]
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.min(100, Math.round((count / total) * 100)),
      }))
  }, [bookings])

  // Active / Verified Technicians count
  const verifiedTechCount = useMemo(() => {
    return technicians.filter(
      (t) => String(t.verificationStatus || '').toLowerCase() === 'verified',
    ).length
  }, [technicians])

  // Completion efficiency rate
  const completionRate = useMemo(() => {
    if (!metrics.totalBookings) return 0
    return Math.round((metrics.totalOrdersCompleted / metrics.totalBookings) * 100)
  }, [metrics])

  // Recent 6 bookings
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const aDate = new Date(a.scheduledAt?.toDate?.() || a.dateTime || a.scheduledAt || 0)
        const bDate = new Date(b.scheduledAt?.toDate?.() || b.dateTime || b.scheduledAt || 0)
        return bDate - aDate
      })
      .slice(0, 6)
  }, [bookings])

  return (
    <div className="space-y-6">
      {/* Top Banner & Tab Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Operations Command
            </h1>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Realtime
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Realtime monitoring across {customers.length} registered customers, {technicians.length} field technicians, and {metrics.totalBookings} service jobs.
          </p>
        </div>

        {/* View Switcher Tabs (Design reference 1) */}
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-2xl bg-slate-100 p-1 dark:bg-slate-800/80">
            {[
              { id: 'overview', label: 'Dashboard' },
              { id: 'analytics', label: 'Analytics' },
              { id: 'revisits', label: 'Revisits' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all duration-150 ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link to="/bookings">
            <Button variant="primary" size="sm" icon={Plus}>
              New Booking
            </Button>
          </Link>
        </div>
      </div>

      {/* AI / Quick Operational Pulse Strip (Design Reference 1) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#431407] via-[#540D17] to-slate-950 p-5 text-white shadow-lg">
        <div className="absolute right-0 top-0 -mt-8 -mr-8 size-48 rounded-full bg-[#C86A37]/25 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md text-[#FB923C] ring-1 ring-white/20">
              <Sparkles className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#FB923C]">
                  Operations Summary
                </span>
                <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 ring-1 ring-emerald-500/30">
                  {metrics.todaysBookings} jobs scheduled today
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-200">
                Platform revenue is currently at <strong className="text-white">{currency(metrics.platformEarnings)}</strong> with{' '}
                <strong className="text-white">{metrics.totalOrdersCompleted}</strong> successfully fulfilled bookings and{' '}
                <strong className="text-white">{metrics.pendingBookings}</strong> pending technician dispatch.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/bookings">
              <button className="rounded-xl bg-white/10 hover:bg-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors border border-white/15">
                Review Bookings
              </button>
            </Link>
            <Link to="/technicians">
              <button className="rounded-xl bg-primary-600 hover:bg-primary-500 px-3.5 py-1.5 text-xs font-semibold text-white transition-colors shadow-xs">
                Dispatch Technicians
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Row of Hero Stat Cards (Design Reference 2 & 3) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Platform Earnings"
          value={currency(metrics.platformEarnings)}
          change="+12.4%"
          isPositive={true}
          period="Lifetime"
          subvalue="From completed jobs"
          icon={IndianRupee}
          iconColor="primary"
        />

        <StatCard
          title="Completed Bookings"
          value={compactNumber(metrics.totalOrdersCompleted)}
          progress={completionRate}
          period="Total"
          subvalue={`${metrics.pendingBookings} in progress or pending`}
          change={`${completionRate}% completion`}
          isPositive={completionRate >= 50}
        />

        <StatCard
          title="Field Technicians"
          value={technicians.length}
          change={`${verifiedTechCount} Verified`}
          isPositive={true}
          period="Active"
          subvalue="Assigned to categories"
          icon={Wrench}
          iconColor="emerald"
        />

        <StatCard
          title="Customer Base"
          value={compactNumber(customers.length)}
          change="+9.2%"
          isPositive={true}
          period="Registered"
          subvalue="Across all service zones"
          icon={Users}
          iconColor="purple"
        />
      </div>

      {/* Main Grid: Left Section (Charts & Insights), Right Section (Gauges & Activity) */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left 2 Columns: Main Revenue Chart & Income Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Monthly Revenue Dual Bar Chart (Design Reference 1 & 3) */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Monthly Performance & Payouts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Platform earnings vs technician payouts across the last 6 months
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full bg-primary-600" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Platform Fee</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="size-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-600 dark:text-slate-300 font-medium">Technician Payout</span>
                </div>
              </div>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyChartData} barGap={6}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 12 }}
                    tickFormatter={(val) => `₹${compactNumber(val)}`}
                  />
                  <Tooltip
                    formatter={(val, name) => [
                      currency(val),
                      name === 'platformRevenue' ? 'Platform Earnings' : 'Technician Payouts',
                    ]}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '16px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar
                    dataKey="platformRevenue"
                    fill="#C86A37"
                    radius={[10, 10, 0, 0]}
                    name="platformRevenue"
                  />
                  <Bar
                    dataKey="technicianPayouts"
                    fill="#10B981"
                    radius={[10, 10, 0, 0]}
                    name="technicianPayouts"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Income Breakdown & Categories (Design Reference 3) */}
          <Card>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Demand & Service Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Service categories distribution by booking volume</p>
              </div>
              <Badge tone="info">Live Mix</Badge>
            </div>

            {categoryBreakdown.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {categoryBreakdown.map((item, idx) => {
                  const colors = ['#C86A37', '#7E1926', '#10B981', '#F59E0B', '#06B6D4']
                  return (
                    <div
                      key={item.name}
                      className="flex flex-col items-center text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                    >
                      <ProgressRing
                        percent={item.percent}
                        size={52}
                        strokeWidth={4.5}
                        color={colors[idx % colors.length]}
                      />
                      <span className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200 truncate w-full">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                        {item.count} orders
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 dark:text-slate-400">No service categories data yet.</p>
            )}
          </Card>

          {/* Recent Bookings Data Table (Design Reference 2) */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Recent Service Operations
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Latest active bookings and field progress</p>
              </div>
              <Link to="/bookings">
                <Button variant="ghost" size="sm">
                  View All Bookings
                </Button>
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3 pl-1">Booking</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3">Service</th>
                    <th className="pb-3">Scheduled</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right pr-1">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {loading.bookings ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                        Syncing bookings...
                      </td>
                    </tr>
                  ) : recentBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-xs text-slate-400">
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((b) => (
                      <tr key={b.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                        <td className="py-3 pl-1 font-mono text-xs font-bold text-slate-900 dark:text-white">
                          <Link to="/bookings" className="hover:text-primary-600 transition-colors">
                            {b.bookingCode || b.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex size-7 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 font-bold text-[10px] text-slate-700 dark:text-slate-300">
                              {(b.customerName || b.customerId || 'C')[0].toUpperCase()}
                            </div>
                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                              {b.customerName || 'Customer'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 text-xs text-slate-600 dark:text-slate-300 max-w-[160px] truncate">
                          {b.serviceName || 'Service'}
                        </td>
                        <td className="py-3 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatDateTime(b.scheduledAt?.toDate?.() || b.dateTime || b.scheduledAt)}
                        </td>
                        <td className="py-3">
                          <Badge
                            tone={
                              b.status === 'Completed'
                                ? 'success'
                                : ['Assigned', 'InProgress', 'Started'].includes(b.status)
                                ? 'info'
                                : ['Cancelled', 'Canceled'].includes(b.status)
                                ? 'danger'
                                : 'warning'
                            }
                            size="sm"
                          >
                            {b.status || 'New'}
                          </Badge>
                        </td>
                        <td className="py-3 pr-1 text-right font-semibold text-xs text-slate-900 dark:text-white">
                          {currency(b.totalAmount || b.estimatedPrice || b.amount || 0)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Gauges, Revisit Stats, Daily Activity */}
        <div className="space-y-6">
          {/* Target Efficiency Radial Gauge (Design Reference 2 & 3) */}
          <Card>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Service Fulfillment
              </h3>
              <Badge tone="success">90% Goal</Badge>
            </div>
            <RadialGauge
              percent={completionRate}
              label="Completion Rate"
              target="90%"
              subtext={`${metrics.totalOrdersCompleted} of ${metrics.totalBookings} orders`}
              growth={completionRate >= 50 ? '+3.4%' : '-1.2%'}
            />
          </Card>

          {/* Revisit Overview Card */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Revisit Lifecycle
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Free warranty revisit claims</p>
              </div>
              <Link to="/revisits">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5 dark:border-slate-800 dark:bg-slate-800/40">
                <span className="text-[11px] font-semibold uppercase text-slate-500 dark:text-slate-300">Total Revisits</span>
                <p className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
                  {revisitAnalytics.total}
                </p>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{revisitAnalytics.rate}% claim rate</span>
              </div>

              <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-3.5 dark:border-amber-900/30 dark:bg-amber-950/20">
                <span className="text-[11px] font-semibold uppercase text-amber-700 dark:text-amber-300">Pending</span>
                <p className="mt-1 text-xl font-extrabold text-amber-700 dark:text-amber-300">
                  {revisitAnalytics.pending}
                </p>
                <span className="text-[10px] text-amber-700 dark:text-amber-300/90 font-medium">Requires dispatch</span>
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-3.5 dark:border-emerald-900/30 dark:bg-emerald-950/20">
                <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-300">Completed</span>
                <p className="mt-1 text-xl font-extrabold text-emerald-700 dark:text-emerald-300">
                  {revisitAnalytics.completed}
                </p>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300/90 font-medium">Resolved successfully</span>
              </div>

              <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-3.5 dark:border-rose-900/30 dark:bg-rose-950/20">
                <span className="text-[11px] font-semibold uppercase text-rose-700 dark:text-rose-300">Failed / Drop</span>
                <p className="mt-1 text-xl font-extrabold text-rose-700 dark:text-rose-300">
                  {revisitAnalytics.failed}
                </p>
                <span className="text-[10px] text-rose-700 dark:text-rose-300/90 font-medium">Cancelled claims</span>
              </div>
            </div>

            {revisitAnalytics.mostRevisitedServices.length ? (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Most Claimed Services</span>
                <div className="mt-2 space-y-2">
                  {revisitAnalytics.mostRevisitedServices.slice(0, 3).map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-xs">
                      <span className="truncate max-w-[180px] font-medium text-slate-700 dark:text-slate-300">
                        {item.name}
                      </span>
                      <Badge tone="warning" size="sm">
                        {item.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </Card>

          {/* Daily Activity Sparkline / Weekly Pill Bars (Design Reference 1) */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Weekly Booking Rhythm
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Activity spread across last 7 days</p>
              </div>
              <Badge tone="info">This Week</Badge>
            </div>

            <div className="h-36 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyTransactions}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip
                    formatter={(val) => [`${val} Bookings`, 'Total']}
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="bookings" fill="#818CF8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
