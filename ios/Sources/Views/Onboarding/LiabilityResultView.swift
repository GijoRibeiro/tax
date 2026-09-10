import SwiftUI

// "Yes, you need to file this year." Certain, not hedged: the facts of Betina's
// year are already known (a prefilled profile in the real product), and each one is
// a reason filing is mandatory. An advisor is matched for her before she has done anything;
// the match becomes hers when she starts, not before.
struct LiabilityResultView: View {
    @Environment(CaseStore.self) private var store
    let next: () -> Void
    @State private var showFAQ = false

    private let reasons: [(symbol: String, title: String, detail: String)] = [
        ("building.columns", "Unemployment benefit for 5 months", "Arbeitslosengeld I, above the €410 line that makes filing mandatory"),
        ("briefcase", "Back in employment since March", "Two income situations in one year"),
        ("person", "Single, one employer", "A standard case, nothing extra to file"),
    ]

    var body: some View {
        ZStack(alignment: .bottom) {
            CollapsingHeaderScroll(title: "Yes, you need to file this year.", bottomInset: BottomActions<EmptyView>.scrollInset) {
                    Text("Based on your answers. Here is why filing is mandatory this year, and who would take your case:")
                        .font(brandFont(.body, .book, relativeTo: .body))
                        .ink("--color-ink-soft")
                        .padding(.bottom, 8)

                    ForEach(reasons, id: \.title) { r in
                        CardRow(systemImage: r.symbol, title: r.title, subtitle: r.detail) { EmptyView() }
                    }

                    // The match, and why it is a good one for her. The reasons are plain
                    // rows under the card, not a chip: that is what she would ask.
                    SectionLabel(text: "Ready to take your case")
                    HStack(spacing: 14) {
                        AdvisorPortrait(size: 48)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(Advisor.name).font(brandFont(.body, .medium, relativeTo: .headline))
                            Text("Certified tax advisor · Leipzig").font(brandFont(.small, .book, relativeTo: .caption)).ink("--color-ink-soft")
                        }
                        Spacer(minLength: 12)
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(store.tokens.color("--color-surface-sunken"),
                                in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
                    VStack(alignment: .leading, spacing: 12) {
                        FactRow(title: "Handles cases like yours every week: unemployment benefits and a new job in the same year.", systemImage: "briefcase", quiet: true)
                        FactRow(title: "Works in English and explains the German bits in plain words.", systemImage: "globe", quiet: true)
                        FactRow(title: "Has capacity now, so your return does not wait in a queue.", systemImage: "clock", quiet: true)
                    }
                    .padding(.top, 4)

                    SectionLabel(text: "Deadline")
                    CardRow(systemImage: "calendar", title: "31 July", subtitle: "Plenty of time with an expert. Your part takes about 15 minutes.") {
                        Chip(label: "On track", tone: .green)
                    }

            }

            BottomActions {
                VStack(spacing: 12) {
                    PrimaryButton(title: "See the price", action: next)
                    Button("More questions? We wrote them down.") { showFAQ = true }
                        .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                        .ink("--color-ink-soft")
                        .frame(maxWidth: .infinity)
                }
            }
        }
        .sheet(isPresented: $showFAQ) { FAQSheet() }
    }
}
