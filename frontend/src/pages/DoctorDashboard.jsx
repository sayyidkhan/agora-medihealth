import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, AlertTriangle, User, Stethoscope, LogOut, RefreshCw, ChevronRight, Trash2, Loader2 } from 'lucide-react'
import axios from 'axios'

const API = '/api'

const STATUS_STYLES = {
  pending:   { label: 'Pending',   color: 'text-yellow-400', bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', dot: 'bg-yellow-400', icon: Clock },
  approved:  { label: 'Approved',  color: 'text-green-400',  bg: 'bg-green-500/15',  border: 'border-green-500/30',  dot: 'bg-green-400',  icon: CheckCircle },
  escalated: { label: 'Escalated', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', dot: 'bg-orange-400', icon: AlertTriangle },
}

const TABS = ['pending', 'approved', 'escalated']

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('pending')
  const [refreshing, setRefreshing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('doctor_auth')) { navigate('/doctor'); return }
    fetchConsultations()
    const interval = setInterval(fetchConsultations, 15000)
    return () => clearInterval(interval)
  }, [])

  async function deleteConsultation(e, id) {
    e.stopPropagation()
    if (!window.confirm('Delete this consultation? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await axios.delete(`${API}/consultation/${id}`)
      setConsultations(prev => prev.filter(c => c.id !== id))
    } catch {
      alert('Failed to delete. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  async function fetchConsultations() {
    try {
      const res = await axios.get(`${API}/consultations`)
      setConsultations(res.data)
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  const pendingCount = consultations.filter(c => c.status === 'pending').length
  const filtered = consultations.filter(c => c.status === tab)

  return (
    <div className="h-dvh w-full bg-[#0d1117] flex flex-col overflow-hidden">
    <div className="grid min-h-0 flex-1 w-full grid-cols-1 [grid-template-rows:minmax(0,1fr)] justify-items-center">
    <div className="flex h-full min-h-0 w-full max-w-lg flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-card sticky top-0 bg-[#0d1117] z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Stethoscope size={16} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white text-sm">MediVoice</span>
            <span className="text-slate-500 text-xs ml-1.5">Doctor</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
              {pendingCount}
            </span>
          )}
          <button onClick={() => { setRefreshing(true); fetchConsultations() }} className="p-2 text-slate-400">
            <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={() => { localStorage.removeItem('doctor_auth'); navigate('/doctor') }} className="p-2 text-slate-400">
            <LogOut size={15} />
          </button>
        </div>
      </header>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-4">
        {TABS.map(s => {
          const cfg = STATUS_STYLES[s]
          const count = consultations.filter(c => c.status === s).length
          return (
            <button
              key={s}
              onClick={() => setTab(s)}
              className={`rounded-xl p-3 text-center border transition-all active:scale-95 ${
                tab === s ? `${cfg.bg} ${cfg.border}` : 'bg-card border-card'
              }`}
            >
              <div className={`text-2xl font-bold ${tab === s ? cfg.color : 'text-white'}`}>{count}</div>
              <div className={`text-xs mt-0.5 ${tab === s ? cfg.color : 'text-slate-500'} capitalize`}>{cfg.label}</div>
            </button>
          )
        })}
      </div>

      {/* Tab bar */}
      <div className="flex px-4 pt-3 gap-1.5">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-card text-slate-500 border border-card'
            }`}
          >
            {STATUS_STYLES[t].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 pb-8">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-500 text-sm gap-2">
            <RefreshCw size={16} className="animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-600">
            <Stethoscope size={36} className="opacity-30" />
            <p className="text-sm">No {STATUS_STYLES[tab].label.toLowerCase()} consultations</p>
          </div>
        ) : (
          filtered.map(c => {
            const cfg = STATUS_STYLES[c.status] || STATUS_STYLES.pending
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/doctor/case/${c.id}`)}
                className="w-full bg-card border border-card rounded-xl p-4 flex items-center gap-3 text-left active:bg-card transition-all"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-white" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <span className="font-semibold text-white text-sm truncate">{c.patient_name}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{c.chief_complaint}</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {new Date(c.created_at).toLocaleString('en-SG', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => deleteConsultation(e, c.id)}
                  disabled={deletingId === c.id}
                  className="p-1.5 rounded-lg text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40 flex-shrink-0"
                  title="Delete consultation"
                >
                  {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
                <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
              </button>
            )
          })
        )}
      </div>
    </div>
    </div>
    </div>
  )
}
