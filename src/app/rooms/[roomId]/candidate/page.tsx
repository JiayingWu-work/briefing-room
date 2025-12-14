"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import type { Candidate } from "@/types";
import DailyCall from "@/components/DailyCall";

export default function CandidateRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [isLoadingRoom, setIsLoadingRoom] = useState(true);

  const [candidate, setCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    const storedCandidate = localStorage.getItem(`room-${roomId}`);
    if (storedCandidate) {
      setCandidate(JSON.parse(storedCandidate));
    }
  }, [roomId]);

  useEffect(() => {
    async function fetchDailyRoom() {
      try {
        const response = await fetch(`/api/daily-room?roomId=${roomId}`);
        if (!response.ok) {
          throw new Error("Failed to create Daily room");
        }
        const data = await response.json();
        setRoomUrl(data.roomUrl);
      } catch (error) {
        console.error("Error fetching Daily room:", error);
      } finally {
        setIsLoadingRoom(false);
      }
    }

    fetchDailyRoom();
  }, [roomId]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4 text-black dark:text-zinc-50">
          Candidate Room
        </h1>

        {candidate && (
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-zinc-50">
              Welcome, {candidate.name}!
            </h2>
            <p className="text-zinc-700 dark:text-zinc-300">
              You are interviewing for the position of <strong>{candidate.role}</strong>.
            </p>
          </div>
        )}

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
              userName={candidate?.name || "Candidate"}
              userRole="candidate"
            />
          ) : (
            <div className="flex items-center justify-center h-[500px] bg-zinc-100 dark:bg-zinc-800 rounded-lg">
              <p className="text-red-600 dark:text-red-400">Failed to load video room</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
