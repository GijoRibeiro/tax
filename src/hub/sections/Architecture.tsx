export function Architecture() {
  return (
    <section id="architecture" className="hub-section">
      <h2 className="hub-section__title">How it is built</h2>
      <p>
        One set of rules for the case, written once and tested, and three screens that follow it: the phone, the
        advisor dashboard and this hub. That is what makes a change during the live session cheap.
      </p>
      <p>
        The consumer app is a native SwiftUI build in the iPhone simulator; the advisor dashboard and this hub stay
        web. Both send actions and receive state snapshots over a WebSocket relay. The relay is a thin Node sidecar
        that imports and runs <code>src/store/state.ts</code>, the same tested reducer used everywhere else. No
        business logic lives in Swift: the native app renders state, it never derives it. One source of truth, zero
        drift between platforms.
      </p>

      <pre className="hub-architecture-diagram">
        {`       SwiftUI app (simulator)          advisor + hub (browser)
              │  actions ▲ snapshots        │  actions ▲ snapshots
              └──────────┼──────────────────┘
                         ▼
              relay (node), runs src/store/state.ts
              the SAME tested reducer, one source of truth
                         ▲
                         │ 1 of 21 cases ('amara')
              advisor WorkspaceProvider, 21 seeded cases
              20 run that SAME reducer locally, in the browser
              only 'amara' round-trips the relay above`}
      </pre>

      <p>
        The advisor's caseload is not one case wearing a queue UI, it's a small local store,{' '}
        <code>WorkspaceProvider</code>, holding 21 cases. Twenty of them dispatch straight into the same
        reducer above and run entirely client-side, appended to a shared activity feed and persisted to{' '}
        <code>localStorage</code>. Exactly one, <code>'amara'</code>, is the relay-live case: her actions still go
        over the socket exactly as they do everywhere else, so the phone's demo stays byte-compatible. One
        reducer, one relay, and now one workspace store deciding per-case which of the two a dispatch belongs to.
      </p>

      <p>
        Two things this bought us in the last two days. The money model is a reducer change with tests, not a
        screen: <code>SUBMIT_DOCUMENTS</code> needs a
        card and saves it, <code>APPROVE_RETURN</code> charges it, and
        the advisor's chips follow without touching Swift. And the phone's demo menu replays the real actions
        through the relay to reach any stage, so what the panel sees is the product, not a mock of it. The relay
        keeps an allow-list of action types; a test checks it against the reducer, because one new action once
        slipped past it and silently did nothing.
      </p>
    </section>
  )
}
