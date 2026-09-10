import SwiftUI

struct RootView: View {
    @Environment(CaseStore.self) private var store

    var body: some View {
        Group {
            if store.state.phase == .onboarding && !store.demoJumping {
                OnboardingFlow().transition(.opacity)
            } else {
                CaseRootView().transition(.rise)
            }
        }
        .animation(.brand, value: store.state.phase == .onboarding)
        // Paint the status-bar area in the page colour so scrolled content never shows
        // through behind the clock and the signal icons (the navigation bar is hidden).
        .overlay(alignment: .top) {
            // A zero-height view cannot grow into the safe area, so measure the inset
            // and draw a strip of exactly that height above the content's top edge.
            GeometryReader { geo in
                store.tokens.color("--color-surface")
                    .frame(width: geo.size.width, height: geo.safeAreaInsets.top)
                    .offset(y: -geo.safeAreaInsets.top)
            }
            .allowsHitTesting(false)
        }
        .overlay(alignment: .topTrailing) { DemoCorner() }
        // Remount on reset so onboarding restarts at Welcome regardless of where it was.
        .id(store.resetCount)
    }
}

// Presenter affordance, present on every screen and invisible: a 44pt tap target in
// the top-right corner opens the demo menu (jump to any stage, choose how many
// documents are in, or back to first access). Launching with DEMO_MENU=1 opens it at once.
private struct DemoCorner: View {
    @State private var showMenu = ProcessInfo.processInfo.environment["DEMO_MENU"] != nil

    var body: some View {
        Button { showMenu = true } label: {
            Color.clear
                .frame(width: 44, height: 44)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Demo menu")
        .padding(.top, 2)
        .padding(.trailing, 8)
        .fullScreenCover(isPresented: $showMenu) { DemoMenu() }
    }
}
