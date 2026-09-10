import SwiftUI
import UserNotifications

@main
struct TaxfixApp: App {
    @State private var store = CaseStore(connect: ProcessInfo.processInfo.environment["OFFLINE"] == nil) // OFFLINE=1: seed only, no relay (screenshot hook)
    @Environment(\.scenePhase) private var scenePhase

    init() {
        BrandFontRegistrar.registerBundledFonts()
        // Foreground presentation (banner+sound) is set on this delegate, see
        // NudgeNotifier.userNotificationCenter(_:willPresent:...). Wired here, once, at
        // launch, well before any nudge could fire.
        UNUserNotificationCenter.current().delegate = NudgeNotifier.shared
    }

    var body: some Scene {
        WindowGroup {
            // GALLERY=<name>: one catalog component on a plain canvas, for scripts/specimens.sh.
            if let specimen = ProcessInfo.processInfo.environment["GALLERY"] {
                ComponentGalleryView(name: specimen).environment(store)
            } else {
                RootView().environment(store)
            }
        }
            .onChange(of: scenePhase) { _, phase in
                switch phase {
                case .background:
                    // One calm reminder while required documents are still missing.
                    // cancelled the moment the person comes back.
                    let missing = store.state.requiredItems.filter { $0.status == .needed || $0.status == .issue }.count
                    NudgeNotifier.shared.scheduleBackgroundReminder(missingCount: missing)
                case .active:
                    NudgeNotifier.shared.cancelBackgroundReminder()
                default:
                    break
                }
            }
    }
}
