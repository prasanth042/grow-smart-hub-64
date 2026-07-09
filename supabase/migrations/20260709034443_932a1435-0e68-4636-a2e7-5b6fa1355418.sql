
CREATE TABLE public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  land_id uuid references public.lands(id) on delete set null,
  category text not null,
  amount numeric not null check (amount >= 0),
  note text,
  spent_on date not null default current_date,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.expenses TO authenticated;
GRANT ALL ON public.expenses TO service_role;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own expenses" ON public.expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.sales (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  land_id uuid references public.lands(id) on delete set null,
  crop text not null,
  quantity_kg numeric not null check (quantity_kg >= 0),
  price_per_kg numeric not null check (price_per_kg >= 0),
  total_amount numeric generated always as (quantity_kg * price_per_kg) stored,
  market text,
  sold_on date not null default current_date,
  created_at timestamptz not null default now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sales TO authenticated;
GRANT ALL ON public.sales TO service_role;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sales" ON public.sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
