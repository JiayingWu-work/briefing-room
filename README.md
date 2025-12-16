## Briefing Room

This project creates a high-touch interview experience that pairs a Daily video room with a Vapi-powered voice assistant. The assistant briefs the interviewer while the candidate is absent, then mutes itself automatically once the candidate arrives while continuing to record the conversation for a debrief summary.

## Tech Stack

- **Next.js / React (App Router)** – UI, routing, and API routes live in the `app` directory.
- **Daily** – embeddable WebRTC rooms for the interviewer and candidate experiences.
- **Vapi** – browser SDK for the voice agent plus the server API for call summaries.
- **Tailwind CSS** – utility-based styling across the interviewer and candidate flows.
- **TypeScript** – typed components, API routes, and Vapi/Daily integrations.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Create `.env` and populate it with your own keys. Examples:

   ```bash
   # Daily.co Configuration
   # Get your API key from https://dashboard.daily.co/developers
   DAILY_API_KEY=2ce1787797a0149364e4bdbcfb5c9b294593e61ffc47f24f26f227dcdaa0020a

   # Vapi Configuration
   # Get your keys from https://vapi.ai
   NEXT_PUBLIC_VAPI_PUBLIC_KEY=9f97d012-fcb2-4261-afdb-5e1bb8a87b6f
   VAPI_PRIVATE_KEY=812ba033-a34c-4692-ab78-8534d8370fb0
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to create a new interview.

## Key Flows

### Interviewer Room

- Daily is initialized via `DailyCall`, and we track interviewer/candidate presence using `joined-meeting` + `participant` events.
- `VapiAgent` receives `isActive` (interviewer joined) and `isMuted` (candidate present) to control the assistant.
- When the interviewer leaves, we route to `/debrief/[roomId]`.

### Candidate Room

- Mirrors the Daily call but keeps the UI minimal. When the candidate leaves we collapse the iframe and show a friendly status message.

### Vapi Assistant

- Starts once the interviewer joins and greets them.
- Upon candidate arrival we send Live Call Control commands to mute and interrupt any active speech while recording continues.
- Call IDs are cached in `localStorage` so `/api/vapi-summary` can later hydrate the debrief page.

### Debrief Page

- Loads cached candidate info and the stored Vapi call ID.
- Hits `/api/vapi-summary?callId=...` to display the assistant’s summary that can be shared with others in the team, with retry messaging if analysis is still running.

## Design Decisions & Tradeoffs

- **Daily + Vapi on the same page**: we opted for client-side Daily initialization to keep Vapi in sync with interviewer presence. This means the interviewer must keep the tab open; moving logic server-side would require a more complex signaling layer.

- **LocalStorage for call metadata**: simple and reliable for this prototype, but in production we want a persistent database keyed by room ID to avoid losing summaries if the interviewer clears storage.

- **Mute via Live Call Control**: we manually send `mute-assistant` and interrupt speech; relying on Vapi’s built-in conversation flow would be simpler but wouldn’t guarantee immediate silence when the candidate joins.

- **Single assistant ID**: today we use one Vapi assistant for everyone. Per-interview prompts, different voices, or automated context injection would require creating assistants dynamically or using the Vapi Workflow API.

- **Simple Vapi training**: we keep the system prompt intentionally lean. A richer prompt could weave in role context, candidate history, or interviewer persona—but it would need a more sophisticated content pipeline and guardrails.

## Ideas for Future Work

- **Automated Interview Briefs**  
   Enable the OpenAI pipeline so the interviewer automatically receives a written brief tailored to the candidate’s resume, LinkedIn, and role context.

- **Live AI Companion Panel**  
  Add a lightweight chat sidebar so the interviewer can ask the assistant follow-up questions or request coaching mid-call.

- **Server-Side Persistence**  
   Store room metadata, candidate profiles, and Vapi call IDs in a real database so summaries and notes survive across devices and can be shared with the hiring team.

- **Assistant Personality + Context**  
   We currently use a neutral system prompt; future iterations could inject role context, interviewer preferences, or previous debrief notes to deliver bespoke briefings.

- **Pre-Scheduled Room Creation**  
   Add a wizard for recruiting coordinators to pre-generate rooms, capture candidate availability, and email the link days in advance.

- **Multi-Session Rooms**  
   Allow reconnecting to an existing room (or leverage Daily’s knock mode) so the assistant can follow the candidate across multiple interview stages.

- **Candidate-Facing Prep Mode**  
   Give candidates their own assistant-guided warmup while the interviewer prepares, keeping both sides aligned before the call starts.

These directions would require a proper backend store, more granular permissions, and time to tune the assistant prompts—but the current architecture makes it easy to grow in these directions.
