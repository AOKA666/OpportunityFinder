# AI Product Ranking Database

Internal MVP for collecting product-ranking signals, filtering unsuitable
products, extracting reusable product patterns, reviewing candidates, and
generating traceable opportunities for solo developers.

## Setup

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Copy `.env.example` to `.env.local` and configure the required services.
   AI enrichment uses the BigModel OpenAI-compatible endpoint with `glm-5.1`.
   Set `BIGMODEL_API_KEY`; `AI_BASE_URL` and `AI_MODEL` can usually keep their
   example values.

3. Apply the SQL files in `supabase/migrations` to a Supabase project.

4. Seed ranking sources:

   ```bash
   pnpm seed:sources
   ```

5. Start the dashboard:

   ```bash
   pnpm dev
   ```

The V1 admin dashboard has no login and uses the Supabase service role only in
server code. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client components.

## Collection

```bash
pnpm tsx scripts/fetch-producthunt.ts --limit 100 --days 90
pnpm tsx scripts/fetch-toolify.ts --limit 100
pnpm tsx scripts/fetch-futurepedia.ts --limit 100
pnpm tsx scripts/import-products-csv.ts --file data/sample-products.csv
```

Add `--dry-run` to validate collection and filtering without database writes.
Toolify may return a Cloudflare challenge; use the CSV importer instead of
adding brittle anti-bot automation.

## Enrichment

```bash
pnpm tsx scripts/enrich-product-patterns.ts --limit 20 --dry-run
pnpm tsx scripts/enrich-product-patterns.ts --limit 20
```

Use `--force` to create a new pattern record for products that were previously
analyzed.

## Opportunities

```bash
pnpm tsx scripts/generate-opportunities.ts --limit 10 --dry-run
pnpm tsx scripts/generate-opportunities.ts --limit 10
pnpm tsx scripts/export-opportunities-md.ts
```

The export is written to `exports/opportunities.md`.

## Verification

```bash
pnpm test
pnpm typecheck
pnpm lint
pnpm build
```
