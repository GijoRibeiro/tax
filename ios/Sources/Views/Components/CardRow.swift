import SwiftUI

// Catalog "option row": a cream card with a thin line icon, a plain-English title,
// an optional grey subtitle, and one trailing control. The Taxfix document list is
// made of these.
struct CardRow<Trailing: View>: View {
    @Environment(CaseStore.self) private var store
    let systemImage: String
    let title: String
    var subtitle: String? = nil
    /// A fixed height, to sit level with a neighbouring card (the home's FAQ row next to Anna's).
    var height: CGFloat? = nil
    @ViewBuilder var trailing: () -> Trailing

    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: systemImage)
                .font(iconFont("--icon-md", weight: .light))
                .frame(width: 28)
                .ink("--color-ink-soft")
            VStack(alignment: .leading, spacing: 3) {
                Text(title).font(brandFont(.body, .medium, relativeTo: .body))
                if let subtitle {
                    Text(subtitle).font(brandFont(.small, .book, relativeTo: .caption)).ink("--color-ink-soft")
                }
            }
            Spacer(minLength: 12)
            trailing()
        }
        .padding(.vertical, height == nil ? 18 : 0)
        .padding(.horizontal, 20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .frame(height: height)
        .background(store.tokens.color("--color-surface-sunken"),
                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
    }
}

// The round "+" the app uses to add a document: pale green disc, dark green plus.
struct AddCircle: View {
    @Environment(CaseStore.self) private var store
    var body: some View {
        Image(systemName: "plus")
            .font(iconFont("--icon-sm", weight: .medium))
            .frame(width: 44, height: 44)
            .background(store.tokens.color("--color-info-bg"), in: Circle())
            .ink("--color-accent")
    }
}

// Section label above a run of card rows: small caps, soft ink.
struct SectionLabel: View {
    let text: String
    var body: some View {
        Text(text.uppercased())
            .font(brandFont(.caption, .medium, relativeTo: .caption))
            .kerning(0.8)
            .ink("--color-ink-soft")
            .padding(.top, 8)
    }
}

// Catalog check circle: 28pt, success fill, white check. Marks a done or true item.
struct CheckCircle: View {
    @Environment(CaseStore.self) private var store
    var size: CGFloat = 28
    var body: some View {
        Image(systemName: "checkmark")
            .font(.system(size: size * 0.46, weight: .bold))
            .frame(width: size, height: size)
            .background(store.tokens.color("--color-success"), in: Circle())
            .ink("--color-surface")
    }
}
