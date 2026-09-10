import SwiftUI

// Flat card on the cream surface token: the Taxfix look is tinted fills with no
// borders or shadows, so GroupBox's default grey chrome is replaced everywhere.
// Mirrors GroupBox's `{ content } label: { … }` shape so call sites stay put.
struct FlatCard<Content: View, Label: View>: View {
    @Environment(CaseStore.self) private var store
    private let content: () -> Content
    private let label: () -> Label

    init(@ViewBuilder content: @escaping () -> Content, @ViewBuilder label: @escaping () -> Label) {
        self.content = content
        self.label = label
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            label()
            content()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(16)
        .background(store.tokens.color("--color-surface-sunken"),
                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
    }
}

extension FlatCard where Label == EmptyView {
    init(@ViewBuilder content: @escaping () -> Content) {
        self.init(content: content, label: { EmptyView() })
    }
}
