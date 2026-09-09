-- Nullable user_id must not allow anonymous callers to create placeholder households.
revoke all on function public.create_household(text,text), public.join_household(text,text), public.leave_household() from public, anon;
grant execute on function public.create_household(text,text), public.join_household(text,text), public.leave_household() to authenticated;

create or replace function public.join_household(code text, my_name text) returns public.households
language sql security invoker set search_path = public as $$
  select public.join_household_with_member(code, my_name, null);
$$;

-- Preserve the existing default category set while adding an explicit session guard.
do $$
declare definition text;
begin
  definition := pg_get_functiondef('public.create_household(text,text)'::regprocedure);
  definition := replace(definition, E'begin\n', E'begin\n  if auth.uid() is null then raise exception ''not_authenticated''; end if;\n');
  execute definition;
end $$;
