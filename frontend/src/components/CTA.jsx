import { Mic, ArrowRight, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CTA() {
  return (
    <section id="cta" className="relative py-20 sm:py-28 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/60 via-slate-950 to-cyan-950/40" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-blue-600/12 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-8">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-300 text-xs sm:text-sm px-4 py-2 rounded-full border border-blue-500/25">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          Now Live — Agora Hackathon Demo
        </div>

        {/* Headline */}
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
          Skip the queue.
          <br />
          <span className="text-gradient">Get your MC today.</span>
        </h2>

        <p className="text-slate-400 text-base sm:text-lg max-w-xl mx-auto">
          Join thousands of Singaporeans who have already replaced 2-hour polyclinic visits with a 4-minute voice consultation.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/consult"
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold px-8 py-4 rounded-2xl transition-all shadow-2xl hover:shadow-blue-500/40 hover:-translate-y-0.5 text-base w-full sm:w-auto"
          >
            <Mic size={20} />
            Start Free Consultation
            <ArrowRight size={16} />
          </Link>
          <Link
            to="/doctor"
            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold px-7 py-4 rounded-2xl transition-all text-base w-full sm:w-auto"
          >
            Doctor Dashboard →
          </Link>
        </div>

        {/* Trust line */}
        <div className="flex flex-wrap items-center justify-center gap-5 text-xs sm:text-sm text-slate-500 pt-2">
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-green-500" />
            No personal data stored in demo mode
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-green-500" />
            Not a substitute for emergency care
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-green-500" />
            Built for Agora Voice AI Hackathon 2026
          </span>
        </div>
      </div>
    </section>
  )
}
