-- Raise the scrape_requests.max_pages upper bound from 50 to 100.
-- Original constraint was anonymous (auto-named by Postgres), so look it up
-- dynamically and drop it before adding the new one. Idempotent.

do $$
declare
  c record;
begin
  for c in
    select conname
    from pg_constraint
    where conrelid = 'public.scrape_requests'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) ilike '%max_pages%'
  loop
    execute format('alter table public.scrape_requests drop constraint %I', c.conname);
  end loop;
end $$;

alter table public.scrape_requests
  add constraint scrape_requests_max_pages_check
  check (max_pages > 0 and max_pages <= 100);
