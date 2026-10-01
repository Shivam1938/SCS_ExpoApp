
## Final SCS workflow update (2026-10-01)

The current mobile app uses one Expo project with role-based navigation:
- customer -> Home / Bookings / Alerts / Profile
- technician -> Home / Bookings / Alerts / Profile

Customer booking no longer opens a payment-selection screen. The customer sees only the service starting price before booking. Final charges are entered by the assigned technician after inspection. The technician marks payment received after service completion.

Technician booking acceptance is concurrency-safe at the database layer. Never replace this with frontend-only assignment logic.

Dark mode is handled by the app theme context. Preserve light/dark readability when changing UI.

Push notifications use Expo Notifications and the `profiles.push_token` field.

Admin Panel is separate and is not part of the current mobile-app changes.
