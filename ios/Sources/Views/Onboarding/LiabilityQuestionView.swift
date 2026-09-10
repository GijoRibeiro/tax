import SwiftUI

struct LiabilityQuestionView: View {
    @Environment(CaseStore.self) private var store
    let question: LiabilityQuestion
    let next: () -> Void
    @State private var selected: String?

    var body: some View {
        VStack {
            Spacer(minLength: 24)
            VStack(alignment: .leading, spacing: 16) {
                Text(question.title).font(brandFont(.display, .bold, relativeTo: .title))
                Text(question.subtitle).font(brandFont(.secondary, .book, relativeTo: .subheadline)).ink("--color-ink-soft")
                ForEach(question.options, id: \.self) { option in
                    Button {
                        selected = option
                        Task { try? await Task.sleep(for: .milliseconds(250)); next() }
                    } label: {
                        HStack {
                            Text(option).font(brandFont(.body, .book, relativeTo: .body))
                            Spacer()
                            Image(systemName: selected == option ? "checkmark.circle.fill" : "circle")
                                .foregroundStyle(store.tokens.color("--color-success"))
                        }
                        .padding(16)
                        .background(store.tokens.color("--color-surface-sunken"),
                                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
                    }
                    .buttonStyle(.plain)
                }
            }
            Spacer(minLength: 24)
        }
        .padding([.horizontal, .top], 24)
        .padding(.bottom, 8)
    }
}
