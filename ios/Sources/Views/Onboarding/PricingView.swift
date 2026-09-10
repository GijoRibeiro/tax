import SwiftUI

// The commitment screen: start now, pay when you approve. The price is not the headline;
// the moment it is charged is. A three-step timeline says when money moves, two plain
// check rows say what you get, then "Start for free".
struct PricingView: View {
    @Environment(CaseStore.self) private var store
    let commit: () -> Void

    // When money moves, as three steps. The price is in the last one, where it belongs.
    private let moments: [TimelineStep] = [
        TimelineStep(id: 0, title: "Today: you start", detail: "Free. Your advisor's place is reserved for you."),
        TimelineStep(id: 1, title: "When you send your documents", detail: "We save your card. Nothing is charged."),
        TimelineStep(id: 2, title: "When you approve your return", detail: "€119.99, one flat price. Then your advisor files it."),
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    ScreenTitle(text: "Start now, pay when you approve.")
                        .padding(.top, ScreenTitle.rootTopInset)
                    Text("Your advisor prepares and files your return. You see it first, and only then is anything charged.")
                        .font(brandFont(.body, .book, relativeTo: .body))
                        .ink("--color-ink-soft")
                        .padding(.bottom, 12)

                    StepTimeline(steps: moments, currentIndex: 0, compact: true) { EmptyView() }

                    Rectangle().fill(store.tokens.color("--color-line")).frame(height: 1)
                        .padding(.vertical, 12)

                    VStack(alignment: .leading, spacing: 18) {
                        FactRow(title: "Prepared and filed by a certified advisor", detail: "A real person does the work, not a form")
                        FactRow(title: "Everything in English", detail: "Questions answered in plain words")
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, BottomActions<EmptyView>.scrollInset)
            }
            BottomActions {
            VStack(spacing: 14) {
                PrimaryButton(title: "Start for free", action: commit)
                Text("No card needed today. Cancel any time before you approve.")
                    .font(brandFont(.small, .book, relativeTo: .caption))
                    .ink("--color-ink-soft")
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: .infinity)
            }
            }
        }
    }
}
