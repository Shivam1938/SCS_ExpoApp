# Sunshine Computer Solution — Expo app

This repository contains the Sunshine Computer Solution mobile app built with React Native and Expo. The separate Next.js admin app is in [`SCS_Admin_Panel`](SCS_Admin_Panel/README.md).

## Run locally

From the repository root:

```powershell
npm install
npx expo start
```

Open the QR code in Expo Go, or start a native project with `npm run android` / `npm run ios` where the required native tooling is installed.

## Supabase setup

Create a root `.env.local` file with the public URL and anon key for the SCS Supabase project:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-public-anon-key
```

These are public client credentials; database access must remain protected by the existing Supabase RLS policies. Never put a service-role key in the Expo app or an `EXPO_PUBLIC_` variable. For EAS builds, configure the same public values in the EAS environment used by the build profile; do not commit a real key in `eas.json`.

## App and Supabase integration

- Supabase Auth supports email/password signup, sign-in, password reset, and sign-out. Sessions persist using AsyncStorage.
- The profile upsert sends only `profiles.id` and `profiles.full_name`. It uses the Auth UUID and omits `role`, so the database default assigns new users `customer`; an existing profile's role is not overwritten.
- Address, booking, and review inserts send the authenticated user's UUID in `user_id`.
- Services, addresses, bookings, profiles, reviews, and notifications are queried through `src/services/api.js`. Authenticated app state refreshes profile, booking, and notification data and listens for booking changes and new notifications.
- Alerts support mark-read and delete. Notifications do not contain a booking ID in the supplied schema, so an alert cannot deep-link to a booking.
- The payment screen currently creates a booking with a selected payment method. It is not a payment gateway or transaction ledger.

The app uses the supplied public schema. In particular, `profiles` has no email or push-token column; `notifications` has no booking ID; `profiles.role` is not client-assigned; and the integer `users.id` is not treated as the UUID profile identity.

### Current catalogue limitation

`api.getServices()` reads active services from Supabase, but the current browsing, service detail, booking, and payment screens still import catalogue/technician display data from `src/data/mock.js`. The admin panel manages real service records, but those screens have not yet been switched to the live service API. See [`progress.md`](progress.md) for the current integration status.

## Database defaults to verify

The client intentionally leaves role assignment to the `profiles.role` database default. Some inserts also omit database-generated values such as IDs/timestamps, and booking creation omits `status` and `payment_status`. The live project must have the appropriate defaults/triggers for these required columns; the client does not invent those values. If an insert fails, check the actual defaults, RLS policy, and database error before changing the client or schema.

## Useful files

- `src/services/supabase.js` — Expo Supabase client configuration.
- `src/services/api.js` — auth and database access methods.
- `src/context/AppContext.js` — current session data and realtime refresh behavior.
- `src/data/mock.js` — display data still used by catalogue and booking screens.
- `SCS_Admin_Panel/README.md` — Admin Panel setup, security, and feature guide.

## Checks

There are no root TypeScript or lint scripts configured. A Metro bundle/export check can be run with:

```powershell
npx expo export --platform ios
```

Expo app implementation notes and verification history are in [`progress.md`](progress.md).
