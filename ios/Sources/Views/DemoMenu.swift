import SwiftUI

// The presenter's demo menu. Picks a stage of the journey and, for the sharing stage,
// how many documents are already in, then replays the real actions through the relay
// (RESET, COMMIT_CASE, UPLOAD_ITEM…, START_PREPARING, SEND_DRAFT, APPROVE_RETURN,
// MARK_FILED) so the phone, Anna's workspace and the hub all land on the same state.
// No state is computed here; the reducer of record stays on the relay.
struct DemoMenu: View {
    @Environment(CaseStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    enum Stage: Int, CaseIterable, Identifiable {
        case welcome, sharing, filled, sent, preparing, review, approved, filed
        var id: Int { rawValue }
        var title: String {
            switch self {
            case .welcome: "First access"
            case .sharing: "Sending documents"
            case .filled: "All filled, not sent"
            case .sent: "Sent to Anna"
            case .preparing: "Anna is preparing"
            case .review: "Ready to review"
            case .approved: "Approved"
            case .filed: "Filed"
            }
        }
        var line: String {
            switch self {
            case .welcome: "Welcome screen, nothing started."
            case .sharing: "Home with chapters still to fill."
            case .filled: "Every chapter green, \"Send to Anna\" showing."
            case .sent: "Handed over, Anna has not started."
            case .preparing: "Photo ID checked, return underway."
            case .review: "Draft with the refund, waiting for approval."
            case .approved: "Approved, Anna is filing."
            case .filed: "Filed, result shown."
            }
        }
        var symbol: String {
            switch self {
            case .welcome: "sparkles"
            case .sharing: "doc.badge.plus"
            case .filled: "checkmark.circle"
            case .sent: "paperplane.circle"
            case .preparing: "person.crop.circle"
            case .review: "eurosign.circle"
            case .approved: "hand.thumbsup"
            case .filed: "paperplane"
            }
        }
    }

    @State private var stage: Stage
    @State private var filled: Set<ItemGroup>
    @State private var synced: (Stage, Set<ItemGroup>)? = nil
    @AppStorage(HomeLayout.storageKey) private var homeLayoutRaw = HomeLayout.carousel.rawValue

    init() {
        _stage = State(initialValue: .sharing)
        _filled = State(initialValue: [])
    }

    private var requiredIds: [String] { store.state.requiredItems.map(\.id) }

    var body: some View {
        ZStack(alignment: .bottom) {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ScreenTitle(text: "Demo menu").padding(.top, ScreenTitle.rootTopInset)
                Text("Presenter only. Jumps every surface through the real actions.")
                    .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                    .ink("--color-ink-soft")
                    .padding(.bottom, 8)

                SectionLabel(text: "Where in the journey")
                ForEach(Stage.allCases) { s in
                    Button { stage = s } label: {
                        CardRow(systemImage: s.symbol, title: s.title, subtitle: s.line) {
                            if stage == s { CheckCircle() } else { hollow }
                        }
                    }
                    .buttonStyle(.plain)
                }

                if stage == .sharing {
                    SectionLabel(text: "Chapters already filled")
                        .padding(.top, 8)
                    ForEach(Chapter.all) { chapter in
                        Button {
                            if filled.contains(chapter.group) { filled.remove(chapter.group) } else { filled.insert(chapter.group) }
                        } label: {
                            CardRow(systemImage: chapter.symbol, title: chapter.title) {
                                if filled.contains(chapter.group) { CheckCircle() } else { hollow }
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }

                SectionLabel(text: "Home layout")
                    .padding(.top, 8)
                ForEach(HomeLayout.allCases, id: \.rawValue) { l in
                    Button { homeLayoutRaw = l.rawValue } label: {
                        CardRow(systemImage: l.symbol, title: l.title, subtitle: l.line) {
                            if homeLayoutRaw == l.rawValue { CheckCircle() } else { hollow }
                        }
                    }
                    .buttonStyle(.plain)
                }

            }
            .padding(.horizontal, 24)
            .padding(.bottom, BottomActions<EmptyView>.scrollInset)
        }
        BottomActions {
            VStack(spacing: 14) {
                PrimaryButton(title: "Apply") { apply() }
                Button("Close") { dismiss() }
                    .font(brandFont(.body, .bold, relativeTo: .body))
                    .ink("--color-accent")
                    .frame(maxWidth: .infinity)
            }
        }
        }
        .background(store.tokens.color("--color-surface").ignoresSafeArea())
        .onAppear(perform: syncFromState)
    }

    private var hollow: some View {
        Circle()
            .strokeBorder(store.tokens.color("--color-line"), lineWidth: 2)
            .frame(width: 16, height: 16)
            .frame(width: 28, height: 28)
    }

    // Preselect what the app is showing now, so Apply without changes is a no-op jump.
    private func syncFromState() {
        switch store.state.phase {
        case .onboarding: stage = .welcome
        case .sharing: stage = store.state.allRequiredIn ? (store.state.submitted ? .sent : .filled) : .sharing
        case .preparing: stage = .preparing
        case .awaitingApproval: stage = .review
        case .approved: stage = .approved
        case .filed: stage = .filed
        }
        filled = Set(Chapter.all.filter { chapter in
            let items = store.state.items.filter { $0.group == chapter.group }
            return !items.isEmpty && items.allSatisfy { $0.status == .uploaded || $0.status == .verified }
        }.map(\.group))
        synced = (stage, filled)
    }

    private func apply() {
        // Nothing changed (say, only the home layout was switched): just close. Replaying
        // the stage would pass through RESET and look like a restart.
        if let synced, synced == (stage, filled) { dismiss(); return }
        var actions: [CaseAction] = [.reset]
        if stage != .welcome { actions.append(.commitCase) }
        let uploads = { (ids: [String]) in ids.map { CaseAction.uploadItem(itemId: $0, fileName: "demo-\($0).jpg") } }
        switch stage {
        case .welcome:
            break
        case .sharing:
            actions += uploads(store.state.items.filter { filled.contains($0.group) }.map(\.id))
        case .filled:
            actions += uploads(requiredIds)
        case .sent:
            actions += uploads(requiredIds)
            actions.append(.submitDocuments(cardLast4: "4242"))
        case .preparing, .review, .approved, .filed:
            actions += uploads(requiredIds)
            actions.append(.submitDocuments(cardLast4: "4242"))
            if let first = requiredIds.first { actions.append(.verifyItem(itemId: first)) }
            actions.append(.startPreparing)
            if stage.rawValue >= Stage.review.rawValue {
                actions.append(.sendDraft(ReturnDraft(income: "52,400 €", taxPaid: "9,870 €", deductions: "2,310 €",
                                                      refundEstimate: "1,184 €", note: nil)))
            }
            if stage.rawValue >= Stage.approved.rawValue { actions.append(.approveReturn) }
            if stage == .filed { actions.append(.markFiled) }
        }
        store.skipReArmOnce = stage != .welcome
        store.metAnna = stage != .welcome
        store.offeredNotificationPermission = stage != .welcome
        // Land in place: the RESET at the start of the replay is not shown.
        store.demoJumping = stage != .welcome
        actions.forEach { store.send($0) }
        dismiss()
    }
}
