import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, AlertTriangle, Pill, Loader2, User, Clock } from 'lucide-react'
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
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-blue-400" />
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <CheckCircle size={56} className="text-green-400 mx-auto" />
          <h2 className="text-2xl font-bold text-white">Decision Submitted</h2>
          <p className="text-slate-400">The patient has been notified.</p>
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor/dashboard')}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">Case Review</h1>
            <p className="text-slate-400 text-sm">ID: {id.slice(0, 8)}...</p>
          </div>
          {consultation?.status !== 'pending' && (
            <span className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
              consultation.status === 'approved'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {consultation.status.charAt(0).toUpperCase() + consultation.status.slice(1)}
            </span>
          )}
        </div>

        {/* Patient Info */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-lg">{consultation?.patient_name}</h2>
              <p className="text-slate-400 text-sm">{consultation?.doctor_type}</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5 text-slate-400 text-sm">
              <Clock size={14} />
              {new Date(consultation?.created_at).toLocaleString('en-SG')}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <InfoBox label="Chief Complaint" value={consultation?.chief_complaint} />
            {consultation?.severity && <InfoBox label="Severity" value={`${consultation.severity}/10`} />}
            {consultation?.duration_days && <InfoBox label="Duration" value={`${consultation.duration_days} day(s)`} />}
            {consultation?.allergies && <InfoBox label="Allergies" value={consultation.allergies} />}
            {consultation?.current_medications && <InfoBox label="Current Meds" value={consultation.current_medications} />}
          </div>

          {consultation?.associated_symptoms?.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Associated Symptoms</p>
              <div className="flex flex-wrap gap-2">
                {consultation.associated_symptoms.map((s, i) => (
                  <span key={i} className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-500/30">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* AI Summary */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h3 className="font-semibold text-white mb-3">AI Clinical Summary</h3>
          <p className="text-slate-300 text-sm leading-relaxed">{consultation?.ai_summary}</p>
        </div>

        {/* Transcript Toggle */}
        {consultation?.transcript && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-blue-400 text-sm hover:text-blue-300 transition-colors"
            >
              {showTranscript ? 'Hide' : 'Show'} Full Transcript
            </button>
            {showTranscript && (
              <pre className="mt-4 text-xs text-slate-400 whitespace-pre-wrap font-mono bg-black/30 rounded-xl p-4 max-h-60 overflow-y-auto">
                {consultation.transcript}
              </pre>
            )}
          </div>
        )}

        {/* Only show actions if still pending */}
        {consultation?.status === 'pending' && (
          <>
            {/* MC Duration */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-white">MC Duration</h3>
              <div className="flex gap-3">
                {[1, 2, 3].map(d => (
                  <button
                    key={d}
                    onClick={() => setMcDays(d)}
                    className={`flex-1 py-3 rounded-xl text-sm font-medium border transition-all ${
                      mcDays === d
                        ? 'bg-blue-600 border-blue-500 text-white'
                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/30'
                    }`}
                  >
                    {d} Day{d > 1 ? 's' : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Medicine Recommendations */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Pill size={18} className="text-blue-400" /> Medicine Recommendations
              </h3>
              <div className="space-y-2">
                {COMMON_MEDICINES.map((med, i) => (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={selectedMeds.includes(med)}
                      onChange={() => toggleMed(med)}
                      className="mt-0.5 w-4 h-4 accent-blue-500"
                    />
                    <span className={`text-sm ${selectedMeds.includes(med) ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'} transition-colors`}>
                      {med}
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customMed}
                  onChange={e => setCustomMed(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomMed()}
                  placeholder="Add custom medicine..."
                  className="flex-1 bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={addCustomMed}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Doctor Notes */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-3">
              <h3 className="font-semibold text-white">Doctor Notes (optional)</h3>
              <textarea
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                placeholder="Any additional notes for the patient..."
                rows={3}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleEscalate}
                disabled={submitting}
                className="flex-1 border border-orange-500/50 text-orange-400 hover:bg-orange-500/10 py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <AlertTriangle size={18} />
                Escalate to In-Person
              </button>
              <button
                onClick={handleApprove}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-500 text-white py-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {submitting ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                Approve MC ({mcDays} day{mcDays > 1 ? 's' : ''})
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function InfoBox({ label, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-1">{label}</p>
      <p className="text-sm text-slate-200">{value}</p>
    </div>
  )
}
