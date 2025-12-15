'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import type { Candidate } from '@/types'
import DailyCall from '@/components/DailyCall'
import VapiAgent from '@/components/VapiAgent'
import type {
  DailyEventObjectParticipant,
  DailyEventObjectParticipantLeft,
} from '@daily-co/daily-js'

export default function InterviewerRoom() {
  const params = useParams()
  const roomId = params.roomId as string
  const [roomUrl, setRoomUrl] = useState<string | null>(null)
  const [isCandidatePresent, setIsCandidatePresent] = useState(false)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [isAgentCallActive, setIsAgentCallActive] = useState(false)

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

  const handleParticipantJoined = useCallback(
    (participant: DailyEventObjectParticipant) => {
      const userData = (participant as { userData?: { role?: string } }).userData
      if (userData?.role === 'candidate') {
        setIsCandidatePresent(true)
      }
    },
    []
  )

  const handleParticipantLeft = useCallback(
    (participant: DailyEventObjectParticipantLeft) => {
      const userData = (participant.participant as { userData?: { role?: string } })
        .userData
      if (userData?.role === 'candidate') {
        setIsCandidatePresent(false)
      }
    },
    []
  )

  useEffect(() => {
    if (isCandidatePresent) {
      setIsAgentCallActive(false)
    }
  }, [isCandidatePresent])

  const assistantStatus = isAgentCallActive
    ? {
        text: 'Briefing interviewer',
        className:
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      }
    : !isCandidatePresent
      ? {
          text: 'Waiting for candidate',
          className:
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
        }
      : {
          text: 'Off (candidate in room)',
          className:
            'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300',
        }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4 text-black dark:text-zinc-50">
          Interviewer Room
        </h1>

        {isCandidatePresent && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-700 rounded-lg">
            <p className="text-green-800 dark:text-green-200 font-medium">
              Candidate is present
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-4">
              <h2 className="text-lg font-semibold mb-3 text-black dark:text-zinc-50">
                Video Call
              </h2>
              {isLoadingRoom ? (
                <div className="flex items-center justify-center h-[500px] bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <p className="text-zinc-600 dark:text-zinc-400">Loading video room...</p>
                </div>
              ) : roomUrl ? (
                <DailyCall
                  roomUrl={roomUrl}
                  userName="Interviewer"
                  userRole="interviewer"
                  onParticipantJoined={handleParticipantJoined}
                  onParticipantLeft={handleParticipantLeft}
                />
              ) : (
                <div className="flex items-center justify-center h-[500px] bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                  <p className="text-red-600 dark:text-red-400">Failed to load video room</p>
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
                    Briefs you while waiting and leaves once the candidate joins.
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${assistantStatus.className}`}
                >
                  {assistantStatus.text}
                </span>
              </div>
              <VapiAgent
                isActive={!isCandidatePresent}
                onCallStart={() => setIsAgentCallActive(true)}
                onCallEnd={() => setIsAgentCallActive(false)}
              />
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                {isCandidatePresent
                  ? 'The assistant has left since the candidate is in the Daily room.'
                  : 'The assistant is active now and will automatically disconnect once the candidate arrives.'}
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
