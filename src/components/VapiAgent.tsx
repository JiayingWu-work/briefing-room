'use client'

import { useEffect, useRef, useState } from 'react'
import Vapi from '@vapi-ai/web'

interface VapiAgentProps {
  isActive: boolean
  onCallStart?: () => void
  onCallEnd?: () => void
}

export default function VapiAgent({
  isActive,
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

  useEffect(() => {
    onCallStartRef.current = onCallStart
  }, [onCallStart])

  useEffect(() => {
    onCallEndRef.current = onCallEnd
  }, [onCallEnd])

  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
    if (!publicKey) {
      console.error('NEXT_PUBLIC_VAPI_PUBLIC_KEY is not set')
      return
    }

    const vapi = new Vapi(publicKey)
    vapiRef.current = vapi

    const handleCallReady = () => {
      if (!hasActivatedRef.current) {
        hasActivatedRef.current = true
        setIsCallActive(true)
        onCallStartRef.current?.()
      }
    }

    const handleCallStart = () => {
      handleCallReady()
      if (!greetingSentRef.current) {
        greetingSentRef.current = true
      }
    }

    const handleCallEnd = () => {
      setIsCallActive(false)
      hasActivatedRef.current = false
      greetingSentRef.current = false
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
      isStartingRef.current = false
    }
  }, [])

  useEffect(() => {
    if (!vapiRef.current) return

    if (isActive && !isCallActive && !isStartingRef.current) {
      const startCall = async () => {
        if (!vapiRef.current) return
        isStartingRef.current = true
        try {
          // Use the assistant ID from Vapi dashboard
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
