import { CheckCircle, Clock, List, AlertTriangle, ArrowRight } from 'lucide-react'

const DASHBOARD_ITEMS = [
  { status: 'pending', name: 'Ahmad Razif', complaint: 'Flu & mild fever', time: '8 min ago', severity: 4 },
  { status: 'pending', name: 'Li Wei', complaint: 'Sore throat, cough', time: '15 min ago', severity: 3 },
  { status: 'approved', name: 'Priya Nair', complaint: 'URTI, runny nose', time: '32 min ago', severity: 2 },
  { status: 'escalated', name: 'James Tan', complaint: 'Chest tightness', time: '1 hr ago', severity: 8 },
]

const STATUS_STYLES = {
  pending: { dot: 'bg-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25', label: 'Pending' },
  approved: { dot: 'bg-green-400', badge: 'bg-green-500/15 text-green-400 border-green-500/25', label: 'Approved' },
  escalated: { dot: 'bg-red-400', badge: 'bg-red-500/15 text-red-400 border-red-500/25', label: 'Escalated' },
}

export default function ForDoctors() {
  return (
    <section id="for-doctors" className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-teal-600/5 rounded-full blur-[140px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-teal-500/15 text-teal-300 text-xs sm:text-sm px-4 py-2 rounded-full border border-teal-500/25">
              For Doctors
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
              Review 10× more cases.{' '}
              <span className="text-gradient">Without burning out.</span>
            </h2>
            <p className="text-slate-400 text-base sm:text-lg">
              Instead of conducting repetitive interviews, you review a clean AI-generated summary and make the clinical decision. The boring part is automated — the important part stays with you.
            </p>

            <ul className="space-y-3">
              {[
                { icon: List, text: 'Structured SOAP-lite summary — no audio scrubbing needed' },
                { icon: CheckCircle, text: 'One-click MC approval with configurable duration' },
                { icon: AlertTriangle, text: 'Red-flag cases are auto-escalated before they reach you' },
                { icon: Clock, text: 'Average doctor review time: under 2 minutes per case' },
              ].map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-start gap-3 text-slate-300 text-sm sm:text-base">
                  <Icon size={18} className="text-teal-400 flex-shrink-0 mt-0.5" />
                  {text}
                </li>
              ))}
            </ul>

            <a
              href="#cta"
              className="inline-flex items-center gap-2 text-teal-300 hover:text-teal-200 font-semibold transition-colors text-sm sm:text-base"
            >
              See doctor dashboard demo
              <ArrowRight size={16} />
            </a>
          </div>

          {/* Right: Dashboard mockup */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              <div className="absolute inset-0 bg-teal-500/10 blur-2xl rounded-3xl scale-105" />
              <div className="relative bg-slate-900 border border-white/12 rounded-2xl overflow-hidden shadow-2xl">
                {/* Dashboard header */}
                <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-white/8 bg-slate-950/50">
                  <div>
                    <h3 className="text-sm font-bold text-white">Case Queue</h3>
                    <p className="text-xs text-slate-500">3 pending review</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                </div>

                {/* Cases */}
                <div className="divide-y divide-white/5">
                  {DASHBOARD_ITEMS.map((item, i) => {
                    const s = STATUS_STYLES[item.status]
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-3 px-4 sm:px-5 py-3.5 hover:bg-white/3 transition-colors ${item.status === 'escalated' ? 'bg-red-950/20' : ''}`}
                      >
                        {/* Avatar */}
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center text-sm font-bold text-slate-300 flex-shrink-0">
                          {item.name.split(' ').map(n => n[0]).join('')}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-white truncate">{item.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${s.badge} flex-shrink-0`}>
                              {s.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">{item.complaint}</p>
                        </div>

                        {/* Right */}
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs text-slate-600">{item.time}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-slate-600">Sev.</span>
                            <span className={`text-xs font-bold ${item.severity >= 7 ? 'text-red-400' : item.severity >= 4 ? 'text-yellow-400' : 'text-green-400'}`}>
                              {item.severity}/10
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Footer action bar */}
                <div className="px-4 sm:px-5 py-3 border-t border-white/8 bg-slate-950/50 flex items-center justify-between">
                  <span className="text-xs text-slate-600">Avg. review time: 1m 42s</span>
                  <button className="text-xs bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded-lg font-medium transition-colors">
                    Review Next →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
