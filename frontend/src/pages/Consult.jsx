import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Stethoscope, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'
import { getPatientSession } from '../patientSession'

const API = '/api'

/** Matches Landing.jsx voice ids — used for doctor portrait (agent has no video track). */
const VOICE_META = {
  female: { photo: '/dr-sarah.png', name: 'Dr. Sarah' },
  male: { photo: '/dr-james.png', name: 'Dr. James' },
  premium_female: { photo: '/dr-serena.png', name: 'Dr. Serena' },
  premium_male: { photo: '/dr-daniel.png', name: 'Dr. Daniel' },
  zh_female: { photo: '/dr-weilin.png', name: 'Dr. Wei Lin' },
  zh_male: { photo: '/dr-ming.png', name: 'Dr. Ming' },
  ms_female: { photo: '/dr-aisha.png', name: 'Dr. Aisha' },
  ms_male: { photo: '/dr-hafiz.png', name: 'Dr. Hafiz' },
  ta_female: { photo: '/dr-priya.png', name: 'Dr. Priya' },
  ta_male: { photo: '/dr-arjun.png', name: 'Dr. Arjun' },
  spicy_female: { photo: '/dr-valentina.png', name: 'Dr. Valentina' },
  spicy_male: { photo: '/dr-rico.png', name: 'Dr. Rico' },
}

function voiceMeta(voiceType) {
  if (!voiceType) return VOICE_META.female
  return VOICE_META[voiceType] || VOICE_META.female
}

function formatApiError(detail) {
  if (detail == null) return null
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === 'object' ? JSON.stringify(d) : String(d))).join('\n')
  }
  if (typeof detail === 'object') return JSON.stringify(detail, null, 2)
  return String(detail)
}

