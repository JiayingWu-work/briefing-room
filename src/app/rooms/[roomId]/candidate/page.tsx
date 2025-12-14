"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import type { Candidate } from "@/types";

export default function CandidateRoom() {
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
          Candidate Room
        </h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6">
          {candidate ? (
            <div>
              <h2 className="text-xl font-semibold mb-4 text-black dark:text-zinc-50">
                Welcome, {candidate.name}!
              </h2>
              <p className="text-zinc-700 dark:text-zinc-300">
                You are interviewing for the position of <strong>{candidate.role}</strong>.
              </p>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                The interview will begin shortly. Please wait for the interviewer.
              </p>
            </div>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading candidate information...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
