import SwiftUI

/// Pre-permission explainer, full screen, shown once right after committing and
/// before the system prompt, so the request comes with reasons instead of a cold OS
/// dialog. Copy only, the way Taxfix's own permission screen does it. The choice
/// is stored on CaseStore (`offeredNotificationPermission`) and never re-asked.
struct NotificationPermissionSheet: View {
    @Environment(CaseStore.self) private var store
    @Environment(\.dismiss) private var dismiss

    // Taxfix's own notification illustration (ios/Resources/notifications-hero.png),
    // loaded by URL like the other bundled images.
    private static let hero: UIImage? = {
        guard let url = Bundle.main.url(forResource: "notifications-hero", withExtension: "png") else { return nil }
        return UIImage(contentsOfFile: url.path)
    }()

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Laid out like Taxfix's own permission screen: calm space above, the
            // question and two short paragraphs low on the page, then the buttons.
            // Copy only, no list; Taxfix's own illustration sits in the top half.
            Spacer(minLength: 16)
            if let hero = Self.hero {
                Image(uiImage: hero)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: 360)
            }
            Spacer(minLength: 16)
            ScreenTitle(text: "Want to know when Anna needs you?")
                .padding(.bottom, 4)
            Text("Turn on notifications and you'll hear the moment a document is checked, needs a better photo, or Anna has a question for you.")
                .font(brandFont(.body, .book, relativeTo: .body))
                .ink("--color-ink-soft")
                .fixedSize(horizontal: false, vertical: true)
            Text("Nothing else. No reminders you didn't ask for.")
                .font(brandFont(.body, .book, relativeTo: .body))
                .ink("--color-ink-soft")
                .fixedSize(horizontal: false, vertical: true)
            Spacer().frame(height: 28)
            VStack(spacing: 14) {
                PrimaryButton(title: "Enable notifications") {
                    NudgeNotifier.shared.requestAuthorization()
                    finish()
                }
                Button("Not now") { finish() }
                    .font(brandFont(.body, .bold, relativeTo: .body))
                    .ink("--color-accent")
                    .frame(maxWidth: .infinity)
            }
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 12)
        .background(store.tokens.color("--color-surface").ignoresSafeArea())
        .onDisappear { store.offeredNotificationPermission = true }
    }

    private func finish() {
        store.offeredNotificationPermission = true
        dismiss()
    }
}
