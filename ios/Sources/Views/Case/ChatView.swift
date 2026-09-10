import SwiftUI

// The conversation with Anna. One thread: her follow-up questions, Betina's questions,
// and every reply, as bubbles. Replying to Anna's latest open question and asking a new
// one share the same composer; a small banner says which you are doing.
struct ChatView: View {
    @Environment(CaseStore.self) private var store
    @State private var draft = ""
    @State private var replyingTo: FollowUp? = nil

    private var thread: [FollowUp] {
        store.state.followUps.sorted { $0.createdAt < $1.createdAt }
    }
    private var openAdvisorQuestion: FollowUp? {
        thread.last { $0.from == .advisor && $0.status == .open }
    }

    var body: some View {
        VStack(spacing: 0) {
            header
            ScrollViewReader { proxy in
                ScrollView {
                    VStack(alignment: .leading, spacing: 12) {
                        ChatBubble(from: .advisor, text: "Hi Betina, I'm Anna. Ask about a document, or answer my question here. I read everything myself.")
                        ForEach(thread) { fu in
                            if let item = store.state.items.first(where: { $0.id == fu.itemId }) {
                                Chip(label: "About: \(item.title)", tone: .neutral)
                                    .frame(maxWidth: .infinity, alignment: fu.from == .advisor ? .leading : .trailing)
                            }
                            ChatBubble(from: fu.from, text: fu.message)
                            if let reply = fu.reply {
                                ChatBubble(from: fu.from == .advisor ? .consumer : .advisor, text: reply)
                            } else if fu.from == .advisor {
                                Button { replyingTo = fu } label: {
                                    Chip(label: "Reply", tone: .green)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                        Color.clear.frame(height: 1).id("end")
                    }
                    .padding(.horizontal, 24)
                    .padding(.vertical, 16)
                }
                .onChange(of: thread.count) { _, _ in withAnimation { proxy.scrollTo("end") } }
            }
            composer
        }
        .background(store.tokens.color("--color-surface"))
        .onAppear { replyingTo = openAdvisorQuestion }
    }

    private var header: some View {
        HStack(spacing: 14) {
            AdvisorPortrait(size: 44)
            VStack(alignment: .leading, spacing: 1) {
                Text(Advisor.name).font(brandFont(.body, .medium, relativeTo: .headline))
                Text(Advisor.title).font(brandFont(.caption, .book, relativeTo: .caption)).ink("--color-ink-soft")
            }
            Spacer()
        }
        .padding(.horizontal, 24)
        .padding(.top, 28) // clear of the sheet's grabber
        .padding(.bottom, 12)
    }

    private var composer: some View {
        VStack(spacing: 8) {
            if let target = replyingTo, target.status == .open {
                HStack(spacing: 8) {
                    Text("Replying to Anna's question")
                        .font(brandFont(.caption, .medium, relativeTo: .caption))
                        .ink("--color-ink-soft")
                    Spacer()
                    Button { replyingTo = nil } label: { Image(systemName: "xmark").font(iconFont(TextRole.micro.rawValue, weight: .semibold)) }
                        .buttonStyle(.plain)
                        .ink("--color-ink-soft")
                        .accessibilityLabel("Ask something new instead")
                }
                .padding(.horizontal, 24)
            }
            HStack(spacing: 10) {
                TextField(replyingTo == nil ? "Ask Anna…" : "Reply to Anna…", text: $draft, axis: .vertical)
                    .lineLimit(1...4)
                    .font(brandFont(.body, .book, relativeTo: .body))
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(store.tokens.color("--color-surface-sunken"),
                                in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
                Button(action: send) {
                    Image(systemName: "arrow.up")
                        .font(iconFont("--icon-sm", weight: .semibold))
                        .frame(width: 44, height: 44)
                        .background(store.tokens.color("--color-primary"), in: Circle())
                        .ink("--color-primary-ink")
                }
                .buttonStyle(.plain)
                .disabled(draft.trimmingCharacters(in: .whitespaces).isEmpty)
                .opacity(draft.trimmingCharacters(in: .whitespaces).isEmpty ? 0.4 : 1)
                .accessibilityLabel("Send")
            }
            .padding(.horizontal, 24)
            .padding(.bottom, 20)
        }
        .padding(.top, 8)
    }

    private func send() {
        let text = draft.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        if let target = replyingTo, target.status == .open {
            store.send(.answerFollowUp(followUpId: target.id, reply: text))
            replyingTo = nil
        } else {
            store.send(.askAdvisor(itemId: "general", question: text))
        }
        draft = ""
    }
}

// One message. Anna on the left on cream, Betina on the right on the pale green.
struct ChatBubble: View {
    @Environment(CaseStore.self) private var store
    let from: Sender
    let text: String

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if from == .advisor { AdvisorPortrait(size: 24) } else { Spacer(minLength: 48) }
            Text(text)
                .font(brandFont(.body, .book, relativeTo: .body))
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(from == .advisor ? store.tokens.color("--color-surface-sunken") : store.tokens.color("--color-info-bg"),
                            in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
            if from == .consumer { EmptyView() } else { Spacer(minLength: 48) }
        }
        .frame(maxWidth: .infinity, alignment: from == .advisor ? .leading : .trailing)
    }
}

// The chat as a sheet, reachable from Anna's badge on any screen.
struct ChatSheet: View {
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        ChatView()
            .overlay(alignment: .topTrailing) {
                Button { dismiss() } label: {
                    Image(systemName: "xmark").font(iconFont(TextRole.small.rawValue, weight: .semibold)).frame(width: 36, height: 36)
                }
                .buttonStyle(.plain)
                .ink("--color-ink-soft")
                .padding(.top, 22)
                .padding(.trailing, 16)
                .accessibilityLabel("Close")
            }
            .presentationDetents([.large])
            .presentationDragIndicator(.visible)
    }
}
