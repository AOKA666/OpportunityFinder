alter table public.opportunities
  add column if not exists content_locale text not null default 'en';

alter table public.opportunities
  drop constraint if exists opportunities_content_locale_check;

alter table public.opportunities
  add constraint opportunities_content_locale_check
  check (content_locale in ('en', 'zh'));

create index if not exists opportunities_locale_created_at_idx
  on public.opportunities(content_locale, created_at desc);
