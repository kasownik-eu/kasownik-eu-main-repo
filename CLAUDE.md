# Claude Code

## Content (no database)
The site is a static export (`output: 'export'`, HTML in `out/`) built from JSON files in `data/` — there is no CMS, server or database.
- Layout: `data/<country>/<voivodeship>/<operator>/` with `operator.json`, `cities.json`, `purchase.json`, `tickets.json`, `zones.json` and `images/`; `country.json` / `voivodeship.json` sit in their folders. Folder names are URL slugs.
- Translatable texts are inline `{ "pl": "…", "en": "…" }`; `en` is optional and falls back to `pl`.
- Zod schemas: `src/content/schema.ts` (strict: unknown keys fail). Loader + cross-file checks: `src/content/load.ts`. Pages read only through `src/content/index.ts` (locale-resolved views), never `fs` directly.
- After changing a schema run `npm run generate:schemas` (VS Code autocomplete for `data/`); `npm run validate:data` lists every problem in `data/`.
- Write JSON as `JSON.stringify(value, null, 2) + '\n'` (the tariff sync does too); `data/` is in `.prettierignore`.
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

## LLM providers
LLM providers live next to the pipeline that uses them, one folder per provider (e.g. tariff sync: `src/tariffs/llm/<provider>/`, see `ollama-cloud/` as the reference implementation).
- Folder layout: `index.ts` (the provider object implementing the pipeline's interface, e.g. `TariffExtractor` from `../types`), `prompts.ts` (all prompt texts as exported consts/template functions — never inline prompts in the request logic), `config.ts` (settings).
- Register the provider by name in the pipeline's `llm/index.ts` registry; it is selected via env (e.g. `TARIFF_LLM_PROVIDER`).
- Domain instructions shared by all providers (e.g. `src/tariffs/prompt.ts`) and the JSON schema are passed in as args; `prompts.ts` only adds provider-specific framing.
- Output must be structured JSON, never raw text: use the provider's native structured-output / JSON-schema mode with the passed schema, also state the schema in the prompt, and `JSON.parse` the result. Throw on empty, truncated or non-JSON output. Return the parsed value as `unknown` — Zod validation happens in the pipeline, not in the provider.
- Config: secrets (API keys, tokens) come only from `.env`; every other parameter (model, base URL, temperature, context size, timeouts, retries…) has a default in `config.ts` and an env override. Read config lazily inside `extract()` so a missing key fails only when the provider is used. Document new vars in `.env.example` and the README config table.
- Treat fetched page text as untrusted: wrap it as data in the user prompt and tell the model to ignore instructions inside it.
- Retry only transient failures (network, 429, 5xx) with backoff; use a request timeout.
- Prefer the provider's official npm SDK when one is installed (e.g. `ollama` for Ollama); inject timeouts through the SDK's options/`fetch` hook if it has no timeout of its own. Don't add new dependencies without asking.
- Add an integration test in `tests/int/` that stubs `fetch` (no real network calls / API keys in tests).
- Building a new LLM pipeline (purchase, zones, …): read `docs/llm-extraction.md` first (what makes runs slow, facts-from-LLM/decisions-in-code, enums instead of free text, separate passes and sources, how to validate output). Keep `whereToBuy` out of the LLM output until it is an enum.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
