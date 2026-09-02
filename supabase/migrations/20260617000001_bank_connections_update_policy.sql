create policy "Users can update own bank connections"
  on bank_connections for update using (user_id = auth.uid());
