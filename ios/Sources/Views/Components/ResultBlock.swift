import SwiftUI

// The result block from the app's assessment screen: soft lime, small-caps label,
// the amount big in dark green, one line under it.
struct ResultBlock: View {
    @Environment(CaseStore.self) private var store
    let label: String
    let amount: String
    let line: String

    var body: some View {
        VStack(spacing: 6) {
            Text(label.uppercased())
                .font(brandFont(.caption, .medium, relativeTo: .caption))
                .kerning(0.8)
                .ink("--color-accent")
            Text(amount)
                .font(brandFont(.hero, .black, relativeTo: .largeTitle))
                .ink("--color-accent")
            Text(line)
                .font(brandFont(.body, .book, relativeTo: .body))
                .ink("--color-ink")
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 28)
        .padding(.horizontal, 20)
        .background(store.tokens.color("--color-lime-soft"),
                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
    }
}

// A "More info" row: icon, label, chevron, hairline underneath. Plain, on white.
struct LinkRow: View {
    @Environment(CaseStore.self) private var store
    let systemImage: String
    let label: String

    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 16) {
                Image(systemName: systemImage).font(iconFont(TextRole.subheading.rawValue, weight: .light)).frame(width: 26).ink("--color-ink-soft")
                Text(label).font(brandFont(.body, .book, relativeTo: .body)).ink("--color-ink")
                Spacer()
                Image(systemName: "chevron.right").font(iconFont(TextRole.secondary.rawValue, weight: .medium)).ink("--color-ink-soft")
            }
            .padding(.vertical, 18)
            Rectangle().fill(store.tokens.color("--color-line")).frame(height: 1)
        }
    }
}

// A benefit, a reason or a fact as a plain row: a check circle (or a thin icon when
// `systemImage` is given) left, title and an optional detail line. No card and no
// hairline: a run of them reads as a list, never as buttons. Cream cards mean "tap me".
struct FactRow: View {
    let title: String
    var detail: String? = nil
    var systemImage: String? = nil
    /// Quiet rows (tips, instructions) set the title in 15 book instead of 17 medium.
    var quiet: Bool = false

    var body: some View {
        HStack(alignment: detail == nil ? .center : .top, spacing: 16) {
            if let systemImage {
                Image(systemName: systemImage)
                    .font(.system(size: quiet ? 18 : 22, weight: .light))
                    .ink("--color-ink-soft")
                    .frame(width: 28, height: quiet ? 22 : 28)
            } else {
                CheckCircle(size: 20).frame(width: 28, height: 28)
            }
            VStack(alignment: .leading, spacing: 3) {
                Text(title)
                    .font(quiet ? brandFont(.secondary, .book, relativeTo: .subheadline) : brandFont(.body, .medium, relativeTo: .body))
                    .ink("--color-ink")
                    .fixedSize(horizontal: false, vertical: true)
                if let detail {
                    Text(detail).font(brandFont(.secondary, .book, relativeTo: .subheadline)).ink("--color-ink-soft")
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
}
