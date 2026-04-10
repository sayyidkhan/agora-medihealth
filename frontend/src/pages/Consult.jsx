import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { AgoraVoiceAI, AgoraVoiceAIEvents, CovSubRenderController, TurnStatus } from 'agora-agent-client-toolkit'
import { Mic, MicOff, Video, VideoOff, PhoneOff, Stethoscope, Loader2 } from 'lucide-react'
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
  const remoteDoctorVideoRef = useRef(null)      // compact view container
  const remoteDoctorVideoFullRef = useRef(null)  // fullscreen view container
  const remoteVideoTrackRef = useRef(null)        // the actual agora video track
  const timerRef = useRef(null)
  const transcriptEndRef = useRef(null)
  const voiceAIRef = useRef(null)
  const sessionStartedRef = useRef(false)

  const [remoteHasVideo, setRemoteHasVideo] = useState(false)
  const [hasLocalVideo, setHasLocalVideo] = useState(false)
  /** Local camera preview + publish; false = video off (not sent, PiP hidden). */
  const [showMyVideo, setShowMyVideo] = useState(true)
  /** true = full-screen doctor portrait, false = compact header + transcript */
  const [doctorView, setDoctorView] = useState(false)

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
    if (sessionStartedRef.current) return
    sessionStartedRef.current = true
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
  }, [hasLocalVideo, showMyVideo, doctorView])

  // Replay remote video into whichever container is currently visible
  useEffect(() => {
    const track = remoteVideoTrackRef.current
    if (!track || !remoteHasVideo) return
    const el = doctorView ? remoteDoctorVideoFullRef.current : remoteDoctorVideoRef.current
    if (el) track.play(el)
  }, [doctorView, remoteHasVideo])

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
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' })
      clientRef.current = client

      // Tell toolkit which UID is the local user so it can distinguish agent vs patient
      CovSubRenderController.self_uid = userUid

      // Initialize AgoraVoiceAI toolkit for live transcript (RTC data stream, no RTM needed)
      const ai = await AgoraVoiceAI.init({ rtcEngine: client, enableLog: false })
      voiceAIRef.current = ai

      ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (messages) => {
        // messages: TranscriptHelperItem[] — uid is the RTC uid string, text is spoken text
        // status: TurnStatus.IN_PROGRESS=0, END=1, INTERRUPTED=2
        // Group by turn_id so the agent's streamed chunks merge into one bubble
        const turnMap = new Map()
        for (const m of messages) {
          const role = String(m.uid) === String(userUid) ? 'user' : 'agent'
          const key = `${role}-${m.turn_id}`
          const existing = turnMap.get(key)
          if (existing) {
            // Append text if different, keep latest status
            const combined = existing.text.endsWith(m.text) ? existing.text : existing.text + (m.text ? ' ' + m.text : '')
            turnMap.set(key, { ...existing, text: combined, isFinal: m.status !== TurnStatus.IN_PROGRESS ? true : existing.isFinal })
          } else {
            turnMap.set(key, {
              role,
              text: m.text,
              isFinal: m.status !== TurnStatus.IN_PROGRESS,
              ts: m._time || Date.now(),
            })
          }
        }
        setTranscript(Array.from(turnMap.values()))
      })

      client.on('user-published', async (user, mediaType) => {
        // Never subscribe to our own published tracks — causes echo
        if (user.uid === userUid) return
        await client.subscribe(user, mediaType)
        if (mediaType === 'audio') {
          user.audioTrack.play()
        }
        if (mediaType === 'video' && user.videoTrack) {
          remoteVideoTrackRef.current = user.videoTrack
          setRemoteHasVideo(true)
          const el = remoteDoctorVideoRef.current
          if (el) user.videoTrack.play(el)
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

      const resolvedAgentId = agentRes.data?.agent_id || agentRes.data?.name || 'agent'
      setAgentId(resolvedAgentId)

      // Subscribe to transcript stream — must be called after agent has joined
      ai.subscribeMessage(channelName)

      setStatus('active')
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
      voiceAIRef.current?.destroy()
      voiceAIRef.current = null
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

      {/* Main content */}
      <div className="flex-1 flex flex-col px-4 py-3 gap-3 min-h-0 overflow-hidden">
        {error ? (
          <div className="w-full bg-red-500/20 border border-red-500/30 rounded-2xl p-5 text-red-300 text-left">
            <p className="font-semibold mb-2 text-center">Connection Error</p>
            <p className="text-sm text-red-200/95 whitespace-pre-wrap break-words max-h-[min(50vh,320px)] overflow-y-auto leading-relaxed">{error}</p>
            <button onClick={() => navigate('/')} className="mt-4 bg-white/10 px-5 py-2 rounded-xl text-white text-sm">Go Back</button>
          </div>
        ) : doctorView ? (
          /* ── Full-screen doctor view ── tap anywhere to go back to transcript */
          <div
            className="flex-1 relative rounded-2xl overflow-hidden bg-slate-900 border border-white/10 cursor-pointer"
            onClick={() => setDoctorView(false)}
            title="Tap to show transcript"
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
              ref={remoteDoctorVideoFullRef}
              className={`absolute inset-0 z-[1] h-full w-full bg-black transition-opacity duration-300 ${
                remoteHasVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />
            {/* Name overlay */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[2] bg-gradient-to-t from-black/80 via-black/30 to-transparent px-4 pb-4 pt-12">
              <p className="text-white font-semibold text-base">{doctor.name}</p>
              <p className="text-slate-300 text-xs mt-0.5">{doctorType}</p>
            </div>
            {/* Tap hint */}
            <div className="pointer-events-none absolute top-3 right-3 z-[3] bg-black/50 rounded-full px-2.5 py-1 text-[10px] text-white/70">
              Tap to show transcript
            </div>
            {/* Local PiP in doctor view */}
            {hasLocalVideo && showMyVideo && (
              <div className="absolute top-3 left-3 z-[3] w-16 h-20 overflow-hidden rounded-xl border border-white/25 bg-slate-800 shadow-lg">
                <div ref={localPipDivRef} className="h-full w-full" />
                <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 text-[9px] font-medium text-white">You</span>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Doctor card — compact horizontal layout, tap thumbnail to zoom */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setDoctorView(true)}
                title="Tap to view doctor"
                className={`relative w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border border-white/10 shrink-0 focus:outline-none ${
                  status === 'connecting' ? 'opacity-70' : 'active:scale-95 transition-transform'
                }`}
              >
                {status === 'active' && (
                  <div className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-blue-500/20 animate-pulse z-0" aria-hidden />
                )}
                <img
                  src={doctor.photo}
                  alt=""
                  className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300 ${
                    remoteHasVideo ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                <div
                  ref={remoteDoctorVideoRef}
                  className={`absolute inset-0 z-[1] h-full w-full bg-black transition-opacity duration-300 ${
                    remoteHasVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                />
                <div className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity">
                  <span className="text-white text-[9px] font-medium">Zoom</span>
                </div>
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm">{doctor.name}</p>
                <p className="text-slate-400 text-xs">{doctorType}</p>
                <p className="text-slate-500 text-xs mt-0.5">
                  Consulting <span className="text-slate-300">{patientName}</span>
                </p>
              </div>
              {/* Local PiP */}
              {hasLocalVideo && showMyVideo && (
                <div className="relative w-12 h-16 overflow-hidden rounded-xl border border-white/20 bg-slate-800 shrink-0">
                  <div ref={localPipDivRef} className="h-full w-full" />
                  <span className="pointer-events-none absolute bottom-0.5 left-0.5 rounded bg-black/50 px-1 text-[9px] font-medium text-white">You</span>
                </div>
              )}
              {status === 'connecting' && (
                <div className="flex items-center gap-1 text-yellow-400 text-xs shrink-0">
                  <Loader2 size={12} className="animate-spin" />
                  Connecting…
                </div>
              )}
              {status === 'ending' && (
                <div className="flex items-center gap-1 text-orange-400 text-xs shrink-0">
                  <Loader2 size={12} className="animate-spin" />
                  Saving…
                </div>
              )}
            </div>

            {/* Transcript — always visible, fills remaining space */}
            <div className="flex-1 min-h-0 flex flex-col bg-[#161b22] rounded-2xl border border-white/8 overflow-hidden">
              {/* AAP Phase indicator */}
              {(() => {
                const agentText = transcript.filter(m => m.role === 'agent').map(m => m.text).join(' ').toLowerCase()
                const isDone = agentText.includes("being sent to our doctor") || agentText.includes("take care and feel better")
                const isPrescribe = isDone
                  || agentText.includes("would you prefer to pick it up")
                  || agentText.includes("nearest clinic") || agentText.includes("have it delivered")
                  || agentText.includes("here's what i'd suggest")
                const isAddress = !isPrescribe && (
                  agentText.includes("based on what you've told me")
                  || agentText.includes("let me address")
                  || agentText.includes("good picture of what")
                )
                const phase = isPrescribe ? 3 : isAddress ? 2 : 1

                // Fulfilment sub-label for prescribe phase
                const fulfilment = agentText.includes("nearest clinic") && agentText.includes("collection")
                  ? '🏥 Clinic pickup'
                  : agentText.includes("delivered to you")
                  ? '🛵 Home delivery'
                  : null

                const phases = [
                  { label: 'Analyse',   color: phase === 1 ? 'text-blue-400 border-blue-500/50 bg-blue-500/10'     : phase > 1 ? 'text-slate-500 border-white/8 bg-white/3' : 'text-slate-600 border-white/5 bg-transparent' },
                  { label: 'Address',   color: phase === 2 ? 'text-violet-400 border-violet-500/50 bg-violet-500/10' : phase > 2 ? 'text-slate-500 border-white/8 bg-white/3' : 'text-slate-600 border-white/5 bg-transparent' },
                  { label: fulfilment ?? 'Prescribe', color: phase === 3 ? 'text-emerald-400 border-emerald-500/50 bg-emerald-500/10' : 'text-slate-600 border-white/5 bg-transparent' },
                ]
                return (
                  <div className="flex items-center gap-1 px-3 py-2 border-b border-white/5 shrink-0">
                    {phases.map((p, i) => (
                      <div key={i} className="flex items-center gap-1 flex-1">
                        <div className={`flex-1 flex items-center justify-center px-1.5 py-1 rounded-lg border text-center transition-all duration-500 ${p.color}`}>
                          <span className="text-[10px] font-semibold leading-tight">{p.label}</span>
                        </div>
                        {i < 2 && <span className="text-slate-700 text-[10px] shrink-0">›</span>}
                      </div>
                    ))}
                  </div>
                )
              })()}
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 shrink-0">
                <span className="text-xs text-slate-500 font-medium">Conversation</span>
                {transcript.length > 0 && (
                  <span className="text-[10px] text-slate-600">{transcript.filter(m => m.isFinal).length} turns</span>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {transcript.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <Mic size={14} className="text-slate-500" />
                    </div>
                    <p className="text-slate-500 text-xs">Conversation will appear here as you speak…</p>
                  </div>
                ) : (
                  transcript.map((msg, i) => (
                    <div key={i} className={`flex flex-col gap-0.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                      <span className="text-[10px] text-slate-600 px-1">
                        {msg.role === 'user' ? 'You' : doctor.name}
                      </span>
                      <div className={`max-w-[88%] px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                        msg.role === 'user'
                          ? `bg-blue-600 text-white ${!msg.isFinal ? 'opacity-60' : 'opacity-100'}`
                          : `bg-white/8 text-slate-200 ${!msg.isFinal ? 'opacity-60 italic' : 'opacity-100'}`
                      }`}>
                        {msg.text}
                        {!msg.isFinal && <span className="ml-1 animate-pulse opacity-70">…</span>}
                      </div>
                    </div>
                  ))
                )}
                <div ref={transcriptEndRef} />
              </div>
            </div>
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
