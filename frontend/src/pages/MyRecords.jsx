import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import {
  Stethoscope,
  ArrowLeft,
  Loader2,
  Download,
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  Trash2,
} from 'lucide-react'
import { getPatientSession } from '../patientSession'

const API = '/api'

const STATUS_STYLE = {
  pending: { label: 'Under review', icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/25' },
  approved: { label: 'MC ready', icon: CheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/25' },
  escalated: { label: 'In-person visit', icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/25' },
}

export default function MyRecords() {
  const navigate = useNavigate()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloadingId, setDownloadingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const session = getPatientSession()

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await axios.get(`${API}/patient/consultations`, {
          params: { patient_id: session.id },
        })
        if (!cancelled) setList(res.data || [])
      } catch {
        if (!cancelled) setList([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [session?.id, navigate])

  async function deleteConsultation(id) {
    if (!window.confirm('Delete this consultation? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await axios.delete(`${API}/consultation/${id}`)
      setList(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Failed to delete. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  async function downloadMC(id) {
    setDownloadingId(id)
    try {
      const res = await axios.get(`${API}/consultation/${id}/mc.pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `MC_${id.slice(0, 8)}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      /* ignore */
    } finally {
      setDownloadingId(null)
    }
  }

  if (!session) return null

  return (
    <div className="h-dvh w-full bg-[#0d1117] flex flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 w-full grid-cols-1 [grid-template-rows:minmax(0,1fr)] justify-items-center">
        <div className="flex h-full min-h-0 w-full max-w-lg flex-col">
          <header className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-card">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={18} />
              <span className="text-sm">Back</span>
            </button>
            <Link to="/" className="text-xs text-blue-400 font-medium">
              New consultation
            </Link>
          </header>

          <div className="shrink-0 px-5 py-4 border-b border-white/[0.06] flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/90 flex items-center justify-center">
              <Stethoscope size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg leading-tight">My consultations</h1>
              <p className="text-slate-500 text-xs truncate">{session.name} · {session.email}</p>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3 pb-12">
            {loading && (
              <div className="flex justify-center py-16">
                <Loader2 size={32} className="animate-spin text-blue-400" />
              </div>
            )}

            {!loading && list.length === 0 && (
              <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-8 text-center space-y-3">
                <FileText size={36} className="mx-auto text-slate-600" />
                <p className="text-slate-400 text-sm">No consultations yet.</p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-1 text-blue-400 text-sm font-medium"
                >
                  Start a consultation <ChevronRight size={16} />
                </Link>
              </div>
            )}

            {!loading &&
              list.map((c) => {
                const st = STATUS_STYLE[c.status] || STATUS_STYLE.pending
                const Icon = st.icon
                const dateStr = c.created_at
                  ? new Date(c.created_at).toLocaleDateString('en-SG', { dateStyle: 'medium' })
                  : '—'
                const complaint = (c.chief_complaint || '').slice(0, 120) + ((c.chief_complaint || '').length > 120 ? '…' : '')

                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${st.bg} ${st.color}`}
                      >
                        <Icon size={12} />
                        {st.label}
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0">{dateStr}</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{complaint || '—'}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link
                        to={`/status/${c.id}`}
                        state={{ consultation: c }}
                        className="text-xs font-medium text-blue-400 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20"
                      >
                        View details
                      </Link>
                      {c.status === 'approved' && (
                        <button
                          type="button"
                          onClick={() => downloadMC(c.id)}
                          disabled={downloadingId === c.id}
                          className="text-xs font-medium text-emerald-300 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 inline-flex items-center gap-1.5 disabled:opacity-50"
                        >
                          {downloadingId === c.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Download size={14} />
                          )}
                          Download MC
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteConsultation(c.id)}
                        disabled={deletingId === c.id}
                        className="ml-auto text-xs font-medium text-red-400/70 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/15 inline-flex items-center gap-1.5 disabled:opacity-50 hover:bg-red-500/10 hover:text-red-400 transition-colors"
                      >
                        {deletingId === c.id ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      </div>
    </div>
  )
}
