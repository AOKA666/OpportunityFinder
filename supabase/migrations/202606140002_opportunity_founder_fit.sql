alter table public.opportunities
  add column if not exists founder_fit_summary text;
