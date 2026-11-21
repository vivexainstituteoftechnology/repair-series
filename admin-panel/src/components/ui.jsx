import React from 'react'
import { Search, X, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { cn } from '../utils/helpers'

export function PageHeader({ title, description, actions, badge }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-2">
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h1>
          {badge ? (
            <span className="rounded-full bg-primary-50 dark:bg-primary-950/60 px-2.5 py-0.5 text-xs font-bold text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-800/80">
              {badge}
            </span>
          ) : null}
        </div>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 font-medium max-w-2xl leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2.5 shrink-0">{actions}</div> : null}
    </div>
  )
}

export function Card({ className, children, hover = false, ...props }) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-[0_4px_20px_-2px_rgba(15,23,42,0.03)] dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none dark:text-slate-100',
        hover && 'transition-all duration-200 hover:shadow-[0_10px_30px_-4px_rgba(15,23,42,0.08)] hover:border-slate-300 dark:hover:border-slate-700',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function StatCard({
  title,
  value,
  subvalue,
  change,
  isPositive = true,
  icon: Icon,
  iconColor = 'primary',
  progress,
  period,
  actions,
  className,
}) {
  const iconColors = {
    primary: 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800',
    copper: 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800',
    maroon: 'bg-[#FDF2F4] text-[#7E1926] dark:bg-[#540D17]/40 dark:text-[#F9CFD7] border border-[#F9CFD7] dark:border-[#7E1926]',
    indigo: 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
    purple: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border border-purple-200 dark:border-purple-800',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400 border border-sky-200 dark:border-sky-800',
    rose: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800',
  }

  return (
    <Card className={cn('relative overflow-hidden group', className)} hover>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              {title}
            </span>
            {period ? (
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {period}
              </span>
            ) : null}
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white pt-1">
            {value}
          </div>
        </div>

        {progress != null ? (
          <ProgressRing percent={progress} color={iconColor === 'emerald' ? '#059669' : '#C86A37'} />
        ) : Icon ? (
          <div className={cn('flex size-11 shrink-0 items-center justify-center rounded-2xl transition-transform group-hover:scale-105 shadow-2xs', iconColors[iconColor] || iconColors.primary)}>
            <Icon className="size-5.5" />
          </div>
        ) : null}
      </div>

      {(change != null || subvalue) ? (
        <div className="mt-4 flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-3 text-xs">
          {change != null ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-bold rounded-full px-2.5 py-0.5 border',
                isPositive
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                  : 'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
              )}
            >
              {isPositive ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
              {change}
            </span>
          ) : null}
          {subvalue ? (
            <span className="text-slate-600 dark:text-slate-300 font-semibold ml-auto">
              {subvalue}
            </span>
          ) : null}
        </div>
      ) : null}

      {actions ? <div className="mt-3">{actions}</div> : null}
    </Card>
  )
}

export function ProgressRing({ percent = 0, size = 48, strokeWidth = 4.5, color = '#C86A37' }) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, percent))
  const strokeDashoffset = circumference - (clamped / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-800"
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.5s ease-out' }}
        />
      </svg>
      <span className="absolute text-xs font-black text-slate-900 dark:text-white">
        {Math.round(clamped)}%
      </span>
    </div>
  )
}

