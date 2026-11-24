<p align="center">
  <a href="https://kasownik.eu"><img src="src/app/icon.svg" alt="Kasownik logo" width="96" height="96"></a>
</p>

# [Kasownik.eu](https://kasownik.eu)

**Main site: <https://kasownik.eu>**

<a href="https://forms.gle/DUiS9HLGpmdkWnrz6"><img src="docs/report-error.webp" alt="Widzisz błąd? Napisz nam. Zgłoś błąd"></a>

A static site: `npm run build` turns the JSON files in `data/` into plain HTML in `out/`. There is no database, CMS or
server; any static file host can serve `out/`. Content is edited in git.

## Content

```
data/
  polska/                       # country (folder name = URL-safe slug)
    country.json                # { code: "PL", name }
    slaskie/                    # voivodeship
      voivodeship.json          # { code: "PL-24", name }
      ztm-gzm/                  # operator; the folder name is its URL slug
        operator.json           # basic info, related operators, source pages
        cities.json             # cities it serves: [{ slug, name, primary? }]
        purchase.json           # how to buy a ticket and start the ride (one flow of steps)
        tickets.json            # tickets, luggage, rules
        zones.json              # zone definitions and zone map
        images/                 # logo, zone map, validator photos ({ "file": "logo.svg" } in the JSON)
```

- Texts shown to users are `{ "pl": "…", "en": "…" }`; `en` is optional and falls back to Polish.
- A city exists once some operator lists it in `cities.json`. Several operators may list the same city (same `slug`
  and `name`); the one with `"primary": true` (default: first by name) fills the city page, the others are shown as
  related. A city belongs to the operator's voivodeship unless its entry sets `"voivodeship"`.
- Only `operator.json` is required; the other files and `images/` are optional.
- `npm run validate:data` checks everything (schema, unknown keys, missing images, links between operators, city
  names) and lists every problem with its file. `npm run build` does the same and fails on any problem.
- VS Code autocompletes and validates the files (`.vscode/settings.json` → `schemas/`). After changing
  `src/content/schema.ts`, run `npm run generate:schemas`.
- `images/` are copied to `public/media/<operator>/` before `dev` and `build`; restart `npm run dev` after adding images.

## Templates

Pages are assembled from reusable blocks. Each page kind has templates in `templates/<page>/<name>.json`
(`home`, `city`, `operator`, `cities`, `operators`; `default.json` is required) that list blocks in four slots:
`top` (above `<main>`, breadcrumbs), `hero` (full-width bands at the start of `<main>`, e.g. the home page's yellow
hero), `main` (the content column) and `bottom` (full width, footers):

```json
{
  "top": [{ "type": "breadcrumbs" }],
  "main": [
    { "type": "operatorHeader" },
    { "type": "notice", "tone": "info", "text": { "pl": "Nowy cennik od 1 stycznia.", "en": "New fares from 1 January." } },
    { "type": "tickets" },
    { "type": "relatedOperators", "visible": 3 }
  ],
  "bottom": [{ "type": "sourceFooter" }]
}
```

- Block types, where each may be used and its settings: `src/blocks/schema.ts`; components: `src/blocks/`.
- An operator uses another template with `"templates": { "city": "compact" }` in `operator.json`, and can add its own
  `notice` / `text` blocks in `"blocks": [...]`; they appear where the template has `{ "type": "operatorBlocks" }`.
- Validation is the same as for content: unknown blocks, misspelled settings, blocks on the wrong page and missing
  templates fail `npm run validate:data` and the build. VS Code autocompletes templates too.

## Site search

