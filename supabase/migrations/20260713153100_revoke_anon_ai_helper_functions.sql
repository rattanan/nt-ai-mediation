-- Supabase may maintain explicit default function grants for API roles. These
-- helpers are used by authenticated RLS policies and must never be callable by
-- the anonymous Data API role.
revoke execute on function public.can_access_case(uuid) from anon;
revoke execute on function public.can_staff_case(uuid) from anon;
revoke execute on function public.can_access_appointment(uuid) from anon;
revoke execute on function public.can_staff_appointment(uuid) from anon;

revoke execute on function public.can_access_case(uuid) from public;
revoke execute on function public.can_staff_case(uuid) from public;
revoke execute on function public.can_access_appointment(uuid) from public;
revoke execute on function public.can_staff_appointment(uuid) from public;

grant execute on function public.can_access_case(uuid) to authenticated;
grant execute on function public.can_staff_case(uuid) to authenticated;
grant execute on function public.can_access_appointment(uuid) to authenticated;
grant execute on function public.can_staff_appointment(uuid) to authenticated;
