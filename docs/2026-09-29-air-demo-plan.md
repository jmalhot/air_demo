# AIR Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a password-gated standalone Vite + Vercel app in `air_demo/` that starts a Gemini 3.8 Live interview with a talking avatar from a pasted job description.

**Architecture:** Vanilla TypeScript setup/live/thank-you UI. `POST /api/session` checks `DEMO_PASSWORD`, validates options, builds the system instruction, mints a one-use Gemini Live token. The browser connects to Gemini Live with `responseModalities: VIDEO`, `avatarConfig.avatarName`, and InterviewCandy’s 3.8 wire contract. No database.

**Tech Stack:** Vite 6, TypeScript, `@google/genai`, Vercel serverless (`api/session.ts`), Vitest.

## Global Constraints

- Product name in UI: **AIR Demo**. No InterviewCandy branding.
- Model must be exactly `gemini-3.8-live`. No prefix matching, no silent default model.
- Required env has no silent defaults: `GEMINI_API_KEY`, `DEMO_PASSWORD`, `GEMINI_INTERVIEW_MODEL`.
- `GEMINI_API_KEY` and `DEMO_PASSWORD` never in `VITE_*` or client code.
- CSRF: mutating requests require `X-Requested-With: fetch`.
- Avatar v1 allowlist: `Ben` only unless more IDs are confirmed.
- Minutes: `5 | 10 | 15 | 20` only.
- Token stays in memory; refresh of live without a token returns to setup.
- No recordings, transcripts, scorecards, or custom avatar images.
- Do not import from parent `../src`. Copy lists and Live wiring into `air_demo`.
- Do not add `throw` at module scope in `api/*.ts` that runs on import for missing env; fail inside the handler with 500.

---

### File map

- Create: `air_demo/package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `vercel.json`, `.env.example`, `index.html`, `README.md`
- Create: `air_demo/public/capture.worklet.js`
- Create: `air_demo/src/options.ts` — voices, languages, avatars, minutes
- Create: `air_demo/src/pcm.ts` — PCM encode/decode/play helpers
- Create: `air_demo/src/styles.css`, `air_demo/src/main.ts` — UI + session
- Create: `air_demo/src/liveSession.ts` — Gemini Live connect, tools, video/audio
- Create: `air_demo/api/options.ts` — same allowlists for server validation (duplicated constants, keep in sync)
- Create: `air_demo/api/validate.ts` — password compare, body parse, system instruction
- Create: `air_demo/api/session.ts` — HTTP handler + token mint
- Create: `air_demo/tests/validate.test.ts`

---

### Task 1: Project scaffold + validation (server)

**Files:**
- Create all config files listed above
- Create: `air_demo/api/options.ts`, `air_demo/api/validate.ts`, `air_demo/api/session.ts`
- Test: `air_demo/tests/validate.test.ts`

**Interfaces:**
- Produces: `parseSessionBody(body, env)` → `{ ok: true, data: SessionRequest } | { ok: false, status, error }`
- Produces: `buildSystemInstruction(data: SessionRequest): string`
- Produces: handler `POST /api/session` → `{ token, expireAt, model, systemInstruction, voiceName, language, minutes, avatarName }`

- [x] Implement scaffold, validation, session handler, unit tests, Vite app, Live client (this session executes inline after plan write).

Commands:

```bash
cd air_demo && npm install && npm run test:unit && npx tsc --noEmit && npm run build
```
