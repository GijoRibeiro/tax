import SwiftUI

// A scroll view whose big screen title collapses into a compact bar once it has
// scrolled past the top, so the screen keeps its name in view. Content is laid out
// under the title with the standard horizontal padding.
struct CollapsingHeaderScroll<Content: View>: View {
    @Environment(CaseStore.self) private var store
    let title: String
    var bottomInset: CGFloat = 16
    var topInset: CGFloat = ScreenTitle.rootTopInset
    @ViewBuilder var content: () -> Content
    @State private var collapsed = false

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ScreenTitle(text: title).padding(.top, topInset)
                content()
            }
            .padding(.horizontal, 24)
            .padding(.bottom, bottomInset)
        }
        .onScrollGeometryChange(for: Bool.self) { g in g.contentOffset.y > topInset + 40 } action: { _, now in
            withAnimation(.easeOut(duration: 0.2)) { collapsed = now }
        }
        .overlay(alignment: .top) {
            if collapsed {
                Text(title)
                    .font(brandFont(.body, .bold, relativeTo: .headline))
                    .lineLimit(1)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .padding(.horizontal, 56)
                    .background(store.tokens.color("--color-surface"))
                    .transition(.move(edge: .top).combined(with: .opacity))
            }
        }
    }
}
