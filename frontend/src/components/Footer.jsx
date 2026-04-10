import { Stethoscope, Github, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-white/8 py-10 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Stethoscope size={18} className="text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-white">MediVoice</div>
              <div className="text-xs text-slate-600">Agora Voice AI Hackathon Singapore 2026</div>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#for-doctors" className="hover:text-white transition-colors">For Doctors</a>
          </div>

          {/* External */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors"
            >
              <Github size={16} />
              GitHub
            </a>
            <Link
              to="/consult"
              className="flex items-center gap-1.5 text-sm bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/25 px-3 py-1.5 rounded-lg transition-colors"
            >
              <ExternalLink size={14} />
              Open App
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
          <p>© 2026 MediVoice. Built for the Agora Voice AI Hackathon, Singapore.</p>
          <p className="text-center">
            ⚠️ Demo only — not a licensed medical service. For emergencies, call <span className="text-red-500 font-semibold">995</span>.
          </p>
        </div>
      </div>
    </footer>
  )
}
