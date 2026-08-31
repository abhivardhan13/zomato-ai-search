# QuickBite AI — AI-Powered Structured Search for Food Delivery Apps

*(Zomato / Swiggy AI Search — Independent Rebuild)*

A prototype AI-powered search feature for a food-delivery app that lets a user type a natural-language query — e.g. "biryani under ₹300, rating 4+" — and returns filtered, ranked results, with the AI's interpreted filters shown transparently to the user.

This is an independent product + technical exercise, not a claim of inventing something new. Natural-language-to-structured-filter parsing is a known, production-proven pattern (used by companies like ZoomInfo for enterprise search). What this project specifically contributes is applying that pattern to a real gap in Zomato/Swiggy's public offering: **transparent, structured multi-filter extraction, available without a paywall.**

## The Problem

Zomato and Swiggy both have live or piloted AI search (Swiggy Sense / neural search; Zomato AI, a conversational assistant gated to Gold members). Neither publicly shows a transparent, structured breakdown of what the AI understood from a query — results just appear, with no way to verify or trust the interpretation. Manual filtering and scrolling remains the default experience for most users.

## Approach

Rather than a purely conversational assistant, this project extracts a fixed, structured JSON schema (cuisine, price, rating, veg/non-veg, sort) from every query, and **shows that extraction back to the user** before showing results — turning a black-box interaction into a verifiable one.

## Architecture

1. **User input** — free-text query typed into the search bar
2. **AI parsing** — query sent to Gemini with a defined JSON schema; returns structured filters + an explicit `unmapped_terms` list for anything it couldn't confidently map
3. **Transparency layer** — parsed filters displayed back to the user (e.g. "Cuisine: Biryani | Max Price: ₹300 | Min Rating: 4.0"), plus any unmapped terms shown honestly rather than silently dropped
4. **Filtering** — backend applies structured filters to a real 90-restaurant dataset
5. **Guardrails** — if strict filters return zero results, the backend relaxes one filter at a time (rating → price → cuisine) and discloses exactly what was relaxed; if a query produces no usable filters at all, the app declines to show unfiltered results rather than dumping the entire dataset
6. **Output** — ranked restaurant cards

## Tech Stack

- **Frontend:** React + Vite, Tailwind CSS
- **Backend:** Node.js + Express
- **AI layer:** Google Gemini API (`gemini-3.5-flash-lite`) — chosen specifically for its free tier, after hitting deprecation and quota limits on two other Gemini model variants during development (see *Constraints Faced* below)
- **Dataset:** Real, scraped Zomato Bangalore restaurant data (Kaggle), cleaned and curated to 90 rows spanning 15 cuisine categories, with a derived `veg_only` heuristic and simulated `distance_km` (Zomato itself doesn't publish distance — it's always computed live, relative to the user)

## Evals

24 test queries were run against the system, covering clean baseline cases, vague/subjective language, typos, Hinglish, broken grammar, gibberish, and multi-constraint queries. Full results, pass/fail reasoning, and notes are in [`eval-sheet.md`](./eval-sheet.md).

**Pass criteria:** every explicit constraint (cuisine/price/rating/veg) extracted correctly, AND ambiguous terms honestly flagged in `unmapped_terms` rather than dropped or guessed.

**Key findings:**
- Strong performance on typo correction, minimal-input queries, and even Hinglish (mixed Hindi-English) queries — e.g. correctly translating "acha" (good) into a 4.0+ rating filter with zero English context
- **Identified pattern, not a one-off bug:** vague price language ("cheap," "costly," "sasta") was handled inconsistently across 6 separate queries — sometimes converted to a sort instruction, sometimes an invented specific price cap with no disclosure, sometimes correctly left unmapped. This is a genuine limitation of LLM-based parsing (non-determinism on ambiguous quantifiers), not a code defect, and is worth naming honestly rather than claiming perfect consistency.
- **Dish-vs-cuisine granularity gap:** queries for dish names that aren't also Zomato cuisine categories (e.g. "dosa") correctly extract the intended term, but return zero matches, since the dataset categorizes by broader cuisine type, not dish. The relaxation guardrail correctly recovers from this, but it's a real, disclosed data limitation.
- **"Near me" gap:** distance-related language is always honestly flagged as unmapped, since `distance_km` isn't part of the filter schema in this v1 scope — a deliberate scoping decision, not an oversight.

