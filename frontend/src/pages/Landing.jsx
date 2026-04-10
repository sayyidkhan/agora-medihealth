import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Stethoscope, Baby, Heart, Mic, MicOff, Eraser, ShieldCheck, Play, Square, X } from 'lucide-react'
import { getPatientSession, clearPatientSession } from '../patientSession'

const API = '/api'

const DOCTOR_TYPES = [
  { id: 'gp',     label: 'General\nPractitioner', icon: Stethoscope },
  { id: 'paeds',  label: 'Paediatrician',          icon: Baby },
  { id: 'womens', label: "Women's\nHealth",         icon: Heart },
]

// Language filter tabs
const LANG_TABS = [
  { id: 'en',   label: 'English', flag: '🇬🇧' },
  { id: 'zh',   label: '中文',     flag: '🇨🇳' },
  { id: 'ms',   label: 'Melayu',  flag: '🇲🇾' },
  { id: 'ta',   label: 'தமிழ்',  flag: '🇮🇳' },
  { id: 'spicy', label: 'Spicy',  flag: '🌶️'  },
]

const VOICE_OPTIONS = [
  // ── English ──────────────────────────────────────────
  {
    id: 'female', lang: 'en',
    label: 'Dr. Sarah', photo: '/dr-sarah.png',
    desc: 'Warm & reassuring · Family medicine',
    pitch: 1.15, rate: 0.92,
    preview: "Hi, I'm Dr. Sarah. I'm here to listen and help you feel better. Please tell me what's been bothering you.",
  },
  {
    id: 'male', lang: 'en',
    label: 'Dr. James', photo: '/dr-james.png',
    desc: 'Calm & thorough · General practice',
    pitch: 0.88, rate: 0.90,
    preview: "Hello, I'm Dr. James. I'll guide you through a quick consultation. How can I help you today?",
  },
  {
    id: 'premium_female', lang: 'en',
    label: 'Dr. Serena', photo: '/dr-serena.png',
    desc: 'Empathetic & precise · Senior GP',
    pitch: 1.10, rate: 0.88,
    preview: "Good day. I'm Dr. Serena. I take a holistic approach to every consultation. Tell me what's on your mind.",
  },
  {
    id: 'premium_male', lang: 'en',
    label: 'Dr. Daniel', photo: '/dr-daniel.png',
    desc: 'Confident & detailed · Internal medicine',
    pitch: 0.82, rate: 0.88,
    preview: "Hello, I'm Dr. Daniel. I'll make sure we cover everything thoroughly. What brings you in today?",
  },
  // ── Chinese / 中文 ────────────────────────────────────
  {
    id: 'zh_female', lang: 'zh',
    label: 'Dr. Wei Lin', photo: '/dr-weilin.png',
    desc: '亲切细心 · 家庭医学',
    pitch: 1.1, rate: 0.90,
    preview: "您好，我是魏琳医生。请告诉我您今天有什么不舒服？我会仔细听您说。",
    langCode: 'zh-CN',
  },
  {
    id: 'zh_male', lang: 'zh',
    label: 'Dr. Ming', photo: '/dr-ming.png',
    desc: '经验丰富 · 内科医生',
    pitch: 0.90, rate: 0.88,
    preview: "您好，我是明医生。我会为您进行详细的问诊。请放心，我们一起来了解您的症状。",
    langCode: 'zh-CN',
  },
  // ── Malay / Melayu ───────────────────────────────────
  {
    id: 'ms_female', lang: 'ms',
    label: 'Dr. Aisha', photo: '/dr-aisha.png',
    desc: 'Mesra & prihatin · Perubatan am',
    pitch: 1.12, rate: 0.91,
    preview: "Assalamualaikum, saya Dr. Aisha. Saya di sini untuk membantu anda. Boleh cerita apa yang anda rasa?",
    langCode: 'ms-MY',
  },
  {
    id: 'ms_male', lang: 'ms',
    label: 'Dr. Hafiz', photo: '/dr-hafiz.png',
    desc: 'Teliti & dipercayai · Doktor Am',
    pitch: 0.90, rate: 0.89,
    preview: "Assalamualaikum, saya Dr. Hafiz. Jangan risau, saya akan bantu anda dengan sepenuh hati. Apa masalah anda hari ini?",
    langCode: 'ms-MY',
  },
  // ── Tamil / தமிழ் ────────────────────────────────────
  {
    id: 'ta_female', lang: 'ta',
    label: 'Dr. Priya', photo: '/dr-priya.png',
    desc: 'அன்பான & கவனமான · குடும்ப மருத்துவம்',
    pitch: 1.13, rate: 0.91,
    preview: "வணக்கம், நான் டாக்டர் பிரியா. உங்களுக்கு என்ன உடம்பு சரியில்லை என்று சொல்லுங்கள், நான் கவனிக்கிறேன்.",
    langCode: 'ta-IN',
  },
  {
    id: 'ta_male', lang: 'ta',
    label: 'Dr. Arjun', photo: '/dr-arjun.png',
    desc: 'நம்பகமான & திறமையான · பொது மருத்துவம்',
    pitch: 0.88, rate: 0.89,
    preview: "வணக்கம், நான் டாக்டர் அர்ஜுன். நீங்கள் சொல்வதை கவனமாக கேட்கிறேன். என்ன பிரச்சனை என்று சொல்லுங்கள்.",
    langCode: 'ta-IN',
  },
  // ── 🌶️ Spicy (hackathon fun) ──────────────────────────
  {
    id: 'spicy_female', lang: 'spicy',
    label: 'Dr. Valentina', photo: '/dr-valentina.png',
    desc: '💋 Sultry & attentive · Exotic medicine',
    pitch: 1.05, rate: 0.82,
    preview: "Hellooo darling~ I'm Dr. Valentina. Don't be shy, tell me everything — where does it hurt? I'll take very good care of you. 😉",
  },
  {
    id: 'spicy_male', lang: 'spicy',
    label: 'Dr. Rico', photo: '/dr-rico.png',
    desc: '😏 Smooth & thorough · Lover of medicine',
    pitch: 0.78, rate: 0.80,
    preview: "Hey there~ I'm Dr. Rico. You came to the right place. Relax, I'm going to take real good care of you today. So… what's been bothering you? 😏",
  },
]

