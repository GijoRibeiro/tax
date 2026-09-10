import SwiftUI

// A hidden gallery: one catalog component at a time, centred on the muted grey canvas,
// no status bar. Launched with GALLERY=<name> (and OFFLINE=1) by scripts/specimens.sh,
// which screenshots the simulator and crops to the component, so the hub can show the
// real SwiftUI pixels of every component and regenerate them with one command.
struct ComponentGalleryView: View {
    @Environment(CaseStore.self) private var store
    let name: String

    static let names = [
        "primary-button", "secondary-and-icon", "chips", "status-pills", "card-row-add", "card-row-chip",
        "chapter-tiles", "fact-rows", "result-block", "timeline-compact", "timeline-card", "screen-title",
        "headline", "advisor-card", "advisor-card-question", "avatars-and-marks", "chat-bubbles", "section-label",
    ]

    private var steps: [TimelineStep] {
        [TimelineStep(id: 0, title: "Started, matched with Anna", detail: "Your case is open and assigned."),
         TimelineStep(id: 1, title: "You send the documents", detail: "2 of 5 filled so far."),
         TimelineStep(id: 2, title: "Anna prepares your return", detail: "Usually a few days.")]
    }

    private var identityItems: [ChecklistItem] { store.state.items.filter { $0.group == .identity } }
    private var filledItems: [ChecklistItem] {
        store.state.items.filter { $0.group == .employment }.map { var i = $0; i.status = .uploaded; return i }
    }

    @ViewBuilder private var specimen: some View {
        switch name {
        case "primary-button":
            PrimaryButton(title: "Send to Anna") {}
        case "secondary-and-icon":
            HStack(spacing: 10) {
                SecondaryButtonLabel(title: "Choose from library")
                PrimaryIconButton(systemImage: "camera", label: "Take a photo") {}
            }
        case "chips":
            VStack(alignment: .leading, spacing: 10) {
                HStack(spacing: 8) {
                    Chip(label: "Sent", tone: .green); Chip(label: "Optional", tone: .neutral); Chip(label: "Fix", tone: .issue)
                }
                HStack(spacing: 8) {
                    Chip(label: "High impact", tone: .indigo)
                    Chip(label: "✓ Checked", tone: .onLime).padding(6)
                        .background(store.tokens.color("--color-lime-soft"), in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-tag")))
                }
            }
        case "status-pills":
            HStack(spacing: 8) {
                StatusPillView(status: .needed); StatusPillView(status: .uploaded)
                StatusPillView(status: .verified); StatusPillView(status: .issue)
            }
        case "card-row-add":
            CardRow(systemImage: "person.text.rectangle", title: "Photo ID", subtitle: "Passport or ID card") { AddCircle() }
        case "card-row-chip":
            CardRow(systemImage: "number", title: "Your tax ID", subtitle: "Steuer-ID") { Chip(label: "Sent", tone: .green) }
        case "chapter-tiles":
            HStack(spacing: 10) {
                ChapterTile(symbol: "person", title: "About you", items: identityItems)
                ChapterTile(symbol: "briefcase", title: "Your job", items: filledItems)
            }
        case "fact-rows":
            VStack(alignment: .leading, spacing: 18) {
                FactRow(title: "Prepared and filed by a certified advisor", detail: "A real person does the work, not a form")
                FactRow(title: "Anna checks each document and says if a photo needs a retake.", systemImage: "checkmark.seal", quiet: true)
            }
        case "result-block":
            ResultBlock(label: "Ready to send", amount: "5 of 5", line: "Every document Anna asked for is in.")
        case "timeline-compact":
            StepTimeline(steps: steps, currentIndex: 1, compact: true) { EmptyView() }
        case "timeline-card":
            StepTimeline(steps: steps, currentIndex: 1) { PrimaryButtonLabel(title: "Continue") }
        case "screen-title":
            VStack(alignment: .leading, spacing: 6) {
                Text("Tax return 2025 · Due 31 July").font(brandFont(.secondary, .medium, relativeTo: .subheadline)).ink("--color-ink-soft")
                ScreenTitle(text: "Yes, you need to file this year.")
            }
        case "headline":
            (Text("Nice one, Betina. ") + Text("Now Anna needs a few things about your income.").foregroundColor(store.tokens.color("--color-success")))
                .font(brandFont(.display, .bold, relativeTo: .title))
                .fixedSize(horizontal: false, vertical: true)
        case "advisor-card":
            FlatCard { AdvisorBadge() }
        case "advisor-card-question":
            FlatCard { AdvisorBadge(note: "Can you also send page 2, if there was one?") }
        case "avatars-and-marks":
            HStack(spacing: 14) {
                AdvisorPortrait(size: 48); InitialsAvatar(initials: "JK", size: 48)
                CheckCircle(); AddCircle()
                IconCircleButton(systemImage: "bubble.left", label: "Message") {}
                IconCircleButton(systemImage: "bubble.left", label: "Reply", prominent: true) {}
            }
        case "chat-bubbles":
            VStack(alignment: .leading, spacing: 10) {
                ChatBubble(from: .advisor, text: "Can you also send page 2, if there was one?")
                ChatBubble(from: .consumer, text: "Yes, sent it just now.")
            }
        case "section-label":
            VStack(alignment: .leading, spacing: 12) {
                SectionLabel(text: "What happens next")
                FactRow(title: "She prepares your return, usually within a few days.", systemImage: "doc.text", quiet: true)
            }
        default:
            Text("Unknown specimen: \(name)")
        }
    }

    var body: some View {
        ZStack {
            store.tokens.color("--color-surface-muted").ignoresSafeArea()
            specimen
                .frame(width: 340)
        }
        .statusBarHidden(true)
    }
}