One search for the whole site (`src/components/search/SiteSearch.tsx`): the home hero and tour, the header button and the
list pages all use the same component, data and matching ([MiniSearch](https://github.com/lucaong/minisearch): prefix,
diacritic-insensitive, typo-tolerant in longer words). On the city and operator lists the same query also filters the list.

- Data: `getSearchData()` (`src/content/index.ts`) builds one document per city and operator; the build writes it to
  `out/search/<locale>.json` (`src/app/(root)/search/[file]/route.ts`). Pages carry only its version, never the data.
- Version: a hash of the documents plus `SEARCH_FORMAT` (`src/search/config.ts`). Bump `SEARCH_FORMAT` when the document
  shape or the MiniSearch options change, so browsers drop their stored copy.
- Browser: fetched on first use (focus, hover, typing) as `/search/<locale>.json?v=<version>`, stored in IndexedDB
  (`kasownik` / `search`, one record per locale). A page with another version fetches again and overwrites the record.
  One index per page is shared by every search bar; above 2000 documents it is built in chunks.

## Development

```bash
npm run dev            # http://localhost:3000 (JSON edits show up on reload)
npm run build          # static site in out/
npm run test:int       # unit/integration tests
npm run test:e2e       # Playwright against next dev
```

URLs are localized by real folders (no middleware in a static export): `/pl/miasta/`, `/en/cities/`, and so on.
`/`, `/pl/` and `/en/` redirect with a meta refresh. Unknown pages are served as `out/404.html` by the host; in
`next dev` they show Next's "missing param in generateStaticParams" error instead.

## Operator research (Claude Code)

`/operator-research <operator website URL>` (skill in `.claude/skills/operator-research/`) researches an operator and
writes **all** its data: the `operator.json` header (name, label, description, logo, transport modes, contact),
`cities.json`, `tickets.json`, `zones.json`, `purchase.json` and `evidence.json`, a verbatim quote from an official page for
every fact (prices, fees, purchase methods and steps, zones, contact). The pages it used are kept in `tariffSources`,
`luggageSources`, `purchaseSources` (buying and starting the ride are one flow) and `zoneSources`. An operator whose
`websiteUrl` has the same host is verified (differences are corrected and reported), otherwise a new folder is created.
Review the result with `git diff data/`.

Helper scripts used by the skill:

```bash
npm run research:context -- <url>                       # verify/discover, existing cities, operators, voivodeships (JSON)
npm run research:check-source -- <url> [xpath] [--full] # fetch + extract a page exactly like the checker does
```

## Operator check

A small agent keeps the researched data honest. `npm run check:operators -- [<slug>] [--no-llm]` re-reads the pages of every
operator with an `evidence.json` and, per fact, checks that

1. the quote is still on the page and the data still holds the fact's value (`ok`, otherwise `drift` / `unverified`),
2. when the quote vanished, a small LLM (`CHECK_LLM_PROVIDER`) says whether the fact is still stated, changed or gone; its
   answer counts only when the quote it gives is really on the page (`confirmed` / `changed` / `not_found`).

It also lists the lines that were added to or removed from a page since the last good check. It never edits `data/`: it prints
a report (also `.tmp/check/report.json`) and exits with `1` when an operator is stale or unreachable, so it can run from cron
or CI. A stale operator is researched again with `/operator-research`. Design notes: `docs/operator-checks.md`.

```cron
0 3 * * 1 cd /path/to/kasownik && npm run check:operators >> /var/log/operator-check.log 2>&1
```

### Configuration (`.env`)

| Variable                                                                                                                                                                                           | Purpose                                                                                    |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `ALLOWED_DEV_ORIGINS`                                                                                                                                                                              | Dev only: extra comma-separated hosts allowed to load JS from `next dev` (LAN IPs and `*.local` are built in) |
| `CHECK_LLM_PROVIDER` | Provider of the checker's small model: `ollama-cloud`, `ollama-local` or `fixture` (returns `<CHECK_LLM_FIXTURE_DIR>/<slug>.check.json`) |
| `CHECK_LLM_FIXTURE_DIR` | Fixture directory, default `tests/fixtures/check` |
| `OLLAMA_API_KEY`                                                                                                                                                                                   | Ollama Cloud API key (secret, required for `ollama-cloud`)                                 |
| `OLLAMA_MODEL`, `OLLAMA_BASE_URL`, `OLLAMA_THINK`, `OLLAMA_TEMPERATURE`, `OLLAMA_SEED`, `OLLAMA_NUM_CTX`, `OLLAMA_NUM_PREDICT`, `OLLAMA_TIMEOUT_MS`, `OLLAMA_MAX_RETRIES`, `OLLAMA_RETRY_DELAY_MS` | Optional overrides; defaults in `src/check/llm/ollama-cloud/config.ts`                   |
| `OLLAMA_LOCAL_MODEL`, `OLLAMA_LOCAL_BASE_URL`, `OLLAMA_LOCAL_THINK`, `OLLAMA_LOCAL_TEMPERATURE`, `OLLAMA_LOCAL_SEED`, `OLLAMA_LOCAL_NUM_CTX`, `OLLAMA_LOCAL_NUM_PREDICT`, `OLLAMA_LOCAL_TIMEOUT_MS`, `OLLAMA_LOCAL_MAX_RETRIES`, `OLLAMA_LOCAL_RETRY_DELAY_MS` | `ollama-local` provider (no API key): the model you pulled with `ollama pull` (default `qwen3:8b`), server URL (default `http://localhost:11434`) and optional overrides; defaults in `src/check/llm/ollama-local/config.ts` |
| `CHECK_CACHE_DIR` | Downloaded page cache and report, default `.tmp/check` (git-ignored) |
| `CONTENT_DIR` | Content folder for the build and the checker, default `data/` |

