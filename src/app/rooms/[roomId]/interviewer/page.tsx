'use client'

import { useParams } from 'next/navigation'
import { useMemo } from 'react'
import type { Candidate } from '@/types'

export default function InterviewerRoom() {
  const params = useParams()
  const roomId = params.roomId as string

  const candidate = useMemo<Candidate | null>(() => {
    if (typeof window === 'undefined') return null
    const storedCandidate = localStorage.getItem(`room-${roomId}`)
    return storedCandidate ? JSON.parse(storedCandidate) : null
  }, [roomId])

  const candidateLink = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/rooms/${roomId}/candidate`
  }, [roomId])

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4 text-black dark:text-zinc-50">
          Interviewer Room
        </h1>

        {candidate && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
              Candidate Information
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

        <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold mb-2 text-black dark:text-zinc-50">
            Candidate Link
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
            Share this link with the candidate:
          </p>
          <code className="block text-xs bg-white dark:bg-zinc-900 p-3 rounded border border-zinc-300 dark:border-zinc-700 break-all text-black dark:text-white">
            {candidateLink}
          </code>
        </div>
      </div>
    </div>
  )
}
