# PRD: AI Product Ranking Database MVP

## 0. Project Goal

Build an internal MVP called **AI Product Ranking Database**.

The purpose is to collect niche products from product ranking/listing sites such as Product Hunt, Toolify, and Futurepedia, filter out large platforms and unsuitable products, store them in Supabase, enrich each product with AI-generated product pattern tags, and provide an admin dashboard to review products and generate product opportunity directions for solo developers.

This is not a generic AI idea generator.

The core goal is:

> Use real product ranking data to discover adjacent SEO product opportunities suitable for solo developers.

The final system should help me find niche product directions similar to the research process I previously did manually.

---

## 1. Tech Stack

Use:

* Next.js
* TypeScript
* Tailwind CSS
* Supabase
* pnpm
* OpenAI API for AI labeling and opportunity generation

Use scripts in TypeScript.

Expected project structure:

```txt
/app
  /admin
    /products
    /products/[id]
    /opportunities

/lib
  /supabase
  /types
  /scrapers
  /normalizers
  /filters
  /ai

/scripts
  seed-ranking-sources.ts
  fetch-producthunt.ts
  fetch-toolify.ts
  fetch-futurepedia.ts
  import-products-csv.ts
  enrich-product-patterns.ts
  generate-opportunities.ts
  export-opportunities-md.ts

/data
  blocked_domains.json
  sample-products.csv

/logs
```

---

## 2. Development Rules

Please complete this project in phases, in this exact order:

1. Database schema and project foundation
2. Product Hunt fetcher
3. Toolify + Futurepedia fetchers and CSV fallback importer
4. AI product pattern extraction
5. Admin dashboard and opportunity generation

Do not skip phases.

Do not build user login, payment, public user pages, SERP/KD/Google Trends integration in this version.

This MVP is only for:

* collecting product ranking data
* storing product data
* filtering unsuitable products
* AI labeling
* manual review
* generating opportunity cards

---

## 3. Environment Variables

