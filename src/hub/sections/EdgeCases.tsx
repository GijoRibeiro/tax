interface ShippedEdge {
  scenario: string
  whatTheAppDoes: string
  howToTrigger: string
  rationale: string
}

// Spec §6, nine shipped edge behaviors. Copied faithfully; "how to trigger"
// notes are written against the real built app (routes, labels, copy as shipped).
const SHIPPED_EDGES: ShippedEdge[] = [
  {
    scenario: 'Relay offline (technical failure)',
    whatTheAppDoes:
      "The topbar pip goes amber \"Live sync offline, retrying\"; Betina's case detail shows a banner and disables her actions. Local (non-Betina) cases are unaffected, they don't need the relay. Auto-reconnect with backoff; pip returns to green, banner clears.",
    howToTrigger:
      "Stop the relay (kill server/relay.mjs, or Ctrl-C the npm run demo process) while the advisor app is open. The topbar pip flips amber immediately; open Betina's case (Cases → \"Live demo\" badge) to see the \"Live sync offline. Betina's phone can't see changes right now. Reconnecting…\" banner with her controls disabled. Restart the relay to watch it reconnect.",
    rationale:
      "The phone already falls back to seeded state on the same failure, the two behaviors get told together on the hub.",
  },
  {
    scenario: 'Unresponsive client',
    whatTheAppDoes:
      'A case with no client activity for >14 days and missing required docs shows a Stalled marker on Today and in the Cases table; case detail offers a one-click Send a nudge (a reminder follow-up template: calm copy, deadline mention).',
    howToTrigger:
      'Open Today, the "At risk" strip shows a case with the amber "Stalled" badge; click "Send a nudge" right there, or open the case and use the same "Send a nudge" button under the client header.',
    rationale: "Chasing silence is an advisor's most common real task.",
  },
  {
    scenario: 'Repeat problem document',
    whatTheAppDoes:
      'Flagging the same item a second time changes the affordance, the app suggests "Request a different document instead," which routes straight into the existing request-document form.',
    howToTrigger:
      'Open Chen Wei\'s case, her Annual income statement is seeded already twice-flagged, so the row shows "Asked twice already, request a different document instead?" immediately, with no re-flag needed. Click "Request different document" and it jumps to and pre-fills "Request another document." (The same suggestion also appears mid-flow: flag any uploaded item once, have the client re-send it, then click "Flag issue" on it again.)',
    rationale: "Asking a third time for the same broken scan wastes both sides' time.",
  },
  {
    scenario: 'Unreadable upload',
    whatTheAppDoes:
      'Flag-issue gains preset reasons, "Can\'t open / password-protected," "Cut off / illegible," "Wrong document", plus a free note ("Something else" requires one).',
    howToTrigger:
      'On any uploaded item, click "Flag issue": the four reason chips appear. Pick one (or "Something else" and type a note) and Confirm, the item\'s status pill shows "Flagged: <reason>."',
    rationale: 'Preset reasons feed better client-side messaging than free text.',
  },
  {
    scenario: 'Deadline realities',
    whatTheAppDoes:
      'One seeded case is at risk (missing docs, deadline ~4 weeks out under the extended window); one carries Extension filed (deadline passed, calm "extension filed" chip, ties to the consumer FAQ that extensions exist with an advisor). Past 31 July without an extension filed, the cell says the advised window runs to 30 April 2027, in warning tone. No countdown-panic anywhere.',
    howToTrigger:
      'Cases table, sorted by Deadline: the at-risk case shows a warm-toned day count in the Deadline column; the extension-filed case shows "passed · extension filed" in warning (not issue) tone with an "Extension filed" status chip.',
    rationale: 'With an advisor, extensions exist, the tone has to match that, not alarm.',
  },
  {
    scenario: 'Withdrawn client',
    whatTheAppDoes: 'One seeded case is On hold, client withdrew (read-only, reason note, Reopen affordance).',
    howToTrigger:
      'Open the Cases table and find the case with the "On hold" chip; open it, case detail shows an info banner "On hold, client withdrew," the reason note, and a "Reopen case" button that clears the hold.',
    rationale: "Real caseloads contain dead cases; a tool that can't represent them lies.",
  },
  {
    scenario: 'Capacity loop',
    whatTheAppDoes:
      'When Accepting new cases is ON, an incoming case request card appears on Today (client, situation summary, estimated effort) with Accept (adds a real waiting-on-client case to the table) / Decline (confirm dialog, then it leaves). Toggle OFF and no requests come.',
    howToTrigger:
      'Settings → "Accepting new cases" toggle (on by default in the seed) shows the "New case request" card on Today. Click Accept to add the case to Cases, or Decline to open the "Decline this case? Taxfix will route it to another advisor." dialog and confirm. Turn the toggle off in Settings to make the request disappear.',
    rationale: "The marketplace's supply side is a real workflow, not a static roster.",
  },
  {
    scenario: 'Storage resilience',
    whatTheAppDoes: 'Corrupt or legacy localStorage falls back through a shape-guard to a clean seed, never a broken screen.',
    howToTrigger:
      "In devtools: localStorage.setItem('taxfix-advisor-workspace-v2', 'not json') then reload /advisor, the app loads the clean seeded caseload instead of crashing.",
    rationale: 'Same guarantee the consumer store already makes.',
  },
  {
    scenario: 'Empty/edge UI states',
    whatTheAppDoes:
      'Inbox zero, search with no matches, a filter with zero cases, an empty notes field, an empty notification tray, all designed, none blank.',
    howToTrigger:
      'Answer every open follow-up to see Inbox\'s "Inbox zero. Every question answered. Enjoy it while it lasts."; search Cases for gibberish to see "No cases here, nice." with Clear filters; search Clients for a name that doesn\'t exist to see "No clients match “…”."; open the bell with nothing pending to see "Nothing new."',
    rationale: "These aren't edge cases in a demo, they're daily reality in a 60-case caseload.",
  },
]

