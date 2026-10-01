# SCS Final Setup — Mobile App

This ZIP contains the updated Expo customer + technician mobile app. The Admin Panel is intentionally not included/changed.

## 1. Install dependencies

```bash
npm install
```

No new npm package was added for this update.

## 2. Environment

Create `.env.local` in the project root (do not commit it):

```env
EXPO_PUBLIC_SUPABASE_URL=<your existing Supabase URL>
EXPO_PUBLIC_SUPABASE_KEY=<your existing public Supabase key>
```

The existing `eas.json` values are retained for EAS builds.

## 3. Supabase migration

Open Supabase Dashboard → SQL Editor → New query.

Run the complete contents of:

```text
supabase/migrations/20261001000000_technician_workflow.sql
```

This adds:
- technician role/profile setup
- technician booking access
- database-level concurrent booking claiming
- technician schedule conflict protection
- booking idempotency
- technician new-booking notifications
- final-amount/payment notifications
- push-token storage

Do not delete or modify the existing applied migration.

## 4. Home banner table

The mobile app reads `public.app_settings`. If this table was already created in the existing SCS Supabase project, no action is needed.

If it does not exist, run:

```sql
create table if not exists public.app_settings (
  id text primary key,
  home_banner_url text,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.app_settings enable row level security;

drop policy if exists "app_settings_admin_manage" on public.app_settings;
drop policy if exists "app_settings_authenticated_read" on public.app_settings;

create policy "app_settings_admin_manage"
on public.app_settings
for all
to authenticated
using (private.is_admin())
with check (private.is_admin());

create policy "app_settings_authenticated_read"
on public.app_settings
for select
to authenticated
using (true);

insert into public.app_settings (id)
values ('global')
on conflict (id) do nothing;
```

## 5. Run the app

For the existing development build:

```bash
npx expo start -c
```

Open the installed SCS development build.

No new native package was added, so a fresh development build is not required solely for these JavaScript changes.

## 6. Push notifications

The app now registers an Expo push token after login and stores it in `profiles.push_token`.

For EAS/production Android push delivery, the Expo/EAS project must have valid Android push credentials configured. If push-token registration reports an FCM/EAS credential error, configure the Android push credentials in the existing EAS project before testing remote notifications.

## 7. Important test order

Customer:
1. Signup as Customer.
2. Confirm email.
3. Login.
4. Create a booking.
5. Confirm there is no initial payment screen.
6. Verify booking starts at Finding technician.

Technician:
1. Signup as Technician.
2. Confirm email.
3. Login as Technician.
4. Verify new booking appears.
5. Have two technician devices press Accept at nearly the same time.
6. Only one technician must receive the booking.
7. Update On the way → In progress → Completed.
8. Enter final charges.
9. Mark payment received only after completion.

Customer again:
1. Verify technician assignment notification.
2. Verify status changes in Track Booking.
3. Verify final amount appears only after technician enters it.
4. Verify Payment Received appears after technician marks it.
5. Verify Completed state.
