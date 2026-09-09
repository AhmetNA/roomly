-- UPDATE/UPSERT also needs SELECT visibility. Never expose other users' tokens.
create policy "select own push token" on public.push_tokens
for select to authenticated
using ((select auth.uid()) = user_id);