const SYMPTOM_CHIPS = [
  { label: '🤧 Cold / flu',         text: 'Runny nose, mild fever and tiredness for about 2–3 days.' },
  { label: '😮‍💨 Cough & throat',    text: 'Dry cough and sore throat, worse at night, no trouble breathing.' },
  { label: '🤕 Headache',            text: 'Dull headache on both sides for two days, manageable with rest.' },
  { label: '🤢 Stomach upset',       text: 'Nausea and loose stools since yesterday, mild stomach cramps.' },
  { label: '🌡️ Fever',              text: 'Fever around 38–39 °C since this morning, no other symptoms yet.' },
  { label: '🤧 Rash / allergy',     text: 'Itchy rash on arms after a new food, antihistamine helped a little.' },
  { label: '🦴 Back pain',           text: 'Lower back ache after lifting, worse when bending, no leg numbness.' },
  { label: '👶 Child fever',         text: 'My child has fever and cough for one day, still drinking fluids.' },
  { label: '🌸 Women\'s health',     text: 'Irregular period and mild pelvic discomfort for the past few weeks.' },
]

/** BCP-47 tags for Web Speech API recognition (best-effort per browser). */
const SYMPTOM_STT_LANG = {
  // en-US tends to be the most reliable with Chrome’s cloud recognizer; en-SG often hits the same “network” failures.
  en: 'en-US',
  zh: 'zh-CN',
  ms: 'ms-MY',
  ta: 'ta-IN',
  spicy: 'en-US',
}

/** Explicit dictation choices (Web Speech `lang` + labels for UI and backend). */
const DICTATION_LANG_OPTIONS = [
  { stt: 'en-US', label: 'English', flag: '\u{1F1FA}\u{1F1F8}', hint: 'US English' },
  { stt: 'zh-CN', label: 'Chinese (\u4E2D\u6587)', flag: '\u{1F1E8}\u{1F1F3}', hint: 'Mandarin' },
  { stt: 'ms-MY', label: 'Melayu', flag: '\u{1F1F2}\u{1F1FE}', hint: 'Malay' },
  { stt: 'ta-IN', label: 'Tamil', flag: '\u{1F1EE}\u{1F1F3}', hint: 'Tamil (India)' },
]

