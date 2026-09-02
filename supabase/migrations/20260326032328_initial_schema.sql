-- 1. Categories (no dependencies)
create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz default now()
);

-- 2. Profiles (extends Supabase Auth)
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select using (id = auth.uid());

create policy "Users can update own profile"
  on profiles for update using (id = auth.uid());

create policy "Users can insert own profile"
  on profiles for insert with check (id = auth.uid());

-- 3. Bank Connections (belongs to profiles)
create table bank_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  bank_name text not null,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  created_at timestamptz default now()
);

alter table bank_connections enable row level security;

create policy "Users can view own bank connections"
  on bank_connections for select using (user_id = auth.uid());

create policy "Users can insert own bank connections"
  on bank_connections for insert with check (user_id = auth.uid());

create policy "Users can delete own bank connections"
  on bank_connections for delete using (user_id = auth.uid());

-- 4. Transactions (belongs to bank_connections and categories)
create table transactions (
  id uuid primary key default gen_random_uuid(),
  bank_connection_id uuid not null references bank_connections(id) on delete cascade,
  category_id uuid references categories(id),
  amount integer not null,
  currency text not null default 'GBP',
  merchant_name text,
  transaction_at timestamptz not null,
  created_at timestamptz default now()
);

alter table transactions enable row level security;

create policy "Users can view own transactions"
  on transactions for select using (
    bank_connection_id in (
      select id from bank_connections where user_id = auth.uid()
    )
  );

create policy "Users can insert own transactions"
  on transactions for insert with check (
    bank_connection_id in (
      select id from bank_connections where user_id = auth.uid()
    )
  );

-- 5. Budgets (belongs to profiles and categories)
create table budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  category_id uuid not null references categories(id),
  amount integer not null,
  period text not null default 'monthly',
  created_at timestamptz default now()
);

alter table budgets enable row level security;

create policy "Users can view own budgets"
  on budgets for select using (user_id = auth.uid());

create policy "Users can insert own budgets"
  on budgets for insert with check (user_id = auth.uid());

create policy "Users can update own budgets"
  on budgets for update using (user_id = auth.uid());

create policy "Users can delete own budgets"
  on budgets for delete using (user_id = auth.uid());