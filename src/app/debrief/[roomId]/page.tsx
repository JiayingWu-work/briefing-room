"use client";

import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import type { Candidate } from "@/types";

export default function DebriefRoom() {
  const params = useParams();
  const roomId = params.roomId as string;
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [callId, setCallId] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    const storedCandidate = localStorage.getItem(`room-${roomId}`);
    if (storedCandidate) {
      setCandidate(JSON.parse(storedCandidate));
    }
  }, [roomId]);

  const fetchSummary = useCallback(async (id: string) => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch(
        `/api/vapi-summary?callId=${encodeURIComponent(id)}`,
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to fetch summary.");
      }
      setSummary(data.summary ?? null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to fetch AI summary.";
      setSummaryError(message);
    } finally {
      setIsSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedMetadata = localStorage.getItem(`vapi-call-${roomId}`);
    if (!storedMetadata) return;

    try {
      const parsed = JSON.parse(storedMetadata) as {
        callId?: string;
      };
      if (parsed?.callId) {
        setCallId(parsed.callId);
        fetchSummary(parsed.callId);
      }
    } catch (error) {
      console.error("Failed to parse Vapi metadata:", error);
    }
  }, [roomId, fetchSummary]);

  const summaryLines = useMemo(() => {
    if (!summary) return [];
    return summary
      .split(/\n+/)
      .map((line) => line.replace(/^[\-\u2022]+\s*/, "").trim())
      .filter((line) => line.length > 0);
  }, [summary]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-semibold mb-4 text-black dark:text-zinc-50">
          Interview Debrief
        </h1>

        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg p-6 space-y-6">
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
            </div>
          ) : (
            <p className="text-zinc-600 dark:text-zinc-400">
              Loading debrief information...
            </p>
          )}

          <div className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-black dark:text-zinc-50">
                  AI Interview Summary
                </p>
                {callId && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Call ID: {callId}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={!callId || isSummaryLoading}
                onClick={() => callId && fetchSummary(callId)}
                className="px-3 py-1.5 rounded-md text-sm font-medium border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSummaryLoading ? "Refreshing..." : "Refresh summary"}
              </button>
            </div>

            {isSummaryLoading ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Fetching the latest assistant notes…
              </p>
            ) : summaryLines.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-zinc-700 dark:text-zinc-200">
                {summaryLines.map((line, index) => (
                  <li key={`${line}-${index}`}>{line}</li>
                ))}
              </ul>
            ) : summaryError ? (
              <p className="text-sm text-red-600 dark:text-red-400">
                {summaryError}
              </p>
            ) : callId ? (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Summary isn&rsquo;t ready yet. Give it a moment and refresh.
              </p>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                We&rsquo;ll display the AI summary once the assistant finishes
                processing this call.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