Create `.env.example` with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
PRODUCT_HUNT_TOKEN=
```

Use `SUPABASE_SERVICE_ROLE_KEY` only in server-side scripts.

---

## 4. Supabase Database Schema

Create Supabase migration files for these tables.

### 4.1 ranking_sources

Fields:

* id uuid primary key default gen_random_uuid()
* name text not null
* base_url text
* source_type text not null
* is_active boolean default true
* created_at timestamptz default now()

Seed these sources:

* Product Hunt
* Toolify
* Futurepedia

---

### 4.2 products

Fields:

* id uuid primary key default gen_random_uuid()
* name text not null
* domain text
* website_url text
* tagline text
* description text
* logo_url text
* pricing_type text
* first_seen_at timestamptz default now()
* last_seen_at timestamptz default now()
* product_scale text
* is_blocked boolean default false
* block_reason text
* created_at timestamptz default now()
* updated_at timestamptz default now()

---

### 4.3 product_rankings

Fields:

* id uuid primary key default gen_random_uuid()
* product_id uuid references products(id) on delete cascade
* source_name text not null
* source_url text
* list_name text
* list_type text
* category text
* rank_position int
* upvotes int
* comments int
* rating numeric
* snapshot_date date default current_date
* raw_data jsonb
* created_at timestamptz default now()

Important:

A product may appear in multiple sources or lists. Do not duplicate products. Insert additional product_rankings records instead.

---

### 4.4 product_patterns

Fields:

* id uuid primary key default gen_random_uuid()
* product_id uuid references products(id) on delete cascade
* input_type text
* output_type text
* target_user text
* job_to_be_done text
* product_format text
* mvp_complexity text
* cultural_dependency text
* solo_founder_fit text
* seo_potential text
* standalone_potential text
* reason_summary text
* pass_reasons text[]
* tags text[]
* created_at timestamptz default now()

Allowed values:

mvp_complexity:

* low
* medium
* high

cultural_dependency:

* low
* medium
* high

solo_founder_fit:

* good
* maybe
* bad

seo_potential:

* high
* medium
* low

standalone_potential:

* high
* medium
* low

---

### 4.5 review_labels

Fields:

* id uuid primary key default gen_random_uuid()
* product_id uuid references products(id) on delete cascade
* status text not null
* note text
* created_at timestamptz default now()

Allowed status:

* keep
* watch
* pass

---

### 4.6 opportunities

Fields:

* id uuid primary key default gen_random_uuid()
* title text not null
* description text
* source_product_ids uuid[]
* main_keyword text
* long_tail_keywords text[]
* competitor_urls text[]
* mvp_summary text
* standalone_score int
* founder_fit_score int
* buildability_score int
* verdict text
* risk_summary text
* created_at timestamptz default now()

Allowed verdict:

* build
* watch
* pass

---

## 5. TypeScript Types and Supabase Client

Create:

```txt
/lib/supabase/server.ts
/lib/types/database.ts
/lib/types/product.ts
```

Requirements:

* Add typed interfaces for products, rankings, product patterns, review labels, and opportunities.
* Add reusable Supabase service client for scripts.
* Do not expose service role key to client components.

---

## 6. Blocked Domains

Create:

```txt
/data/blocked_domains.json
```

Initial blocked domains:

```json
[
  "openai.com",
  "chatgpt.com",
  "google.com",
  "microsoft.com",
  "adobe.com",
  "canva.com",
  "notion.so",
  "figma.com",
  "zapier.com",
  "hubspot.com",
  "salesforce.com",
  "shopify.com",
  "wix.com",
  "squarespace.com",
  "grammarly.com",
  "jasper.ai",
  "copy.ai",
  "writesonic.com",
  "midjourney.com",
  "runwayml.com",
  "synthesia.io",
  "descript.com",
  "semrush.com",
  "ahrefs.com"
]
```

These are not bad products, but they are not useful as niche small-site samples for this MVP.

---

## 7. Product Scale Classification

Every imported product should receive a preliminary `product_scale`.

Allowed values:

* micro_tool
* single-purpose_site
* browser_extension
* template_tool
* small_saas
* platform
* enterprise_saas
* marketplace
* agency_service
* content_media
* generic_chatbot_platform

Only insert or keep products with:

* micro_tool
* single-purpose_site
* browser_extension
* template_tool
* small_saas

Filter out:

* platform
* enterprise_saas
* marketplace
* agency_service
* content_media
* generic_chatbot_platform

---

## 8. Global Filtering Rules

The system should aggressively filter products that are not suitable for solo developers.

Filter out:

* big platforms
* enterprise SaaS
* marketplaces
* agency services
* content media
* ecommerce
* affiliate products
* overseas creator/media tools
* career/job/interview tools
* education/exam tools
* legal/tax/medical products
* CRM/HR/sales platforms
* generic chatbot platforms
* tools requiring complex B2B sales
* tools requiring strong US/local culture knowledge
* tools that are merely big-site inner-page button utilities
* tools where the user searches once, gets a small answer, and leaves
* tools that cannot produce a meaningful report/result page

Prefer products with:

* clear input-output flow
* single task focus
* upload/input → AI analysis → personalized report
* URL/screenshot → AI diagnosis → repair suggestions
* text/screenshot → structured output
* suitable for SEO acquisition
* possible MVP in 7–14 days
* can be built by a solo developer
* can become a standalone niche website

---

## 9. Phase 1: Database Foundation

Implement:

```txt
scripts/seed-ranking-sources.ts
```

It should insert:

* Product Hunt
* Toolify
* Futurepedia

Acceptance criteria:

* Supabase migration works
* seed script works
* TypeScript passes
* pnpm lint passes

---

## 10. Phase 2: Product Hunt Fetcher

Create:

```txt
scripts/fetch-producthunt.ts
```

Use Product Hunt API if available through `PRODUCT_HUNT_TOKEN`.

Arguments:

* `--limit`
* `--dry-run`
* `--days`

Default:

* limit: 100
* days: 90

Fetch recent products related to:

* AI
* Developer Tools
* Productivity
* Design Tools
* No-Code

For Marketing, only keep clear small tools. Do not keep agencies, enterprise platforms, or generic marketing suites.

Fields to save:

* name
* website_url
* domain
* tagline
* description
* source_name = Product Hunt
* source_url
* list_name
* list_type
* category
* rank_position
* upvotes
* comments
* snapshot_date
* raw_data

Rules:

* Deduplicate by domain first.
* Deduplicate by similar name second.
* If product exists, only insert a new product_rankings record.
* Use blocked_domains.json.
* Use product_scale filtering.
* Do not insert blocked or unsuitable products.

Output stats:

* fetched
* inserted_products
* inserted_rankings
* skipped_blocked
* skipped_duplicate
* skipped_not_indie_fit
* errors

Errors:

* Do not stop the whole script if one product fails.
* Write product-level errors to:

```txt
logs/producthunt-errors.jsonl
```

Acceptance:

```bash
pnpm tsx scripts/fetch-producthunt.ts --limit 20 --dry-run
pnpm tsx scripts/fetch-producthunt.ts --limit 20
```

Both should run.

---

## 11. Phase 3: Toolify + Futurepedia Fetchers and CSV Importer

Create:

```txt
scripts/fetch-toolify.ts
scripts/fetch-futurepedia.ts
scripts/import-products-csv.ts
```

All scripts support:

* `--limit`
* `--dry-run`

CSV importer also supports:

* `--file`

CSV columns:

```csv
source_name,name,website_url,tagline,description,category,tags,rank_position,source_url
```

Create:

```txt
/data/sample-products.csv
```

with 3–5 sample rows for testing.

### 11.1 Toolify Scope

Only collect these categories:

* Image Analysis
* Image Generation & Editing
* Art & Creative Design
* Coding & Development
* Productivity
* Daily Life
* Design
* Website tools
* SEO tools
* Developer tools

Do not collect:

* Legal
* Finance
* Education
* Jobs
* Ecommerce
* Social Media
* Marketing agency
* CRM
* HR
* Medical
* Crypto
* Enterprise sales
* Customer support platform

### 11.2 Futurepedia Scope

Only collect:

* AI Image Tools
* AI Productivity Tools
* Automation Tools
* Developer/coding tools
* Design tools
* AI Text Generators only if related to prompt, structuring, summarization, or document transformation

Do not collect:

* Marketing
* Email Assistant
* Video platform
* Business finance
* Social media
* Education
* Legal
* HR
* Sales
* Ecommerce
* Affiliate

### 11.3 Fallback Rule

If Toolify or Futurepedia page structure is unstable, blocked, or difficult to scrape, do not over-engineer the scraper.

CSV import must work reliably and should use the same normalization, deduplication, blocked domain filtering, and indie fit filtering.

Error logs:

```txt
logs/toolify-errors.jsonl
logs/futurepedia-errors.jsonl
logs/import-errors.jsonl
```

Acceptance:

```bash
pnpm tsx scripts/import-products-csv.ts --file data/sample-products.csv --dry-run
pnpm tsx scripts/import-products-csv.ts --file data/sample-products.csv
```

Both should run.

---

## 12. Shared Normalization and Filtering

Create reusable modules:

```txt
/lib/normalizers/normalize-product.ts
/lib/filters/blocked-domains.ts
/lib/filters/indie-fit-filter.ts
/lib/filters/product-scale.ts
```

The three fetchers and CSV importer must use the same normalization and filtering logic.

Normalization should:

* clean URLs
* extract domain
* normalize trailing slash
* normalize product name
* normalize empty strings to null
* parse tags
* preserve raw_data

Filtering should:

* check blocked domains
* check product scale
* check forbidden categories
* check unsuitable keywords in tagline/description/category
* return both decision and reason

---

## 13. Phase 4: AI Product Pattern Extraction

Create:

```txt
lib/ai/extract-product-pattern.ts
scripts/enrich-product-patterns.ts
```

Arguments:

* `--limit`
* `--dry-run`
* `--force`

Input fields from products:

* name
* domain
* website_url
* tagline
* description
* product_scale
* category if available through ranking

The AI output must be strict JSON:

```json
{
  "input_type": "",
  "output_type": "",
  "target_user": "",
  "job_to_be_done": "",
  "product_format": "",
  "mvp_complexity": "low|medium|high",
  "cultural_dependency": "low|medium|high",
  "solo_founder_fit": "good|maybe|bad",
  "seo_potential": "high|medium|low",
  "standalone_potential": "high|medium|low",
  "reason_summary": "",
  "pass_reasons": [],
  "tags": []
}
```

Prompt rules:

You are not judging whether the product itself is successful.

You are judging whether this product is useful as inspiration for discovering adjacent SEO-driven niche tools suitable for a solo developer.

Mark as good/maybe if:

* input-output flow is clear
* single task is clear
* upload/input → AI analysis → personalized report
* URL/screenshot → AI diagnosis → repair suggestions
* text/screenshot → structured output
* does not require complex B2B sales
* does not require large proprietary dataset
* does not rely on heavy human service
* does not depend on US local culture
* MVP can be built in 7–14 days
* SEO acquisition is plausible

Mark as bad if:

* ecommerce
* affiliate
* overseas creator/media tools
* US local culture-heavy
* career/job/interview
* education/exam
* legal/tax/medical
* enterprise sales/CRM/HR
* generic chatbot/platform
* agency service
* content media
* marketplace
* big-site inner-page-only tool
* one-time tiny utility with no meaningful report/result page

Important:

Do not mark popular products as good just because they are popular.

Do not mark ChatGPT, Canva, Adobe, Notion, Figma, or similar platforms as good.

Do not mark PDF page checker, SVG viewBox helper, HTTP header parser, favicon snippet generator, or similar big-toolbox button utilities as high standalone potential.

Errors:

* JSON parse failures go to:

```txt
logs/ai-pattern-errors.jsonl
```

Output stats:

* analyzed
* inserted
* good
* maybe
* bad
* errors

Acceptance:

```bash
pnpm tsx scripts/enrich-product-patterns.ts --limit 20 --dry-run
pnpm tsx scripts/enrich-product-patterns.ts --limit 20
```

Both should run.

---

## 14. Phase 5: Admin Dashboard

Create admin pages.

No login required in V1.

### 14.1 /admin/products

Display product list.

Columns:

* name
* domain
* tagline
* source
* category
* product_scale
* solo_founder_fit
* seo_potential
* standalone_potential
* review status
* actions

Actions:

* Keep
* Watch
* Pass

Filters:

* source
* category
* product_scale
* solo_founder_fit
* seo_potential
* standalone_potential
* review status

### 14.2 /admin/products/[id]

Display product details:

* name
* website_url
* domain
* tagline
* description
* product_scale
* product_rankings records
* product_patterns AI labels
* raw_data
* review note
* Keep / Watch / Pass action

### 14.3 /admin/opportunities

Display opportunity cards:

* title
* description
* inspired_by products
* main_keyword
* long_tail_keywords
* competitor_urls
* mvp_summary
* standalone_score
* founder_fit_score
* buildability_score
* verdict
* risk_summary

---

## 15. Phase 6: Opportunity Generation

Create:

```txt
scripts/generate-opportunities.ts
scripts/export-opportunities-md.ts
```

`generate-opportunities.ts` arguments:

* `--limit`
* `--dry-run`

Source products:

Only generate opportunities from:

* review status = keep
* or solo_founder_fit = good
* or solo_founder_fit = maybe and standalone_potential != low

Generation logic:

Do not randomly brainstorm from single products.

Cluster product patterns first.

Prioritize these patterns:

* upload image → AI analysis → personalized advice
* URL/screenshot → AI diagnosis → repair suggestions
* text/screenshot → structured output
* developer micro tools that can be standalone sites
* website/SEO/indie developer decision tools
* product research tools for solo founders

Each opportunity must include:

* title
* description
* inspired_by products
* main_keyword
* long_tail_keywords
* competitor_urls
* mvp_summary
* why suitable for solo founder
* risks
* standalone_score: 0–100
* founder_fit_score: 0–100
* buildability_score: 0–100
* verdict: build / watch / pass

Strictly forbidden opportunity types:

* PDF small utilities
* career/interview/job tools
* exam/study/homeschool tools
* ecommerce
* affiliate
* overseas creator/media tools
* legal/tax/medical
* generic chatbot
* generic AI writer
* big-site toolbox inner-page button utilities
* enterprise SaaS requiring complex sales
* tools with one tiny answer and no meaningful result/report page

Save generated opportunities to the opportunities table.

`export-opportunities-md.ts` should export opportunities into a Markdown file:

```txt
exports/opportunities.md
```

Acceptance:

```bash
pnpm tsx scripts/generate-opportunities.ts --limit 10 --dry-run
pnpm tsx scripts/generate-opportunities.ts --limit 10
pnpm tsx scripts/export-opportunities-md.ts
```

All should run.

---

## 16. Final Acceptance Criteria

The final project should satisfy:

1. `pnpm lint` passes.
2. Supabase migrations are available.
3. `scripts/seed-ranking-sources.ts` works.
4. Product Hunt fetcher works or fails gracefully with clear error.
5. Toolify and Futurepedia fetchers work or fail gracefully with clear error.
6. CSV import works reliably.
7. At least 500 products can be imported or fetched through a mix of fetchers and CSV import.
8. Large platforms are filtered.
9. Unsuitable products are filtered.
10. Products are deduplicated by domain.
11. product_rankings preserve source/list information.
12. AI product pattern extraction works.
13. `/admin/products` works.
14. `/admin/products/[id]` works.
15. Keep / Watch / Pass review works.
16. `scripts/generate-opportunities.ts` generates 5–10 opportunity cards.
17. `/admin/opportunities` displays opportunity cards.
18. `scripts/export-opportunities-md.ts` exports Markdown.
19. No user login, payment, SERP/KD/Trends in this V1.
20. The codebase should be clean, modular, and easy to extend later.

---

## 17. Important Product Judgment

This project is not about collecting as many AI products as possible.

It is about collecting useful niche product signals.

The final opportunity generation should avoid fake ideas.

Do not generate ideas merely because keywords can be combined.

Every generated opportunity should be traceable to real products from ranking/listing sources and should explain why the direction may be suitable for a solo developer.

The most important distinction:

> A tool that exists as a small button inside a big toolbox is not necessarily a good standalone website opportunity.

The system should explicitly filter these weak pseudo-opportunities.
