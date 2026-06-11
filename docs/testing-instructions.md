# Testing Instructions — Grapez Analytics Agents

**Live app:** https://grapez-frontend-hgsyggbcaq-uc.a.run.app

## What you need

A Google account with **admin access to at least one Google Analytics 4 property and one Google Tag Manager container**. Two options:

- **Option A — Test account (recommended):** we provide a ready-to-use Gmail account with a test GA4 property and GTM container already set up. **The username and password are shared in the private notes of our Devpost submission.**
- **Option B — Your own account:** any Google account that manages a GA4 property + GTM container works — even if they are not connected to a real website yet. The agent audits whatever it finds and proposes fixes accordingly.

> ⚠️ **Heads-up about the Google consent screen:** this app is registered in Google Cloud as a **testing app (not yet verified by Google)**, so during sign-in Google will show a *"Google hasn't verified this app"* warning. This is expected. To continue, click **"Advanced"** → **"Go to grapez-frontend… (unsafe)"** and then **grant all the requested permissions** (GA4 and GTM access — the agent needs them to audit and implement). Nothing is stored server-side: your tokens live only in an encrypted session cookie for the duration of your session.

## Step 1 — Connect the Google account

1. Open the live app URL.
2. Click **"Connect Google"** (top right) or **"Connect Google account"**.
3. Sign in with the test account (or your own) and complete the consent flow described above, approving **all** permissions.
4. You'll return to the home page with the account shown as **Connected**.

## Step 2 — Start a new analysis

1. Click **"New analysis"**.
2. Fill in the client's initial business data:
   - **Client name** — e.g. `Fashion Store Co.`
   - **Website URL** — any real, public website (the agent crawls it live with a headless browser). If you don't have one, use any production site you know.
   - **Business model** — e.g. e-commerce or lead generation.
   - **Analysis mode** — choose **"Audit + implementation"** to experience the full flow (audit-only stops after the findings report).
3. Submit — you'll land in the consultation chat.

## Step 3 — Converse with the agent (the consultative flow)

The Planner Agent guides you through **5 visible steps**. It works on its own and only stops when it needs your input — answer through the interactive cards it renders (A2UI):

1. **Get to know your business** — before saying anything, the agent researches the company (Brave Search via MCP) and crawls the website (screenshots + site map table). It then asks you, with clickable choice cards, which detected actions (forms, purchase buttons, booking CTAs…) matter as conversions. Pick one or describe your own.
2. **Decide how we work** — confirm the mode, then the agent inventories your GA4 accounts and GTM containers; if there's more than one, pick the property/container to analyze from the choice cards.
3. **Review your tracking** — the agent audits the website, the GA4 property and the GTM container (progress indicators show what it's doing; this takes 1–2 minutes).
4. **Results** — an executive summary plus a findings table in business language (what works ✅, what's improvable ⚠️, what's critical ❌).
5. **Fixes and final summary** — one **action card per recommended fix**. Click **Confirm** on the ones you approve: the agent executes the change for real (e.g. creates the conversion event in GA4, builds tags/triggers/variables in GTM). Click **Skip** to leave it as pending. A final summary card closes the session.

## Safety guarantees worth verifying while you test

- **Nothing is written without your click.** Every change requires approving its action card — the approval gate is enforced in Python (a session flag), not just in the prompt.
- **GTM is never touched in production:** the agent creates a **new workspace** and a **draft version**. You can open Tag Manager and review the draft before anything is published.
- One approval covers exactly one action; the next fix asks again.

## Timing & tips

- Full audit: **~5 minutes**. Audit + implementation: **~10–15 minutes** depending on how many fixes you approve.
- The session cookie lasts 1 hour of token validity — if you see an authentication error after a long pause, just reconnect the Google account.
- You can attach screenshots in the chat (e.g. of your GA4 screens) — the agent reads them.
- To start over, go back to the home page and create a new analysis.
