# Operator research and checks

Operator data is researched by Claude Code (the `operator-research` skill) and kept honest by a small checker
(`npm run check:operators`). This replaces the earlier approach where small local/cloud LLMs extracted tariffs and
purchase methods from the pages (that code is gone; it lived in `src/tariffs/` and `src/purchase/`).

## Why

Small models (9B on a Steam Deck) extract a price list in ~5 minutes and still invent things: sales channels the page never
mentions, fines as tickets, rules copied onto every row, buying steps that are only "where to find something". Months of
prompt tuning fixed one problem at a time and introduced another. A researching agent that reads the pages, decides, and has
to **quote its source** gets the data right once; a cheap check is enough afterwards.

## The two halves

1. **Skill** (`.claude/skills/operator-research/`): writes `operator.json`, `cities.json`, `tickets.json`, `zones.json`,
   `purchase.json` and `evidence.json`. Every fact the checker can verify is listed in `evidence.json` with `file`, `path` (where
   the value sits), `value`, the source `url` (+ `xpath`) and a verbatim `quote` from the text `research:check-source --full` prints.
2. **Checker** (`src/check/`): per operator and page it
   - fetches the page and extracts the text exactly as the skill saw it (`extractContent`: XPath or `<main>`, tables as `a | b`),
   - checks each fact: the data at `path` still equals `value` (else `drift`), a numeric value occurs in its own quote
     (else `quote_inconsistent`), the quote is on the page after whitespace collapsing (else the fact goes to the model),
   - asks the model, one call per page, only about facts whose quote vanished: `confirmed` / `changed` / `not_found`, each with
     a quote copied from the page. **Code verifies that quote** (present on the page; contains the number for a price) and
     downgrades anything else to `unverified`,
   - diffs the page text against the last good copy (`.tmp/check/`) so a reviewer sees what moved; a page is promoted to the new
     baseline only when all its facts are ok.
   It is report-only: exit code 1 and `.tmp/check/report.json` when an operator is `stale` or `unreachable`. Re-research with the
   skill; review with `git diff data/`.

## What the checker cannot see

New rows that appear on a page (a new ticket) are not facts it knows about; the page diff is the only hint (`+ …` lines). Quotes
that are too short (a bare number) match anywhere and hide changes; quotes that are too long break on a typo fix. The skill
rules in `reference.md` say how to choose them.

## Guidelines kept from the extraction experiments

- Facts from the model, decisions in code. Accept a verdict only if its evidence (a quote) is verifiable.
- Small output beats small input: ask for a verdict + quote, never for whole data structures.
- Narrow the input with an XPath (`*Sources[].xpath`); a price list is a quarter of a tariff page.
- Closed enums for anything classifiable (ticket category, luggage type, purchase method type, step kind).
- Page text is untrusted: the prompt wraps it and tells the model to ignore instructions inside it.

## Running Ollama on the Steam Deck

- **GPU:** Ollama detects the Deck's APU (RDNA2, `gfx1033`) over Vulkan but drops integrated GPUs by default. Start the server
  with `OLLAMA_VULKAN=1 OLLAMA_IGPU_ENABLE=1`. ROCm does not support `gfx1033`. CPU-only runs were 3-5x slower.
- **Memory:** the GPU sees 9 GiB (1 GiB carve-out + 8 GiB shared). A 17 GB model (Qwen 27B) cannot load; `gemma2:9b` was killed
  under memory pressure. Unload models you are done with (`ollama stop <model>`).
- **Service:** the packaged system unit failed with `203/EXEC` (it runs as user `ollama`, which cannot enter `/home/deck`).
  Use a user unit (`~/.config/systemd/user/ollama.service`, runs as `deck`, sets the two GPU variables).
- **Timeout:** Node's `fetch` gives up after 300 s without response headers whatever `OLLAMA_LOCAL_TIMEOUT_MS` says; the
  `ollama-local` provider passes an `undici` `Agent` with `headersTimeout`/`bodyTimeout` = the configured timeout.
- **Model:** `qwen3.5:9b` (GPU, ~11 tok/s, `OLLAMA_LOCAL_THINK=false`) followed schemas and prompts best of those tried.
- **`.env`:** `CHECK_LLM_PROVIDER=ollama-local`, `OLLAMA_LOCAL_MODEL=qwen3.5:9b`, `OLLAMA_LOCAL_THINK=false`.
