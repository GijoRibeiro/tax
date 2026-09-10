import SwiftUI

// Anna, as a row: photo, name, title, and one action, message her. When she has an
// unanswered question, the question replaces her title and the button turns lime.
// Opens the chat as a sheet so it works on every screen, inside or outside the case's
// navigation stack.
struct AdvisorBadge: View {
    var note: String? = nil
    @State private var showChat = false

    var body: some View {
        HStack(spacing: 12) {
            AdvisorPortrait(size: 48)
            VStack(alignment: .leading, spacing: 2) {
                Text(Advisor.name).font(brandFont(.body, .medium, relativeTo: .headline))
                if let note {
                    Text(note)
                        .font(brandFont(.small, .book, relativeTo: .caption))
                        .ink("--color-ink")
                        .lineLimit(2)
                        .fixedSize(horizontal: false, vertical: true)
                } else {
                    Text(Advisor.title).font(brandFont(.small, .book, relativeTo: .caption)).ink("--color-ink-soft")
                }
            }
            Spacer(minLength: 12)
            IconCircleButton(systemImage: "bubble.left", label: note == nil ? "Message Anna" : "Reply to Anna", prominent: note != nil) { showChat = true }
        }
        .sheet(isPresented: $showChat) { ChatSheet() }
    }
}
