import SwiftUI

// "What Anna needs": the checklist as the Taxfix document list, card rows under
// small section labels on a white page. Tap a row for the item, its explainer and
// the upload.
struct ChecklistView: View {
    @Environment(CaseStore.self) private var store
    /// One chapter only, opened from a tile on the home. Nil shows the whole list.
    var group: ItemGroup? = nil

    private let groups: [(ItemGroup, String)] = [
        (.identity, "Identity & basics"),
        (.employment, "Employment income"),
        (.benefits, "Unemployment benefits"),
        (.deductions, "Optional, can raise your refund"),
    ]

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 12) {
                ScreenTitle(text: group.map { Chapter.named($0).title } ?? "What Anna needs")
                Text(group.map { Chapter.named($0).line } ?? "A few documents, in plain English. Anna sees the same list.")
                    .font(brandFont(.body, .book, relativeTo: .body))
                    .ink("--color-ink-soft")
                    .padding(.bottom, 8)

                ForEach(groups.filter { group == nil || $0.0 == group }, id: \.0) { g, title in
                    let items = store.state.items.filter { $0.group == g }
                    if !items.isEmpty {
                        if group == nil { SectionLabel(text: title) }
                        ForEach(items) { item in
                            NavigationLink(value: CaseRoute.item(item.id)) {
                                CardRow(systemImage: item.symbol, title: item.title, subtitle: item.germanName) {
                                    if item.status == .needed {
                                        AddCircle()
                                    } else {
                                        StatusPillView(status: item.status)
                                    }
                                }
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 32)
        }
        .background(store.tokens.color("--color-surface"))
        .navigationBarTitleDisplayMode(.inline)
    }
}
