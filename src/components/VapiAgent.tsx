'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'

type ControlCommand =
  | 'mute-assistant'
  | 'unmute-assistant'
  | 'say-first-message'

interface VapiAgentProps {
  isActive: boolean
  roomId: string
  isMuted: boolean
  onCallStart?: () => void
  onCallEnd?: () => void
}

export default function VapiAgent({
  isActive,
  roomId,
  isMuted,
  onCallStart,
  onCallEnd,
}: VapiAgentProps) {
  const vapiRef = useRef<Vapi | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(0)
  const onCallStartRef = useRef(onCallStart)
  const onCallEndRef = useRef(onCallEnd)
  const hasActivatedRef = useRef(false)
  const greetingSentRef = useRef(false)
  const isStartingRef = useRef(false)
  const appliedMuteRef = useRef<boolean | null>(null)
  const currentCallIdRef = useRef<string | null>(null)
  const isMutedRef = useRef(isMuted)
  const callStorageKey = `vapi-call-${roomId}`

  useEffect(() => {
    onCallStartRef.current = onCallStart
  }, [onCallStart])

  useEffect(() => {
    onCallEndRef.current = onCallEnd
  }, [onCallEnd])

  useEffect(() => {
    isMutedRef.current = isMuted
  }, [isMuted])

  const persistCallMetadata = useCallback(
    (status: 'active' | 'ended', callId?: string | null) => {
      const idToStore = callId ?? currentCallIdRef.current
      if (!idToStore || typeof window === 'undefined') return
      currentCallIdRef.current = idToStore
      try {
        localStorage.setItem(
          callStorageKey,
          JSON.stringify({
            callId: idToStore,
            status,
            updatedAt: new Date().toISOString(),
          }),
        )
      } catch (error) {
        console.error('Failed to cache Vapi call metadata:', error)
      }
    },
    [callStorageKey],
  )

  const interruptAssistant = useCallback(() => {
    try {
      vapiRef.current?.say?.(' ', false, false, true)
    } catch (error) {
      console.error('Failed to interrupt assistant speech:', error)
    }
  }, [])

  const sendControlMessage = useCallback((command: ControlCommand) => {
    const client = vapiRef.current as Vapi & {
      send?: (message: { type: 'control'; control: ControlCommand }) => void
    }
    try {
      client?.send?.({ type: 'control', control: command })
    } catch (error) {
      console.error('Failed to send control message to Vapi:', error)
    }
  }, [])

  const applyMuteState = useCallback(
    (shouldMute: boolean, { forceGreeting = false } = {}) => {
      if (!vapiRef.current) return
      if (!shouldMute) {
        sendControlMessage('unmute-assistant')
        appliedMuteRef.current = false
        if (forceGreeting || !greetingSentRef.current) {
          sendControlMessage('say-first-message')
          greetingSentRef.current = true
        }
      } else {
        if (appliedMuteRef.current !== true) {
          sendControlMessage('mute-assistant')
          appliedMuteRef.current = true
        }
        interruptAssistant()
      }
    },
    [interruptAssistant, sendControlMessage],
  )

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    if (!publicKey) {
      console.error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set')
      return
    }

    const vapi = new Vapi(publicKey)
    vapiRef.current = vapi

    const handleCallReady = (event?: { callId?: string }) => {
      const callId = event?.callId ?? currentCallIdRef.current
      persistCallMetadata('active', callId ?? undefined)

      if (!hasActivatedRef.current) {
        hasActivatedRef.current = true
        setIsCallActive(true)
        onCallStartRef.current?.()
      }
      appliedMuteRef.current = null
      applyMuteState(isMutedRef.current, { forceGreeting: true })
    }

    const handleCallStart = () => {
      handleCallReady()
    }

    const handleCallEnd = () => {
      setIsCallActive(false)
      hasActivatedRef.current = false
      greetingSentRef.current = false
      appliedMuteRef.current = null
      persistCallMetadata('ended')
      onCallEndRef.current?.()
    }

    const handleVolume = (level: number) => {
      setVolumeLevel(level)
    }

    const handleError = (error: unknown) => {
      console.error('Vapi error:', error)
      isStartingRef.current = false
    }

    vapi.on('call-start-success', handleCallReady)
    vapi.on('call-start', handleCallStart)
    vapi.on('call-end', handleCallEnd)
    vapi.on('volume-level', handleVolume)
    vapi.on('error', handleError)

    return () => {
      vapi.off('call-start-success', handleCallReady)
      vapi.off('call-start', handleCallStart)
      vapi.off('call-end', handleCallEnd)
      vapi.off('volume-level', handleVolume)
      vapi.off('error', handleError)
      vapi.stop()
      vapiRef.current = null
      hasActivatedRef.current = false
      greetingSentRef.current = false
      appliedMuteRef.current = null
      isStartingRef.current = false
    }
  }, [applyMuteState, persistCallMetadata])

  useEffect(() => {
    if (!vapiRef.current) return

    if (isActive && !isCallActive && !isStartingRef.current) {
      const startCall = async () => {
        if (!vapiRef.current) return
        isStartingRef.current = true
        try {
          await vapiRef.current.start('875def72-1b26-4ad3-beb3-b97fc301face')
        } catch (error) {
          console.error('Failed to start Vapi call:', error)
        } finally {
          isStartingRef.current = false
        }
      }

      startCall()
    } else if (!isActive && (isCallActive || isStartingRef.current)) {
      const stopCall = async () => {
        if (!vapiRef.current) return
        try {
          await vapiRef.current.stop()
        } catch (error) {
          console.error('Failed to stop Vapi call:', error)
        } finally {
          isStartingRef.current = false
        }
      }

      stopCall()
    }
  }, [isActive, isCallActive])

  useEffect(() => {
    if (isCallActive) {
      applyMuteState(isMuted)
    }
  }, [applyMuteState, isCallActive, isMuted])

  if (!isActive && !isCallActive) {
    return null
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-3 h-3 rounded-full transition-colors ${
                isCallActive ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            {isCallActive && volumeLevel > 0.1 && (
              <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-500 animate-ping" />
            )}
          </div>
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {isCallActive
              ? 'AI Assistant is active'
              : 'Starting AI Assistant...'}
          </p>
        </div>
        {isCallActive && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full transition-all"
                  style={{
                    height: `${Math.max(
                      4,
                      Math.min(20, (volumeLevel * 100 * (i + 1)) / 5),
                    )}px`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
