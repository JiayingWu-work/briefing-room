'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import type { Candidate } from '@/types'
import DailyCall from '@/components/DailyCall'
import VapiAgent from '@/components/VapiAgent'
import type {
  DailyEventObjectNoPayload,
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
  DailyEventObjectParticipants,
  DailyParticipant,
  DailyParticipantsObject,
} from '@daily-co/daily-js'

export default function InterviewerRoom() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.roomId as string
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [isCandidatePresent, setIsCandidatePresent] = useState(false)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [isInterviewerInCall, setIsInterviewerInCall] = useState(false)
  const hasRedirectedRef = useRef(false)

  const [candidate, setCandidate] = useState<Candidate | null>(null)
  const [candidateLink, setCandidateLink] = useState('')

  useEffect(() => {
    const storedCandidate = localStorage.getItem(`room-${roomId}`)
    if (storedCandidate) {
      setCandidate(JSON.parse(storedCandidate))
    }
  }, [roomId])

  useEffect(() => {
    setCandidateLink(`${window.location.origin}/rooms/${roomId}/candidate`)
  }, [roomId])

  useEffect(() => {
    async function fetchDailyRoom() {
      try {
        const response = await fetch(`/api/daily-room?roomId=${roomId}`)
        if (!response.ok) {
          throw new Error('Failed to create Daily room')
        }
        const data = await response.json()
        setRoomUrl(data.roomUrl)
      } catch (error) {
        console.error('Error fetching Daily room:', error)
      } finally {
        setIsLoadingRoom(false)
      }
    }

    fetchDailyRoom()
  }, [roomId])

  const isCandidateParticipant = (participant?: DailyParticipant) => {
    const userData = participant?.userData as { role?: string } | undefined
    return userData?.role === 'candidate'
  }

  const updateCandidatePresenceFromParticipants = useCallback(
    (participants?: DailyParticipantsObject) => {
      if (!participants) return
      const hasCandidate = Object.values(participants).some((participant) =>
        isCandidateParticipant(participant),
      )
      setIsCandidatePresent(hasCandidate)
    },
    [],
  )

  const handleParticipantJoined = useCallback(
    (event: DailyEventObjectParticipant) => {
      if (isCandidateParticipant(event.participant)) {
        setIsCandidatePresent(true)
      }
    },
    [],
  )

  const handleParticipantLeft = useCallback(
    (event: DailyEventObjectParticipantLeft) => {
      if (isCandidateParticipant(event.participant)) {
        setIsCandidatePresent(false)
      }
    },
    [],
  )

  const handleInterviewerJoined = useCallback(
    (event: DailyEventObjectParticipants) => {
      setIsInterviewerInCall(true)
      updateCandidatePresenceFromParticipants(event.participants)
    },
    [updateCandidatePresenceFromParticipants],
  )

  const handleInterviewerLeft = useCallback(
    (_event: DailyEventObjectNoPayload) => {
      setIsInterviewerInCall(false)
      setIsCandidatePresent(false)
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true
        router.push(`/debrief/${roomId}`)
      }
    },
    [roomId, router],
  )

  const isAssistantActive = isInterviewerInCall
  const isAssistantMuted = isInterviewerInCall && isCandidatePresent
  const assistantStatusMessage = !isInterviewerInCall
    ? 'Join the interview room to enable the AI assistant.'
    : isCandidatePresent
    ? 'The assistant is muted while the candidate is interviewing but is still recording for the summary.'
    : 'The assistant is currently briefing you until the candidate joins.'

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4 text-black dark:text-zinc-50">
          Interviewer Room
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-black dark:text-zinc-50">
                Video Call
              </h2>
              {isLoadingRoom ? (
                <div className="flex items-center justify-center h-[500px] bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <p className="text-zinc-600 dark:text-zinc-400">
                    Loading video room...
                  </p>
                </div>
              ) : roomUrl ? (
                <DailyCall
                  roomUrl={roomUrl}
                  userName="Interviewer"
                  userRole="interviewer"
                  onParticipantJoined={handleParticipantJoined}
                  onParticipantLeft={handleParticipantLeft}
                  onMeetingJoined={handleInterviewerJoined}
                  onMeetingLeft={handleInterviewerLeft}
                />
              ) : (
                <div className="flex items-center justify-center h-[500px] bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400">
                    Failed to load video room
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            {candidate && (
              <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                  Candidate Info
                </h2>
                <div className="space-y-2">
                  <p className="text-zinc-700 dark:text-zinc-300">
                    <strong>Name:</strong> {candidate.name}
                  </p>
                  <p className="text-zinc-700 dark:text-zinc-300">
                    <strong>Role:</strong> {candidate.role}
                  </p>
                  {candidate.notes && (
                    <p className="text-zinc-700 dark:text-zinc-300">
                      <strong>Notes:</strong> {candidate.notes}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-xl font-semibold text-black dark:text-zinc-50">
                    AI Interview Assistant
                  </h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Briefs you before the candidate joins, then silently
                    records the session for the debrief summary.
                  </p>
                </div>
              </div>
              <VapiAgent
                isActive={isAssistantActive}
                isMuted={isAssistantMuted}
                roomId={roomId}
              />
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {assistantStatusMessage}
              </p>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2 text-black dark:text-zinc-50">
                Candidate Link
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Share this link:
              </p>
              <code className="block text-xs bg-white dark:bg-zinc-900 p-3 rounded border border-zinc-300 dark:border-zinc-700 break-all text-black dark:text-white">
                {candidateLink}
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
