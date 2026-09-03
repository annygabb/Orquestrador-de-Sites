begin;

alter policy "Admin can read own membership"
  on public.admins
  using (user_id = (select auth.uid()));

alter policy "Public can read published projects"
  on public.projects
  using (
    published = true
    or exists (
      select 1 from public.admins a
      where a.user_id = (select auth.uid())
    )
  );

alter policy "Admins can insert projects"
  on public.projects
  with check (
    exists (
      select 1 from public.admins a
      where a.user_id = (select auth.uid())
    )
  );

alter policy "Admins can update projects"
  on public.projects
  using (
    exists (
      select 1 from public.admins a
      where a.user_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.admins a
      where a.user_id = (select auth.uid())
    )
  );

alter policy "Admins can delete projects"
  on public.projects
  using (
    exists (
      select 1 from public.admins a
      where a.user_id = (select auth.uid())
    )
  );

commit;
