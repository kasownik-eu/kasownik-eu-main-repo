# Claude Code

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

## UI rules
- Use ONLY shadcn/ui components (install via `npx shadcn@latest add <name>`).
- Do not write custom UI components if an equivalent exists in shadcn or in the blocks registries.
- Styling with Tailwind only, mobile-first (default to mobile, then sm:/md:/lg:).
- Each Payload Block = one component in /blocks, composed of shadcn components.
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

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