export default function Consult() {
  const navigate = useNavigate()
  const location = useLocation()
  const session = getPatientSession()
  const {
    doctorType,
    voiceType,
    prePrompt,
    symptomInputLocale,
    symptomInputLanguage,
  } = location.state || {}
  const patientName = session?.name || ''

  const [status, setStatus] = useState('connecting') // connecting | active | ending | done
  const [muted, setMuted] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [agentId, setAgentId] = useState(null)
  const [channel, setChannel] = useState(null)
  const [uid, setUid] = useState(null)
  const [error, setError] = useState(null)
  const [duration, setDuration] = useState(0)

  const clientRef = useRef(null)
  const localMicRef = useRef(null)
  const localCameraRef = useRef(null)
  const localPipDivRef = useRef(null)
  const remoteDoctorVideoRef = useRef(null)
  const timerRef = useRef(null)
  const transcriptEndRef = useRef(null)

  const [remoteHasVideo, setRemoteHasVideo] = useState(false)
  const [hasLocalVideo, setHasLocalVideo] = useState(false)
  /** Local camera preview + publish; false = video off (not sent, PiP hidden). */
  const [showMyVideo, setShowMyVideo] = useState(true)

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true })
      return
    }
    if (!patientName) {
      navigate('/login', { replace: true })
      return
    }
    if (!prePrompt?.trim() || !doctorType) {
      navigate('/', { replace: true })
      return
    }
    startSession()
    return () => cleanup()
  }, [])

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  useEffect(() => {
    if (status === 'active') {
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }
    return () => clearInterval(timerRef.current)
  }, [status])

  useEffect(() => {
    if (!hasLocalVideo || !showMyVideo) return
    const track = localCameraRef.current
    const el = localPipDivRef.current
    if (track && el) track.play(el)
  }, [hasLocalVideo, showMyVideo])

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  async function startSession() {
    try {
      const channelName = `medivoice-${Date.now()}`
      const userUid = Math.floor(Math.random() * 100000)
      setChannel(channelName)
      setUid(userUid)

      // Get token
      const tokenRes = await axios.post(`${API}/token`, { channel: channelName, uid: userUid })
      const { token, app_id } = tokenRes.data

      // Join Agora RTC
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' })
      clientRef.current = client

      client.on('stream-message', (uid, msg) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(msg))
          if (data.type === 'transcript') {
            setTranscript(prev => [...prev, { role: data.role, text: data.text, ts: Date.now() }])
          }
        } catch {}
      })

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType)
        if (mediaType === 'audio') {
          user.audioTrack.play()
        }
        if (mediaType === 'video' && user.videoTrack) {
          setRemoteHasVideo(true)
          const el = remoteDoctorVideoRef.current
          if (el) {
            user.videoTrack.play(el)
          }
        }
      })

      await client.join(app_id, channelName, token, userUid)

      const micTrack = await AgoraRTC.createMicrophoneAudioTrack()
      localMicRef.current = micTrack

      let cameraTrack = null
      try {
        cameraTrack = await AgoraRTC.createCameraVideoTrack({
          encoderConfig: '480p_1',
          facingMode: 'user',
        })
        localCameraRef.current = cameraTrack
      } catch (camErr) {
        console.warn('Camera unavailable (demo will be audio-only for your video):', camErr)
      }

      if (cameraTrack) setHasLocalVideo(true)

      await client.publish(cameraTrack ? [micTrack, cameraTrack] : micTrack)

      // Start AI agent
      const agentRes = await axios.post(`${API}/agent/start`, {
        channel: channelName,
        uid: userUid,
        patient_name: patientName,
        pre_prompt: prePrompt,
        doctor_type: doctorType,
        voice_type: voiceType,
        symptom_input_locale: symptomInputLocale || null,
        symptom_input_language: symptomInputLanguage || null,
      })

      setAgentId(agentRes.data?.agent_id || agentRes.data?.name || 'agent')
      setStatus('active')

      setTranscript([{
        role: 'system',
        text: `Connected to MediVoice AI — ${doctorType}. Speak naturally, the doctor is listening.`,
        ts: Date.now(),
      }])
    } catch (err) {
      console.error(err)
      const detail = err?.response?.data?.detail
      setError(formatApiError(detail) || err.message || 'Failed to connect. Please try again.')
      setStatus('error')
    }
  }

  async function endSession() {
    setStatus('ending')
    clearInterval(timerRef.current)

    try {
      if (agentId && channel) {
        await axios.post(`${API}/agent/stop`, { agent_id: agentId, channel })
      }

      // Save consultation
      const fullTranscript = transcript
        .filter(t => t.role !== 'system')
        .map(t => `[${t.role.toUpperCase()}]: ${t.text}`)
        .join('\n')

      const summary = transcript
        .filter(t => t.role === 'agent')
        .slice(-3)
        .map(t => t.text)
        .join(' ') || `Patient ${patientName} consulted for: ${prePrompt}`

      const consultRes = await axios.post(`${API}/consultation`, {
        patient_name: patientName,
        patient_id: session?.id || null,
        channel: channel || '',
        chief_complaint: prePrompt,
        ai_summary: summary,
        transcript: fullTranscript,
        doctor_type: doctorType,
        voice_type: voiceType || null,
        symptom_input_locale: symptomInputLocale || null,
        symptom_input_language: symptomInputLanguage || null,
      })

      await cleanup()
      navigate(`/status/${consultRes.data.id}`, { state: { consultation: consultRes.data } })
    } catch (err) {
      console.error(err)
      await cleanup()
      navigate('/')
    }
  }

  async function cleanup() {
    try {
      localMicRef.current?.stop()
      localMicRef.current?.close()
      localCameraRef.current?.stop()
      localCameraRef.current?.close()
      localMicRef.current = null
      localCameraRef.current = null
      await clientRef.current?.leave()
    } catch {}
  }

  function toggleMute() {
    if (localMicRef.current) {
      localMicRef.current.setEnabled(muted)
      setMuted(!muted)
    }
  }

  function toggleMyVideo() {
    const track = localCameraRef.current
    if (!track) return
    setShowMyVideo((on) => {
      const next = !on
      track.setEnabled(next)
      return next
    })
  }

  const [showTranscript, setShowTranscript] = useState(false)

  const doctor = voiceMeta(voiceType)

  if (!patientName) return null

  return (
    <div className="h-dvh w-full bg-[#0d1117] flex flex-col overflow-hidden">
    <div className="grid min-h-0 flex-1 w-full grid-cols-1 [grid-template-rows:minmax(0,1fr)] justify-items-center">
    <div className="flex h-full min-h-0 w-full max-w-lg flex-col">

      {/* Status bar */}
      <div className={`h-1 w-full transition-all ${
        status === 'active' ? 'bg-green-500' :
        status === 'connecting' ? 'bg-yellow-500 animate-pulse' :
        status === 'ending' ? 'bg-orange-500' : 'bg-red-500'
      }`} />

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 border-b border-card">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center">
            <Stethoscope size={13} className="text-white" />
          </div>
          <span className="font-bold text-white text-sm">MediVoice</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'active' && (
            <span className="text-slate-400 text-xs font-mono">{formatDuration(duration)}</span>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
            status === 'active' ? 'bg-green-500/20 text-green-400' :
            status === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
            status === 'ending' ? 'bg-orange-500/20 text-orange-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {status === 'connecting' ? 'Connecting…' :
             status === 'active' ? '● Live' :
             status === 'ending' ? 'Ending…' : 'Error'}
          </span>
        </div>
      </header>

      {/* Doctor portrait / remote video + local PiP */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 gap-4 min-h-0">
        {error ? (
          <div className="w-full bg-red-500/20 border border-red-500/30 rounded-2xl p-5 text-red-300 text-left">
            <p className="font-semibold mb-2 text-center">Connection Error</p>
            <p className="text-sm text-red-200/95 whitespace-pre-wrap break-words max-h-[min(50vh,320px)] overflow-y-auto leading-relaxed">{error}</p>
            <button onClick={() => navigate('/')} className="mt-4 bg-white/10 px-5 py-2 rounded-xl text-white text-sm">Go Back</button>
          </div>
        ) : (
          <>
            <div
              className={`relative w-full max-w-[min(100%,280px)] aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 shadow-2xl shadow-blue-950/40 border border-white/10 shrink-0 ${
                status === 'connecting' ? 'opacity-70' : ''
              }`}
            >
              {status === 'active' && (
                <div className="pointer-events-none absolute -inset-1 rounded-2xl bg-blue-500/15 animate-pulse z-0" aria-hidden />
              )}
              <img
                src={doctor.photo}
                alt=""
                className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${
                  remoteHasVideo ? 'opacity-0' : 'opacity-100'
                }`}
              />
              <div
                ref={remoteDoctorVideoRef}
                className={`absolute inset-0 z-[1] h-full w-full bg-black transition-opacity duration-300 ${
                  remoteHasVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
              />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/85 via-black/40 to-transparent px-3 pb-3 pt-10">
                <p className="text-white font-semibold text-base leading-tight">{doctor.name}</p>
                <p className="text-slate-300 text-xs mt-0.5">{doctorType}</p>
              </div>
              {hasLocalVideo && showMyVideo && (
                <div className="absolute top-2 right-2 z-[3] w-[30%] min-w-[76px] max-w-[120px] aspect-[3/4] overflow-hidden rounded-xl border-2 border-white/35 bg-slate-800 shadow-lg">
                  <div ref={localPipDivRef} className="h-full w-full" />
                  <span className="pointer-events-none absolute bottom-1 left-1 rounded bg-black/50 px-1 py-0.5 text-[10px] font-medium text-white">
                    You
                  </span>
                </div>
              )}
            </div>

            <div className="text-center">
              <h2 className="text-white font-bold text-lg">{doctor.name}</h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Consulting <span className="text-slate-300">{patientName}</span>
              </p>
              {status === 'connecting' && (
                <div className="flex items-center justify-center gap-2 mt-3 text-yellow-400 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Connecting to doctor…
                </div>
              )}
              {status === 'ending' && (
                <div className="flex items-center justify-center gap-2 mt-3 text-orange-400 text-sm">
                  <Loader2 size={14} className="animate-spin" />
                  Saving consultation…
                </div>
              )}
            </div>

            {/* Transcript toggle */}
            <button
              onClick={() => setShowTranscript(v => !v)}
              className="flex items-center gap-1.5 text-slate-500 text-xs border border-card px-3 py-1.5 rounded-full"
            >
              {showTranscript ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              {showTranscript ? 'Hide transcript' : 'Show transcript'}
            </button>

            {/* Transcript */}
            {showTranscript && (
              <div className="w-full max-h-48 overflow-y-auto space-y-2 bg-card rounded-xl p-3 border border-card">
                {transcript.length === 0 ? (
                  <p className="text-slate-500 text-xs text-center py-4">Waiting for conversation to start…</p>
                ) : (
                  transcript.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                        msg.role === 'user' ? 'bg-blue-600 text-white' :
                        msg.role === 'system' ? 'text-slate-500 italic text-center w-full' :
                        'bg-white/10 text-slate-200'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom controls */}
      <div className="shrink-0 px-6 pb-10 pt-4 border-t border-card">
        <div className="flex items-center justify-center gap-8">
          {/* Mute mic */}
          <button
            type="button"
            onClick={toggleMute}
            disabled={status !== 'active'}
            aria-pressed={muted}
            title={muted ? 'Unmute microphone' : 'Mute microphone'}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-30 ${
              muted ? 'bg-red-500/20 border-2 border-red-500 text-red-400' : 'bg-card border-2 border-card text-white'
            }`}
          >
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* End call */}
          <button
            type="button"
            onClick={endSession}
            disabled={status !== 'active'}
            title="End call"
            className="w-20 h-20 rounded-full bg-red-600 active:bg-red-700 flex items-center justify-center shadow-xl shadow-red-900/50 transition-all active:scale-95 disabled:opacity-30"
          >
            <PhoneOff size={28} className="text-white" />
          </button>

          {/* Camera on/off (only when a camera track exists) */}
          <button
            type="button"
            onClick={toggleMyVideo}
            disabled={status !== 'active' || !hasLocalVideo}
            aria-pressed={showMyVideo}
            title={
              !hasLocalVideo
                ? 'No camera'
                : showMyVideo
                  ? 'Turn off camera'
                  : 'Turn on camera'
            }
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-30 ${
              !showMyVideo ? 'bg-amber-500/20 border-2 border-amber-500/60 text-amber-300' : 'bg-card border-2 border-card text-white'
            }`}
          >
            {!showMyVideo ? <VideoOff size={20} /> : <Video size={20} />}
          </button>
        </div>
        <p className="text-center text-xs text-slate-600 mt-3">
          Mic and camera toggles · Tap red to end & submit for review
        </p>
      </div>
    </div>
    </div>
    </div>
  )
}
