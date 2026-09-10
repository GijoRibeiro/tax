import Foundation
import Observation

@Observable final class CaseStore {
    var state: CaseState = .seed()
    var connected = false
    var metAnna = false
    // Guards the one-time pre-permission explainer sheet (NotificationPermissionSheet),
    // shown right after Meet-Anna is dismissed. Resets alongside `metAnna` on RESET so a
    // fresh demo run can show it again.
    var offeredNotificationPermission = false
    /// Set by the demo menu before a jump: the next onboarding snapshot keeps the
    /// one-time sheets dismissed instead of re-arming them.
    var skipReArmOnce = false
    /// Bumped to ask the case navigation stack to pop back to the home.
    var popToRootCount = 0
    func popToRoot() { popToRootCount += 1 }
    /// "Next document" swaps the top of the case stack instead of stacking, so Back
    /// always returns to the list, not to the previous document.
    var replaceTopRoute: CaseRoute?
    var replaceTopCount = 0
    func replaceTop(with route: CaseRoute) { replaceTopRoute = route; replaceTopCount += 1 }
    /// Push several routes at once: a chapter and its first open document, so a tile
    /// lands on the document and Back still shows the list.
    var pushRoutes: [CaseRoute] = []
    var pushCount = 0
    func push(_ routes: [CaseRoute]) { pushRoutes = routes; pushCount += 1 }
    /// Set by the demo menu for the duration of a stage jump. While true, the transient
    /// onboarding snapshot from the RESET that starts every jump is not shown and does not
    /// remount the app, so the jump lands in place instead of flashing through Welcome.
    var demoJumping = false
    // Bumped on every reset (local tap or relay RESET) so the view tree can remount
    // and land on Welcome even when the phase was already onboarding, e.g. resetting
    // from the pricing screen.
    var resetCount = 0
    let tokens = TokenStore.shared
    // Injectable nudge sink, production wiring posts real local notifications
    // via NudgeNotifier; tests replace this to capture emitted nudges without
    // touching UNUserNotificationCenter.
    var onNudges: (([Nudge]) -> Void)? = { NudgeNotifier.shared.post($0) }

    private var task: URLSessionWebSocketTask?
    private let url = URL(string: "ws://127.0.0.1:8787")!
    private var shouldConnect: Bool
    // The very first "state" snapshot after a cold launch is a catch-up (whatever the
    // relay already holds), not something the person just watched happen, diffing it
    // against the placeholder seed() would re-fire every pre-existing nudge (an open
    // follow-up, a flagged item, etc.) on every relaunch. Suppressed once, here; a
    // dropped-and-restored connection later is deliberately NOT re-suppressed, since
    // catching up on what happened while offline is exactly what nudges are for.
    private var hasSyncedOnce = false

    init(connect: Bool = true) {
        shouldConnect = connect
        // Demo/screenshot affordance ONLY: when CASE_SCREEN is set (simulator launched to
        // jump straight into a hand-off sub-screen, see CaseRootView), skip the one-time
        // Meet Anna intro sheet so the target screen is visible immediately. Set here
        // (rather than on appear) to avoid a race with the sheet's first render.
        let env = ProcessInfo.processInfo.environment
        if env["CASE_SCREEN"] != nil || env["DEMO_MENU"] != nil { metAnna = true; offeredNotificationPermission = true }
        if connect { open() }
    }

    private func open() {
        let task = URLSession.shared.webSocketTask(with: url)
        self.task = task
        task.resume()
        receive(on: task)
    }

    private func receive(on task: URLSessionWebSocketTask) {
        task.receive { [weak self] result in
            guard let self else { return }
            switch result {
            case .success(let message):
                if case .string(let text) = message { Task { @MainActor in self.handle(text) } }
                self.receive(on: task)
            case .failure:
                Task { @MainActor in
                    self.connected = false
                    try? await Task.sleep(for: .seconds(1))
                    if self.shouldConnect { self.open() }
                }
            }
        }
    }

    private struct Envelope: Decodable {
        let kind: String
        let state: CaseState?
        let overrides: [String: String]?
    }

