'use client'

import { useEffect, useRef } from 'react'
import DailyIframe, {
  DailyCall as DailyCallType,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
} from '@daily-co/daily-js'

interface DailyCallProps {
  roomUrl: string
  userName: string
  userRole: 'interviewer' | 'candidate'
  onParticipantJoined?: (participant: DailyEventObjectParticipant) => void
  onParticipantLeft?: (participant: DailyEventObjectParticipantLeft) => void
}

export default function DailyCall({
  roomUrl,
  userName,
  userRole,
  onParticipantJoined,
  onParticipantLeft,
}: DailyCallProps) {
  const callFrameRef = useRef<DailyCallType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef(false)

  useEffect(() => {
    if (!roomUrl || !containerRef.current || isInitializedRef.current) return
    if (containerRef.current.querySelector('iframe')) return

    isInitializedRef.current = true

    const callFrame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      iframeStyle: {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '8px',
      },
    })

    callFrameRef.current = callFrame

    callFrame.join({
      url: roomUrl,
      userName,
      userData: { role: userRole },
    })

    if (onParticipantJoined) {
      callFrame.on('participant-joined', onParticipantJoined)
    }

    if (onParticipantLeft) {
      callFrame.on('participant-left', onParticipantLeft)
    }

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
        callFrameRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [roomUrl, userName, userRole, onParticipantJoined, onParticipantLeft])

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] bg-black rounded-lg"
      style={{ position: 'relative' }}
    />
  )
}
