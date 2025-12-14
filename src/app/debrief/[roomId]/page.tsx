"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { Candidate } from "@/types";

export default function DebriefRoom() {
  const params = useParams();
  const roomId = params.roomId as string;

  const candidate = useMemo<Candidate | null>(() => {
    if (typeof window === "undefined") return null;
    const storedCandidate = localStorage.getItem(`room-${roomId}`);
    return storedCandidate ? JSON.parse(storedCandidate) : null;
  }, [roomId]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4 text-black dark:text-zinc-50">
          Interview Debrief
        </h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          {candidate ? (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                Candidate: {candidate.name}
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300 mb-2">
                <strong>Role:</strong> {candidate.role}
              </p>
              {candidate.notes && (
                <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                  <strong>Notes:</strong> {candidate.notes}
                </p>
              )}
              <div className="mt-6 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
                <p className="text-zinc-600 dark:text-zinc-400">
                  Debrief content will be generated here after the interview.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading debrief information...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