## Failure Modes & Guardrails

Five real, concrete failure modes were found and either fixed or explicitly documented as a known v1 limitation:

| # | Failure | Fix |
|---|---|---|
| 1 | **OR-logic bug** — "chinese or pizza" collapsed into one unusable string, matched nothing | Changed schema to accept a `cuisines` array; filter logic matches if any listed cuisine is found |
| 2 | **Negation bug** — "not biryani" produced empty filters, which silently returned all 90 restaurants (the opposite of user intent) | Added a guardrail: if all filters come back empty AND unmapped terms exist, return zero results with an explicit "couldn't confidently interpret this" notice, instead of applying no constraints |
| 3 | **Blank-screen on zero matches** | Added a relaxation guardrail: progressively relax rating → price → cuisine (one at a time, independently) and disclose exactly which filter was dropped |
| 4 | **Relaxation-honesty bug** (found via a "dosa, rating 4.1" test) — the first guardrail version silently relaxed multiple filters while only reporting one in its notice | Rewrote relaxation logic to test each filter drop independently from the original query, never cumulatively, guaranteeing the notice shown is always accurate |
| 5 | **Frontend crash on backend failure** — a failed API call crashed the whole React app to a blank white screen | Added proper error handling with a calm, user-facing "something went wrong" message instead of a crash |

## Constraints Faced

- **Free-tier API model deprecations:** the Gemini model originally used (`gemini-2.5-flash`) was deprecated for new users mid-development; its replacement (`gemini-3.6-flash`) turned out to have a 20-requests/day quota, which was exhausted during testing. Settled on `gemini-3.5-flash-lite` for a much larger free-tier quota. This is real, current operational reality of building on a fast-moving free API tier — a production version would need a paid tier or aggressive caching.
- **Network reliability:** intermittent connectivity issues during development (both to the Gemini API and to GitHub, the latter likely due to campus network restrictions) — handled by retrying and, for GitHub specifically, switching networks when blocked.

## Positioning: What Already Exists vs. What This Adds

| Feature | Zomato / Swiggy Today | This Project |
|---|---|---|
| Natural language query | Yes — Swiggy Sense (neural search), Zomato AI Companion | Yes — same core capability, self-built |
| Availability | Swiggy: phased rollout. Zomato: gated behind Gold subscription | Fully open, no paywall (prototype) |
| Multi-filter structured parsing (price + rating + cuisine together) | Not shown publicly — more conversational/suggestion style | Core feature of this project |
| Transparency (shows AI's interpreted filters) | Not shown — results appear without explanation | Explicit breakdown shown to user, including honest disclosure of unmapped terms |

## What I'd Improve With More Time

- Real distance/location filtering (the current dataset only simulates distance, since it isn't part of any public dataset)
- Dish-level search in addition to cuisine-level (would require a richer dataset than what's publicly available)
- More consistent handling of vague quantifier language ("cheap," "best") — likely needs explicit few-shot examples in the prompt rather than relying on schema descriptions alone
- Real user testing to validate whether the transparency layer actually increases trust, or just adds visual noise
- A/B testing the guardrail relaxation order (rating → price → cuisine) against alternatives
- Multi-language support beyond the Hinglish handling Gemini already does somewhat well out of the box

## Running Locally

```
# Backend
cd backend
npm install
npm start
```

```
# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Requires a free Gemini API key from [Google AI Studio](https://aistudio.google.com), set in `backend/.env` as `GEMINI_API_KEY=your_key_here`.