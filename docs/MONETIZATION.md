# Monetization proposal — assumptions, not revenue

**Current state:** this MVP is free, unpublished and has no billing SDK, products, entitlements, ads, subscriptions, checkout or revenue. No payment credentials were provided. Suggested prices and conversion rates below are experiments, not market evidence.

## Who might pay, and why

The plausible customer is a solo creator or small team that wants to plan a session, sanity-check progression math, and carry a short build list between their phone and computer. The value is a convenient workflow and well-explained tools. Code snippets alone face strong alternatives: the official Creator Hub, search, spreadsheets and existing task apps. Roblox Studio is a desktop workflow, so the main commercial uncertainty is whether creators repeatedly need the phone companion at all.

No competitor install counts, paid conversions, review corpus or revenue estimates were collected for this build. There is no evidence yet that this app will make money. Prove repeat usage before adding paid infrastructure.

## Product and price experiment

| Stage | Offer | Price hypothesis | What must exist first |
|---|---|---|---|
| MVP / private beta | All features delivered here | Free | Test the core workflow and collect direct feedback |
| First paid offer | Optional Pro unlock: saved balance scenarios, side-by-side comparisons, CSV export, richer project planning | US$14.99 one-time, test against $9.99 | Build these additions, establish repeat use, implement/verify store billing and restore purchases |
| Optional content | A reviewed, substantial genre toolkit with exercises, integration instructions and examples | US$4.99 per pack | Actual new original content, tested examples, clear preview of what the buyer gets |
| Possible hosted service later | Managed sync/team collaboration and ongoing analytics collection | Test $2.99/month only after repeat use | Self-hosted accounts/sync are included free now. Paid hosting would still need operations, recovery/support, continuous collection and verified subscriptions. |

Keep the free MVP useful. Do not retroactively lock a user's existing projects or exported backups. Do not market local recombination as paid AI. Avoid ads in a coding workbench; there is no audience or evidence to justify an ad SDK in this version. Paid digital features should use the applicable store billing route, with regional program rules checked before implementation. [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/), [Google Play payments policy](https://support.google.com/googleplay/android-developer/answer/9858738?hl=en).

## Example unit economics

Assume a **$14.99 one-time unlock**, 2% of **new unique installs** buying, and either a 15% or a 30% store-fee sensitivity. These are hypothetical inputs. Dollar figures exclude tax, refunds, currency effects, acquisition, support, development and platform costs.

| New installs in a period | New buyers at 2% | Gross one-time sales | After illustrative 15% fee | After illustrative 30% fee |
|---:|---:|---:|---:|---:|
| 1,000 | 20 | $299.80 | $254.83 | $209.86 |
| 5,000 | 100 | $1,499.00 | $1,274.15 | $1,049.30 |
| 10,000 | 200 | $2,998.00 | $2,548.30 | $2,098.60 |

One-time buyers do not pay again each month. New installs must continue for this revenue to repeat. A 15% fee yields $12.7415 per $14.99 sale before other costs. Covering $1,000 in costs would take **79 new buyers**, or **3,950 new installs at the assumed 2% conversion**. At 30%, it takes **96 buyers / 4,800 installs**. A 2% conversion rate with $1 paid acquisition per install would cost $50 per buyer and lose money at these prices.

The 15% example is grounded in eligible enrolled programs, not a universal fee promise. Apple’s Small Business Program offers a reduced 15% commission with eligibility conditions. Google lists 15% for the first $1M for enrolled developers, with different conditions for other transactions/programs. Verify your account and storefront terms. [Apple program](https://developer.apple.com/app-store/small-business-program/), [Google service fees](https://support.google.com/googleplay/android-developer/answer/112622?hl=en-GB).

## Costs to budget

- Apple lists US$99 per membership year, with regional pricing and certain waivers. [Apple enrollment](https://developer.apple.com/programs/enroll/).
- Google lists a US$25 one-time developer registration fee. Account verification and testing requirements also apply. [Play Console signup](https://support.google.com/googleplay/android-developer/answer/6112435?hl=en).
- Expo Go/local development can test this MVP without a paid backend. EAS build limits and costs depend on your account/plan; inspect them before ordering builds. No paid build was requested here.
- Budget your time for real-device tests, bug fixes, support, store assets and updates as Expo/Roblox evolve. Offline software still has maintenance costs.
- The included self-hosted sync/public-data service needs a running computer or host. Public hosting, backups, abuse controls, email recovery and support would introduce continuing costs; no hosting subscription has been purchased. Remote AI is absent.

## First 30 days: a decision plan

1. **Days 1–7:** test with 10–15 actual creators, initially adults who can give informed product feedback. Watch them generate an idea, tune one real mechanic, and move a template to Studio. Record where the phone helps and where it slows them down. No messages have been sent or users recruited by this build.
2. **Days 8–14:** improve the two most frequent blockers. Ask testers to bring back a real project after a week. Target at least five returning creators and evidence that one tool saves them time. These are chosen go/no-go criteria, not industry benchmarks.
3. **Days 15–21:** demonstrate a working prototype of the proposed Pro additions. Test whether people prefer $9.99/$14.99 once, paid packs, or a free desktop tool. “Would pay” answers are weaker than actual purchases; do not report them as conversion.
4. **Days 22–30:** if repeat use and demand exist, prepare store builds and implement one non-consumable unlock with sandbox purchase/restore tests. If the phone workflow is rarely reused, pause paid development and test a desktop/Studio plugin direction before spending on acquisition.

A small owned audience of creators and useful demonstrations are better first experiments than buying broad “Roblox” traffic. Any creator sponsorship must disclose payment and be tracked against actual buyers. This plan does not assume an audience, endorsement or partnership exists.

## Commercial launch constraints

The working title **Roblox Dev Companion** is not a cleared commercial brand. Roblox's published guidelines restrict commercial use of its name and marks; “unofficial” does not grant a license. Establish an independent brand and obtain any required permission before commercial use. The code uses an original terminal icon. [Roblox name/logo guidelines](https://en.help.roblox.com/hc/en-us/articles/115001708126-Roblox-Name-and-Logo-Community-Usage-Guidelines).

This app must never promise free Robux, privileged Roblox access, guaranteed experience revenue or exploit scripts. Its calculator does not model DevEx or real-money returns. Any paid feature should have a precise deliverable, a visible price, restore support and honest availability. Store rules, fees and Expo compatibility were checked on October 26, 2026; recheck them when releasing.
