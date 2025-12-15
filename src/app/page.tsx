'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Candidate } from '@/types'

export default function Home() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [notes, setNotes] = useState('')
  const [candidateLink, setCandidateLink] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const roomId = crypto.randomUUID()

    const candidate: Candidate = {
      id: crypto.randomUUID(),
      name,
      role,
      notes: notes || undefined,
      createdAt: new Date().toISOString(),
    }

    localStorage.setItem(`room-${roomId}`, JSON.stringify(candidate))

    const link = `${window.location.origin}/rooms/${roomId}/candidate`
    setCandidateLink(link)

    router.push(`/rooms/${roomId}/interviewer`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-semibold mb-6 text-black dark:text-zinc-50">
          Create Interview Room
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Candidate Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="role"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Role
            </label>
            <input
              type="text"
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1"
            >
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-black dark:text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-black dark:bg-white text-white dark:text-black font-medium py-2 px-4 rounded-md hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
          >
            Create Room
          </button>
        </form>

        {candidateLink && (
          <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-md">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Candidate Link:
            </p>
            <code className="block text-xs bg-white dark:bg-zinc-900 p-2 rounded border border-zinc-300 dark:border-zinc-700 break-all text-black dark:text-white">
              {candidateLink}
            </code>
          </div>
        )}
      </main>
    </div>
  )
}
