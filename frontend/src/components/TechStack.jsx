const STACK = [
  { name: 'Agora RTC', role: 'Real-time audio transport', color: 'from-blue-500 to-blue-600', logo: '🔊' },
  { name: 'Agora ConvoAI', role: 'Voice AI engine (STT→LLM→TTS)', color: 'from-cyan-500 to-cyan-600', logo: '🤖' },
  { name: 'GPT-4o', role: 'Clinical reasoning & summary', color: 'from-green-500 to-emerald-600', logo: '🧠' },
  { name: 'ElevenLabs', role: 'Natural doctor voice (TTS)', color: 'from-violet-500 to-purple-600', logo: '🎙️' },
  { name: 'FastAPI', role: 'Python backend & token server', color: 'from-teal-500 to-teal-600', logo: '⚡' },
  { name: 'Couchbase', role: 'Consultation data storage', color: 'from-red-500 to-red-600', logo: '🗄️' },
  { name: 'React + Vite', role: 'Patient & doctor frontend', color: 'from-slate-500 to-slate-600', logo: '⚛️' },
  { name: 'ReportLab', role: 'MC PDF generation', color: 'from-orange-500 to-orange-600', logo: '📄' },
]

export default function TechStack() {
  return (
    <section id="tech-stack" className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[400px] bg-violet-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-slate-500/15 text-slate-300 text-xs sm:text-sm px-4 py-2 rounded-full border border-slate-500/25">
            Tech Stack
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Built on{' '}
            <span className="text-gradient">battle-tested</span>{' '}
            infrastructure
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Every layer purpose-chosen for production-grade healthcare use.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {STACK.map((s, i) => (
            <div
              key={i}
              className="group p-4 sm:p-5 rounded-2xl bg-white/3 border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all hover:-translate-y-1 text-center"
            >
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto mb-3 text-2xl shadow-lg group-hover:scale-110 transition-transform`}>
                {s.logo}
              </div>
              <div className="text-sm font-bold text-white">{s.name}</div>
              <div className="text-xs text-slate-500 mt-1 leading-tight">{s.role}</div>
            </div>
          ))}
        </div>

        {/* Agora highlight */}
        <div className="mt-8 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 to-cyan-950/60 border border-blue-500/20 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-2xl flex-shrink-0 shadow-xl">
            🔊
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">Powered by Agora at its core</h3>
            <p className="text-sm text-slate-400 mt-1">
              Agora RTC handles sub-200ms real-time audio between patient and AI. Agora ConvoAI Engine manages the full STT → GPT-4o → ElevenLabs TTS pipeline — not a wrapper, it is the product.
            </p>
          </div>
          <div className="flex-shrink-0">
            <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-3 py-1.5 rounded-full font-medium">
              Agora Voice AI Hackathon
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
