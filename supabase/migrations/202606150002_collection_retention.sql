delete from public.product_rankings
where id in (
  select id
  from (
    select
      id,
      row_number() over (
        partition by product_id, source_name, source_url, snapshot_date
        order by created_at desc, id desc
      ) as duplicate_number
    from public.product_rankings
  ) ranked
  where duplicate_number > 1
);

create unique index if not exists product_rankings_daily_source_unique_idx
  on public.product_rankings (
    product_id,
    source_name,
    source_url,
    snapshot_date
  ) nulls not distinct;

create index if not exists products_last_seen_at_idx
  on public.products(last_seen_at desc);
