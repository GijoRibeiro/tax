import SwiftUI

// The case as a "what now?" timeline. A rail on the left with a marker per step, a solid green line behind what is done and a dotted one ahead.
// Past steps are compact, the current step is a card that carries its own action,
// future steps are quiet. The caller supplies the current card's content.
struct TimelineStep: Identifiable {
    let id: Int
    let title: String
    let detail: String
    /// Where a tap on this step goes, if anywhere ("Documents sent" opens the full list).
    var route: CaseRoute? = nil
    /// What a tap does instead, if anything (the home's current step advances the demo).
    var action: (() -> Void)? = nil
}

struct StepTimeline<Current: View>: View {
    @Environment(CaseStore.self) private var store
    let steps: [TimelineStep]
    let currentIndex: Int
    /// Compact: the current step is a bold row like the others, no card. The home uses
    /// this under its hero, where the "what now" already lives.
    var compact: Bool = false
    @ViewBuilder var current: () -> Current

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            ForEach(steps) { step in
                let i = step.id
                HStack(alignment: .top, spacing: 14) {
                    VStack(spacing: 0) {
                        marker(i)
                            .padding(.top, i == currentIndex && !compact ? 18 : 0)
                        if i < steps.count - 1 {
                            rail(done: i < currentIndex)
                                .frame(maxHeight: .infinity)
                        }
                    }
                    .frame(width: 28)
                    content(step)
                        .padding(.bottom, i < steps.count - 1 ? 22 : 0)
                }
                .fixedSize(horizontal: false, vertical: true)
            }
        }
        // The plan moves: markers and the rail animate when the current step advances.
        .animation(.brand, value: currentIndex)
    }

    @ViewBuilder private func content(_ step: TimelineStep) -> some View {
        if step.id == currentIndex && !compact {
            VStack(alignment: .leading, spacing: 12) {
                HStack(alignment: .firstTextBaseline) {
                    Text(step.title).font(brandFont(.heading, .bold, relativeTo: .title2))
                    Spacer(minLength: 12)
                    Text("\(currentIndex + 1) of \(steps.count)")
                        .font(brandFont(.caption, .medium, relativeTo: .caption))
                        .ink("--color-ink-soft")
                }
                Text(step.detail).font(brandFont(.secondary, .book, relativeTo: .subheadline)).ink("--color-ink-soft")
                current()
            }
            .padding(20)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(store.tokens.color("--color-surface-sunken"),
                        in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
        } else if let action = step.action {
            Button(action: action) { row(step) }.buttonStyle(.plain)
        } else if let route = step.route {
            NavigationLink(value: route) {
                HStack(alignment: .top, spacing: 8) {
                    row(step)
                    Image(systemName: "chevron.right")
                        .font(iconFont(TextRole.caption.rawValue, weight: .semibold))
                        .ink("--color-ink-soft")
                        .padding(.top, 8)
                }
            }
            .buttonStyle(.plain)
        } else {
            row(step)
        }
    }

    private func row(_ step: TimelineStep) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(step.title)
                .font(brandFont(.body, step.id == currentIndex ? .bold : .medium, relativeTo: .body))
                .ink(step.id <= currentIndex ? "--color-ink" : "--color-ink-soft")
                .contentTransition(.opacity)
            Text(step.detail)
                .font(brandFont(.small, .book, relativeTo: .caption))
                .ink("--color-ink-soft")
                .contentTransition(.opacity)
        }
        .padding(.top, 3)
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    // All three marker states are always in the tree, so a step can ease from hollow
    // to lilac to a green tick instead of swapping.
    private func marker(_ i: Int) -> some View {
        let done = i < currentIndex, current = i == currentIndex
        return ZStack {
            Circle()
                .strokeBorder(store.tokens.color("--color-line"), lineWidth: 2)
                .frame(width: 16, height: 16)
                .opacity(done || current ? 0 : 1)
            // The current step: one soft lilac disc, no ring. Calm, and clearly "you are here".
            Circle()
                .fill(store.tokens.color("--color-pastel-lilac"))
                .frame(width: 20, height: 20)
                .scaleEffect(current ? 1 : 0.5)
                .opacity(current ? 1 : 0)
            CheckCircle()
                .scaleEffect(done ? 1 : 0.5)
                .opacity(done ? 1 : 0)
        }
        .frame(width: 28, height: 28)
    }

    // Dotted underneath always; the green rail grows down over it as steps complete.
    private func rail(done: Bool) -> some View {
        ZStack(alignment: .top) {
            DottedLine().stroke(store.tokens.color("--color-line"), style: StrokeStyle(lineWidth: 2, lineCap: .round, dash: [2, 6]))
                .frame(width: 2)
            GeometryReader { geo in
                Rectangle().fill(store.tokens.color("--color-success"))
                    .frame(width: 2, height: done ? geo.size.height : 0)
            }
            .frame(width: 2)
        }
    }
}

private struct DottedLine: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.midX, y: rect.minY + 4))
        p.addLine(to: CGPoint(x: rect.midX, y: rect.maxY - 4))
        return p
    }
}
