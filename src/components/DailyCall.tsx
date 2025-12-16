'use client'

import { useEffect, useRef } from 'react'
import DailyIframe, {
  DailyCall as DailyCallType,
  DailyEventObjectNoPayload,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
  DailyEventObjectParticipants,
} from '@daily-co/daily-js'

// Allow multiple Daily call instances (for Vapi + host call) once on the client.
if (typeof window !== 'undefined') {
  const dailyWithFlag = DailyIframe as typeof DailyIframe & {
    __allowMultiplePatched?: boolean
  }

  if (!dailyWithFlag.__allowMultiplePatched) {
    const originalCreateCallObject = dailyWithFlag.createCallObject.bind(
      DailyIframe
    )

    dailyWithFlag.createCallObject = (properties = {}) =>
      originalCreateCallObject({
        allowMultipleCallInstances: true,
        ...properties,
      })

    dailyWithFlag.__allowMultiplePatched = true
  }
}

interface DailyCallProps {
  roomUrl: string
  userName: string
  userRole: 'interviewer' | 'candidate'
  onParticipantJoined?: (participant: DailyEventObjectParticipant) => void
  onParticipantLeft?: (participant: DailyEventObjectParticipantLeft) => void
  onMeetingJoined?: (event: DailyEventObjectParticipants) => void
  onMeetingLeft?: (event: DailyEventObjectNoPayload) => void
}

export default function DailyCall({
  roomUrl,
  userName,
  userRole,
  onParticipantJoined,
  onParticipantLeft,
  onMeetingJoined,
  onMeetingLeft,
}: DailyCallProps) {
  const callFrameRef = useRef<DailyCallType | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef(false)

  // Bootstraps the Daily iframe once and cleans it up when the component unmounts.
  useEffect(() => {
    if (!roomUrl || !containerRef.current || isInitializedRef.current) return
    if (containerRef.current.querySelector('iframe')) return

    isInitializedRef.current = true

    const callFrame = DailyIframe.createFrame(containerRef.current, {
      showLeaveButton: true,
      allowMultipleCallInstances: true,
      url: roomUrl,
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

    if (onMeetingJoined) {
      callFrame.on('joined-meeting', onMeetingJoined)
    }

    if (onMeetingLeft) {
      callFrame.on('left-meeting', onMeetingLeft)
    }

    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy()
        callFrameRef.current = null
      }
      isInitializedRef.current = false
    }
  }, [
    roomUrl,
    userName,
    userRole,
    onParticipantJoined,
    onParticipantLeft,
    onMeetingJoined,
    onMeetingLeft,
  ])

  return (
    <div
      ref={containerRef}
      className="w-full h-[600px] bg-black rounded-lg"
      style={{ position: 'relative' }}
    />
  )
}
