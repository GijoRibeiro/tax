import SwiftUI

// Which home layout the presenter has chosen. Kept per install, switched from the
// demo menu; HOME_LAYOUT at launch overrides it for screenshots.
enum HomeLayout: String, CaseIterable {
    case grid, carousel, timeline
    static let storageKey = "homeLayout"
    var title: String {
        switch self {
        case .grid: "Four chapters (grid)"
        case .carousel: "Horizontal steps (default)"
        case .timeline: "Just the timeline"
        }
    }
    var line: String {
        switch self {
        case .grid: "The 2 by 2 grid of chapter tiles."
        case .carousel: "One wide card per chapter, paged. Advances when a chapter fills."
        case .timeline: "The sentence, one button, the five steps."
        }
    }
    var symbol: String {
        switch self {
        case .grid: "square.grid.2x2"
        case .carousel: "rectangle.split.3x1"
        case .timeline: "list.bullet.below.rectangle"
        }
    }
}

// The chapters as a horizontal, paged row: one wide card per chapter with the next one
// peeking in from the right, a step rail underneath. When a chapter fills, the row
// glides to the next open one on its own.
struct ChapterCarousel: View {
    @Environment(CaseStore.self) private var store
    @State private var current: ItemGroup?

    private func items(_ chapter: Chapter) -> [ChecklistItem] { store.state.items.filter { $0.group == chapter.group } }

    private func done(_ chapter: Chapter) -> Bool {
        let required = items(chapter).filter { !$0.optional }
        return !required.isEmpty && required.allSatisfy { $0.status == .uploaded || $0.status == .verified }
    }

    private var firstOpen: ItemGroup { Chapter.all.first { !done($0) }?.group ?? Chapter.all.last!.group }
    private var doneMask: [Bool] { Chapter.all.map(done) }

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            ScrollView(.horizontal, showsIndicators: false) {
                LazyHStack(spacing: 12) {
                    ForEach(Array(Chapter.all.enumerated()), id: \.element.id) { i, chapter in
                        Button { Chapter.open(chapter.group, in: store) } label: {
                            ChapterCard(chapter: chapter, items: items(chapter), step: i + 1, total: Chapter.all.count, done: done(chapter))
                        }
                        .buttonStyle(.plain)
                        .containerRelativeFrame(.horizontal) { length, _ in length * 0.84 }
                        .id(chapter.group)
                    }
                }
                .scrollTargetLayout()
            }
            .contentMargins(.horizontal, 20, for: .scrollContent)
            .scrollTargetBehavior(.viewAligned)
            .scrollPosition(id: $current)
            .frame(height: 210) // a horizontal ScrollView otherwise takes all spare height
            .padding(.horizontal, -20)

            StepRail(count: Chapter.all.count,
                     current: Chapter.all.firstIndex { $0.group == current } ?? 0,
                     done: doneMask)
                .padding(.horizontal, 4)
        }
        .onAppear { if current == nil { current = firstOpen } }
        .onChange(of: doneMask) { _, _ in
            // Let the card turn lime first, then glide to the next open chapter.
            let target = firstOpen
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                withAnimation(.brand) { current = target }
            }
        }
    }
}

// One chapter as a wide card: icon and chip on top, the name and its one line below.
struct ChapterCard: View {
    @Environment(CaseStore.self) private var store
    let chapter: Chapter
    let items: [ChecklistItem]
    let step: Int
    let total: Int
    let done: Bool

    private var chip: some View {
        let required = items.filter { !$0.optional }
        let toAdd = required.filter { $0.status == .needed }.count
        let shared = items.filter { $0.status == .uploaded || $0.status == .verified }
        if items.contains(where: { $0.status == .issue }) { return Chip(label: "Fix", tone: .issue) }
        if toAdd > 0 { return Chip(label: toAdd == 1 ? "1 remaining" : "\(toAdd) remaining", tone: .green) }
        if required.isEmpty && shared.isEmpty { return Chip(label: "Optional", tone: .neutral) }
        if !required.isEmpty && required.allSatisfy({ $0.status == .verified }) { return Chip(label: "✓ Checked", tone: .onLime) }
        return Chip(label: "Sent", tone: .onLime)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(alignment: .top) {
                Image(systemName: chapter.symbol)
                    .font(iconFont("--icon-lg", weight: .light))
                    .ink(done ? "--color-accent" : "--color-ink-soft")
                Spacer(minLength: 6)
                chip
            }
            Spacer(minLength: 12)
            Text("Step \(step) of \(total)")
                .font(brandFont(.caption, .medium, relativeTo: .caption))
                .ink("--color-ink-soft")
            Text(chapter.title)
                .font(brandFont(.heading, .bold, relativeTo: .title2))
                .ink("--color-ink")
                .fixedSize(horizontal: false, vertical: true)
            Text(chapter.line)
                .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                .ink("--color-ink-soft")
                .fixedSize(horizontal: false, vertical: true)
        }
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .topLeading)
        .frame(height: 210, alignment: .topLeading)
        .background(store.tokens.color(done ? "--color-lime-soft" : "--color-surface-sunken"),
                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
        .animation(.brand, value: done)
    }
}

// A rail of short capsules, one per step: lime-soft when done, dark green and longer
// for the one in view, hairline grey ahead.
struct StepRail: View {
    @Environment(CaseStore.self) private var store
    let count: Int
    let current: Int
    let done: [Bool]

    var body: some View {
        HStack(spacing: 6) {
            ForEach(0..<count, id: \.self) { i in
                Capsule()
                    .fill(store.tokens.color(i == current ? "--color-accent" : (done.indices.contains(i) && done[i] ? "--color-lime-soft" : "--color-line")))
                    .frame(width: i == current ? 28 : 12, height: 6)
                    .animation(.smooth(duration: 0.4), value: current)
            }
        }
    }
}
