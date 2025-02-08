
-- Create the world_conversations table if it doesn't exist
create table if not exists world_conversations (
  id uuid default gen_random_uuid() primary key,
  world_group_id uuid not null references world_groups(id) on delete cascade,
  agent_id uuid not null references agents(id) on delete cascade,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable row level security
alter table world_conversations enable row level security;

-- Create policy to allow all users to select conversations
create policy "Anyone can view conversations"
  on world_conversations for select
  to authenticated, anon
  using (true);

-- Create policy to allow all users to insert conversations
create policy "Anyone can insert conversations"
  on world_conversations for insert
  to authenticated, anon
  with check (true);
