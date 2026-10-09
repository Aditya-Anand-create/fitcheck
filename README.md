# FitCheck

Live demo: https://fitcheck-pequ.onrender.com (free tier, first load can take 30-50 seconds)

Paste a resume and a job description. FitCheck lists the skills the job asks for, shows which ones your resume covers, which are missing, and what to do about it.

Stack: React (Vite), Node.js + Express, MongoDB.

## Why it works the way it does

The matching is plain rules, not an AI model, so every score can be explained:

1. `server/src/skills.js` holds a hand-written list of ~40 skills with aliases (for example Node.js = `node`, `nodejs`).
2. Text is matched on whole words, so `java` does not match `javascript` and `js` does not match `node.js`.
3. `server/src/analyze.js` reads the job text, tags each skill as required or nice-to-have (from headings like "Nice to have"), and scores `required = 2 points, nice to have = 1 point`. Score = points matched / points available.
4. If the job text has no known skills, the score is `null` (shown as "-"), not a made-up number.

Limits: it only knows skills in the list, and it checks keywords, not how well you know them. It is a quick check, not a hiring prediction.

## Architecture

```
React (client/)  --fetch-->  Express API (server/src/app.js)
                               |-- analyze.js  (scoring)
                               |-- store.js    (MongoDB, or memory if no MONGODB_URI)
```

API:
- `POST /api/analyze` `{ resume, jd, title? }` returns the result and saves it
- `GET /api/analyses` last 10 checks
- `GET /api/analyses/:id` one saved result
- `GET /api/health`

In production Express also serves the built React app, so it deploys as one service.

## Run locally

```
npm run build
npm start            # http://localhost:3000, in-memory storage
MONGODB_URI="mongodb+srv://..." npm start   # with MongoDB
npm test             # 8 tests: matching rules, scoring, API
```

Dev mode: `npm run dev:server` and `npm run dev:client` in two terminals.

## Deploy

`render.yaml` is included. On Render choose "New Blueprint", pick this repo, and optionally set `MONGODB_URI`. Without it the app still runs and keeps history in memory.
