import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertTriangle, Pill, Loader2, User, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'

const API = '/api'

const COMMON_MEDICINES = [
  'Paracetamol 500mg – every 6 hours as needed',
  'Ibuprofen 400mg – after meals, every 8 hours',
  'Loratadine 10mg – once daily for runny nose/allergy',
  'Chlorphenamine 4mg – once at night for allergy',
  'Dextromethorphan 15mg – every 6 hours for dry cough',
  'Guaifenesin 100mg – every 4 hours for wet cough',
  'Omeprazole 20mg – before meals for gastric',
  'Oral Rehydration Salts – for diarrhoea/vomiting',
  'Vitamin C 500mg – once daily for immune support',
]

export default function DoctorCase() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [consultation, setConsultation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [mcDays, setMcDays] = useState(2)
  const [doctorNotes, setDoctorNotes] = useState('')
  const [selectedMeds, setSelectedMeds] = useState([])
  const [customMed, setCustomMed] = useState('')
  const [showTranscript, setShowTranscript] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('doctor_auth')) {
      navigate('/doctor')
      return
    }
    fetchCase()
  }, [id])

  async function fetchCase() {
    try {
      const res = await axios.get(`${API}/consultation/${id}`)
      setConsultation(res.data)
    } catch {
      navigate('/doctor/dashboard')
    } finally {
      setLoading(false)
    }
  }

  function toggleMed(med) {
    setSelectedMeds(prev =>
      prev.includes(med) ? prev.filter(m => m !== med) : [...prev, med]
    )
  }

  function addCustomMed() {
    if (customMed.trim() && !selectedMeds.includes(customMed.trim())) {
      setSelectedMeds(prev => [...prev, customMed.trim()])
      setCustomMed('')
    }
  }

  async function handleApprove() {
    setSubmitting(true)
    try {
      await axios.patch(`${API}/consultation/${id}/approve`, {
        mc_duration_days: mcDays,
        doctor_notes: doctorNotes,
        medicine_recommendations: selectedMeds,
      })
      setDone(true)
    } catch (err) {
      alert('Failed to approve. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleEscalate() {
    setSubmitting(true)
    try {
      await axios.patch(`${API}/consultation/${id}/escalate`)
      setDone(true)
    } catch {
      alert('Failed to escalate. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 size={36} className="animate-spin text-blue-400" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 gap-5">
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <CheckCircle size={44} className="text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white">Decision Sent</h2>
        <p className="text-slate-400 text-sm text-center">Patient has been notified of your decision.</p>
        <button
          onClick={() => navigate('/doctor/dashboard')}
          className="bg-blue-600 active:bg-blue-700 text-white px-8 py-3.5 rounded-2xl font-semibold text-sm"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col max-w-lg mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
        <button onClick={() => navigate('/doctor/dashboard')} className="flex items-center gap-2 text-slate-400 text-sm">
          <ArrowLeft size={16} /> Queue
        </button>
        {consultation?.status !== 'pending' && (
          <span className={`text-xs px-3 py-1 rounded-full font-medium ${
            consultation.status === 'approved'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
          }`}>
            {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
          </span>
        )}
      </header>

      {/* Scrollable content — padded bottom so sticky bar doesn't cover */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-36">

        {/* Patient header */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              <User size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-white font-bold text-base">{consultation?.patient_name}</h2>
              <p className="text-slate-400 text-xs">{consultation?.doctor_type}</p>
            </div>
            <div className="flex items-center gap-1 text-slate-500 text-xs">
              <Clock size={11} />
              {new Date(consultation?.created_at).toLocaleString('en-SG', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InfoBox label="Complaint" value={consultation?.chief_complaint} />
            {consultation?.severity && <InfoBox label="Severity" value={`${consultation.severity}/10`} />}
            {consultation?.duration_days && <InfoBox label="Duration" value={`${consultation.duration_days} day(s)`} />}
            {consultation?.allergies && <InfoBox label="Allergies" value={consultation.allergies} />}
          </div>
          {consultation?.associated_symptoms?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {consultation.associated_symptoms.map((s, i) => (
                <span key={i} className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-1 rounded-full">
                  {s}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* AI Summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">AI Clinical Summary</p>
          <p className="text-slate-200 text-sm leading-relaxed">{consultation?.ai_summary}</p>
        </div>

        {/* Transcript */}
        {consultation?.transcript && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="flex items-center gap-2 text-blue-400 text-sm w-full"
            >
              {showTranscript ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showTranscript ? 'Hide' : 'View'} Transcript
            </button>
            {showTranscript && (
              <pre className="mt-3 text-xs text-slate-400 whitespace-pre-wrap font-mono bg-slate-950 rounded-lg p-3 max-h-52 overflow-y-auto border border-slate-800">
                {consultation.transcript}
              </pre>
            )}
          </div>
        )}

        {/* Only show decision form if pending */}
        {consultation?.status === 'pending' && (
          <>
            {/* MC Duration */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">MC Duration</p>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map(d => (
                  <button
                    key={d}
                    onClick={() => setMcDays(d)}
                    className={`py-3 rounded-xl text-sm font-semibold border transition-all active:scale-95 ${
                      mcDays === d
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    {d} Day{d > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicines */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Pill size={13} className="text-blue-400" /> Recommend Medicines
              </p>
              <div className="space-y-1">
                {COMMON_MEDICINES.map((med, i) => (
                  <label key={i} className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                    selectedMeds.includes(med) ? 'bg-blue-500/10' : ''
                  }`}>
                    <input
                      type="checkbox"
                      checked={selectedMeds.includes(med)}
                      onChange={() => toggleMed(med)}
                      className="mt-0.5 w-4 h-4 accent-blue-500 flex-shrink-0"
                    />
                    <span className={`text-xs leading-relaxed ${selectedMeds.includes(med) ? 'text-white' : 'text-slate-400'}`}>
                      {med}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customMed}
                  onChange={e => setCustomMed(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomMed()}
                  placeholder="Add custom medicine…"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button onClick={addCustomMed} className="bg-blue-600 active:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-xs font-medium">
                  Add
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes for Patient (optional)</p>
              <textarea
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                placeholder="Any instructions or follow-up advice…"
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
          </>
        )}
      </div>

      {/* Sticky bottom actions — only for pending */}
      {consultation?.status === 'pending' && (
        <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto px-4 pb-8 pt-4 bg-slate-950 border-t border-slate-800">
          <div className="flex gap-3">
            <button
              onClick={handleEscalate}
              disabled={submitting}
              className="flex-1 border border-orange-500/50 bg-orange-500/10 text-orange-400 active:bg-orange-500/20 py-4 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <AlertTriangle size={16} /> Escalate
            </button>
            <button
              onClick={handleApprove}
              disabled={submitting}
              className="flex-[2] bg-green-600 active:bg-green-700 text-white py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-green-900/40 disabled:opacity-40"
            >
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              Approve MC · {mcDays} day{mcDays > 1 ? 's' : ''}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-2.5">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-xs text-slate-200 leading-tight">{value}</p>
    </div>
  )
}
