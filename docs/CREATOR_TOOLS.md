# Creator tools guide

Open the **Tools** tab. All tools in this source build are free. The app is an Expo/React Native app for iPhone and Android, with a React Native Web preview. It is not a Roblox Studio plugin and does not execute Luau. The companion account is separate from Roblox; never enter a Roblox password or `.ROBLOSECURITY` cookie. No Open Cloud keys are needed for the supplied public-data features.

| Group | Working tools | Needs the included service? |
|---|---|---|
| Money | Robux creator-share estimate, live-source DevEx estimate, price ladder avoiding nearby prices | DevEx rate only |
| Tycoon | Sequential upgrade/rebirth/income model, fixed average theft loss, wait and cumulative-time graphs, fast/grindy targets | No |
| Code | Offset-to-Scale conversion, copyable UDim2 value, local Luau pattern checks | No |
| Publish | Local image framing at thumbnail/icon sizes, title/description checks and truncation, update-log formatting/copy, launch checklist saved to Projects | No |
| Stats | Public visits/players/favorites/votes, observed history, graphs and CSV export | Yes |
| Scripts | Ten templates including DataStore retries, leaderstats, ProximityPrompt, tweens, validated RemoteEvent shop, round timer | No |

## Live DevEx rates

Start `npm.cmd run server` in another terminal. Money → Calculate Robux kept → Load Roblox DevEx rate. The backend fetches [Roblox's DevEx page](https://create.roblox.com/docs/production/monetization/developer-exchange) through its official Markdown representation. It parses standard, eligible US 18+ and legacy categories rather than embedding a production numeric exchange rate. The UI shows the source and verification time. Standard is the default; users must establish their eligibility for any category themselves.

The service caches successful rate checks for one hour. If verification fails after that, it explicitly marks a previously verified rate stale. A fresh server with no verified rate returns an error and no dollar estimate. Parser changes fail closed; they never fall back to an invented rate. A rate can change after verification. This is a rough estimate before taxes/payout costs, not an account balance or guarantee of DevEx eligibility, withdrawal or profit.

The 70% creator-share field is an editable planning assumption for a creator's own in-game sales, grounded in [Roblox's monetization documentation](https://create.roblox.com/docs/monetize-experiences). It is separate from the fetched DevEx rate. Licensing arrangements, personalized/regional prices and other deductions may change actual proceeds. Estimated kept Robux round down per sale. Do not deduct the marketplace fee again when starting from already-earned Robux.

Price ladders keep suggestions at least 20% apart relative to the higher price, including existing offer prices you enter. This spacing is a design heuristic, not evidence that the prices will convert. Use distinct benefits for permanent passes and repeatable products.

## Progression assumptions

Income is constant between sequential purchases. Each purchase spends its full listed cost; the next tier uses the increased earning rate. Completed rebirths multiply starting income; rebirth costs, reset downtime, starting savings, travel, additional purchases and random theft events are excluded. Average loss reduces income by a fixed percentage. The graph can switch between wait per tier and cumulative seconds. Fast/grindy labels use your own wait targets. Recalculate after editing inputs and validate the model through playtests.

## Script and UI helpers

Offset X divided by parent width gives Scale X; the Y calculation uses parent height. The output assumes zero existing Scale. Add it to an existing Scale component for mixed UDim2 values. AnchorPoint, text scaling, constraints and layout still require device testing.

The script checker masks strings/comments and checks legacy scheduler calls, unprotected-looking DataStore calls and server RemoteEvent callbacks. It does not parse all Luau syntax or perform control/data-flow analysis. Safe wrappers may be flagged; client trust bugs can be missed. It never uploads or executes pasted code. A clean result is not a security certificate. Use the script shelf's placement/limits and test in Studio.

## Publishing helpers

Choose a PNG/JPEG/WebP image under 10 MB and 40 megapixels. The file is read locally and shown with center-crop or contain framing at 16:9 and square/tiny sizes. These previews approximate common layouts; they do not reproduce every Roblox surface, upload artwork or export a resized file. Roblox recommends [16:9 thumbnails, ideally 1920 × 1080](https://create.roblox.com/docs/production/publishing/thumbnails), and [square game icons](https://create.roblox.com/docs/production/publishing/experience-icons).

The listing checker counts Unicode code points, reviews relevant keyword presence/repetition and approximates title cutoffs at 24/40 characters. A 50-character title target and 1,000-character description budget are planning aids; verify current form limits in Creator Hub. It does not predict discovery ranking. The update formatter only uses the changes you supply. Copy its output to publish it yourself.

Launch checklist → Save to Projects creates a project with 14 real tasks. Task completion persists and syncs when signed in. It covers mobile inputs, target server size, multiple clients, persistence failure cases, server validation, gamepass/product icons and fulfillment, badges, artwork, current publishing requirements, performance, baseline stats and rollback. It is a starter list, not proof of release readiness.

## Public stats and history

Enter a universe ID, select Place ID for a numeric place ID, or paste a genuine `https://www.roblox.com/games/...` link. The service resolves places through Roblox and reads public game details/votes from the [documented games API](https://create.roblox.com/docs/cloud/reference/domains/games). Requests go only to fixed Roblox domains with numeric IDs; no client-supplied URL is fetched and no Roblox credentials are forwarded.

Each refresh records an actual snapshot on your configured server. Refreshes within 60 seconds share a cached snapshot. The server retains up to 200 observations per game and the 1,000 most recently observed games. History is shared public game data on that service, not a private account workspace. The UI graphs the latest 20 observations and exports all retained observations to CSV. It does not obtain historical visits that Roblox did not provide, collect continuously while closed, or prove that an update caused a metric change. Record a baseline before an update and return to compare. Private/deleted games, API changes and rate limits may make stats unavailable.

Source checks were performed October 26, 2026. The live verification read the official DevEx categories and resolved a public place to its universe with real counts; automated tests use controlled responses for repeatability.
