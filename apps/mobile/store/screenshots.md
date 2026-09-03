# Screenshot plan

## What Apple actually requires (2026)

| Device | Required? | Size (portrait) | How many |
|---|---|---|---|
| iPhone 6.9" | **Yes** | 1320 × 2868 | 3–10 (do all 6 below) |
| iPad 13" | **Only if the app ships for iPad** | 2064 × 2752 | 3–10 |
| Other iPhone sizes | No | — | Apple scales the 6.9" set down |

> ### Decide this before you build: `supportsTablet`
> `app.json` currently sets `ios.supportsTablet: true`. That does two things you
> may not want: it obliges you to supply a full **iPad screenshot set**, and it
> puts the app in front of a reviewer **on an iPad**, where a phone-first layout
> (bottom tab bar, drawer, single-column forms) tends to look stretched — a
> Guideline 4.0 design rejection.
>
> Unless you have actually tested on iPad, set `"supportsTablet": false`. You can
> add iPad support in a later release; going the other way after launch is
> harder. This is a one-word change in `app.json`.

## Simulator to capture on

`iPhone 17 Pro Max` (or any 6.9" device) gives you 1320 × 2868 natively, so no
resizing is needed.

```bash
xcrun simctl list devices available | grep "Pro Max"
```

## The six shots, in store order

Order matters — most people only see the first two in search results.

1. **Overview** — the day's takings, net profit, cash drawer. Leads with money.
2. **Bookings** — the visual day schedule with a full column of appointments.
3. **POS Billing** — an invoice mid-build with payment modes visible.
4. **Analytics** — revenue trend and top services, charts populated.
5. **Staff** — team list with commission rates.
6. **Showcase Feed** or **Customers** — whichever looks fuller with your demo data.

## Before capturing

Screenshots of empty screens sell nothing and read as an unfinished app to a
reviewer. Sign in as the demo salon and make sure it has:

- 6–8 appointments across today, in mixed states (confirmed, pending, completed)
- 4+ staff with realistic commission rates
- 10+ services across both GENTS and LADIES categories
- 2–3 weeks of ledger history so the Analytics charts have a curve
- A handful of reviews with varied star ratings
- A salon logo set

## Capturing

Once a build is installed on the simulator:

```bash
xcrun simctl io booted screenshot ~/Desktop/glamedge-01-overview.png
```

Repeat per screen. Check each is exactly 1320 × 2868:

```bash
sips -g pixelWidth -g pixelHeight ~/Desktop/glamedge-*.png
```

## Rules that get screenshots rejected

- No device frames, drop shadows, or angled mockups on the raw upload.
- No "Download now", pricing, or Apple logos/hardware in the image.
- The status bar must look real — no 9:41 fake bar over a different time.
- Text overlays are allowed and help, but must describe what the screen does.
- Every screenshot must show the actual app, not a marketing illustration.

## I can capture these for you

Once the API changes are deployed and the demo salon is seeded, say the word and
I'll boot the simulator, install the build, drive the app to each screen, and
hand you the six PNGs at the right dimensions.
