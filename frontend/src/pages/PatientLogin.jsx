import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope, LogIn, UserRound, Mail, Lock } from 'lucide-react'
import { setPatientSession } from '../patientSession'
import { endPinGateSession, isPinGateEnabled } from '../pinGateSession'

const DEMO_PROFILES = [
  { name: 'Sarah Lim', email: 'sarah.lim@demo.com' },
  { name: 'Muhammad Hafiz', email: 'muhammad.hafiz@demo.com' },
  { name: 'Priya Nair', email: 'priya.nair@demo.com' },
  { name: 'Chen Wei Jie', email: 'chen.weijie@demo.com' },
  { name: 'Tan Mei Ling', email: 'tan.meiling@demo.com' },
  { name: 'Arjun Krishnan', email: 'arjun.krishnan@demo.com' },
  { name: 'Nur Aisyah', email: 'nur.aisyah@demo.com' },
  { name: 'David Ong', email: 'david.ong@demo.com' },
]

function emailForName(raw) {
  const t = raw.trim()
  if (!t) return ''
  const hit = DEMO_PROFILES.find(
    (p) => p.name === t || p.name.toLowerCase() === t.toLowerCase()
  )
  return hit?.email ?? ''
}

const nameInputClass =
  'w-full min-h-[48px] rounded-xl border border-slate-600 bg-slate-900/80 px-4 py-3 text-[15px] leading-normal text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-2 focus:ring-blue-500/20 transition-colors'

const emailInputClass =
  'w-full min-h-[48px] rounded-xl border border-slate-600 bg-slate-900/60 px-4 py-3 text-[15px] leading-normal text-slate-300 placeholder:text-slate-600 cursor-default focus:outline-none focus:ring-0 focus:border-slate-600'

export default function PatientLogin() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!name.trim()) return setError('Choose or enter a name.')
    const resolved = email.trim() || emailForName(name)
    if (!resolved) {
      return setError('Pick a name chip, or type a full demo name so we can load your email.')
    }

    const em = resolved.toLowerCase()
    const id = `pat_${em.replace(/[^a-z0-9._@-]+/gi, '_').slice(0, 120)}`
    setPatientSession({ id, name: name.trim(), email: em })
    navigate('/', { replace: true })
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[#070b12]">
      <div className="pointer-events-none absolute -top-28 -left-24 h-80 w-80 rounded-full bg-blue-700/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 h-72 w-72 rounded-full bg-cyan-700/20 blur-3xl" />

      <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center justify-end gap-2">
        <Link
          to="/doctor"
          className="rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-white/30 transition-colors"
        >
          Doctor portal
        </Link>
        {isPinGateEnabled() ? (
          <button
            type="button"
            onClick={() => {
              endPinGateSession()
              window.location.reload()
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:border-amber-500/40 hover:bg-slate-800/90 transition-colors"
            title="Clear demo access and show the PIN screen again"
          >
            <Lock size={13} className="text-amber-400/90" aria-hidden />
            End session
          </button>
        ) : null}
      </div>

      <main className="relative z-10 min-h-dvh w-full px-4 pt-16 pb-10 flex items-center justify-center">
        <div className="w-full max-w-[480px] mx-auto">
          <div className="mb-9 flex flex-col items-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 shadow-lg shadow-blue-900/40">
              <Stethoscope size={27} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white">MediVoice</h1>
            <p className="max-w-[340px] text-sm leading-relaxed text-slate-400">
              Tap your name — your email loads automatically. No password.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-7 shadow-2xl shadow-black/45 backdrop-blur-sm"
          >
            {error && (
              <p className="mb-4 rounded-xl border border-red-500/35 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            )}

            <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:p-5">
              <div className="flex items-center gap-2 text-slate-300 mb-5">
                <UserRound size={16} className="text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">Choose Name</span>
              </div>

              <div className="flex flex-wrap gap-3">
                {DEMO_PROFILES.map((p) => {
                  const active = name === p.name
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        setName(p.name)
                        setEmail(p.email)
                        setError('')
                      }}
                      className={`rounded-full px-4 py-2.5 text-[13px] font-medium transition-colors ${
                        active
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/35'
                          : 'border border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700/80'
                      }`}
                    >
                      {p.name}
                    </button>
                  )
                })}
              </div>

              <div className="mt-7 border-t border-slate-600/40 pt-6">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    const nextName = e.target.value
                    setName(nextName)
                    setEmail(emailForName(nextName))
                    setError('')
                  }}
                  placeholder="Or type a demo name exactly as shown"
                  className={nameInputClass}
                  autoComplete="name"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-white/10 bg-slate-950/35 p-4 sm:p-5 mt-5">
              <div className="flex items-center gap-2 text-slate-300 mb-4">
                <Mail size={16} className="text-cyan-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.12em]">Your email</span>
              </div>
              <p className="text-[12px] text-slate-500 mb-4">Set automatically from your name.</p>

              <input
                type="email"
                name="email"
                value={email}
                readOnly
                tabIndex={-1}
                aria-readonly="true"
                placeholder="Select a name first…"
                className={emailInputClass}
                autoComplete="off"
              />
            </section>

            <div className="pt-2">
              <button
                type="submit"
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 py-3.5 text-[17px] font-semibold text-white shadow-lg shadow-blue-900/35 transition-transform active:scale-[0.99]"
              >
                <LogIn size={19} />
                Continue
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}
