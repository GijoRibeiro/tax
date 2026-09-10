# Taxfix Phase 2 — Brand, Gaps, Persona Review, Polish

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use checkbox syntax.

**Goal:** Take the working native prototype to "full-fledged and polished": real brand typography, the gaps a real product fills (nudges, scanning, expat guidance), a multi-case advisor experience, competitive references, persona-agent reviews, and 5–10 screenshot-driven polish iterations.

**Architecture:** unchanged (SwiftUI app + relay + web hub/advisor, one reducer). Phase 2 adds views, copy, seed data, and one new relay-independent iOS subsystem (local notifications).

**Spec:** docs/superpowers/specs/2026-08-31-taxfix-native-full-journey-design.md plus USER DIRECTIVES in .superpowers/sdd/2026-08-31-taxfix-native-full-journey/progress.md (authoritative for this phase's intent: minimalist, elegant, superb UX, natural language, fill every gap, advisor multi-project UX, nice onboarding, extras like nudges/scanning/expat FAQs, non-Taxfix references).

## Global Constraints

- Same as Phase 1 (strict TS, tokens-only styling web+iOS, English copy, calm deadline framing, plain conventional commits no trailers, all suites green after every task).
- ABC ROM trial fonts: binaries live in fonts/ (repo) but are GITIGNORED; every consumer has a graceful system fallback. Weights used: Book (regular text), Medium, Bold, Black (display). Family names on iOS resolve from the OTFs' internal names (check with `fc-scan` or FontBook naming: likely "ABC ROM Trial" / styles).
- New iOS copy stays in the natural-language voice already established ("like a friend who happens to know German taxes").

---

### Task 15: ABC ROM brand typography (iOS + web)

**Files:** Create fonts/ (copy 4 OTFs: ABCROM-Book/Medium/Bold/Black-Trial.otf from "/Users/gijo/Downloads/Rom Font Family"), .gitignore (+ `fonts/` and `ios/Resources/Fonts/`), scripts/sync-fonts.mjs (copies fonts/ → ios/Resources/Fonts/ and public/fonts/, gitignored targets), src/styles/tokens.css (--font-brand + @font-face in a new src/styles/fonts.css imported before tokens), iOS: project.yml (Info UIAppFonts list), a Font helper (ios/Sources/BrandFont.swift: `func brandFont(_ size: CGFloat, _ weight: BrandWeight) -> Font` falling back to .system when the family isn't registered), apply to PrimaryButton/large titles/hero numbers first, then all views. README note ("drop the OTFs in fonts/, run npm run sync:fonts").

**Steps:** sync script + web @font-face (--font-sans gains 'ABC ROM Trial' first in stack via fonts.css; keep fallbacks) → verify hub/advisor render with ROM in a browser build (font file served) → iOS: bundle fonts (UIAppFonts requires exact resource filenames), BrandFont helper, sweep views replacing .font(.largeTitle.bold()) etc. with brand equivalents (keep Dynamic-Type-relative sizes) → build + screenshot Welcome/CaseHome/Review to READ and confirm ROM renders (letterforms clearly differ from SF) → commits: `feat: abc rom brand typography with graceful fallbacks`.

### Task 16: Consumer gap-fill — nudges, scanning, guidance, FAQ

**A. Live nudge notifications (the demo beat):** UNUserNotificationCenter local notifications, requested on first case screen (pre-permission explainer sheet in the established voice: "We'll only nudge you when Anna actually needs something."). CaseStore diffs incoming snapshots: new advisor follow-up → notification "Anna asked you something — 'Need your January payslip'"; item flagged → "One document needs another look"; draft ready → "Your return is ready to review — €1,286 estimated refund". Foreground presentation enabled (banner+sound) so the panel SEES the banner drop when the advisor acts in the browser. Background nudge: on scenePhase .background with missing required items, schedule one calm reminder ("3 documents left — most people finish in 15 minutes", 30s delay for demo purposes, cancelled on return).
**B. Scan experience:** replace the bare "Take a photo" with a mock document scanner sheet — dark viewfinder, corner brackets, document outline that "locks on" (spring animation), shutter → flash → cropped preview with "Use this" / "Retake" → uploads. Clearly a prototype affordance (simulator has no camera) but sells the native story.
**C. Where-to-find guidance:** item detail gains a "Where do I find this?" disclosure per item (steps with icons, e.g. Lohnsteuerbescheinigung: employer portal/HR email/February post pile; ALG-I: arbeitsagentur.de → Postfach; Steuer-ID: Bundeszentralamt letter/payslip top-right/Finanzamt reissue link).
**D. Expat FAQ:** "Questions everyone asks" screen reachable from case home footer + liability result ("More questions? We wrote them down."): 6 Q&As in plain English (Do I file every year? Steuer-ID vs Steuernummer? What is Progressionsvorbehalt — why benefits raise your rate; Can I file in English? What if I miss 31 July? — calm: with an advisor, extensions exist; Will this affect my visa? — no, filing correctly helps; What refund is typical? — €1,095 average). Each answer ends with the reassurance pattern ("Anna handles this — you just share the documents").
**E. Follow-up UX polish:** answered state shows Anna's acknowledgment; empty state improved.

New reducer needs: none (A reads state diffs client-side; B–E are pure UI/content). Tests: notification manager unit-testable diff function (Swift test on snapshot-diff → nudge list); UI verified via env-hook screenshots READ back.

### Task 17: Advisor multi-case workspace

Queue becomes a real workspace: seeded static cases get richer rows (client, year, status chip, deadline distance, last activity, waiting-on indicator), sorted by deadline proximity; header adds status filter pills with counts (All / Waiting on client / Ready / In review) and a compact workload summary ("4 cases · 1 ready to start · 2 waiting on clients"). Amara's live case stays the only interactive one — clicking a static case shows a lightweight read-only detail pane (seeded content) so the world feels populated, with a "demo case" pin on Amara. Communication panel: follow-up composer templates get a "recently used" hint; client questions get quick-reply buttons (one-click canned answers in Anna's voice, dispatching ANSWER_FOLLOW_UP with from-advisor reply — check reducer: ANSWER_FOLLOW_UP currently sets reply on consumer follow-ups; advisor answering consumer questions uses the same action — verify and reuse). Tests: filter logic, workload counts, quick-reply dispatch.

### Task 18: Hub — references & patterns borrowed (the "ammo")

New hub section "8. References — patterns borrowed (and rejected)": TurboTax (refund-as-hero on review — borrowed; their upsell interstitials — explicitly rejected as trust-corrosive at hand-off), N26/Monzo (one-decision-per-screen onboarding), Uber (live status timeline as anxiety killer → our 5-stage state machine), Airbnb (two-sided status mirroring — host sees what guest sees), WhatsApp (delivery receipts → document receipt states: Sent/Checked ✓), Stripe (pay-on-approval trust sequencing), Duolingo (momentum/streak psychology — borrowed calmly, no gamification pressure). Each: pattern, where it lives in our app, why. Also add the persona-agent method note to AI-log (Task 19 will run it — write the section stub now, fill findings after T19). Test: section renders + a reference row asserts.

### Task 19: Persona-agent reviews (Amara + Anna)

Spawn two agents in role (controller does this, not an implementer subagent): each gets a full brief (case PDF context, persona bio from spec §2, what the app does, screenshot set captured fresh via the env hooks + relay driving) and reviews IN CHARACTER: walk my journey, where do I hesitate, what's missing, what would delight me, what would make me trust/distrust — plus 5 concrete asks. Controller synthesizes both reviews into: (a) a ranked fix/add list (feeds Task 20), (b) a hub AI-log entry documenting the method with 2–3 verbatim quotes, (c) persona-review artifacts saved to docs/superpowers/reviews/ (committed — they're presentation material).

### Task 20: Polish iterations (5–10 rounds, screenshot-driven)

Loop until quality plateaus (min 5 rounds): each round = capture full screenshot walk (all consumer screens via hooks + relay states, advisor via browser build if possible) → READ every image hunting for: clipped text, spacing rhythm breaks, inconsistent paddings, weak hierarchy, un-natural copy, missing states → fix worst 3–5 findings → re-verify suites → commit `polish: round N — <summary>`. Include persona-agent asks from T19 in the backlog. Also fix deferred minors from the Phase 1 ledger that fit (en-locale date formatting, PrepareControls typing). Final round: re-capture hub flow-map screenshots so the hub shows the polished app, run ALL verification gates, update README if commands changed.

---

## Self-review
- Directives coverage: font→15, nudges/scan/find/FAQ→16, advisor multi-case+comm→17, references→18, persona agents→19, 5–10 iterations→20. Onboarding already delivered in Phase 1 (T10); T20 polishes it.
- No reducer changes required; relay protocol untouched — sync demo stays stable through Phase 2.
- Licensing: trial fonts never committed (gitignore verified in T15 step).
