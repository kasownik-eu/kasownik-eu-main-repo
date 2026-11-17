# Kasownik.eu

A static site: `npm run build` turns the JSON files in `data/` into plain HTML in `out/`. There is no database, CMS or
server; any static file host can serve `out/`. Content is edited in git.

## Content

```
data/
  polska/                       # country (folder name = URL-safe slug)
    country.json                # { code: "PL", name }
    slaskie/                    # voivodeship
      voivodeship.json          # { code: "PL-24", name }
      mzt-przykladowe/          # operator; the folder name is its URL slug
        operator.json           # basic info, related operators, sources, tariff-sync pages
        cities.json             # cities it serves: [{ slug, name, primary? }]
        purchase.json           # how to buy and validate a ticket
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

## Tariff sync

Keeps operator tariffs (tickets, luggage, zones, rules note) up to date from the operators' own web pages. Each run, for every operator with `tariffSources` in `operator.json` (URL + optional XPath):

1. fetches the pages and cuts out the XPath block (no match or an invalid XPath fails the operator),
2. caches them in `TARIFF_CACHE_DIR` and stops when the extracted text is unchanged,
3. asks the LLM provider for data matching the tariff schema, validates it with Zod,
4. diffs it against the operator's current `tickets.json` / `zones.json` and, when anything changed, rewrites both files
   (PL + EN; the zone map and `purchase.json` are kept) and marks the operator's sources as AI-assisted.

There is no review step: changes are written straight into `data/`. Review them with `git diff data/` before committing;
`git checkout data/` undoes a run. Failures are printed and make the command exit with code `1`; nothing else reports them yet.

### Configuration (`.env`)

| Variable                                                                                                                                                                                           | Purpose                                                                                    |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `ALLOWED_DEV_ORIGINS`                                                                                                                                                                              | Dev only: extra comma-separated hosts allowed to load JS from `next dev` (LAN IPs and `*.local` are built in) |
| `TARIFF_LLM_PROVIDER`                                                                                                                                                                              | LLM provider: `ollama-cloud` or `fixture` (returns `<TARIFF_LLM_FIXTURE_DIR>/<slug>.json`) |
| `TARIFF_LLM_FIXTURE_DIR`                                                                                                                                                                           | Fixture directory, default `tests/fixtures/tariffs`                                        |
| `OLLAMA_API_KEY`                                                                                                                                                                                   | Ollama Cloud API key (secret, required for `ollama-cloud`)                                 |
| `OLLAMA_MODEL`, `OLLAMA_BASE_URL`, `OLLAMA_THINK`, `OLLAMA_TEMPERATURE`, `OLLAMA_SEED`, `OLLAMA_NUM_CTX`, `OLLAMA_NUM_PREDICT`, `OLLAMA_TIMEOUT_MS`, `OLLAMA_MAX_RETRIES`, `OLLAMA_RETRY_DELAY_MS` | Optional overrides; defaults in `src/tariffs/llm/ollama-cloud/config.ts`                   |
| `TARIFF_CACHE_DIR`                                                                                                                                                                                 | Downloaded page cache, default `.tmp/tariffs` (git-ignored)                                |
| `CONTENT_DIR`                                                                                                                                                                                      | Content folder for the build and the sync, default `data/`                                 |

### Running

```bash
npm run sync:tariffs                                   # all operators with tariff pages
npm run sync:tariffs -- <slug>                         # one operator
npm run sync:tariffs -- <slug> dry-run                 # fetch, extract, validate and print the diff; writes nothing
npm run sync:tariffs -- <slug> force                   # ignore the page cache and always call the LLM
```

`--dry-run` / `--force` work too. The command exits with code `1` when any operator failed, so it can run from cron or
a scheduled CI job; the site only changes once the updated JSON is committed and rebuilt:

```cron
0 3 * * * cd /path/to/kasownik && npm run sync:tariffs >> /var/log/tariff-sync.log 2>&1
```
