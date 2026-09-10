import SwiftUI

struct HowItWorksView: View {
    @Environment(CaseStore.self) private var store
    let next: () -> Void

    private let steps: [(icon: String, title: String, detail: String)] = [
        ("tray.and.arrow.up", "You share a short checklist", "Photos of a few documents, about 15 minutes."),
        ("person.text.rectangle", "Anna prepares and files", "A certified tax advisor does the tax work."),
        ("checkmark.circle", "You review and approve", "Nothing is filed until you've seen it."),
    ]

    var body: some View {
        VStack(alignment: .leading, spacing: 24) {
            ScreenTitle(text: "How it works").padding(.top, ScreenTitle.rootTopInset)
            ForEach(steps, id: \.title) { step in
                HStack(alignment: .top, spacing: 16) {
                    Image(systemName: step.icon)
                        .font(brandFont(.subheading, .medium, relativeTo: .title3))
                        .foregroundStyle(store.tokens.color("--color-success"))
                        .frame(width: 32)
                    VStack(alignment: .leading, spacing: 4) {
                        Text(step.title).font(brandFont(.body, .medium, relativeTo: .headline))
                        Text(step.detail).font(brandFont(.secondary, .book, relativeTo: .subheadline)).ink("--color-ink-soft")
                    }
                }
            }
            Divider()
            AdvisorBadge()
            Spacer()
            PrimaryButton(title: "What does it cost?", action: next)
        }
        .padding([.horizontal, .top], 24)
        .padding(.bottom, 8)
    }
}