export function RadialGauge({
  percent = 82,
  label = 'Target level',
  target = '90%',
  subtext = 'Your performance is significantly improved',
  growth = '+2.5%',
}) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="flex flex-col items-center justify-center p-2 text-center">
      <div className="relative flex items-center justify-center h-28 w-48 overflow-hidden">
        <div className="absolute inset-x-0 bottom-0 flex justify-center items-end h-24">
          <svg viewBox="0 0 100 55" className="w-44 h-24">
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="7.5"
              strokeLinecap="round"
              className="dark:stroke-slate-800"
            />
            <path
              d="M 10 50 A 40 40 0 0 1 90 50"
              fill="none"
              stroke="url(#radialGradient)"
              strokeWidth="7.5"
              strokeLinecap="round"
              strokeDasharray="125.6"
              strokeDashoffset={125.6 - (clamped / 100) * 125.6}
              style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
            />
            <defs>
              <linearGradient id="radialGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FB923C" />
                <stop offset="100%" stopColor="#C86A37" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="absolute bottom-1 flex flex-col items-center">
          <span className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            {percent}%
          </span>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            {label}: <strong className="text-slate-900 dark:text-white font-extrabold">{target}</strong>
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between w-full pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <span className="truncate pr-2 font-medium">{subtext}</span>
        {growth ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 shrink-0">
            <ArrowUpRight className="size-3" />
            {growth}
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function Button({
  children,
  className,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  icon: Icon,
  ...props
}) {
  const variants = {
    primary:
      'bg-primary-600 text-white shadow-sm hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-2 focus-visible:ring-primary-500/40 dark:bg-primary-600 dark:hover:bg-primary-500 font-semibold',
    secondary:
      'bg-slate-900 text-white hover:bg-slate-800 active:bg-slate-950 dark:bg-slate-800 dark:text-white dark:border dark:border-slate-700 dark:hover:bg-slate-700 font-semibold',
    outline:
      'border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800 font-semibold',
    ghost:
      'text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white font-semibold',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm focus-visible:ring-2 focus-visible:ring-rose-500/40 font-semibold',
    success:
      'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 font-semibold',
    maroon:
      'bg-[#7E1926] text-white hover:bg-[#6B131E] active:bg-[#540D17] shadow-sm focus-visible:ring-2 focus-visible:ring-[#7E1926]/40 font-semibold',
  }

  const sizes = {
    sm: 'rounded-xl px-3 py-1.5 text-xs font-semibold gap-1.5',
    md: 'rounded-2xl px-4 py-2.5 text-sm font-semibold gap-2',
    lg: 'rounded-2xl px-5 py-3 text-base font-semibold gap-2.5',
    icon: 'size-10 rounded-2xl p-0 flex items-center justify-center',
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center transition-all duration-150 select-none outline-none disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" /> : Icon ? <Icon className="size-4 shrink-0" /> : null}
      {children}
    </button>
  )
}

export function Badge({ children, tone = 'neutral', size = 'md', className }) {
  const tones = {
    neutral:
      'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
    primary:
      'bg-primary-50 text-primary-800 border-primary-200 dark:bg-primary-950/80 dark:text-primary-300 dark:border-primary-800',
    maroon:
      'bg-[#FDF2F4] text-[#7E1926] border-[#F9CFD7] dark:bg-[#540D17]/80 dark:text-[#F9CFD7] dark:border-[#7E1926]',
    copper:
      'bg-primary-50 text-primary-800 border-primary-200 dark:bg-primary-950/80 dark:text-primary-300 dark:border-primary-800',
    success:
      'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
    warning:
      'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
    danger:
      'bg-rose-50 text-rose-800 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
    info:
      'bg-sky-50 text-sky-800 border-sky-300 dark:bg-sky-950/60 dark:text-sky-300 dark:border-sky-800',
    indigo:
      'bg-primary-50 text-primary-800 border-primary-200 dark:bg-primary-950/80 dark:text-primary-300 dark:border-primary-800',
    purple:
      'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  }

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px]',
    md: 'px-2.5 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-bold rounded-full border',
        tones[tone] || tones.neutral,
        sizes[size],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className, onClear }) {
  return (
    <div
      className={cn(
        'relative flex items-center rounded-2xl border border-slate-300 bg-white shadow-xs transition-colors focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-600/10 dark:border-slate-700 dark:bg-slate-900',
        className,
      )}
    >
      <Search className="ml-3.5 size-4 text-slate-500 dark:text-slate-400 shrink-0 pointer-events-none" />
      <input
        type="text"
        className="w-full bg-transparent px-3 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-white dark:placeholder:text-slate-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value ? (
        <button
          type="button"
          onClick={() => {
            onChange('')
            onClear?.()
          }}
          className="mr-3 rounded-full p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:text-slate-400"
        >
          <X className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

export function Modal({ open, title, onClose, children, className, bodyClassName, footer }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 sm:p-5">
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 flex max-h-[92vh] w-full max-w-2xl flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100',
          className,
        )}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6 py-4.5">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className={cn('min-h-0 flex-1 overflow-y-auto p-6 text-slate-800 dark:text-slate-200', bodyClassName)}>
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/60 rounded-b-3xl">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}

export function Field({ label, description, error, children, required = false, className }) {
  return (
    <label className={cn('grid gap-1.5 text-sm font-semibold text-slate-900 dark:text-slate-200', className)}>
      <span className="flex items-center justify-between">
        <span>
          {label}
          {required ? <span className="text-rose-600 ml-0.5">*</span> : null}
        </span>
      </span>
      {children}
      {description ? <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{description}</span> : null}
      {error ? <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">{error}</span> : null}
    </label>
  )
}

export function Input(props) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 placeholder:text-slate-500 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-primary-500',
        props.className,
      )}
    />
  )
}

export function Select(props) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-primary-500',
        props.className,
      )}
    />
  )
}

export function Textarea(props) {
  return (
    <textarea
      {...props}
      className={cn(
        'min-h-24 w-full rounded-2xl border border-slate-300 bg-white p-3.5 text-sm font-medium text-slate-900 placeholder:text-slate-500 transition-colors focus:border-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-600/10 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:placeholder:text-slate-400 dark:focus:border-primary-500',
        props.className,
      )}
    />
  )
}

export function EmptyState({
  icon: Icon,
  title = 'No records found',
  description = 'There are no items to display right now.',
  action,
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center dark:border-slate-800 dark:bg-slate-900/30">
      {Icon ? (
        <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 mb-4">
          <Icon className="size-7" />
        </div>
      ) : null}
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h3>
      <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400 max-w-sm">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
