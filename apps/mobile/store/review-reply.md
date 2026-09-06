# Reply to App Review — Guideline 2.1, Information Needed

Rejection date: 4 September 2026 · Submission `1ac356a9-fea4-4626-a62e-08908d9bfc19`

This is **not** a defect report. It is the standard information request Apple sends
to a developer account with limited review history. Nothing in the app was found
to be broken — they want documentation plus a screen recording.

Paste the block below into **Reply to App Review**, and the same text into
**App Review Information → Notes** (Apple explicitly asks for both).

---

```
Thank you for the review. Answers to each item below.

1. SCREEN RECORDING
A screen recording captured on a physical iPhone is attached. It begins at app
launch and covers: registration of a new salon, sign-in by phone + SMS code,
the main dashboard, taking a booking, billing a client in POS, and finally
account deletion from Profile > Delete account.

2. PURPOSE AND TARGET AUDIENCE
GlamEdge Owner is a business management tool for salon and spa owners in Sri
Lanka. The audience is the salon owner or manager, not the general public.

The problem it solves: small salons in Sri Lanka run on paper diaries and
WhatsApp messages. Owners lose track of bookings, cannot tell what a day
actually earned, and calculate staff commission by hand. GlamEdge Owner puts
the appointment book, point-of-sale billing, cash drawer, staff commission and
customer history in one app the owner already carries.

Value provided: the owner sees today's takings and net profit on opening the
app, confirms or reschedules a booking in one tap, bills a client at the chair,
and gets commission per stylist calculated automatically.

3. SETTING UP AND ACCESSING THE MAIN FEATURES

Sign-in is by mobile number and a 6-digit SMS code. Our SMS provider only
delivers to Sri Lankan numbers, so a demo account is provisioned that bypasses
SMS entirely:

  Phone number: +94770000000
  Verification code: 424242

Steps: enter +94770000000 on the "Welcome back" screen exactly as written,
including the + and country code. Tap "Send code". No SMS will arrive and none
is needed. Enter 424242 on the next screen. This lands on the dashboard of a
pre-approved demo salon populated with sample bookings, staff, services and
takings.

There is one account type only: the salon owner. There are no other roles or
tiers to test.

Main features, and where to find them:
- Overview - today's income, expenses, net profit, cash drawer entry
- Bookings - list and calendar views; confirm, reschedule or cancel
- POS Billing - add a walk-in or bill an existing appointment
- Analytics / Reports - revenue trends, staff commission, cancellations
- Customers, Reviews, Services, Staff - via the drawer menu (top-left)
- Profile - salon details, business hours, QR code, and Delete account

4. EXTERNAL SERVICES USED FOR CORE FUNCTIONALITY

- Text.lk and Notify.lk - SMS delivery of the sign-in code. Receives the
  mobile number only.
- Amazon Web Services (S3 and CloudFront) - storage and delivery of images
  uploaded by the salon (logo, portfolio photos, chat images).
- Expo / Expo Application Services - push notification delivery and
  over-the-air update hosting for the app itself.
- Google Maps Platform (Places and Geocoding APIs) - address autocomplete when
  the owner sets their salon's location. Map display on iOS uses Apple MapKit.
- PayPal - generates a payment link the salon can send to a client for an
  invoice. No card data is entered in the app.
- WhatsApp Cloud API - optional delivery of an invoice receipt to a client.

The app uses no advertising, analytics or attribution SDKs, and no AI or
machine-learning services. Authentication is our own; there is no third-party
identity provider.

5. REGIONAL DIFFERENCES
There are none. The app behaves identically everywhere. It is built for the Sri
Lankan market - amounts are shown in Sri Lankan Rupees and LankaQR is offered
as a payment method a salon can record - but no feature, screen or content
varies by region, and nothing is gated by territory.

6. REGULATED INDUSTRY / PROTECTED MATERIAL
GlamEdge Owner does not operate in a regulated industry. Hairdressing and
beauty services are not licensed activities requiring documentation for this
app. The app contains no protected third-party material: all images are
uploaded by the salon that owns them, and all text is written by us or by the
salon's own users.

ADDITIONAL NOTES

Payments (Guideline 3.1.1): the payment options in POS Billing - cash, card,
online transfer, LankaQR, PayPal - record how a salon's walk-in client paid for
a physical, in-person service such as a haircut or a treatment. These are
real-world services delivered outside the app, which Guideline 3.1.3(e) exempts
from In-App Purchase. There is no paid content or paid feature inside the app
itself, no subscription purchase flow, and no digital goods.

Account deletion (Guideline 5.1.1(v)): available at Profile > Delete account,
at the bottom of the screen. It confirms twice, then closes the account and
signs the user out on every device. It is shown in the recording.

User-generated content (Guideline 1.2): the app has no public or social feed.
A salon posts photos of its own work to its own business profile, exchanges 1:1
messages with its own booked clients about their appointments, and reads reviews
left by those clients. An owner never browses content authored by strangers or
by other salons.

The content a salon does receive from its clients - reviews and chat messages -
can be reported and the author blocked:

- Reporting a review: Reviews screen, "Report" beneath any review. Choose a
  reason (spam, harassment, hate speech, sexual content, violence,
  impersonation, other) and it is filed for our moderation team.
- Reporting a message: open a booking, press and hold any message from the
  client in the chat thread.
- Blocking a client: "Block this client" in that same chat thread. A blocked
  client can no longer send the salon messages or make new online bookings with
  them. The block is per-salon, so it does not affect their bookings elsewhere.
- Undoing a block: Profile > Blocked clients > Unblock.

Reports are reviewed by our team within 24 hours and anything breaking our rules
is removed. Contact details are published at https://glamedge.beauty/support.
```

---

## Screen recording — shot list

Record on a **physical iPhone**, not the simulator. Apple asks for the latest
iOS. Keep it under about 5 minutes and do not cut between sections — one
continuous take is what they want.

1. **Launch from the home screen.** Start recording on the springboard, then tap
   the icon, so the recording opens with the app launching.
2. **Registration.** Sign in with a phone number that has never been used, to
   show the new-salon flow and the "pending approval" screen. Use a Sri Lankan
   number you can receive an SMS on.
3. **Sign in.** Restart the app and sign in with `+94770000000` / `424242`.
   Type both slowly and clearly.
4. **Dashboard.** Overview, then open the drawer and visit Bookings, Analytics,
   Reports, Staff, Services.
5. **POS Billing.** Add a walk-in, pick a service, choose a payment method, bill
   it, and show the invoice.
6. **Photos.** Open Showcase Feed and post a photo, so the photo-library
   permission prompt is captured.
6b. **Reporting and blocking** - Apple named this explicitly, so do not skip it.
   Go to Reviews and tap "Report" under a review, showing the reason list. Then
   open a booking with client messages, press and hold one of the client's
   messages to report it, and show "Block this client". Finish in Profile >
   Blocked clients to show the block can be undone.
7. **Location.** Profile > Location, showing the when-in-use prompt and the pin.
8. **Account deletion.** Profile, scroll to the bottom, tap "Delete my account",
   go through both confirmations, and show that it returns to the sign-in
   screen. **Do not skip this** - Apple named it explicitly.

Attach the file to the reply, or upload it somewhere and include the link.
