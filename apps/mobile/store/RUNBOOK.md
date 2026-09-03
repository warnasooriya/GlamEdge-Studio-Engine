# GlamEdge Owner — App Store release runbook

Everything in this folder supports one goal: getting `beauty.glamedge.owner`
through App Review. Work the steps in order — several later ones fail if an
earlier one was skipped.

- `listing.md` — paste-ready App Store Connect copy + the App Review notes
- `privacy-policy.md` — policy draft to publish at `/privacy`
- `privacy-labels.md` — answers for the App Privacy questionnaire
- `screenshots.md` — what to capture and at what size

---

## Blockers you must clear yourself

### 1. EAS is signed in to the wrong account

```
eas whoami  ->  inba1 (ksgfuel@gmail.com)
app.json    ->  "owner": "warnasooriya"
```

`eas project:info` currently fails with *Entity not authorized*. Nothing builds
until this is fixed:

```bash
eas login
```

Sign in as **warnasooriya** (the account that owns EAS project
`1188069d-5bdb-48b8-aa7d-4f95e54c6b9b`), then confirm:

```bash
eas whoami && eas project:info
```

### 2. Apple ID authentication

EAS needs to sign in to your Apple Developer account once, to register the
bundle ID, create the distribution certificate and provisioning profile, and
generate the APNs key for push. This is interactive and needs your 2FA code, so
you have to run it — it can't be automated:

```bash
eas credentials --platform ios
```

Accept when it offers to create everything. Note your **Team ID** from
[developer.apple.com/account](https://developer.apple.com/account) → Membership
while you're there; `eas submit` will ask for it.

### 3. `supportsTablet` — decide before building

See the box at the top of `screenshots.md`. Recommendation: set
`"supportsTablet": false` in `app.json` unless you have tested on iPad.

---

## Step 1 — Deploy the API changes

The app cannot pass review against the API that is live right now. Three changes
in this release need deploying first.

**a. Run the migration** (adds `TenantStatus.DELETED` and `tenants.deletedAt`):

```bash
pnpm --filter api exec prisma migrate deploy
```

**b. Set the demo account env vars** in your production `.env`:

```bash
DEMO_ACCOUNT_PHONE=+94770000000
DEMO_ACCOUNT_OTP_CODE=424242
```

Pick your own values. Both must be set or the bypass stays off. The code is
compared as a plain string and never expires, so **rotate it after each review**.

**c. Redeploy the API**, then verify all three landed:

```bash
# demo number must return 200 without sending an SMS
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://glamedge.beauty/api/auth/otp/request \
  -H 'Content-Type: application/json' -d '{"phone":"+94770000000"}'

# and the fixed code must authenticate
curl -s -X POST https://glamedge.beauty/api/auth/otp/verify \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+94770000000","code":"424242","salonName":"GlamEdge Demo Salon","ownerName":"Demo Owner"}'
```

## Step 2 — Approve and populate the demo salon

The first verify call above registers the demo salon as **PENDING**, which lands
the reviewer on the "pending approval" screen — the exact dead end the bypass was
meant to avoid. Open your admin panel and **approve GlamEdge Demo Salon**, then
re-run the verify call; it should now return a `token` and `tenant`.

Then populate it. A reviewer looking at six empty screens is a reviewer looking
for a reason to reject. See the checklist in `screenshots.md`.

## Step 3 — Build

```bash
cd apps/mobile
eas build --platform ios --profile production
```

`appVersionSource: remote` with `autoIncrement` means EAS owns the build number —
don't bump `buildNumber` in `app.json` by hand. Takes 15–25 minutes.

## Step 4 — Create the App Store Connect record and upload

```bash
eas submit --platform ios --profile production --latest
```

It will prompt for your Apple ID, then offer to create the App Store Connect app
for `beauty.glamedge.owner` — accept. Record the **ascAppId** it prints; adding
it, your Apple ID, and your Team ID back into `eas.json` under
`submit.production.ios` makes every future submit non-interactive.

## Step 5 — TestFlight

Install from TestFlight on a real device and check the things a simulator cannot:

- [ ] Push notification permission prompt appears and a test booking alert arrives
- [ ] Photo library prompt shows *our* wording, not Expo's default
- [ ] Location prompt appears in Profile → Location and the pin drops
- [ ] Sign in with the **demo credentials** — this is exactly what the reviewer does
- [ ] Profile → Delete account works, signs you out, and the old token is dead
- [ ] PayPal invoice link opens correctly

## Step 6 — Fill in App Store Connect

1. Publish the privacy policy at `https://glamedge.beauty/privacy` and a support
   page at `/support`. **Both must return 200** — a 404 here is an automatic
   rejection.
2. Paste everything from `listing.md`.
3. Upload screenshots per `screenshots.md`.
4. Complete App Privacy using `privacy-labels.md`.
5. Paste the App Review notes from `listing.md`, **with the real demo phone and
   code filled in**, and set Sign-In Required = Yes.
6. Export compliance: `ITSAppUsesNonExemptEncryption` is already `false` in
   `app.json` (standard HTTPS only), so you won't be asked again.

## Step 7 — Submit

Expect 24–48 hours. If it comes back rejected, the reply usually cites a
guideline number — send it to me and I'll work the fix.

---

## What was changed in this release

**API**
- `src/config/env.ts` — `demoAccount` config block
- `src/services/otp/otpStore.ts` — `isDemoPhone()`; demo number verifies against
  the fixed code and its code is never consumed
- `src/modules/auth/auth.controller.ts` — demo number skips OTP issue and SMS
  send; new `deleteAccount()`
- `src/modules/auth/auth.routes.ts` — `DELETE /api/auth/account`
- `prisma/schema.prisma` + migration — `TenantStatus.DELETED`, `tenants.deletedAt`
- `.env.example`, `.env.docker.example`, `docker-compose.yml` — demo vars

**Mobile**
- `app.json` — photo-library purpose string; dropped the unused Face ID and
  background-location strings; de-duplicated Android location permissions;
  added `expo-notifications`
- `eas.json` — `EXPO_PUBLIC_*` pinned into every build profile (`.env` is
  gitignored, so EAS Build never saw it — production builds had **no API URL**);
  removed the placeholder iOS submit block that would have failed the submit
- `app/(app)/settings.tsx`, `src/api/auth.ts` — Delete account flow
- Dependency versions realigned to Expo SDK 54

## Two expo-doctor warnings you can ignore

- `resolver.unstable_enableSymlinks` — deliberate, and required for pnpm's
  symlinked workspace. The reason is commented in `metro.config.js`.
- `@react-navigation/drawer ^7.13.8 vs ^7.5.0` — `^7.13.8` satisfies `^7.5.0`;
  expo-doctor compares the range strings literally.

## Worth fixing, not blocking

`EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is embedded in the app bundle — that is
unavoidable for any client-side key, and it was already committed in `app.json`.
The real protection is in Google Cloud: restrict the key to the Places and
Geocoding APIs, and add an iOS bundle-ID restriction for
`beauty.glamedge.owner` plus an Android package restriction. Do that before
launch or the key is open to anyone who unzips the IPA.
