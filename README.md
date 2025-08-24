# Revolt Voice Bot (Node.js + Express)

A minimal **single-button, voice-only** chatbot for **Revolt Motors** using a server-side
Gemini API call. The assistant is hard-restricted to Revolt topics via a system prompt.
UI shows one **Start/Stop** button and a **theme toggle** (light/dark).

> Note: This implementation uses browser Speech Recognition & Speech Synthesis for low latency.
> For true real-time audio and native interruptions across all browsers, wire up the
> **Gemini Live API (WebRTC/WebSocket)** on the backend and stream audio. This scaffold keeps
> the frontend API simple while staying server-to-server for AI calls.

## Features
- Single **🎤 Start Talking** button (click again to stop).
- Voice only: no chat text rendering (just a tiny status line).
- Interruptions: clicking while speaking cancels TTS; speaking again during TTS cancels it.
- Multi-language output: basic auto voice selection (Hindi/Marathi/Bhojpuri via Devanagari, Telugu, English).
- Strict domain: only talks about **Revolt Motors** (system prompt).
- Node.js + Express backend; API key is **hidden in `.env`** (server-side).

## Quick Start

```bash
# 1) Install deps
npm install

# 2) Create .env from template
cp .env.example .env
# edit .env and set GEMINI_API_KEY=...

# 3) Run
npm run dev
# open http://localhost:3000
```

## Environment

- `GEMINI_API_KEY`: from aistudio.google.com
- `GEMINI_MODEL`: default `gemini-2.5-flash-preview-native-audio-dialog`
  - You can switch to e.g. `gemini-2.0-flash-live-001` during development.
- `PORT`: default `3000`
- `ALLOWED_ORIGIN`: default `http://localhost:3000`

## Technology
- **Backend:** Node.js, Express, Helmet, CORS, Morgan
- **Frontend:** Plain HTML/CSS/JS, Web Speech API (STT), SpeechSynthesis (TTS)
- **AI:** Google Gemini (server-to-server HTTP call)

## System Instructions (Prompt)
The server includes a strict prompt to ensure the bot only discusses Revolt Motors. If the user asks
about anything else, it politely refuses and steers back to Revolt topics.

## Notes on Gemini Live (Real-time)
- This starter calls `:generateContent` over HTTP for simplicity.
- For real-time duplex audio, move to Gemini Live (WebRTC) and stream:
  - Maintain a server session, forward audio frames, and forward partial hypotheses back to the client.
  - Keep the single-button UX; send microphone start/stop to the server via WebRTC or WS.
  - Ensure "barge-in": when user audio arrives, cancel current TTS and forward immediately.

## Production Tips
- Serve over HTTPS in production (required for mic permissions on some browsers).
- Limit request rate per IP.
- Cache static assets with far-future headers.
- Rotate API keys and do not expose them to the client.