function dictationMetaForLocale(stt) {
  return DICTATION_LANG_OPTIONS.find((o) => o.stt === stt) || {
    stt,
    label: stt,
    flag: '\u{1F310}',
    hint: '',
  }
}

const SYMPTOM_STT_ERROR_HELP = {
  network:
    'Dictation needs an internet connection (Chrome/Edge send audio to Google speech servers). Check Wi-Fi or VPN, try again, or open the site in normal Chrome or Edge - not an embedded preview. You can always type instead.',
  'audio-capture': 'No microphone input. Check the mic isn’t muted or used by another app.',
  'service-not-allowed': 'Speech recognition isn’t available in this browser or context.',
  'language-not-supported': 'This language isn’t supported for dictation here. Try English doctor voice or type instead.',
  'bad-grammar': 'Could not start dictation. Try again or type instead.',
}

function getSpeechRecognitionCtor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

export default function Landing() {
  const navigate = useNavigate()
  const [doctorType, setDoctorType] = useState('gp')
  const [lang, setLang]             = useState('en')
  const [voiceType, setVoiceType]   = useState('female')
  const [prePrompt, setPrePrompt]   = useState('')
  const [error, setError]           = useState('')
  const [playing, setPlaying]       = useState(null)
  const [symptomListening, setSymptomListening] = useState(false)
  const [dictationPreview, setDictationPreview] = useState('')
  /** Non-null while the post-dictation review modal is open (editable transcript). */
  const [dictationReview, setDictationReview] = useState(null)
  /** BCP-47 tag passed to the browser recognizer and stored with the consultation. */
  const [dictationSttLocale, setDictationSttLocale] = useState('en-US')
  const previewAbortRef = useRef(null)
  const previewSourceRef = useRef(null)
  const previewAudioContextRef = useRef(null)
  const symptomRecognitionRef = useRef(null)
  const symptomSttFallbackUsedRef = useRef(false)
  const dictationFinalRef = useRef('')
  const dictationInterimRef = useRef('')
  const sttSupported = useMemo(() => !!getSpeechRecognitionCtor(), [])

  const visibleVoices = VOICE_OPTIONS.filter(v => v.lang === lang)

  const stopSymptomListen = () => {
    const r = symptomRecognitionRef.current
    symptomRecognitionRef.current = null
    if (r) {
      try { r.stop() } catch (_) {}
    }
    setSymptomListening(false)
    setDictationPreview('')
  }

  const toggleSymptomListen = () => {
    const SR = getSpeechRecognitionCtor()
    if (!SR) {
      setError('Voice typing needs a supported browser (e.g. Chrome or Edge on desktop).')
      return
    }
    if (symptomListening) {
      const finals = dictationFinalRef.current.trim()
      const interim = dictationInterimRef.current.trim()
      const combined = [finals, interim].filter(Boolean).join(' ').trim()
      dictationFinalRef.current = ''
      dictationInterimRef.current = ''
      stopSymptomListen()
      if (combined) setDictationReview(combined)
      return
    }
    setError('')
    window.speechSynthesis?.cancel()
    setPlaying(null)
    symptomSttFallbackUsedRef.current = false
    dictationFinalRef.current = ''
    dictationInterimRef.current = ''
    setDictationPreview('')

    const primaryLang = dictationSttLocale

    const attachAndStart = (langCode) => {
      const r = new SR()
      r.lang = langCode
      r.continuous = true
      r.interimResults = true
      r.maxAlternatives = 1

      r.onresult = (event) => {
        let interimPiece = ''
        let finalPiece = ''
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i]
          const t = res[0].transcript
          if (res.isFinal) finalPiece += t
          else interimPiece += t
        }
        if (finalPiece.trim()) {
          const f = finalPiece.trim()
          dictationFinalRef.current = dictationFinalRef.current
            ? `${dictationFinalRef.current} ${f}`
            : f
        }
        dictationInterimRef.current = interimPiece.trim()
        const live = [dictationFinalRef.current, dictationInterimRef.current].filter(Boolean).join(' ').trim()
        setDictationPreview(live)
      }

      r.onerror = (ev) => {
        if (ev.error === 'aborted') return
        if (ev.error === 'no-speech') return

        if (ev.error === 'not-allowed') {
          setError('Microphone permission denied. Allow the mic to use voice typing.')
          stopSymptomListen()
          dictationFinalRef.current = ''
          dictationInterimRef.current = ''
          return
        }

        const tryFallback =
          (ev.error === 'network' || ev.error === 'language-not-supported') &&
          !symptomSttFallbackUsedRef.current &&
          langCode !== 'en-US'

        if (tryFallback) {
          symptomSttFallbackUsedRef.current = true
          try { r.stop() } catch (_) {}
          symptomRecognitionRef.current = null
          setSymptomListening(false)
          window.setTimeout(() => attachAndStart('en-US'), 400)
          return
        }

        setError(SYMPTOM_STT_ERROR_HELP[ev.error] || `Voice typing: ${ev.error}`)
        stopSymptomListen()
        dictationFinalRef.current = ''
        dictationInterimRef.current = ''
      }

      r.onend = () => {
        if (symptomRecognitionRef.current !== r) return
        symptomRecognitionRef.current = null
        setSymptomListening(false)
        setDictationPreview('')
        dictationInterimRef.current = ''
      }

      symptomRecognitionRef.current = r
      setSymptomListening(true)
      try {
        r.start()
      } catch {
        symptomRecognitionRef.current = null
        setSymptomListening(false)
        dictationFinalRef.current = ''
        dictationInterimRef.current = ''
        setDictationPreview('')
        setError('Could not start the microphone.')
      }
    }

    attachAndStart(primaryLang)
  }

  const stopPreviewPlayback = useCallback(() => {
    previewAbortRef.current?.abort()
    previewAbortRef.current = null
    try {
      previewSourceRef.current?.stop()
    } catch (_) {}
    previewSourceRef.current = null
  }, [])

  // When switching language, auto-select the first doctor in that group
  const handleLangChange = (l) => {
    stopSymptomListen()
    dictationFinalRef.current = ''
    dictationInterimRef.current = ''
    setDictationReview(null)
    setLang(l)
    const first = VOICE_OPTIONS.find(v => v.lang === l)
    if (first) setVoiceType(first.id)
    window.speechSynthesis?.cancel()
    stopPreviewPlayback()
    setPlaying(null)
  }

  useEffect(() => {
    if (!getPatientSession()) {
      navigate('/login', { replace: true })
    }
    return () => {
      window.speechSynthesis?.cancel()
      stopPreviewPlayback()
      void previewAudioContextRef.current?.close()
      previewAudioContextRef.current = null
      try { symptomRecognitionRef.current?.stop() } catch (_) {}
    }
  }, [navigate, stopPreviewPlayback])

  useEffect(() => {
    if (dictationReview === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') setDictationReview(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dictationReview])

  // Preselect dictation language to match the doctor-voice tab; user can override before Dictate.
  useEffect(() => {
    setDictationSttLocale(SYMPTOM_STT_LANG[lang] || 'en-US')
  }, [lang])

  const patient = getPatientSession()

  const playPreview = async (voice) => {
    window.speechSynthesis?.cancel()

    if (playing === voice.id) {
      stopPreviewPlayback()
      setPlaying(null)
      return
    }

    stopPreviewPlayback()

    const ACtx = window.AudioContext || window.webkitAudioContext
    if (!ACtx) {
      setError('Web Audio is not available in this browser.')
      return
    }
    const ctx = previewAudioContextRef.current ?? (previewAudioContextRef.current = new ACtx())
    void ctx.resume()

    const ac = new AbortController()
    previewAbortRef.current = ac
    setPlaying(voice.id)
    setError('')

    try {
      const res = await fetch(`${API}/tts/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice_type: voice.id, text: voice.preview }),
        signal: ac.signal,
      })
      if (!res.ok) {
        let msg = `Voice preview failed (${res.status})`
        try {
          const data = await res.json()
          const d = data.detail
          if (typeof d === 'string') msg = d
          else if (Array.isArray(d)) msg = d.map((x) => x.msg || JSON.stringify(x)).join('; ')
        } catch (_) { /* use default msg */ }
        setError(msg)
        setPlaying(null)
        return
      }
      if (ac.signal.aborted) return
      const raw = await res.arrayBuffer()
      if (ac.signal.aborted) return
      let audioBuffer
      try {
        audioBuffer = await ctx.decodeAudioData(raw.slice(0))
      } catch {
        setError('Could not decode voice preview audio.')
        setPlaying(null)
        return
      }
      if (ac.signal.aborted) return
      const source = ctx.createBufferSource()
      previewSourceRef.current = source
      source.buffer = audioBuffer
      source.connect(ctx.destination)
      source.onended = () => {
        setPlaying(null)
        previewSourceRef.current = null
      }
      source.start(0)
    } catch (e) {
      if (e?.name === 'AbortError') return
      setError('Voice preview failed. Is the backend running with ELEVENLABS_API_KEY set?')
      setPlaying(null)
    }
  }

  const handleStart = () => {
    if (!patient) {
      navigate('/login')
      return
    }
    if (!prePrompt.trim()) return setError('Please describe your symptoms')
    setError('')
    const selectedDoctor = DOCTOR_TYPES.find(d => d.id === doctorType)
    const dMeta = dictationMetaForLocale(dictationSttLocale)
    navigate('/consult', {
      state: {
        doctorType: selectedDoctor.label.replace('\n', ' '),
        voiceType,
        prePrompt: prePrompt.trim(),
        symptomInputLocale: dictationSttLocale,
        symptomInputLanguage: dMeta.label,
      }
    })
  }

  if (!patient) {
    return (
      <div className="h-dvh w-full bg-[#0d1117] flex items-center justify-center px-6">
        <p className="text-slate-500 text-sm">Redirecting to sign in…</p>
      </div>
    )
  }

  return (
    <div className="h-dvh min-h-0 w-full bg-[#0d1117] flex flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 w-full min-w-0 grid-cols-1 [grid-template-rows:minmax(0,1fr)] justify-items-center">
        <div className="flex h-full min-h-0 w-full max-w-lg flex-col">

          {/* ── Header ── */}
          <header className="shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 border-b border-white/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                <Stethoscope size={15} className="text-white" />
              </div>
              <span className="text-[15px] font-bold text-white tracking-tight">MediVoice</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Link
                to="/my-records"
                className="text-[11px] font-medium text-blue-400 border border-blue-500/25 px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/15 transition-colors"
              >
                My MCs
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearPatientSession()
                  navigate('/login', { replace: true })
                }}
                className="text-[11px] text-slate-400 border border-white/10 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
              >
                Sign out
              </button>
            </div>
          </header>

          {/* ── Scrollable form ── */}
          <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
            <div className="px-5 pt-6 pb-16 flex flex-col gap-6">

              {/* ── Hero ── */}
              <div className="text-center flex flex-col items-center gap-2.5">
                <div className="inline-flex items-center gap-1.5 bg-blue-500/10 text-blue-400 text-[11px] font-semibold px-3 py-1.5 rounded-full border border-blue-500/20">
                  <Mic size={10} />
                  AI Voice Consultation
                </div>
                <h1 className="text-[27px] font-extrabold text-white leading-[1.15] tracking-tight">
                  See a doctor.<br />
                  <span className="text-blue-400">From your phone.</span>
                </h1>
                <p className="text-slate-500 text-[13px] leading-relaxed max-w-xs">
                  Talk to our AI · reviewed by a licensed GP · get your MC digitally
                </p>
                <p className="text-slate-400 text-[13px] mt-1">
                  Signed in as <span className="text-slate-200 font-medium">{patient.name}</span>
                </p>
              </div>

              {/* ── Step 1: Doctor type ── */}
              <Section step="1" title="Doctor type">
                <div className="grid grid-cols-3 gap-3 min-w-0">
                  {DOCTOR_TYPES.map(({ id, label, icon: Icon }) => {
                    const active = doctorType === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setDoctorType(id)}
                        className={`group min-w-0 flex flex-col items-center gap-3 rounded-2xl border p-3.5 sm:p-4 text-center transition-all active:scale-[0.98] ${
                          active
                            ? 'border-blue-500 bg-blue-500/[0.12] shadow-[0_0_0_1px_rgba(59,130,246,0.35)] shadow-blue-500/10'
                            : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14] hover:bg-white/[0.05]'
                        }`}
                      >
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-colors ${
                            active
                              ? 'border-blue-400/35 bg-blue-500/20 text-blue-400'
                              : 'border-white/[0.08] bg-white/[0.05] text-slate-500 group-hover:border-white/15 group-hover:text-slate-400'
                          }`}
                        >
                          <Icon size={22} strokeWidth={active ? 2 : 1.75} className="shrink-0" />
                        </div>
                        <div
                          className={`flex min-h-[2.75rem] w-full items-center justify-center text-[11px] font-semibold leading-snug tracking-tight whitespace-pre-line px-0.5 ${
                            active ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {label}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Section>

              {/* ── Step 2: Doctor voice ── */}
              <Section step="2" title="Doctor voice">
                {/* Language filter */}
                <div className="flex gap-2 min-w-0">
                  {LANG_TABS.map(({ id, label, flag }) => {
                    const isSpicy = id === 'spicy'
                    const active  = lang === id
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => handleLangChange(id)}
                        className={`flex-1 min-w-0 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-center transition-all active:scale-95 ${
                          active
                            ? isSpicy
                              ? 'border-pink-500 bg-pink-500/15'
                              : 'border-blue-500 bg-blue-500/15'
                            : isSpicy
                              ? 'border-pink-500/30 bg-pink-500/5 hover:border-pink-500/60'
                              : 'border-white/10 bg-white/[0.04] hover:border-blue-500/30'
                        }`}
                      >
                        <span className="text-sm leading-none">{flag}</span>
                        <span className={`text-[9px] font-bold ${
                          active
                            ? isSpicy ? 'text-pink-300' : 'text-blue-300'
                            : isSpicy ? 'text-pink-500' : 'text-slate-500'
                        }`}>{label}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Doctor cards */}
                <div className="grid grid-cols-2 gap-3">
                  {visibleVoices.map((voice) => {
                    const isSelected = voiceType === voice.id
                    const isPlaying  = playing === voice.id
                    const isSpicy    = lang === 'spicy'
                    const accent     = isSpicy ? 'pink' : 'purple'
                    return (
                      <button
                        key={voice.id}
                        type="button"
                        onClick={() => {
                          setVoiceType(voice.id)
                          void playPreview(voice)
                        }}
                        className={`relative flex flex-col rounded-2xl border text-left transition-all active:scale-[0.97] overflow-hidden ${
                          isSelected
                            ? isSpicy
                              ? 'border-pink-500 bg-pink-500/10 shadow-lg shadow-pink-900/30'
                              : 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-900/20'
                            : isSpicy
                              ? 'border-pink-500/20 bg-pink-500/5 hover:border-pink-500/40'
                              : 'border-white/10 bg-white/[0.03] hover:border-purple-500/30'
                        }`}
                      >
                        {/* Photo */}
                        <div className="relative w-full aspect-[3/2] overflow-hidden">
                          <img src={voice.photo} alt={voice.label} className="w-full h-full object-cover object-top" />
                          {isSelected && (
                            <div className={`absolute inset-0 ring-2 ring-inset ${isSpicy ? 'ring-pink-500' : 'ring-purple-500'}`} />
                          )}
                          {/* Spicy shimmer overlay */}
                          {isSpicy && (
                            <div className="absolute inset-0 bg-gradient-to-t from-pink-900/40 via-transparent to-transparent" />
                          )}
                        </div>

                        {/* Info — generous inset so copy & controls clear the card border / radius */}
                        <div className="px-6 pt-4 pb-6 flex flex-col gap-2.5 min-h-[4.5rem] bg-black/25">
                          <div className="flex items-start justify-between gap-4">
                            <span className={`text-[13px] font-semibold leading-tight truncate min-w-0 pr-1 pt-0.5 ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                              {voice.label}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                setVoiceType(voice.id)
                                void playPreview(voice)
                              }}
                              className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors mt-0.5 ${
                                isPlaying
                                  ? isSpicy ? 'bg-pink-500 text-white' : 'bg-purple-500 text-white'
                                  : isSpicy ? 'bg-pink-500/20 text-pink-400 hover:bg-pink-500/40' : 'bg-white/10 text-slate-400 hover:bg-purple-500/30 hover:text-purple-300'
                              }`}
                            >
                              {isPlaying ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
                            </button>
                          </div>
                          <p className={`text-[11px] leading-relaxed ${
                            isSelected
                              ? isSpicy ? 'text-pink-300' : 'text-purple-300'
                              : isSpicy ? 'text-pink-400/70' : 'text-slate-500'
                          }`}>
                            {voice.desc}
                          </p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </Section>

              {/* ── Step 4: Symptoms ── */}
              <Section step="3" title="Symptoms">
                <div className="flex flex-col gap-5">
                  <p className="text-[13px] leading-relaxed text-slate-500 -mt-1">
                    Tap quick tags to add detail, then describe anything else in your own words.
                  </p>

                  <div className="flex flex-wrap gap-x-2.5 gap-y-2.5">
                    {SYMPTOM_CHIPS.map(({ label, text }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => {
                          setError('')
                          setPrePrompt(p => p.trim() ? `${p.trim()} ${text}` : text)
                        }}
                        className="text-[12px] font-medium text-slate-200 bg-white/[0.06] border border-white/[0.12] hover:border-blue-400/45 hover:bg-blue-500/[0.12] px-4 py-2.5 rounded-xl transition-colors active:scale-[0.98] shadow-sm shadow-black/20"
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Your description
                    </span>
                    <textarea
                      value={prePrompt}
                      onChange={e => { setPrePrompt(e.target.value); setError('') }}
                      placeholder="Example: mild fever and sore throat since yesterday…"
                      rows={5}
                      className="input-base resize-none min-h-[8.5rem] py-4 leading-relaxed placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex flex-col gap-4">
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                      Speech &amp; edit
                    </span>
                    <div className="rounded-2xl border border-white/[0.12] bg-[#121820] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] overflow-hidden">
                      <div className="px-4 pt-4 pb-4 sm:px-5 sm:pt-5 sm:pb-5 border-b border-white/[0.07]">
                        <p className="text-[12px] font-semibold text-slate-300 mb-1">
                          Dictation language
                        </p>
                        <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                          Pick the language you will <span className="text-slate-400">speak</span>, then tap Dictate below.
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {DICTATION_LANG_OPTIONS.map((opt) => {
                            const active = dictationSttLocale === opt.stt
                            return (
                              <button
                                key={opt.stt}
                                type="button"
                                disabled={symptomListening}
                                onClick={() => setDictationSttLocale(opt.stt)}
                                title={`${opt.label} — ${opt.hint}`}
                                className={`flex flex-col items-center justify-center gap-2 rounded-xl border min-h-[5.25rem] min-w-0 px-3 py-3 text-center transition-all active:scale-[0.98] disabled:opacity-45 disabled:pointer-events-none ${
                                  active
                                    ? 'border-blue-500 bg-blue-500/15 text-white shadow-[0_0_0_1px_rgba(59,130,246,0.25)]'
                                    : 'border-white/[0.12] bg-white/[0.04] text-slate-300 hover:border-white/22 hover:bg-white/[0.07]'
                                }`}
                              >
                                <span className="text-[1.35rem] leading-none select-none" aria-hidden>{opt.flag}</span>
                                <span className="flex flex-col gap-0.5 min-w-0 w-full">
                                  <span className="text-[11px] font-bold leading-snug line-clamp-2">{opt.label}</span>
                                  <span className={`text-[10px] font-medium leading-tight ${active ? 'text-blue-200/80' : 'text-slate-500'}`}>{opt.hint}</span>
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                      <div className="p-3 sm:p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={toggleSymptomListen}
                            disabled={!sttSupported}
                            title={sttSupported ? (symptomListening ? 'Stop dictation' : 'Speak to fill the box') : 'Voice typing not available'}
                            aria-pressed={symptomListening}
                            className={`flex items-center justify-center gap-2.5 rounded-xl px-3 py-3.5 text-[13px] font-semibold transition-all active:scale-[0.99] disabled:opacity-40 disabled:pointer-events-none disabled:grayscale ${
                              symptomListening
                                ? 'bg-red-500/20 text-red-100 ring-1 ring-inset ring-red-400/40'
                                : 'bg-blue-600 text-white shadow-md shadow-blue-900/35 hover:bg-blue-500'
                            }`}
                          >
                            {symptomListening ? (
                              <MicOff size={18} className="shrink-0 opacity-95" strokeWidth={2.25} />
                            ) : (
                              <Mic size={18} className="shrink-0 opacity-95" strokeWidth={2.25} />
                            )}
                            {symptomListening ? 'Stop' : 'Dictate'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setPrePrompt('')
                              setError('')
                              setDictationReview(null)
                              dictationFinalRef.current = ''
                              dictationInterimRef.current = ''
                              stopSymptomListen()
                            }}
                            disabled={!prePrompt.trim() && !symptomListening}
                            title="Clear all text"
                            className={`flex items-center justify-center gap-2.5 rounded-xl px-3 py-3.5 text-[13px] font-semibold transition-all active:scale-[0.99] ring-1 ring-inset ${
                              prePrompt.trim() || symptomListening
                                ? 'bg-slate-700/90 text-white ring-slate-500/50 border border-slate-500/30 hover:bg-slate-600/95'
                                : 'bg-slate-900/60 text-slate-500 ring-white/[0.08] border border-white/[0.06]'
                            } disabled:pointer-events-none disabled:opacity-55`}
                          >
                            <Eraser size={18} className={`shrink-0 ${prePrompt.trim() || symptomListening ? 'text-slate-200' : 'text-slate-500'}`} strokeWidth={2.25} />
                            Clear
                          </button>
                        </div>
                      </div>
                    </div>
                    {symptomListening && (
                      <div className="space-y-2 pl-0.5">
                        <p className="text-[12px] leading-relaxed text-slate-400">
                          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-red-400 align-middle mr-2 animate-pulse" />
                          Listening in{' '}
                          <span className="text-slate-300 font-medium">{dictationMetaForLocale(dictationSttLocale).label}</span>
                          {' '}— tap Stop when you are done.
                        </p>
                        {dictationPreview ? (
                          <p className="text-[12px] leading-relaxed text-slate-300/90 rounded-lg border border-white/[0.08] bg-black/25 px-3 py-2">
                            <span className="font-semibold text-slate-500">Live: </span>
                            {dictationPreview}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </div>

                  {error && (
                    <p className="text-red-400 text-[13px] font-medium">{error}</p>
                  )}
                </div>
              </Section>

              {/* ── CTA ── */}
              <div className="flex flex-col gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleStart}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2.5 text-[15px] transition-colors shadow-lg shadow-blue-600/25"
                >
                  <Stethoscope size={18} strokeWidth={2.25} className="shrink-0 opacity-95" />
                  Start Consultation
                </button>
                <div className="flex items-center justify-center gap-1.5 text-slate-600 text-[11px]">
                  <ShieldCheck size={12} className="shrink-0" />
                  <span>Emergency? Call <span className="text-slate-400 font-semibold">995</span></span>
                </div>
              </div>

            </div>
          </main>
        </div>
      </div>

      {dictationReview !== null && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-4 bg-black/65 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dictation-review-title"
          onClick={() => setDictationReview(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#151b26] shadow-2xl shadow-black/50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-white/[0.06]">
              <div>
                <h2 id="dictation-review-title" className="text-base font-bold text-white tracking-tight">
                  Check your dictation
                </h2>
                <p className="text-[13px] text-slate-400 mt-1 leading-relaxed">
                  Is this what you want to add to your symptoms? Edit if needed, then confirm.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDictationReview(null)}
                className="shrink-0 rounded-lg p-2 text-slate-500 hover:bg-white/[0.08] hover:text-slate-300 transition-colors"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <textarea
                value={dictationReview}
                onChange={(e) => setDictationReview(e.target.value)}
                rows={5}
                className="input-base resize-none w-full text-[14px] leading-relaxed min-h-[7rem]"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Dictation language:{' '}
                <span className="font-medium text-slate-400">
                  {dictationMetaForLocale(dictationSttLocale).label}
                </span>{' '}
                <span className="text-slate-600">({dictationSttLocale})</span>
                {' — '}
                sent with your consultation so the AI can interpret the wording correctly.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setDictationReview(null)}
                  className="w-full sm:w-auto rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-[13px] font-semibold text-slate-300 hover:bg-white/[0.08] transition-colors"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const t = (dictationReview || '').trim()
                    if (t) {
                      setPrePrompt((p) => {
                        const cur = p.trim()
                        return cur ? `${cur} ${t}` : t
                      })
                      setError('')
                    }
                    setDictationReview(null)
                  }}
                  className="w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-3 text-[13px] font-semibold text-white shadow-lg shadow-blue-600/20 transition-colors"
                >
                  Add to description
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Section({ step, title, children }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 pt-0.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/25 text-blue-300 text-[11px] font-bold shrink-0 ring-1 ring-blue-500/20">
          {step}
        </span>
        <span className="text-[11px] font-bold text-slate-300 tracking-[0.14em] uppercase">{title}</span>
      </div>
      {children}
    </div>
  )
}
