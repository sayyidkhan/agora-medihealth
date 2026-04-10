import { Mic2, Globe, ShieldAlert, FileDown, Zap, Languages } from 'lucide-react'

const FEATURES = [
  {
    icon: Mic2,
    color: 'from-blue-500 to-cyan-500',
    title: 'Real-time Voice AI',
    desc: 'Agora ConvoAI + GPT-4o conducts a structured SOAP-lite clinical interview via voice — no typing, no forms.',
  },
  {
    icon: ShieldAlert,
    color: 'from-red-500 to-orange-500',
    title: 'Red Flag Detection',
    desc: 'Chest pain, breathing difficulty, or high fever in infants? The AI immediately escalates and directs to A&E or calls 995.',
  },
  {
    icon: FileDown,
    color: 'from-green-500 to-teal-500',
    title: 'Digital MC PDF',
    desc: 'Doctor-signed PDF medical certificate delivered to your phone. Accepted by employers, no printing required.',
  },
  {
    icon: Zap,
    color: 'from-yellow-500 to-amber-500',
    title: 'Async Doctor Review',
    desc: 'Doctors review AI-generated summaries, not raw recordings. One GP can handle 10x more cases in the same time.',
  },
  {
    icon: Globe,
    color: 'from-violet-500 to-purple-500',
    title: 'Any Device, Anywhere',
    desc: 'Pure web app — no installation. Works on mobile, tablet, or desktop. Perfect for working adults at home.',
  },
  {
    icon: Languages,
    color: 'from-pink-500 to-fuchsia-500',
    title: 'Multilingual Support',
    desc: 'Speaks English, Mandarin, Malay, and Tamil. Elderly residents and non-English speakers fully supported.',
  },
]

export default function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-600/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 bg-cyan-500/15 text-cyan-300 text-xs sm:text-sm px-4 py-2 rounded-full border border-cyan-500/25">
            Features
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Built for{' '}
            <span className="text-gradient">real healthcare</span>
            <br />
            not just a demo
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Every feature is designed around the clinical workflow — safe, fast, and accessible.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={i}
                className="group p-5 sm:p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-white/20 hover:bg-white/5 transition-all hover:-translate-y-1"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon size={20} className="text-white" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
