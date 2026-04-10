import { Mic, Brain, UserCheck, FileText, ArrowDown } from 'lucide-react'

const STEPS = [
  {
    icon: Mic,
    color: 'from-blue-500 to-cyan-500',
    glow: 'shadow-blue-500/30',
    step: '01',
    title: 'Describe Your Symptoms',
    desc: "Open MediVoice on any device. Select your doctor type and simply speak — tell the AI what's bothering you, just like talking to a doctor.",
  },
  {
    icon: Brain,
    color: 'from-violet-500 to-purple-500',
    glow: 'shadow-violet-500/30',
    step: '02',
    title: 'AI Clinical Interview',
    desc: 'Our Agora ConvoAI agent — powered by GPT-4o + ElevenLabs voice — conducts a structured clinical interview: duration, severity, symptoms, allergies, medications.',
  },
  {
    icon: UserCheck,
    color: 'from-cyan-500 to-teal-500',
    glow: 'shadow-cyan-500/30',
    step: '03',
    title: 'Doctor Reviews Async',
    desc: 'A licensed GP reviews your AI-generated consultation summary in under 2 minutes from their dashboard — no appointment needed.',
  },
  {
    icon: FileText,
    color: 'from-green-500 to-emerald-500',
    glow: 'shadow-green-500/30',
    step: '04',
    title: 'MC Delivered Digitally',
    desc: 'You receive a push notification and downloadable PDF medical certificate, signed by the doctor. Done — all from your couch.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violet-600/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 bg-violet-500/15 text-violet-300 text-xs sm:text-sm px-4 py-2 rounded-full border border-violet-500/25">
            How It Works
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            From symptom to MC in{' '}
            <span className="text-gradient">under 30 minutes</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            No appointment. No commute. No waiting room.
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((s, i) => {
            const Icon = s.icon
            return (
              <div key={i}>
                <div className="flex flex-col sm:flex-row gap-5 p-5 sm:p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all group">
                  {/* Icon */}
                  <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-xl ${s.glow} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} className="text-white" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-600">{s.step}</span>
                      <h3 className="text-base sm:text-lg font-bold text-white">{s.title}</h3>
                    </div>
                    <p className="text-sm sm:text-base text-slate-400 leading-relaxed">{s.desc}</p>
                  </div>

                  {/* Step number (desktop) */}
                  <div className="hidden lg:flex flex-shrink-0 items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-slate-600 font-mono text-lg font-bold">
                    {s.step}
                  </div>
                </div>

                {i < STEPS.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown size={16} className="text-slate-700" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
