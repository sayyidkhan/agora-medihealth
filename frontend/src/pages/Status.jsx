import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, AlertTriangle, Download, Pill, ArrowLeft, Loader2, RefreshCw, Phone } from 'lucide-react'
import axios from 'axios'

const API = '/api'

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/15',
    border: 'border-yellow-500/30',
    label: 'Under Review',
    desc: "A licensed doctor is reviewing your case. We'll notify you once they decide.",
    emoji: '⏳',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/15',
    border: 'border-green-500/30',
    label: 'MC Approved',
    desc: 'Your medical certificate has been approved by a licensed doctor.',
    emoji: '✅',
  },
  escalated: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/15',
    border: 'border-orange-500/30',
    label: 'In-Person Visit Required',
    desc: 'The doctor recommends an in-person examination for your condition.',
    emoji: '🏥',
  },
}

export default function Status() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [consultation, setConsultation] = useState(location.state?.consultation || null)
  const [loading, setLoading] = useState(!consultation)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!consultation) fetchConsultation()
    const interval = setInterval(fetchConsultation, 10000)
    return () => clearInterval(interval)
  }, [id])

  async function fetchConsultation() {
    try {
      const res = await axios.get(`${API}/consultation/${id}`)
      setConsultation(res.data)
    } catch {}
    finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  async function downloadMC() {
    const res = await axios.get(`${API}/consultation/${id}/mc.pdf`, { responseType: 'blob' })
    const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `MC_${id.slice(0, 8)}.pdf`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-blue-400" />
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center gap-4">
        <p className="text-slate-400">Consultation not found.</p>
        <button onClick={() => navigate('/')} className="bg-blue-600 text-white px-6 py-3 rounded-2xl text-sm">Go Home</button>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-blue-950">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-slate-950/80 backdrop-blur z-10">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 active:text-white transition-colors">
          <ArrowLeft size={18} />
          <span className="text-sm">Home</span>
        </button>
        {consultation.status === 'pending' && (
          <button
            onClick={() => { setRefreshing(true); fetchConsultation() }}
            className="text-slate-400 p-1.5"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
          </button>
        )}
      </header>

      <div className="px-4 py-6 max-w-lg mx-auto space-y-4 pb-12">
        {/* Big status hero */}
        <div className={`${cfg.bg} border ${cfg.border} rounded-3xl p-6 text-center space-y-2`}>
          <div className="text-5xl">{cfg.emoji}</div>
          <h2 className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</h2>
          <p className="text-slate-300 text-sm leading-relaxed">{cfg.desc}</p>
          {consultation.status === 'pending' && (
            <div className="flex items-center justify-center gap-1.5 text-slate-500 text-xs pt-1">
              <Loader2 size={11} className="animate-spin" />
              Auto-refreshing…
            </div>
          )}
        </div>

        {/* Summary card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
          <h3 className="font-semibold text-white text-sm">Consultation Details</h3>
          <div className="space-y-2">
            <Row label="Patient" value={consultation.patient_name} />
            <Row label="Doctor" value={consultation.doctor_type} />
            <Row label="Complaint" value={consultation.chief_complaint} />
            {consultation.severity && <Row label="Severity" value={`${consultation.severity}/10`} />}
            {consultation.duration_days && <Row label="Duration" value={`${consultation.duration_days} day(s)`} />}
            <Row label="Date" value={new Date(consultation.created_at).toLocaleDateString('en-SG', { dateStyle: 'medium' })} />
          </div>
        </div>

        {/* AI Summary */}
        {consultation.ai_summary && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <h3 className="font-semibold text-white text-sm mb-2">AI Clinical Summary</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{consultation.ai_summary}</p>
          </div>
        )}

        {/* Approved: MC */}
        {consultation.status === 'approved' && (
          <>
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 space-y-3">
              <h3 className="font-semibold text-green-400 text-sm">Medical Certificate</h3>
              <div className="space-y-2">
                <Row label="MC Duration" value={`${consultation.mc_duration_days} day(s)`} />
                {consultation.doctor_notes && <Row label="Doctor Notes" value={consultation.doctor_notes} />}
                <Row label="Approved" value={new Date(consultation.approved_at).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' })} />
              </div>
              <button
                onClick={downloadMC}
                className="w-full bg-green-600 active:bg-green-700 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-green-900/30"
              >
                <Download size={18} /> Download MC (PDF)
              </button>
            </div>

            {consultation.medicine_recommendations?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-white text-sm flex items-center gap-2">
                  <Pill size={16} className="text-blue-400" /> Recommended Medicines
                </h3>
                <ul className="space-y-2">
                  {consultation.medicine_recommendations.map((med, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span> {med}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {/* Escalated */}
        {consultation.status === 'escalated' && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-4 space-y-3">
            <h3 className="font-semibold text-orange-400 text-sm">Next Steps</h3>
            <p className="text-slate-300 text-sm">Visit your nearest polyclinic or GP clinic for an in-person examination.</p>
            <a
              href="tel:995"
              className="w-full bg-red-600/20 border border-red-500/30 text-red-400 py-3 rounded-2xl flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Phone size={16} /> Emergency: Call 995
            </a>
          </div>
        )}

        {/* New consultation */}
        <button
          onClick={() => navigate('/')}
          className="w-full border border-white/10 text-slate-400 py-3.5 rounded-2xl text-sm font-medium"
        >
          Start New Consultation
        </button>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500 text-sm flex-shrink-0">{label}</span>
      <span className="text-slate-200 text-sm text-right">{value}</span>
    </div>
  )
}
