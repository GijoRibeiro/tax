import SwiftUI

// A stand-in for the questions Taxfix already asks about the year (job status, benefits).
// The prototype skips them because that moment is not the chosen slice, but the result
// screen depends on their answers, so this screen says where they would be. "Skip" goes
// to the result; "Answer them instead" runs the three real questions that still exist.
struct QuestionsPlaceholderView: View {
    @Environment(CaseStore.self) private var store
    let skip: () -> Void
    let answer: () -> Void

    private let questions: [OnboardingStep] = [.q1, .q2, .q3]

    var body: some View {
        ZStack(alignment: .bottom) {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Chip(label: "Prototype: this step is skipped", tone: .neutral)
                        .padding(.top, ScreenTitle.rootTopInset)
                    ScreenTitle(text: "A few questions about your 2025.")
                    Text("Taxfix already asks these. The answers are what the next screen is built on, so in the real product this is where they happen.")
                        .font(brandFont(.body, .book, relativeTo: .body))
                        .ink("--color-ink-soft")
                        .padding(.bottom, 12)

                    VStack(alignment: .leading, spacing: 18) {
                        ForEach(questions, id: \.rawValue) { step in
                            if let q = LIABILITY_QUESTIONS[step] {
                                FactRow(title: q.title, detail: q.options.joined(separator: " · "), systemImage: "questionmark.circle")
                            }
                        }
                    }
                }
                .padding(.horizontal, 24)
                .padding(.bottom, BottomActions<EmptyView>.scrollInset)
            }
            BottomActions {
                VStack(spacing: 12) {
                    PrimaryButton(title: "Skip the questions", action: skip)
                    Button(action: answer) { SecondaryButtonLabel(title: "Answer them instead") }
                        .buttonStyle(.plain)
                }
            }
        }
    }
}
