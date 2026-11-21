import { useEffect, useState } from 'react'
import { collection, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { db } from '../firebase/config'
import { Button, Field, Input } from '../components/ui'
import { setDocumentReplace } from '../services/firestore'

export function WallPanelEmployeesPage() {
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ uid: '', name: '', phone: '', email: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'wallPanelEmployees'), (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  const save = async (e) => {
    e.preventDefault()
    const uid = String(form.uid || '').trim()
    const name = String(form.name || '').trim()
    if (!uid || !name) {
      toast.error('Firebase Auth UID and name are required')
      return
    }
    setBusy(true)
    try {
      await setDocumentReplace('wallPanelEmployees', uid, {
        name,
        phone: String(form.phone || '').trim(),
        email: String(form.email || '').trim(),
        active: true,
        department: 'wallPanel',
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
      toast.success('Employee saved — create matching adminUsers doc with role wallPanelEmployee and same UID')
      setForm({ uid: '', name: '', phone: '', email: '' })
    } catch (err) {
      toast.error(err?.message || 'Save failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6 p-1">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Wall Panel — Employees</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Document ID must match the employee&apos;s Firebase Auth UID. Add an{' '}
        <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 text-slate-800 dark:text-slate-200">adminUsers</code> profile with role{' '}
        <code className="rounded bg-slate-100 dark:bg-slate-800 px-1 text-slate-800 dark:text-slate-200">wallPanelEmployee</code>.
      </p>
      <form onSubmit={save} className="max-w-lg space-y-4 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xs">
        <Field label="Firebase UID">
          <Input value={form.uid} onChange={(e) => setForm((f) => ({ ...f, uid: e.target.value }))} required />
        </Field>
        <Field label="Name">
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
        </Field>
        <Field label="Email">
          <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
        </Field>
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save employee'}</Button>
      </form>
      <ul className="space-y-2 max-w-lg">
        {rows.map((r) => (
          <li key={r.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-800 dark:text-slate-200">
            <span className="font-semibold text-slate-900 dark:text-white">{r.name}</span> · {r.phone || r.email || r.id}
          </li>
        ))}
      </ul>
    </div>
  )
}
