AGENT.md — Sunshine Computer Solution (SCS) App Development Instructions

Project identity

The app name is Sunshine Computer Solution. Use Sunshine Computer Solution in user-facing text, documentation, prompts, headings, and feature descriptions.

Do not use the old app name "Fixora" anywhere in new or updated code/content.

Short brand name where appropriate: SCS.

Role and response style

Act as a patient coding agent for a non-technical developer.

Explain in simple Hindi-English (Hinglish).

Give exact, numbered steps.

Do not assume the user knows where a Supabase/Expo setting is.

When dashboard changes are needed, say exactly what to click and what to paste.

Give complete updated files, not partial snippets, unless the user explicitly asks otherwise.

Give exact npm / Expo install commands when packages are needed.

Avoid unnecessary theory.

Work carefully so the code is ready to paste.

Never invent files, functions, columns, policies, or existing behavior.

If an existing file is needed but its current contents are not available, ask for that file before rewriting it.

Development workflow

Implement ONE feature at a time.

The current feature order is:

Booking date/time:

Replace fixed date chips with a real date picker.

Replace fixed time chips with a real time picker.

Use @react-native-community/datetimepicker.

Allow any future date and any time.

Allow selecting from saved addresses.

Send scheduled_date as YYYY-MM-DD.

Send scheduled_time as a display string such as 2:30 PM.

Update PaymentScreen.js and all api.createBooking() call sites consistently.

Technician assignment:

Admin manually assigns technician_id in Supabase Table Editor.

Admin changes booking status to technician_assigned.

Existing DB trigger handles notification creation.

Alert tap must open TechnicianProfileScreen with full technician data.

Call: Linking.openURL('tel:' + phone).

Chat placeholder: Linking.openURL('sms:' + phone).

TrackBookingScreen technician card must open TechnicianProfileScreen.

Alerts:

Add per-notification delete/swipe-to-delete.

Use api.deleteNotification().

Verify Expo notifications/device setup.

Verify Expo config/plugin.

Verify expo.extra.eas.projectId is configured where required.

Push registration is already wired in AppContext.js; do not rebuild it unnecessarily.

Home/navigation/dead buttons:

Verify Home top-right profile icon opens Profile tab.

Verify Home location opens AddressesScreen or location picker.

Check Home/Bookings/Alerts/Profile for dead buttons.

Do not replace working navigation unnecessarily.

Backend boundary:

ALL backend calls go through src/services/api.js.

Never call Supabase directly from screen components.

Keep screen components free of direct supabase calls.

After completing one feature, STOP and wait for the user to say next.

Tech stack

React Native + Expo

Do NOT use Expo Router.

Navigation:

@react-navigation/native-stack

@react-navigation/bottom-tabs

Supabase:

Auth: email + password

Postgres

Storage

Realtime

Icons: @expo/vector-icons / Ionicons

Date/time picker: @react-native-community/datetimepicker

Existing folder structure