    @MainActor private func handle(_ text: String) {
        guard let env = try? JSONDecoder().decode(Envelope.self, from: Data(text.utf8)) else { return }
        connected = true
        if env.kind == "state", let s = env.state { ingest(snapshot: s) }
        if env.kind == "tokens", let o = env.overrides { tokens.overrides = o }
    }

    /// Applies one incoming relay state snapshot: diffs it against whatever
    /// `state` currently holds to derive nudges, then replaces `state`. Split
    /// out of `handle(_:)` (which only decodes the socket envelope) so tests
    /// can drive a sequence of snapshots directly, without a live socket or
    /// UNUserNotificationCenter, and assert on `onNudges`.
    //
    // Diff BEFORE replacing state, so `state` here is still what the person was
    // just looking at, the nudge rules need the "before" snapshot to detect
    // what's new. Skipped on the very first snapshot since launch: that first
    // snapshot is a cold-launch relay catch-up (whatever the relay already
    // holds), not something the person just watched happen, see `hasSyncedOnce`.
    func ingest(snapshot: CaseState) {
        if hasSyncedOnce { onNudges?(nudges(from: state, to: snapshot)) }
        hasSyncedOnce = true
        state = snapshot
        // A relay RESET returns the demo to the start; re-arm the one-time
        // Meet-Anna intro sheet (and the notification-permission prompt that
        // follows it) for the next run.
        if snapshot.phase == .onboarding {
            // A demo-menu jump passes through RESET on its way to a later stage; it must
            // not re-arm the one-time sheets or they would cover the stage it lands on,
            // and it must not remount the app.
            if demoJumping { return }
            if skipReArmOnce {
                skipReArmOnce = false
            } else {
                metAnna = false
                offeredNotificationPermission = false
            }
            resetCount += 1
        } else if demoJumping {
            demoJumping = false
        }
    }

    func send(_ action: CaseAction) {
        if case .reset = action, !demoJumping { resetCount += 1 }
        guard connected, let task,
              let data = try? JSONSerialization.data(withJSONObject: ["kind": "action", "action": action.json]),
              let text = String(data: data, encoding: .utf8) else {
            applyLocally(action)
            return
        }
        task.send(.string(text)) { [weak self] error in
            if error != nil { Task { @MainActor in self?.applyLocally(action) } }
        }
    }

    // Demo fallback ONLY: the reducer of record runs on the relay. This keeps the
    // phone usable if the socket is down mid-panel, it is not business logic.
    func applyLocally(_ action: CaseAction) {
        switch action {
        case let .uploadItem(itemId, fileName):
            if let i = state.items.firstIndex(where: { $0.id == itemId }) {
                state.items[i].status = .uploaded
                state.items[i].uploadedFileName = fileName
                state.items[i].issueNote = nil
            }
        case let .askAdvisor(itemId, question):
            state.followUps.append(FollowUp(id: UUID().uuidString, itemId: itemId, from: .consumer,
                                            message: question, createdAt: "", status: .open, reply: nil))
        case let .answerFollowUp(followUpId, reply):
            if let i = state.followUps.firstIndex(where: { $0.id == followUpId }) {
                state.followUps[i].status = .answered
                state.followUps[i].reply = reply
            }
        case .commitCase: state.phase = .sharing; state.matchedAt = ISO8601DateFormatter().string(from: Date())
        case let .submitDocuments(cardLast4):
            if state.allRequiredIn, !cardLast4.isEmpty {
                let now = ISO8601DateFormatter().string(from: Date())
                state.submittedAt = now; state.cardLast4 = cardLast4; state.cardHeldAt = now
            }
        case .approveReturn: state.phase = .approved
        case .reset: state = .seed(); metAnna = false; offeredNotificationPermission = false
        case let .verifyItem(itemId):
            if let i = state.items.firstIndex(where: { $0.id == itemId }) { state.items[i].status = .verified }
        case .startPreparing: state.phase = .preparing
        case let .sendDraft(draft): state.draft = draft; state.phase = .awaitingApproval
        case .markFiled: state.phase = .filed; state.filedAt = ISO8601DateFormatter().string(from: Date())
        }
    }
}
