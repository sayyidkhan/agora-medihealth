const STATS = [
  { value: '2.3M+', label: 'Polyclinic visits/month', sub: 'in Singapore alone' },
  { value: '~2 hrs', label: 'Average wait time', sub: 'for a 3-min decision' },
  { value: '10×', label: 'More cases per doctor', sub: 'with async AI review' },
  { value: '<30 min', label: 'MC delivery time', sub: 'from home' },
]

export default function Stats() {
  return (
    <section className="relative py-12 border-y border-white/8 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-950/40 via-slate-950 to-cyan-950/40" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {STATS.map((s, i) => (
            <div
              key={i}
              className="text-center space-y-1 p-4 rounded-2xl bg-white/3 border border-white/8 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-gradient">{s.value}</div>
              <div className="text-sm font-semibold text-white">{s.label}</div>
              <div className="text-xs text-slate-500">{s.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
