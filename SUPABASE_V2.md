# SCS V2 setup

## 1. Supabase SQL

Run the SQL from `supabase/migrations/20261001210000_technician_reviews_read.sql` in the existing SCS Supabase SQL Editor.

This adds read access for a signed-in technician to reviews belonging to that technician only.

The rating/jobs/review-count workflow already exists in the earlier technician statistics migration. The additional rating migration in this package also makes an admin-entered rating work when a technician row is created with a rating.

## 2. Supabase Auth redirect URL

In Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, add:

`fixora://email-change`

Keep the existing SCS redirect URLs such as:

`fixora://auth-callback`

`fixora://reset-password`

The email-change flow sends the confirmation link to the new email. After confirmation, the SCS app opens the login screen with the new email prefilled. The user's existing password remains the password used for login.

## 3. Important

Do not change the existing Supabase Auth provider setup or add Firebase Auth. SCS continues to use Supabase Auth, PostgreSQL, Storage and Realtime.
