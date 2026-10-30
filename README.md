# #find-my-buyers

**Every buyer leaves a trail. Follow it.**

Type any company, product or keyword. Three AI teammates work out who is about to buy from that business, pin the evidence on a wall, and write the first message.

Live: https://find-my-buyers.vercel.app

Built by the FlytBase marketing team (Sruthi, Baisali, Kanchi) for the Marketing Build Session, 31 Oct 2026. It is **v0.1 on purpose**: rough edges included. Your job is to beat it.

---

## The idea in one example

FlytBase sells software that runs drone docking stations. Anyone who just **bought drone docks** now needs software to run them. That purchase is a **buying signal**. It shows up in public before the buyer ever fills in a form: a tender, a job post, a press release, a regulatory approval, a talk at an event.

This tool does that thinking for any business:

1. Work out what the business sells and the **trigger moment** when its buyers are ready.
2. Turn that into a **signal recipe**: 8 signals to watch, each with a search.
3. Search the web for real organisations showing those signals.
4. Score each one and pin it on the wall.
5. Find the person who owns the decision and write a first email and LinkedIn note.

## The crew

| Teammate | Job | Output |
|---|---|---|
| **Sniff** | Reads the business | Profile: what it sells, who buys, trigger moment, competitors, 8-signal recipe |
| **Scout** | Hunts for buyers | Clues: company, what happened, date, source link, fit/freshness/intent scores, decision role |
| **Quill** | Writes to them | Named person (if public), email with subject, LinkedIn note |

## How a run flows

```
You type a business
      |
      v
SNIFF  -- search the business --> AI --> profile + 8-signal recipe
      |
      v
SCOUT  -- 4 hunts in parallel, each takes 2 signals --> search --> AI --> clues
      |        (dedupe by company, drop anything older than ~1 year)
      v
SCORE  -- heat = (fit + freshness + intent) / 15 x 100, sort, top 3
      |
      v
QUILL  -- for each top 3: search the company + role --> AI --> person + email + LinkedIn note
      |        (click any other clue to have Quill write that one too)
      v
Wall shows every clue; letters open as typed notes
```

Every step is an **event** (`you`, `typing`, `say`, `center`, `clue`, `letter`, `error`). Events are recorded with timestamps, which is how **Save run** and **Replay** work.

## Buttons

- **Steal the recipe**: downloads the business profile and the 8 signals (JSON). Reuse it as a template.
- **Save run**: downloads the whole run (all events) as JSON.
- **Replay**: plays a saved run back as if live. Good demo backup.
- **Use my own key**: optional. Runs use your own AI account instead of the built-in one.

## Files

```
index.html       The whole app: UI, crew prompts, AI calls, wall, replay. No build step.
api/proxy.js     Vercel function. Forwards AI calls server-side (browsers often block direct calls).
                 Adds the built-in OLLAMA_API_KEY when the visitor has no key.
api/search.js    Vercel function. Free, keyless web search: Google News RSS (last 12 months) + Bing.
api/ok.js        Health check the page uses to know the helper is there.
vercel.json      Function settings.
AGENTS.md        Guide for AI assistants (Claude, ChatGPT, Cursor) working on this code.
llms.txt         Short machine-readable summary, also served at /llms.txt on the live site.
```

## Run your own copy

**Deploy (2 minutes):**
1. Fork this repo.
2. Import it on [vercel.com/new](https://vercel.com/new). No framework, no build command.
3. Optional: add an environment variable `OLLAMA_API_KEY` (free key at [ollama.com](https://ollama.com/settings/keys)) so visitors never need a key.

**Or just open it:** open `index.html` through any static server and add your own key with **Use my own key**. Without the `api/` functions, some browsers block AI calls, so Vercel is the easier path.

**Supported AI providers:** Ollama (default, uses free search), Claude, Gemini, OpenAI, Perplexity, OpenRouter. The page detects the provider from the key.

## Ideas to beat it (pick a track)

**Design: make the signals impossible to ignore**
- A better wall: timeline view, map view, group by signal type.
- Make a weak clue look weak and a hot one look urgent.
- Mobile version for a sales rep on the move.

**Strategy: find the signal nobody else is watching**
- Edit a stolen recipe for your own business. Which signals are actually early?
- Add sources the crew does not know: tender portals, permit databases, job boards, Reddit, GitHub.
- Change the scoring. Is a tender worth more than a job post?

**Automation: make it run without you**
- Run a recipe every morning and post new clues to Slack.
- Push clues and letters into a Google Sheet, HubSpot or Salesforce.
- Send Quill's emails as drafts in Gmail.

## Known flaws (start here)

- Some clues are a stretch (wrong industry, a vendor instead of a buyer).
- Letters sometimes have no real name, just a role.
- Free search returns news headlines, so the evidence can be thin.
- Sniff can misread a business from a bare name. Use the website.
- The built-in key is shared, so a full room can hit rate limits.
