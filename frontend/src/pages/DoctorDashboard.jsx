import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, CheckCircle, AlertTriangle, User, Stethoscope, LogOut, RefreshCw } from 'lucide-react'
import axios from 'axios'

const API = '/api'

const STATUS_STYLES = {
  pending: { label: 'Pending', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30', icon: Clock },
  approved: { label: 'Approved', color: 'text-green-400', bg: 'bg-green-500/20', border: 'border-green-500/30', icon: CheckCircle },
  escalated: { label: 'Escalated', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30', icon: AlertTriangle },
}

export default function DoctorDashboard() {
  const navigate = useNavigate()
  const [consultations, setConsultations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('doctor_auth')) {
      navigate('/doctor')
      return
    }
    fetchConsultations()
    const interval = setInterval(fetchConsultations, 15000)
    return () => clearInterval(interval)
  }, [])

  async function fetchConsultations() {
    try {
      const res = await axios.get(`${API}/consultations`)
      setConsultations(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function handleRefresh() {
    setRefreshing(true)
    fetchConsultations()
  }

  function handleLogout() {
    localStorage.removeItem('doctor_auth')
    navigate('/doctor')
  }

  const filtered = filter === 'all' ? consultations : consultations.filter(c => c.status === filter)
  const pendingCount = consultations.filter(c => c.status === 'pending').length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
            <Stethoscope size={18} className="text-white" />
          </div>
          <div>
            <span className="font-bold text-white">MediVoice</span>
            <span className="text-slate-400 text-xs ml-2">Doctor Dashboard</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {pendingCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {pendingCount} pending
            </span>
          )}
          <button onClick={handleRefresh} className="text-slate-400 hover:text-white transition-colors p-2">
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white transition-colors flex items-center gap-1.5 text-sm">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <div className="p-6 max-w-5xl mx-auto space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {['pending', 'approved', 'escalated'].map(s => {
            const cfg = STATUS_STYLES[s]
            const Icon = cfg.icon
            const count = consultations.filter(c => c.status === s).length
            return (
              <div key={s} className={`${cfg.bg} border ${cfg.border} rounded-2xl p-4 flex items-center gap-4`}>
                <Icon size={28} className={cfg.color} />
                <div>
                  <div className="text-2xl font-bold text-white">{count}</div>
                  <div className="text-xs text-slate-400 capitalize">{cfg.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'escalated'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize ${
                filter === f
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {f === 'all' ? `All (${consultations.length})` : `${STATUS_STYLES[f]?.label} (${consultations.filter(c => c.status === f).length})`}
            </button>
          ))}
        </div>

        {/* Consultation List */}
        {loading ? (
          <div className="text-center py-20 text-slate-500">Loading consultations...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <Stethoscope size={40} className="mx-auto mb-3 opacity-30" />
            <p>No consultations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(c => {
              const cfg = STATUS_STYLES[c.status] || STATUS_STYLES.pending
              const Icon = cfg.icon
              return (
                <div
                  key={c.id}
                  onClick={() => navigate(`/doctor/case/${c.id}`)}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white">{c.patient_name}</h3>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400">{c.doctor_type}</span>
                    </div>
                    <p className="text-sm text-slate-300 truncate">{c.chief_complaint}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(c.created_at).toLocaleString('en-SG')}
                    </p>
                  </div>

                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color} border ${cfg.border} flex-shrink-0`}>
                    <Icon size={12} />
                    {cfg.label}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
