import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Stethoscope, Lock } from 'lucide-react'

export default function DoctorLogin() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')

  const handleLogin = (e) => {
    e.preventDefault()
    if (pin === '1234') {
      localStorage.setItem('doctor_auth', 'true')
      navigate('/doctor/dashboard')
    } else {
      setError('Invalid PIN. (Demo PIN: 1234)')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center mx-auto mb-4">
            <Stethoscope size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Doctor Portal</h1>
          <p className="text-slate-400 mt-1 text-sm">MediVoice Clinical Dashboard</p>
        </div>

        <form onSubmit={handleLogin} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Lock size={14} /> Doctor PIN
            </label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              placeholder="Enter your PIN"
              maxLength={6}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors text-center text-2xl tracking-widest"
            />
          </div>

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Enter Dashboard
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-4">
          Demo PIN: <span className="text-slate-400">1234</span>
        </p>

        <button
          onClick={() => navigate('/')}
          className="w-full mt-4 text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          ← Back to Patient App
        </button>
      </div>
    </div>
  )
}
