import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { Mic, MicOff, PhoneOff, Stethoscope, Loader2, ChevronDown, ChevronUp } from 'lucide-react'
import axios from 'axios'

const API = '/api'

export default function Consult() {
  const navigate = useNavigate()
  const location = useLocation()
  const { name, doctorType, voiceType, prePrompt } = location.state || {}

  const [status, setStatus] = useState('connecting') // connecting | active | ending | done
  const [muted, setMuted] = useState(false)
  const [transcript, setTranscript] = useState([])
  const [agentId, setAgentId] = useState(null)
  const [channel, setChannel] = useState(null)
  const [uid, setUid] = useState(null)
  const [error, setError] = useState(null)
  const [duration, setDuration] = useState(0)

  const clientRef = useRef(null)
  const localTrackRef = useRef(null)
  const timerRef = useRef(null)
  const transcriptEndRef = useRef(null)

  useEffect(() => {
    if (!name) {
      navigate('/')
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
      })

      await client.join(app_id, channelName, token, userUid)

      const micTrack = await AgoraRTC.createMicrophoneAudioTrack()
      localTrackRef.current = micTrack
      await client.publish(micTrack)

      // Start AI agent
      const agentRes = await axios.post(`${API}/agent/start`, {
        channel: channelName,
        uid: userUid,
        patient_name: name,
        pre_prompt: prePrompt,
        doctor_type: doctorType,
        voice_type: voiceType,
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
      setError(err?.response?.data?.detail || err.message || 'Failed to connect. Please try again.')
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
        .join(' ') || `Patient ${name} consulted for: ${prePrompt}`

      const consultRes = await axios.post(`${API}/consultation`, {
        patient_name: name,
        channel: channel || '',
        chief_complaint: prePrompt,
        ai_summary: summary,
        transcript: fullTranscript,
        doctor_type: doctorType,
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
      localTrackRef.current?.stop()
      localTrackRef.current?.close()
      await clientRef.current?.leave()
    } catch {}
  }

  function toggleMute() {
    if (localTrackRef.current) {
      if (muted) {
        localTrackRef.current.setEnabled(true)
      } else {
        localTrackRef.current.setEnabled(false)
      }
      setMuted(!muted)
    }
  }

  const [showTranscript, setShowTranscript] = useState(false)

  if (!name) return null

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col max-w-lg mx-auto">

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

      {/* Doctor Avatar — takes most of the screen */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 gap-4">
        {error ? (
          <div className="w-full bg-red-500/20 border border-red-500/30 rounded-2xl p-5 text-red-300 text-center">
            <p className="font-semibold mb-1">Connection Error</p>
            <p className="text-sm">{error}</p>
            <button onClick={() => navigate('/')} className="mt-4 bg-white/10 px-5 py-2 rounded-xl text-white text-sm">Go Back</button>
          </div>
        ) : (
          <>
            {/* Pulsing avatar */}
            <div className="relative">
              {status === 'active' && (
                <>
                  <div className="absolute inset-0 rounded-full bg-blue-500/20 animate-ping scale-125" />
                  <div className="absolute inset-0 rounded-full bg-blue-500/10 animate-ping scale-150 animation-delay-150" />
                </>
              )}
              <div className={`relative w-32 h-32 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center text-6xl shadow-2xl shadow-blue-900/50 ${status === 'connecting' ? 'opacity-50' : ''}`}>
                {voiceType?.includes('female') ? '👩‍⚕️' : '👨‍⚕️'}
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-white font-bold text-xl">AI {doctorType}</h2>
              <p className="text-slate-400 text-sm mt-0.5">Consulting {name}</p>
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

      {/* Fixed bottom controls */}
      <div className="px-6 pb-10 pt-4 border-t border-card">
        <div className="flex items-center justify-center gap-8">
          {/* Mute */}
          <button
            onClick={toggleMute}
            disabled={status !== 'active'}
            className={`w-14 h-14 rounded-full flex flex-col items-center justify-center gap-1 transition-all active:scale-95 disabled:opacity-30 ${
              muted ? 'bg-red-500/20 border-2 border-red-500 text-red-400' : 'bg-card border-2 border-card text-white'
            }`}
          >
            {muted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* End call */}
          <button
            onClick={endSession}
            disabled={status !== 'active'}
            className="w-20 h-20 rounded-full bg-red-600 active:bg-red-700 flex items-center justify-center shadow-xl shadow-red-900/50 transition-all active:scale-95 disabled:opacity-30"
          >
            <PhoneOff size={28} className="text-white" />
          </button>

          {/* Spacer to balance layout */}
          <div className="w-14" />
        </div>
        <p className="text-center text-xs text-slate-600 mt-3">Tap the red button to end & submit for review</p>
      </div>
    </div>
  )
}
