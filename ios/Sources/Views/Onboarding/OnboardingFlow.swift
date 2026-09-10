import SwiftUI
import Foundation

enum OnboardingStep: Int, CaseIterable { case welcome, questions, q1, q2, q3, result, howItWorks, pricing }

struct LiabilityQuestion {
    let title: String
    let subtitle: String
    let options: [String]
}

let LIABILITY_QUESTIONS: [OnboardingStep: LiabilityQuestion] = [
    .q1: LiabilityQuestion(
        title: "What was your job status in 2025?",
        subtitle: "This tells us which rules apply to you.",
        options: ["Employed all year", "Employed, with a gap", "Self-employed", "Student"]),
    .q2: LiabilityQuestion(
        title: "Did you receive unemployment benefits?",
        subtitle: "Arbeitslosengeld I, the payments from the Agentur für Arbeit between jobs.",
        options: ["Yes, for a few months", "Yes, all year", "No"]),
    .q3: LiabilityQuestion(
        title: "Anything else in 2025?",
        subtitle: "Last one, just so nothing surprises you later.",
        options: ["More than one employer", "Some freelance income", "None of these"]),
]

struct OnboardingFlow: View {
    @Environment(CaseStore.self) private var store
    // Demo/screenshot affordance ONLY, lets `xcrun simctl launch` jump straight to any
    // onboarding screen (welcome | questions | q1 | q2 | q3 | result | howItWorks | pricing) via the
    // ONBOARDING_STEP env var, since these screens are local UI state unreachable via
    // relay actions. An unset or invalid value falls back to normal behavior (.welcome).
    @State private var step: OnboardingStep = OnboardingFlow.initialStep()

    private static func initialStep() -> OnboardingStep {
        switch ProcessInfo.processInfo.environment["ONBOARDING_STEP"] {
        case "welcome": .welcome
        case "questions": .questions
        case "q1": .q1
        case "q2": .q2
        case "q3": .q3
        case "result": .result
        case "howItWorks": .howItWorks
        case "pricing": .pricing
        default: .welcome
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            Group {
                switch step {
                // The three liability questions stay in the code, behind a placeholder that
                // says where they live: this is a different drop-off than the one we chose,
                // so the demo skips them, but the result depends on their answers.
                case .welcome: WelcomeView { advance(.questions) }
                case .questions: QuestionsPlaceholderView(skip: { advance(.result) }, answer: { advance(.q1) })
                case .q1, .q2, .q3:
                    if let question = LIABILITY_QUESTIONS[step] {
                        LiabilityQuestionView(question: question) {
                            let next: OnboardingStep
                            if step == .q3 {
                                next = .result
                            } else if let candidate = OnboardingStep(rawValue: step.rawValue + 1) {
                                next = candidate
                            } else {
                                next = step // invalid, stay on the current step rather than crash
                            }
                            advance(next)
                        }
                    } else {
                        // Missing question data for this step, stay put rather than crash.
                        EmptyView()
                    }
                // How-it-works is skipped in the runway (still reachable via the hook): price comes right after the answer.
                case .result: LiabilityResultView { advance(.pricing) }
                case .howItWorks: HowItWorksView { advance(.pricing) }
                case .pricing: PricingView { store.send(.commitCase) }
                }
            }
            .transition(.asymmetric(insertion: .move(edge: .trailing).combined(with: .opacity),
                                    removal: .move(edge: .leading).combined(with: .opacity)))
        }
        .animation(.brand, value: step)
    }

    private func advance(_ to: OnboardingStep) { step = to }

    private var progressDots: some View {
        HStack(spacing: 6) {
            ForEach([OnboardingStep.result, .pricing], id: \.rawValue) { s in
                Circle()
                    .fill(s.rawValue <= step.rawValue ? store.tokens.color("--color-success") : store.tokens.color("--color-line"))
                    .frame(width: 7, height: 7)
            }
        }
        .padding(.top, 12)
        .accessibilityHidden(true)
    }
}
