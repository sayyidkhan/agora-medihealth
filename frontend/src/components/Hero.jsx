import { Mic, ShieldCheck, Clock, ArrowRight, Play } from 'lucide-react'
import { useState, useEffect } from 'react'

const WAVE_BARS = Array.from({ length: 28 }, (_, i) => i)

function WaveVisualizer({ active }) {
  return (
    <div className="flex items-center justify-center gap-0.5 h-10">
      {WAVE_BARS.map((i) => (
        <div
          key={i}
          className={`w-1 rounded-full transition-all duration-300 ${active ? 'bg-cyan-400 animate-wave-bar' : 'bg-white/20'}`}
          style={{
            height: active ? undefined : '6px',
            animationDelay: `${(i * 0.06) % 1.2}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function Hero() {
  const [waveActive, setWaveActive] = useState(false)
  const [typedText, setTypedText] = useState('')
  const fullText = 'I have a runny nose and mild fever since yesterday...'

  useEffect(() => {
    let i = 0
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setTypedText(fullText.slice(0, i + 1))
        i++
        if (i >= fullText.length) {
          clearInterval(interval)
          setTimeout(() => setWaveActive(true), 400)
        }
      }, 45)
      return () => clearInterval(interval)
    }, 1200)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-20">
      {/* Background gradients */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-600/8 rounded-full blur-[100px]" />
        <div className="absolute top-1/3 left-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Copy */}
          <div className="space-y-7 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-500/15 text-blue-300 text-xs sm:text-sm px-4 py-2 rounded-full border border-blue-500/25 animate-fade-in-up">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              Agora Voice AI Hackathon Singapore 2026
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.1] tracking-tight animate-fade-in-up delay-100">
              Speak your{' '}
              <span className="text-gradient">symptoms.</span>
              <br />
              Get your MC.
              <br />
              <span className="text-white/60">Skip the queue.</span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg text-slate-400 max-w-lg mx-auto lg:mx-0 animate-fade-in-up delay-200">
              MediVoice uses real-time voice AI to conduct your clinical interview in minutes — then routes it to a licensed GP for async MC approval. No more 2-hour waits for a 2-minute decision.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 text-sm text-slate-400 animate-fade-in-up delay-300">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-green-400" />
                Licensed GP reviewed
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={16} className="text-cyan-400" />
                MC in under 30 min
              </span>
              <span className="flex items-center gap-1.5">
                <Mic size={16} className="text-blue-400" />
                Voice-first, no typing
              </span>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start animate-fade-in-up delay-400">
              <a
                href="#cta"
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold px-7 py-4 rounded-2xl transition-all shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 text-base"
              >
                <Mic size={18} />
                Start Free Consultation
                <ArrowRight size={16} />
              </a>
              <a
                href="#how-it-works"
                className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold px-6 py-4 rounded-2xl transition-all text-base"
              >
                <Play size={16} className="text-cyan-400" />
                See how it works
              </a>
            </div>
          </div>

          {/* Right: Animated phone mockup */}
          <div className="flex justify-center lg:justify-end animate-fade-in-up delay-300">
            <div className="relative animate-float">
              {/* Glow rings */}
              <div className="absolute inset-0 rounded-[40px] bg-blue-500/15 blur-2xl scale-110" />
              <div className="absolute inset-0 rounded-[40px] bg-cyan-500/10 blur-3xl scale-125 animate-pulse-ring" />

              {/* Phone frame */}
              <div className="relative w-72 sm:w-80 bg-slate-900 border border-white/15 rounded-[40px] overflow-hidden shadow-2xl">
                {/* Notch */}
                <div className="flex justify-center pt-4 pb-2">
                  <div className="w-24 h-6 bg-slate-950 rounded-full" />
                </div>

                {/* Screen content */}
                <div className="px-5 pb-8 space-y-4">
                  {/* App header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">M</span>
                      </div>
                      <span className="text-white font-semibold text-sm">MediVoice</span>
                    </div>
                    <span className="text-xs text-green-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Live
                    </span>
                  </div>

                  {/* AI Avatar */}
                  <div className="relative bg-gradient-to-b from-blue-950 to-slate-950 rounded-3xl p-4 border border-white/8">
                    <div className="flex justify-center mb-3">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 flex items-center justify-center shadow-xl">
                          <span className="text-4xl">👩‍⚕️</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-2 border-slate-900 flex items-center justify-center">
                          <Mic size={10} className="text-white" />
                        </div>
                      </div>
                    </div>

                    <p className="text-center text-xs text-slate-400 mb-1">Dr. AI is listening...</p>

                    {/* Wave */}
                    <WaveVisualizer active={waveActive} />
                  </div>

                  {/* Chat bubble */}
                  <div className="space-y-2">
                    <div className="bg-blue-600/20 border border-blue-500/20 rounded-2xl rounded-tl-sm px-3.5 py-2.5 max-w-[85%]">
                      <p className="text-xs text-blue-200">Hi! I'm Dr. AI. What symptoms are you experiencing today?</p>
                    </div>
                    <div className="bg-white/8 border border-white/10 rounded-2xl rounded-tr-sm px-3.5 py-2.5 max-w-[85%] ml-auto">
                      <p className="text-xs text-slate-300 min-h-[2.5rem]">
                        {typedText}
                        <span className="inline-block w-0.5 h-3 bg-cyan-400 ml-0.5 animate-pulse" />
                      </p>
                    </div>
                  </div>

                  {/* Mic button */}
                  <div className="flex justify-center pt-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-500/40 animate-pulse-ring">
                      <Mic size={22} className="text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600 animate-bounce">
        <span className="text-xs">scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-slate-600 to-transparent" />
      </div>
    </section>
  )
}
