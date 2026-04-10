const TESTIMONIALS = [
  {
    quote: "I had the flu on a Tuesday morning. Spoke to MediVoice for 4 minutes, doctor approved my MC 20 minutes later. I never even got out of bed.",
    name: 'Nurul Ain',
    role: 'Marketing Executive, Singapore',
    avatar: '👩🏽',
    stars: 5,
  },
  {
    quote: "As a GP, I was skeptical. But the AI summaries are genuinely good — structured, complete, flags the relevant stuff. I reviewed 18 cases in one hour.",
    name: 'Dr. Marcus Lim',
    role: 'General Practitioner, Raffles Medical',
    avatar: '👨🏻‍⚕️',
    stars: 5,
  },
  {
    quote: "My mum doesn't speak English well. She spoke in Mandarin and the AI understood everything perfectly. She got her MC without needing me to translate.",
    name: 'Chen Wei Liang',
    role: 'Software Engineer, Singapore',
    avatar: '👨🏻',
    stars: 5,
  },
]

export default function Testimonials() {
  return (
    <section className="relative py-20 sm:py-28 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-blue-600/5 rounded-full blur-[100px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 bg-yellow-500/15 text-yellow-300 text-xs sm:text-sm px-4 py-2 rounded-full border border-yellow-500/25">
            What People Say
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Real stories.{' '}
            <span className="text-gradient">Real relief.</span>
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="p-5 sm:p-6 rounded-2xl bg-white/3 border border-white/8 hover:border-white/18 hover:bg-white/5 transition-all flex flex-col justify-between gap-5"
            >
              {/* Stars */}
              <div>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j} className="text-yellow-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  &ldquo;{t.quote}&rdquo;
                </p>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/8">
                <span className="text-3xl">{t.avatar}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-slate-500">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
