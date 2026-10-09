# FitCheck

Compare the skills in a job post with what your resume says.

Live: https://fitcheck-pequ.onrender.com (free hosting, the first load after a quiet spell takes 30-50 seconds)

React front end, Express API, MongoDB for saved checks.

## How the score works

No AI model. `server/src/skills.js` has a list of about 40 skills, each with a few spellings (`node`, `nodejs`, `node.js`). Both texts are searched for those spellings as whole words, so `java` doesn't match `javascript`.

`server/src/analyze.js` then works out which skills the job post wants. Anything under a "nice to have" heading counts 1 point, everything else counts 2. Score = points you have / points the post asks for. If the post has no skills the list knows, there's no score.

What it can't do: judge how well you know something, or recognise a skill that isn't in the list.

## Resume upload

`POST /api/parse-pdf` takes a PDF as the raw request body (max 4 MB) and returns the text, using `unpdf`. Scanned or image-only PDFs have no text to read, so the API answers with an error and the page asks you to paste instead. The extracted text lands in the resume box so you can fix it before checking.

## API

- `POST /api/analyze` with `{ resume, jd, title }`
- `POST /api/parse-pdf`
- `GET /api/analyses` and `GET /api/analyses/:id`
- `GET /api/health`

In production Express also serves the built React app, so it runs as one service.

## Run it

```
npm run build
npm start
```

Opens on port 3000. Without `MONGODB_URI` it keeps checks in memory and they disappear on restart. With it (`MONGODB_URI="mongodb+srv://..." npm start`) they're stored in a `fitcheck` database.

```
npm test
```

Dev: `npm run dev:server` and `npm run dev:client` in two terminals.

## Deploy

`render.yaml` works as a Render blueprint. Or make a Web Service by hand: build command `npm run build`, start command `npm start`.