interface DeferredEdge {
  scenario: string
  whatProductionNeeds: string
  whyDeferred: string
}

// Spec §7, eight documented-but-not-built production concerns, verbatim scenario list.
const DEFERRED_EDGES: DeferredEdge[] = [
  {
    scenario: 'GDPR retention & deletion flows',
    whatProductionNeeds:
      'A retention-policy engine that auto-purges filed cases after the statutory window, a client-initiated "delete my data" request, and an audit trail proving compliance.',
    whyDeferred:
      "No real personal data exists in this prototype (seeded fictional clients), and retention windows need legal sign-off before there's anything real to build against.",
  },
  {
    scenario: 'Virus/malware scanning on upload',
    whatProductionNeeds:
      'Server-side scanning (e.g. ClamAV, or a vendor API) on every uploaded document before an advisor can open it, plus a quarantine/reject path.',
    whyDeferred: "Uploads here are simulated (styled placeholders, not real files), there's no real file to scan yet.",
  },
  {
    scenario: 'Identity fraud signals',
    whatProductionNeeds:
      "Document-forgery detection, cross-referencing a client's declared identity against the documents they submit, and an escalation path to a trust & safety team.",
    whyDeferred:
      'A specialist compliance capability, not a UI pattern, it belongs in a dedicated fraud pipeline, not an advisor workspace prototype.',
  },
  {
    scenario: 'Multi-advisor reassignment and vacation handover',
    whatProductionNeeds:
      "A caseload rebalancing flow: reassigning a case (with full history) to a covering advisor, visibility into who owns what, and client notification of the handover.",
    whyDeferred:
      'This spec deliberately scopes to one advisor, one seat (§12 cuts real-time multi-advisor presence), reassignment needs a multi-advisor data model this prototype was never built with.',
  },
  {
    scenario: 'ELSTER submission failure/retry',
    whatProductionNeeds:
      "A real integration with Germany's ELSTER tax portal, submission status polling, and a retry/error-recovery flow when the government API rejects or times out.",
    whyDeferred: '"Filed" here is a local state transition, not a government API call, there is no real submission to fail yet.',
  },
  {
    scenario: 'Partial-year cross-border income',
    whatProductionNeeds:
      'Tax logic for someone who worked in multiple countries within one filing year, treaty rules, apportionment, foreign-income declarations.',
    whyDeferred:
      'The seeded caseload is deliberately simple (single-employer, single-country cases) so every filter and stat has believable contents without needing real cross-border tax logic behind it.',
  },
  {
    scenario: 'Advisor SLA breach escalation',
    whatProductionNeeds:
      'Response-time tracking against a promised SLA, with automatic escalation to a manager or backup advisor when a case is about to breach it.',
    whyDeferred:
      'SLA enforcement needs real elapsed-time data across a live caseload over weeks, a seeded demo caseload cannot meaningfully simulate that.',
  },
  {
    scenario: 'Push-notification delivery failure',
    whatProductionNeeds:
      "Delivery confirmation and retry for push notifications to the advisor's phone or desktop, plus a fallback channel (email, SMS) when push silently fails.",
    whyDeferred: "The prototype's \"notification\" is the in-app bell only, no real push infrastructure exists to fail.",
  },
]

export function EdgeCases() {
  return (
    <section id="edge-cases" className="hub-section">
      <h2 className="hub-section__title">Edge cases</h2>
      <p>
        A Steuerberaterin running 60 seasonal cases lives in these, not the happy path. Two tables: what the app
        actually ships and how to make it happen live, then what production would need for the cases we
        deliberately left out of a prototype's scope.
      </p>

      <h3 className="hub-section__subtitle">Built and demonstrable</h3>
      <div className="hub-table-scroll">
        <table className="hub-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>What the app does</th>
              <th>How to trigger in the demo</th>
              <th>Rationale</th>
            </tr>
          </thead>
          <tbody>
            {SHIPPED_EDGES.map(row => (
              <tr key={row.scenario}>
                <td>{row.scenario}</td>
                <td>{row.whatTheAppDoes}</td>
                <td>{row.howToTrigger}</td>
                <td>{row.rationale}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="hub-section__subtitle">Named, deliberately not built</h3>
      <div className="hub-table-scroll">
        <table className="hub-table">
          <thead>
            <tr>
              <th>Scenario</th>
              <th>What production needs</th>
              <th>Why deferred</th>
            </tr>
          </thead>
          <tbody>
            {DEFERRED_EDGES.map(row => (
              <tr key={row.scenario}>
                <td>{row.scenario}</td>
                <td>{row.whatProductionNeeds}</td>
                <td>{row.whyDeferred}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
