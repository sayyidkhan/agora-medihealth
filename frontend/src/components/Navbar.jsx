import { useState, useEffect } from 'react'
import { Stethoscope, Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const links = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'For Doctors', href: '#for-doctors' },
    { label: 'Tech Stack', href: '#tech-stack' },
  ]

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-950/90 backdrop-blur-xl border-b border-white/10 shadow-xl' : 'bg-transparent'
    }`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Stethoscope size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-white">MediVoice</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm text-slate-400 hover:text-white transition-colors">
              {l.label}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/doctor"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Doctor Login
          </Link>
          <Link
            to="/consult"
            className="text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold px-4 py-2 rounded-xl transition-all shadow-lg hover:shadow-blue-500/30"
          >
            Try Now →
          </Link>
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-slate-400 hover:text-white transition-colors"
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-slate-900/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-3">
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="block text-sm text-slate-300 hover:text-white py-2 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            to="/consult"
            onClick={() => setMenuOpen(false)}
            className="block text-center text-sm bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold px-4 py-3 rounded-xl mt-2"
          >
            Try MediVoice →
          </Link>
        </div>
      )}
    </nav>
  )
}
