import Foundation
import UserNotifications

/// Wires local notifications for consumer nudges (state-diff driven, see
/// NotificationNudges.swift) and the background "documents left" reminder.
/// Not actor-isolated on purpose. UNUserNotificationCenter is thread-safe
/// and this is called from CaseStore's @MainActor `handle(_:)` as well as
/// scenePhase changes at the App level.
final class NudgeNotifier: NSObject, UNUserNotificationCenterDelegate, @unchecked Sendable {
    static let shared = NudgeNotifier()

    private let center = UNUserNotificationCenter.current()
    private let backgroundReminderId = "background-reminder"

    private override init() { super.init() }

    /// Posts each nudge as an immediate local notification. Safe to call
    /// unconditionally, permission or not, without authorization the
    /// system simply won't display anything, so callers never need their
    /// own permission gate before posting.
    func post(_ nudges: [Nudge]) {
        for nudge in nudges {
            let content = UNMutableNotificationContent()
            content.title = nudge.title
            content.body = nudge.body
            content.sound = .default
            center.add(UNNotificationRequest(identifier: nudge.id, content: content, trigger: nil))
        }
    }

    /// Triggered only from the pre-permission explainer sheet's "Enable
    /// notifications" button, the system prompt itself, never called cold.
    func requestAuthorization() {
        center.requestAuthorization(options: [.alert, .sound, .badge]) { _, _ in }
    }

    /// One calm reminder, 30s out (demo-scale delay), only while required
    /// documents are still missing. Cancelled on return to foreground.
    func scheduleBackgroundReminder(missingCount: Int) {
        guard missingCount > 0 else { return }
        let content = UNMutableNotificationContent()
        content.title = "\(missingCount) document\(missingCount == 1 ? "" : "s") left"
        content.body = "Most people finish in 15 minutes. Anna's ready when you are."
        content.sound = .default
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 30, repeats: false)
        center.add(UNNotificationRequest(identifier: backgroundReminderId, content: content, trigger: trigger))
    }

    func cancelBackgroundReminder() {
        center.removePendingNotificationRequests(withIdentifiers: [backgroundReminderId])
    }

    /// Foreground presentation. THE demo beat: banners drop even while the
    /// app is open and in front of the person, so an advisor action taken
    /// in the browser is visible on the phone immediately.
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                             willPresent notification: UNNotification,
                                             withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([.banner, .sound])
    }
}
