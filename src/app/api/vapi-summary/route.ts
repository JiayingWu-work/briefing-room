import { NextResponse } from 'next/server'

const VAPI_BASE_URL = 'https://api.vapi.ai'

type SummaryLike = string | { text?: string } | Array<string>

const normalizeSummary = (input?: SummaryLike): string | null => {
  if (!input) return null
  if (typeof input === 'string') return input.trim() || null
  if (Array.isArray(input)) {
    const joined = input.join('\n').trim()
    return joined.length ? joined : null
  }
  if (typeof input === 'object' && typeof input.text === 'string') {
    return input.text.trim() || null
  }
  return null
}

const extractSummary = (data: Record<string, unknown>): string | null => {
  const analysis = data?.analysis as
    | {
        summary?: SummaryLike
        items?: Array<{ summary?: SummaryLike }>
        sections?: Array<{ summary?: SummaryLike }>
      }
    | undefined

  let summary = normalizeSummary(analysis?.summary)
  if (summary) return summary

  if (Array.isArray(analysis?.items)) {
    for (const item of analysis.items) {
      const candidate = normalizeSummary(item?.summary)
      if (candidate) {
        summary = candidate
        break
      }
    }
  }
  if (summary) return summary

  if (Array.isArray(analysis?.sections)) {
    for (const section of analysis.sections) {
      const candidate = normalizeSummary(section?.summary)
      if (candidate) {
        summary = candidate
        break
      }
    }
  }

  return summary ?? null
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const callId = searchParams.get('callId')

  if (!callId) {
    return NextResponse.json(
      { error: 'callId query parameter is required.' },
      { status: 400 },
    )
  }

  const privateKey = process.env.VAPI_PRIVATE_KEY
  if (!privateKey) {
    return NextResponse.json(
      { error: 'Server missing Vapi credentials.' },
      { status: 500 },
    )
  }

  try {
    const response = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
      headers: {
        Authorization: `Bearer ${privateKey}`,
      },
      cache: 'no-store',
    })

    const rawBody = await response.text()
    if (!response.ok) {
      console.error('Failed to fetch Vapi summary:', response.status, rawBody)
      return NextResponse.json(
        { error: 'Failed to fetch Vapi summary.' },
        { status: response.status },
      )
    }

    const data = rawBody ? (JSON.parse(rawBody) as Record<string, unknown>) : {}
    const summary = extractSummary(data)

    return NextResponse.json({ summary, callId })
  } catch (error) {
    console.error('Vapi summary retrieval error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Vapi summary.' },
      { status: 502 },
    )
  }
}
