# SCS V3 fixes

Run these two new migrations in the existing SCS Supabase project, in filename order:

1. `supabase/migrations/20261001220000_customer_names_and_reviews.sql`
2. `supabase/migrations/20261001221000_final_amount_confirmation.sql`

What they change:
- Repairs placeholder customer names such as `Customer` from the name stored in Supabase Auth metadata when available.
- Lets an assigned technician read the real customer profile used by their booking.
- Lets a technician read their own customer reviews.
- Adds `final_amount_confirmed` so a booking cannot expose final pricing merely because an old/default value exists.
- New bookings start with service fee, parts, discount, and total unset.
- The technician workflow sets `final_amount_confirmed` only when the technician saves final charges.
- The customer sees only the admin-managed service starting price before that confirmation.

No Firebase Auth or Firebase database is introduced.


### Required fix for customer names / booking RLS
Run `supabase/migrations/20261001222000_fix_customer_profile_rls.sql` after the earlier V3 migrations. It replaces the recursive technician customer-profile policy with a SECURITY DEFINER helper and repairs placeholder customer names from Auth metadata.
