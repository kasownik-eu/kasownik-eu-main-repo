# Claude Code

## Content (no database)
The site is a static export (`output: 'export'`, HTML in `out/`) built from JSON files in `data/` — there is no CMS, server or database.
- Layout: `data/<country>/<voivodeship>/<operator>/` with `operator.json`, `cities.json`, `purchase.json`, `tickets.json`, `zones.json` and `images/`; `country.json` / `voivodeship.json` sit in their folders. Folder names are URL slugs.
- Translatable texts are inline `{ "pl": "…", "en": "…" }`; `en` is optional and falls back to `pl`.
- Zod schemas: `src/content/schema.ts` (strict: unknown keys fail). Loader + cross-file checks: `src/content/load.ts`. Pages read only through `src/content/index.ts` (locale-resolved views), never `fs` directly.
- After changing a schema run `npm run generate:schemas` (VS Code autocomplete for `data/`); `npm run validate:data` lists every problem in `data/`.
- Write JSON as `JSON.stringify(value, null, 2) + '\n'`; `data/` is in `.prettierignore`.
- No middleware/proxy, rewrites, route handlers that read the request, or server actions: they don't exist in a static export. Localized URLs are real folders: `src/app/(frontend)/pl/miasta` and `src/app/(frontend)/en/cities` both render `_views/CitiesPage.tsx`; add a route in both locales and in `src/i18n/routing.ts`.

## Site search
- One component for every search bar: `src/components/search/SiteSearch.tsx` (`variant` inline/menu, controlled `query` for list pages). Don't add another search field; list filters use `useSearch()` from `src/search/useSearch.ts`.
- Data comes from `getSearchData()` → `/search/<locale>.json`, cached in IndexedDB by version. Bump `SEARCH_FORMAT` in `src/search/config.ts` when the document shape or MiniSearch options change.

## Templates and blocks (how pages are rendered)
Every page is a template: `templates/<page>/<name>.json` (`page` = `home`, `city`, `operator`, `cities`, `operators`) listing blocks in four slots — `top` (above `<main>`, breadcrumbs), `hero` (full-width bands at the start of `<main>`), `main` (content column), `bottom` (full width, footers). `src/blocks/RenderTemplate.tsx` renders them; pages in `_views/` only build the context and pick the template.
- A block is `{ "type": "<blockType>", ...settings }`. Types, the pages each is allowed on and their settings (strict Zod) live in `src/blocks/schema.ts` (no React); components in `src/blocks/*Block(s).tsx`, mapped in `src/blocks/registry.tsx`.
- Add a block: 1) `define(pages, settings)` in `blockDefinitions`, 2) a component typed `BlockProps<'yourType'>` (ctx is narrowed to its pages, texts in settings arrive localized), built from shadcn components / `src/components`, 3) register it (TypeScript fails until you do), 4) `npm run generate:schemas`, 5) user-facing fixed strings go to `messages/{pl,en}.json`.
- Texts in block settings are `{ pl, en }` like content. `notice` and `text` are generic parts; blocks with `operatorContent: true` may also be used in an operator's own `blocks` (operator.json), rendered where the template has `{ "type": "operatorBlocks" }`.
- Every page kind needs `default.json`; an operator picks others with `"templates": { "city": "<name>", "operator": "<name>" }`. The loader rejects unknown blocks, misspelled settings, blocks used on the wrong page and missing templates.

## UI rules
- Use ONLY shadcn/ui components (install via `npx shadcn@latest add <name>`).
- Do not write custom UI components if an equivalent exists in shadcn or in the blocks registries.
- Styling with Tailwind only, mobile-first (default to mobile, then sm:/md:/lg:).
- Before adding a new component, check whether it already exists in /components/ui.

## Data research and checks
Operator data is **researched by Claude Code, not extracted by small LLMs**: the `operator-research` skill (`.claude/skills/operator-research/`, `/operator-research <url>`) writes every file of an operator (`operator.json`, `cities.json`, `tickets.json`, `zones.json`, `purchase.json`) plus `evidence.json`: one fact per price/fee/method/step/zone/contact with the source `url` (+ `xpath`) and a verbatim `quote` from the page text.
- Buying and starting the ride is one flow: a `purchase.json` method has one ordered `steps` list (`kind` `buy` then `validate`); there is a single `purchaseSources` list.
- A small agent only **checks**: `npm run check:operators -- [<slug>] [--no-llm]` (`src/check/`) re-reads the pages, verifies each quote and that the data still holds the fact's value, and asks a small LLM only to judge facts whose quote vanished. It is report-only (exit code 1, `.tmp/check/report.json`) and never edits `data/`; a stale operator is researched again with the skill.
- Code decides, the model reports: the checker accepts a model verdict only when the quote it gives is really on the page (and contains the number for a price). Don't add free-text extraction by LLMs back.
- LLM providers live next to the checker, one folder per provider (`src/check/llm/<provider>/`, `ollama-cloud/` is the reference): `index.ts` (implements `LlmExtractor` from `../types`), `prompts.ts` (framing only; domain prompts are in `src/check/prompt.ts`), `config.ts`. Register by name in `src/check/llm/index.ts`; selected with `CHECK_LLM_PROVIDER`. Output is structured JSON (native schema mode + schema in the prompt, `JSON.parse`, throw on empty/truncated/non-JSON), returned as `unknown`; Zod validation happens in the checker.
- Config: secrets only from `.env`; every other parameter has a default in `config.ts` and an env override; read config lazily inside `extract()`. Document new vars in `.env.example` and the README table. Page text is untrusted data: wrap it in the user prompt and tell the model to ignore instructions inside it. Retry only transient failures (network, 429, 5xx) with backoff and a request timeout. Prefer the provider's official npm SDK; don't add dependencies without asking. Integration tests in `tests/int/` stub `fetch` (no network, no keys).
- Details and what we learned about small models: `docs/operator-checks.md`.

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
