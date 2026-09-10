import SwiftUI

// Catalog chip: pill, 14 medium. Green on the pale green surface for good news,
// neutral for "not yet", issue red for problems, indigo for emphasis
// ("High impact" in the Taxfix app).
struct Chip: View {
    enum Tone { case green, neutral, issue, indigo, onLime }
    @Environment(CaseStore.self) private var store
    let label: String
    var tone: Tone = .green

    private var colors: (background: Color, text: Color) {
        switch tone {
        case .green: (store.tokens.color("--color-info-bg"), store.tokens.color("--color-accent"))
        case .neutral: (store.tokens.color("--color-surface"), store.tokens.color("--color-ink-soft"))
        case .issue: (store.tokens.color("--color-issue").opacity(0.12), store.tokens.color("--color-issue"))
        case .indigo: (store.tokens.color("--color-chip-indigo-bg"), store.tokens.color("--color-chip-indigo-ink"))
        case .onLime: (store.tokens.color("--color-surface"), store.tokens.color("--color-accent"))
        }
    }

    var body: some View {
        Text(label)
            .font(brandFont(.small, .medium, relativeTo: .caption))
            .padding(.horizontal, 12).padding(.vertical, 6)
            .background(colors.background, in: Capsule())
            .foregroundStyle(colors.text)
    }
}
