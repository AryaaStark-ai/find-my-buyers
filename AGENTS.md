# Guide for AI assistants

You are helping someone extend **#find-my-buyers**, a single-page app that finds buying signals for any business. Read README.md first for the idea. This file is the technical map.

## Architecture

- **No build step, no framework.** Everything client-side is in `index.html` (inline CSS + one `<script>`).
- **Serverless functions** in `api/` (Vercel, Node 18+, ES modules):
  - `POST /api/proxy` body `{url, method, headers, body}` forwards to an allow-listed AI host and returns the raw response. If the target is `https://ollama.com/` and no `Authorization` is supplied, it injects `process.env.OLLAMA_API_KEY`.
  - `GET /api/search?q=` returns `{results:[{title,url,content}]}` from Google News RSS (`when:1y`) plus Bing HTML results. No key.
  - `GET /api/ok` health check.

## Key code in index.html (search for these names)

| Name | What it does |
|---|---|
| `S` | Settings from localStorage: `prov`, `key`, `model`, `depth` (number of parallel hunts), `sender` |
| `PROV`, `detect()` | Provider list and key-prefix detection (`sk-ant-` Claude, `AIza` Gemini, `sk-or-` OpenRouter, `pplx-` Perplexity, `sk-` OpenAI, hex+dot Ollama) |
| `apiFetch()` | Routes AI calls through `/api/proxy` when the helper is up |
| `ask(prompt,{search,queries})` | Dispatches to `askOllama`, `askClaude`, `askGemini`, `askOpenAI`, `askChat` (Perplexity/OpenRouter). Always returns `{data, sources}` where `data` is parsed JSON |
| `webSearch()` | Ollama path only: free `/api/search` first, Ollama web search as fallback. Results are injected into the prompt as numbered evidence |
| `P.sniff`, `P.scout`, `P.quill` | The three prompts. Edit these to change behaviour |
| `VOICE` | Tone rules for the chat lines |
| `go()` | The run: sniff, parallel scout hunts, score, top-3 quill |
| `writeFor(clue)` | Quill for one clue (also used on click) |
| `heat(s)` | Score = (fit + freshness + intent) / 15 x 100 |
| `emit(type,p)` / `render[type]` | Event bus. Every visible change is an event, recorded in `RUN.events` |
| `replay(R)` | Re-plays saved events with compressed timing |
| `addClue()`, `SLOTS`, `drawString()` | Wall layout (15 fixed slots) and red strings |
| `openLetter()` | The typed-letter overlay with Email / LinkedIn tabs |

## Data shapes

Profile (Sniff output):
```json
{"name":"","one_liner":"","buyers":[],"trigger_moment":"","competitors":[],"say_1":"","say_2":"",
 "signals":[{"signal":"","type":"tender|hiring|purchase|expansion|regulation|competitor|event|social","look_for":"","query":""}]}
```

Clue (Scout output, one per organisation):
```json
{"company":"","type":"","headline":"","date":"Mon YYYY","source_title":"","source_url":"","why_now":"",
 "fit":1,"freshness":1,"intent":1,"decision_role":"","say":""}
```

Letter (Quill output):
```json
{"name":"","title":"","person_source":"","email_subject":"","email":"","linkedin":""}
```

Saved run (Save run / Replay):
```json
{"input":"","mode":"company|product|keyword","geo":"","model":"","at":"ISO date","profile":{},"recipe":[],"signals":[],
 "events":[{"t":0,"type":"you|typing|say|center|clue|letter|error|reset","p":{}}]}
```

Recipe (Steal the recipe):
```json
{"recipe":"find-my-buyers/v0.1","business":{"name":"","sells":"","buyers":[],"trigger_moment":""},"signals_to_watch":[]}
```

## Rules the prompts enforce (keep them unless you mean to change them)

- Scout only names organisations that appear in search results. No invented companies, dates, people or links.
- Targets are end buyers, never vendors in the same space or the business's existing customers/partners.
- Evidence must be from roughly the last 12 months (also filtered client-side by year).
- Quill opens with the buyer's news, not the seller's pitch; short sentences; no em dashes; one yes/no question at the end.

## Good first changes

- Add a new signal source: add a function in `api/search.js` and merge its results.
- Add an export: read `RUN.signals` and `RUN.messages` and post them to a webhook (Slack, Sheets, CRM).
- Schedule it: call the same prompts from a cron job (Vercel Cron, GitHub Actions) using a saved recipe.
- Change scoring: edit `heat()` and the `fit/freshness/intent` instructions in `P.scout`.
- Redesign: the wall is plain absolutely-positioned divs; the chat is a flex column.
