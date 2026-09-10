import SwiftUI
import Foundation

// Value-based routes for the sharing-phase NavigationStack, used both by real taps
// (`NavigationLink(value:)` in CaseHomeView/ChecklistView) and by the CASE_SCREEN
// screenshot/demo hook below.
enum CaseRoute: Hashable {
    case checklist
    case chapter(ItemGroup)
    case item(String)
    case itemEscape(String)
    case itemScan(String)
    case faq
}

struct CaseRootView: View {
    @Environment(CaseStore.self) private var store
    @State private var path = NavigationPath()
    @State private var showChatHook = false // CASE_SCREEN=chat opens the chat sheet
    @State private var showNotificationPrompt = false

    var body: some View {
        Group {
            // Every phase after onboarding lives on the same timeline screen.
            if store.state.phase == .onboarding {
                EmptyView() // RootView never routes here in onboarding
            } else {
                NavigationStack(path: $path) { CaseHomeView() }
            }
        }
        .fullScreenCover(isPresented: $showNotificationPrompt) { NotificationPermissionSheet() }
        .sheet(isPresented: $showChatHook) { ChatSheet() }
        .onChange(of: store.popToRootCount) { _, _ in path = NavigationPath() }
        .onChange(of: store.pushCount) { _, _ in for r in store.pushRoutes { path.append(r) } }
        .onChange(of: store.replaceTopCount) { _, _ in
            guard let route = store.replaceTopRoute else { return }
            if !path.isEmpty { path.removeLast() }
            path.append(route)
        }
        .onAppear(perform: applyScreenshotHook)
        // No intro sheet any more: Anna was introduced on Welcome and the result screen.
        // The case home is the first thing after committing; the notification explainer
        // follows once.
        .onChange(of: store.state.phase, initial: true) { _, phase in
            if phase == .sharing { store.metAnna = true; offerNotificationPromptIfNeeded(true) }
        }
    }

    // Right after Meet-Anna is dismissed for the first time, offer the pre-permission
    // explainer sheet exactly once (per CaseStore.offeredNotificationPermission). Skipped
    // during screenshot/demo-hook launches (CASE_SCREEN set) so it never covers the
    // screen a hook was asked to jump to.
    private func offerNotificationPromptIfNeeded(_ metAnna: Bool) {
        guard metAnna, store.state.phase == .sharing, !store.offeredNotificationPermission,
              ProcessInfo.processInfo.environment["CASE_SCREEN"] == nil else { return }
        showNotificationPrompt = true
    }

    // Demo/screenshot affordance ONLY, the sharing phase's sub-screens (checklist, item
    // detail, escape hatch, scanner, guidance, follow-ups, FAQ) are navigation state, not
    // case state, so they can't be reached remotely via relay actions. Setting CASE_SCREEN
    // at launch (`xcrun simctl launch` with SIMCTL_CHILD_CASE_SCREEN=…) auto-navigates there:
    //   checklist | chapter:<identity|employment|benefits|deductions> | item:<itemId> |
    //   item-escape:<itemId> | item-scan:<itemId> | chat | faq
    // An unset or unrecognized value leaves normal behavior untouched.
    private func applyScreenshotHook() {
        guard store.state.phase == .sharing,
              let raw = ProcessInfo.processInfo.environment["CASE_SCREEN"] else { return }
        let parts = raw.split(separator: ":", maxSplits: 1).map(String.init)
        switch parts.first {
        case "checklist": path.append(CaseRoute.checklist)
        case "chapter" where parts.count == 2:
            if let group = ItemGroup(rawValue: parts[1]) { path.append(CaseRoute.chapter(group)) }
        case "chat": showChatHook = true
        case "faq": path.append(CaseRoute.faq)
        case "item" where parts.count == 2: path.append(CaseRoute.item(parts[1]))
        case "item-escape" where parts.count == 2: path.append(CaseRoute.itemEscape(parts[1]))
        case "item-scan" where parts.count == 2: path.append(CaseRoute.itemScan(parts[1]))
        default: break
        }
    }
}
