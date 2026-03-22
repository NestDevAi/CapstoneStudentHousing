-- Create the documents table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  role text not null check (role in ('student', 'landlord')),
  file_name text not null,
  file_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on documents table
alter table public.documents enable row level security;

-- Policies for documents table
create policy "Users can insert their own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can view their own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Admins can view all documents"
  on public.documents for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update all documents"
  on public.documents for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Storage bucket creation (Note: This is usually done via the dashboard or a separate script, 
-- but we'll include the policies here assuming the bucket 'documents' is created)

-- Policies for storage.objects (assuming bucket 'documents' exists)
-- 1. Users can upload to their own folder
create policy "Users can upload documents to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Users can view their own documents
create policy "Users can view their own documents in storage"
  on storage.objects for select
  using (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Admins can view all documents in storage
create policy "Admins can view all documents in storage"
  on storage.objects for select
  using (
    bucket_id = 'documents' AND
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
