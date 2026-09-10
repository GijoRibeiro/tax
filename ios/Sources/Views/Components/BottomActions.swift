import SwiftUI

// Actions pinned to the bottom of a scrolling screen. Content scrolls underneath
// and fades into a blur: no hard edge, no line. Use inside a ZStack(alignment: .bottom)
// over a ScrollView whose content has `BottomActions.scrollInset` of bottom padding.
struct BottomActions<Content: View>: View {
    @Environment(CaseStore.self) private var store
    @ViewBuilder var content: () -> Content

    static var scrollInset: CGFloat { 168 }

    var body: some View {
        content()
            .padding(.horizontal, 24)
            .padding(.bottom, 8) // above the home indicator: the Taxfix app sits its Continue here
            .padding(.top, 64)
            .frame(maxWidth: .infinity)
            .background {
                ZStack {
                    Rectangle().fill(.regularMaterial)
                    store.tokens.color("--color-surface").opacity(0.55)
                }
                .mask(
                    LinearGradient(
                        stops: [
                            .init(color: .clear, location: 0),
                            .init(color: .black.opacity(0.7), location: 0.35),
                            .init(color: .black, location: 0.6),
                            .init(color: .black, location: 1),
                        ],
                        startPoint: .top, endPoint: .bottom)
                )
                .ignoresSafeArea(edges: .bottom)
            }
    }
}
