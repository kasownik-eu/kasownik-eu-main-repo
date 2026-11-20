# LLM extraction: findings and guidelines

What we learned building the tariff sync (`src/tariffs/`) on a local model, and how to build the next LLM tools
(purchase methods, zones, ...) so they are fast, accurate and universal. Reference run: Transport GZM (`ztm-gzm`).

## Result

| | Start | Now |
|---|---|---|
| Input to the model | ~20.7k tokens (whole tariff page) | ~5k tokens (XPath on the price list) |
| Output | ~12k tokens, cut off by the limit | ~2.7k tokens |
| Ticket pass | never finished (20+ min) | ~5.5 min, 33 tickets, prices verified against the source |
| Luggage pass | did not exist | ~2 min, 8 rows (luggage, bike, pet, stroller, other) |
| Hallucinations | `"null"` strings, invented sales channels, events and fines as tickets | none left in the applied data |

## Running Ollama on the Steam Deck

- **GPU:** Ollama detects the Deck's APU (RDNA2, `gfx1033`) over Vulkan but drops integrated GPUs by default. Start the
  server with `OLLAMA_VULKAN=1 OLLAMA_IGPU_ENABLE=1`. ROCm does not support `gfx1033`. Every CPU-only run was 3-5x slower.
- **Memory:** the GPU sees 9 GiB (1 GiB carve-out + 8 GiB shared with the system RAM). 14.8 GB RAM in total, and the IDE
  and browser use ~9 GB. A 17 GB model (Qwen 27B) cannot load; `gemma2:9b` was killed under memory pressure.
  Unload models you are done with (`ollama stop <model>`), they keep holding memory.
- **Service:** the packaged system unit failed with `203/EXEC`: it runs as user `ollama`, which cannot enter
  `/home/deck` (mode 700). Use a user unit (`~/.config/systemd/user/ollama.service`, runs as `deck`, sets the two GPU
  variables). Disabling the old system unit needs sudo.
- **Timeout:** Node's `fetch` gives up after 300 s without response headers whatever `OLLAMA_LOCAL_TIMEOUT_MS` says. The
  `ollama-local` provider passes an `undici` `Agent` with `headersTimeout`/`bodyTimeout` = the configured timeout.
- **`.env`:** `TARIFF_LLM_PROVIDER=ollama-local`, `OLLAMA_LOCAL_MODEL=qwen3.5:9b`, `OLLAMA_LOCAL_THINK=false`,
  `OLLAMA_LOCAL_NUM_PREDICT=10000`, `OLLAMA_LOCAL_TIMEOUT_MS=3600000`.

## Models tried (all on this machine)

| Model | Verdict |
|---|---|
| `qwen3.8:27b` (17 GB) | does not fit |
| `gemma2:9b` | killed while loading; only 8k context anyway |
| `qwen3.5:4b` | works, but on CPU it was too slow; output limit hit |
| `gemma4:e4b` (GPU, ~20 tok/s) | fast, but ignored rules: events and fines as tickets, duplicate names |
| `qwen3.5:9b` (GPU, ~11 tok/s) | best: follows the schema and the prompt well. Use this one |

A bigger model was not the answer: the 9B already extracts correctly once the task is designed well.

## What decides the run time

Time is almost entirely **output tokens**: prompt processing runs at ~100 tokens/s, generation at ~11 tokens/s (9B). Cut
output, not just input. What worked, in order of impact:

1. **Narrow the input with an XPath** (`tariffSources[].xpath`): the tariff page is mostly legal rules; the price list
   (`//p[contains(normalize-space(.), 'V. Cennik')]/following-sibling::*`) is a quarter of it.
2. **Polish only.** `en` is optional in the content (falls back to Polish), so the model writes `{ "pl": ... }`. English
   comes later from a separate step; `keepTranslations` carries over English that already exists for the same Polish text.
3. **Leaner schema.** Optional fields can be omitted instead of `null`; short phrases (about 12 words), not copied sentences.
4. **The model reports facts, code decides** (see below): no long rule text in the prompt to misread.
5. **One task per pass** with its own small schema, prompt and sources.

Markdown instead of plain text would not help: the extractor already outputs compact text (tables as `a | b`).

## Guidelines for the next LLM tools

1. **LLM reports facts; code derives and filters.** Ticket `kind` (enum) + `duration` (`{ value, unit }`) in; `category`
   (single/short/long/other) computed in `src/tariffs/classify.ts`. Small models misread threshold rules ("up to and
   including 7 days") but read a number and a unit reliably. Rows that are not tickets are tagged and dropped in code.
2. **Closed enums for anything that can be classified** (ticket kind, luggage type, transport modes). Never free text
   for things that can be invented: `whereToBuy` produced "Automaty biletowe" for 23 tickets the page never mentions, so
   it is not extracted (TODO in `src/tariffs/schema.ts`: make it an enum and let the model pick only when the text says it).
3. **Separate passes, separate sources.** Tickets (`tariffSources`) and luggage (`luggageSources`) are two LLM calls.
   A pass runs only when its pages changed (or with `force`); a pass that does not run, or has no sources, keeps the
   current data. The page cache is keyed by URL **and** XPath, so one page can feed several passes.
4. **Do not rely on "do not" in the prompt.** Small models ignore negative rules ("do not output event offers"). Tag
   (`kind`) and filter in code, and keep the prompt rule only as a hint. Positive rules with a Polish example work
   better ("`do 5 minut` -> 5 minutes").
5. **Rules leak between entries.** A general rule ("not on seats") or another type's duty got copied onto every row. Tell
   the model to take each entry's text only from sentences that name that very type; put general rules in one entry.
6. **Normalise before validating** (`src/tariffs/normalizeOutput.ts`): `"null"`, `"-"`, `n/a` become real nulls, and an
   all-null `{ pl }` text becomes null. It runs for every provider.
7. **Never wipe what the LLM does not produce.** `keepTranslations` (English by Polish text), `keepWhereToBuy`, and keeping
   the existing luggage when a pass does not run. `applyTariff` leaves null fields out so untouched rows keep a minimal diff.
8. **Every prompt change shifts something else.** Each tweak fixed one problem and sometimes introduced another. Always
   dry-run and validate before applying; each run costs minutes, so change one thing at a time.
9. **Stay universal.** Parsing the price tables in code would be faster and exact, but it is per-operator. The pipeline is
   generic instead: XPath selects the section, the model extracts, code validates.

## Validation routine (do this before applying anything)

`npm run sync:tariffs -- <slug> dry-run force` prints the proposed diff and the skipped rows. Then check, against the
fetched source text (`.tmp/tariffs/<slug>/*.fetched.txt` or `npm run research:check-source -- <url> [xpath]`):

- the number of rows against the number of table rows in the source; names unique;
- every price appears in the source text (a script that looks each number up as `4,60 zł` is enough);
- no literal `"null"`, placeholders (`-`) or empty strings;
- categories and types make sense; the "Skipped, not tickets" list holds only non-tickets;
- fields the page does not state (sales channels, zones) are empty, not guessed;
- the wording of rules matches the source sentence they come from.

Then run without `dry-run`, `npm run validate:data`, and review `git diff data/`.

## Next steps

- `whereToBuy` as an enum of sales channels (see above).
- English translation step: translate only new or changed Polish strings, cache by text.
- The site does not use luggage `type` yet (for example an icon per type).
- Section-level caching: re-run only the part of a page that changed (useful once an operator has a full price list).
- Apply the same pass/source/enum pattern to the purchase (`purchaseSources`) and zone (`zoneSources`) pipelines.
