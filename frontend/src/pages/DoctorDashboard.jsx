import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, AlertTriangle, User, Stethoscope, LogOut, RefreshCw, ChevronRight } from 'lucide-react'
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

  useEffect(() => {
    if (!localStorage.getItem('doctor_auth')) { navigate('/doctor'); return }
    fetchConsultations()
    const interval = setInterval(fetchConsultations, 15000)
    return () => clearInterval(interval)
  }, [])

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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-blue-950 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-slate-950/90 backdrop-blur z-10">
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
              className={`rounded-2xl p-3 text-center border transition-all active:scale-95 ${
                tab === s ? `${cfg.bg} ${cfg.border}` : 'bg-white/5 border-white/10'
              }`}
            >
              <div className={`text-2xl font-bold ${tab === s ? cfg.color : 'text-white'}`}>{count}</div>
              <div className={`text-xs mt-0.5 ${tab === s ? cfg.color : 'text-slate-500'} capitalize`}>{cfg.label}</div>
            </button>
          )
        })}
      </div>

      {/* Tab bar */}
      <div className="flex px-4 pt-4 gap-1.5">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all capitalize ${
              tab === t ? 'bg-blue-600 text-white' : 'bg-white/5 text-slate-400 border border-white/10'
            }`}
          >
            {STATUS_STYLES[t].label}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-8">
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
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-3 text-left active:bg-white/10 transition-all"
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

                <ChevronRight size={16} className="text-slate-600 flex-shrink-0" />
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
