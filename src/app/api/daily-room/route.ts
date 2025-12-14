import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const roomId = searchParams.get('roomId')

  if (!roomId) {
    return NextResponse.json({ error: 'roomId is required' }, { status: 400 })
  }

  const dailyApiKey = process.env.DAILY_API_KEY

  if (!dailyApiKey) {
    return NextResponse.json(
      { error: 'Daily API key not configured' },
      { status: 500 }
    )
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${dailyApiKey}`,
      },
      body: JSON.stringify({
        name: roomId,
        properties: {
          enable_screenshare: false,
          enable_chat: false,
          enable_knocking: false,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('Daily API error:', {
        status: response.status,
        statusText: response.statusText,
        errorData,
      })

      // Check if room already exists
      if (
        response.status === 400 &&
        (errorData?.error === 'room-name-already-exists' ||
          errorData?.error === 'invalid-request-error') &&
        errorData?.info?.includes('already exists')
      ) {
        // Room exists, fetch it instead
        const existingRoomResponse = await fetch(
          `https://api.daily.co/v1/rooms/${roomId}`,
          {
            headers: {
              Authorization: `Bearer ${dailyApiKey}`,
            },
          }
        )

        if (existingRoomResponse.ok) {
          const existingRoom = await existingRoomResponse.json()
          return NextResponse.json({ roomUrl: existingRoom.url })
        }
      }

      return NextResponse.json(
        {
          error: 'Daily API error',
          details: errorData,
          status: response.status,
        },
        { status: 500 }
      )
    }

    const data = await response.json()
    return NextResponse.json({ roomUrl: data.url })
  } catch (error) {
    console.error('Error creating Daily room:', error)
    return NextResponse.json(
      {
        error: 'Failed to create Daily room',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
