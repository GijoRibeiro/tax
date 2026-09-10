import SwiftUI

// Catalog screen title: 34 black in the brand face, top-left, the way every Taxfix
// screen opens ("My account", "Choose a tax year"). Screens use this instead of the
// system navigation title so the type is ABC ROM and there is no empty bar above it.
// One rule for where the title sits: 56pt below the status bar on every screen, which is
// where a title lands under the back-button row. Pushed screens get it for free; root screens (and full-screen covers)
// add `ScreenTitle.rootTopInset` themselves, or fill the row with an eyebrow line.
struct ScreenTitle: View {
    @Environment(CaseStore.self) private var store
    static let rootTopInset: CGFloat = 56
    let text: String
    var body: some View {
        Text(text)
            .font(brandFont(.title, .black, relativeTo: .largeTitle))
            .fixedSize(horizontal: false, vertical: true)
            .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// Round icon button on the pale green disc, dark green glyph: the app's "+" and any
// other single action that sits at the end of a row.
struct IconCircleButton: View {
    @Environment(CaseStore.self) private var store
    let systemImage: String
    let label: String
    /// Lime instead of pale green: the one action on the screen that wants a tap now.
    var prominent: Bool = false
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(iconFont("--icon-sm", weight: .medium))
                .frame(width: 44, height: 44)
                .background(store.tokens.color(prominent ? "--color-primary" : "--color-info-bg"), in: Circle())
                .ink(prominent ? "--color-primary-ink" : "--color-accent")
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}
