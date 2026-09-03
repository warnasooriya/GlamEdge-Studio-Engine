# App Privacy questionnaire — answers

App Store Connect → your app → **App Privacy**. Every answer below is derived
from what the code actually does; if a feature changes, re-check the matching
row before the next submission.

Apple asks three things per data type: is it **collected**, is it **linked to
the user's identity**, and is it used for **tracking**.

> **Tracking: No, for every single data type.** The app contains no advertising
> SDK, no analytics SDK, no attribution SDK, and shares nothing with data
> brokers. When Apple asks "Do you or your third-party partners use data for
> tracking?", answer **No** — this also means you do **not** need
> `NSUserTrackingUsageDescription` or the ATT prompt.

## Data collected

| Apple data type | Collected | Linked to identity | Purpose | Why — where it comes from |
|---|---|---|---|---|
| Contact Info → **Phone Number** | Yes | Yes | App Functionality | The owner's phone number is the login identifier (`Tenant.phone`). Also `contactPhone` on the salon profile and `Staff.phone`. |
| Contact Info → **Name** | Yes | Yes | App Functionality | `ownerName` and `salonName` at registration; staff names; client names entered by the owner. |
| Contact Info → **Email Address** | Yes | Yes | App Functionality | `paypalEmail` on the salon profile, used to route PayPal payment links. Optional. |
| Location → **Precise Location** | Yes | Yes | App Functionality | `expo-location`, when-in-use only, in Profile → Location, to store the salon's own `latitude`/`longitude`. |
| User Content → **Photos or Videos** | Yes | Yes | App Functionality | `expo-image-picker` for the salon logo, Showcase Feed posts, and images sent in client chat. |
| User Content → **Customer Support** | Yes | Yes | App Functionality | In-app chat messages between the salon and its clients. |
| User Content → **Other User Content** | Yes | Yes | App Functionality | Services, staff, commission rates, cash-drawer entries, reviews. |
| Identifiers → **Device ID** | Yes | Yes | App Functionality | The Expo push token, registered per device so booking alerts reach the right phone. |
| Purchases → **Purchase History** | Yes | Yes | App Functionality | POS invoices and payment mode for the salon's own transactions. |

## Data NOT collected — answer No

- **Contacts** — the app never reads the device address book. Client records are
  typed in by the owner. There is no `expo-contacts` dependency.
- **Health & Fitness**, **Financial Info** (no card or bank numbers are ever
  entered — PayPal and LankaQR are handled off-app), **Browsing History**,
  **Search History**, **Sensitive Info**, **Diagnostics**, **Usage Data**,
  **Advertising Data**, **Coarse Location**, **Audio Data**.

## Two notes worth getting right

1. **Client data is third-party data.** The owner enters names and phone numbers
   belonging to their salon's customers. Apple still counts this as collected
   Contact Info, so it is declared above. Your privacy policy must say that the
   salon is the controller of its own client records and GlamEdge is the
   processor — `privacy-policy.md` already has that paragraph.

2. **Account deletion is mandatory.** Guideline 5.1.1(v) requires any app with
   account creation to offer in-app account deletion. **The app currently has no
   delete-account flow — see `RUNBOOK.md`, this is an open blocker.**
