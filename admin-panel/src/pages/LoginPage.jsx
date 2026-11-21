import React, { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Eye, EyeOff, LoaderCircle, Lock, Mail, ShieldCheck, Sparkles, Wrench } from 'lucide-react'
import { toast } from 'sonner'
import { useApp } from '../context/useApp'
import { Button, Card, Field, Input } from '../components/ui'
import { isFirebaseConfigured } from '../firebase/config'
import { getDefaultRoute } from '../utils/rbac'

export function LoginPage() {
  const { session, login, authLoading } = useApp()
  const [form, setForm] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] dark:bg-[#0B0F19]">
        <div className="flex flex-col items-center gap-3">
          <LoaderCircle className="size-9 animate-spin text-primary-600" />
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Checking credentials...</p>
        </div>
      </div>
    )
  }

  if (session) return <Navigate to={getDefaultRoute(session.role)} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!form.email || !form.password) {
      toast.error('Please enter both email and password.')
      return
    }

    try {
      setLoading(true)
      await login(form)
      toast.success('Signed in successfully!')
    } catch (error) {
      toast.error(error.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC] p-4 dark:bg-[#0B0F19]">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-2">
        {/* Left Visual Brand Column */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-[#3E1606] via-[#7E1926] to-[#0F172A] p-10 text-white lg:flex">
          <div className="absolute -left-20 -top-20 size-72 rounded-full bg-[#C86A37]/25 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 size-72 rounded-full bg-[#7E1926]/35 blur-3xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-3.5">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-white p-1.5 shadow-lg shadow-black/30">
                <img src="/logo.png" alt="RepairSeries Logo" className="size-9 object-contain" />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-tight">
                  Repair<span className="text-[#FB923C]">Series</span>
                </span>
                <p className="text-xs font-semibold uppercase tracking-wider text-[#FDBA74]">
                  Operations Portal
                </p>
              </div>
            </div>

            <div className="mt-16">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-[#FDBA74] backdrop-blur-md ring-1 ring-white/15">
                Enterprise Command Center
              </span>
              <h2 className="mt-4 text-3xl font-extrabold leading-tight !text-white text-white">
                Next-generation service operations and technician fleet management.
              </h2>
              <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                Seamlessly orchestrate bookings, assign certified technicians, manage dynamic catalog pricing, and review real-time financial settlements.
              </p>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-2 gap-3 pt-8">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <p className="text-lg font-bold text-white">100% Realtime</p>
              <p className="mt-0.5 text-xs text-slate-400">Instant Firestore event sync</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
              <p className="text-lg font-bold text-white">Role-Based Access</p>
              <p className="mt-0.5 text-xs text-slate-400">Multi-tier role security</p>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="flex flex-col justify-center p-8 sm:p-12">
          <div className="mb-8">
            <div className="flex items-center gap-3.5 mb-6">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-white p-2 shadow-md border border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                <img src="/logo.png" alt="RepairSeries Logo" className="size-10 object-contain" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Admin Authentication
                </h2>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Authorized Staff Access Only
                </p>
              </div>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Enter your authorized staff credentials to continue.
            </p>
          </div>

          {!isFirebaseConfigured ? (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-medium text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
              Firebase credentials not detected in environment. Please supply valid configuration in `.env` or `.env.local`.
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Staff Email" required>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <Input
                  type="email"
                  required
                  placeholder="admin@repairseries.in"
                  className="pl-10"
                  value={form.email}
                  onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
                />
              </div>
            </Field>

            <Field label="Password" required>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  className="pl-10 pr-10"
                  value={form.password}
                  onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                className="w-full justify-center text-sm font-bold shadow-md shadow-primary-600/25 py-3"
                loading={loading}
              >
                Sign In to Admin Workspace
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Protected by Enterprise Auth & Firestore RBAC. Unauthorized access is prohibited.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
