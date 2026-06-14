create extension if not exists pgcrypto;

create table if not exists public.ranking_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_url text,
  source_type text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  domain text,
  website_url text,
  tagline text,
  description text,
  logo_url text,
  pricing_type text,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  product_scale text,
  is_blocked boolean not null default false,
  block_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_product_scale_check check (
    product_scale is null or product_scale in (
      'micro_tool',
      'single-purpose_site',
      'browser_extension',
      'template_tool',
      'small_saas',
      'platform',
      'enterprise_saas',
      'marketplace',
      'agency_service',
      'content_media',
      'generic_chatbot_platform'
    )
  )
);

create unique index if not exists products_domain_unique_idx
  on public.products (lower(domain))
  where domain is not null;

create index if not exists products_normalized_name_idx
  on public.products (lower(regexp_replace(name, '[^a-z0-9]+', '', 'g')));

create table if not exists public.product_rankings (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  source_name text not null,
  source_url text,
  list_name text,
  list_type text,
  category text,
  rank_position int,
  upvotes int,
  comments int,
  rating numeric,
  snapshot_date date not null default current_date,
  raw_data jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_rankings_product_id_idx
  on public.product_rankings(product_id);
create index if not exists product_rankings_source_snapshot_idx
  on public.product_rankings(source_name, snapshot_date);

create table if not exists public.product_patterns (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  input_type text,
  output_type text,
  target_user text,
  job_to_be_done text,
  product_format text,
  mvp_complexity text,
  cultural_dependency text,
  solo_founder_fit text,
  seo_potential text,
  standalone_potential text,
  reason_summary text,
  pass_reasons text[],
  tags text[],
  created_at timestamptz not null default now(),
  constraint product_patterns_mvp_complexity_check
    check (mvp_complexity is null or mvp_complexity in ('low', 'medium', 'high')),
  constraint product_patterns_cultural_dependency_check
    check (cultural_dependency is null or cultural_dependency in ('low', 'medium', 'high')),
  constraint product_patterns_solo_founder_fit_check
    check (solo_founder_fit is null or solo_founder_fit in ('good', 'maybe', 'bad')),
  constraint product_patterns_seo_potential_check
    check (seo_potential is null or seo_potential in ('high', 'medium', 'low')),
  constraint product_patterns_standalone_potential_check
    check (standalone_potential is null or standalone_potential in ('high', 'medium', 'low'))
);

create index if not exists product_patterns_product_id_idx
  on public.product_patterns(product_id);

create table if not exists public.review_labels (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  status text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint review_labels_status_check check (status in ('keep', 'watch', 'pass'))
);

create index if not exists review_labels_product_id_idx
  on public.review_labels(product_id);

create table if not exists public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  source_product_ids uuid[],
  main_keyword text,
  long_tail_keywords text[],
  competitor_urls text[],
  mvp_summary text,
  standalone_score int,
  founder_fit_score int,
  buildability_score int,
  verdict text,
  risk_summary text,
  created_at timestamptz not null default now(),
  constraint opportunities_standalone_score_check
    check (standalone_score is null or standalone_score between 0 and 100),
  constraint opportunities_founder_fit_score_check
    check (founder_fit_score is null or founder_fit_score between 0 and 100),
  constraint opportunities_buildability_score_check
    check (buildability_score is null or buildability_score between 0 and 100),
  constraint opportunities_verdict_check
    check (verdict is null or verdict in ('build', 'watch', 'pass'))
);

alter table public.ranking_sources enable row level security;
alter table public.products enable row level security;
alter table public.product_rankings enable row level security;
alter table public.product_patterns enable row level security;
alter table public.review_labels enable row level security;
alter table public.opportunities enable row level security;
