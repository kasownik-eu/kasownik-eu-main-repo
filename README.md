# Kasownik.eu

## Tariff sync

Keeps operator tariffs (tickets, luggage, zones, rules note) up to date from the operators' own web pages. Each run, for every operator that has pages under **Sources → Tariff sources** (URL + optional XPath):

1. fetches the pages and cuts out the XPath block (no match or an invalid XPath fails the operator),
2. caches them in `TARIFF_CACHE_DIR` and stops when the extracted text is unchanged,
3. asks the LLM provider for data matching the tariff schema, validates it with Zod,
4. diffs it against the current operator: small changes are applied (PL + EN), large ones wait for manual review,
5. emails `TARIFF_NOTIFY_EMAILS` on failures and when a review is needed.

Every run is logged in admin under **Sync → Tariff syncs**. To review, open a `pending_review` run, check `changes` and `reviewReasons`, then set the status to `approved` (applies it) or `rejected`. Every write creates an operator version, so it can be reverted with **Restore** in the operator's Versions tab.

### Configuration (`.env`)

| Variable                                                                                                                                                                                           | Purpose                                                                                    |
|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------|
| `TARIFF_LLM_PROVIDER`                                                                                                                                                                              | LLM provider: `ollama-cloud` or `fixture` (returns `<TARIFF_LLM_FIXTURE_DIR>/<slug>.json`) |
| `TARIFF_LLM_FIXTURE_DIR`                                                                                                                                                                           | Fixture directory, default `tests/fixtures/tariffs`                                        |
| `OLLAMA_API_KEY`                                                                                                                                                                                   | Ollama Cloud API key (secret, required for `ollama-cloud`)                                 |
| `OLLAMA_MODEL`, `OLLAMA_BASE_URL`, `OLLAMA_THINK`, `OLLAMA_TEMPERATURE`, `OLLAMA_SEED`, `OLLAMA_NUM_CTX`, `OLLAMA_NUM_PREDICT`, `OLLAMA_TIMEOUT_MS`, `OLLAMA_MAX_RETRIES`, `OLLAMA_RETRY_DELAY_MS` | Optional overrides; defaults in `src/tariffs/llm/ollama-cloud/config.ts`                   |
| `TARIFF_CACHE_DIR`                                                                                                                                                                                 | Downloaded page cache, default `.tmp/tariffs` (git-ignored)                                |
| `TARIFF_NOTIFY_EMAILS`                                                                                                                                                                             | Comma-separated recipients of failure / review emails; empty = no emails                   |
| `SERVER_URL`                                                                                                                                                                                       | Base URL used for admin links in emails                                                    |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM_ADDRESS`, `EMAIL_FROM_NAME`                                                                                                        | SMTP settings; without `SMTP_HOST` emails are only written to the server log               |

### Running from the CLI (script)

Runs the sync immediately, without the jobs queue:

```bash
npm run sync:tariffs                                   # all operators with tariff pages
npm run sync:tariffs -- <slug>                         # one operator
npm run sync:tariffs -- <slug> dry-run                 # fetch, extract, validate and print the diff; writes nothing, sends no email
npm run sync:tariffs -- <slug> force                   # ignore the page cache and always call the LLM
```

Arguments are plain words (`dry-run`, `force`), not `--flags`: `payload run` drops flags and only forwards positional arguments. The command exits with code `1` when any operator failed, so it can be used from a system crontab, e.g.:

```cron
0 3 * * * cd /path/to/transport-helper && npm run sync:tariffs >> /var/log/tariff-sync.log 2>&1
```

### Running as a Payload job (scheduled)

The `syncTariffs` task (`src/jobs/syncTariffs.ts`) is scheduled daily at 03:00 on the `tariffs` queue. While the app server is running (`npm run dev` / `npm run start`), the `autoRun` cron in `src/payload.config.ts` checks the queue every 5 minutes, queues the scheduled run and executes it. Nothing runs when the server is down (e.g. serverless hosting); use the CLI options below instead.

Without the app server, use the Payload jobs CLI:

```bash
npm run payload -- jobs:run --queue tariffs --handle-schedules   # queue due scheduled runs, then run queued jobs
npm run payload -- jobs:run --queue tariffs --handle-schedules --cron "*/5 * * * *"   # keep running as a worker
```

To queue a run on demand (e.g. from code or a custom endpoint):

```ts
await payload.jobs.queue({ task: 'syncTariffs', queue: 'tariffs', input: { slug: 'some-operator' } }) // slug optional
```

A failed job (any operator failed) is marked as errored and retried once; see the `payload-jobs` collection and the failure emails. Note that `jobs:run` itself exits with code `0` even when a job fails.

## Questions

If you have any issues or questions, reach out to us on [Discord](https://discord.com/invite/payload) or start a [GitHub discussion](https://github.com/payloadcms/payload/discussions).