src/
  theme.js
  components/ui.js
  data/mock.js
  services/supabase.js
  services/api.js
  context/AppContext.js
  navigation/RootNavigator.js
  navigation/MainTabs.js
  screens/*.js

Existing backend/schema

Supabase tables:

profiles

id

full_name

phone

email

city

role

avatar_url

push_token

services

id

name

description

icon

price

rating

bookings_count

tint

color

active

sort

image_url

technicians

id

profile_id

name

role_title

about

rating

reviews_count

jobs_completed

years_experience

on_time_percent

skills[]

verified

avatar_url

phone

addresses

id

user_id

label

line

city

is_default

bookings

id

code

user_id

service_id

technician_id

scheduled_date

scheduled_time

address_line

notes

photos[]

status

payment_method

payment_status

service_fee

parts_estimate

discount

total

created_at

reviews

id

booking_id

user_id

technician_id

rating

comment

tags[]

created_at

notifications

id

user_id

title

body

icon

unread

booking_id

created_at

RLS is enabled. Users should only access their own rows according to the existing policies.

Booking statuses:

finding_technician
technician_assigned
on_the_way
in_progress
completed
cancelled

Existing DB trigger behavior:

Booking code is auto-generated as FXR-DDMMYY-0001.

A notification row is auto-created when a booking is inserted or its status changes.

pg_net + trigger calls the Expo push API using profiles.push_token.

Client only needs to register the Expo push token.

Storage buckets:

avatars

public read

users can write only their own {userId}/avatar.jpg

app-assets

public read

admin-only writes

service/technician images are uploaded manually from Supabase Storage dashboard for now

IMPORTANT: Do not change existing DB triggers/schema/policies unless the requested feature actually requires it.

Existing API layer

src/services/api.js already contains:

signUp(email,password,name)
signIn(email,password)
resetPassword(email)
signOut()
getSession()
getProfile()
updateProfile(fields)
savePushToken(token)
pickAndUploadAvatar()
getServices()
getAddresses()
addAddress()
deleteAddress()
setDefaultAddress(id, city)
createBooking()
getBookings()
getBooking(code)
cancelBooking(dbId)
subscribeBooking(dbId, cb)
getAlerts()
markAllRead()
deleteNotification(id)
getBookingById(dbId)
submitReview()

Do not bypass this API layer.

Existing screens/features

Already built:

LoginScreen.js

SignupScreen.js

EditProfileScreen.js

AddressesScreen.js

AddAddressScreen.js

AboutScreen.js

HelpScreen.js

ProfileScreen.js

Google login and phone OTP were intentionally removed.

Do NOT re-add:

Google login

phone OTP

Firebase Auth

Twilio

Push token registration is already handled by AppContext.js using:

expo-notifications

expo-device

AppContext.js also refreshes bookings/alerts/addresses through realtime changes.

Navigation naming rule

AddAddressScreen.js is the canonical address screen.

If RootNavigator.js references AddEditAddressScreen, reconcile it to AddAddressScreen.js.

If LocationScreen does not exist:

either create a simple location screen when genuinely needed,

or point the navigation target to AddressesScreen.

Do not create duplicate address screens.

Brand naming

Use:

Sunshine Computer Solution

SCS

Do not use:

Fixora

Exception: existing database-generated booking codes currently use the FXR-... prefix. Do not silently change database triggers/schema while implementing unrelated app features. If the booking-code prefix needs to become SCS-..., treat that as a separate explicit feature requiring a DB migration/trigger update.

Supabase instructions

When a feature requires Supabase Dashboard:

Name the exact dashboard area.

Give exact clicks.

Say exactly what SQL to paste, if SQL is required.

Clearly say whether to press Run/Save.

Do not ask the user to modify unrelated settings.

Never expose or request service-role keys in frontend code.

Never put secrets in EXPO_PUBLIC_* variables.

Frontend Supabase client must use the intended public/anon key only.

Environment variables

Existing public client variables:

EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_KEY

Do not rename them unless there is a real reason and all references are updated.

Code quality rules

Keep existing architecture.

Prefer small, safe changes.

Reuse existing UI components from src/components/ui.js.

Reuse existing theme from src/theme.js.

Reuse existing API functions.

Keep navigation consistent with RootNavigator.js and MainTabs.js.

Use Pressable / existing Press component for interactive elements.

Ensure every user-facing button has a working onPress.

Handle loading, empty, and error states.

Avoid breaking existing functionality.

Avoid unnecessary dependencies.

When a dependency is required, prefer:

npx expo install <package>

rather than manually choosing a potentially incompatible version.

Booking date/time requirements

For the booking flow:

Date must be a real future date.

Time must be user selectable.

Use @react-native-community/datetimepicker.

Date sent to Supabase:

YYYY-MM-DD

Time sent to Supabase:

2:30 PM

Saved addresses must be loaded from api.getAddresses().

User must be able to select one.

Avoid hardcoded address values.

Preserve existing booking totals/payment logic unless the feature requires changes.

Technician requirements

When technician assignment is manually done in Supabase:

technician_id = selected technician UUID
status = technician_assigned

The existing DB trigger should create the notification.

When an alert relates to a booking with a technician:

fetch the booking through api.getBookingById() or existing API functions

fetch/use the technician's complete data through the API layer

navigate to TechnicianProfileScreen

Technician profile:

Call button uses tel:

Chat placeholder uses sms:

Do not implement a real chat backend unless explicitly requested.

Alerts requirements

Notification delete:

Use api.deleteNotification(id).

Provide a visible delete action or swipe-to-delete.

Do not directly delete from Supabase in the screen.

Push:

Keep existing AppContext.js registration.

Check app.json/Expo config for notifications plugin.

Check EAS projectId configuration when required.

Do not add unnecessary server code.

Response format for each feature

For each requested feature:

1. What we are changing

Explain in 2–5 simple Hinglish bullets.

2. Install command

Only if needed:

npx expo install <exact-package>

3. Files to change

List exact paths.

4. Full code

Provide complete contents for every file that needs replacement.

5. Supabase Dashboard steps

Only if needed.

Use numbered steps with exact UI navigation.

6. Run/check steps

Give simple commands and what the user should expect.

7. STOP

Do not start the next feature.

Wait for the user to say next.

Important instruction about testing

The user may not be able to run/test the app live while working with the agent.

Therefore:

Be conservative.

Check imports and function names carefully.

Keep code internally consistent.

Make all related call sites consistent when changing a function signature.

Do not say "it definitely works" unless it has actually been tested.

If something depends on an existing file's exact implementation, request that file rather than guessing.

First task

When starting from this instruction file, work only on:

Feature 1 — Booking date/time + saved address selection.

Do not proceed to technician assignment, alerts, home verification, or other features until the user says next.