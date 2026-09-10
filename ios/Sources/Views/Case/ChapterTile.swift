import SwiftUI

// One chapter of the hand-off as a tile: a thin line icon top-left, one chip top-right
// that says what is left in it, the chapter's name at the bottom. Cream while open, soft lime once
// everything required in it is sent. Tap to open that chapter's list.
struct ChapterTile: View {
    @Environment(CaseStore.self) private var store
    let symbol: String
    let title: String
    let items: [ChecklistItem]

    private var chip: some View {
        let required = items.filter { !$0.optional }
        let toAdd = required.filter { $0.status == .needed }.count
        let shared = items.filter { $0.status == .uploaded || $0.status == .verified }
        if items.contains(where: { $0.status == .issue }) {
            return Chip(label: "Fix", tone: .issue)
        }
        if toAdd > 0 {
            return Chip(label: toAdd == 1 ? "1 remaining" : "\(toAdd) remaining", tone: .green)
        }
        if required.isEmpty && shared.isEmpty {
            return Chip(label: "Optional", tone: .neutral)
        }
        if !required.isEmpty && required.allSatisfy({ $0.status == .verified }) {
            return Chip(label: "✓ Checked", tone: .onLime)
        }
        return Chip(label: "Sent", tone: .onLime)
    }

    private var done: Bool {
        let required = items.filter { !$0.optional }
        return !required.isEmpty && required.allSatisfy { $0.status == .uploaded || $0.status == .verified }
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                Image(systemName: symbol)
                    .font(iconFont("--icon-md", weight: .light))
                    .ink(done ? "--color-accent" : "--color-ink-soft")
                Spacer(minLength: 6)
                chip
            }
            Spacer(minLength: 4)
            Text(title)
                .font(brandFont(.body, .medium, relativeTo: .body))
                .ink("--color-ink")
                .lineLimit(3)
                .multilineTextAlignment(.leading)
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(18)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .frame(height: 148, alignment: .topLeading)
        // Filled chapters turn soft lime, the same green as the result block: done reads
        // at a glance, and the chip goes white so it still stands out.
        .background(store.tokens.color(done ? "--color-lime-soft" : "--color-surface-sunken"),
                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
        .animation(.brand, value: done)
    }
}

// The four chapters of the hand-off, in the order Betina meets them.
struct Chapter: Identifiable {
    let group: ItemGroup
    let title: String
    let line: String
    let symbol: String
    /// The ask, as the home's headline says it when this is the next chapter to fill.
    let prompt: String
    var id: ItemGroup { group }

    static let all: [Chapter] = [
        Chapter(group: .identity, title: "About you", line: "Who you are and where the refund goes.", symbol: "person", prompt: "Tell us a little about you."),
        Chapter(group: .employment, title: "Your job", line: "What your employer reported for the year.", symbol: "briefcase", prompt: "Now Anna needs a few things about your income."),
        Chapter(group: .benefits, title: "Unemployment benefits", line: "The months you received ALG I.", symbol: "building.columns", prompt: "Last bit: the months you were on benefits."),
        Chapter(group: .deductions, title: "Extras that raise your refund", line: "Optional. Receipts Anna can use.", symbol: "receipt", prompt: "Anything extra that could raise your refund?"),
    ]

    static func named(_ group: ItemGroup) -> Chapter { all.first { $0.group == group }! }

    /// Opening a chapter lands on its first open document (the obvious next tap), with
    /// the chapter list underneath for Back. A finished chapter opens the list itself.
    static func open(_ group: ItemGroup, in store: CaseStore) {
        let items = store.state.items.filter { $0.group == group }
        if let first = items.first(where: { $0.status == .needed || $0.status == .issue }) {
            store.push([.chapter(group), .item(first.id)])
        } else {
            store.push([.chapter(group)])
        }
    }
}
