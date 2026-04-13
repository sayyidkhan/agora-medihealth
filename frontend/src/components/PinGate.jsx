import { useState } from 'react'
import { Lock } from 'lucide-react'
import {
  isPinGateEnabled,
  PIN_GATE_SESSION_KEY,
} from '../pinGateSession'

const PIN_GATE_ENABLED = isPinGateEnabled()
const STORAGE_KEY = PIN_GATE_SESSION_KEY
/** Set in frontend/.env — still embedded in the client bundle (demo gating only). */
const CORRECT_PIN =
  String(
    import.meta.env.MEDI_DEMO_PIN ??
      import.meta.env.VITE_DEMO_PIN ??
      '2048',
  ).trim() || '2048'

function readStoredUnlocked() {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export default function PinGate({ children }) {
  const [unlocked, setUnlocked] = useState(() =>
    PIN_GATE_ENABLED ? readStoredUnlocked() : true,
  )
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (pin === CORRECT_PIN) {
      try {
        sessionStorage.setItem(STORAGE_KEY, '1')
      } catch {
        /* ignore */
      }
      setUnlocked(true)
      setError(false)
    } else {
      setError(true)
      setPin('')
    }
  }

  if (!PIN_GATE_ENABLED) {
    return children
  }

  if (!unlocked) {
    return (
      <div className="min-h-dvh w-full flex items-center justify-center bg-[#0d1117] px-4">
        <div className="w-full max-w-sm rounded-2xl border border-card bg-card p-8 shadow-xl">
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/15 text-blue-400">
              <Lock className="h-6 w-6" aria-hidden />
            </div>
            <h1 className="text-lg font-semibold text-slate-100">Demo access</h1>
            <p className="mt-1 text-sm text-slate-400">
              Enter the PIN to use this app.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="demo-pin" className="sr-only">
                PIN
              </label>
              <input
                id="demo-pin"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                className="input-base text-center text-lg tracking-widest"
                placeholder="••••"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value)
                  setError(false)
                }}
              />
              {error ? (
                <p className="mt-2 text-center text-sm text-red-400" role="alert">
                  Incorrect PIN. Try again.
                </p>
              ) : null}
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-[#1c2333]"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    )
  }

  return children
}
