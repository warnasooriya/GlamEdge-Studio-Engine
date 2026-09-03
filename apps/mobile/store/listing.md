# App Store Connect — listing content

Paste-ready copy for **GlamEdge Owner** (`beauty.glamedge.owner`).
Character counts are Apple's hard limits; the values below are already within them.

---

## App Information

| Field | Value |
|---|---|
| App Name (30) | `GlamEdge Owner` |
| Subtitle (30) | `Salon bookings, POS & staff` |
| Primary category | Business |
| Secondary category | Productivity |
| Age rating | 4+ |
| Bundle ID | `beauty.glamedge.owner` |
| SKU | `glamedge-owner-ios` |
| Primary language | English (U.S.) |

## Keywords (100 chars max — this is 98)

```
salon,spa,barber,booking,appointment,pos,billing,staff,stylist,beauty,scheduler,invoice,manager
```

Do not repeat words already in the app name or subtitle — Apple indexes those
separately and duplicates waste the budget.

## Promotional text (170 max — editable without a new build)

```
Run your salon from your phone: take bookings, bill clients at the chair, track staff commissions, and see exactly what your day earned.
```

## Description

```
GlamEdge Owner is the salon owner's control room. Manage your chairs, your team,
and your takings from one app — no desktop required.

BOOKINGS
See today at a glance on a visual day schedule. Confirm, reschedule, or cancel
appointments in a tap, and propose a new time to a client without leaving the
screen. Walk-ins can be added straight to the queue.

POINT OF SALE
Bill a client the moment they leave the chair. Add services, apply the price,
and take payment by cash, card, online transfer, LankaQR, or PayPal. Send the
invoice to the client as a link.

STAFF
Add your stylists and therapists, set individual commission rates, and let the
app calculate what each person is owed. Commission totals appear in Reports —
no more spreadsheets on payday.

CASH DRAWER
Log income and expenses as they happen and watch net profit for the day update
live on the Overview screen.

ANALYTICS
Revenue trends, bookings by category, bookings by day of week, peak booking
times, top services by revenue, cancellation rate, and your average rating —
all charted, all filterable.

REPORTS
Revenue, cancellations, no-shows, and staff commission, exportable for your
accountant.

CUSTOMERS
Every client's visit history, spend, and reviews in one profile, so you know
who your regulars are before they walk in.

REVIEWS
Read what clients said after their appointment and see your rating distribution
over time.

SHOWCASE FEED
Post photos of your work to your salon's public profile and keep your shopfront
looking current.

MESSAGING
Chat with clients about their booking, and send images, directly in the app.

Push notifications keep you on top of new booking requests, cancellations,
reschedules, reviews, and messages as they arrive.

GlamEdge Owner requires a GlamEdge salon account. New salons are reviewed and
approved by our team before the dashboard unlocks.
```

## URLs

| Field | Value |
|---|---|
| Support URL | `https://glamedge.beauty/support` |
| Marketing URL | `https://glamedge.beauty` |
| Privacy Policy URL | `https://glamedge.beauty/privacy` |

> **These three pages must return 200 before you submit.** Apple opens the
> privacy and support URLs during review and rejects on a 404. See
> `privacy-policy.md` in this folder for the policy text to publish.

## Copyright

```
2026 GlamEdge
```

---

## App Review notes

Paste this verbatim into **App Review Information → Notes**. It pre-empts the
three things most likely to get this build rejected.

```
DEMO ACCOUNT
GlamEdge Owner signs in with a phone number and a 6-digit SMS code. Our SMS
provider only delivers to Sri Lankan numbers, so we have provisioned a demo
account that bypasses SMS entirely for your review:

  Phone number: <FILL IN — e.g. +94770000000>
  Verification code: <FILL IN — e.g. 424242>

Enter the phone number on the first screen, tap Continue, then enter the code
above on the next screen. No SMS will arrive, and none is needed — this account
accepts that fixed code. The demo salon is pre-approved and populated with
sample bookings, staff, services, and takings.

ABOUT PAYMENTS (Guideline 3.1.1)
The payment options in the POS screen (cash, card, online transfer, LankaQR,
PayPal) are used by a salon owner to bill their own walk-in client for a
physical, in-person service — a haircut, a treatment, a manicure. These are
real-world services delivered outside the app, which Guideline 3.1.3(e) exempts
from In-App Purchase. The app sells no digital content or subscriptions, and
contains no purchase flow of its own.

ABOUT ACCOUNT CREATION
This is a B2B tool for salon businesses that already hold a GlamEdge account.
Salons are onboarded and approved by our team, which is why a brand-new number
lands on a "pending approval" screen. The demo credentials above are already
approved and go straight to the dashboard.

LOCATION
Location is requested once, in Profile > Location, and only to drop a pin on the
salon's own address so clients can find the shop. It is when-in-use only; the
app does not track location in the background.
```

## Sign-in requirement

Apple asks whether a sign-in is required. Answer **Yes** and supply the demo
credentials above in the User Name / Password fields (put the phone number in
User Name and the fixed code in Password).
