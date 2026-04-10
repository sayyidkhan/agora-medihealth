import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, ArrowLeft, Delete } from 'lucide-react'

const PINPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function DoctorLogin() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [shaking, setShaking] = useState(false)

  const handleKey = (key) => {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1))
      setError('')
      return
    }
    if (pin.length >= 4) return
    const next = pin + key
    setPin(next)
    if (next.length === 4) {
      setTimeout(() => {
        if (next === '1234') {
          localStorage.setItem('doctor_auth', 'true')
          navigate('/doctor/dashboard')
        } else {
          setShaking(true)
          setError('Incorrect PIN')
          setPin('')
          setTimeout(() => setShaking(false), 500)
        }
      }, 150)
    }
  }

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col max-w-sm mx-auto">
      <header className="px-5 py-4">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-slate-400 text-sm">
          <ArrowLeft size={16} /> Patient App
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Icon + title */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center mx-auto shadow-xl shadow-blue-900/50">
            <Stethoscope size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Doctor Portal</h1>
          <p className="text-slate-400 text-sm">MediVoice Clinical Dashboard</p>
        </div>

        {/* PIN dots */}
        <div className={`flex gap-5 transition-all ${shaking ? 'animate-bounce' : ''}`}>
          {[0,1,2,3].map(i => (
            <div key={i} className={`w-5 h-5 rounded-full border-2 transition-all ${
              i < pin.length
                ? error ? 'bg-red-500 border-red-500' : 'bg-blue-500 border-blue-500'
                : 'border-card'
            }`} />
          ))}
        </div>

        {error && <p className="text-red-400 text-sm -mt-4">{error}</p>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
          {PINPAD.map((key, i) => (
            key === '' ? <div key={i} /> :
            <button
              key={i}
              onClick={() => handleKey(key)}
              className={`h-16 rounded-2xl text-xl font-semibold transition-all active:scale-95 ${
                key === '⌫'
                  ? 'bg-card text-slate-500 border border-card'
                  : 'bg-card text-white border border-card active:bg-slate-700'
              }`}
            >
              {key}
            </button>
          ))}
        </div>

        <p className="text-slate-600 text-xs">Demo PIN: <span className="text-slate-500">1234</span></p>
      </div>
    </div>
  )
}
