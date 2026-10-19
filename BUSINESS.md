# wrenchtron — product & business plan

**Status:** planning lock (Aug 2026)  
**Constraint:** self-serve product; growth via **paid marketing impressions** (not founder sales, not in-app ads).

This is a **real pivot**, not an incremental tweak. It retires the utvtron hardware bundle-kit plan and dual-brand paid surface. See [Superseded plans](#superseded-plans).

---

## Decision summary

| Choice | Lock |
|---|---|
| What we sell | Self-serve **Pro subscription** for multi-machine households |
| Acquisition | **Paid impressions** (Meta/Google/etc.) → one landing → signup |
| Monetization | Subscription only — **no ads inside the app** |
| Brand on ads | **wrenchtron only** (one URL, one promise, one checkout) |
| Clutch / utvtron / ThermoPro | **Blog / experiment** — not the product, not the ad, not a kit |
| Sales motion | None — no demos, no DM closing |

**One-line business:** Know what’s overdue on every machine you own — free for one machine, Pro for the rest.

---

## Superseded plans

| Plan | Disposition |
|---|---|
| utvtron + TP25 retail kit (`BUNDLE.md`, ~$89–99 box) | **Archived** — incompatible with single-brand Pro SaaS. Hardware fulfillment + utvtron as SKU is parked permanently under this strategy. |
| utvtron as paid / advertised sister app | **Parked** — does not define roadmap or ad spend |
| Dual-brand CAC (wrenchtron + utvtron creatives) | **Rejected** — cold traffic cannot absorb probe/BLE/CVT story |

Archive copy (sibling repo): `utvtron/docs/archive/BUNDLE.md`. Do not resurrect without explicitly overturning this doc.

---

## What we are not

- Not enterprise fleet (Samsara / Fleetio)
- Not a fuel-MPG app (Drivvo / Fuelio war)
- Not “sell clutch temperature,” belt prediction, or a thermometer kit
- Not two brands competing for the same ad dollar
- Not a sales-led SMB tool (unless strategy changes later)

utvtron and the CVT outlet experiment stay on [swantron](https://swantron.com) as published learning. They do not define the roadmap or the paid SKU.

---

## The product paid impressions buy

**Promise:** Know what’s overdue on every machine you own.

**Who the ad is for:** People with **more than one** machine (truck + mower, car + boat, daily + side-by-side). Single-vehicle owners are the free tier, not the revenue target.

**Aha in &lt; 2 minutes:** Sign in → add a vehicle → see next due.

### Addressable-slice stress test (before scaling spend)

Free is intentionally a **complete product for one machine** (full log, intervals, recalls). That means **nearly 100% of paid revenue depends on prospects who:**

1. Own (or will track) **2+ machines**, and  
2. Care enough to put the second one in an app.

That slice is real (LookOver, Drivvo multi-vehicle, mixed-garage apps exist) but **narrower than “everyone with a car.”**

**Gut-check before creative scale:**

- Ads and landing must **pre-qualify multi-machine** (“truck + mower + side-by-side”), not “track your car.”  
- Measure early: **% of signups that attempt vehicle #2** within 7 / 30 days. If that rate is tiny, CAC cannot clear — fix targeting/creative/promise before raising budgets.  
- Do **not** fix a weak 2+ rate by gutting free into a crippled demo (hurts trust and reviews); fix **who sees the ad**.

---

## Free vs Pro

| | Free | Pro |
|---|---|---|
| Vehicles | **1** | **Unlimited** |
| Service log | Full | Full |
| Intervals / next due (that vehicle) | Yes | Yes |
| Recalls | Yes | Yes |
| **Due hub** (all machines: overdue / soon) | No (or single-vehicle only) | **Yes — core Pro value** |
| Push / email reminders | No or soft in-app only | **Yes — retention engine** |
| Export (PDF/CSV) / year cost summary | No | **Yes** |
| Photos / receipts | Basic | Full |

**Price (working):** **$34.99 / year** (optional ~$3.99/mo; push annual for CAC math).

**Primary upgrade trigger:** Add a second vehicle → paywall.  
**Secondary:** Enable reminders → paywall.

Competitor reference: LookOver-style **1 machine free / garage Pro** is validated in powersports; we position broader (mixed household garage), not dirt-bike-first.

### Grandfathering (required before enforcing the cap)

Flipping “free = 1 vehicle” will punish anyone already tracking 2+ for free. That is a goodwill and support risk.

**Policy (lock before days 1–30 ship):**

| Cohort | Rule |
|---|---|
| **Existing accounts** with 2+ vehicles at paywall launch | **Grandfather** — keep multi-vehicle access without paying (or grant complimentary Pro for N months / forever — pick one before launch and document it in-product) |
| **New signups** after launch | Hard cap: 1 vehicle free; 2nd → paywall |
| **Existing 1-vehicle** accounts that later add a 2nd | Paywall (same as new) |

**Recommended default:** grandfather **indefinite complimentary multi-vehicle** for pre-launch multi-vehicle accounts (small population, buys goodwill, avoids support fire). Do **not** silently delete or lock their machines.

Implement as an account flag (`grandfatheredMultiVehicle` or complimentary Pro), not as “ignore the cap and hope.”

---

## Funnel

```
Paid creative (impression → click)
  → Landing (one screen, one CTA)
    → Google sign-in
      → Add first vehicle (free aha: next due)
        → Add 2nd vehicle OR enable reminders
          → Checkout
            → Due hub + notifications
```

### Landing must include

1. Headline = promise  
2. Screenshot of **Due this month** hub (multiple machine rows)  
3. “Free for one machine” + annual price  
4. Single CTA: **Start free**

No feature grids. No sister-app story. Blog is optional SEO/trust — not required to convert cold traffic.

---

## Ad creative angles

Anxiety → relief. Not architecture.

1. **Mixed garage** — “Truck, mower, side-by-side — what’s late?”  
2. **Memory** — “You don’t forget the RZR. You forget the mower.”  
3. **Seasonal** — “Spring checklist without a spreadsheet”  
4. **Proof** — “Sell it with a service history, not a shrug”

**Formula:** messy reality → clean hub UI → Free for 1 · Pro for the rest · ~$35/yr  

Kill creatives that need explaining probes, BLE, or dual products.

---

## Competitive frame (for us, not for ads)

| Layer | Examples | Relevance |
|---|---|---|
| Fuel / expense | Drivvo, Simply Auto, Fuelio, CARFAX Car Care | Awareness competitors; weak on equipment / seasonal |
| Mixed garage | Wrench Wise, MyGarage+ | Closest category peers |
| Powersports-native | **LookOver** | Closest pricing & free/Pro pattern; ride GPS, not clutch science |
| Enterprise fleet | Fleetio, Samsara | **Out of scope** |

**Win:** mixed household + DIY + clear due board + reminders.  
**Don’t fight:** fuel graphs, AI mechanic, commercial telematics.

---

## Economics targets & kill criteria

Consumer utility on Meta/Google often sees **~$15–40+ CAC per install**, and **install → paid** on non-viral utilities is often **low single digits**. A **$34.99/yr** price with a target like “CAC &lt; ~½ of $35 ≈ $17” is **tight** for cold traffic with no viral loop. Treat that as a risk, not a footnote.

### Learning budget (days 61–90)

- Cap **test spend at $1,500** (soft ceiling; do not “just raise budget” to force a win)
- Optimize creative, landing, and paywall weekly
- Track: spend → click → signup → vehicle #1 → attempt vehicle #2 → paid → cancel

### Day-90 decision (set now, before spend)

Evaluate on **blended CPA to first paid** and **% signups that attempt vehicle #2 within 30 days**:

| Outcome at day 90 (or when $1,500 test is exhausted) | Action |
|---|---|
| CPA-to-paid **≤ $20** and vehicle-#2 attempt rate looks healthy | Continue; scale spend cautiously |
| CPA-to-paid **$20–35** | **Adjust once:** raise annual price and/or tighten ads to explicit multi-machine only; retest 2 weeks — do not add features |
| CPA-to-paid **&gt; $35** after that adjustment | **Stop paid social** for this SKU/price; revisit price, channel, or whether the wedge is wrong |
| Vehicle-#2 attempt rate **&lt; ~15%** of signups by day 30 | Targeting/promise failed (too many single-car clickers) — fix creative/landing before more spend |

Numbers are working thresholds — update them if price changes, but **do not start spend without a written stop rule**.

If CPA does not clear: fix **price, targeting, or paywall** — do **not** randomly add features.

**Hands-off means:** no sales conversations. It does **not** mean set a budget once and never look at LTV/CAC.

---

## 90-day plan

### Days 1–30 — Purchasable

- Enforce free = 1 vehicle **for new accounts**  
- Ship **grandfather flag** for pre-existing multi-vehicle accounts  
- Pro entitlement + annual checkout  
- Due hub (Pro)  
- Hard paywall on 2nd vehicle (non-grandfathered)

### Days 31–60 — Retained

- Push and/or email: due in 14 / 7 / 1 days  
- Reminder opt-in as Pro moment  
- Simple export (resale / proof)

### Days 61–90 — Buyable with impressions

- Landing matched to ad promise (multi-machine qualified)  
- 4–6 creatives, small daily spend within the **$1,500** test cap  
- Weekly kill/keep on CTR → signup → paid  
- Dashboard: spend, CPA, paid conversions, cancels, vehicle-#2 attempt rate  
- Apply **day-90 kill / adjust table** above  

### Parked

- utvtron as product surface / dual-brand ads  
- Hardware kit / TP25 bundle retail  
- Clutch / BLE / prediction features  
- Play Store as primary revenue bet  
- SMB outbound sales  

---

## Positioning sentence

wrenchtron is a **self-serve maintenance reminder and history app for every machine you own**, grown with **paid marketing impressions**, monetized with **annual Pro** when the garage grows past one vehicle.

---

## Open follow-ups

1. Exact landing copy (headline, bullets, CTA)  
2. Remaining entitlement edges (delete vehicle to stay free, household share later, refunds)  
3. Reminder policy (what fires when)  
4. Strip list — what to remove or hide from current wrenchtron so the ad promise isn’t diluted  
5. Confirm grandfather benefit: complimentary Pro forever vs. 12-month comp (default lean: forever for pre-launch multi-vehicle)  
