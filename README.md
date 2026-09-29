# AIR Demo

Standalone Gemini 3.8 Live avatar interview demo. Not InterviewCandy.

Hardcoded login (temporary): username `admin1`, password `admin1`.

## Local (no Vercel link)

Fill `air_demo/.env` with `GEMINI_API_KEY` and `GEMINI_INTERVIEW_MODEL=gemini-3.8-live`.

Terminal 1:

```bash
cd air_demo
npm run dev:api
```

Terminal 2:

```bash
cd air_demo
npm run dev
```

Open http://localhost:4174  
Log in with username `admin1`, password `admin1`.

You do not need `npx vercel link` to test locally.

## Vercel

Create a new Vercel project with **Root Directory** `air_demo`. Set `GEMINI_API_KEY` and `GEMINI_INTERVIEW_MODEL`.
