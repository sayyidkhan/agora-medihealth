import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, Clock, AlertTriangle, Download, Pill, MapPin, ArrowLeft, Loader2 } from 'lucide-react'
import axios from 'axios'

const API = '/api'

const STATUS_CONFIG = {
  pending: {
    icon: Clock,
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/30',
    label: 'Under Review',
    desc: 'A licensed doctor is reviewing your consultation. You\'ll be notified once they\'ve made a decision.',
  },
  approved: {
    icon: CheckCircle,
    color: 'text-green-400',
    bg: 'bg-green-500/20',
    border: 'border-green-500/30',
    label: 'MC Approved',
    desc: 'Your medical certificate has been approved by a licensed doctor.',
  },
  escalated: {
    icon: AlertTriangle,
    color: 'text-orange-400',
    bg: 'bg-orange-500/20',
    border: 'border-orange-500/30',
    label: 'In-Person Visit Required',
    desc: 'Our doctor has reviewed your case and recommends an in-person visit for proper examination.',
  },
}

export default function Status() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const [consultation, setConsultation] = useState(location.state?.consultation || null)
  const [loading, setLoading] = useState(!consultation)

  useEffect(() => {
    if (!consultation) fetchConsultation()
    const interval = setInterval(fetchConsultation, 10000)
    return () => clearInterval(interval)
  }, [id])

  async function fetchConsultation() {
    try {
      const res = await axios.get(`${API}/consultation/${id}`)
      setConsultation(res.data)
      setLoading(false)
    } catch {
      setLoading(false)
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-400" />
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p>Consultation not found.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-blue-400 underline">Go home</button>
        </div>
      </div>
    )
  }

  const cfg = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.pending
  const StatusIcon = cfg.icon

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back */}
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
          <ArrowLeft size={16} /> Back to Home
        </button>

        {/* Status Card */}
        <div className={`${cfg.bg} border ${cfg.border} rounded-2xl p-6`}>
          <div className="flex items-start gap-4">
            <StatusIcon size={32} className={cfg.color} />
            <div>
              <h2 className={`text-xl font-bold ${cfg.color}`}>{cfg.label}</h2>
              <p className="text-slate-300 mt-1 text-sm">{cfg.desc}</p>
            </div>
          </div>
          {consultation.status === 'pending' && (
            <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm">
              <Loader2 size={14} className="animate-spin" />
              Auto-refreshing every 10 seconds...
            </div>
          )}
        </div>

        {/* Patient Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <h3 className="font-semibold text-white">Consultation Summary</h3>
          <div className="space-y-2 text-sm">
            <Row label="Patient" value={consultation.patient_name} />
            <Row label="Doctor Type" value={consultation.doctor_type} />
            <Row label="Chief Complaint" value={consultation.chief_complaint} />
            {consultation.severity && <Row label="Severity" value={`${consultation.severity}/10`} />}
            {consultation.duration_days && <Row label="Duration" value={`${consultation.duration_days} day(s)`} />}
            <Row label="Date" value={new Date(consultation.created_at).toLocaleDateString('en-SG', { dateStyle: 'long' })} />
          </div>
        </div>

        {/* AI Summary */}
        {consultation.ai_summary && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-semibold text-white mb-3">AI Clinical Summary</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{consultation.ai_summary}</p>
          </div>
        )}

        {/* Approved: MC + Medicine */}
        {consultation.status === 'approved' && (
          <>
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-green-400">Medical Certificate</h3>
              <div className="space-y-2 text-sm">
                <Row label="MC Duration" value={`${consultation.mc_duration_days} day(s)`} />
                {consultation.doctor_notes && <Row label="Doctor Notes" value={consultation.doctor_notes} />}
                <Row label="Approved On" value={new Date(consultation.approved_at).toLocaleString('en-SG')} />
              </div>
              <button
                onClick={downloadMC}
                className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium transition-colors"
              >
                <Download size={18} /> Download MC (PDF)
              </button>
            </div>

            {consultation.medicine_recommendations?.length > 0 && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                <h3 className="font-semibold text-white flex items-center gap-2">
                  <Pill size={18} className="text-blue-400" /> Medicine Recommendations
                </h3>
                <ul className="space-y-2">
                  {consultation.medicine_recommendations.map((med, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-blue-400 mt-0.5">•</span> {med}
                    </li>
                  ))}
                </ul>
                <button className="w-full border border-blue-500/50 text-blue-400 py-3 rounded-xl flex items-center justify-center gap-2 text-sm hover:bg-blue-500/10 transition-colors">
                  <MapPin size={16} /> Find Nearest Pharmacy
                </button>
              </div>
            )}
          </>
        )}

        {/* Escalated */}
        {consultation.status === 'escalated' && (
          <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 space-y-3">
            <h3 className="font-semibold text-orange-400">Next Steps</h3>
            <p className="text-slate-300 text-sm">Please visit your nearest polyclinic or GP clinic for an in-person examination.</p>
            <p className="text-slate-400 text-sm">For emergencies, call <span className="text-white font-bold">995</span> or go to A&amp;E immediately.</p>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="text-slate-200 text-right max-w-[60%]">{value}</span>
    </div>
  )
}
