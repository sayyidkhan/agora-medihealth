import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Baby, Heart, Mic, ChevronRight, ShieldCheck } from 'lucide-react'

const DOCTOR_TYPES = [
  { id: 'gp', label: 'General Practitioner', desc: 'Flu, fever, cough, headache', icon: Stethoscope },
  { id: 'paeds', label: 'Paediatrician', desc: "Children's health & illness", icon: Baby },
  { id: 'womens', label: "Women's Health", desc: 'Gynaecology & general care', icon: Heart },
]

const VOICE_OPTIONS = [
  { id: 'female', label: 'Dr. Sarah', emoji: '👩‍⚕️' },
  { id: 'male', label: 'Dr. James', emoji: '👨‍⚕️' },
  { id: 'premium_female', label: 'Dr. Serena ✨', emoji: '👩‍⚕️' },
  { id: 'premium_male', label: 'Dr. Daniel ✨', emoji: '👨‍⚕️' },
]

export default function Landing() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [doctorType, setDoctorType] = useState('gp')
  const [voiceType, setVoiceType] = useState('female')
  const [prePrompt, setPrePrompt] = useState('')
  const [error, setError] = useState('')

  const handleStart = () => {
    if (!name.trim()) return setError('Please enter your name')
    if (!prePrompt.trim()) return setError('Please briefly describe your symptoms')
    setError('')
    const selectedDoctor = DOCTOR_TYPES.find(d => d.id === doctorType)
    navigate('/consult', {
      state: {
        name: name.trim(),
        doctorType: selectedDoctor.label,
        voiceType,
        prePrompt: prePrompt.trim(),
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-slate-800 sticky top-0 bg-slate-950 z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
            <Stethoscope size={15} className="text-white" />
          </div>
          <span className="text-base font-bold text-white">MediVoice</span>
        </div>
        <button
          onClick={() => navigate('/doctor')}
          className="text-xs text-slate-400 border border-slate-700 px-3 py-1.5 rounded-lg"
        >
          Doctor Login
        </button>
      </header>

      <div className="flex-1 px-5 py-6 max-w-lg mx-auto w-full space-y-5">
        {/* Hero */}
        <div className="text-center space-y-2 pb-1">
          <div className="inline-flex items-center gap-1.5 bg-blue-600/20 text-blue-400 text-xs px-3 py-1.5 rounded-full">
            <Mic size={11} />
            AI Voice Consultation
          </div>
          <h1 className="text-3xl font-extrabold text-white leading-tight tracking-tight">
            See a doctor.<br />
            <span className="text-blue-400">From your phone.</span>
          </h1>
          <p className="text-slate-500 text-sm">
            Talk to our AI, get reviewed by a licensed GP, receive your MC digitally.
          </p>
        </div>

        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Your name</label>
          <input
            type="text"
            value={name}
            onChange={e => { setName(e.target.value); setError('') }}
            placeholder="e.g. Sayyid Khan"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all text-base"
          />
        </div>

        {/* Doctor Type */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Doctor type</label>
          <div className="grid grid-cols-3 gap-2">
            {DOCTOR_TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setDoctorType(id)}
                className={`p-3 rounded-xl border text-center transition-all active:scale-95 ${
                  doctorType === id
                    ? 'border-blue-500 bg-blue-600/20 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                <Icon size={20} className={`mx-auto mb-1.5 ${doctorType === id ? 'text-blue-400' : 'text-slate-600'}`} />
                <div className="font-medium text-xs leading-tight">{label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Doctor voice</label>
          <div className="grid grid-cols-2 gap-2">
            {VOICE_OPTIONS.map(({ id, label, emoji }) => (
              <button
                key={id}
                onClick={() => setVoiceType(id)}
                className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all active:scale-95 ${
                  voiceType === id
                    ? 'border-purple-500 bg-purple-600/20 text-white'
                    : 'border-slate-700 bg-slate-900 text-slate-400'
                }`}
              >
                <span className="text-xl">{emoji}</span>
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Symptoms */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-300">Describe your symptoms</label>
          <textarea
            value={prePrompt}
            onChange={e => { setPrePrompt(e.target.value); setError('') }}
            placeholder="e.g. Runny nose, mild fever and sore throat since yesterday..."
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all resize-none text-base"
          />
        </div>

        {error && <p className="text-red-400 text-sm text-center -mt-1">{error}</p>}

        {/* CTA */}
        <button
          onClick={handleStart}
          className="w-full bg-blue-600 active:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 text-base shadow-lg shadow-blue-900/50"
        >
          <Mic size={18} />
          Start Consultation
        </button>

        <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs pb-4">
          <ShieldCheck size={13} />
          <span>Emergency? Call <span className="text-slate-500 font-semibold">995</span></span>
        </div>
      </div>
    </div>
  )
}
