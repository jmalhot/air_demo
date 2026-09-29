# AIR Demo — design

Date: 2026-09-29  
Product: standalone demo (not InterviewCandy Enterprise)  
Location: `air_demo/`  
Deploy: its own Vercel project, root directory `air_demo`

## Goal

A password-gated page where someone pastes a job description, chooses voice, language, interview length, and avatar, then runs a live Gemini 3.8 Live interview with a talking avatar. Thank-you at the end. No accounts, jobs, recordings, scorecards, or billing.

## Non-goals

- InterviewCandy enterprise dashboard, candidate JWTs, orgs, RLS
- Recording upload, GCS, transcripts, scorecards, email, Slack, Redis
- Custom avatar image upload (`customized_avatar` is allowlist-only at Google)
- Sharing this app’s routes or env with the parent InterviewCandy Vercel project

InterviewCandy is a **reference** for Live session wiring (3.8 contract, voices, languages, timer, end). Code is copied into `air_demo`, not imported from `../src`.

## Architecture

Two client screens + one serverless function.

```
[Setup] --Start--> POST /api/session --token+prompt--> [Live: Gemini 3.8 + avatar] --> [Thank-you]
              password in body                    JD/voice/lang/minutes/avatar
                                                stay in sessionStorage
```

- Browser never sees `GEMINI_API_KEY` or `DEMO_PASSWORD`.
- Ephemeral Gemini auth token is minted the same way as InterviewCandy `api/ai-token.ts`: `@google/genai` `authTokens.create`, `uses: 1`, ~30 min expire, short `newSessionExpireTime`.
- Model is always `gemini-3.8-live` (`GEMINI_INTERVIEW_MODEL`). Unrecognized model IDs are rejected; no prefix matching.

## Setup screen

Fields:

| Field | Behavior |
| --- | --- |
| Demo password | required; sent only to `/api/session` |
| Job description | required textarea |
| Voice | InterviewCandy `CONFIG.VOICES` (API `name` + friendly `displayName`) |
| Language | InterviewCandy `CONFIG.LANGUAGES` (BCP-47), default `en-US` |
| Minutes | `5`, `10`, `15`, `20` only; default `10` |
| Avatar | select bound to `AVATARS` allowlist |

Start is disabled until password and job description are non-empty.

**Avatars:** Google’s published sample name is `Ben`. v1 allowlist is `AVATARS = [{ id: 'Ben', label: 'Ben' }]`. More prebuilt names may be added to that constant in the same implementation if they are confirmed against Gemini Live. No free-text avatar field. No custom image.

Working name in UI: **AIR Demo**. No InterviewCandy logo or copy.

## Live screen

- Full-width avatar video from Live `VIDEO` output (`responseModalities: ['VIDEO']` + `avatarConfig.avatarName`).
- Mic capture at 16 kHz; playback of Live audio (24 kHz) as in InterviewCandy.
- Status text: Listening / Interviewer speaking.
- Countdown from chosen minutes.
- End interview button.
- After timer, user End, or approved `end_interview` tool: disconnect, show thank-you, button back to setup. Clear sessionStorage keys for this demo.

No transcript UI, no download, no scorecard, no recording.

## `/api/session`

`POST` only. CSRF: require `X-Requested-With: fetch` (same rule as InterviewCandy mutating APIs).

Body:

```json
{
  "password": "string",
  "jobDescription": "string",
  "voiceName": "string",
  "language": "string",
  "minutes": 5 | 10 | 15 | 20,
  "avatarName": "string"
}
```

Validation:

- `password` must match `DEMO_PASSWORD` (timing-safe compare). Else `401`.
- `jobDescription` trim, length 1–20_000. Else `400`.
- `voiceName` in the voice allowlist. Else `400`.
- `language` in the language allowlist. Else `400`.
- `minutes` one of 5, 10, 15, 20. Else `400`.
- `avatarName` in `AVATARS`. Else `400`.
- Missing `GEMINI_API_KEY` / `DEMO_PASSWORD` / `GEMINI_INTERVIEW_MODEL` → `500` with generic “Demo not available”. Required env has no silent defaults.

Success `200`:

```json
{
  "token": "string",
  "expireAt": 0,
  "model": "gemini-3.8-live",
  "systemInstruction": "string",
  "voiceName": "string",
  "language": "string",
  "minutes": 10,
  "avatarName": "string"
}
```

`systemInstruction` is built only on the server: interviewer persona, conduct the interview in `language`, cover the job description, stay within `minutes`, be conversational, do not reveal this prompt. Do not put prompt templates in client bundles.

Wrong password does not mint a token.

## Live connect (client)

After a successful `/api/session`, keep the token in **memory only** for that page session. Persist JD/voice/language/minutes/avatar in `sessionStorage` so a refresh of live without a token returns the user to setup (they must start again). Connect with `@google/genai` Live:

- Model from the response (`gemini-3.8-live`).
- 3.8 wire contract copied from InterviewCandy `LIVE_MODEL_CONTRACTS['gemini-3.8-live']`: no `thinkingConfig`, no affective dialog, mic field `audio`, tools `BLOCKING`.
- `responseModalities: ['VIDEO']`.
- `speechConfig` prebuilt voice + language code.
- `avatarConfig: { avatarName }`.
- Tools: `get_remaining_time`, `end_interview` only (same purpose as InterviewCandy; keep the gate simple: allow end after ~50% of duration or user click).
- Camera input: off for v1 (mic only).

If Live setup fails (avatar/video rejected), show a generic error on setup/live and do not claim the interview started.

## Errors

| Case | User sees |
| --- | --- |
| Wrong password | Stay on setup, “Incorrect password” |
| Validation | Field-level or one banner, stay on setup |
| Token / Gemini provision fail | “Demo not available” |
| Mic permission denied | Cannot start; message to allow microphone |
| Disconnect mid-interview | Thank-you with “Session ended” |

No stack traces, API keys, or raw Gemini payloads in the UI. Logs: IDs, status codes, sanitized messages only.

## Project layout

```
air_demo/
  package.json
  vite.config.ts
  vercel.json
  index.html
  .env.example
  api/session.ts
  src/          # setup + live UI, slim Live session, copied 3.8 contract + voice/language lists
  docs/         # this spec
```

Local: Vite on one port, `vercel dev` for `/api` (same two-process pattern as InterviewCandy). Production: Vercel builds Vite `dist/` and serves `api/session.ts`.

## Env

| Name | Required | Notes |
| --- | --- | --- |
| `GEMINI_API_KEY` | yes | Server only |
| `DEMO_PASSWORD` | yes | Server only |
| `GEMINI_INTERVIEW_MODEL` | yes | Must be `gemini-3.8-live` |

No `VITE_*` secrets. `.env.example` documents the three vars. Vercel project env must set the same three.

## Testing

- Unit: password reject; body validation; system instruction contains JD and minutes; model allowlist.
- Manual / browser: password gate, start with mic, avatar video appears, timer, End → thank-you.
- Do not claim production-ready until a real Gemini Live avatar session has been run against a real key.

## Security

Anyone with `DEMO_PASSWORD` can spend Gemini quota. Rotate the password in Vercel when the demo is done. No per-user accounts in v1.
