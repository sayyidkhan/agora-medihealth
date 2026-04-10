import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import AgoraRTC from 'agora-rtc-sdk-ng'
import { Mic, MicOff, PhoneOff, Stethoscope, Loader2 } from 'lucide-react'
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

  if (!name) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-blue-500 flex items-center justify-center">
            <Stethoscope size={18} className="text-white" />
          </div>
          <span className="font-bold text-white">MediVoice</span>
        </div>
        <div className="flex items-center gap-3">
          {status === 'active' && (
            <span className="text-slate-400 text-sm font-mono">{formatDuration(duration)}</span>
          )}
          <span className={`text-xs px-3 py-1 rounded-full ${
            status === 'active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
            status === 'connecting' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
            status === 'ending' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
            'bg-red-500/20 text-red-400 border border-red-500/30'
          }`}>
            {status === 'connecting' ? 'Connecting...' :
             status === 'active' ? '● Live' :
             status === 'ending' ? 'Ending...' : 'Error'}
          </span>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Doctor Avatar Panel */}
        <div className="md:w-1/3 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-white/10">
          <div className="relative mb-6">
            <div className={`w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-6xl ${status === 'active' ? 'animate-pulse' : ''}`}>
              {voiceType?.includes('female') ? '👩‍⚕️' : '👨‍⚕️'}
            </div>
            {status === 'active' && (
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-3 py-1 rounded-full">
                Speaking
              </div>
            )}
          </div>
          <h2 className="text-white font-semibold text-lg">AI {doctorType}</h2>
          <p className="text-slate-400 text-sm mt-1">MediVoice Clinical Assistant</p>
          <p className="text-slate-500 text-xs mt-4 text-center">Consulting: <span className="text-slate-300">{name}</span></p>

          {status === 'connecting' && (
            <div className="mt-6 flex items-center gap-2 text-yellow-400">
              <Loader2 size={16} className="animate-spin" />
              <span className="text-sm">Connecting to doctor...</span>
            </div>
          )}
        </div>

        {/* Transcript Panel */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-3 max-h-[60vh] md:max-h-none">
            {error ? (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-red-300">
                <p className="font-medium">Connection Error</p>
                <p className="text-sm mt-1">{error}</p>
                <button onClick={() => navigate('/')} className="mt-3 text-sm underline">Go back</button>
              </div>
            ) : transcript.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
                <Loader2 size={32} className="animate-spin" />
                <p>Waiting for the doctor to connect...</p>
              </div>
            ) : (
              transcript.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-sm'
                      : msg.role === 'system'
                      ? 'bg-white/5 text-slate-400 text-xs italic border border-white/10 w-full text-center'
                      : 'bg-white/10 text-slate-100 rounded-bl-sm'
                  }`}>
                    {msg.role === 'agent' && (
                      <span className="text-xs text-slate-400 block mb-1">AI Doctor</span>
                    )}
                    {msg.role === 'user' && (
                      <span className="text-xs text-blue-200 block mb-1">{name}</span>
                    )}
                    {msg.text}
                  </div>
                </div>
              ))
            )}
            <div ref={transcriptEndRef} />
          </div>

          {/* Controls */}
          <div className="border-t border-white/10 p-6 flex items-center justify-center gap-6">
            <button
              onClick={toggleMute}
              disabled={status !== 'active'}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                muted
                  ? 'bg-red-500/30 border-2 border-red-500 text-red-400'
                  : 'bg-white/10 border-2 border-white/20 text-white hover:bg-white/20'
              } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              {muted ? <MicOff size={22} /> : <Mic size={22} />}
            </button>

            <button
              onClick={endSession}
              disabled={status !== 'active'}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <PhoneOff size={24} className="text-white" />
            </button>
          </div>

          <p className="text-center text-xs text-slate-600 pb-4">
            Click the red button to end consultation and submit for doctor review
          </p>
        </div>
      </div>
    </div>
  )
}
